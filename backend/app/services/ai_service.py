"""
AI 智慧策展服務模組

負責串接 Google Gemini API / OpenRouter API，提供：
1. 智慧策展主題生成 (generate_themes)
2. 企劃書草案擴寫 (expand_proposal)
3. 取得語意向量 (get_embedding)，供館藏語意比對使用

透過精心設計的 Prompt 模板控制輸出格式，確保回傳穩定的 JSON / HTML 結構。
"""

import json
import logging
import re
import time
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt 模板：策展主題大綱生成（對應 API 1: generate_themes）
# ---------------------------------------------------------------------------
THEME_GENERATION_PROMPT = """\
你是一位專業的圖書館智慧策展專家，請根據使用者提供的輸入條件，生成 3 個符合大眾閱讀興趣、創新且具吸引力的「策展主題」。

【輸入條件】
- 策展類型：{curation_type_label}
- 關鍵字清單：{keywords}
- 自訂提示詞說明：{prompt}
- 特定年份：{year}

【輸出限制】
1. 請以穩定的 JSON 陣列格式回傳，不要包含 any markdown 標記 (如 ```json) 或額外文字。
2. JSON 中每一項須包含下列欄位：
   - "title": 策展主題名稱 (20字以內，吸睛、有文青或創意的標題)
   - "outline": 策展規劃大綱 (150字以內，簡述展區區分與策展核心思想)
   - "target_audience": 預估受眾 (如：親子讀者、青少年、樂齡族等)

【JSON 結構範例】
[
  {{
    "title": "主題名稱",
    "outline": "大綱描述...",
    "target_audience": "受眾群"
  }}
]
"""

# ---------------------------------------------------------------------------
# Prompt 模板：企劃書擴寫（對應 API 2: export_to_proposal）
# ---------------------------------------------------------------------------
PROPOSAL_EXPANSION_PROMPT = """\
你是一位資深的圖書館館藏推廣企劃師，請將以下策展主題與大綱，擴寫為一份正式且內容豐富的「策展企劃書草案」。

【策展主題】
{title}

【策展大綱】
{outline}

【預估受眾】
{target_audience}

【擴寫章節要求】
請產生 HTML 格式之內容，直接用於富文本編輯器。包含以下 HTML 結構與段落：
1. <h1> 策展宗旨與目標 </h1> (包含策展核心宗旨)
2. <h1> 展區規劃與空間佈置 </h1> (至少規劃 3 個特色展區，說明其佈置風格與主題)
3. <h1> 宣傳與推廣時程 </h1> (規劃前、中、後的行銷宣傳管道與活動時間軸)
4. <h1> 預算與資源評估 </h1> (編列書籍採購、美化佈置、宣傳文宣之概估預算表)

請僅回傳 HTML 程式碼，不需附帶 ```html 等 markdown 外框或說明文字。
"""

# ---------------------------------------------------------------------------
# 策展類型代碼 → 中文標籤對照表
# ---------------------------------------------------------------------------
CURATION_TYPE_LABELS = {
    "trend": "近期時事話題",
    "festival": "節慶活動主題",
    "history": "過往歷史事件回顧",
    "custom": "自訂主題",
}

# ---------------------------------------------------------------------------
# 常數設定
# ---------------------------------------------------------------------------
DEFAULT_MODEL = "gemini-2.0-flash"
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 1.0
THEME_COUNT = 3


class AIServiceError(Exception):
    """AI 服務統一例外類別"""
    pass


class AIService:
    """
    AI 智慧策展服務

    支援 Gemini API 與 OpenRouter API 雙通道，
    內建 API Key 驗證、錯誤重試、JSON 解析與格式清洗。
    """

    def __init__(self, model_name: str = DEFAULT_MODEL):
        self.model_name = model_name
        self._client = None
        self._use_openrouter = False
        self._openrouter_key = ""

    # ------------------------------------------------------------------
    # 初始化提供商（延遲載入）
    # ------------------------------------------------------------------
    def _init_provider(self):
        """初始化 AI 提供商（Gemini 優先，OpenRouter 次之）"""
        if self._client is not None or self._use_openrouter:
            return

        gemini_key = settings.GEMINI_API_KEY
        openrouter_key = settings.OPENROUTER_API_KEY

        if gemini_key:
            self._client = genai.Client(api_key=gemini_key)
            self._use_openrouter = False
            logger.info("已初始化 Google Gemini 原生 SDK，模型：%s", self.model_name)
        elif openrouter_key:
            self._use_openrouter = True
            self._openrouter_key = openrouter_key
            logger.info("已初始化 OpenRouter 提供商，模型：%s", self.model_name)
        else:
            raise AIServiceError(
                "未設定 GEMINI_API_KEY 或 OPENROUTER_API_KEY，請在 .env 檔案中配置任一 API Key。"
            )

    # ------------------------------------------------------------------
    # 核心方法：呼叫 API（含重試機制）
    # ------------------------------------------------------------------
    def _call_gemini(self, prompt: str) -> str:
        """
        呼叫 AI 服務（Gemini API 或 OpenRouter API）並回傳文字內容。

        包含自動重試機制，在遇到暫時性錯誤時最多重試 MAX_RETRIES 次。
        """
        self._init_provider()
        last_error = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                logger.info("呼叫 AI 服務（第 %d 次嘗試）", attempt)
                
                if not self._use_openrouter:
                    # 使用原生 Gemini SDK
                    response = self._client.models.generate_content(
                        model=self.model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.8,
                        ),
                    )

                    # 檢查回應是否有效
                    if not response.candidates:
                        raise AIServiceError(
                            "Gemini API 回應被安全篩選攔截，無可用候選結果。"
                        )

                    text = response.text
                else:
                    # 使用 OpenRouter API (透過 httpx)
                    import httpx
                    headers = {
                        "Authorization": f"Bearer {self._openrouter_key}",
                        "Content-Type": "application/json",
                    }
                    
                    # 將 gemini-2.0-flash 對接到 OpenRouter 的模型名稱
                    openrouter_model = self.model_name
                    if openrouter_model == "gemini-2.0-flash":
                        openrouter_model = "google/gemini-2.0-flash-exp"
                    
                    data = {
                        "model": openrouter_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.8,
                    }
                    
                    response = httpx.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=headers,
                        json=data,
                        timeout=30.0,
                    )
                    response.raise_for_status()
                    resp_json = response.json()
                    choices = resp_json.get("choices", [])
                    if not choices:
                        raise AIServiceError(f"OpenRouter 回傳異常回應：{resp_json}")
                    
                    text = choices[0].get("message", {}).get("content", "")

                if not text or not text.strip():
                    raise AIServiceError("AI 服務回傳空白內容。")

                logger.info("AI 服務呼叫成功（第 %d 次嘗試）", attempt)
                return text.strip()

            except AIServiceError:
                raise
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "AI 服務呼叫失敗（第 %d/%d 次）：%s",
                    attempt,
                    MAX_RETRIES,
                    str(exc),
                )
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY_SECONDS * attempt)

        raise AIServiceError(
            f"AI 服務呼叫在 {MAX_RETRIES} 次嘗試後仍然失敗：{last_error}"
        )

    # ------------------------------------------------------------------
    # 公開方法 1：智慧策展主題生成
    # ------------------------------------------------------------------
    def generate_themes(
        self,
        curation_type: str,
        keywords: list[str],
        prompt: str | None = None,
        year: int | None = None,
    ) -> list[dict[str, Any]]:
        """
        根據策展類型、關鍵字等參數，呼叫 AI 生成 3 個策展主題大綱。

        Args:
            curation_type: 策展類型 (trend / festival / history / custom)
            keywords: 關鍵字清單
            prompt: 使用者自訂提示詞（可選）
            year: 特定年份（可選，主要用於 festival 類型）

        Returns:
            包含 3 個主題字典的 list，每個字典含 title, outline, target_audience。

        Raises:
            AIServiceError: 當 API 呼叫失敗或回應格式異常時。
        """
        curation_type_label = CURATION_TYPE_LABELS.get(
            curation_type, curation_type
        )

        filled_prompt = THEME_GENERATION_PROMPT.format(
            curation_type_label=curation_type_label,
            keywords="、".join(keywords) if keywords else "（未指定）",
            prompt=prompt or "（無自訂提示詞）",
            year=year or "（未指定年份）",
        )

        raw_response = self._call_gemini(filled_prompt)
        themes = self._parse_json_response(raw_response)

        # 驗證回傳結構
        validated_themes = []
        for i, theme in enumerate(themes):
            validated_themes.append({
                "title": theme.get("title", f"未命名主題 {i + 1}"),
                "outline": theme.get("outline", "（AI 未提供大綱）"),
                "target_audience": theme.get("target_audience", "一般讀者"),
            })

        logger.info("成功生成 %d 個策展主題", len(validated_themes))
        return validated_themes

    # ------------------------------------------------------------------
    # 公開方法 2：企劃書擴寫
    # ------------------------------------------------------------------
    def expand_proposal(
        self,
        title: str,
        outline: str,
        target_audience: str,
    ) -> str:
        """
        將策展主題與大綱擴寫為完整的企劃書 HTML 草案。

        Args:
            title: 策展主題名稱
            outline: 策展大綱
            target_audience: 預估受眾

        Returns:
            企劃書 HTML 格式字串，可直接用於前端富文本編輯器。

        Raises:
            AIServiceError: 當 API 呼叫失敗時。
        """
        filled_prompt = PROPOSAL_EXPANSION_PROMPT.format(
            title=title,
            outline=outline,
            target_audience=target_audience,
        )

        raw_response = self._call_gemini(filled_prompt)
        html_content = self._clean_html_response(raw_response)

        logger.info("成功擴寫企劃書，HTML 長度：%d 字元", len(html_content))
        return html_content

    # ------------------------------------------------------------------
    # 公開方法 3：取得語意向量（用於館藏語意比對）
    # ------------------------------------------------------------------
    def get_embedding(self, text: str) -> list[float]:
        """
        取得文字的語意向量 (使用 Gemini Embeddings API: gemini-embedding-2，固定維度為 768)。
        若目前為 OpenRouter 模式或 API 呼叫失敗，將回傳空 list（自動降級為純文字匹配）。
        """
        try:
            self._init_provider()
        except Exception:
            return []

        if self._use_openrouter or self._client is None:
            # OpenRouter 無原生 embeddings SDK，直接降級為文字匹配
            return []

        try:
            response = self._client.models.embed_content(
                model="gemini-embedding-2",
                contents=text.strip(),
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            if response.embeddings:
                return response.embeddings[0].values
        except Exception as exc:
            logger.warning("取得語意向量失敗：%s，將降級使用純文字匹配", str(exc))

        return []

    def get_text_embedding(self, text: str) -> list[float]:
        """
        取得文字的語意向量 (使用 Gemini Embeddings API: gemini-embedding-2，固定維度為 768)。
        專門配合 SA/DB 所定義的接口命名。
        """
        return self.get_embedding(text)

    def get_embeddings_batch(self, texts: list[str]) -> list[list[float] | None]:
        """
        批次取得文字的語意向量 (使用 Gemini Embeddings API: gemini-embedding-2，固定維度為 768)。
        返回與輸入文字列表對應的向量列表，若失敗則對應項為 None。
        """
        if not texts:
            return []

        try:
            self._init_provider()
        except Exception:
            return [None] * len(texts)

        if self._use_openrouter or self._client is None:
            return [None] * len(texts)

        try:
            response = self._client.models.embed_content(
                model="gemini-embedding-2",
                contents=[(t.strip() if t else " ") for t in texts],
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            if response.embeddings:
                return [emb.values for emb in response.embeddings]
        except Exception as exc:
            logger.warning("批次取得語意向量失敗：%s", str(exc))

        return [None] * len(texts)



    # ------------------------------------------------------------------
    # 工具方法：解析 JSON 回應
    # ------------------------------------------------------------------
    @staticmethod
    def _parse_json_response(raw_text: str) -> list[dict]:
        """
        從 AI 回傳的文字中解析 JSON 陣列。

        會自動清除 markdown 程式碼區塊標記（```json ... ```）以及
        其他可能的前後綴文字，確保穩定解析。
        """
        cleaned = raw_text.strip()

        # 移除 markdown 程式碼區塊標記
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        cleaned = cleaned.strip()

        # 嘗試直接解析
        try:
            result = json.loads(cleaned)
            if isinstance(result, list):
                return result
            if isinstance(result, dict):
                return [result]
            raise AIServiceError(
                f"AI 回傳的 JSON 結構不正確，預期陣列但得到：{type(result).__name__}"
            )
        except json.JSONDecodeError:
            pass

        # 嘗試從文字中提取 JSON 陣列
        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
                if isinstance(result, list):
                    return result
            except json.JSONDecodeError:
                pass

        raise AIServiceError(
            f"無法從 AI 回應中解析有效的 JSON 陣列。原始回應：{raw_text[:500]}"
        )

    # ------------------------------------------------------------------
    # 工具方法：清理 HTML 回應
    # ------------------------------------------------------------------
    @staticmethod
    def _clean_html_response(raw_text: str) -> str:
        """
        清理 AI 回傳的 HTML 內容。

        移除 markdown 程式碼區塊標記（```html ... ```），
        確保輸出為乾淨的 HTML 字串。
        """
        cleaned = raw_text.strip()

        # 移除 markdown HTML 程式碼區塊標記
        cleaned = re.sub(r"^```(?:html)?\s*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)

        return cleaned.strip()

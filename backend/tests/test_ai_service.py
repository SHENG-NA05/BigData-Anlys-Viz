import json
from unittest.mock import MagicMock, patch

import pytest

from app.services.ai_service import AIService, AIServiceError


@pytest.fixture
def mock_settings():
    with patch("app.services.ai_service.settings") as mock_set:
        mock_set.GEMINI_API_KEY = "fake-api-key"
        yield mock_set


@pytest.fixture
def mock_genai_client():
    with patch("app.services.ai_service.genai.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client
        yield mock_client


def test_generate_themes_success(mock_settings, mock_genai_client):
    # Setup mock response
    mock_response = MagicMock()
    mock_response.candidates = [MagicMock()]
    mock_response.text = """
    ```json
    [
      {
        "title": "AI與人類未來",
        "outline": "探討人工智慧的興起與對人類社會的影響。",
        "target_audience": "科技愛好者、一般大眾"
      },
      {
        "title": "智慧圖書館導覽",
        "outline": "展示圖書館如何運用智慧科技提升讀者體驗。",
        "target_audience": "圖書館館員、學者"
      },
      {
        "title": "演算法的世界",
        "outline": "用淺顯易懂的方式介紹我們日常生活中的演算法。",
        "target_audience": "青少年、學生"
      }
    ]
    ```
    """
    mock_genai_client.models.generate_content.return_value = mock_response

    service = AIService()
    themes = service.generate_themes(
        curation_type="trend",
        keywords=["AI", "科技"],
        prompt="請生成科技相關主題",
        year=2026,
    )

    assert len(themes) == 3
    assert themes[0]["title"] == "AI與人類未來"
    assert themes[1]["outline"] == "展示圖書館如何運用智慧科技提升讀者體驗。"
    assert themes[2]["target_audience"] == "青少年、學生"

    # Verify model config and generate_content calls
    mock_genai_client.models.generate_content.assert_called_once()
    args, kwargs = mock_genai_client.models.generate_content.call_args
    assert kwargs["model"] == "gemini-3.1-flash-lite"
    assert "近期時事話題" in kwargs["contents"]
    assert "AI" in kwargs["contents"]


def test_generate_themes_missing_api_key(mock_settings):
    mock_settings.GEMINI_API_KEY = ""
    mock_settings.OPENROUTER_API_KEY = ""

    service = AIService()
    with pytest.raises(AIServiceError) as exc_info:
        service.generate_themes(curation_type="trend", keywords=["AI"])

    assert "未設定 GEMINI_API_KEY 或 OPENROUTER_API_KEY" in str(exc_info.value)


def test_expand_proposal_success(mock_settings, mock_genai_client):
    mock_response = MagicMock()
    mock_response.candidates = [MagicMock()]
    mock_response.text = """
    ```html
    <h1>策展宗旨與目標</h1>
    <p>透過圖書策展推廣 AI 素養。</p>
    <h1>展區規劃與空間佈置</h1>
    <p>規劃三個展區：歷史區、應用區、未來區。</p>
    ```
    """
    mock_genai_client.models.generate_content.return_value = mock_response

    service = AIService()
    html = service.expand_proposal(
        title="AI 的奇幻旅程",
        outline="介紹 AI 歷史與應用",
        target_audience="大眾",
    )

    assert "<h1>策展宗旨與目標</h1>" in html
    assert "<h1>展區規劃與空間佈置</h1>" in html
    assert "```html" not in html
    assert "```" not in html


def test_retry_on_failure(mock_settings, mock_genai_client):
    # Setup mock to fail twice, then succeed
    mock_response = MagicMock()
    mock_response.candidates = [MagicMock()]
    mock_response.text = '{"title": "成功主題", "outline": "大綱", "target_audience": "大眾"}'

    mock_genai_client.models.generate_content.side_effect = [
        Exception("API Error"),
        Exception("API Error"),
        mock_response,
    ]

    with patch("time.sleep") as mock_sleep:  # Mock sleep to speed up test
        service = AIService()
        themes = service.generate_themes(curation_type="custom", keywords=["test"])

        assert len(themes) == 1
        assert themes[0]["title"] == "成功主題"
        assert mock_genai_client.models.generate_content.call_count == 3
        assert mock_sleep.call_count == 2


def test_parse_json_response_handling_malformed():
    service = AIService()

    # Raw text containing markdown block
    raw_markdown = """
    Some introduction text
    ```json
    [
      {"title": "主題1"}
    ]
    ```
    Outro text
    """
    parsed = service._parse_json_response(raw_markdown)
    assert len(parsed) == 1
    assert parsed[0]["title"] == "主題1"

    # Completely invalid JSON
    with pytest.raises(AIServiceError) as exc_info:
        service._parse_json_response("invalid json here")
    assert "無法從 AI 回應中解析" in str(exc_info.value)


def test_get_text_embedding_success(mock_settings, mock_genai_client):
    from google.genai import types
    mock_emb = MagicMock()
    mock_emb.values = [0.1, 0.2, 0.3]
    mock_response = MagicMock()
    mock_response.embeddings = [mock_emb]
    mock_genai_client.models.embed_content.return_value = mock_response

    service = AIService()
    emb = service.get_text_embedding("測試文字")

    assert emb == [0.1, 0.2, 0.3]
    mock_genai_client.models.embed_content.assert_called_once_with(
        model="gemini-embedding-2",
        contents="測試文字",
        config=types.EmbedContentConfig(output_dimensionality=768)
    )


def test_get_text_embedding_fallback_on_failure(mock_settings, mock_genai_client):
    mock_genai_client.models.embed_content.side_effect = Exception("Embed Error")

    service = AIService()
    emb = service.get_text_embedding("測試文字")

    assert emb == []



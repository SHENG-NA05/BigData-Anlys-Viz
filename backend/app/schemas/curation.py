from typing import List, Literal, Optional

from pydantic import BaseModel


class CurationRequest(BaseModel):
    """AI 智慧策展主題生成請求"""

    curation_type: Literal["trend", "festival", "history", "custom"]
    """策展類型：trend=近期時事 | festival=節慶 | history=歷史事件回顧 | custom=自訂"""

    keywords: List[str]
    """關鍵字清單"""

    prompt: Optional[str] = None
    """使用者自訂提示詞（custom 類型時使用）"""

    year: Optional[int] = 2026
    """特定年份（主要用於 festival 類型）"""

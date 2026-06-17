import xml.etree.ElementTree as ET
import httpx
import logging

logger = logging.getLogger(__name__)

FALLBACK_KEYWORDS = [
    "AI人工智慧",
    "ChatGPT",
    "數位轉型",
    "ESG永續發展",
    "智慧城市",
    "地方創生",
    "虛擬實境",
    "資訊安全",
    "量子計算",
    "元宇宙"
]

class RSSService:
    def __init__(self):
        self.trends_url = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=TW"
        self.news_url = "https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def fetch_google_trends(self) -> list[str]:
        """抓取 Google Trends 每日熱搜關鍵字"""
        try:
            response = httpx.get(self.trends_url, headers=self.headers, timeout=10.0)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            channel = root.find("channel")
            if channel is None:
                return []
            keywords = []
            for item in channel.findall("item"):
                title = item.find("title")
                if title is not None and title.text:
                    keywords.append(title.text.strip())
            return keywords
        except Exception as exc:
            logger.warning("抓取 Google Trends RSS 失敗：%s", str(exc))
            return []

    def fetch_google_news(self) -> list[str]:
        """抓取 Google News 台灣熱門話題標題"""
        try:
            response = httpx.get(self.news_url, headers=self.headers, timeout=10.0)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            channel = root.find("channel")
            if channel is None:
                return []
            keywords = []
            for item in channel.findall("item"):
                title = item.find("title")
                if title is not None and title.text:
                    # 去除媒體來源尾綴，如 " - 自由時報"
                    clean_title = title.text.split(" - ")[0].strip()
                    if clean_title:
                        keywords.append(clean_title)
            return keywords
        except Exception as exc:
            logger.warning("抓取 Google News RSS 失敗：%s", str(exc))
            return []

    def get_trending_keywords(self) -> list[str]:
        """合併並獲取熱門時事關鍵字/標題，若失敗則回傳預設詞清單"""
        trends = self.fetch_google_trends()
        news = self.fetch_google_news()

        merged = []
        seen = set()
        for k in trends + news:
            k_clean = k.strip()
            if k_clean and k_clean not in seen:
                merged.append(k_clean)
                seen.add(k_clean)

        if not merged:
            logger.info("使用預設時事熱門詞清單。")
            return FALLBACK_KEYWORDS

        return merged[:30]

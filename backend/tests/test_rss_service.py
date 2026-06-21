from unittest.mock import patch, MagicMock
from app.services.rss_service import RSSService

def test_rss_service_google_trends_success():
    service = RSSService()
    mock_response_content = (
        b'<rss><channel>'
        b'<item><title>\xe5\xbc\xb5\xe6\x83\xa0\xe5\xa6\xb9</title></item>'
        b'<item><title>AI</title></item>'
        b'</channel></rss>'
    )
    with patch("httpx.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.content = mock_response_content
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        keywords = service.fetch_google_trends()
        assert keywords == ["張惠妹", "AI"]

def test_rss_service_google_news_success():
    service = RSSService()
    mock_response_content = (
        b'<rss><channel>'
        b'<item><title>\xe5\x8f\xb0\xe7\xa9\x8d\xe9\x9b\xbb\xe8\xa8\xad\xe5\xbb\xa0 - \xe8\x87\xaa\xe7\x94\xb1\xe6\x99\x82\xe5\xa0\xb1</title></item>'
        b'</channel></rss>'
    )
    with patch("httpx.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.content = mock_response_content
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        keywords = service.fetch_google_news()
        assert keywords == ["台積電設廠"]

def test_rss_service_returns_empty_list_on_exception():
    service = RSSService()
    with patch("httpx.get", side_effect=Exception("Connection error")):
        keywords = service.get_trending_keywords()
        assert keywords == []

def test_rss_service_missing_channel():
    service = RSSService()
    mock_response_content = b'<rss></rss>'
    with patch("httpx.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.content = mock_response_content
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        assert service.fetch_google_trends() == []
        assert service.fetch_google_news() == []

def test_rss_service_missing_title_or_empty_text():
    service = RSSService()
    mock_response_content = (
        b'<rss><channel>'
        b'<item></item>' # Missing title
        b'<item><title></title></item>' # Empty title text
        b'</channel></rss>'
    )
    with patch("httpx.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.content = mock_response_content
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        assert service.fetch_google_trends() == []
        assert service.fetch_google_news() == []

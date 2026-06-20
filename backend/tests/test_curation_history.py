from datetime import datetime

from app.api.endpoints.curation import get_history


class ThemeRecord:
    def __init__(self, theme_id, curation_type, title, created_at, outline=None, target_audience=None, keywords=None, prompt=None, year=2026):
        self.theme_id = theme_id
        self.curation_type = curation_type
        self.title = title
        self.created_at = created_at
        self.outline = outline or "Mock Outline"
        self.target_audience = target_audience or "Mock Audience"
        self.keywords = keywords or []
        self.prompt = prompt
        self.year = year


class FakeQuery:
    def __init__(self, records):
        self.records = list(records)
        self.offset_value = 0
        self.limit_value = None

    def filter(self, condition):
        right_value = condition.right.value
        return FakeQuery([record for record in self.records if record.curation_type == right_value])

    def count(self):
        return len(self.records)

    def order_by(self, *args):
        return self

    def offset(self, value):
        self.offset_value = value
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def all(self):
        end = None if self.limit_value is None else self.offset_value + self.limit_value
        return self.records[self.offset_value:end]


class FakeDb:
    def __init__(self, records):
        self.records = records

    def query(self, model):
        return FakeQuery(self.records)


def make_records():
    return [
        ThemeRecord("T001", "trend", "AI Reading Future", datetime(2026, 6, 16, 10, 0, 0)),
        ThemeRecord("T002", "festival", "Summer Reading", datetime(2026, 6, 15, 9, 30, 0)),
        ThemeRecord("T003", "trend", "Data Literacy", datetime(2026, 6, 14, 8, 0, 0)),
    ]


def test_history_returns_all_records():
    response = get_history(cur_page=1, size=10, db=FakeDb(make_records()))

    assert response["total"] == 3
    assert len(response["data"]) == 3
    assert response["data"][0]["theme_id"] == "T001"
    assert response["data"][0]["create_time"] == "2026-06-16 10:00:00"


def test_history_filters_by_curation_type():
    response = get_history(cur_page=1, size=10, curation_type="trend", db=FakeDb(make_records()))

    assert response["total"] == 2
    assert [item["theme_id"] for item in response["data"]] == ["T001", "T003"]


def test_history_supports_pagination():
    response = get_history(cur_page=2, size=1, db=FakeDb(make_records()))

    assert response["total"] == 3
    assert len(response["data"]) == 1
    assert response["data"][0]["theme_id"] == "T002"

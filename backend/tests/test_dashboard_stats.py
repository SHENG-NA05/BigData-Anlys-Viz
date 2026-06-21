from decimal import Decimal
from types import SimpleNamespace

from app.api.endpoints.dashboard import get_dashboard_stats


class FakeQuery:
    def __init__(self, result):
        self.result = result

    def group_by(self, *args):
        return self

    def order_by(self, *args):
        return self

    def one(self):
        return self.result

    def all(self):
        return self.result


class FakeDb:
    def __init__(self):
        self.call_count = 0

    def query(self, *args):
        self.call_count += 1
        if self.call_count == 1:
            return FakeQuery((Decimal("22.50"), Decimal("4500.00")))
        if self.call_count == 2:
            return FakeQuery([
                ("theme_generation", 3),
                ("proposal_export", 2),
            ])
        return FakeQuery([
            SimpleNamespace(month="2026-06", hours=Decimal("10.50"), cost=Decimal("2100.00")),
            SimpleNamespace(month="2026-07", hours=Decimal("12.00"), cost=Decimal("2400.00")),
        ])


def test_dashboard_stats_returns_aggregated_cost_benefit_data():
    response = get_dashboard_stats(db=FakeDb())

    assert response == {
        "cumulative_hours_saved": 22.5,
        "cumulative_cost_saved": 4500.0,
        "theme_generation_count": 3,
        "proposal_export_count": 2,
        "monthly_stats": [
            {"month": "2026-06", "hours": 10.5, "cost": 2100.0},
            {"month": "2026-07", "hours": 12.0, "cost": 2400.0},
        ],
    }

def test_get_monthly_stats():
    from unittest.mock import patch
    from app.api.endpoints.dashboard import get_monthly_stats
    with patch("app.api.endpoints.dashboard.get_monthly_cost_benefit_stats") as mock_get:
        mock_row = SimpleNamespace(month="2026-06", hours=Decimal("10.50"), cost=Decimal("2100.00"))
        mock_get.return_value = [mock_row]
        
        db = FakeDb()
        response = get_monthly_stats(db=db)
        
        assert len(response) == 1
        assert response[0]["month"] == "2026-06"
        assert response[0]["hours"] == 10.5
        assert response[0]["cost"] == 2100.0

def test_get_quarterly_stats():
    from unittest.mock import MagicMock
    from app.api.endpoints.dashboard import get_quarterly_stats
    db = MagicMock()
    mock_row = SimpleNamespace(quarter="2026-Q2", hours=Decimal("15.0"), cost=Decimal("3000.0"))
    db.query.return_value.group_by.return_value.order_by.return_value.all.return_value = [mock_row]
    
    response = get_quarterly_stats(db=db)
    assert len(response) == 1
    assert response[0]["quarter"] == "2026-Q2"
    assert response[0]["hours"] == 15.0
    assert response[0]["cost"] == 3000.0

def test_get_dashboard_settings_success():
    from unittest.mock import patch, MagicMock
    from app.api.endpoints.dashboard import get_dashboard_settings
    with patch("app.api.endpoints.dashboard.get_system_setting") as mock_get_setting:
        mock_rate = MagicMock()
        mock_rate.setting_value = "250.0"
        mock_hours = MagicMock()
        mock_hours.setting_value = "7.5"
        
        mock_get_setting.side_effect = lambda db, key: mock_rate if key == "hourly_rate" else mock_hours
        
        db = MagicMock()
        response = get_dashboard_settings(db=db)
        
        assert response["hourly_rate"] == 250.0
        assert response["base_hours"] == 7.5

def test_get_dashboard_settings_default():
    from unittest.mock import patch, MagicMock
    from app.api.endpoints.dashboard import get_dashboard_settings
    with patch("app.api.endpoints.dashboard.get_system_setting") as mock_get_setting:
        mock_get_setting.return_value = None
        
        db = MagicMock()
        response = get_dashboard_settings(db=db)
        
        assert response["hourly_rate"] == 200.0
        assert response["base_hours"] == 8.0

def test_update_dashboard_settings():
    from unittest.mock import patch, MagicMock
    from app.api.endpoints.dashboard import update_dashboard_settings, DashboardSettingsRequest
    with patch("app.api.endpoints.dashboard.upsert_system_setting") as mock_upsert:
        db = MagicMock()
        req = DashboardSettingsRequest(hourly_rate=300.0, base_hours=6.0)
        
        response = update_dashboard_settings(request=req, db=db)
        
        assert response["status"] == "success"
        mock_upsert.assert_any_call(db, "hourly_rate", "300.0", "Average hourly rate for library staff in NTD")
        mock_upsert.assert_any_call(db, "base_hours", "6.0", "Baseline work hours per day")


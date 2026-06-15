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

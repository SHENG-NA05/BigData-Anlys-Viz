import pytest
from app.crud.system_setting import get_system_setting, upsert_system_setting
from app.db.models import SystemSetting

class FakeSessionForSetting:
    def __init__(self, settings=None):
        self.settings = settings or {}
        self.added = []
        self.committed = False
        self.refreshed = False

    def get(self, model, key):
        return self.settings.get(key)

    def add(self, item):
        self.added.append(item)
        self.settings[item.setting_key] = item

    def commit(self):
        self.committed = True

    def refresh(self, item):
        self.refreshed = True

def test_get_system_setting():
    setting = SystemSetting(setting_key="hourly_rate", setting_value="500")
    db = FakeSessionForSetting({"hourly_rate": setting})
    
    res = get_system_setting(db, "hourly_rate")
    assert res is not None
    assert res.setting_value == "500"
    
    res_none = get_system_setting(db, "nonexistent")
    assert res_none is None

def test_upsert_system_setting_insert():
    db = FakeSessionForSetting()
    
    res = upsert_system_setting(db, "hourly_rate", "500", "description")
    assert res.setting_key == "hourly_rate"
    assert res.setting_value == "500"
    assert res.description == "description"
    assert db.committed is True
    assert db.refreshed is True
    assert len(db.added) == 1

def test_upsert_system_setting_update():
    setting = SystemSetting(setting_key="hourly_rate", setting_value="500")
    db = FakeSessionForSetting({"hourly_rate": setting})
    
    res = upsert_system_setting(db, "hourly_rate", "600", "new description")
    assert res.setting_key == "hourly_rate"
    assert res.setting_value == "600"
    assert res.description == "new description"
    assert db.committed is True
    assert db.refreshed is True
    assert len(db.added) == 0

from app.db import init_db


class FakeConnection:
    def __init__(self):
        self.executed = []

    def execute(self, statement):
        self.executed.append(str(statement))


class FakeBegin:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        return self.connection

    def __exit__(self, exc_type, exc, traceback):
        return False


class FakeEngine:
    def __init__(self):
        self.connection = FakeConnection()

    def begin(self):
        return FakeBegin(self.connection)


class FakeSession:
    def __init__(self, existing_keys=None):
        self.existing_keys = set(existing_keys or [])
        self.added = []
        self.committed = False
        self.closed = False

    def get(self, model, key):
        if key in self.existing_keys:
            return object()
        return None

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.committed = True

    def close(self):
        self.closed = True


def test_create_tables_creates_pgcrypto_extension_and_models(monkeypatch):
    fake_engine = FakeEngine()
    create_all_calls = []

    def fake_create_all(bind):
        create_all_calls.append(bind)

    monkeypatch.setattr(init_db, "engine", fake_engine)
    monkeypatch.setattr(init_db.Base.metadata, "create_all", fake_create_all)

    init_db.create_tables()

    assert fake_engine.connection.executed == ["CREATE EXTENSION IF NOT EXISTS pgcrypto"]
    assert create_all_calls == [fake_engine.connection]


def test_seed_system_settings_inserts_missing_defaults(monkeypatch):
    fake_session = FakeSession()
    monkeypatch.setattr(init_db, "SessionLocal", lambda: fake_session)

    init_db.seed_system_settings()

    assert fake_session.committed is True
    assert fake_session.closed is True
    assert [item.setting_key for item in fake_session.added] == [
        "hourly_rate",
        "base_theme_hours",
        "base_proposal_hours",
    ]


def test_seed_system_settings_skips_existing_defaults(monkeypatch):
    fake_session = FakeSession(existing_keys={"hourly_rate", "base_theme_hours", "base_proposal_hours"})
    monkeypatch.setattr(init_db, "SessionLocal", lambda: fake_session)

    init_db.seed_system_settings()

    assert fake_session.committed is True
    assert fake_session.closed is True
    assert fake_session.added == []


def test_init_db_runs_table_creation_and_seed(monkeypatch):
    calls = []
    monkeypatch.setattr(init_db, "create_tables", lambda: calls.append("create_tables"))
    monkeypatch.setattr(init_db, "seed_system_settings", lambda: calls.append("seed_system_settings"))

    init_db.init_db()

    assert calls == ["create_tables", "seed_system_settings"]

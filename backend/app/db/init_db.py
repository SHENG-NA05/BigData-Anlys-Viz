from sqlalchemy import text

from app.db import models
from app.db.base import Base
from app.db.session import SessionLocal, engine


DEFAULT_SYSTEM_SETTINGS = [
    {
        "setting_key": "hourly_rate",
        "setting_value": "200",
        "description": "Average hourly rate for library staff in NTD",
    },
    {
        "setting_key": "base_theme_hours",
        "setting_value": "4",
        "description": "Baseline hours for manual curation theme planning",
    },
    {
        "setting_key": "base_proposal_hours",
        "setting_value": "16",
        "description": "Baseline hours for manual proposal writing",
    },
]


def create_tables():
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        Base.metadata.create_all(bind=connection)


def seed_system_settings():
    db = SessionLocal()
    try:
        for item in DEFAULT_SYSTEM_SETTINGS:
            exists = db.get(models.SystemSetting, item["setting_key"])
            if exists:
                continue
            db.add(models.SystemSetting(**item))
        db.commit()
    finally:
        db.close()


def init_db():
    create_tables()
    seed_system_settings()


if __name__ == "__main__":
    init_db()

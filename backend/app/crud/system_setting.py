from sqlalchemy.orm import Session

from app.db.models import SystemSetting


def get_system_setting(db: Session, setting_key: str) -> SystemSetting | None:
    return db.get(SystemSetting, setting_key)


def upsert_system_setting(
    db: Session,
    setting_key: str,
    setting_value: str,
    description: str | None = None,
) -> SystemSetting:
    setting = db.get(SystemSetting, setting_key)
    if setting is None:
        setting = SystemSetting(
            setting_key=setting_key,
            setting_value=setting_value,
            description=description,
        )
        db.add(setting)
    else:
        setting.setting_value = setting_value
        setting.description = description
    db.commit()
    db.refresh(setting)
    return setting

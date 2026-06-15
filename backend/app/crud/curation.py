from sqlalchemy.orm import Session

from app.db.models import CurationTheme


def create_curation_theme(db: Session, theme: CurationTheme) -> CurationTheme:
    db.add(theme)
    db.commit()
    db.refresh(theme)
    return theme


def get_curation_theme(db: Session, theme_id: str) -> CurationTheme | None:
    return db.get(CurationTheme, theme_id)


def list_curation_themes(
    db: Session,
    cur_page: int = 1,
    size: int = 10,
    curation_type: str | None = None,
) -> tuple[int, list[CurationTheme]]:
    query = db.query(CurationTheme)
    if curation_type:
        query = query.filter(CurationTheme.curation_type == curation_type)

    total = query.count()
    themes = (
        query.order_by(CurationTheme.created_at.desc())
        .offset((cur_page - 1) * size)
        .limit(size)
        .all()
    )
    return total, themes

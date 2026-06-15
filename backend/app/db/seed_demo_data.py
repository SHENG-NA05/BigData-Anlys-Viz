import argparse
import sys
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.init_db import init_db
from app.db.models import CostBenefitLog, CurationTheme, Proposal, User
from app.db.session import SessionLocal


DEMO_USER = {
    "username": "demo_curator",
    "hashed_password": "demo-password-for-local-testing-only",
    "role": "curator",
    "sso_provider": "local-demo",
}

DEMO_THEMES = [
    {
        "theme_id": "DEMO-THEME-AI",
        "curation_type": "trend",
        "title": "AI 素養與未來生活",
        "outline": "以人工智慧、資料素養與生活應用為主軸，規劃跨年齡層閱讀展示。",
        "target_audience": "一般讀者、學生與終身學習者",
        "keywords": ["AI", "資料素養", "未來生活"],
        "prompt": "Generate a library curation theme about AI literacy.",
        "year": 2026,
    },
    {
        "theme_id": "DEMO-THEME-CITY",
        "curation_type": "local",
        "title": "城市閱讀與地方記憶",
        "outline": "結合地方史、城市文化、建築與社區故事，建立在地閱讀策展。",
        "target_audience": "高雄市民、地方研究者與親子讀者",
        "keywords": ["城市", "地方史", "高雄"],
        "prompt": "Generate a library curation theme about local city memory.",
        "year": 2026,
    },
]

DEMO_PROPOSALS = [
    {
        "proposal_id": "DEMO-PROPOSAL-AI",
        "theme_id": "DEMO-THEME-AI",
        "title": "AI 素養與未來生活企劃書",
        "content": (
            "<h1>AI 素養與未來生活</h1>"
            "<h2>策展目標</h2><p>協助讀者理解人工智慧與資料素養在日常生活中的影響。</p>"
            "<h2>展示規劃</h2><p>分為入門概念、產業應用、倫理議題與親子共讀四個區域。</p>"
        ),
        "matched_books": [
            {"title": "人工智慧入門", "classification_no": "540.12", "match_reason": "符合 AI 入門主題"},
            {"title": "資料素養生活課", "classification_no": "540.23", "match_reason": "符合資料素養主題"},
        ],
        "status": "draft",
    },
    {
        "proposal_id": "DEMO-PROPOSAL-CITY",
        "theme_id": "DEMO-THEME-CITY",
        "title": "城市閱讀與地方記憶企劃書",
        "content": (
            "<h1>城市閱讀與地方記憶</h1>"
            "<h2>策展目標</h2><p>透過館藏引導讀者認識城市發展與地方文化。</p>"
            "<h2>展示規劃</h2><p>安排地方史、影像地圖、人物故事與社區參與四個單元。</p>"
        ),
        "matched_books": [
            {"title": "高雄城市故事", "classification_no": "900.32", "match_reason": "符合地方城市主題"},
            {"title": "台灣地方文化導讀", "classification_no": "733.21", "match_reason": "符合地方史主題"},
        ],
        "status": "draft",
    },
]

DEMO_COST_BENEFIT_LOGS = [
    {
        "action": "theme_generation",
        "target_id": "DEMO-THEME-AI",
        "time_saved_hours": Decimal("4.00"),
        "cost_saved_amount": Decimal("800.00"),
    },
    {
        "action": "theme_generation",
        "target_id": "DEMO-THEME-CITY",
        "time_saved_hours": Decimal("4.00"),
        "cost_saved_amount": Decimal("800.00"),
    },
    {
        "action": "proposal_export",
        "target_id": "DEMO-PROPOSAL-AI",
        "time_saved_hours": Decimal("16.00"),
        "cost_saved_amount": Decimal("3200.00"),
    },
    {
        "action": "proposal_export",
        "target_id": "DEMO-PROPOSAL-CITY",
        "time_saved_hours": Decimal("16.00"),
        "cost_saved_amount": Decimal("3200.00"),
    },
]


def seed_demo_user(db) -> User:
    user = db.query(User).filter(User.username == DEMO_USER["username"]).first()
    if user:
        return user

    user = User(**DEMO_USER)
    db.add(user)
    db.flush()
    return user


def seed_demo_themes(db, user: User) -> int:
    created_count = 0
    for item in DEMO_THEMES:
        if db.get(CurationTheme, item["theme_id"]):
            continue
        db.add(CurationTheme(**item, created_by=user.id))
        created_count += 1
    return created_count


def seed_demo_proposals(db, user: User) -> int:
    created_count = 0
    for item in DEMO_PROPOSALS:
        if db.get(Proposal, item["proposal_id"]):
            continue
        db.add(Proposal(**item, created_by=user.id))
        created_count += 1
    return created_count


def seed_demo_cost_benefit_logs(db, user: User) -> int:
    created_count = 0
    for item in DEMO_COST_BENEFIT_LOGS:
        exists = (
            db.query(CostBenefitLog)
            .filter(CostBenefitLog.action == item["action"], CostBenefitLog.target_id == item["target_id"])
            .first()
        )
        if exists:
            continue
        db.add(CostBenefitLog(**item, user_id=user.id))
        created_count += 1
    return created_count


def count_rows(db) -> dict[str, int]:
    return {
        "users": db.query(func.count(User.id)).scalar() or 0,
        "curation_themes": db.query(func.count(CurationTheme.theme_id)).scalar() or 0,
        "proposals": db.query(func.count(Proposal.proposal_id)).scalar() or 0,
        "cost_benefit_logs": db.query(func.count(CostBenefitLog.log_id)).scalar() or 0,
    }


def seed_demo_data() -> dict[str, int | dict[str, int]]:
    init_db()
    db = SessionLocal()
    try:
        user = seed_demo_user(db)
        themes_created = seed_demo_themes(db, user)
        proposals_created = seed_demo_proposals(db, user)
        logs_created = seed_demo_cost_benefit_logs(db, user)
        db.commit()
        return {
            "themes_created": themes_created,
            "proposals_created": proposals_created,
            "cost_benefit_logs_created": logs_created,
            "totals": count_rows(db),
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def parse_args():
    parser = argparse.ArgumentParser(description="Seed demo DB data for local testing and presentation.")
    parser.add_argument(
        "--skip-init",
        action="store_true",
        help="Skip init_db() when tables already exist.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if args.skip_init:
        db = SessionLocal()
        try:
            user = seed_demo_user(db)
            result = {
                "themes_created": seed_demo_themes(db, user),
                "proposals_created": seed_demo_proposals(db, user),
                "cost_benefit_logs_created": seed_demo_cost_benefit_logs(db, user),
            }
            db.commit()
            result["totals"] = count_rows(db)
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    else:
        result = seed_demo_data()

    for key, value in result.items():
        print(f"{key}={value}")


if __name__ == "__main__":
    main()

import argparse
import sys
from pathlib import Path

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal
from app.services.catalog_match_service import match_catalog_books


def validate_pgvector_query_results(results: list[dict]) -> list[str]:
    errors = []
    if not results:
        errors.append("pgvector query returned no catalog matches")
        return errors

    vector_matches = [
        result
        for result in results
        if "pgvector語意相似度" in str(result.get("match_reason", ""))
    ]
    if not vector_matches:
        errors.append("catalog matching did not use pgvector semantic results")
    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify catalog matching uses pgvector semantic query.")
    parser.add_argument(
        "--keywords",
        nargs="+",
        default=["AI", "資料"],
        help="Keywords used to generate a query embedding.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum number of matched catalog books.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    db = SessionLocal()
    try:
        results = match_catalog_books(db, args.keywords, limit=args.limit)
    finally:
        db.close()

    errors = validate_pgvector_query_results(results)

    print(f"query_keywords={' '.join(args.keywords)}")
    print(f"matched_count={len(results)}")
    for index, result in enumerate(results, start=1):
        print(
            "match_{index}=book_id:{book_id}, score:{score}, reason:{reason}".format(
                index=index,
                book_id=result.get("book_id"),
                score=result.get("match_score"),
                reason=result.get("match_reason"),
            )
        )

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)

    print("pgvector_query=ok")


if __name__ == "__main__":
    main()

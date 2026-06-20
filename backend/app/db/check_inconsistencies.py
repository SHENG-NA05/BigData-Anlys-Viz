import os
import re
from pathlib import Path

# Paths definitions relative to project root
ROOT_DIR = Path(__file__).resolve().parents[3]
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
DOCS_DIR = ROOT_DIR / "documents"

def scan_frontend_endpoints():
    endpoints = []
    service_dir = FRONTEND_DIR / "src" / "services"
    if not service_dir.exists():
        return endpoints

    # Regex to capture axios calls like: apiClient.post('/path', ...)
    pattern = re.compile(r"apiClient\.(get|post|put|delete)\(\s*['\"`]([^'\"`\s\?]+)", re.IGNORECASE)

    for file_path in service_dir.glob("*.js"):
        if file_path.name == "api.js":
            continue
        content = file_path.read_text(encoding="utf-8")
        for match in pattern.finditer(content):
            method, path = match.groups()
            endpoints.append({
                "file": f"frontend/src/services/{file_path.name}",
                "method": method.upper(),
                "path": path
            })
    return endpoints

def scan_backend_routes():
    routes = []
    endpoints_dir = BACKEND_DIR / "app" / "api" / "endpoints"
    if not endpoints_dir.exists():
        return routes

    # Capture @router.post("/path") or @router.get("/path")
    route_pattern = re.compile(r"@router\.(get|post|put|delete)\(\s*['\"]([^'\"]+)", re.IGNORECASE)
    # Capture router tags/prefix to reconstruct absolute path
    # Usually in main.py: app.include_router(curation.router, prefix="/curation_management/backend", ...)
    
    # Let's map endpoints module to prefix based on main.py definitions
    prefix_map = {
        "auth.py": "/curation_management/backend",
        "curation.py": "/curation_management/backend",
        "proposal.py": "/curation_management/backend",
        "catalog.py": "/curation_management/backend",
        "dashboard.py": "/curation_management/backend"
    }

    for file_path in endpoints_dir.glob("*.py"):
        if file_path.name == "__init__.py":
            continue
        content = file_path.read_text(encoding="utf-8")
        prefix = prefix_map.get(file_path.name, "")
        for match in route_pattern.finditer(content):
            method, path = match.groups()
            full_path = f"{prefix}{path}"
            # Standardize paths (replace path parameter templates)
            standard_path = re.sub(r"\{[^}]+\}", "{id}", full_path)
            routes.append({
                "file": f"backend/app/api/endpoints/{file_path.name}",
                "method": method.upper(),
                "path": standard_path
            })
    return routes

def analyze_api_inconsistencies(fe_endpoints, be_routes):
    missing_in_backend = []
    uncalled_in_backend = []
    method_mismatches = []
    
    # Normalize paths for comparison (e.g. replace '/proposals/{proposal_id}' with '/proposals/{id}')
    def normalize_fe_path(path):
        # UI path has no '/curation_management/backend' prefix! Let's mock prepend prefix for alignment check
        # UI paths: /curation/generate-themes, /proposal/create, /proposal/${id}/match-catalog
        p = re.sub(r"\$\{[^}]+\}", "{id}", path)
        p = re.sub(r"/\d+", "/{id}", p)  # replace number ids
        return p

    def normalize_be_path(path):
        return path

    fe_normalized = {}
    for ep in fe_endpoints:
        norm_path = normalize_fe_path(ep["path"])
        # Keep track of original details
        fe_normalized[(ep["method"], norm_path)] = ep

    be_normalized = {}
    for r in be_routes:
        norm_path = normalize_be_path(r["path"])
        be_normalized[(r["method"], norm_path)] = r

    # 1. Check frontend calls that have no matching backend route
    for (method, fe_path), fe_info in fe_normalized.items():
        # Check direct match with prefix prepended
        potential_be_path = f"/curation_management/backend{fe_path}"
        
        # Handle exceptions in names (e.g. frontend /curation/generate-themes vs backend /generate_themes)
        # Let's see if we can find any similar paths
        matched = False
        for (be_method, be_path) in be_normalized.keys():
            if method == be_method:
                # Compare path parts ignoring delimiters and prefix
                fe_clean = fe_path.replace("-", "").replace("_", "").lower()
                be_clean = be_path.replace("/curation_management/backend", "").replace("-", "").replace("_", "").lower()
                if fe_clean == be_clean:
                    matched = True
                    # Check for exact path string match
                    if potential_be_path != be_path:
                        method_mismatches.append({
                            "type": "Path Name/Style Discrepancy",
                            "fe_path": fe_info["path"],
                            "be_path": be_path,
                            "method": method,
                            "fe_file": fe_info["file"],
                            "be_file": be_normalized[(be_method, be_path)]["file"],
                            "reason": f"Frontend calls '{fe_info['path']}', but backend implements '{be_path}'."
                        })
                    break
        
        if not matched:
            missing_in_backend.append({
                "fe_path": fe_info["path"],
                "method": method,
                "file": fe_info["file"]
            })

    # 2. Check backend routes that are never called by frontend
    for (be_method, be_path), be_info in be_normalized.items():
        matched = False
        for (fe_method, fe_path) in fe_normalized.keys():
            if be_method == fe_method:
                fe_clean = fe_path.replace("-", "").replace("_", "").lower()
                be_clean = be_path.replace("/curation_management/backend", "").replace("-", "").replace("_", "").lower()
                if fe_clean == be_clean:
                    matched = True
                    break
        if not matched:
            uncalled_in_backend.append({
                "be_path": be_path,
                "method": be_method,
                "file": be_info["file"]
            })

    return missing_in_backend, uncalled_in_backend, method_mismatches

def check_db_inconsistencies():
    # 1. Mismatch between DDL in spec and models.py
    # Read models.py content
    models_file = BACKEND_DIR / "app" / "db" / "models.py"
    models_content = models_file.read_text(encoding="utf-8") if models_file.exists() else ""
    
    # Read Alembic migration file
    migrations_dir = BACKEND_DIR / "alembic" / "versions"
    migration_content = ""
    for mig in migrations_dir.glob("*.py"):
        migration_content += mig.read_text(encoding="utf-8")

    db_mismatches = []

    # Check embedding column in models.py
    if "embedding = Column(JSON" in models_content:
        db_mismatches.append({
            "type": "SQLAlchemy Model Mismatch",
            "element": "CatalogBook.embedding",
            "reason": "Declared as Column(JSON) in models.py, but should be Vector(768) according to 系統規格書.md DDL specification."
        })

    # Check embedding column in migration file
    if "catalog_books" in migration_content and "embedding" not in migration_content:
        db_mismatches.append({
            "type": "Alembic Migration Defect",
            "element": "catalog_books table schema",
            "reason": "The 'embedding' column is completely missing from the 20260616_0001_create_initial_schema.py migration file. Running migrations will fail to create the vector storage."
        })

    # Check proposals matched_books column
    # In DDL: matched_books JSONB
    # In models.py: matched_books = Column(JSONB, nullable=True) - Correct!
    
    return db_mismatches

def generate_report():
    print("Scanning frontend services...")
    fe = scan_frontend_endpoints()
    print(f"Found {len(fe)} API calls in frontend.")
    
    print("Scanning backend api endpoints...")
    be = scan_backend_routes()
    print(f"Found {len(be)} routes in backend.")

    missing, uncalled, style_diff = analyze_api_inconsistencies(fe, be)
    db_diffs = check_db_inconsistencies()

    report = []
    report.append("# Library Smart Curation System - Global Inconsistency Report")
    report.append("\nThis report documents the architectural, API routing, and database schema discrepancies identified in the codebase.")
    
    report.append("\n## 1. API Route & Prefix Mismatches")
    report.append("\nThe frontend application calls API paths without the SA-defined `/curation_management/backend` prefix, and uses different casing styles (kebab-case vs. snake_case).")
    
    if style_diff:
        report.append("\n### Style/Path Delimiter Inconsistencies")
        report.append("| Method | Frontend Path | Backend Path | Frontend File | Backend File |")
        report.append("| :--- | :--- | :--- | :--- | :--- |")
        for diff in style_diff:
            report.append(f"| {diff['method']} | `{diff['fe_path']}` | `{diff['be_path']}` | {diff['fe_file']} | {diff['be_file']} |")
    
    if missing:
        report.append("\n### Frontend Calls with No Matching Backend Route")
        report.append("| Method | Path | Frontend File | Status |")
        report.append("| :--- | :--- | :--- | :--- |")
        for m in missing:
            report.append(f"| {m['method']} | `{m['fe_path']}` | {m['file']} | 🔴 No Route |")

    if uncalled:
        report.append("\n### Backend Routes Never Called by Frontend")
        report.append("| Method | Path | Backend File | Status |")
        report.append("| :--- | :--- | :--- | :--- |")
        for u in uncalled:
            report.append(f"| {u['method']} | `{u['be_path']}` | {u['file']} | 🟡 Uncalled |")

    report.append("\n## 2. Database Schema & Migration Inconsistencies")
    if db_diffs:
        report.append("\n### Database Inconsistencies")
        report.append("| Category | Element | Issue Description |")
        report.append("| :--- | :--- | :--- |")
        for db in db_diffs:
            report.append(f"| {db['type']} | `{db['element']}` | {db['reason']} |")
    else:
        report.append("\nNo DB schema inconsistencies found.")

    report.append("\n## 3. Actionable Remediation Checklist")
    report.append("\n### UI Developer (Frontend)")
    report.append("- [ ] Update Axios baseURL in `frontend/src/services/api.js` to suffix the namespace: `http://localhost:8000/curation_management/backend`.")
    report.append("- [ ] Align endpoint paths in service files to match the backend snake_case naming style:")
    report.append("  - Change `/curation/generate-themes` to `/generate_themes` in `curationService.js`.")
    report.append("  - Change `/curation/theme-history` to `/history` in `curationService.js`.")
    report.append("  - Change `/proposal/create` to `/export_to_proposal` in `curationService.js`.")
    report.append("  - Change `/proposal/{id}` to `/proposals/{id}` in `proposalService.js`.")
    report.append("  - Change `/proposal/{id}/match-catalog` to `/proposals/{id}/match` in `proposalService.js` (Verify router definition in backend).")
    report.append("  - Change `/catalog/upload` to `/catalog/import` in `catalogService.js`.")

    report.append("\n### Web Service & DB Developer (Backend)")
    report.append("- [ ] Import `pgvector.sqlalchemy.Vector` inside `backend/app/db/models.py` and modify `CatalogBook.embedding` column declaration:")
    report.append("  ```python\n  from pgvector.sqlalchemy import Vector\n  # ...\n  embedding = Column(Vector(768), nullable=True)\n  ```")
    report.append("- [ ] Create a new Alembic migration to add the missing `embedding` column of type `Vector(768)` to `catalog_books` table:")
    report.append("  ```bash\n  # Ensure database is running\n  alembic revision --autogenerate -m \"add_embedding_vector_column\"\n  alembic upgrade head\n  ```")

    report_path = DOCS_DIR / "inconsistencies.md"
    report_path.write_text("\n".join(report), encoding="utf-8")
    print(f"Global inconsistency report written to {report_path}")

if __name__ == "__main__":
    generate_report()

# Library Smart Curation System - Global Inconsistency Report

This report documents the architectural, API routing, and database schema discrepancies identified in the codebase.

## 1. API Route & Prefix Mismatches

The frontend application calls API paths without the SA-defined `/curation_management/backend` prefix, and uses different casing styles (kebab-case vs. snake_case).

### Frontend Calls with No Matching Backend Route
| Method | Path | Frontend File | Status |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | frontend/src/services/authService.js | 🔴 No Route |
| POST | `/catalog/upload` | frontend/src/services/catalogService.js | 🔴 No Route |
| GET | `/catalog/upload-history` | frontend/src/services/catalogService.js | 🔴 No Route |
| POST | `/catalog/validate` | frontend/src/services/catalogService.js | 🔴 No Route |
| POST | `/curation/generate-themes` | frontend/src/services/curationService.js | 🔴 No Route |
| GET | `/curation/theme-history` | frontend/src/services/curationService.js | 🔴 No Route |
| DELETE | `/curation/themes/${themeId}` | frontend/src/services/curationService.js | 🔴 No Route |
| GET | `/dashboard/monthly-stats` | frontend/src/services/dashboardService.js | 🔴 No Route |
| GET | `/dashboard/quarterly-stats` | frontend/src/services/dashboardService.js | 🔴 No Route |
| POST | `/dashboard/settings` | frontend/src/services/dashboardService.js | 🔴 No Route |
| GET | `/dashboard/settings` | frontend/src/services/dashboardService.js | 🔴 No Route |
| POST | `/proposal/create` | frontend/src/services/proposalService.js | 🔴 No Route |
| GET | `/proposal/${proposalId}` | frontend/src/services/proposalService.js | 🔴 No Route |
| PUT | `/proposal/${proposalId}` | frontend/src/services/proposalService.js | 🔴 No Route |
| POST | `/proposal/${proposalId}/match-catalog` | frontend/src/services/proposalService.js | 🔴 No Route |
| GET | `/proposal/${proposalId}/export-word` | frontend/src/services/proposalService.js | 🔴 No Route |
| GET | `/proposal/${proposalId}/export-pdf` | frontend/src/services/proposalService.js | 🔴 No Route |

### Backend Routes Never Called by Frontend
| Method | Path | Backend File | Status |
| :--- | :--- | :--- | :--- |
| POST | `/curation_management/backend/login` | backend/app/api/endpoints/auth.py | 🟡 Uncalled |
| POST | `/curation_management/backend/catalog/import` | backend/app/api/endpoints/catalog.py | 🟡 Uncalled |
| POST | `/curation_management/backend/generate_themes` | backend/app/api/endpoints/curation.py | 🟡 Uncalled |
| GET | `/curation_management/backend/history` | backend/app/api/endpoints/curation.py | 🟡 Uncalled |
| GET | `/curation_management/backend/rss/trends` | backend/app/api/endpoints/curation.py | 🟡 Uncalled |
| GET | `/curation_management/backend/proposals/{id}` | backend/app/api/endpoints/proposal.py | 🟡 Uncalled |
| PUT | `/curation_management/backend/proposals/{id}` | backend/app/api/endpoints/proposal.py | 🟡 Uncalled |
| POST | `/curation_management/backend/export_to_proposal` | backend/app/api/endpoints/proposal.py | 🟡 Uncalled |
| GET | `/curation_management/backend/proposals/{id}/export` | backend/app/api/endpoints/proposal.py | 🟡 Uncalled |

## 2. Database Schema & Migration Inconsistencies

### Database Inconsistencies
| Category | Element | Issue Description |
| :--- | :--- | :--- |
| SQLAlchemy Model Mismatch | `CatalogBook.embedding` | Declared as Column(JSON) in models.py, but should be Vector(768) according to 系統規格書.md DDL specification. |
| Alembic Migration Defect | `catalog_books table schema` | The 'embedding' column is completely missing from the 20260616_0001_create_initial_schema.py migration file. Running migrations will fail to create the vector storage. |

## 3. Actionable Remediation Checklist

### UI Developer (Frontend)
- [ ] Update Axios baseURL in `frontend/src/services/api.js` to suffix the namespace: `http://localhost:8000/curation_management/backend`.
- [ ] Align endpoint paths in service files to match the backend snake_case naming style:
  - Change `/curation/generate-themes` to `/generate_themes` in `curationService.js`.
  - Change `/curation/theme-history` to `/history` in `curationService.js`.
  - Change `/proposal/create` to `/export_to_proposal` in `curationService.js`.
  - Change `/proposal/{id}` to `/proposals/{id}` in `proposalService.js`.
  - Change `/proposal/{id}/match-catalog` to `/proposals/{id}/match` in `proposalService.js` (Verify router definition in backend).
  - Change `/catalog/upload` to `/catalog/import` in `catalogService.js`.

### Web Service & DB Developer (Backend)
- [ ] Import `pgvector.sqlalchemy.Vector` inside `backend/app/db/models.py` and modify `CatalogBook.embedding` column declaration:
  ```python
  from pgvector.sqlalchemy import Vector
  # ...
  embedding = Column(Vector(768), nullable=True)
  ```
- [ ] Create a new Alembic migration to add the missing `embedding` column of type `Vector(768)` to `catalog_books` table:
  ```bash
  # Ensure database is running
  alembic revision --autogenerate -m "add_embedding_vector_column"
  alembic upgrade head
  ```
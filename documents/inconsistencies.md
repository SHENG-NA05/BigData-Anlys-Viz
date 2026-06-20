# Library Smart Curation System - Global Inconsistency Report

This report documents the architectural, API routing, and database schema discrepancies identified in the codebase, and their final resolution status.

---

## 1. API Route & Prefix Mismatches

The frontend application and backend API paths are now fully aligned with the SA-defined `/curation_management/backend` prefix, casing styles, and endpoint signatures.

### Frontend & Backend API Alignment Status
| Method | Path | Frontend Service Helper | Status |
| :--- | :--- | :--- | :--- |
| POST | `/login` | `authService.js` | 🟢 Resolved |
| POST | `/catalog/import` | `catalogService.js` | 🟢 Resolved |
| GET | `/catalog/upload-history` | `catalogService.js` | 🟢 Resolved |
| POST | `/catalog/validate` | `catalogService.js` | 🟢 Resolved |
| POST | `/catalog/match` | `catalogService.js` | 🟢 Resolved |
| POST | `/generate_themes` | `curationService.js` | 🟢 Resolved |
| GET | `/history` | `curationService.js` | 🟢 Resolved |
| DELETE | `/themes/${themeId}` | `curationService.js` | 🟢 Resolved |
| GET | `/dashboard/monthly-stats` | `dashboardService.js` | 🟢 Resolved |
| GET | `/dashboard/quarterly-stats` | `dashboardService.js` | 🟢 Resolved |
| POST | `/dashboard/settings` | `dashboardService.js` | 🟢 Resolved |
| GET | `/dashboard/settings` | `dashboardService.js` | 🟢 Resolved |
| POST | `/export_to_proposal` | `proposalService.js` | 🟢 Resolved |
| GET | `/proposals` | `proposalService.js` | 🟢 Resolved |
| GET | `/proposals/${proposalId}` | `proposalService.js` | 🟢 Resolved |
| PUT | `/proposals/${proposalId}` | `proposalService.js` | 🟢 Resolved |
| POST | `/proposals/${proposalId}/match` | `proposalService.js` | 🟢 Resolved |
| GET | `/proposals/${proposalId}/export` | `proposalService.js` | 🟢 Resolved |

---

## 2. Database Schema & Migration Inconsistencies

All schema models and Alembic migration sequences are fully aligned.

| Category | Element | Issue Description | Status |
| :--- | :--- | :--- | :--- |
| SQLAlchemy Model Mismatch | `CatalogBook.embedding` | Was Column(JSON) in models.py, now correctly Column(Vector(768)). | 🟢 Resolved |
| Alembic Migration Defect | `catalog_books table schema` | The `embedding` column was missing from original schema. Cleaned up and applied `20260620_0002_add_catalog_embedding_vector.py` containing the pgvector column and HNSW index. | 🟢 Resolved |

---

## 3. Actionable Remediation Checklist

### UI Developer (Frontend)
- [x] Update Axios baseURL in `frontend/src/services/api.js` to suffix the namespace: `http://localhost:8000/curation_management/backend`.
- [x] Align endpoint paths in service files to match the backend snake_case naming style:
  - Change `/curation/generate-themes` to `/generate_themes` in `curationService.js`.
  - Change `/curation/theme-history` to `/history` in `curationService.js`.
  - Change `/proposal/create` to `/export_to_proposal` in `curationService.js`.
  - Change `/proposal/{id}` to `/proposals/{id}` in `proposalService.js`.
  - Change `/proposal/{id}/match-catalog` to `/proposals/{id}/match` in `proposalService.js`.
  - Change `/catalog/upload` to `/catalog/import` in `catalogService.js`.

### Web Service & DB Developer (Backend)
- [x] Import `pgvector.sqlalchemy.Vector` inside `backend/app/db/models.py` and modify `CatalogBook.embedding` column declaration:
  ```python
  from pgvector.sqlalchemy import Vector
  # ...
  embedding = Column(Vector(768), nullable=True)
  ```
- [x] Create a new Alembic migration to add the missing `embedding` column of type `Vector(768)` to `catalog_books` table:
  ```bash
  alembic upgrade head
  ```
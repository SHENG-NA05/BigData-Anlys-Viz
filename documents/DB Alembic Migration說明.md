# DB Alembic Migration 說明

本文件記錄本專案 PostgreSQL schema migration 的設定與使用方式。

## 1. 已完成項目

已新增 Alembic 設定：

```text
backend/alembic.ini
backend/alembic/env.py
backend/alembic/versions/20260616_0001_create_initial_schema.py
```

第一版 migration 會建立：

- `users`
- `catalog_books`
- `curation_themes`
- `proposals`
- `proposal_books`
- `cost_benefit_logs`
- `system_settings`
- `alembic_version`

也會建立 `pgcrypto` extension，供 `gen_random_uuid()` 使用。

## 2. 執行 Migration

請在 `backend` 目錄執行：

```bash
alembic upgrade head
```

如果要指定資料庫：

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/curation_db"
alembic upgrade head
```

查看目前版本：

```bash
alembic current
```

回復到空 schema：

```bash
alembic downgrade base
```

## 3. 建立新的 Migration

當 SQLAlchemy models 有變更時，可建立新的 migration：

```bash
alembic revision --autogenerate -m "describe schema change"
```

建立後請檢查產生的 migration 內容，再執行：

```bash
alembic upgrade head
```

## 4. 本次驗證結果

使用獨立測試資料庫：

```text
postgresql://postgres:postgres@localhost:5432/curation_migration_test
```

已驗證：

```bash
alembic upgrade head
alembic current
alembic check
alembic downgrade base
alembic upgrade head
```

驗證結果：

```text
20260616_0001 (head)
```

metadata 一致性檢查：

```text
No new upgrade operations detected.
```

升級後資料表：

```text
alembic_version
catalog_books
cost_benefit_logs
curation_themes
proposal_books
proposals
system_settings
users
```

## 5. 與 init_db.py 的差異

`init_db.py` 適合快速開發或課堂展示時直接建立資料表。

Alembic migration 適合正式專案維護，因為它可以：

- 追蹤 schema 版本。
- 記錄每次資料庫變更。
- 支援升級與降版。
- 讓不同組員的資料庫結構保持一致。

後續如果 schema 有改動，建議優先使用 Alembic migration，而不是直接修改資料庫。

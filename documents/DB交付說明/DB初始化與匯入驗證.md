# DB 初始化與匯入驗證

本文件記錄 PostgreSQL 實際初始化與館藏 CSV 匯入驗證流程。

## 1. 目前資料庫設定

後端預設連線字串：

```text
postgresql://postgres:postgres@localhost:5432/curation_db
```

如果本機帳號、密碼或資料庫位置不同，請先設定環境變數 `DATABASE_URL`。

PowerShell 範例：

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/curation_db"
```

## 2. 前置條件

本機需要先有可用的 PostgreSQL server。因 SA 已將架構升級為 PostgreSQL + pgvector，建議優先使用專案根目錄的 `docker-compose.yml` 啟動內建 pgvector 的 PostgreSQL。

可以使用其中一種方式：

- 安裝並啟動 Windows 版 PostgreSQL。
- 啟動 Docker Desktop，並使用專案提供的 pgvector PostgreSQL container。
- 使用學校或雲端提供的 PostgreSQL，只要 `DATABASE_URL` 可連線即可。

使用 Docker Compose 啟動：

```bash
docker compose up -d postgres
```

本專案 Docker Compose 設定：

```text
container: smart-curation-postgres
image: pgvector/pgvector:pg16
port: 5432 -> 5432
database: curation_db
user: postgres
password: postgres
```

此 image 已內建 PostgreSQL `vector` extension，Alembic migration 與 `init_db.py` 會執行 `CREATE EXTENSION IF NOT EXISTS vector`。

## 3. 一鍵初始化與匯入驗證

已新增腳本：

```text
backend/app/db/verify_catalog_import.py
```

執行：

```bash
python backend/app/db/verify_catalog_import.py --clear-catalog
```

這個腳本會依序執行：

1. 連線到 PostgreSQL。
2. 如果 `curation_db` 不存在，會自動建立。
3. 執行 `init_db()` 建立資料表。
4. 匯入 `data/fake_catalog_sample.csv`。
5. 查詢 `catalog_books` 總筆數。

成功時應看到類似輸出：

```text
database curation_db already exists
imported_count=50
catalog_books_total=50
```

如果第一次執行且資料庫不存在，可能會看到：

```text
created database curation_db
imported_count=50
catalog_books_total=50
```

## 4. pgvector schema 驗證

若要確認 Alembic migration 已正確升級到 pgvector schema，先執行：

```bash
cd backend
python -m alembic upgrade head
python app/db/verify_pgvector_schema.py
```

成功時應看到：

```text
vector_extension=True
embedding_type=vector(768)
hnsw_index=True
pgvector_schema=ok
```

這代表：

- PostgreSQL 已啟用 `vector` extension。
- `catalog_books.embedding` 已是 `vector(768)` 欄位。
- `idx_catalog_books_embedding` 已使用 HNSW 與 `vector_cosine_ops` 建立索引。

此驗證適用於兩種情境：

- 既有資料庫從舊 schema 執行 `alembic upgrade head` 後。
- 全新資料庫直接執行 `alembic upgrade head` 後。

若要進一步確認館藏匯入時已把 768 維 embedding 寫入 `catalog_books.embedding`，請先確認 `.env` 已設定 `GEMINI_API_KEY`，再執行館藏匯入，最後執行：

```bash
cd backend
python app/db/verify_pgvector_schema.py --require-catalog-embeddings
```

成功時會額外看到：

```text
catalog_books_total=50
catalog_books_with_embedding=50
invalid_embedding_dimensions=0
pgvector_schema=ok
```

如果 `catalog_books_with_embedding=0`，通常代表匯入時沒有可用的 `GEMINI_API_KEY`，系統已降級成只寫入書目文字欄位。

若要確認館藏匹配流程有實際使用 pgvector 查詢，請在已有館藏 embedding 後執行：

```bash
cd backend
python app/db/verify_pgvector_query.py --keywords AI 資料
```

成功時會看到至少一筆 `match_reason` 包含 `pgvector語意相似度`，最後輸出：

```text
pgvector_query=ok
```

若出現 `catalog matching did not use pgvector semantic results`，代表目前流程降級成文字匹配；常見原因是沒有 `GEMINI_API_KEY`、館藏沒有 embedding，或 pgvector schema 尚未升級完成。

## 5. 本次驗證結果

已執行：

```bash
python backend/app/db/verify_catalog_import.py --clear-catalog
```

實際輸出：

```text
database curation_db already exists
imported_count=50
catalog_books_total=50
```

已確認 PostgreSQL 中存在以下資料表：

```text
catalog_books
cost_benefit_logs
curation_themes
proposal_books
proposals
system_settings
users
```

已確認資料筆數：

```text
catalog_books 50
system_settings 3
```

已透過 FastAPI endpoint 驗證 CSV 上傳：

```text
POST /curation_management/backend/catalog/import
status_code=200
imported_count=50
catalog_books_total=50
```

## 6. 使用其他 CSV

如果要匯入其他虛擬資料：

```bash
python backend/app/db/generate_fake_catalog.py --count 5000 --output data/fake_catalog_5000.csv
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_5000.csv --clear-catalog
```

## 7. 驗證重點

執行成功後，代表以下項目通過：

- PostgreSQL 可以連線。
- `curation_db` 已建立。
- DB tables 已建立。
- `system_settings` 預設參數已寫入。
- `catalog_books` 可以寫入館藏資料。
- CSV 匯入服務可以實際寫入 PostgreSQL。
- pgvector schema 可透過 `verify_pgvector_schema.py` 確認。

## 8. 常見錯誤

### PostgreSQL 未啟動

錯誤：

```text
ERROR: Cannot connect to PostgreSQL. Make sure PostgreSQL is running and DATABASE_URL is correct.
```

處理方式：

- 確認 PostgreSQL server 已啟動。
- 確認 port 是 `5432`。
- 確認 `DATABASE_URL` 的帳號與密碼正確。

### CSV 檔案不存在

錯誤：

```text
ERROR: CSV file not found
```

處理方式：

- 確認 `data/fake_catalog_sample.csv` 存在。
- 或用 `--csv` 指定正確檔案路徑。

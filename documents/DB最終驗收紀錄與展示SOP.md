# DB 最終驗收紀錄與展示 SOP

本文件整理 DB 角色目前完成狀態、展示資料準備方式、展示當天操作流程與驗收檢查點。目標是讓組員可以用一致步驟重建展示用 PostgreSQL 資料庫，並快速確認 DB、後端 API、館藏匹配與儀表板資料是否正常。

## 1. DB 最終驗收狀態

| 項目 | 狀態 | 驗收重點 |
| --- | --- | --- |
| PostgreSQL 連線設定 | 已完成 | `backend/.env.example` 已提供 `DATABASE_URL` 範例 |
| SQLAlchemy models | 已完成 | 已建立 `users`、`catalog_books`、`curation_themes`、`proposals`、`proposal_books`、`cost_benefit_logs`、`system_settings` |
| Alembic migration | 已完成 | 已有初始 migration，可用 `DATABASE_URL` 執行升級 |
| DB 初始化 | 已完成 | `init_db.py` 可建立資料表與預設 `system_settings` |
| 館藏 CSV / Excel 匯入 | 已完成 | 可匯入 `catalog_books`，並驗證必填欄位與分類號 |
| 虛擬館藏資料 | 已完成 | 可產生 50、1000、5000、10000 筆不同規模資料 |
| 策展主題 DB 寫入 | 已完成 | `/generate_themes` 會寫入 `curation_themes` |
| 歷史紀錄查詢 | 已完成 | `/history` 從 DB 查詢 `curation_themes` |
| 企劃書草案建立 | 已完成 | `/export_to_proposal` 會建立 `proposals` |
| 館藏匹配 | 已完成 | 企劃書建立時會將匹配館藏寫入 `proposals.matched_books` |
| 企劃書查詢與更新 | 已完成 | `GET /proposals/{proposal_id}` 與 `PUT /proposals/{proposal_id}` 可操作草案 |
| 儀表板統計 | 已完成 | `/dashboard/stats` 從 `cost_benefit_logs` 聚合統計 |
| Seed data | 已完成 | `seed_demo_data.py` 可建立展示用使用者、主題、企劃書與統計紀錄 |
| 自動測試 | 已完成 | 後端測試目前涵蓋匯入、主題、企劃書、儀表板、初始化與館藏匹配 |

目前唯一需要外部確認的 DB 項目：

- RA / SA 提供的正式館藏 Excel / CSV 實際欄位名稱。

## 2. 展示資料規模

正式展示建議使用：

```text
catalog_books: 5000 筆
curation_themes: 2 到 10 筆
proposals: 2 到 10 筆
cost_benefit_logs: 4 到 50 筆
system_settings: 3 筆
users: 1 到 3 筆
```

備援規模：

| 情境 | 建議館藏筆數 |
| --- | ---: |
| 快速測試 | 50 |
| 本機開發 | 1000 |
| 正式展示 | 5000 |
| 壓力展示 | 10000 |

## 3. 展示前準備

確認 PostgreSQL 已啟動，並在 `backend/.env` 設定：

```text
PROJECT_NAME=Library Smart Curation System
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/curation_db
GEMINI_API_KEY=
```

如果還沒有 `backend/.env`，可從範例複製：

```powershell
Copy-Item backend/.env.example backend/.env
```

安裝後端套件：

```powershell
python -m pip install -r backend/requirements.txt
```

## 4. 展示操作 SOP

從專案根目錄執行以下步驟。

### 步驟 1：設定 Python import 路徑

```powershell
$env:PYTHONPATH="backend"
```

### 步驟 2：產生正式展示館藏 CSV

```powershell
python backend/app/db/generate_fake_catalog.py --count 5000 --output data/fake_catalog_demo.csv
```

### 步驟 3：初始化 PostgreSQL 並匯入館藏

```powershell
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_demo.csv --clear-catalog
```

預期輸出重點：

```text
catalog_books_total=5000
```

### 步驟 4：建立展示用 seed data

```powershell
python backend/app/db/seed_demo_data.py --skip-init
```

預期至少包含：

```text
curation_themes >= 2
proposals >= 2
cost_benefit_logs >= 4
```

### 步驟 5：啟動後端 API

```powershell
python -m uvicorn app.main:app --reload --app-dir backend
```

如果後端入口檔案或啟動方式由 Web Service 組調整，展示時以 Web Service 組提供的啟動指令為準。

## 5. 驗收指令

### 後端自動測試

```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests
```

目前預期：

```text
26 passed
```

### Python 編譯檢查

```powershell
python -m compileall backend/app
```

### DB 匯入驗證

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_demo.csv --clear-catalog
```

### Seed data 驗證

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/seed_demo_data.py --skip-init
```

## 6. API 展示檢查點

| API | 檢查重點 |
| --- | --- |
| `POST /catalog/import` | 可匯入 CSV / Excel，回傳匯入筆數 |
| `POST /generate_themes` | 會新增 `curation_themes` |
| `GET /history` | 可查到 DB 中的策展主題 |
| `POST /export_to_proposal` | 會建立 `proposals`，並寫入 `matched_books` |
| `GET /proposals/{proposal_id}` | 可查到企劃書草案與匹配館藏 |
| `PUT /proposals/{proposal_id}` | 可更新企劃書內容與狀態 |
| `GET /dashboard/stats` | 可查到累計節省工時、成本與月統計 |

## 7. 展示當天 DB 檢查清單

- [ ] PostgreSQL 已啟動。
- [ ] `backend/.env` 的 `DATABASE_URL` 正確。
- [ ] `curation_db` 可以連線。
- [ ] `catalog_books` 已匯入展示筆數，建議 5000 筆。
- [ ] `seed_demo_data.py` 已建立 demo 使用者、主題、企劃書與統計紀錄。
- [ ] `/history` 查得到策展主題。
- [ ] `/export_to_proposal` 建立的企劃書有 `matched_books`。
- [ ] `/dashboard/stats` 有統計數字。
- [ ] 後端測試在展示前最後一次執行通過。

## 8. 常見問題

### PostgreSQL 連不上

優先確認：

- PostgreSQL 服務是否啟動。
- `DATABASE_URL` 的帳號、密碼、port、database name 是否正確。
- 本機是否已有 `curation_db`，若沒有可先執行 `verify_catalog_import.py` 自動建立。

### 匯入 CSV 失敗

優先確認：

- CSV 是否存在於指定路徑。
- 欄位是否包含 `title`、`isbn`、`classification_no`。
- `classification_no` 是否符合 `540` 或 `540.123` 這類格式。

### 展示現場匯入太慢

可改用 3000 筆備援資料：

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/generate_fake_catalog.py --count 3000 --output data/fake_catalog_demo.csv
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_demo.csv --clear-catalog
python backend/app/db/seed_demo_data.py --skip-init
```

### 館藏匹配沒有結果

優先確認：

- `catalog_books` 是否有資料。
- 策展主題 `keywords` 是否和館藏標題、簡介或分類號能對應。
- AI / DB 測試可先使用 `AI`、`資料`、`城市`、`高雄` 等關鍵字。

## 9. 收尾交付物

DB 角色目前可交付：

- `documents/DB需求設計.md`
- `documents/DB未完成項目清單.md`
- `documents/DB初始化與匯入驗證.md`
- `documents/DB Alembic Migration說明.md`
- `documents/DB虛擬館藏資料生成設計.md`
- `documents/DB Seed Data執行說明.md`
- `documents/DB展示資料筆數規劃.md`
- `documents/DB最終驗收紀錄與展示SOP.md`
- `backend/app/db/init_db.py`
- `backend/app/db/generate_fake_catalog.py`
- `backend/app/db/verify_catalog_import.py`
- `backend/app/db/seed_demo_data.py`
- `backend/app/crud/`
- `backend/app/services/catalog_match_service.py`
- `backend/tests/`

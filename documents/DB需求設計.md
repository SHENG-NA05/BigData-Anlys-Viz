# DB 需求設計

本文件整理「圖書館智慧策展系統」中 DB 角色需要負責的設計與實作範圍。系統目標是讓館員可以匯入館藏資料，透過 AI 產生策展主題與企劃書，並在儀表板統計節省工時與成本。因此資料庫需要支援「使用者」、「館藏」、「AI 策展主題」、「企劃書」、「效益統計」、「系統參數」六大資料面向。

## 1. DB 角色責任

DB 主要負責以下工作：

1. 設計 PostgreSQL 資料表 schema。
2. 建立資料表之間的關聯與索引。
3. 支援 Excel / CSV 館藏資料批次匯入。
4. 提供 AI 主題、企劃書、館藏匹配結果的儲存結構。
5. 提供儀表板統計所需的查詢資料。
6. 與後端 FastAPI 串接，確保 API 需要的資料都能被正確查詢與更新。

## 2. 核心資料需求

### 2.1 使用者資料

用途：

- 記錄系統使用者。
- 支援管理者與館員角色。
- 未來可擴充 SSO 或登入權限。

資料表：`users`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | UUID | 使用者唯一 ID |
| `username` | VARCHAR(100) | 使用者帳號，需唯一 |
| `hashed_password` | VARCHAR(255) | 雜湊後密碼 |
| `role` | VARCHAR(50) | 角色，例如 `admin`、`curator` |
| `sso_provider` | VARCHAR(50) | SSO 來源，可為空 |
| `created_at` | TIMESTAMPTZ | 建立時間 |

### 2.2 館藏資料

用途：

- 儲存圖書館館藏書籍。
- 作為 AI 策展主題匹配書籍的基礎資料。
- 支援依 ISBN、分類號、書名查詢。

資料表：`catalog_books`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | SERIAL | 館藏流水號 |
| `title` | VARCHAR(255) | 書名 |
| `isbn` | VARCHAR(50) | ISBN |
| `author` | VARCHAR(255) | 作者，可為空 |
| `publisher` | VARCHAR(255) | 出版社，可為空 |
| `publication_year` | INTEGER | 出版年份，可為空 |
| `classification_no` | VARCHAR(100) | 中文圖書分類法分類號 |
| `summary` | TEXT | 書籍簡介，供 AI 或關鍵字匹配使用 |
| `source_file` | VARCHAR(255) | 匯入來源檔名 |
| `imported_at` | TIMESTAMPTZ | 匯入時間 |

建議索引：

- `isbn`
- `classification_no`
- `title`
- 如需進階搜尋，可後續加入 PostgreSQL full-text search。

### 2.3 AI 策展主題

用途：

- 儲存 AI 產生的策展主題。
- 支援歷史紀錄查詢。
- 可追蹤當初使用的關鍵字、類型與 prompt。

資料表：`curation_themes`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `theme_id` | VARCHAR(50) | 主題 ID，例如 `T001` |
| `curation_type` | VARCHAR(50) | 類型，例如 `trend`、`festival`、`custom` |
| `title` | VARCHAR(255) | 策展主題名稱 |
| `outline` | TEXT | 策展大綱 |
| `target_audience` | VARCHAR(255) | 目標受眾 |
| `keywords` | JSONB | 使用者輸入或 RSS 取得的關鍵字 |
| `prompt` | TEXT | 自訂 prompt，可為空 |
| `year` | INTEGER | 節慶年份，可為空 |
| `created_by` | UUID | 建立者，關聯 `users.id` |
| `created_at` | TIMESTAMPTZ | 建立時間 |

### 2.4 企劃書資料

用途：

- 儲存由策展主題拋轉出的企劃書草稿。
- 支援線上編輯、儲存狀態、匯出 Word / PDF。
- 儲存匹配到的館藏書籍清單。

資料表：`proposals`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `proposal_id` | VARCHAR(50) | 企劃書 ID，例如 `P001` |
| `theme_id` | VARCHAR(50) | 對應策展主題，可為空 |
| `title` | VARCHAR(255) | 企劃書標題 |
| `content` | TEXT | 企劃書 HTML 內容 |
| `matched_books` | JSONB | 匹配書籍清單 |
| `status` | VARCHAR(50) | 狀態，例如 `draft`、`completed`、`exported` |
| `created_by` | UUID | 建立者 |
| `created_at` | TIMESTAMPTZ | 建立時間 |
| `updated_at` | TIMESTAMPTZ | 更新時間 |

`matched_books` 初期可用 JSONB 儲存，方便快速開發；若後續需要分析每本書被推薦幾次，建議拆成關聯表 `proposal_books`。

### 2.5 效益統計資料

用途：

- 記錄使用者產生主題、匯出企劃書等動作。
- 提供儀表板統計累計節省工時與金額。

資料表：`cost_benefit_logs`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `log_id` | SERIAL | 日誌流水號 |
| `user_id` | UUID | 操作者 |
| `action` | VARCHAR(100) | 動作，例如 `theme_generation`、`proposal_export` |
| `target_id` | VARCHAR(50) | 對應主題或企劃書 ID，可為空 |
| `time_saved_hours` | NUMERIC(5,2) | 節省工時 |
| `cost_saved_amount` | NUMERIC(10,2) | 節省金額 |
| `timestamp` | TIMESTAMPTZ | 發生時間 |

### 2.6 系統參數

用途：

- 儲存儀表板計算用參數。
- 讓管理者未來可調整時薪與基準工時。

資料表：`system_settings`

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `setting_key` | VARCHAR(100) | 參數鍵，例如 `hourly_rate` |
| `setting_value` | VARCHAR(255) | 參數值 |
| `description` | TEXT | 參數說明 |

預設參數：

| key | value | 說明 |
| --- | --- | --- |
| `hourly_rate` | `200` | 館員平均時薪 |
| `base_theme_hours` | `4` | 人工產生策展主題所需工時 |
| `base_proposal_hours` | `16` | 人工撰寫企劃書所需工時 |

## 3. 建議資料表關聯

```text
users
  ├── curation_themes.created_by
  ├── proposals.created_by
  └── cost_benefit_logs.user_id

curation_themes
  └── proposals.theme_id

catalog_books
  └── proposals.matched_books(JSONB 初期儲存)
```

如果系統後續要分析「每本書被哪些企劃書使用」，建議新增：

```sql
CREATE TABLE proposal_books (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(50) REFERENCES proposals(proposal_id) ON DELETE CASCADE,
    catalog_book_id INTEGER REFERENCES catalog_books(id) ON DELETE CASCADE,
    match_reason TEXT NULL,
    match_score NUMERIC(5, 2) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 4. 建議 PostgreSQL DDL

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'curator',
    sso_provider VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog_books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) NOT NULL,
    author VARCHAR(255) NULL,
    publisher VARCHAR(255) NULL,
    publication_year INTEGER NULL,
    classification_no VARCHAR(100) NOT NULL,
    summary TEXT NULL,
    source_file VARCHAR(255) NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_catalog_books_isbn ON catalog_books(isbn);
CREATE INDEX idx_catalog_books_class_no ON catalog_books(classification_no);
CREATE INDEX idx_catalog_books_title ON catalog_books(title);

CREATE TABLE curation_themes (
    theme_id VARCHAR(50) PRIMARY KEY,
    curation_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    outline TEXT NOT NULL,
    target_audience VARCHAR(255) NOT NULL,
    keywords JSONB NOT NULL,
    prompt TEXT NULL,
    year INTEGER NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE proposals (
    proposal_id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) REFERENCES curation_themes(theme_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    matched_books JSONB NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cost_benefit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(50) NULL,
    time_saved_hours NUMERIC(5, 2) NOT NULL,
    cost_saved_amount NUMERIC(10, 2) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_logs_user_id ON cost_benefit_logs(user_id);
CREATE INDEX idx_cost_logs_action ON cost_benefit_logs(action);
CREATE INDEX idx_cost_logs_timestamp ON cost_benefit_logs(timestamp);

CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT NULL
);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('hourly_rate', '200', '館員平均時薪 NTD'),
('base_theme_hours', '4', '傳統人工主題發想所需工時'),
('base_proposal_hours', '16', '傳統人工撰寫企劃書所需工時')
ON CONFLICT (setting_key) DO NOTHING;
```

## 5. 館藏匯入需求

後端 API：`POST /curation_management/backend/catalog/import`

DB 需要支援：

1. 接收 Excel / CSV 解析後的資料。
2. 驗證必要欄位：書名、ISBN、分類號。
3. 可接受選填欄位：作者、出版社、出版年、簡介。
4. 批次寫入 `catalog_books`。
5. 記錄來源檔名與匯入時間。

建議匯入欄位對應：

| Excel / CSV 欄位 | DB 欄位 |
| --- | --- |
| 書名 | `title` |
| ISBN | `isbn` |
| 作者 | `author` |
| 出版社 | `publisher` |
| 出版年 | `publication_year` |
| 分類號 | `classification_no` |
| 簡介 | `summary` |

匯入規則建議：

- `title`、`isbn`、`classification_no` 不可為空。
- ISBN 可先以字串保存，避免前導 0 或 `-` 被吃掉。
- 若同一 ISBN 重複匯入，初期可允許重複；若要避免重複，可改成 `isbn` 唯一或使用 upsert。
- 大量匯入時建議使用 SQLAlchemy bulk insert 或 PostgreSQL COPY。

## 6. API 對 DB 的需求對應

| API | DB 操作 |
| --- | --- |
| `POST /generate_themes` | 新增 `curation_themes`，新增一筆 `cost_benefit_logs` |
| `GET /history` | 查詢 `curation_themes`，支援分頁與類型篩選 |
| `POST /export_to_proposal` | 新增 `proposals`，可同時寫入匹配館藏 |
| `POST /catalog/import` | 批次新增 `catalog_books` |
| `GET /proposals/{proposal_id}` | 查詢 `proposals` |
| `PUT /proposals/{proposal_id}` | 更新 `proposals.content`、`status`、`updated_at` |
| `GET /proposals/{proposal_id}/export` | 查詢企劃書內容供後端產生檔案 |
| `GET /dashboard/stats` | 聚合查詢 `cost_benefit_logs` |

## 7. 儀表板查詢設計

累計節省工時與成本：

```sql
SELECT
    COALESCE(SUM(time_saved_hours), 0) AS cumulative_hours_saved,
    COALESCE(SUM(cost_saved_amount), 0) AS cumulative_cost_saved
FROM cost_benefit_logs;
```

各動作次數：

```sql
SELECT
    action,
    COUNT(*) AS action_count
FROM cost_benefit_logs
GROUP BY action;
```

每月統計：

```sql
SELECT
    TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') AS month,
    SUM(time_saved_hours) AS hours,
    SUM(cost_saved_amount) AS cost
FROM cost_benefit_logs
GROUP BY DATE_TRUNC('month', timestamp)
ORDER BY month;
```

## 8. DB 實作優先順序

建議按照以下順序完成：

1. 建立 PostgreSQL 資料庫與基本連線。
2. 建立 `users`、`catalog_books`、`curation_themes`、`proposals`、`cost_benefit_logs`、`system_settings`。
3. 建立必要索引。
4. 實作館藏 Excel / CSV 匯入。
5. 實作 `history` 與 `dashboard/stats` 查詢。
6. 實作企劃書儲存與更新。
7. 視需求新增 `proposal_books`，將館藏匹配結果正規化。

## 9. 需要與其他角色確認的事項

### 與 RA / SA 確認

- 館藏 Excel / CSV 的實際欄位名稱。
- 企劃書需要保存哪些固定欄位，哪些只放在 HTML content。
- 儀表板節省工時計算公式是否固定。

### 與 AI 確認

- AI 回傳主題的 JSON 格式。
- 館藏匹配結果是否需要分數 `match_score`。
- `matched_books` 要只存書籍 ID，還是存完整書籍資訊快照。

### 與 Testing 確認

- 匯入空檔案、錯誤欄位、重複 ISBN 的測試案例。
- API 查詢分頁與篩選條件測試。
- 儀表板統計結果是否需要測試資料 seed。

## 10. 本專題 DB 交付物建議

DB 角色最後可交付：

1. PostgreSQL DDL 腳本。
2. Alembic migration 檔。
3. 館藏匯入欄位對照表。
4. 測試用 seed data。
5. 儀表板統計 SQL。
6. 與後端串接用的 SQLAlchemy model。

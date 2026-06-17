# DB Seed Data 執行說明

本文件說明如何建立展示與本機測試用資料。Seed 腳本可重複執行，已存在的 demo 使用者、策展主題、企劃書與效益統計紀錄不會重複建立。

## 前置條件

請先確認 PostgreSQL 已啟動，且 `backend/.env` 或環境變數已設定：

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/curation_db
```

## 執行方式

從專案根目錄執行：

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/seed_demo_data.py
```

如果資料表已經初始化完成，可以略過初始化：

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/seed_demo_data.py --skip-init
```

## Seed 內容

- `users`：建立 `demo_curator` 測試用策展人。
- `curation_themes`：建立 AI 素養、城市記憶兩筆展示主題。
- `proposals`：建立兩筆企劃書草案。
- `cost_benefit_logs`：建立主題產生與企劃書匯出的效益統計紀錄。

## 預期輸出

```text
themes_created=2
proposals_created=2
cost_benefit_logs_created=4
totals={'users': 1, 'curation_themes': 2, 'proposals': 2, 'cost_benefit_logs': 4}
```

再次執行時，新增筆數會變成 0，但 totals 仍會顯示目前資料表總筆數。

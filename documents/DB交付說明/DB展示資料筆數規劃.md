# DB 展示資料筆數規劃

本文件定義期末展示與本機驗證建議使用的資料量，讓 DB、Web Service、AI 與 Testing 可以使用一致的測試基準。

## 建議結論

正式展示建議使用：

```text
catalog_books: 5000 筆
curation_themes: 2 到 10 筆
proposals: 2 到 10 筆
cost_benefit_logs: 4 到 50 筆
system_settings: 3 筆
users: 1 到 3 筆
```

`catalog_books` 建議以 5000 筆作為展示標準，原因如下：

- 資料量足夠呈現圖書館館藏規模，不會看起來像只有少量樣本。
- CSV 匯入、查詢、館藏匹配與 dashboard 統計都能被測到。
- 對本機 PostgreSQL 與課堂展示電腦負擔仍可控。
- 若展示設備效能較弱，可降到 3000 筆；若要做壓力展示，可升到 10000 筆。

## 使用情境

| 情境 | `catalog_books` 筆數 | 用途 |
| --- | ---: | --- |
| 快速單元測試 | 50 | 驗證匯入格式與 API 流程 |
| 本機開發測試 | 1000 | 測試查詢、分頁、館藏匹配 |
| 正式展示 | 5000 | 展示接近真實館藏規模的系統流程 |
| 效能壓測 | 10000 | 測試匯入速度、查詢速度與匹配耗時 |

## 建立正式展示館藏資料

從專案根目錄執行：

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/generate_fake_catalog.py --count 5000 --output data/fake_catalog_demo.csv
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_demo.csv --clear-catalog
python backend/app/db/seed_demo_data.py --skip-init
```

執行後應確認：

- `catalog_books_total=5000`
- `users` 至少 1 筆
- `curation_themes` 至少 2 筆
- `proposals` 至少 2 筆
- `cost_benefit_logs` 至少 4 筆

## 備援方案

如果展示現場匯入 5000 筆太慢，改用：

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/generate_fake_catalog.py --count 3000 --output data/fake_catalog_demo.csv
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_demo.csv --clear-catalog
python backend/app/db/seed_demo_data.py --skip-init
```

如果需要展示大量資料處理能力，改用：

```powershell
$env:PYTHONPATH="backend"
python backend/app/db/generate_fake_catalog.py --count 10000 --output data/fake_catalog_demo_large.csv
python backend/app/db/verify_catalog_import.py --csv data/fake_catalog_demo_large.csv --clear-catalog
python backend/app/db/seed_demo_data.py --skip-init
```

## 驗收標準

- 匯入 CSV 後，`catalog_books` 筆數符合展示設定。
- `/catalog/import` 或 `verify_catalog_import.py` 可以完成匯入。
- `/export_to_proposal` 可以從館藏中產生 `matched_books`。
- `/dashboard/stats` 可以顯示 seed 的效益統計資料。
- 展示環境不使用真實個資或受版權限制的完整館藏資料。

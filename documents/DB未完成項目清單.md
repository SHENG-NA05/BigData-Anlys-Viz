# DB 未完成項目清單

本文件用來追蹤 DB 角色後續尚未完成的工作。已完成項目可將 `[ ]` 改成 `[x]`。

## 目前已完成

- [x] 建立 SQLAlchemy `Base`
- [x] 建立 DB engine、`SessionLocal`、`get_db()`
- [x] 實作主要 SQLAlchemy models
- [x] 新增 DB 初始化腳本 `init_db.py`
- [x] 修正後端 DB 設定檔 `config.py`
- [x] 確認 models 可以正常匯入

## 1. PostgreSQL 環境

- [ ] 建立 PostgreSQL 資料庫 `curation_db`
- [ ] 建立或確認資料庫使用者帳號
- [ ] 設定資料庫密碼與權限
- [ ] 確認 `DATABASE_URL` 可以連線到 PostgreSQL
- [ ] 補上 `.env` 設定範例或使用說明

## 2. 資料表初始化

- [ ] 執行 `backend/app/db/init_db.py`
- [ ] 確認 PostgreSQL 中已建立 `users`
- [ ] 確認 PostgreSQL 中已建立 `catalog_books`
- [ ] 確認 PostgreSQL 中已建立 `curation_themes`
- [ ] 確認 PostgreSQL 中已建立 `proposals`
- [ ] 確認 PostgreSQL 中已建立 `proposal_books`
- [ ] 確認 PostgreSQL 中已建立 `cost_benefit_logs`
- [ ] 確認 PostgreSQL 中已建立 `system_settings`
- [ ] 確認 `system_settings` 已寫入預設參數

## 3. Alembic Migration

- [ ] 初始化 Alembic 設定
- [ ] 設定 Alembic 使用專案的 `DATABASE_URL`
- [ ] 建立第一版 migration
- [ ] 確認 migration 可以建立所有資料表
- [ ] 補上 migration 執行方式說明

## 4. 館藏 Excel / CSV 匯入

- [ ] 確認 RA / SA 提供的館藏檔案實際欄位名稱
- [x] 建立欄位對照表
- [ ] 實作 Excel 解析
- [x] 實作 CSV 解析
- [x] 驗證必填欄位：書名、ISBN、分類號
- [x] 處理選填欄位：作者、出版社、出版年、簡介
- [x] 實作批次寫入 `catalog_books`
- [x] 記錄來源檔名 `source_file`
- [x] 回傳成功匯入筆數
- [x] 處理匯入失敗錯誤訊息

## 5. API 串接 DB

- [x] `/catalog/import` 實際寫入 `catalog_books`
- [ ] `/generate_themes` 寫入 `curation_themes`
- [ ] `/history` 從 `curation_themes` 查詢歷史紀錄
- [ ] `/export_to_proposal` 建立 `proposals`
- [ ] `/proposals/{proposal_id}` 查詢企劃書
- [ ] `/proposals/{proposal_id}` 更新企劃書
- [ ] `/dashboard/stats` 從 `cost_benefit_logs` 聚合統計

## 6. CRUD 層

- [ ] 建立 `backend/app/crud/` 目錄
- [ ] 實作館藏 CRUD
- [ ] 實作策展主題 CRUD
- [ ] 實作企劃書 CRUD
- [ ] 實作效益統計 CRUD
- [ ] 實作系統參數 CRUD

## 7. 儀表板統計

- [ ] 統計累計節省工時
- [ ] 統計累計節省金額
- [ ] 統計 AI 主題產生次數
- [ ] 統計企劃書匯出次數
- [ ] 統計每月節省工時與金額
- [ ] 確認統計結果與 `dashboard/stats` API 格式一致

## 8. 測試資料 Seed

- [ ] 建立測試用使用者
- [x] 建立測試用館藏資料
- [ ] 建立測試用策展主題
- [ ] 建立測試用企劃書
- [ ] 建立測試用效益統計紀錄
- [ ] 補上 seed data 執行方式

## 9. 資料驗證規則

- [x] 定義 ISBN 儲存格式
- [x] 決定重複 ISBN 是否允許
- [x] 處理空白欄位
- [x] 處理錯誤出版年份
- [ ] 處理錯誤分類號
- [x] 處理匯入檔案欄位缺失
- [x] 設計錯誤回報格式

## 10. DB 測試

- [x] 測試 models 匯入
- [ ] 測試資料表初始化
- [x] 測試館藏匯入成功案例
- [x] 測試館藏匯入失敗案例
- [ ] 測試歷史紀錄查詢
- [ ] 測試企劃書新增與更新
- [ ] 測試儀表板統計 SQL

## 11. 虛擬館藏資料

- [x] 規劃虛擬館藏資料分類
- [x] 建立虛擬館藏資料生成腳本
- [x] 建立虛擬館藏資料生成設計文件
- [x] 產生 sample CSV 測試資料
- [ ] 決定正式展示資料筆數
- [ ] 將虛擬館藏資料匯入 PostgreSQL
- [ ] 確認 `catalog_books` 查詢結果正常
- [ ] 使用虛擬館藏測試 AI 館藏匹配

## 建議下一步

優先處理「館藏 Excel / CSV 匯入」，因為這是 DB 角色最核心，也最容易展示成果的功能。

# DB 未完成項目清單

本文件用來追蹤 DB 角色後續尚未完成的工作。已完成項目可將 `[ ]` 改成 `[x]`。

> 2026-06-20 更新：SA 已將架構調整為 **PostgreSQL + pgvector 向量語意檢索**。下方 1 到 11 節為原本 PostgreSQL CRUD、匯入、測試與展示資料的完成狀態；第 12 節新增向量資料庫升級後仍需補齊的項目。

## 目前已完成

- [x] 建立 SQLAlchemy `Base`
- [x] 建立 DB engine、`SessionLocal`、`get_db()`
- [x] 實作主要 SQLAlchemy models
- [x] 新增 DB 初始化腳本 `init_db.py`
- [x] 修正後端 DB 設定檔 `config.py`
- [x] 確認 models 可以正常匯入

## 1. PostgreSQL 環境

- [x] 建立 PostgreSQL 資料庫 `curation_db`
- [x] 建立或確認資料庫使用者帳號
- [x] 設定資料庫密碼與權限
- [x] 確認 `DATABASE_URL` 可以連線到 PostgreSQL
- [x] 補上 `.env` 設定範例或使用說明

## 2. 資料表初始化

- [x] 補上 DB 初始化與匯入驗證腳本
- [x] 補上 DB 初始化與匯入驗證說明文件
- [x] 執行 `backend/app/db/init_db.py`
- [x] 確認 PostgreSQL 中已建立 `users`
- [x] 確認 PostgreSQL 中已建立 `catalog_books`
- [x] 確認 PostgreSQL 中已建立 `curation_themes`
- [x] 確認 PostgreSQL 中已建立 `proposals`
- [x] 確認 PostgreSQL 中已建立 `proposal_books`
- [x] 確認 PostgreSQL 中已建立 `cost_benefit_logs`
- [x] 確認 PostgreSQL 中已建立 `system_settings`
- [x] 確認 `system_settings` 已寫入預設參數

## 3. Alembic Migration

- [x] 初始化 Alembic 設定
- [x] 設定 Alembic 使用專案的 `DATABASE_URL`
- [x] 建立第一版 migration
- [x] 確認 migration 可以建立所有資料表
- [x] 驗證 migration 可以 downgrade / upgrade
- [x] 補上 migration 執行方式說明

## 4. 館藏 Excel / CSV 匯入

- [x] 確認 RA / SA 提供的館藏檔案實際欄位名稱
- [x] 建立欄位對照表
- [x] 實作 Excel 解析
- [x] 實作 CSV 解析
- [x] 驗證必填欄位：書名、ISBN、分類號
- [x] 處理選填欄位：作者、出版社、出版年、簡介
- [x] 實作批次寫入 `catalog_books`
- [x] 記錄來源檔名 `source_file`
- [x] 回傳成功匯入筆數
- [x] 處理匯入失敗錯誤訊息

## 5. API 串接 DB

- [x] `/catalog/import` 實際寫入 `catalog_books`
- [x] `/generate_themes` 寫入 `curation_themes`
- [x] `/history` 從 `curation_themes` 查詢歷史紀錄
- [x] `/export_to_proposal` 建立 `proposals`
- [x] `/proposals/{proposal_id}` 查詢企劃書
- [x] `/proposals/{proposal_id}` 更新企劃書
- [x] `/dashboard/stats` 從 `cost_benefit_logs` 聚合統計

## 6. CRUD 層

- [x] 建立 `backend/app/crud/` 目錄
- [x] 實作館藏 CRUD
- [x] 實作策展主題 CRUD
- [x] 實作企劃書 CRUD
- [x] 實作效益統計 CRUD
- [x] 實作系統參數 CRUD

## 7. 儀表板統計

- [x] 統計累計節省工時
- [x] 統計累計節省金額
- [x] 統計 AI 主題產生次數
- [x] 統計企劃書匯出次數
- [x] 統計每月節省工時與金額
- [x] 確認統計結果與 `dashboard/stats` API 格式一致

## 8. 測試資料 Seed

- [x] 建立測試用使用者
- [x] 建立測試用館藏資料
- [x] 建立測試用策展主題
- [x] 建立測試用企劃書
- [x] 建立測試用效益統計紀錄
- [x] 補上 seed data 執行方式

## 9. 資料驗證規則

- [x] 定義 ISBN 儲存格式
- [x] 決定重複 ISBN 是否允許
- [x] 處理空白欄位
- [x] 處理錯誤出版年份
- [x] 處理錯誤分類號
- [x] 處理匯入檔案欄位缺失
- [x] 設計錯誤回報格式

## 10. DB 測試

- [x] 測試 models 匯入
- [x] 測試資料表初始化
- [x] 測試館藏匯入成功案例
- [x] 測試館藏匯入失敗案例
- [x] 測試歷史紀錄查詢
- [x] 測試企劃書新增
- [x] 測試企劃書更新
- [x] 測試儀表板統計 SQL

## 11. 虛擬館藏資料

- [x] 規劃虛擬館藏資料分類
- [x] 建立虛擬館藏資料生成腳本
- [x] 建立虛擬館藏資料生成設計文件
- [x] 產生 sample CSV 測試資料
- [x] 決定正式展示資料筆數
- [x] 將虛擬館藏資料匯入 PostgreSQL
- [x] 確認 `catalog_books` 查詢結果正常
- [x] 使用虛擬館藏測試 AI 館藏匹配

## 12. pgvector 向量資料庫升級

- [x] 在 `requirements.txt` 與 `pyproject.toml` 補上 `pgvector` Python 套件，並同步更新 `uv.lock`
- [x] 將 `CatalogBook.embedding` 從 `JSON` 改為 `Vector(768)`
- [x] 在 `init_db.py` 補上 `CREATE EXTENSION IF NOT EXISTS vector`
- [x] 新增 Alembic migration，啟用 PostgreSQL `vector` extension
- [x] 在 migration 中為 `catalog_books` 新增 `embedding vector(768)` 欄位
- [x] 在 migration 中建立 `catalog_books.embedding` 的 HNSW cosine index
- [ ] 確認既有資料庫可以從舊 schema migrate 到 pgvector schema
- [ ] 確認全新資料庫可以直接透過 Alembic 建立 pgvector schema
- [ ] 補上本機 PostgreSQL + pgvector 啟動方式，例如 Docker Compose
- [ ] 確認館藏匯入時產生的 768 維 embedding 可以正確寫入 `vector(768)` 欄位
- [ ] 將館藏匹配邏輯改為使用 pgvector cosine distance 查詢，而不是在 Python 端重算候選書向量
- [ ] 補上 pgvector 查詢的單元測試或整合測試
- [ ] 補上 pgvector migration、匯入與查詢驗證說明文件

## 建議下一步

目前 DB 核心開發、測試資料、展示資料規劃、最終驗收紀錄、展示 SOP 與 RA / SA 館藏欄位確認都已完成。因 SA 新增 pgvector 架構，下一步應優先完成第 12 節：先補 `pgvector` 套件與 `Vector(768)` schema，再新增 Alembic migration 與 HNSW 索引，最後把館藏匹配改成由 PostgreSQL 執行向量相似度查詢。

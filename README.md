# 圖書館智慧策展系統 (Library Smart Curation System)

## 專案簡介
本系統是一套專為圖書館館員打造的**智慧化策展輔助平台**。
透過整合外部時事趨勢（Google Trends RSS）與大語言模型（Gemini / OpenRouter API），系統能自動推薦創新的策展主題與大綱。館員手動匯入館藏書籍後，AI 會自動進行語意匹配，確認館藏資源是否足以策畫該特展。各項條件確認後，系統可一鍵將主題大綱擴寫為完整的策展企劃書草案，館員可在線上富文本編輯器中進行微調，並直接匯出為 Word 或 PDF 檔案呈報。歷史策展紀錄皆會儲存於資料庫中，並於數據戰情室（效益分析儀表板）中直觀展示系統導入後為整體圖書館省下的累計工時與經費。

---

## 專案目錄結構
本專案採用前後端分離的架構：
* **`frontend/`**：前端 React 專案，包含側欄、AI主題發想、企劃編輯器、戰情室儀表板與館藏匯入介面。
* **`backend/`**：後端 FastAPI 專案，包含 API 路由端點、Alembic 資料庫遷移、Gemini API 連接模組與 RSS 爬蟲。
* **`data/`**：包含本機測試與展示所需的虛擬館藏範本檔案。
* **`documents/`**：系統分析（SA）與專案規劃之核心文件。

---

## 📋 專案規格與規劃文件

* 📋 **[專案任務分工表 (6人分工與進度時程)](documents/任務分工表.md)**：詳細規劃了 UI、SA、Web Service、DB、AI 與 Testing 的核心職責、交付產出與時程安排。
* ⚙️ **[系統規格書 (資料庫 Schema、API 規格與 Prompt 設計)](documents/系統規格書.md)**：包含了專案結構、PostgreSQL 資料庫 DDL、FastAPI 接口定義、Gemini API Prompt 範本及戰情室效益計算公式。
* 🔍 **[不一致報告與修復紀錄 (Global Inconsistency Report)](documents/inconsistencies.md)**：記錄了系統中已全面解決的前端路由、後端 API 前綴、資料庫 pgvector Schema 及 Alembic 遷移不一致的狀態。

---

## 🐳 Docker 容器化環境建置與啟動說明

本專案已完全整合為 Docker 容器化開發環境（包括 Frontend, Backend, 及 PostgreSQL + pgvector 向量資料庫）。

### 前置條件
* 已安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 或 Docker Engine。
* 若本機 `5432` 埠口已被現有的 PostgreSQL 佔用，可於環境變數中自訂 `POSTGRES_PORT`（例如 `5433`），系統會自動對齊。

### 1. 設置 API 金鑰與環境變數
請在啟動前設定您的 Gemini API 金鑰。您可直接編輯根目錄的 `docker-compose.yml` 檔案中的 `backend` 服務環境變數：
```yaml
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/curation_db
      GEMINI_API_KEY: your_gemini_api_key_here
```

### 2. 一鍵編譯與啟動服務
於專案根目錄下，執行以下指令：
```bash
docker compose up --build -d
```
啟動完成後，各服務入口如下：
* **前端 Web 介面**：[http://localhost:5173](http://localhost:5173)
* **後端 FastAPI Swagger API 文件**：[http://localhost:8000/docs](http://localhost:8000/docs)
* **PostgreSQL 資料庫**：對外暴露至本機 `5432` 埠口（或自訂的 `POSTGRES_PORT`）。

---

## 💾 資料庫初始化、遷移與展示資料產生

服務啟動後，請依序於後端容器內執行以下指令以完成資料庫設定。

### 步驟 1：執行資料庫遷移 (Alembic)
執行最新的資料庫遷移以建立資料表與 HNSW 餘弦相似度索引：
```bash
docker exec bigdata-curation-backend alembic upgrade head
```

### 步驟 2：匯入範本館藏並生成向量 (Gemini Embeddings)
將預設的虛擬館藏樣品匯入，系統會自動呼叫 Gemini 進行 768 維度的批次語意向量化並寫入資料庫：
```bash
docker exec bigdata-curation-backend python app/db/verify_catalog_import.py --clear-catalog
```

### 步驟 3：產生系統展示資料 (Seed Demo Data)
寫入預設的展示使用者帳號（`demo_curator` / `demo-password-for-local-testing-only`）、策展主題、企劃案範本及儀表板效益統計日誌：
```bash
docker exec bigdata-curation-backend python app/db/seed_demo_data.py --skip-init
```

---

## 🧪 系統測試與驗證

### 1. 執行後端整合與單元測試 (pytest)
```bash
docker exec bigdata-curation-backend pytest
```

### 2. 執行前端單元與 mock 測試 (Jest)
```bash
docker exec bigdata-curation-frontend npm run test
```

### 3. 驗證資料庫 pgvector 欄位與 HNSW 索引
```bash
docker exec bigdata-curation-backend python app/db/verify_pgvector_schema.py --require-catalog-embeddings
```

### 4. 驗證 pgvector 實際語意匹配查詢
```bash
docker exec bigdata-curation-backend python app/db/verify_pgvector_query.py
```
若顯示 `pgvector_query=ok` 且匹配理由包含 `pgvector語意相似度`，即代表館藏語意檢索系統運作正常。

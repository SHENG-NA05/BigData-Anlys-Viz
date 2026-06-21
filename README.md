



# 圖書館智慧策展系統 (Library Smart Curation System)

## 專案簡介
本系統是一套專為圖書館館員打造的**智慧化策展輔助平台**。
透過整合外部時事趨勢（Google Trends RSS）與大語言模型（Gemini / OpenRouter API），系統能自動推薦創新的策展主題與大綱。館員手動匯入館藏書籍後，AI 會自動進行語意匹配，確認館藏資源是否足以策畫該特展。各項條件確認後，系統可一鍵將主題大綱擴寫為完整的策展企劃書草案，館員可在線上富文本編輯器中進行微調，並直接匯出為 Word 或 PDF 檔案呈報。歷史策展紀錄皆會儲存於資料庫中，並於數據戰情室（效益分析儀表板）中直觀展示系統導入後為整體圖書館省下的累計工時與經費。

---

## 專案目錄結構
本專案採用前後端分離的架構：
* **`frontend/`**：前端 React 專案，包含側欄、AI主題發想、企劃編輯器、戰情室儀表板與館藏匯入介面。
* **`backend/`**：後端 FastAPI 專案，包含 API 路由端點、Alembic 資料庫遷移、Gemini API 連接模組與 RSS 爬蟲。
* **`documents/`**：系統分析（SA）與專案規劃之核心文件。

---

## 🚀 開發指引與專案規劃

本專案的系統規格與任務分工已由 SA 制定完成，請各開發人員點擊下方連結詳細閱讀：

* 📋 **[專案任務分工表 (6人分工與進度時程)](documents/任務分工表.md)**：詳細規劃了 UI、SA、Web Service、DB、AI 與 Testing 的核心職責、交付產出與時程安排。
* ⚙️ **[系統規格書 (資料庫 Schema、API 規格與 Prompt 設計)](documents/系統規格書.md)**：包含了專案結構、PostgreSQL 資料庫 DDL、FastAPI 接口定義、Gemini API Prompt 範本及戰情室效益計算公式。

---

## 🛠️ 環境建置與啟動說明

### 後端建置 (FastAPI)
1. 進入後端目錄：
   ```bash
   cd backend
   ```
2. 安裝 Python 依賴套件：
   ```bash
   pip install -r requirements.txt
   ```
3. 設定環境變數（建立 `.env` 檔案）：
   ```env
   DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<dbname>
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. 啟動後端開發伺服器：
   ```bash
   uvicorn main:app --reload
   ```
   * 啟動後可存取 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) 查看自動生成的 Swagger API 文件。

### 前端建置 (React)
1. 進入前端目錄：
   ```bash
   cd frontend
   ```
2. 安裝 Node.js 套件：
   ```bash
   npm install
   ```
3. 啟動前端開發伺服器：
   ```bash
   npm run dev
   ```
   * 啟動後存取 [http://localhost:5173](http://localhost:5173) 查看首頁。
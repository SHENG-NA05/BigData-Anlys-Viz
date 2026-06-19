# 前端應用開發指南

## 📦 安裝依賴

```bash
cd frontend
npm install
```

## 🚀 開發運行

```bash
npm run dev
```

應用將在 `http://localhost:5173` 運行

## 🔧 環境配置

1. 複製 `.env.example` 為 `.env`
2. 更新後端 API 地址（默認為 `http://localhost:8000`）

## 📁 項目結構

```
src/
├── components/           # React 元件
│   ├── common/          # 共用元件 (Sidebar, Layout)
│   └── curation_management/
│       └── views/       # 頁面視圖
│           ├── curation_theme_generator.jsx     # AI 發想
│           ├── proposal_editor.jsx              # 企劃編輯
│           ├── dashboard_view.jsx               # 效益分析
│           └── catalog_import.jsx               # 館藏導入
├── services/            # API 服務層
│   ├── api.js          # axios 配置
│   ├── authService.js  # 認證服務
│   ├── curationService.js  # 策展服務
│   ├── proposalService.js  # 企劃服務
│   ├── dashboardService.js # 效益分析服務
│   └── catalogService.js   # 館藏導入服務
├── App.jsx
└── main.jsx
```

## 🎨 主要功能

### 1️⃣ AI 智慧策展發想 (B-2)
- 輸入關鍵字、時事、節慶
- 調用 AI API 生成策展主題
- 支援自訂 Prompt
- 主題列表管理

### 2️⃣ 企劃書編輯與匯出 (B-3)
- 所見即所得 (WYSIWYG) 編輯器
- 支援文字格式化 (粗體、斜體、標題等)
- 匹配館藏功能
- 匯出為 Word/PDF

### 3️⃣ 效益分析戰情室 (B-4)
- 工時與經費趨勢圖表 (Line Chart)
- 工作類型分佈圖 (Pie Chart)
- 月份詳細統計 (Bar Chart)
- 參數設置 Modal

### 4️⃣ 館藏資料匯入 (B-5)
- 拖曳上傳 Excel/CSV
- 檔案驗證與進度追蹤
- 上傳歷史記錄
- 匯入範本下載

## 🔌 API 集成

所有 API 服務定義在 `src/services/` 中，包括：
- 認證 API
- AI 策展 API
- 企劃書 CRUD 與匯出 API
- 效益統計 API
- 館藏上傳 API

## 📚 技術棧

- React 18.2
- Vite (快速開發伺服器)
- Ant Design 5 (UI 組件庫)
- Recharts (圖表庫)
- React Router 6 (路由)
- Axios (HTTP 客戶端)
- TailwindCSS (樣式框架)

## ✨ 特性

- ✅ 響應式設計 (支援移動裝置)
- ✅ 國際化支援 (繁體中文)
- ✅ 錯誤處理與消息提示
- ✅ Loading 狀態管理
- ✅ 檔案拖曳上傳
- ✅ 富文本編輯
- ✅ 圖表可視化
- ✅ API 模擬數據

## 🧪 測試

前端單元測試使用 Jest (待實作)

```bash
npm test
```

## 📦 構建生產版本

```bash
npm run build
```

輸出文件在 `dist/` 目錄

## 🔗 與後端連接

確保後端服務運行在 `http://localhost:8000`

後端 API 端點參考：
- `POST /auth/login` - 登入
- `POST /curation/generate-themes` - 生成主題
- `GET /curation/theme-history` - 獲取主題歷史
- `POST /proposal/create` - 建立企劃書
- `PUT /proposal/{id}` - 更新企劃書
- `GET /proposal/{id}/export-word` - 匯出 Word
- `GET /proposal/{id}/export-pdf` - 匯出 PDF
- `GET /dashboard/stats` - 獲取效益統計
- `POST /catalog/upload` - 上傳館藏

## 📝 代碼規範

- 使用 ESLint 進行代碼檢查
- 所有組件使用函數式寫法
- 遵循 React Hooks 最佳實踐

## 🚨 常見問題

Q: 應用無法連接後端？
A: 檢查 `.env` 文件中的 `VITE_API_URL` 是否正確，確保後端服務運行

Q: 頁面樣式異常？
A: 確保 TailwindCSS 已正確配置在 `tailwind.config.js` 中

Q: 圖表無法顯示？
A: 確保 Recharts 已安裝，檢查數據格式是否正確

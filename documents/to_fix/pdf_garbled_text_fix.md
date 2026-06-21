# PDF 中文亂碼修復步驟指引

本文件說明如何解決圖書館智慧策展系統在 Docker 容器（Linux）環境下，匯出 PDF 時中文字元變成亂碼（顯示為問號或空白方塊）的問題。

---

## 核心原因分析

後端在 `backend/app/api/endpoints/proposal.py` 的中文字型註冊函式 `register_chinese_font()` 中，預設只搜尋了 Windows 系統的字型路徑（如 `C:/Windows/Fonts/msyh.ttc`）。

當系統在 Docker 容器（Debian/Ubuntu Linux）中運行時，該路徑不存在，註冊字型失敗後會 fallback 使用內建的 `Helvetica` 字型。由於 `Helvetica` 不支援中文字元，導致產生的 PDF 內容中文均顯示為亂碼。

---

## 修改步驟

### 步驟 1：修改後端 Docker 映像檔配置，安裝中文字型

編輯 [Dockerfile](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/backend/Dockerfile)，在安裝 Python 套件之前，加入 Linux 系統安裝中文字型（如 `fonts-wqy-microhei` 文泉驛微米黑）的指令：

```dockerfile
FROM python:3.12-slim

# 安裝中文字型與基礎相依套件
RUN apt-get update && apt-get install -y \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

# (其餘原有的 Dockerfile 指令保持不變)
WORKDIR /workspace
...
```

### 步驟 2：修改後端程式碼以註冊 Linux 字型路徑

編輯 [proposal.py](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/backend/app/api/endpoints/proposal.py)，在 `register_chinese_font()` 函式的 `font_paths` 陣列中，加入 Linux 安裝的文泉驛微米黑字型路徑：

```python
def register_chinese_font():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    font_paths = [
        # Windows 字型路徑（本地測試用）
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/msyh.ttf",
        "C:/Windows/Fonts/simsun.ttc",
        "C:/Windows/Fonts/simsun.ttf",
        # Linux / Docker 容器字型路徑（正式部署用）
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont("ChineseFont", path))
                return "ChineseFont"
            except Exception:
                continue
    return "Helvetica"
```

### 步驟 3：重建 Docker 容器與驗證

1. **重新編譯與啟動服務**：
   在專案根目錄下，執行以下指令以套用新的 Dockerfile 設定：
   ```bash
   docker compose build backend
   docker compose up -d backend
   ```

2. **驗證功能**：
   - 瀏覽並登入系統前端：`http://localhost:5173`
   - 前往「企劃管理中心」，選擇任一企劃書點擊「下載 PDF」。
   - 確認下載的 PDF 檔案中的中文字元是否皆已正常顯示。

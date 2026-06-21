# 時事熱門關鍵字前端串接步驟指引

本文件說明如何將後端已開發的 Google Trends / Google News 時事熱門話題 API 串接到前端介面，使館員可以直接在「AI 智慧策展發想」頁面上點擊熱門關鍵字進行發想，免去手動輸入的麻煩。

---

## 核心原因分析

1. **後端已實作 API**：後端在 [curation.py](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/backend/app/api/endpoints/curation.py) 已提供 `GET /rss/trends` 端點，透過爬蟲獲取最新熱搜詞彙。
2. **前端未串接與呈現**：
   - [curationService.js](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/frontend/src/services/curationService.js) 缺少對此端點的呼叫封裝。
   - [curation_theme_generator.jsx](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/frontend/src/components/curation_management/views/curation_theme_generator.jsx) 中僅提供靜態輸入框，未獲取此 API 資料並在畫面上渲染。

---

## 修改步驟

### 步驟 1：在前端 Service 新增 API 請求方法

編輯 [curationService.js](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/frontend/src/services/curationService.js)，在 `curationService` 物件中新增 `getTrendingKeywords` 方法：

```javascript
export const curationService = {
  // AI 生成策展主題
  generateThemes: async (keywords, currentTrends, holidays, customPrompt) => {
     ...
  },

  // 獲取歷史生成的主題
  getThemeHistory: async () => {
     ...
  },

  // 刪除主題
  deleteTheme: async (themeId) => {
     ...
  },

  // 新增：獲取 RSS 熱門時事關鍵字
  getTrendingKeywords: async () => {
    try {
      const response = await apiClient.get('/rss/trends')
      if (response.data && response.data.status === 'success') {
        return response.data.data || []
      }
      return []
    } catch (error) {
      console.error('無法取得熱搜關鍵字:', error)
      return []
    }
  }
}
```

### 步驟 2：在前端 UI 頁面中請求並呈現關鍵字標籤

編輯 [curation_theme_generator.jsx](file:///d:/Course_Materials/大數據分析與視覺化/BigData-Anlys-Viz/frontend/src/components/curation_management/views/curation_theme_generator.jsx)：

1. **新增狀態與 useEffect 獲取資料**：
   ```javascript
   const [trends, setTrends] = useState([])
   const [trendsLoading, setTrendsLoading] = useState(false)

   useEffect(() => {
     const loadTrends = async () => {
       setTrendsLoading(true)
       try {
         const data = await curationService.getTrendingKeywords()
         setTrends(data)
       } catch (error) {
         console.error(error)
       } finally {
         setTrendsLoading(false)
       }
     }
     loadTrends()
   }, [])
   ```

2. **實作點擊 Tag 自動填入/追加至輸入框的 Handler**：
   ```javascript
   const handleTagClick = (tagValue) => {
     const currentVal = form.getFieldValue('current_trends') || ''
     if (currentVal) {
       // 若已有文字，以逗號分隔追加
       form.setFieldsValue({
         current_trends: `${currentVal}、${tagValue}`
       })
     } else {
       form.setFieldsValue({
         current_trends: tagValue
       })
     }
     message.info(`已加入時事關鍵字：${tagValue}`)
   }
   ```

3. **在表單的「當前時事熱門話題」輸入框下方渲染 Tag**：
   尋找 `<Form.Item label="當前時事熱門話題" name="current_trends" ...>`，在其 `<Input.TextArea>` 下方插入渲染邏輯：
   ```jsx
   <Form.Item
     label="當前時事熱門話題"
     name="current_trends"
     rules={[{ required: true, message: '請輸入時事' }]}
   >
     <Input.TextArea
       placeholder="例如：AI 快速發展、氣候變遷"
       rows={3}
     />
     <div style={{ marginTop: '8px' }}>
       <span style={{ fontSize: '12px', color: '#8c8c8c', marginRight: '8px' }}>
         系統推薦時事標籤 (點擊可自動填入):
       </span>
       <Spin spinning={trendsLoading} size="small">
         <div style={{ marginTop: '4px', maxHeight: '100px', overflowY: 'auto', border: '1px solid #f0f0f0', padding: '6px', borderRadius: '4px' }}>
           {trends.length === 0 ? (
             <span style={{ fontSize: '12px', color: '#bfbfbf' }}>暫無推薦標籤</span>
           ) : (
             trends.map((t, idx) => (
               <Tag
                 key={idx}
                 color="blue"
                 style={{ cursor: 'pointer', marginBottom: '6px' }}
                 onClick={() => handleTagClick(t)}
               >
                 {t}
               </Tag>
             ))
           )}
         </div>
       </Spin>
     </div>
   </Form.Item>
   ```

---

## 驗證

1. 啟動前端和後端服務。
2. 開啟「AI 智慧策展發想」頁面，確認「當前時事熱門話題」輸入框下方出現藍色的推薦標籤。
3. 點擊其中任一標籤，確認是否能成功填入輸入框，且可與原先輸入的內容用「、」號進行串接。

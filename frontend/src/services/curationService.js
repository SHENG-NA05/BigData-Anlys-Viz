import apiClient from './api'

export const curationService = {
  // AI 生成策展主題
  generateThemes: async (keywords, currentTrends, holidays, customPrompt) => {
    try {
      const keywordsList = typeof keywords === 'string'
        ? keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean)
        : (Array.isArray(keywords) ? keywords : []);

      let curationType = 'trend';
      if (customPrompt) {
        curationType = 'custom';
      } else if (holidays) {
        curationType = 'festival';
      }

      let combinedPrompt = customPrompt || '';
      if (currentTrends) {
        combinedPrompt += `\n時事熱門話題：${currentTrends}`;
      }
      if (holidays) {
        combinedPrompt += `\n節慶/季節：${holidays}`;
      }

      const response = await apiClient.post('/generate_themes', {
        curation_type: curationType,
        keywords: keywordsList,
        prompt: combinedPrompt.trim(),
        year: 2026
      })

      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data.map(theme => ({
          theme_id: theme.theme_id,
          title: theme.title,
          outline: theme.outline,
          target_audience: theme.target_audience || '一般讀者',
          status: 'draft'
        }))
      }
      return []
    } catch (error) {
      throw error
    }
  },

  // 獲取歷史生成的主題
  getThemeHistory: async () => {
    try {
      const response = await apiClient.get('/history')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 刪除主題
  deleteTheme: async (themeId) => {
    try {
      const response = await apiClient.delete(`/themes/${themeId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

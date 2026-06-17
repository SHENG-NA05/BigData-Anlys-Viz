import apiClient from './api'

export const curationService = {
  // AI 生成策展主題
  generateThemes: async (keywords, currentTrends, holidays, customPrompt) => {
    try {
      const response = await apiClient.post('/curation/generate-themes', {
        keywords,
        current_trends: currentTrends,
        holidays,
        custom_prompt: customPrompt,
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取歷史生成的主題
  getThemeHistory: async () => {
    try {
      const response = await apiClient.get('/curation/theme-history')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 刪除主題
  deleteTheme: async (themeId) => {
    try {
      const response = await apiClient.delete(`/curation/themes/${themeId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

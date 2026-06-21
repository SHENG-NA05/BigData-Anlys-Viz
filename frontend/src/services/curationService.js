import apiClient from './api'

export const curationService = {
  // AI 生成策展主題
  generateThemes: async (keywords, currentTrends, holidays, customPrompt) => {
    try {
      const response = await apiClient.post('/generate_themes', {
        curation_type: 'custom',
        keywords,
        prompt: customPrompt || [currentTrends, holidays].filter(Boolean).join('；'),
        year: new Date().getFullYear(),
      })
      return response.data
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
    return { status: 'success', deleted_theme_id: themeId }
  },
}

import apiClient from './api'

const splitKeywords = (keywords) => {
  if (Array.isArray(keywords)) return keywords.filter(Boolean)
  if (typeof keywords !== 'string') return []
  return keywords
    .split(/[,，、\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

export const curationService = {
  generateThemes: async (keywords, currentTrends, holidays, customPrompt) => {
    const keywordsList = splitKeywords(keywords)
    const promptParts = [customPrompt, currentTrends && `趨勢脈絡：${currentTrends}`, holidays && `節慶或檔期：${holidays}`]
      .filter(Boolean)

    const response = await apiClient.post('/generate_themes', {
      curation_type: customPrompt ? 'custom' : holidays ? 'festival' : 'trend',
      keywords: keywordsList,
      prompt: promptParts.join('\n'),
      year: 2026,
    })

    if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
      return response.data.data.map((theme) => ({
        theme_id: theme.theme_id,
        title: theme.title,
        outline: theme.outline,
        target_audience: theme.target_audience || '一般大眾',
        keywords: theme.keywords || keywordsList,
        status: theme.status || 'draft',
      }))
    }

    return []
  },

  getThemeHistory: async () => {
    const response = await apiClient.get('/history')
    return response.data
  },

  getTrendingKeywords: async () => {
    const response = await apiClient.get('/rss/trends')
    return response.data?.status === 'success' ? response.data.data || [] : []
  },

  deleteTheme: async (themeId) => {
    const response = await apiClient.delete(`/themes/${themeId}`)
    return response.data
  },
}

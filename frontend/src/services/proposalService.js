import apiClient from './api'

export const proposalService = {
  // 創建企劃書
  createProposal: async (themeId, title, content) => {
    try {
      const response = await apiClient.post('/proposal/create', {
        theme_id: themeId,
        title,
        content,
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取企劃書詳情
  getProposal: async (proposalId) => {
    try {
      const response = await apiClient.get(`/proposal/${proposalId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 更新企劃書
  updateProposal: async (proposalId, content) => {
    try {
      const response = await apiClient.put(`/proposal/${proposalId}`, { content })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 匹配館藏
  matchCatalog: async (proposalId) => {
    try {
      const response = await apiClient.post(`/proposal/${proposalId}/match-catalog`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 導出為 Word
  exportToWord: async (proposalId) => {
    try {
      const response = await apiClient.get(`/proposal/${proposalId}/export-word`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 導出為 PDF
  exportToPdf: async (proposalId) => {
    try {
      const response = await apiClient.get(`/proposal/${proposalId}/export-pdf`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
}

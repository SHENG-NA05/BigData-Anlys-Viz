import apiClient from './api'

export const proposalService = {
  // 創建企劃書
  createProposal: async (themeId, title, content) => {
    try {
      const response = await apiClient.post('/export_to_proposal', {
        theme_id: themeId,
        title,
        outline: content || '',
        target_audience: 'All Readers',
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取企劃書詳情
  getProposal: async (proposalId) => {
    try {
      const response = await apiClient.get(`/proposals/${proposalId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 更新企劃書
  updateProposal: async (proposalId, content) => {
    try {
      const response = await apiClient.put(`/proposals/${proposalId}`, {
        title: 'Updated Proposal',
        content,
        status: 'draft',
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 匹配館藏
  matchCatalog: async (proposalId) => {
    try {
      const response = await apiClient.post(`/proposals/${proposalId}/match`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 導出為 Word
  exportToWord: async (proposalId) => {
    try {
      const response = await apiClient.get(`/proposals/${proposalId}/export?format=docx`, {
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
      const response = await apiClient.get(`/proposals/${proposalId}/export?format=pdf`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
}

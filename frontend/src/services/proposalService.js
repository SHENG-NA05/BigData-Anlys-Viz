import apiClient from './api'

export const proposalService = {
  // 創建企劃書
  createProposal: async (themeId, title, content) => {
    try {
      const response = await apiClient.post('/export_to_proposal', {
        theme_id: themeId,
        title,
        outline: content,
        target_audience: '一般大眾、青少年、科技與環境關注族群',
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
        title: '感知擴張：延伸人類的邊界',
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
    return {
      status: 'success',
      proposal_id: proposalId,
      data: [],
    }
  },

  // 導出為 Word
  exportToWord: async (proposalId) => {
    return new Blob([`Proposal ${proposalId}`], { type: 'application/msword' })
  },

  // 導出為 PDF
  exportToPdf: async (proposalId) => {
    return new Blob([`Proposal ${proposalId}`], { type: 'application/pdf' })
  },
}

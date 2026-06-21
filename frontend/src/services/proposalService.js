import apiClient from './api'

export const proposalService = {
  createProposal: async (themeId, title, content) => {
    const response = await apiClient.post('/export_to_proposal', {
      theme_id: themeId,
      title,
      outline: content || '',
      target_audience: '一般大眾',
    })
    return response.data
  },

  getProposal: async (proposalId) => {
    const response = await apiClient.get(`/proposals/${proposalId}`)
    return response.data
  },

  updateProposal: async (proposalId, title, content, status = 'draft') => {
    const response = await apiClient.put(`/proposals/${proposalId}`, {
      title,
      content,
      status,
    })
    return response.data
  },

  matchCatalog: async (proposalId) => {
    const response = await apiClient.post(`/proposals/${proposalId}/match`)
    return response.data
  },

  exportToWord: async (proposalId) => {
    const response = await apiClient.get(`/proposals/${proposalId}/export?format=docx`, {
      responseType: 'blob',
    })
    return response.data
  },

  exportToPdf: async (proposalId) => {
    const response = await apiClient.get(`/proposals/${proposalId}/export?format=pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  listProposals: async () => {
    const response = await apiClient.get('/proposals')
    return response.data
  },
}

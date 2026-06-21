import apiClient from './api'

export const catalogService = {
  uploadCatalog: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/catalog/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getUploadHistory: async () => {
    const response = await apiClient.get('/catalog/upload-history')
    return response.data || []
  },

  validateFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/catalog/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  matchCatalog: async (keywords, limit = 5) => {
    const response = await apiClient.post('/catalog/match', { keywords, limit })
    return response.data
  },
}

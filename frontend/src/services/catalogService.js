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
    try {
      const response = await apiClient.get('/catalog/upload-history')
      return response.data || []
    } catch (error) {
      return []
    }
  },

  validateFile: async (file) => {
    const isSupported = /\.(csv|xlsx)$/i.test(file.name)
    if (!isSupported) {
      return { status: 'error', detail: '請上傳 CSV 或 XLSX 檔案' }
    }
    return { status: 'success', detail: '檔案格式可匯入' }
  },

  matchCatalog: async (keywords, limit = 5) => {
    const response = await apiClient.post('/catalog/match', { keywords, limit })
    return response.data
  },
}

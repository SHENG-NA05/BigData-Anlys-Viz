import apiClient from './api'

export const catalogService = {
  // 上傳館藏文件
  uploadCatalog: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post('/catalog/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取上傳歷史
  getUploadHistory: async () => {
    try {
      const response = await apiClient.get('/catalog/upload-history')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 驗證上傳文件
  validateFile: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post('/catalog/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },
}

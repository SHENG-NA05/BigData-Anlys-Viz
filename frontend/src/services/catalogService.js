import apiClient from './api'

export const catalogService = {
  // 上傳館藏文件
  uploadCatalog: async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post('/catalog/import', formData, {
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
    return { data: [] }
  },

  // 驗證上傳文件
  validateFile: async (file) => {
    if (file.name.toLowerCase().endsWith('.xlsx')) {
      return {
        status: 'success',
        records_count: 0,
      }
    }

    const text = await file.text()
    const [headerLine = '', ...rows] = text.split(/\r?\n/).filter(Boolean)
    const headers = headerLine.split(',').map((item) => item.trim().toLowerCase())
    const required = ['title', 'isbn', 'classification_no']
    const missing = required.filter((item) => !headers.includes(item))
    if (missing.length > 0) {
      throw new Error(`缺少必要欄位：${missing.join(', ')}`)
    }
    return {
      status: 'success',
      records_count: rows.length,
    }
  },
}

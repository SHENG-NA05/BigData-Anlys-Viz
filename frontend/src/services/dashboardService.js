import apiClient from './api'

export const dashboardService = {
  // 獲取效益統計數據
  getDashboardStats: async (timeRange = 'month') => {
    try {
      const response = await apiClient.get('/dashboard/stats', {
        params: { time_range: timeRange },
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取月份統計
  getMonthlyStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/monthly-stats')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取季度統計
  getQuarterlyStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/quarterly-stats')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 更新時薪和基準時數設置
  updateSettings: async (hourlyRate, baseHours) => {
    try {
      const response = await apiClient.post('/dashboard/settings', {
        hourly_rate: hourlyRate,
        base_hours: baseHours,
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // 獲取當前設置
  getSettings: async () => {
    try {
      const response = await apiClient.get('/dashboard/settings')
      return response.data
    } catch (error) {
      throw error
    }
  },
}

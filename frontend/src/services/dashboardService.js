import apiClient from './api'

export const dashboardService = {
  // 獲取效益統計數據
  getDashboardStats: async () => {
    const response = await apiClient.get('/dashboard/stats')
    return response.data
  },

  // 獲取月份統計
  getMonthlyStats: async () => {
    const response = await apiClient.get('/dashboard/monthly-stats')
    return response.data
  },

  // 獲取季度統計
  getQuarterlyStats: async () => {
    const response = await apiClient.get('/dashboard/quarterly-stats')
    return response.data
  },

  // 更新時薪和基準時數設置
  updateSettings: async (hourlyRate, baseHours) => {
    const response = await apiClient.post('/dashboard/settings', {
      hourly_rate: hourlyRate,
      base_hours: baseHours,
    })
    return response.data
  },

  // 獲取當前設置
  getSettings: async () => {
    const response = await apiClient.get('/dashboard/settings')
    return response.data
  },
}

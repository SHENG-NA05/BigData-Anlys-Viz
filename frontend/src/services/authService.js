import apiClient from './api'

export const authService = {
  // 模擬登入 (SSO)
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/login', { username, password })
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
      }
      return response.data
    } catch (error) {
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('access_token')
  },
}

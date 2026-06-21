import apiClient from './api'

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/login', { username, password })
    const token = response.data?.access_token
    if (!token) throw new Error('登入回應缺少 access token')
    localStorage.setItem('access_token', token)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },

  isLoggedIn: () => Boolean(localStorage.getItem('access_token')),
}

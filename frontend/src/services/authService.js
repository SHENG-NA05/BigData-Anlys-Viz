import apiClient from './api'

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/login', { username, password })
    const token = response.data?.access_token || response.data?.token
    if (token) {
      localStorage.setItem('access_token', token)
    }
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },

  isLoggedIn: () => Boolean(localStorage.getItem('access_token')),
}

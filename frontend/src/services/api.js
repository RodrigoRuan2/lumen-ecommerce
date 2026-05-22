import axios from 'axios'

// Em dev: usa proxy do Vite ('/api' -> localhost:5000)
// Em prod: usa VITE_API_URL (ex: https://lumen-backend.onrender.com/api)
const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('auth-change'))
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

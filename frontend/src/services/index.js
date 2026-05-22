import api from './api'

export const authService = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (data) =>
    api.put('/auth/profile', data),
}

export const productService = {
  getProducts: (params) =>
    api.get('/products', { params }),
  
  getProductById: (id) =>
    api.get(`/products/${id}`),
  
  createProduct: (data) =>
    api.post('/products', data),
  
  updateProduct: (id, data) =>
    api.put(`/products/${id}`, data),
  
  deleteProduct: (id) =>
    api.delete(`/products/${id}`),
}

export const orderService = {
  createOrder: (data) =>
    api.post('/orders', data),
  
  getOrders: () =>
    api.get('/orders'),
  
  getOrderById: (id) =>
    api.get(`/orders/${id}`),
  
  updateOrderStatus: (id, status) =>
    api.put(`/orders/${id}`, { status }),
}

import { createClient } from '@supabase/supabase-js'

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined')
  }
  return { supabaseUrl, supabaseServiceRoleKey }
}

// Cliente usado apenas para auth (signIn, createUser, getUser)
let _authClient = null
function getAuthClient() {
  if (!_authClient) {
    const { supabaseUrl, supabaseServiceRoleKey } = getConfig()
    _authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return _authClient
}

export const supabaseServer = {
  get auth() { return getAuthClient().auth }
}

// Chamadas REST diretas ao banco
async function restFetch(path, options = {}) {
  const { supabaseUrl, supabaseServiceRoleKey } = getConfig()
  const url = `${supabaseUrl}/rest/v1/${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': supabaseServiceRoleKey,
      'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) return { data: null, error: { message: data?.message || text } }
  return { data, error: null }
}

// ============ PROFILES ============
export async function getProfileById(id) {
  const { data, error } = await restFetch(
    `profiles?id=eq.${encodeURIComponent(id)}&select=id,email,name,role,phone,address&limit=1`
  )
  const profile = Array.isArray(data) ? (data[0] || null) : data
  return { data: profile, error }
}

export async function upsertUserProfile({ id, email, name, role = 'customer', phone = null, address = null }) {
  const body = JSON.stringify({ id, email, name, role, phone, address })
  const { error } = await restFetch('profiles', {
    method: 'POST',
    body,
    prefer: 'resolution=merge-duplicates,return=minimal'
  })
  return error
}

export async function updateUserProfile(id, updates) {
  const body = JSON.stringify(updates)
  const { data, error } = await restFetch(
    `profiles?id=eq.${encodeURIComponent(id)}&select=id,email,name,role,phone,address`,
    { method: 'PATCH', body }
  )
  const profile = Array.isArray(data) ? (data[0] || null) : data
  return { data: profile, error }
}

export async function listProfiles() {
  const { data, error } = await restFetch('profiles?select=id,email,name,role,phone,address&order=name.asc')
  return { data: Array.isArray(data) ? data : [], error }
}

export async function updateProfileRole(id, role) {
  const { data, error } = await restFetch(
    `profiles?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ role }) }
  )
  const profile = Array.isArray(data) ? (data[0] || null) : data
  return { data: profile, error }
}

export async function listPendingSellerApplications() {
  const { data, error } = await listProfiles()
  if (error) return { data: [], error }
  const pending = (data || []).filter(p => p?.address?.sellerApplication?.status === 'pending')
  return { data: pending, error: null }
}

export async function reviewSellerApplication(id, decision, reviewerId) {
  // decision: 'approved' | 'rejected'
  const { data: profile, error: getErr } = await getProfileById(id)
  if (getErr || !profile) return { data: null, error: getErr || { message: 'Perfil não encontrado' } }

  const application = profile.address?.sellerApplication
  if (!application || application.status !== 'pending') {
    return { data: null, error: { message: 'Aplicação não está pendente' } }
  }

  const newAddress = {
    ...(profile.address || {}),
    sellerApplication: {
      ...application,
      status: decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId
    }
  }

  const updates = { address: newAddress }
  if (decision === 'approved') updates.role = 'seller'

  const { data, error } = await updateUserProfile(id, updates)
  return { data, error }
}

// ============ PRODUCTS ============
const PRODUCT_SELECT = 'id,name,description,price,original_price,category,images,stock,rating,num_reviews,seller_id,is_active,created_at,profiles:seller_id(name,email,address)'

function normalizeProduct(p) {
  if (!p) return null
  const storeRaw = p.profiles?.address?.store
  const store = storeRaw?.enabled ? storeRaw : null
  return {
    _id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    originalPrice: p.original_price ? parseFloat(p.original_price) : undefined,
    category: p.category,
    images: p.images || [],
    stock: p.stock || 0,
    rating: parseFloat(p.rating) || 0,
    numReviews: p.num_reviews || 0,
    sellerId: p.profiles ? { _id: p.seller_id, name: p.profiles.name, email: p.profiles.email, store } : p.seller_id,
    isActive: p.is_active !== false,
    createdAt: p.created_at
  }
}

export async function listProducts({ category, search, limit = 100 } = {}) {
  const params = new URLSearchParams()
  params.set('select', PRODUCT_SELECT)
  params.set('is_active', 'eq.true')
  params.set('order', 'created_at.desc')
  params.set('limit', String(limit))
  if (category) params.set('category', `eq.${category}`)
  if (search) {
    // Remove qualquer char que possa quebrar a sintaxe PostgREST (parens, virgula, ponto,
    // wildcards, etc). Mantém apenas letras (incluindo acentuadas), dígitos e espaço.
    const term = String(search).replace(/[^\p{L}\p{N}\s]/gu, '').trim().slice(0, 80)
    if (term) {
      params.set('or', `(name.ilike.*${term}*,description.ilike.*${term}*)`)
    }
  }
  const { data, error } = await restFetch(`products?${params.toString()}`)
  const products = Array.isArray(data) ? data.map(normalizeProduct) : []
  return { data: products, error }
}

export async function getProductById(id) {
  const { data, error } = await restFetch(
    `products?id=eq.${encodeURIComponent(id)}&select=${PRODUCT_SELECT}&limit=1`
  )
  const product = Array.isArray(data) ? (data[0] ? normalizeProduct(data[0]) : null) : null
  return { data: product, error }
}

export async function createProduct({ name, description, price, originalPrice, category, images, stock, sellerId }) {
  const body = JSON.stringify({
    name, description,
    price: parseFloat(price),
    original_price: originalPrice ? parseFloat(originalPrice) : null,
    category,
    images: images || [],
    stock: parseInt(stock) || 0,
    seller_id: sellerId,
    is_active: true
  })
  const { data, error } = await restFetch(`products?select=${PRODUCT_SELECT}`, { method: 'POST', body })
  const product = Array.isArray(data) ? (data[0] ? normalizeProduct(data[0]) : null) : null
  return { data: product, error }
}

export async function updateProduct(id, updates) {
  const mapped = {}
  if (updates.name !== undefined) mapped.name = updates.name
  if (updates.description !== undefined) mapped.description = updates.description
  if (updates.price !== undefined) mapped.price = parseFloat(updates.price)
  if (updates.originalPrice !== undefined) mapped.original_price = updates.originalPrice ? parseFloat(updates.originalPrice) : null
  if (updates.category !== undefined) mapped.category = updates.category
  if (updates.images !== undefined) mapped.images = updates.images
  if (updates.stock !== undefined) mapped.stock = parseInt(updates.stock) || 0
  if (updates.isActive !== undefined) mapped.is_active = updates.isActive

  const { data, error } = await restFetch(
    `products?id=eq.${encodeURIComponent(id)}&select=${PRODUCT_SELECT}`,
    { method: 'PATCH', body: JSON.stringify(mapped) }
  )
  const product = Array.isArray(data) ? (data[0] ? normalizeProduct(data[0]) : null) : null
  return { data: product, error }
}

export async function deleteProduct(id) {
  const { error } = await restFetch(
    `products?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', prefer: 'return=minimal' }
  )
  return { error }
}

export async function decrementStock(id, quantity) {
  const { data: current } = await restFetch(`products?id=eq.${encodeURIComponent(id)}&select=stock&limit=1`)
  const currentStock = Array.isArray(current) && current[0] ? current[0].stock : 0
  const newStock = Math.max(0, currentStock - quantity)
  return updateProduct(id, { stock: newStock })
}

// ============ ORDERS ============
function normalizeOrder(o) {
  if (!o) return null
  return {
    _id: o.id,
    userId: o.user_id,
    items: o.items || [],
    totalPrice: parseFloat(o.total_price),
    shippingAddress: o.shipping_address || {},
    paymentMethod: o.payment_method,
    status: o.status || 'pendente',
    createdAt: o.created_at
  }
}

export async function createOrder({ userId, items, totalPrice, shippingAddress, paymentMethod }) {
  const body = JSON.stringify({
    user_id: userId,
    items,
    total_price: totalPrice,
    shipping_address: shippingAddress,
    payment_method: paymentMethod,
    status: 'pendente'
  })
  const { data, error } = await restFetch('orders', { method: 'POST', body })
  const order = Array.isArray(data) ? (data[0] ? normalizeOrder(data[0]) : null) : null
  return { data: order, error }
}

export async function getOrderByIdRaw(id) {
  const { data, error } = await restFetch(
    `orders?id=eq.${encodeURIComponent(id)}&limit=1`
  )
  const order = Array.isArray(data) ? (data[0] ? normalizeOrder(data[0]) : null) : null
  return { data: order, error }
}

export async function listOrdersByUser(userId) {
  const { data, error } = await restFetch(
    `orders?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`
  )
  const orders = Array.isArray(data) ? data.map(normalizeOrder) : []
  return { data: orders, error }
}

export async function listAllOrders() {
  const { data, error } = await restFetch('orders?order=created_at.desc&limit=200')
  const orders = Array.isArray(data) ? data.map(normalizeOrder) : []
  return { data: orders, error }
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await restFetch(
    `orders?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  )
  const order = Array.isArray(data) ? (data[0] ? normalizeOrder(data[0]) : null) : null
  return { data: order, error }
}

export async function verifySupabaseToken(accessToken) {
  const { data, error } = await getAuthClient().auth.getUser(accessToken)
  return { data, error }
}

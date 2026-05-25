import * as db from '../services/supabaseClient.js';
import { mockProducts } from '../services/mockData.js';

// Cache simples em memória (60s) para reduzir latência da listagem
const cache = { products: null, time: 0 }
const CACHE_TTL = 60_000

export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query
    const cacheKey = `${category || ''}:${search || ''}`

    // Cache só para listagem sem filtros
    if (!category && !search && cache.products && Date.now() - cache.time < CACHE_TTL) {
      return res.json({ success: true, products: cache.products, cached: true })
    }

    const { data, error } = await db.listProducts({ category, search })

    // Mocks filtrados pelos mesmos criterios
    let filteredMocks = mockProducts
    if (category) filteredMocks = filteredMocks.filter(p => p.category === category)
    if (search) {
      const s = search.toLowerCase()
      filteredMocks = filteredMocks.filter(p =>
        p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)
      )
    }

    if (error) {
      // DB indisponivel — retorna apenas mocks
      return res.json({ success: true, products: filteredMocks, fallback: true })
    }

    // Combina DB + mocks (deduplicado por nome) — vale com OU sem filtro
    const products = [
      ...data,
      ...filteredMocks.filter(m => !data.find(d => d.name === m.name))
    ]

    if (!category && !search) {
      cache.products = products
      cache.time = Date.now()
    }

    res.json({ success: true, products })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params

    // Mock products têm IDs simples (1, 2, etc)
    const mock = mockProducts.find(p => p._id === id)
    if (mock) return res.json({ success: true, product: mock })

    const { data, error } = await db.getProductById(id)
    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' })
    }
    res.json({ success: true, product: data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, images, stock } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Nome, preço e categoria são obrigatórios' })
    }

    const { data, error } = await db.createProduct({
      name, description, price, originalPrice, category, images, stock,
      sellerId: req.user.id
    })

    if (error) return res.status(500).json({ success: false, message: error.message })

    cache.products = null  // Invalida cache
    res.status(201).json({ success: true, product: data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    // Verifica se é dono ou admin
    const { data: existing } = await db.getProductById(id)
    if (!existing) return res.status(404).json({ success: false, message: 'Produto não encontrado' })

    const ownerId = typeof existing.sellerId === 'object' ? existing.sellerId._id : existing.sellerId
    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Você não tem permissão para editar este produto' })
    }

    const { data, error } = await db.updateProduct(id, req.body)
    if (error) return res.status(500).json({ success: false, message: error.message })

    cache.products = null
    res.json({ success: true, product: data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    const { data: existing } = await db.getProductById(id)
    if (!existing) return res.status(404).json({ success: false, message: 'Produto não encontrado' })

    const ownerId = typeof existing.sellerId === 'object' ? existing.sellerId._id : existing.sellerId
    if (req.user.role !== 'admin' && ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sem permissão' })
    }

    const { error } = await db.deleteProduct(id)
    if (error) return res.status(500).json({ success: false, message: error.message })

    cache.products = null
    res.json({ success: true, message: 'Produto deletado' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

import * as db from '../services/supabaseClient.js';
import { mockProducts } from '../services/mockData.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Carrinho vazio' })
    }

    let totalPrice = 0
    const orderItems = []

    for (const item of items) {
      // Tenta mock primeiro (IDs simples)
      let product = mockProducts.find(p => p._id === item.productId)
      if (!product) {
        const { data } = await db.getProductById(item.productId)
        product = data
      }

      if (!product) {
        return res.status(404).json({ success: false, message: `Produto não encontrado` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Estoque insuficiente para ${product.name}` })
      }

      const price = product.price
      totalPrice += price * item.quantity
      const sellerId = typeof product.sellerId === 'object' ? product.sellerId?._id : product.sellerId
      orderItems.push({
        productId: item.productId,
        name: product.name,
        image: product.images?.[0]?.url || null,
        quantity: item.quantity,
        price,
        sellerId
      })
    }

    const { data: order, error } = await db.createOrder({
      userId: req.user.id,
      items: orderItems,
      totalPrice,
      shippingAddress,
      paymentMethod: paymentMethod || 'credit_card'
    })

    if (error) {
      // Fallback se a tabela orders não existir
      return res.status(201).json({
        success: true,
        order: {
          _id: 'order-' + Date.now(),
          userId: req.user.id,
          items: orderItems,
          totalPrice,
          shippingAddress,
          paymentMethod: paymentMethod || 'credit_card',
          status: 'pendente',
          createdAt: new Date().toISOString()
        },
        warning: 'Pedido em memória — tabela orders não configurada'
      })
    }

    // Decrementa estoque dos produtos no Supabase (não mexe nos mocks)
    for (const item of orderItems) {
      const isMock = mockProducts.find(p => p._id === item.productId)
      if (!isMock) {
        await db.decrementStock(item.productId, item.quantity)
      }
    }

    res.status(201).json({ success: true, order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getOrders = async (req, res) => {
  try {
    const { data, error } = await db.listOrdersByUser(req.user.id)
    if (error) return res.status(500).json({ success: false, message: error.message })
    res.json({ success: true, orders: data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getSellerOrders = async (req, res) => {
  try {
    const { data, error } = await db.listAllOrders()
    if (error) return res.status(500).json({ success: false, message: error.message })
    const sellerOrders = data.filter(order =>
      order.items.some(item => item.sellerId === req.user.id)
    )
    res.json({ success: true, orders: sellerOrders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { data: order, error } = await db.getOrderByIdRaw(req.params.id)
    if (error) return res.status(500).json({ success: false, message: error.message })
    if (!order) return res.status(404).json({ success: false, message: 'Pedido não encontrado' })
    if (req.user.role !== 'admin' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Sem permissão' })
    }
    res.json({ success: true, order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pendente', 'processando', 'enviado', 'entregue', 'cancelado', 'solicitando_devolucao', 'devolvido']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido' })
    }

    const { data: order, error: fetchError } = await db.getOrderByIdRaw(req.params.id)
    if (fetchError) return res.status(500).json({ success: false, message: fetchError.message })
    if (!order) return res.status(404).json({ success: false, message: 'Pedido não encontrado' })

    if (req.user.role === 'customer') {
      // Comprador pode cancelar se pedido ainda não enviado
      if (status === 'cancelado') {
        if (!['pendente', 'processando'].includes(order.status)) {
          return res.status(403).json({ success: false, message: 'Só é possível cancelar pedidos pendentes ou em processamento' })
        }
      }
      // Comprador pode marcar como entregue se foi enviado
      else if (status === 'entregue') {
        if (order.status !== 'enviado') {
          return res.status(403).json({ success: false, message: 'Só é possível confirmar entrega de pedidos enviados' })
        }
      }
      // Comprador pode solicitar devolução se entregue ou enviado
      else if (status === 'solicitando_devolucao') {
        if (!['enviado', 'entregue'].includes(order.status)) {
          return res.status(403).json({ success: false, message: 'Devolução só é possível após envio ou entrega' })
        }
      }
      else {
        return res.status(403).json({ success: false, message: 'Sem permissão para este status' })
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Este pedido não pertence a você' })
      }
    } else if (req.user.role === 'seller') {
      const sellerStatuses = ['processando', 'enviado', 'devolvido']
      if (!sellerStatuses.includes(status)) {
        return res.status(403).json({ success: false, message: 'Vendedores só podem marcar pedidos como Processando, Enviado ou Devolvido' })
      }
      const ownsItem = order.items.some(item => item.sellerId === req.user.id)
      if (!ownsItem) {
        return res.status(403).json({ success: false, message: 'Sem permissão para este pedido' })
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Sem permissão' })
    }

    const { data, error } = await db.updateOrderStatus(req.params.id, status)
    if (error) return res.status(500).json({ success: false, message: error.message })
    res.json({ success: true, order: data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

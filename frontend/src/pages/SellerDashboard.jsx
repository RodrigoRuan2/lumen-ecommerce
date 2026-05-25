import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { capitalize, formatCEP, fetchAddressByCEP, sanitizeName, sanitizeUF, formatBRL } from '../utils/formatters.js'
import DeliveryMap from '../components/DeliveryMap.jsx'
import Icon from '../components/Icon.jsx'
import '../styles/Dashboard.css'
import '../styles/Map.css'

const EMPTY_STORE = {
  enabled: false,
  name: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  country: 'Brasil'
}

const CATEGORIES = ['Eletrônicos', 'Roupas', 'Livros', 'Casa', 'Esportes', 'Beleza', 'Alimentos']

const ORDER_STATUS = {
  pendente: { label: 'Pendente', color: 'status-pending' },
  processando: { label: 'Processando', color: 'status-processing' },
  enviado: { label: 'Enviado', color: 'status-shipped' },
  entregue: { label: 'Entregue', color: 'status-delivered' },
  cancelado: { label: 'Cancelado', color: 'status-cancelled' }
}

export default function SellerDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('produtos')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '',
    category: 'Eletrônicos', stock: '', images: [{ url: '', alt: '' }]
  })
  const [saving, setSaving] = useState(false)
  const [store, setStore] = useState(EMPTY_STORE)
  const [storeSaving, setStoreSaving] = useState(false)
  const [storeMessage, setStoreMessage] = useState('')
  const [personalAddress, setPersonalAddress] = useState(null)
  const [cepLoading, setCepLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    if (user?.role !== 'seller' && user?.role !== 'admin') { navigate('/'); return }
    loadProducts()
    loadStore()
  }, [])

  useEffect(() => {
    if (tab === 'pedidos' && orders.length === 0) loadOrders()
  }, [tab])

  const loadStore = async () => {
    try {
      const res = await api.get('/auth/profile')
      const addr = res.data.user?.address || {}
      setPersonalAddress(addr)
      if (addr.store) {
        setStore({ ...EMPTY_STORE, ...addr.store })
      }
    } catch {
      console.error('Erro ao carregar loja')
    }
  }

  const handleStoreCEPChange = async (value) => {
    const masked = formatCEP(value)
    setStore(prev => ({ ...prev, zipCode: masked }))
    if (masked.replace(/\D/g, '').length === 8) {
      setCepLoading(true)
      const addr = await fetchAddressByCEP(masked)
      setCepLoading(false)
      if (addr) {
        setStore(prev => ({
          ...prev,
          street: addr.street || prev.street,
          neighborhood: addr.neighborhood || prev.neighborhood,
          city: addr.city,
          state: addr.state,
          country: addr.country
        }))
      }
    }
  }

  const handleSaveStore = async (e) => {
    e.preventDefault()
    setStoreSaving(true)
    setStoreMessage('')
    try {
      const newAddress = { ...(personalAddress || {}), store }
      const res = await api.put('/auth/profile', { address: newAddress })
      if (res.data.success) {
        setPersonalAddress(newAddress)
        setStoreMessage('Loja salva com sucesso!')
        setTimeout(() => setStoreMessage(''), 2500)
      }
    } catch {
      setStoreMessage('Erro ao salvar')
    } finally {
      setStoreSaving(false)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/products?limit=100')
      if (res.data.success) {
        const mine = res.data.products.filter(p =>
          p.sellerId === user.id || p.sellerId?._id === user.id || p.sellerId?.id === user.id
        )
        setProducts(mine)
      }
    } catch {
      console.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => setForm({ name: '', description: '', price: '', originalPrice: '', category: 'Eletrônicos', stock: '', images: [{ url: '', alt: '' }] })

  const handleEdit = (product) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category,
      stock: product.stock,
      images: product.images?.length ? product.images : [{ url: '', alt: '' }]
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        stock: parseInt(form.stock),
        images: form.images[0]?.url ? form.images : []
      }
      if (editing) {
        const res = await api.put(`/products/${editing._id}`, payload)
        if (res.data.success) {
          setProducts(prev => prev.map(p => p._id === editing._id ? res.data.product : p))
        }
      } else {
        const res = await api.post('/products', payload)
        if (res.data.success) setProducts(prev => [res.data.product, ...prev])
      }
      setShowForm(false)
      setEditing(null)
      resetForm()
    } catch {
      alert('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este produto?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
    } catch {
      alert('Erro ao excluir')
    }
  }

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await api.get('/orders/seller')
      if (res.data.success) setOrders(res.data.orders)
    } catch {
      console.error('Erro ao carregar pedidos')
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status })
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o))
    } catch {
      alert('Erro ao atualizar status do pedido')
    }
  }

  const totalStock = products.reduce((s, p) => s + p.stock, 0)
  const avgPrice = products.length ? products.reduce((s, p) => s + p.price, 0) / products.length : 0

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Minha Loja</h1>
          <p className="dash-subtitle">Gerencie seus produtos, {user.name?.split(' ')[0]}</p>
        </div>
        <span className="badge-seller">Vendedor</span>
      </div>

      <div className="dashboard-tabs">
        <button className={tab === 'produtos' ? 'tab-active' : ''} onClick={() => setTab('produtos')}>
          <Icon name="package" size={16} /> Meus Produtos
        </button>
        <button className={tab === 'pedidos' ? 'tab-active' : ''} onClick={() => setTab('pedidos')}>
          <Icon name="cart" size={16} /> Pedidos
        </button>
        <button className={tab === 'loja' ? 'tab-active' : ''} onClick={() => setTab('loja')}>
          <Icon name="storeFront" size={16} /> Minha Loja
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-tone-blue">
          <div className="stat-icon-box"><Icon name="package" size={20} /></div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">Produtos Ativos</div>
        </div>
        <div className="stat-card stat-tone-purple">
          <div className="stat-icon-box"><Icon name="storeFront" size={20} /></div>
          <div className="stat-value">{totalStock}</div>
          <div className="stat-label">Unidades em Estoque</div>
        </div>
        <div className="stat-card stat-tone-green">
          <div className="stat-icon-box"><Icon name="tag" size={20} /></div>
          <div className="stat-value">{formatBRL(avgPrice)}</div>
          <div className="stat-label">Preço Médio</div>
        </div>
      </div>

      {tab === 'pedidos' && (
        <div className="dash-section">
          <h2>Pedidos dos Meus Produtos</h2>
          {ordersLoading ? (
            <div className="dash-loading"><div className="spinner" />Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="cart" size={48} strokeWidth={1.4} /></div>
              <h3>Nenhum pedido ainda</h3>
              <p>Quando alguém comprar seus produtos, os pedidos aparecerão aqui</p>
            </div>
          ) : (
            <div className="seller-orders-list">
              {orders.map(order => {
                const myItems = order.items.filter(item => item.sellerId === user.id)
                const statusInfo = ORDER_STATUS[order.status] || { label: order.status, color: '' }
                return (
                  <div key={order._id} className="seller-order-card">
                    <div className="seller-order-header">
                      <div className="seller-order-meta">
                        <span className="order-id">Pedido #{order._id?.slice(-8)?.toUpperCase()}</span>
                        <span className="order-date">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                      <span className={`status-badge ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>

                    <div className="seller-order-items">
                      {myItems.map((item, i) => (
                        <div key={i} className="order-item-row">
                          <span className="order-item-name">{item.name || 'Produto'}</span>
                          <span className="order-item-qty">× {item.quantity}</span>
                          <span className="order-item-price">{formatBRL(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="seller-order-footer">
                      <span className="order-shipping">
                        Entrega: {order.shippingAddress?.city}, {order.shippingAddress?.state}
                      </span>
                      <div className="seller-order-action">
                        {order.status === 'pendente' && (
                          <button className="btn-primary" onClick={() => handleUpdateOrderStatus(order._id, 'processando')}>
                            Confirmar Pedido
                          </button>
                        )}
                        {order.status === 'processando' && (
                          <button className="btn-primary" onClick={() => handleUpdateOrderStatus(order._id, 'enviado')}>
                            Marcar como Enviado
                          </button>
                        )}
                        {order.status === 'enviado' && (
                          <span className="order-awaiting">Aguardando confirmação de entrega</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'loja' && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>Informações da Loja Física</h2>
          </div>

          <form onSubmit={handleSaveStore} className="store-form">
            {storeMessage && (
              <div className={storeMessage.includes('Erro') ? 'error-message' : 'success-message'}>
                {storeMessage}
              </div>
            )}

            <label className="store-toggle">
              <input
                type="checkbox"
                checked={store.enabled}
                onChange={e => setStore({ ...store, enabled: e.target.checked })}
              />
              <span>
                <strong>Exibir loja física publicamente</strong>
                <small>Quando ativo, o endereço aparece na página dos seus produtos</small>
              </span>
            </label>

            <div className="form-group">
              <label>Nome da Loja</label>
              <input
                type="text"
                value={store.name}
                onChange={e => setStore({ ...store, name: e.target.value })}
                placeholder="Ex: Loja do João"
              />
            </div>

            <div className="form-group">
              <label>CEP {cepLoading && <span className="cep-loading">buscando...</span>}</label>
              <input
                type="text"
                value={store.zipCode}
                onChange={e => handleStoreCEPChange(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                maxLength={9}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Rua / Logradouro</label>
                <input
                  type="text"
                  value={store.street}
                  onChange={e => setStore({ ...store, street: e.target.value })}
                  placeholder="Rua das Flores"
                />
              </div>
              <div className="form-group">
                <label>Número</label>
                <input
                  type="text"
                  value={store.number}
                  onChange={e => setStore({ ...store, number: e.target.value })}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Complemento</label>
                <input
                  type="text"
                  value={store.complement}
                  onChange={e => setStore({ ...store, complement: e.target.value })}
                  placeholder="Sala 2, 2º andar..."
                />
              </div>
              <div className="form-group">
                <label>Bairro</label>
                <input
                  type="text"
                  value={store.neighborhood}
                  onChange={e => setStore({ ...store, neighborhood: e.target.value })}
                  placeholder="Centro"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Cidade</label>
                <input
                  type="text"
                  value={store.city}
                  onChange={e => setStore({ ...store, city: sanitizeName(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <input
                  type="text"
                  value={store.state}
                  onChange={e => setStore({ ...store, state: sanitizeUF(e.target.value) })}
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            {(store.city || store.zipCode) && (
              <div className="store-map-preview">
                <label className="map-label">Pré-visualização</label>
                <DeliveryMap address={store} height={260} />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={storeSaving}>
                {storeSaving ? 'Salvando...' : 'Salvar Loja'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'produtos' && (
      <div className="dash-section">
        <div className="dash-section-header">
          <h2>Meus Produtos</h2>
          <button className="btn-primary" onClick={() => { setEditing(null); resetForm(); setShowForm(true) }}>
            + Novo Produto
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{editing ? 'Editar Produto' : 'Cadastrar Produto'}</h3>
              <form onSubmit={handleSubmit} className="product-form">
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Nome do Produto *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: capitalize(e.target.value) })}
                      placeholder="Ex: Camiseta Premium"
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoria *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Descrição *</label>
                  <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o produto..." />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Preço de Venda *</label>
                    <input type="number" step="0.01" min="0" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Preço Original</label>
                    <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label>Estoque *</label>
                    <input type="number" min="0" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Imagem do Produto</label>
                  <div className="image-helper">
                    <input
                      value={form.images[0]?.url || ''}
                      onChange={e => setForm({ ...form, images: [{ url: e.target.value, alt: form.name }] })}
                      placeholder="Cole aqui a URL da imagem (https://...)"
                    />
                    <a
                      href={`https://unsplash.com/s/photos/${encodeURIComponent(form.name || form.category)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-unsplash"
                    >
                      Buscar no Unsplash ↗
                    </a>
                  </div>
                  <div className="image-tips">
                    <strong>Como conseguir uma URL boa:</strong>
                    <ol>
                      <li>Clique em <em>"Buscar no Unsplash"</em> acima (abre numa nova aba)</li>
                      <li>Escolha uma foto, clique nela e depois com o botão direito na imagem</li>
                      <li>Selecione <em>"Copiar endereço da imagem"</em></li>
                      <li>Cole no campo acima — o preview aparece logo abaixo</li>
                    </ol>
                    <p className="image-tip-alt">Alternativas: <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a> · <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer">Pixabay</a></p>
                  </div>
                  {form.images[0]?.url && (
                    <div className="img-preview-box">
                      <img
                        src={form.images[0].url}
                        alt="preview"
                        className="img-preview"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
                        onLoad={e => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none' }}
                      />
                      <div className="img-error" style={{ display: 'none' }}>
                        URL inválida ou imagem não carregou
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dash-loading"><div className="spinner" />Carregando...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="emptyBox" size={48} strokeWidth={1.4} /></div>
            <h3>Nenhum produto cadastrado</h3>
            <p>Comece adicionando seu primeiro produto</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>+ Adicionar Produto</button>
          </div>
        ) : (
          <div className="products-seller-grid">
            {products.map(p => (
              <div key={p._id} className="seller-product-card">
                <img
                  src={p.images?.[0]?.url || 'https://placehold.co/200x150/e2e8f0/94a3b8?text=Produto'}
                  alt={p.name}
                  className="seller-product-img"
                />
                <div className="seller-product-info">
                  <h4>{p.name}</h4>
                  <span className="badge">{p.category}</span>
                  <div className="seller-product-price">{formatBRL(p.price)}</div>
                  <div className={`seller-product-stock ${p.stock === 0 ? 'stock-zero' : ''}`}>
                    Estoque: {p.stock}
                  </div>
                </div>
                <div className="seller-product-actions">
                  <button className="btn-edit" onClick={() => handleEdit(p)}>Editar</button>
                  <button className="btn-danger-sm" onClick={() => handleDelete(p._id)}>Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  )
}

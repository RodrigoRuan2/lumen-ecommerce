import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api.js'
import { capitalize, formatBRL } from '../utils/formatters.js'
import Icon from '../components/Icon.jsx'
import '../styles/Dashboard.css'

const TABS = [
  { name: 'Visão Geral', icon: 'grid' },
  { name: 'Produtos', icon: 'package' },
  { name: 'Pedidos', icon: 'cart' },
  { name: 'Usuários', icon: 'users' },
  { name: 'Aprovações', icon: 'clock' },
]

const ROLE_LABELS = {
  customer: 'Cliente',
  seller: 'Vendedor',
  admin: 'Admin'
}

const ORDER_STATUS = {
  pendente: 'Pendente',
  processando: 'Processando',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [applicationActioning, setApplicationActioning] = useState(null)

  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '', description: '', price: '', originalPrice: '', category: 'Eletrônicos', stock: '',
    images: [{ url: '', alt: '' }]
  })

  const [authChecked, setAuthChecked] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await api.get('/auth/profile')
        if (res.data?.user?.role !== 'admin') {
          navigate('/')
          return
        }
        setAuthChecked(true)
      } catch {
        navigate('/')
      }
    }
    verifyAdmin()
  }, [])

  useEffect(() => {
    if (authChecked) loadData()
  }, [authChecked, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 0 || activeTab === 1) {
        const res = await api.get('/products?limit=100')
        if (res.data.success) setProducts(res.data.products)
      }
      if (activeTab === 0 || activeTab === 2) {
        const res = await api.get('/admin/orders')
        if (res.data.success) setOrders(res.data.orders)
      }
      if (activeTab === 0 || activeTab === 3) {
        const res = await api.get('/admin/users')
        if (res.data.success) setUsers(res.data.users)
      }
      if (activeTab === 0 || activeTab === 4) {
        const res = await api.get('/admin/seller-applications')
        if (res.data.success) setApplications(res.data.applications)
      }
    } catch (err) {
      console.error('Erro ao carregar dados admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Deseja excluir este produto?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
    } catch {
      alert('Erro ao excluir produto')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || '',
      category: product.category,
      stock: product.stock,
      images: product.images?.length ? product.images : [{ url: '', alt: '' }]
    })
    setShowProductForm(true)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : undefined,
        stock: parseInt(productForm.stock)
      }
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload)
        if (res.data.success) {
          setProducts(prev => prev.map(p => p._id === editingProduct._id ? res.data.product : p))
        }
      } else {
        const res = await api.post('/products', payload)
        if (res.data.success) setProducts(prev => [res.data.product, ...prev])
      }
      setShowProductForm(false)
      setEditingProduct(null)
    } catch {
      alert('Erro ao salvar produto')
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status })
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o))
    } catch {
      alert('Erro ao atualizar status')
    }
  }

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } catch {
      alert('Erro ao atualizar role')
    }
  }

  const handleReviewApplication = async (userId, decision) => {
    setApplicationActioning(userId + decision)
    try {
      await api.post(`/admin/seller-applications/${userId}/${decision}`)
      setApplications(prev => prev.filter(a => a.id !== userId))
    } catch {
      alert('Erro ao processar aplicação')
    } finally {
      setApplicationActioning(null)
    }
  }

  if (!authChecked) return <div className="dash-loading"><div className="spinner" /> Verificando acesso...</div>

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalUsers: users.length,
    revenue: orders.reduce((s, o) => s + (o.totalPrice || 0), 0)
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Painel do Administrador</h1>
        <span className="badge-admin">Admin</span>
      </div>

      <div className="dashboard-tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab.name}
            className={activeTab === i ? 'tab-active' : ''}
            onClick={() => setActiveTab(i)}
          >
            <Icon name={tab.icon} size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {loading && <div className="dash-loading"><div className="spinner" /> Carregando...</div>}

      {activeTab === 0 && (
        <div className="stats-grid">
          <div className="stat-card stat-tone-blue">
            <div className="stat-icon-box"><Icon name="package" size={20} /></div>
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Produtos</div>
          </div>
          <div className="stat-card stat-tone-purple">
            <div className="stat-icon-box"><Icon name="cart" size={20} /></div>
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Pedidos</div>
          </div>
          <div className="stat-card stat-tone-pink">
            <div className="stat-icon-box"><Icon name="users" size={20} /></div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Usuários</div>
          </div>
          <div className="stat-card stat-tone-green">
            <div className="stat-icon-box"><Icon name="money" size={20} /></div>
            <div className="stat-value">{formatBRL(stats.revenue)}</div>
            <div className="stat-label">Receita Total</div>
          </div>
          {applications.length > 0 && (
            <div className="stat-card stat-card-warning" onClick={() => setActiveTab(4)} style={{ cursor: 'pointer' }}>
              <div className="stat-icon-box"><Icon name="clock" size={20} /></div>
              <div className="stat-value">{applications.length}</div>
              <div className="stat-label">Aplicações Pendentes</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 4 && (
        <div className="dash-section">
          <h2>Aprovação de Vendedores</h2>
          {applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="check" size={42} strokeWidth={1.8} /></div>
              <h3>Nenhuma aplicação pendente</h3>
              <p>Quando alguém se cadastrar como vendedor, aparecerá aqui</p>
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Data da Solicitação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td><strong>{app.name || '-'}</strong></td>
                      <td>{app.email}</td>
                      <td>
                        {app.address?.sellerApplication?.requestedAt
                          ? new Date(app.address.sellerApplication.requestedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                          : '-'}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn-primary"
                            disabled={applicationActioning === app.id + 'approve'}
                            onClick={() => handleReviewApplication(app.id, 'approve')}
                          >
                            {applicationActioning === app.id + 'approve' ? '...' : '✓ Aprovar'}
                          </button>
                          <button
                            className="btn-danger-sm"
                            disabled={applicationActioning === app.id + 'reject'}
                            onClick={() => handleReviewApplication(app.id, 'reject')}
                          >
                            {applicationActioning === app.id + 'reject' ? '...' : '✕ Rejeitar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>Gerenciar Produtos</h2>
            <button className="btn-primary" onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', originalPrice: '', category: 'Eletrônicos', stock: '', images: [{ url: '', alt: '' }] }); setShowProductForm(true) }}>
              + Novo Produto
            </button>
          </div>

          {showProductForm && (
            <div className="modal-overlay" onClick={() => setShowProductForm(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <form onSubmit={handleProductSubmit} className="product-form">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Nome</label>
                      <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: capitalize(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Categoria</label>
                      <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                        {['Eletrônicos', 'Roupas', 'Livros', 'Casa', 'Esportes', 'Beleza', 'Alimentos'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Descrição</label>
                    <textarea required value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} />
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Preço (R$)</label>
                      <input type="number" step="0.01" required value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Preço Original</label>
                      <input type="number" step="0.01" value={productForm.originalPrice} onChange={e => setProductForm({ ...productForm, originalPrice: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Estoque</label>
                      <input type="number" required value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Imagem do Produto</label>
                    <div className="image-helper">
                      <input value={productForm.images[0]?.url || ''} onChange={e => setProductForm({ ...productForm, images: [{ url: e.target.value, alt: productForm.name }] })} placeholder="Cole a URL da imagem (https://...)" />
                      <a href={`https://unsplash.com/s/photos/${encodeURIComponent(productForm.name || productForm.category)}`} target="_blank" rel="noopener noreferrer" className="btn-unsplash">Unsplash ↗</a>
                    </div>
                    {productForm.images[0]?.url && (
                      <div className="img-preview-box">
                        <img src={productForm.images[0].url} alt="preview" className="img-preview" onError={e => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowProductForm(false)}>Cancelar</button>
                    <button type="submit" className="btn-primary">{editingProduct ? 'Salvar' : 'Criar'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="table-product">
                        <img src={p.images?.[0]?.url || 'https://placehold.co/40x40/e2e8f0/94a3b8?text=P'} alt={p.name} />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td><span className="badge">{p.category}</span></td>
                    <td>{formatBRL(p.price)}</td>
                    <td>
                      <span className={p.stock > 0 ? 'badge-success' : 'badge-danger'}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => handleEditProduct(p)}>Editar</button>
                        <button className="btn-danger-sm" onClick={() => handleDeleteProduct(p._id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="dash-section">
          <h2>Gerenciar Pedidos</h2>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Atualizar</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td className="id-cell">#{o._id?.slice(-6)?.toUpperCase()}</td>
                    <td>{formatBRL(o.totalPrice)}</td>
                    <td><span className={`status-badge status-${o.status}`}>{ORDER_STATUS[o.status] || o.status}</span></td>
                    <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      <select
                        value={o.status}
                        onChange={e => handleUpdateOrderStatus(o._id, e.target.value)}
                        className="status-select"
                      >
                        {Object.entries(ORDER_STATUS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="empty-row">Nenhum pedido encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="dash-section">
          <h2>Gerenciar Usuários</h2>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Alterar Função</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.name || '-'}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td>
                      <select
                        value={u.role}
                        onChange={e => handleUpdateUserRole(u.id, e.target.value)}
                        className="status-select"
                        disabled={u.id === user.id}
                      >
                        <option value="customer">Cliente</option>
                        <option value="seller">Vendedor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="empty-row">Nenhum usuário encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api.js'
import { formatPhone, formatCEP, fetchAddressByCEP } from '../utils/formatters.js'
import DeliveryMap from '../components/DeliveryMap.jsx'
import Icon from '../components/Icon.jsx'
import '../styles/Profile.css'
import '../styles/Map.css'

const ORDER_STATUS = {
  pendente: { label: 'Pendente', color: 'status-pending' },
  processando: { label: 'Processando', color: 'status-processing' },
  enviado: { label: 'Enviado', color: 'status-shipped' },
  entregue: { label: 'Entregue', color: 'status-delivered' },
  cancelado: { label: 'Cancelado', color: 'status-cancelled' },
  solicitando_devolucao: { label: 'Solicitando Devolução', color: 'status-return' },
  devolvido: { label: 'Devolvido', color: 'status-cancelled' }
}

function OrderCard({ order, onStatusChange }) {
  const [showMap, setShowMap] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const handleAction = async (newStatus) => {
    setActionLoading(true)
    try {
      const res = await api.put(`/orders/${order._id}`, { status: newStatus })
      if (res.data.success) onStatusChange(order._id, newStatus)
    } catch {
      console.error('Erro ao atualizar pedido')
    } finally {
      setActionLoading(false)
    }
  }

  const canCancel = ['pendente', 'processando'].includes(order.status)
  const canConfirmDelivery = order.status === 'enviado'
  const canRequestReturn = ['enviado', 'entregue'].includes(order.status)
  const hasActions = canCancel || canConfirmDelivery || canRequestReturn

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div>
          <span className="order-id">Pedido #{order._id?.slice(-8)?.toUpperCase()}</span>
          <span className="order-date">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data indisponível'}
          </span>
        </div>
        <span className={`status-badge ${ORDER_STATUS[order.status]?.color || ''}`}>
          {ORDER_STATUS[order.status]?.label || order.status}
        </span>
      </div>

      <div className="order-items-list">
        {order.items?.map((item, i) => (
          <div key={i} className="order-item-row">
            <span className="order-item-name">{item.name || item.productId?.name || 'Produto'}</span>
            <span className="order-item-qty">× {item.quantity}</span>
            <span className="order-item-price">
              R$ {(item.price * item.quantity)?.toFixed(2) || '0.00'}
            </span>
          </div>
        ))}
      </div>

      <div className="order-card-footer">
        <div className="order-shipping">
          <span>Entrega: {order.shippingAddress?.street}, {order.shippingAddress?.city}</span>
        </div>
        <div className="order-total">
          Total: <strong>R$ {order.totalPrice?.toFixed(2)}</strong>
        </div>
      </div>

      {hasActions && (
        <div className="order-actions">
          {canCancel && (
            <button className="btn-order-action btn-cancel" onClick={() => handleAction('cancelado')} disabled={actionLoading}>
              Cancelar Pedido
            </button>
          )}
          {canConfirmDelivery && (
            <button className="btn-order-action btn-deliver" onClick={() => handleAction('entregue')} disabled={actionLoading}>
              Confirmar Entrega
            </button>
          )}
          {canRequestReturn && (
            <button className="btn-order-action btn-return" onClick={() => handleAction('solicitando_devolucao')} disabled={actionLoading}>
              Solicitar Devolução
            </button>
          )}
        </div>
      )}

      <button className="btn-toggle-map" onClick={() => setShowMap(s => !s)}>
        {showMap ? '✕ Ocultar mapa' : '📍 Ver no mapa'}
      </button>

      {showMap && (
        <div className="order-map">
          <DeliveryMap address={order.shippingAddress} height={220} />
        </div>
      )}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab')
    return ['perfil', 'pedidos', 'endereco'].includes(t) ? t : 'perfil'
  })
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: { zipCode: '', street: '', number: '', complement: '', neighborhood: '', buildingName: '', city: '', state: '', country: '' } })
  const [fullAddress, setFullAddress] = useState({}) // preserva sub-campos (savedCard, store, sellerApplication)
  const [sellerApplication, setSellerApplication] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (tab === 'pedidos' && orders.length === 0) fetchOrders()
  }, [tab])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/profile')
      const { user } = res.data
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          zipCode: user.address?.zipCode || '',
          street: user.address?.street || '',
          number: user.address?.number || '',
          complement: user.address?.complement || '',
          neighborhood: user.address?.neighborhood || '',
          buildingName: user.address?.buildingName || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          country: user.address?.country || ''
        }
      })
      setFullAddress(user.address || {})
      setSellerApplication(user.address?.sellerApplication || null)
    } catch {
      setError('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders')
      if (res.data.success) setOrders(res.data.orders)
    } catch {
      console.error('Erro ao carregar pedidos')
    }
  }

  const [cepLoading, setCepLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      setProfile(prev => ({ ...prev, phone: formatPhone(value) }))
      return
    }
    if (name === 'address.zipCode') {
      const masked = formatCEP(value)
      setProfile(prev => ({ ...prev, address: { ...prev.address, zipCode: masked } }))
      if (masked.replace(/\D/g, '').length === 8) {
        autocompleteCEP(masked)
      }
      return
    }
    if (name.startsWith('address.')) {
      const field = name.split('.')[1]
      setProfile(prev => ({ ...prev, address: { ...prev.address, [field]: value } }))
    } else {
      setProfile(prev => ({ ...prev, [name]: value }))
    }
  }

  const autocompleteCEP = async (cep) => {
    setCepLoading(true)
    const addr = await fetchAddressByCEP(cep)
    setCepLoading(false)
    if (addr) {
      setProfile(prev => ({
        ...prev,
        address: {
          ...prev.address,
          street: addr.street || prev.address.street,
          neighborhood: addr.neighborhood || prev.address.neighborhood,
          city: addr.city,
          state: addr.state,
          country: addr.country
        }
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      // Mescla campos editados com os preservados (savedCard, store, sellerApplication, etc)
      const mergedAddress = { ...fullAddress, ...profile.address }
      const res = await api.put('/auth/profile', { name: profile.name, phone: profile.phone, address: mergedAddress })
      if (res.data.success) {
        setMessage('Perfil atualizado com sucesso!')
        const stored = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...stored, name: profile.name }))
      } else {
        setError(res.data.message || 'Erro ao salvar')
      }
    } catch {
      setError('Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{(profile.name || user.name || 'U')[0].toUpperCase()}</div>
        <div>
          <h1>{profile.name || user.name || 'Meu Perfil'}</h1>
          <p className="profile-role">
            <span className={`role-badge role-${user.role}`}>{user.role}</span>
            {user.role === 'seller' && <Link to="/vendedor" className="btn-dash-link">Ir para Minha Loja →</Link>}
            {user.role === 'admin' && <Link to="/admin" className="btn-dash-link">Ir para Admin →</Link>}
          </p>
        </div>
      </div>

      {sellerApplication && (
        <div className={`seller-app-banner seller-app-${sellerApplication.status}`}>
          {sellerApplication.status === 'pending' && (
            <>
              <span className="seller-app-icon">⏳</span>
              <div>
                <strong>Aplicação de vendedor em análise</strong>
                <p>Seu pedido para se tornar vendedor foi recebido em {new Date(sellerApplication.requestedAt).toLocaleDateString('pt-BR')}. Aguarde a aprovação do administrador.</p>
              </div>
            </>
          )}
          {sellerApplication.status === 'approved' && user.role === 'seller' && (
            <>
              <span className="seller-app-icon">✓</span>
              <div>
                <strong>Aplicação aprovada</strong>
                <p>Você agora é um vendedor. <Link to="/vendedor">Acessar minha loja →</Link></p>
              </div>
            </>
          )}
          {sellerApplication.status === 'rejected' && (
            <>
              <span className="seller-app-icon">✕</span>
              <div>
                <strong>Aplicação não aprovada</strong>
                <p>Sua solicitação para se tornar vendedor não foi aprovada nesta análise.</p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="profile-tabs">
        <button className={tab === 'perfil' ? 'tab-active' : ''} onClick={() => setTab('perfil')}>
          <Icon name="user" size={16} /> Meus Dados
        </button>
        <button className={tab === 'pedidos' ? 'tab-active' : ''} onClick={() => setTab('pedidos')}>
          <Icon name="package" size={16} /> Meus Pedidos
        </button>
        <button className={tab === 'endereco' ? 'tab-active' : ''} onClick={() => setTab('endereco')}>
          <Icon name="pin" size={16} /> Endereço
        </button>
      </div>

      {loading ? (
        <div className="profile-loading"><div className="spinner" /> Carregando...</div>
      ) : (
        <>
          {(tab === 'perfil' || tab === 'endereco') && (
            <div className="profile-card">
              {message && <div className="success-message">{message}</div>}
              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit}>
                {tab === 'perfil' && (
                  <>
                    <div className="form-group">
                      <label>Nome Completo</label>
                      <input type="text" name="name" value={profile.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={profile.email} readOnly className="input-readonly" />
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input type="text" name="phone" value={profile.phone} onChange={handleChange} placeholder="(11) 99999-9999" inputMode="numeric" maxLength={15} />
                    </div>
                  </>
                )}

                {tab === 'endereco' && (
                  <>
                    <div className="form-group">
                      <label>CEP {cepLoading && <span className="cep-loading">buscando...</span>}</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={profile.address.zipCode}
                        onChange={handleChange}
                        placeholder="00000-000"
                        inputMode="numeric"
                        maxLength={9}
                      />
                      <small className="form-hint">Digite o CEP para preenchimento automático</small>
                    </div>
                    <div className="form-row form-row-street">
                      <div className="form-group">
                        <label>Rua / Endereço</label>
                        <input type="text" name="address.street" value={profile.address.street} onChange={handleChange} placeholder="Rua das Flores" />
                      </div>
                      <div className="form-group form-group-number">
                        <label>Número</label>
                        <input type="text" name="address.number" value={profile.address.number} onChange={handleChange} placeholder="123" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Complemento</label>
                        <input type="text" name="address.complement" value={profile.address.complement} onChange={handleChange} placeholder="Apto 42" />
                      </div>
                      <div className="form-group">
                        <label>Bairro</label>
                        <input type="text" name="address.neighborhood" value={profile.address.neighborhood} onChange={handleChange} placeholder="Centro" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Nome do Condomínio <span className="form-optional">(opcional)</span></label>
                      <input type="text" name="address.buildingName" value={profile.address.buildingName} onChange={handleChange} placeholder="Residencial das Flores" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Cidade</label>
                        <input type="text" name="address.city" value={profile.address.city} onChange={handleChange} />
                      </div>
                      <div className="form-group">
                        <label>Estado</label>
                        <input type="text" name="address.state" value={profile.address.state} onChange={handleChange} maxLength={2} style={{ textTransform: 'uppercase' }} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>País</label>
                      <input type="text" name="address.country" value={profile.address.country} onChange={handleChange} />
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          )}

          {tab === 'pedidos' && (
            <div className="orders-section">
              {orders.length === 0 ? (
                <div className="orders-empty">
                  <div className="empty-icon">
                    <Icon name="emptyBox" size={48} strokeWidth={1.4} />
                  </div>
                  <h3>Nenhum pedido ainda</h3>
                  <p>Você ainda não realizou nenhuma compra</p>
                  <Link to="/" className="btn-primary">Explorar Produtos</Link>
                </div>
              ) : (
                orders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={(id, status) =>
                      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o))
                    }
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

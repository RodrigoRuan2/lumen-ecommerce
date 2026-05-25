import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../services/api.js'
import { formatCEP, fetchAddressByCEP, detectCardBrand, sanitizeName, sanitizeUF } from '../utils/formatters.js'
import { calculateShipping, PIX_DISCOUNT } from '../utils/pricing.js'
import DeliveryMap from '../components/DeliveryMap.jsx'
import Icon from '../components/Icon.jsx'
import '../styles/Checkout.css'
import '../styles/Map.css'

const STEPS = ['Endereço', 'Pagamento', 'Confirmação']

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const [address, setAddress] = useState({
    zipCode: '', street: '', number: '', complement: '', neighborhood: '', buildingName: '', city: '', state: '', country: 'Brasil'
  })
  const [payment, setPayment] = useState({
    method: 'credit_card',
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    installments: '1',
    saveCard: false,
    useSavedCard: false
  })
  const [savedCard, setSavedCard] = useState(null)
  const [savedAddress, setSavedAddress] = useState(null)
  const [errors, setErrors] = useState({})
  const [cepLoading, setCepLoading] = useState(false)

  const handleCEPChange = async (value) => {
    const masked = formatCEP(value)
    setAddress(prev => ({ ...prev, zipCode: masked }))
    if (masked.replace(/\D/g, '').length === 8) {
      setCepLoading(true)
      const addr = await fetchAddressByCEP(masked)
      setCepLoading(false)
      if (addr) {
        setAddress(prev => ({
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

  const pixDiscount = payment.method === 'pix' ? totalPrice * PIX_DISCOUNT : 0
  const shipping = calculateShipping(totalPrice)
  const total = totalPrice - pixDiscount + shipping

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    if (cart.length === 0) {
      navigate('/carrinho')
    }
  }, [])

  useEffect(() => {
    // Carrega endereço e cartão salvo do perfil
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/profile')
        const addr = res.data?.user?.address
        if (!addr) return
        setSavedAddress(addr)
        setAddress({
          zipCode: addr.zipCode || '',
          street: addr.street || '',
          number: addr.number || '',
          complement: addr.complement || '',
          neighborhood: addr.neighborhood || '',
          buildingName: addr.buildingName || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || 'Brasil'
        })
        if (addr.savedCard) {
          setSavedCard(addr.savedCard)
          setPayment(prev => ({ ...prev, useSavedCard: true }))
        }
      } catch {
        // Sem perfil ou sem token: segue com defaults
      }
    }
    loadProfile()
  }, [])

  const validateAddress = () => {
    const errs = {}
    const cepDigits = address.zipCode.replace(/\D/g, '')
    if (!address.zipCode.trim()) errs.zipCode = 'CEP obrigatório'
    else if (cepDigits.length !== 8) errs.zipCode = 'CEP precisa ter 8 dígitos'
    if (!address.street.trim()) errs.street = 'Endereço obrigatório'
    if (!address.number.trim()) errs.number = 'Número obrigatório'
    if (!address.city.trim()) errs.city = 'Cidade obrigatória'
    if (!address.state.trim() || address.state.length !== 2) errs.state = 'Estado precisa ter 2 letras (UF)'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validatePayment = () => {
    const errs = {}
    if (payment.method === 'credit_card' && !(savedCard && payment.useSavedCard)) {
      if (payment.cardNumber.replace(/\s/g, '').length < 16) errs.cardNumber = 'Número inválido'
      if (!payment.cardName.trim()) errs.cardName = 'Nome obrigatório'
      if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) errs.expiry = 'Formato MM/AA'
      if (payment.cvv.length < 3) errs.cvv = 'CVV inválido'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 0 && !validateAddress()) return
    if (step === 1 && !validatePayment()) return
    setStep(s => s + 1)
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const items = cart.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.price
      }))

      const response = await api.post('/orders', {
        items,
        shippingAddress: address,
        paymentMethod: payment.method
      })

      if (response.data.success) {
        // Salva cartão (apenas last4 + bandeira + nome + validade) se o usuário marcou
        if (payment.method === 'credit_card' && payment.saveCard && !payment.useSavedCard) {
          try {
            const digits = payment.cardNumber.replace(/\D/g, '')
            const cardData = {
              last4: digits.slice(-4),
              brand: detectCardBrand(digits),
              holderName: payment.cardName,
              expiry: payment.expiry
            }
            const newAddress = { ...(savedAddress || {}), ...address, savedCard: cardData }
            await api.put('/auth/profile', { address: newAddress })
          } catch {
            // Falha em salvar cartão não impede o pedido
          }
        }
        setOrderId(response.data.order._id || 'pedido-' + Date.now())
        clearCart()
        setStep(3)
      } else {
        alert(response.data.message || 'Erro ao criar pedido')
      }
    } catch (err) {
      const msg = err.response?.data?.message
      if (msg?.includes('Stock') || msg?.includes('stock')) {
        alert('Estoque insuficiente para um ou mais produtos')
      } else {
        setOrderId('pedido-' + Date.now())
        clearCart()
        setStep(3)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCard = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  if (step === 3) {
    return (
      <div className="order-success">
        <div className="success-icon"><Icon name="check" size={42} strokeWidth={2.5} /></div>
        <h1>Pedido Realizado!</h1>
        <p>Seu pedido foi confirmado com sucesso.</p>
        <p className="order-id">Número do pedido: <strong>#{orderId?.slice(-8)?.toUpperCase() || 'DEMO'}</strong></p>

        <div className="success-map">
          <h3 className="success-map-title">Destino da entrega</h3>
          <DeliveryMap address={address} height={280} />
        </div>

        <div className="success-actions">
          <Link to="/perfil?tab=pedidos" className="btn-primary">Ver Meus Pedidos</Link>
          <Link to="/" className="btn-secondary">Continuar Comprando</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="checkout-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="step-num">
              {i < step ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className="step-label">{s}</span>
          </div>
        ))}
      </div>

      <div className="checkout-layout">
        <div className="checkout-form-area">
          {step === 0 && (
            <div className="checkout-card">
              <h2>Endereço de Entrega</h2>

              {Object.keys(errors).length > 0 && (
                <div className="form-error-banner">
                  <strong>Revise os campos destacados:</strong>
                  <ul>
                    {Object.values(errors).map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </div>
              )}

              <div className="form-group">
                <label>CEP {cepLoading && <span className="cep-loading">buscando endereço...</span>}</label>
                <input
                  type="text"
                  value={address.zipCode}
                  onChange={e => handleCEPChange(e.target.value)}
                  placeholder="01234-567"
                  inputMode="numeric"
                  maxLength={9}
                  className={errors.zipCode ? 'input-error' : ''}
                  aria-invalid={!!errors.zipCode}
                />
                <small className="form-hint">Digite o CEP que preenchemos o resto automaticamente</small>
                {errors.zipCode && <span className="field-error">{errors.zipCode}</span>}
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Rua / Logradouro</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={e => setAddress({ ...address, street: e.target.value })}
                    placeholder="Rua das Flores"
                    className={errors.street ? 'input-error' : ''}
                    aria-invalid={!!errors.street}
                  />
                  {errors.street && <span className="field-error">{errors.street}</span>}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Número</label>
                  <input
                    type="text"
                    value={address.number}
                    onChange={e => setAddress({ ...address, number: e.target.value })}
                    placeholder="123"
                    className={errors.number ? 'input-error' : ''}
                    aria-invalid={!!errors.number}
                  />
                  {errors.number && <span className="field-error">{errors.number}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Complemento</label>
                  <input
                    type="text"
                    value={address.complement}
                    onChange={e => setAddress({ ...address, complement: e.target.value })}
                    placeholder="Apto 42, Bloco B..."
                  />
                </div>
                <div className="form-group">
                  <label>Bairro</label>
                  <input
                    type="text"
                    value={address.neighborhood}
                    onChange={e => setAddress({ ...address, neighborhood: e.target.value })}
                    placeholder="Centro"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nome do Condomínio / Edifício <span style={{ fontWeight: 400, color: 'var(--muted-color)' }}>(opcional)</span></label>
                <input
                  type="text"
                  value={address.buildingName}
                  onChange={e => setAddress({ ...address, buildingName: e.target.value })}
                  placeholder="Ex: Edifício Solar das Palmeiras"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={e => setAddress({ ...address, city: sanitizeName(e.target.value) })}
                    placeholder="São Paulo"
                    className={errors.city ? 'input-error' : ''}
                    aria-invalid={!!errors.city}
                  />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={e => setAddress({ ...address, state: sanitizeUF(e.target.value) })}
                    placeholder="SP"
                    maxLength={2}
                    style={{ textTransform: 'uppercase' }}
                    className={errors.state ? 'input-error' : ''}
                    aria-invalid={!!errors.state}
                  />
                  {errors.state && <span className="field-error">{errors.state}</span>}
                </div>
              </div>

              <div className="checkout-map-section">
                <label className="map-label">Pré-visualização da entrega</label>
                <DeliveryMap address={address} height={260} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="checkout-card">
              <h2>Forma de Pagamento</h2>
              <div className="payment-methods">
                {[
                  { value: 'credit_card', label: '💳 Cartão de Crédito' },
                  { value: 'pix', label: '⚡ PIX' },
                  { value: 'boleto', label: '🧾 Boleto' }
                ].map(m => (
                  <label key={m.value} className={`payment-method-option ${payment.method === m.value ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="method"
                      value={m.value}
                      checked={payment.method === m.value}
                      onChange={e => setPayment({ ...payment, method: e.target.value })}
                    />
                    {m.label}
                  </label>
                ))}
              </div>

              {payment.method === 'credit_card' && savedCard && (
                <div className="saved-card-selector">
                  <label className={`saved-card-option ${payment.useSavedCard ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      checked={payment.useSavedCard}
                      onChange={() => setPayment({ ...payment, useSavedCard: true })}
                    />
                    <div className="saved-card-info">
                      <div className="saved-card-brand">{savedCard.brand}</div>
                      <div className="saved-card-number">•••• •••• •••• {savedCard.last4}</div>
                      <div className="saved-card-meta">
                        {savedCard.holderName} · Vence {savedCard.expiry}
                      </div>
                    </div>
                  </label>
                  <label className={`saved-card-option ${!payment.useSavedCard ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      checked={!payment.useSavedCard}
                      onChange={() => setPayment({ ...payment, useSavedCard: false })}
                    />
                    <span>+ Usar outro cartão</span>
                  </label>
                </div>
              )}

              {payment.method === 'credit_card' && !(savedCard && payment.useSavedCard) && (
                <div className="card-form">
                  <div className="form-group">
                    <label>Número do Cartão {payment.cardNumber && <span className="card-brand-detected">{detectCardBrand(payment.cardNumber)}</span>}</label>
                    <input
                      type="text"
                      value={payment.cardNumber}
                      onChange={e => setPayment({ ...payment, cardNumber: formatCard(e.target.value) })}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                    {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                  </div>
                  <div className="form-group">
                    <label>Nome no Cartão</label>
                    <input
                      type="text"
                      value={payment.cardName}
                      onChange={e => setPayment({ ...payment, cardName: e.target.value.toUpperCase() })}
                      placeholder="JOÃO SILVA"
                    />
                    {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Validade</label>
                      <input
                        type="text"
                        value={payment.expiry}
                        onChange={e => setPayment({ ...payment, expiry: formatExpiry(e.target.value) })}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                      {errors.expiry && <span className="field-error">{errors.expiry}</span>}
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        value={payment.cvv}
                        onChange={e => setPayment({ ...payment, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        placeholder="123"
                        maxLength={4}
                      />
                      {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Parcelas</label>
                    <select
                      value={payment.installments}
                      onChange={e => setPayment({ ...payment, installments: e.target.value })}
                    >
                      {[1, 2, 3, 6, 12].map(n => (
                        <option key={n} value={n}>
                          {n}x de R$ {(total / n).toFixed(2)}{n === 1 ? ' (sem juros)' : ' sem juros'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="save-card-checkbox">
                    <input
                      type="checkbox"
                      checked={payment.saveCard}
                      onChange={e => setPayment({ ...payment, saveCard: e.target.checked })}
                    />
                    <span>
                      <strong>Salvar este cartão para próxima compra</strong>
                      <small>Armazenamos apenas os últimos 4 dígitos, bandeira, nome e validade. CVV e número completo nunca são salvos.</small>
                    </span>
                  </label>
                </div>
              )}

              {payment.method === 'pix' && (
                <div className="pix-info">
                  <div className="pix-icon">⚡</div>
                  <p>Após confirmar, você receberá o QR Code PIX para pagamento.</p>
                  <p className="pix-hint">Desconto de 5% para pagamento via PIX!</p>
                </div>
              )}

              {payment.method === 'boleto' && (
                <div className="pix-info">
                  <div className="pix-icon">🧾</div>
                  <p>O boleto será gerado após a confirmação.</p>
                  <p className="pix-hint">Vencimento em 3 dias úteis.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="checkout-card">
              <h2>Confirmar Pedido</h2>
              <div className="confirm-section">
                <h3>Itens</h3>
                {cart.map(item => (
                  <div key={item._id} className="confirm-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="confirm-section">
                <h3>Entrega</h3>
                <p>
                  {address.street}{address.number ? `, ${address.number}` : ''}{address.complement ? ` — ${address.complement}` : ''}
                  {address.neighborhood ? `, ${address.neighborhood}` : ''}<br/>
                  {address.buildingName && <>{address.buildingName}<br/></>}
                  {address.city} - {address.state}, {address.zipCode}
                </p>
                <div className="confirm-map">
                  <DeliveryMap address={address} height={220} />
                </div>
              </div>
              <div className="confirm-section">
                <h3>Pagamento</h3>
                <p>
                  {payment.method === 'credit_card' && savedCard && payment.useSavedCard &&
                    `Cartão salvo: ${savedCard.brand} •••• ${savedCard.last4}`}
                  {payment.method === 'credit_card' && !(savedCard && payment.useSavedCard) &&
                    `Cartão: **** **** **** ${payment.cardNumber.slice(-4)}`}
                  {payment.method === 'pix' && 'PIX (5% de desconto aplicado)'}
                  {payment.method === 'boleto' && 'Boleto Bancário'}
                </p>
              </div>
            </div>
          )}

          <div className="checkout-nav">
            {step > 0 && (
              <button className="btn-back" onClick={() => setStep(s => s - 1)}>
                ← Voltar
              </button>
            )}
            {step < 2 ? (
              <button className="btn-next" onClick={handleNext}>
                Próximo →
              </button>
            ) : (
              <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Processando...' : '✓ Confirmar Pedido'}
              </button>
            )}
          </div>
        </div>

        <div className="checkout-summary">
          <h3>Resumo</h3>
          {cart.map(item => (
            <div key={item._id} className="summary-item">
              <span className="summary-item-name">{item.name}</span>
              <span>×{item.quantity}</span>
              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-divider" />
          <div className="summary-line-sm">
            <span>Subtotal</span><span>R$ {totalPrice.toFixed(2)}</span>
          </div>
          {pixDiscount > 0 && (
            <div className="summary-line-sm" style={{ color: 'var(--success-color)' }}>
              <span>Desconto PIX (5%)</span><span>- R$ {pixDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-line-sm">
            <span>Frete</span>
            <span className={shipping === 0 ? 'free-shipping' : ''}>
              {shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="summary-divider" />
          <div className="summary-total-sm">
            <span>Total</span><span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

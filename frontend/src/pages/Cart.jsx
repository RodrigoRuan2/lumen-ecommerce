import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { calculateShipping, freeShippingRemaining, freeShippingProgress, pixPrice, FREE_SHIPPING_MIN } from '../utils/pricing.js'
import { formatBRL } from '../utils/formatters.js'
import Icon from '../components/Icon'
import '../styles/Cart.css'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart()
  const navigate = useNavigate()

  const isLoggedIn = !!localStorage.getItem('token')

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon">
          <Icon name="cart" size={48} strokeWidth={1.5} />
        </div>
        <h2>Seu carrinho está vazio</h2>
        <p>Adicione produtos para continuar comprando</p>
        <Link to="/" className="btn-primary">Explorar Produtos</Link>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Carrinho de Compras</h1>
        <button className="btn-clear" onClick={clearCart}>Limpar carrinho</button>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item._id} className="cart-item">
              <Link to={`/produto/${item._id}`} className="cart-item-image">
                <img
                  src={item.images?.[0]?.url || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=Produto'}
                  alt={item.name}
                />
              </Link>

              <div className="cart-item-info">
                <Link to={`/produto/${item._id}`} className="cart-item-name">{item.name}</Link>
                <span className="cart-item-category">{item.category}</span>
                <span className="cart-item-unit-price">{formatBRL(item.price)} / unid.</span>
              </div>

              <div className="cart-item-qty">
                <button onClick={() => updateQuantity(item._id, item.quantity - 1, item.stock)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, item.quantity + 1, item.stock)}>+</button>
              </div>

              <div className="cart-item-subtotal">
                {formatBRL(item.price * item.quantity)}
              </div>

              <button
                className="btn-remove"
                onClick={() => removeFromCart(item._id)}
                aria-label="Remover item"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Resumo do Pedido</h2>

          <div className="summary-thumbs">
            {cart.slice(0, 4).map(item => (
              <div key={item._id} className="summary-thumb" title={`${item.name} × ${item.quantity}`}>
                <img
                  src={item.images?.[0]?.url || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=•'}
                  alt={item.name}
                />
                {item.quantity > 1 && <span className="summary-thumb-qty">{item.quantity}</span>}
              </div>
            ))}
            {cart.length > 4 && (
              <div className="summary-thumb summary-thumb-more">+{cart.length - 4}</div>
            )}
          </div>

          <div className="summary-line">
            <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
            <span>{formatBRL(totalPrice)}</span>
          </div>

          <div className="summary-line">
            <span>Frete</span>
            <span className={calculateShipping(totalPrice) === 0 ? 'free-shipping' : ''}>
              {calculateShipping(totalPrice) === 0 ? 'Grátis' : formatBRL(calculateShipping(totalPrice))}
            </span>
          </div>

          {totalPrice < FREE_SHIPPING_MIN ? (
            <div className="shipping-progress">
              <div className="shipping-progress-bar">
                <div
                  className="shipping-progress-fill"
                  style={{ width: `${freeShippingProgress(totalPrice)}%` }}
                />
              </div>
              <p className="shipping-progress-text">
                Falta <strong>{formatBRL(freeShippingRemaining(totalPrice))}</strong> para frete grátis
              </p>
            </div>
          ) : (
            <div className="shipping-achieved">
              ✓ Você ganhou frete grátis!
            </div>
          )}

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total</span>
            <span>{formatBRL(totalPrice + calculateShipping(totalPrice))}</span>
          </div>

          <div className="pix-preview">
            <span className="pix-preview-label">⚡ No PIX</span>
            <span className="pix-preview-price">
              {formatBRL(pixPrice(totalPrice + calculateShipping(totalPrice)))}
              <span className="pix-preview-discount">5% off</span>
            </span>
          </div>

          <button className="btn-checkout" onClick={handleCheckout}>
            {isLoggedIn ? 'Finalizar Compra' : 'Login para Comprar'}
          </button>

          <Link to="/" className="btn-continue">← Continuar Comprando</Link>
        </div>
      </div>
    </div>
  )
}

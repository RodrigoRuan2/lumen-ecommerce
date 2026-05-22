import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { renderStars } from '../utils/formatters.js'
import { pixPrice, FREE_SHIPPING_MIN } from '../utils/pricing.js'
import DeliveryMap from '../components/DeliveryMap.jsx'
import Icon from '../components/Icon.jsx'
import '../styles/ProductDetail.css'
import '../styles/Map.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [addedMsg, setAddedMsg] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const apiBase = import.meta.env.VITE_API_URL || '/api'
        const res = await fetch(`${apiBase}/products/${id}`)
        const data = await res.json()
        if (data.success) {
          setProduct(data.product)
        } else {
          setError('Produto não encontrado')
        }
      } catch {
        setError('Erro ao carregar produto')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setAddedMsg(`${quantity}x adicionado ao carrinho!`)
    setTimeout(() => setAddedMsg(''), 2500)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    navigate('/checkout')
  }

  if (loading) return (
    <div className="detail-loading">
      <div className="spinner" />
      <p>Carregando produto...</p>
    </div>
  )

  if (error) return (
    <div className="detail-error">
      <h2>{error}</h2>
      <Link to="/" className="btn-primary">Voltar para a loja</Link>
    </div>
  )

  if (!product) return null

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const images = product.images?.length ? product.images : [
    { url: 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Produto', alt: product.name }
  ]

  return (
    <div className="product-detail">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <span>{product.category}</span> &rsaquo; <span>{product.name}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-images">
          <div className="main-image">
            <img src={images[activeImage]?.url} alt={images[activeImage]?.alt || product.name} />
            {discount && <span className="discount-badge-lg">-{discount}%</span>}
          </div>
          {images.length > 1 && (
            <div className="image-thumbs">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={img.alt}
                  className={activeImage === i ? 'active' : ''}
                  onClick={() => setActiveImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          <h1 className="detail-name">{product.name}</h1>

          <div className="detail-rating">
            <span className="stars">{renderStars(product.rating)}</span>
            <span className="rating-text">{product.rating?.toFixed(1) || '0.0'}</span>
            <span className="rating-count">({product.numReviews || 0} avaliações)</span>
          </div>

          <div className="detail-price-block">
            <span className="detail-price">R$ {product.price?.toFixed(2)}</span>
            {discount && (
              <span className="detail-original-price">R$ {product.originalPrice?.toFixed(2)}</span>
            )}
            {discount && <span className="detail-discount">{discount}% OFF</span>}
          </div>

          <p className="pix-hint-detail">
            <span className="pix-hint-bolt">⚡</span>
            <span>
              <strong>R$ {pixPrice(product.price).toFixed(2)}</strong> no PIX
              <span className="pix-hint-badge">5% off</span>
            </span>
          </p>

          {discount && (
            <p className="installment-hint">
              ou 12x de R$ {(product.price / 12).toFixed(2)} sem juros
            </p>
          )}


          <div className="detail-stock">
            {product.stock > 0 ? (
              <span className="in-stock">Em Estoque — {product.stock} unidades</span>
            ) : (
              <span className="out-of-stock">Fora de Estoque</span>
            )}
          </div>

          {product.stock > 0 && (
            <div className="quantity-selector">
              <label>Quantidade:</label>
              <div className="qty-control">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>
          )}

          {addedMsg && <div className="added-msg">{addedMsg}</div>}

          <div className="detail-actions">
            <button
              className="btn-add-cart"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <Icon name="cart" size={16} /> Adicionar ao Carrinho
            </button>
            <button
              className="btn-buy-now"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Comprar Agora
            </button>
          </div>

          <div className="detail-seller">
            <Icon name="store" size={14} />
            <span>Vendido por <strong>{product.sellerId?.name || 'LUMEN Store'}</strong></span>
          </div>

          <div className="detail-trust-strip">
            <div className="detail-trust-item">
              <Icon name="truck" size={16} />
              <span>{product.price >= FREE_SHIPPING_MIN ? 'Frete grátis' : `Frete grátis acima de R$ ${FREE_SHIPPING_MIN}`}</span>
            </div>
            <div className="detail-trust-item">
              <Icon name="refresh" size={16} />
              <span>Devolução em 30 dias</span>
            </div>
            <div className="detail-trust-item">
              <Icon name="shield" size={16} />
              <span>Pagamento seguro</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-description">
        <h2>Descrição do Produto</h2>
        <p>{product.description}</p>
      </div>

      {product.sellerId?.store?.enabled && (
        <div className="detail-store">
          <h2>Loja Física</h2>
          <div className="detail-store-grid">
            <div className="detail-store-info">
              {product.sellerId.store.name && (
                <h3 className="store-name">{product.sellerId.store.name}</h3>
              )}
              <p className="store-address-line">
                {product.sellerId.store.street}
                {product.sellerId.store.number ? `, ${product.sellerId.store.number}` : ''}
                {product.sellerId.store.complement ? ` — ${product.sellerId.store.complement}` : ''}
              </p>
              {product.sellerId.store.neighborhood && (
                <p className="store-address-line">{product.sellerId.store.neighborhood}</p>
              )}
              <p className="store-address-line">
                {product.sellerId.store.city} - {product.sellerId.store.state}
                {product.sellerId.store.zipCode && ` · CEP ${product.sellerId.store.zipCode}`}
              </p>
            </div>
            <div className="detail-store-map">
              <DeliveryMap address={product.sellerId.store} height={260} />
            </div>
          </div>
        </div>
      )}

      {product.reviews?.length > 0 && (
        <div className="detail-reviews">
          <h2>Avaliações</h2>
          {product.reviews.map((review, i) => (
            <div key={i} className="review-card">
              <div className="review-header">
                <span className="review-author">{review.userName || 'Cliente'}</span>
                <span className="stars">{renderStars(review.rating)}</span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { renderStars, formatBRL } from '../utils/formatters.js'
import Icon from './Icon'
import '../styles/ProductCard.css'

const WISHLIST_KEY = 'wishlist'

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]') } catch { return [] }
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  useEffect(() => {
    setWishlisted(getWishlist().includes(product._id))
  }, [product._id])

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (product.stock === 0) return
    addToCart(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const toggleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const current = getWishlist()
    const next = current.includes(product._id)
      ? current.filter(id => id !== product._id)
      : [...current, product._id]
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next))
    setWishlisted(next.includes(product._id))
  }

  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  return (
    <div className="product-card">
      <Link to={`/produto/${product._id}`} className="product-image-link">
        <div className="product-image">
          <img
            src={product.images?.[0]?.url || 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Produto'}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
          {discountPct && <span className="discount-badge">-{discountPct}%</span>}

          <button
            className={`wishlist-btn ${wishlisted ? 'wishlist-active' : ''}`}
            onClick={toggleWishlist}
            aria-label={wishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Icon name="heart" size={16} strokeWidth={2} />
          </button>

          <div className="product-quick-actions">
            <span className="quick-action" aria-hidden="true">
              <Icon name="eye" size={16} />
              <span>Ver detalhes</span>
            </span>
          </div>
        </div>
      </Link>

      <div className="product-info">
        <Link to={`/produto/${product._id}`} className="product-name-link">
          <h3>{product.name}</h3>
        </Link>

        <div className="product-rating">
          <span className="stars">{renderStars(product.rating)}</span>
          <span className="rating-count">({product.numReviews || 0})</span>
        </div>

        {product.description && (
          <p className="product-description">{product.description.substring(0, 70)}{product.description.length > 70 ? '...' : ''}</p>
        )}

        <div className="product-price">
          <span className="current-price">{formatBRL(product.price)}</span>
          {discountPct && (
            <span className="original-price">{formatBRL(product.originalPrice)}</span>
          )}
        </div>

        <div className="product-stock">
          {product.stock > 0 ? (
            <span className="in-stock">Em Estoque ({product.stock})</span>
          ) : (
            <span className="out-of-stock">Fora de Estoque</span>
          )}
        </div>

        {product.sellerId?.name && (
          <span className="product-seller">por {product.sellerId.name}</span>
        )}

        <div className="product-actions">
          <Link to={`/produto/${product._id}`} className="btn-view">Ver Detalhes</Link>
          <button
            className={`btn-cart ${added ? 'btn-cart-added' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0 || added}
            aria-label="Adicionar ao carrinho"
          >
            {added ? <Icon name="check" size={16} strokeWidth={3} /> : <Icon name="plus" size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  )
}

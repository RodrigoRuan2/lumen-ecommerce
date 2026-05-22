import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import { SkeletonGrid } from '../components/Skeleton'
import { FREE_SHIPPING_MIN } from '../utils/pricing.js'
import '../styles/Home.css'

const CATEGORIES = [
  { name: 'Eletrônicos', icon: 'electronics' },
  { name: 'Roupas', icon: 'clothes' },
  { name: 'Livros', icon: 'book' },
  { name: 'Casa', icon: 'home' },
  { name: 'Esportes', icon: 'sports' },
  { name: 'Beleza', icon: 'beauty' },
  { name: 'Alimentos', icon: 'food' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const search = searchParams.get('search') || ''

  useEffect(() => {
    fetchProducts()
  }, [category, search])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (category) query.append('category', category)
      if (search) query.append('search', search)

      const response = await fetch(`/api/products?${query}`)
      const data = await response.json()

      if (data.success) setProducts(data.products)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home">
      {!search && (
        <section className="hero">
          <div className="hero-gradient" aria-hidden="true" />
          <div className="hero-content">
            <span className="hero-eyebrow">CURADORIA PREMIUM</span>
            <h1 className="hero-title">
              Design que <em>importa</em>.<br />
              Qualidade que dura.
            </h1>
            <p className="hero-subtitle">
              Uma seleção criteriosa de produtos premium escolhidos com o mesmo cuidado que você dedicaria às suas escolhas.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary btn-hero">
                Começar a comprar
                <Icon name="arrowRight" size={16} />
              </Link>
              <a href="#produtos" className="btn-secondary btn-hero">Explorar catálogo</a>
            </div>
          </div>

          <div className="trust-strip" aria-label="Garantias">
            <div className="trust-item">
              <Icon name="truck" size={18} />
              <span>Frete grátis acima de R$ {FREE_SHIPPING_MIN}</span>
            </div>
            <div className="trust-item">
              <Icon name="refresh" size={18} />
              <span>Devolução em 30 dias</span>
            </div>
            <div className="trust-item">
              <Icon name="shield" size={18} />
              <span>Compra 100% segura</span>
            </div>
          </div>
        </section>
      )}

      {search && (
        <div className="search-result-header">
          <h2>Resultados para: <em>"{search}"</em></h2>
          <Link to="/" className="clear-search">Limpar busca</Link>
        </div>
      )}

      <div className="filters" id="produtos">
        <div className="filter-section">
          <h3>Categorias</h3>
          <div className="category-list">
            <button
              className={`category-chip ${!category ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              <Icon name="grid" size={14} />
              Todas
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                className={`category-chip ${category === cat.name ? 'active' : ''}`}
                onClick={() => setCategory(cat.name)}
              >
                <Icon name={cat.icon} size={14} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="products-section">
        <div className="products-header">
          <h2>{search ? 'Produtos encontrados' : 'Produtos em destaque'}</h2>
          {!loading && <span className="products-count">{products.length} produto{products.length !== 1 ? 's' : ''}</span>}
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <Icon name="emptyBox" size={56} strokeWidth={1.2} />
            <h3>Nenhum produto encontrado</h3>
            <p>Tente ajustar os filtros ou buscar por outro termo</p>
            {(search || category) && (
              <button className="btn-primary" onClick={() => { setCategory(''); navigate('/') }}>
                Ver todos os produtos
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

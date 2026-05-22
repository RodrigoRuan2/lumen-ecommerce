import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

const getStorageKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user?.id ? `cart_${user.id}` : 'cart_guest'
  } catch {
    return 'cart_guest'
  }
}

const loadCartForKey = (key) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [storageKey, setStorageKey] = useState(getStorageKey)
  const [cart, setCart] = useState(() => loadCartForKey(getStorageKey()))

  // Persiste sempre que o carrinho muda
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cart))
  }, [cart, storageKey])

  // Reage a login/logout (custom event) e a mudanças cross-tab
  useEffect(() => {
    const refresh = () => {
      const newKey = getStorageKey()
      if (newKey !== storageKey) {
        setStorageKey(newKey)
        setCart(loadCartForKey(newKey))
      }
    }
    window.addEventListener('auth-change', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('auth-change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [storageKey])

  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id)
      if (existing) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item._id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity, maxStock) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item._id !== productId))
      return
    }
    setCart(prev =>
      prev.map(item =>
        item._id === productId
          ? { ...item, quantity: Math.min(quantity, maxStock || 999) }
          : item
      )
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

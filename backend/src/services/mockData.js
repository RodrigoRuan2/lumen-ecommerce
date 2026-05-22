// Dados fictícios para testes sem MongoDB
export const mockUsers = [
  {
    _id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    password: 'hashed123',
    role: 'customer',
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    }
  }
]

export const mockProducts = [
  {
    _id: '1',
    name: 'MacBook Pro M3',
    description: 'Notebook profissional com chip M3, 16GB RAM unificada e SSD 512GB. Display Liquid Retina de 14 polegadas com cores precisas e brilho excepcional.',
    price: 14999.00,
    originalPrice: 17999.00,
    category: 'Eletrônicos',
    images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=75&auto=format', alt: 'MacBook Pro' }],
    stock: 12,
    rating: 4.8,
    numReviews: 142,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '2',
    name: 'Headphone Wireless Premium',
    description: 'Fone de ouvido sem fio com cancelamento de ruído ativo, 30 horas de bateria e drivers de alta fidelidade para som imersivo.',
    price: 1899.00,
    originalPrice: 2499.00,
    category: 'Eletrônicos',
    images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=75&auto=format', alt: 'Headphone' }],
    stock: 47,
    rating: 4.9,
    numReviews: 89,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '3',
    name: 'Camiseta Essential',
    description: 'Camiseta básica 100% algodão pima, corte regular fit. Toque macio e durabilidade superior para o dia a dia.',
    price: 149.00,
    originalPrice: 199.00,
    category: 'Roupas',
    images: [{ url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=75&auto=format', alt: 'Camiseta' }],
    stock: 200,
    rating: 4.6,
    numReviews: 56,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '4',
    name: 'Clean Code - Robert C. Martin',
    description: 'O guia definitivo para escrever código limpo e profissional. Edição em capa dura com mais de 400 páginas de boas práticas.',
    price: 129.90,
    category: 'Livros',
    images: [{ url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=75&auto=format', alt: 'Livro' }],
    stock: 30,
    rating: 4.9,
    numReviews: 234,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '5',
    name: 'Smart TV OLED 55"',
    description: 'TV OLED 4K com HDR Dolby Vision, processador AI e sistema operacional inteligente. Pretos absolutos e cores vivas.',
    price: 5499.00,
    originalPrice: 7299.00,
    category: 'Eletrônicos',
    images: [{ url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=75&auto=format', alt: 'Smart TV' }],
    stock: 18,
    rating: 4.7,
    numReviews: 67,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '6',
    name: 'Tênis Runner Pro',
    description: 'Tênis de corrida com tecnologia de amortecimento responsivo. Solado durável para alta performance em qualquer terreno.',
    price: 599.00,
    originalPrice: 799.00,
    category: 'Esportes',
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=75&auto=format', alt: 'Tênis' }],
    stock: 85,
    rating: 4.7,
    numReviews: 178,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '7',
    name: 'Câmera Mirrorless 4K',
    description: 'Câmera mirrorless com sensor full-frame, gravação 4K 60fps e estabilização óptica. Para fotógrafos profissionais.',
    price: 8999.00,
    originalPrice: 10999.00,
    category: 'Eletrônicos',
    images: [{ url: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500&q=75&auto=format', alt: 'Câmera' }],
    stock: 9,
    rating: 4.8,
    numReviews: 41,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  },
  {
    _id: '8',
    name: 'Mochila Urban Pro',
    description: 'Mochila resistente à água com compartimento acolchoado para notebook até 16 polegadas. Design minimalista e funcional.',
    price: 349.00,
    originalPrice: 449.00,
    category: 'Casa',
    images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=75&auto=format', alt: 'Mochila' }],
    stock: 64,
    rating: 4.5,
    numReviews: 92,
    sellerId: { _id: '1', name: 'LUMEN Store' },
    isActive: true
  }
]

export const mockOrders = [
  {
    _id: '1',
    userId: '1',
    items: [
      { productId: '1', quantity: 1, price: 14999.00 }
    ],
    totalPrice: 14999.00,
    shippingAddress: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    },
    status: 'entregue',
    paymentMethod: 'credit_card',
    paymentStatus: 'completed',
    trackingNumber: 'BR123456789'
  }
]

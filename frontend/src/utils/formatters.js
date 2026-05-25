// Formata valor em BRL: 819776 -> "R$ 819.776,00"
export function formatBRL(value) {
  const num = Number(value) || 0
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Formatação de telefone BR: (XX) XXXXX-XXXX (celular) ou (XX) XXXX-XXXX (fixo)
export function formatPhone(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

// Formatação de CEP: XXXXX-XXX
export function formatCEP(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

// Permite apenas letras (com acentos), espacos, hifen, ponto e apostrofo (Sao Joao, D'Almeida etc)
export function sanitizeName(value) {
  return (value || '').replace(/[^A-Za-zÀ-ſ\s'.-]/g, '').slice(0, 80)
}

// Estado: apenas 2 letras maiusculas
export function sanitizeUF(value) {
  return (value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2)
}

// Capitalizar — primeira letra de cada palavra
export function capitalize(value) {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/(^|\s)\S/g, (l) => l.toUpperCase())
}

// Capitaliza só primeira letra da string
export function capitalizeFirst(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// Validações
export const isValidCEP = (cep) => /^\d{5}-?\d{3}$/.test(cep)
export const isValidPhone = (phone) => /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(phone)
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Buscar endereço pelo CEP via ViaCEP (grátis, sem chave)
export async function fetchAddressByCEP(cep) {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return {
      street: data.logradouro || '',
      city: data.localidade || '',
      state: data.uf || '',
      country: 'Brasil',
      neighborhood: data.bairro || ''
    }
  } catch {
    return null
  }
}

// Renderiza estrelas para rating — retorna string unicode
export function renderStars(rating) {
  const full = Math.floor(rating || 0)
  const half = (rating || 0) % 1 >= 0.5
  return (
    '★'.repeat(full) +
    (half ? '½' : '') +
    '☆'.repeat(5 - full - (half ? 1 : 0))
  )
}

// Detecta bandeira do cartão pelos primeiros dígitos. Nunca armazena PAN completo.
export function detectCardBrand(cardNumber) {
  const digits = (cardNumber || '').replace(/\D/g, '')
  if (!digits) return null
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'Amex'
  if (/^(4011|4312|4389|4514|5041|6277|6362|6363|6504|6505|6509|6516|6550|509)/.test(digits)) return 'Elo'
  if (/^6(?:011|5)/.test(digits)) return 'Discover'
  return 'Outro'
}

// Domínios comuns para autocomplete de email
export const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'icloud.com', 'live.com']

export function getEmailSuggestions(email) {
  if (!email || !email.includes('@')) return []
  const [local, domain] = email.split('@')
  if (!local) return []
  if (!domain) return EMAIL_DOMAINS.map(d => `${local}@${d}`)
  return EMAIL_DOMAINS
    .filter(d => d.startsWith(domain.toLowerCase()) && d !== domain.toLowerCase())
    .map(d => `${local}@${d}`)
}

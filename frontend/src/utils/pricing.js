export const FREE_SHIPPING_MIN = 150
export const SHIPPING_FEE = 19.90
export const PIX_DISCOUNT = 0.05

export function calculateShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE
}

export function pixPrice(price) {
  return price * (1 - PIX_DISCOUNT)
}

export function freeShippingRemaining(subtotal) {
  return Math.max(0, FREE_SHIPPING_MIN - subtotal)
}

export function freeShippingProgress(subtotal) {
  return Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100)
}

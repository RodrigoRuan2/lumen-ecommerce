// Proxy de geocoding para o Nominatim.
// Centraliza throttle (1 req/s — politica do OpenStreetMap) e cache em memoria.
// Nominatim exige User-Agent identificavel em producao.

const cache = new Map()
const CACHE_MAX = 500
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

let lastFetchAt = 0
async function nominatimFetch(query) {
  // Throttle global: 1.1s entre chamadas
  const now = Date.now()
  const wait = Math.max(0, 1100 - (now - lastFetchAt))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastFetchAt = Date.now()

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'LUMEN-Ecommerce/1.0 (https://github.com/RodrigoRuan2/lumen-ecommerce)'
    }
  })
  if (!res.ok) {
    const err = new Error(`Nominatim respondeu ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const geocode = async (req, res) => {
  try {
    const q = (req.query.q || '').toString().slice(0, 200).trim()
    if (!q || q.length < 3) {
      return res.status(400).json({ success: false, message: 'Query muito curta' })
    }

    // Cache hit
    const cached = cache.get(q)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return res.json({ success: true, result: cached.result, cached: true })
    }

    const data = await nominatimFetch(q)
    const result = data?.[0]
      ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      : null

    // Cleanup do cache se passar do limite
    if (cache.size >= CACHE_MAX) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    cache.set(q, { result, cachedAt: Date.now() })

    res.json({ success: true, result })
  } catch (err) {
    const status = err.status === 429 ? 429 : 500
    res.status(status).json({
      success: false,
      message: err.status === 429 ? 'Limite de geocoding atingido. Tente em instantes.' : 'Erro ao geocodificar'
    })
  }
}

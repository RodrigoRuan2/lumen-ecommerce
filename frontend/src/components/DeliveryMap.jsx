import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Ícone padrão do Leaflet quebra com bundlers — substituo por um SVG inline
const customIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div class="map-pin-wrapper">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="#18181b">
      <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

// Cache simples para não geocodificar o mesmo endereço duas vezes
const geocodeCache = new Map()

async function tryGeocode(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    /* ignora */
  }
  return null
}

// Tenta encontrar a localizacao mais precisa possivel:
// 1. street + number + city + state (mais preciso)
// 2. street + city + state (sem numero)
// 3. CEP isolado (Brasil tem boa cobertura por CEP)
// 4. cidade + estado (fallback aproximado)
async function geocodeAddress({ street, number, city, state, zipCode, country = 'Brasil' }) {
  const cacheKey = JSON.stringify({ street, number, city, state, zipCode })
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

  const cleanStreet = (street || '').trim()
  const cleanNumber = (number || '').trim()
  const cleanCity = (city || '').trim()
  const cleanState = (state || '').trim()
  const cleanCEP = (zipCode || '').trim()

  if (!cleanStreet && !cleanCity && !cleanCEP) return null

  let result = null

  // 1. Mais preciso: rua + numero + cidade + estado
  if (cleanStreet && cleanCity) {
    const q = [
      cleanStreet + (cleanNumber ? ', ' + cleanNumber : ''),
      cleanCity,
      cleanState,
      country
    ].filter(Boolean).join(', ')
    result = await tryGeocode(q)
    if (result) result.approximate = false
  }

  // 2. Sem numero: rua + cidade + estado
  if (!result && cleanStreet && cleanCity) {
    const q = [cleanStreet, cleanCity, cleanState, country].filter(Boolean).join(', ')
    result = await tryGeocode(q)
    if (result) result.approximate = false
  }

  // 3. Pelo CEP (Nominatim suporta postalcode no Brasil em casos comuns)
  if (!result && cleanCEP && cleanCEP.replace(/\D/g, '').length === 8) {
    const q = cleanCEP + ', ' + country
    result = await tryGeocode(q)
    if (result) result.approximate = false
  }

  // 4. Fallback: so cidade + estado
  if (!result && cleanCity) {
    const q = [cleanCity, cleanState, country].filter(Boolean).join(', ')
    result = await tryGeocode(q)
    if (result) result.approximate = true
  }

  if (result) geocodeCache.set(cacheKey, result)
  return result
}

export default function DeliveryMap({ address, height = 240 }) {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)

  const addressKey = useMemo(() =>
    JSON.stringify({ s: address?.street, n: address?.number, c: address?.city, st: address?.state, z: address?.zipCode }),
    [address]
  )

  useEffect(() => {
    if (!address?.city && !address?.zipCode) {
      setCoords(null)
      return
    }
    let cancelled = false
    setLoading(true)
    geocodeAddress(address).then(result => {
      if (!cancelled) {
        setCoords(result)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [addressKey])

  if (loading) {
    return (
      <div className="map-loading" style={{ height }}>
        <div className="spinner" />
        <span>Localizando endereço...</span>
      </div>
    )
  }

  if (!coords) {
    return (
      <div className="map-empty" style={{ height }}>
        <span className="map-empty-icon">📍</span>
        <p>Preencha o endereço para ver no mapa</p>
      </div>
    )
  }

  return (
    <div className="delivery-map-container">
      <div className="delivery-map-wrapper" style={{ height }}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={coords.approximate ? 13 : 16}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', borderRadius: 'var(--border-radius)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[coords.lat, coords.lng]} icon={customIcon}>
            <Popup>
              <strong>Entrega aqui</strong><br />
              {address.street && <>{address.street}<br /></>}
              {address.city} - {address.state}<br />
              {address.zipCode && <small>CEP: {address.zipCode}</small>}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      {coords.approximate && (
        <p className="map-approximate-hint">
          📍 Localização aproximada — não conseguimos encontrar a rua exata
        </p>
      )}
    </div>
  )
}

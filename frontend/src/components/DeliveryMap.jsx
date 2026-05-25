import { useEffect, useState, useMemo, useRef } from 'react'
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

// Cache de geocoding em memoria do frontend (vida = sessao)
// Backend tambem cacheia em memoria por 24h.
const geocodeCache = new Map()

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function tryGeocode(query) {
  try {
    const res = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data?.success && data.result) return { lat: data.result.lat, lng: data.result.lng }
  } catch {
    /* ignora */
  }
  return null
}

// Estrategia conservadora: UMA tentativa por geocode.
// Prioriza a query mais provavel de retornar resultado preciso.
async function geocodeAddress({ street, number, city, state, zipCode, country = 'Brasil' }) {
  const cleanStreet = (street || '').trim()
  const cleanNumber = (number || '').trim()
  const cleanCity = (city || '').trim()
  const cleanState = (state || '').trim()
  const cleanCEP = (zipCode || '').replace(/\D/g, '')

  if (!cleanStreet && !cleanCity && cleanCEP.length !== 8) return null

  const cacheKey = JSON.stringify({ cleanStreet, cleanNumber, cleanCity, cleanState, cleanCEP })
  if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey)

  // Monta a melhor query disponivel em UMA chamada
  let query
  let approximate = false

  if (cleanStreet && cleanCity) {
    // Rua + numero + cidade + estado: mais preciso
    query = [
      cleanStreet + (cleanNumber ? ', ' + cleanNumber : ''),
      cleanCity,
      cleanState,
      country
    ].filter(Boolean).join(', ')
  } else if (cleanCEP.length === 8) {
    // Apenas CEP: Nominatim tem boa cobertura por CEP brasileiro
    query = `${cleanCEP.slice(0, 5)}-${cleanCEP.slice(5)}, ${country}`
  } else if (cleanCity) {
    // Apenas cidade: aproximado
    query = [cleanCity, cleanState, country].filter(Boolean).join(', ')
    approximate = true
  } else {
    return null
  }

  const result = await tryGeocode(query)
  if (result) {
    result.approximate = approximate
    geocodeCache.set(cacheKey, result)
  }
  return result
}

export default function DeliveryMap({ address, height = 240 }) {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const addressKey = useMemo(() =>
    JSON.stringify({ s: address?.street, n: address?.number, c: address?.city, st: address?.state, z: address?.zipCode }),
    [address]
  )

  useEffect(() => {
    // Limpa qualquer pesquisa pendente do keystroke anterior
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Sem dados minimos? Reseta.
    const hasMinimum = address?.city || (address?.zipCode || '').replace(/\D/g, '').length === 8
    if (!hasMinimum) {
      setCoords(null)
      setLoading(false)
      return
    }

    // Debounce 800ms — so geocodifica quando o usuario parar de digitar
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      geocodeAddress(address).then(result => {
        setCoords(result)
        setLoading(false)
      })
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
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

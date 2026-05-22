import { useState, useRef, useEffect } from 'react'
import { getEmailSuggestions } from '../utils/formatters.js'

export default function EmailInput({ value, onChange, placeholder = 'seu@email.com', required = false, name = 'email' }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const wrapperRef = useRef(null)

  const suggestions = getEmailSuggestions(value)

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e) => {
    onChange(e.target.value)
    setShowSuggestions(true)
    setActiveIdx(0)
  }

  const pickSuggestion = (s) => {
    onChange(s)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (suggestions[activeIdx]) {
        e.preventDefault()
        pickSuggestion(suggestions[activeIdx])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="email-input-wrapper" ref={wrapperRef}>
      <input
        type="email"
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="email"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="email-suggestions">
          {suggestions.slice(0, 5).map((s, i) => (
            <button
              key={s}
              type="button"
              className={`email-suggestion ${i === activeIdx ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s) }}
            >
              {s}
            </button>
          ))}
          <div className="email-suggestion-hint">↑↓ navegar · Tab/Enter selecionar</div>
        </div>
      )}
    </div>
  )
}

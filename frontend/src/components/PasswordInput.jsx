import { useState } from 'react'
import Icon from './Icon'

export default function PasswordInput({ value, onChange, placeholder, required, name, autoComplete = 'current-password' }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input-wrapper">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        name={name}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </div>
  )
}

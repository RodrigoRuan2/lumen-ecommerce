import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api.js'
import EmailInput from '../components/EmailInput.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import '../styles/Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'customer'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingMessage, setPendingMessage] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      return
    }
    if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('A senha deve conter pelo menos uma letra e um número')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })

      if (!response.data?.success) {
        setError(response.data?.message || 'Erro ao fazer cadastro')
        return
      }

      if (response.data.pendingApproval) {
        setPendingMessage(response.data.message)
        return
      }

      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer cadastro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Criar Conta</h2>

        {error && <div className="error-message">{error}</div>}

        {pendingMessage && (
          <div className="pending-approval-box">
            <div className="pending-icon">⏳</div>
            <h3>Aplicação Enviada</h3>
            <p>{pendingMessage}</p>
            <Link to="/login" className="btn-primary">Ir para Login</Link>
          </div>
        )}

        {!pendingMessage && formData.role === 'seller' && (
          <div className="seller-notice">
            <strong>ℹ️ Cadastro de vendedor</strong>
            <p>Após o cadastro, sua aplicação será analisada por um administrador. Você poderá fazer login normalmente, mas só poderá cadastrar produtos após a aprovação.</p>
          </div>
        )}

        {!pendingMessage && (<form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Completo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="João Silva"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <EmailInput
              value={formData.email}
              onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Conta</label>
            <div className="role-selector">
              {[
                { value: 'customer', label: '🛍️ Comprador', desc: 'Quero comprar produtos' },
                { value: 'seller', label: '🏪 Vendedor', desc: 'Quero vender produtos' }
              ].map(r => (
                <label
                  key={r.value}
                  className={`role-option ${formData.role === r.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={formData.role === r.value}
                    onChange={handleChange}
                  />
                  <div>
                    <div className="role-label">{r.label}</div>
                    <div className="role-desc">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Senha</label>
            <PasswordInput
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres, com letra e número"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label>Confirmar Senha</label>
            <PasswordInput
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repita a senha"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>)}

        {!pendingMessage && (
          <p className="auth-footer">
            Já tem conta? <Link to="/login">Fazer login</Link>
          </p>
        )}
      </div>
    </div>
  )
}

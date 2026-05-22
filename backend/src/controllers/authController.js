import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { upsertUserProfile, getProfileById, updateUserProfile, supabaseServer } from '../services/supabaseClient.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios' });
    }

    // Política de senha: mínimo 8 chars, com letra e número
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 8 caracteres' });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: 'A senha deve conter pelo menos uma letra e um número' });
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (error) {
      console.error('[register] Supabase createUser error:', error.message);
      return res.status(400).json({ success: false, message: 'Não foi possível criar a conta. Verifique os dados e tente novamente.' });
    }

    if (!data.user) {
      return res.status(500).json({ success: false, message: 'Não foi possível criar o usuário' });
    }

    const allowedRoles = ['customer', 'seller']
    const requestedRole = allowedRoles.includes(req.body.role) ? req.body.role : 'customer'

    // Sellers começam como 'customer' com aplicação pendente para aprovação admin
    const finalRole = requestedRole === 'seller' ? 'customer' : requestedRole
    const address = requestedRole === 'seller'
      ? { sellerApplication: { status: 'pending', requestedAt: new Date().toISOString() } }
      : null

    const profileError = await upsertUserProfile({
      id: data.user.id,
      email,
      name,
      role: finalRole,
      address
    });

    if (profileError) {
      return res.status(500).json({ success: false, message: profileError.message });
    }

    const message = requestedRole === 'seller'
      ? 'Cadastro enviado! Sua aplicação de vendedor está em análise. Você poderá fazer login normalmente, mas só poderá vender após aprovação do administrador.'
      : 'Usuário criado com sucesso. Faça login para continuar.'

    return res.status(201).json({
      success: true,
      message,
      pendingApproval: requestedRole === 'seller'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session || !data.user) {
      // Mensagem genérica para evitar enumeração de usuários
      return res.status(401).json({ success: false, message: 'Email ou senha inválidos' });
    }

    let { data: profile, error: profileError } = await getProfileById(data.user.id);
    if (profileError) {
      return res.status(500).json({ success: false, message: profileError.message });
    }

    // Se o perfil não existir ainda, cria automaticamente
    if (!profile) {
      const fallbackName = data.user.user_metadata?.name || data.user.email.split('@')[0];
      await upsertUserProfile({
        id: data.user.id,
        email: data.user.email,
        name: fallbackName,
        role: 'customer'
      });
      profile = { id: data.user.id, email: data.user.email, name: fallbackName, role: 'customer' };
    }

    res.json({
      success: true,
      token: data.session.access_token,
      user: {
        id: data.user.id,
        name: profile.name || '',
        email: data.user.email,
        role: profile.role || 'customer'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { data, error } = await getProfileById(req.user.id);
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, user: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Campos permitidos dentro do JSONB address. Chaves não-listadas (ex: sellerApplication)
// só podem ser alteradas pelo backend, não pelo próprio usuário.
const ADDRESS_PERSONAL_FIELDS = ['zipCode', 'street', 'number', 'complement', 'neighborhood', 'buildingName', 'city', 'state', 'country']
const SAVED_CARD_FIELDS = ['last4', 'brand', 'holderName', 'expiry']
const STORE_FIELDS = ['enabled', 'name', 'zipCode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'country']

function pickFields(obj, allowed, maxLen = 120) {
  if (!obj || typeof obj !== 'object') return null
  const out = {}
  for (const key of allowed) {
    const val = obj[key]
    if (typeof val === 'string') out[key] = val.slice(0, maxLen)
    else if (typeof val === 'boolean') out[key] = val
  }
  return out
}

function sanitizeAddressInput(input, existingAddress = {}) {
  if (!input || typeof input !== 'object') return existingAddress

  // Campos pessoais editáveis
  const sanitized = pickFields(input, ADDRESS_PERSONAL_FIELDS) || {}

  // savedCard: apenas last4 (4 dígitos), brand, holderName, expiry
  if (input.savedCard && typeof input.savedCard === 'object') {
    const card = pickFields(input.savedCard, SAVED_CARD_FIELDS, 40) || {}
    if (card.last4) card.last4 = String(card.last4).replace(/\D/g, '').slice(0, 4)
    if (card.expiry) card.expiry = String(card.expiry).slice(0, 7)
    if (card.last4 && card.brand) sanitized.savedCard = card
  } else if (input.savedCard === null) {
    // permite remover
    sanitized.savedCard = null
  } else if (existingAddress.savedCard) {
    sanitized.savedCard = existingAddress.savedCard
  }

  // store: configuração da loja física
  if (input.store && typeof input.store === 'object') {
    sanitized.store = pickFields(input.store, STORE_FIELDS) || {}
  } else if (input.store === null) {
    sanitized.store = null
  } else if (existingAddress.store) {
    sanitized.store = existingAddress.store
  }

  // Chaves controladas pelo servidor — sempre preservadas, NUNCA aceitas do cliente
  if (existingAddress.sellerApplication) {
    sanitized.sellerApplication = existingAddress.sellerApplication
  }

  return sanitized
}

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {}

    if (typeof name === 'string') updates.name = name.slice(0, 120)
    if (typeof phone === 'string') updates.phone = phone.slice(0, 20)

    if (address !== undefined) {
      // Busca o estado atual para preservar campos controlados pelo servidor
      const { data: current } = await getProfileById(req.user.id)
      updates.address = sanitizeAddressInput(address, current?.address || {})
    }

    const { data, error } = await updateUserProfile(req.user.id, updates)
    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, user: data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

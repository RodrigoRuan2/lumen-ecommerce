import { verifySupabaseToken, getProfileById } from '../services/supabaseClient.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const { data, error } = await verifySupabaseToken(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    const supabaseUser = data.user;
    const { data: profile, error: profileError } = await getProfileById(supabaseUser.id);
    if (profileError) {
      return res.status(403).json({ message: 'Não foi possível carregar perfil do usuário' });
    }

    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || profile?.name,
      role: profile?.role || 'customer'
    };

    next();
  } catch (error) {
    // Log apenas message + name, evita vazar token, stack ou request data em logs
    console.error('[auth] verify failed:', error?.name || 'Error', error?.message || 'unknown')
    res.status(401).json({ message: 'Token inválido' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// Permite apenas vendedores aprovados (role='seller') ou administradores.
// Customers — incluindo os com aplicação pendente — são bloqueados.
export const isSeller = (req, res, next) => {
  if (req.user?.role !== 'seller' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas vendedores aprovados podem realizar esta ação.' });
  }
  next();
};

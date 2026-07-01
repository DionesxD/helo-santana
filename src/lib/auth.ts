import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import crypto from 'crypto'
export { hashPassword, verifyPassword } from '@/lib/password'

// ============================================================
// Sessão — token stateless assinado (HMAC) em cookie http-only
// Formato: base64(payload).base64(hmac)
// payload: { uid, tipo, iat }
// ============================================================

const SECRET = process.env.SESSION_SECRET || 'manicure-plataforma-secret-dev-key-2024'

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function verify(token: string): { uid: string; tipo: string; iat: number } | null {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    return payload
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'mp_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export async function createSession(userId: string, tipo: string) {
  const token = sign({ uid: userId, tipo, iat: Date.now() })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<{ uid: string; tipo: string } | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verify(token)
}

export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null // não há cookie → não logado

  const session = verify(token)
  if (!session) {
    // Cookie existe mas é inválido (secret mudou, corrompido, etc.)
    // DESTROI o cookie para o usuário poder fazer login limpo
    store.delete(SESSION_COOKIE)
    return null
  }
  try {
    const user = await db.usuario.findUnique({
      where: { id: session.uid },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        tipo: true,
        fotoUrl: true,
        eClienteConfianca: true,
        ativo: true,
      },
    })
    if (!user || !user.ativo) {
      store.delete(SESSION_COOKIE)
      return null
    }
    return { ...user, tipo: user.tipo as 'cliente' | 'manicure' }
  } catch (e) {
    // Erro de DB/conexão — NÃO destrói a sessão (pode ser transitório)
    console.error('getCurrentUser DB error (sessão preservada):', e)
    return null
  }
}

// Helper para rotas de API: retorna usuário ou 401
export async function requireUser(tipo?: 'cliente' | 'manicure') {
  const user = await getCurrentUser()
  if (!user) return { user: null, error: Response.json({ error: 'Não autenticado' }, { status: 401 }) }
  if (tipo && user.tipo !== tipo) {
    return { user: null, error: Response.json({ error: 'Acesso negado' }, { status: 403 }) }
  }
  return { user, error: null }
}

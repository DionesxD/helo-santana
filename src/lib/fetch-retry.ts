// Helper de fetch com retry automático para erros transitórios.
// Em dev, o Next.js recompila rotas sob demanda — a primeira requisição
// após uma edição pode falhar (500/timeout). Este helper tenta novamente.

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
): Promise<Response> {
  let lastError: Error | null = null
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...options, credentials: 'include' })
      // Se a resposta é 401, não retenta (sessão realmente expirada)
      if (res.status === 401) return res
      // Se a resposta é 500 (server recompiling), retenta
      if (res.status >= 500 && i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      return res
    } catch (e) {
      // Erro de rede (Failed to fetch) — pode ser recompile
      lastError = e as Error
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      throw e
    }
  }
  throw lastError ?? new Error('Erro de conexão')
}

// Helper para queries do React Query — fetch com credentials, error handling,
// e valor padrão (nunca retorna undefined).

export async function queryFn<T>(
  url: string,
  field: string,
): Promise<T> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    // Se 401, retorna array vazio (não undefined) — o usuário verá estado vazio
    // em vez de erro. O AuthProvider vai lidar com redirect se necessário.
    if (res.status === 401) return [] as unknown as T
    throw new Error('Erro ao carregar dados')
  }
  const j = await res.json()
  // garante que nunca retorna undefined
  return (j[field] ?? []) as T
}

// Helper para queries do React Query — fetch com credentials, error handling,
// e valor padrão (nunca retorna undefined).

export async function queryFn<T>(
  url: string,
  field: string,
): Promise<T> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    if (res.status === 401) return [] as unknown as T
    throw new Error('Erro ao carregar dados')
  }
  const j = await res.json()
  return (j[field] ?? []) as T
}

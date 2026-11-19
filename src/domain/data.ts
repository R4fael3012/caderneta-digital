/** Data de hoje no fuso do aparelho, como AAAA-MM-DD (o que o <input type="date"> usa). */
export function hojeISO(agora: Date = new Date()): string {
  const m = String(agora.getMonth() + 1).padStart(2, '0')
  const d = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${m}-${d}`
}

export function dataValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [a, m, d] = iso.split('-').map(Number)
  const t = new Date(a, m - 1, d)
  return t.getFullYear() === a && t.getMonth() === m - 1 && t.getDate() === d
}

/** "2026-11-12" → "12/11/2026" (sem passar por Date, para não sofrer com fuso). */
export function formatarData(iso: string): string {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

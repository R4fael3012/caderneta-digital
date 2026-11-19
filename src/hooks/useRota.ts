import { useSyncExternalStore } from 'react'

export type Rota = { nome: 'inicio' } | { nome: 'cliente'; id: string }

function assinar(avisar: () => void) {
  window.addEventListener('hashchange', avisar)
  return () => window.removeEventListener('hashchange', avisar)
}

/** Rotas pelo "#": "#/" é a lista e "#/cliente/ID" é a tela de um cliente. */
export function useRota(): Rota {
  const hash = useSyncExternalStore(assinar, () => window.location.hash, () => '')
  const m = /^#\/cliente\/([^/?#]+)$/.exec(hash)
  if (!m) return { nome: 'inicio' }
  try {
    return { nome: 'cliente', id: decodeURIComponent(m[1]) }
  } catch {
    return { nome: 'inicio' }
  }
}

export const linkCliente = (id: string) => `#/cliente/${encodeURIComponent(id)}`
export const LINK_INICIO = '#/'
export function irParaInicio() {
  window.location.hash = LINK_INICIO
}

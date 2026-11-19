import type { Centavos } from './tipos'

export const MSG_VALOR_POSITIVO = 'O valor deve ser maior que zero.'
export const MSG_VALOR_INVALIDO = 'Digite um valor válido, como 25,90.'
export const MSG_CASAS_DECIMAIS = 'Use no máximo 2 casas decimais.'
export const MSG_LIMITE_OBRIGATORIO = 'Informe o limite de fiado (zero ou mais).'
export const MSG_LIMITE_INVALIDO = 'Digite um limite válido, como 200,00.'

const MAX_CENTAVOS: Centavos = 999_999_999 // R$ 9.999.999,99
export const MSG_VALOR_MAXIMO = 'O valor máximo é R$ 9.999.999,99.'

export type LeituraQuantia =
  | { ok: true; centavos: Centavos }
  | { ok: false; motivo: 'vazio' | 'negativo' | 'invalido' | 'decimais' | 'grande' }

/**
 * Lê o que a pessoa digitou ("25", "25,9", "25,90", "25.90", "R$ 25,90").
 * Vírgula ou ponto valem como separador decimal; milhar com ponto não é
 * aceito (assim "1.234" vira erro em vez de virar R$ 1,23 por engano).
 */
export function lerQuantia(texto: string): LeituraQuantia {
  const s = texto.replace(/R\$/gi, '').replace(/\s/g, '')
  if (s === '') return { ok: false, motivo: 'vazio' }
  if (s.startsWith('-')) return { ok: false, motivo: 'negativo' }
  if (!/^\d+([.,]\d*)?$/.test(s)) return { ok: false, motivo: 'invalido' }

  const [inteiro, fracao = ''] = s.split(/[.,]/)
  if (fracao.length > 2) return { ok: false, motivo: 'decimais' }

  const centavos = Number(inteiro) * 100 + Number(fracao.padEnd(2, '0'))
  if (!Number.isSafeInteger(centavos) || centavos > MAX_CENTAVOS) {
    return { ok: false, motivo: 'grande' }
  }
  return { ok: true, centavos }
}

export type ResultadoValor = { ok: true; centavos: Centavos } | { ok: false; erro: string }

/** RN01: o valor de um lançamento deve ser maior que zero. */
export function lerValor(texto: string): ResultadoValor {
  const r = lerQuantia(texto)
  if (!r.ok) {
    if (r.motivo === 'vazio' || r.motivo === 'negativo') return { ok: false, erro: MSG_VALOR_POSITIVO }
    if (r.motivo === 'decimais') return { ok: false, erro: MSG_CASAS_DECIMAIS }
    if (r.motivo === 'grande') return { ok: false, erro: MSG_VALOR_MAXIMO }
    return { ok: false, erro: MSG_VALOR_INVALIDO }
  }
  if (r.centavos <= 0) return { ok: false, erro: MSG_VALOR_POSITIVO }
  return { ok: true, centavos: r.centavos }
}

/** Limite de fiado: zero ou mais (zero = não vende fiado para o cliente). */
export function lerLimite(texto: string): ResultadoValor {
  const r = lerQuantia(texto)
  if (!r.ok) {
    if (r.motivo === 'vazio' || r.motivo === 'negativo') return { ok: false, erro: MSG_LIMITE_OBRIGATORIO }
    if (r.motivo === 'decimais') return { ok: false, erro: MSG_CASAS_DECIMAIS }
    if (r.motivo === 'grande') return { ok: false, erro: MSG_VALOR_MAXIMO }
    return { ok: false, erro: MSG_LIMITE_INVALIDO }
  }
  return { ok: true, centavos: r.centavos }
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 3050 → "R$ 30,50" (com espaço comum, igual às mensagens do banco). */
export function formatarReais(centavos: Centavos): string {
  return brl.format(centavos / 100).replace(/\u00a0/g, ' ')
}

/** 3050 → "30,50" (para preencher campos de edição). */
export function paraCampo(centavos: Centavos): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

/** Valor que o Supabase devolve (número em reais) → centavos inteiros. */
export function reaisParaCentavos(reais: number): Centavos {
  return Math.round(reais * 100)
}

/** Centavos → número em reais para enviar ao banco (3001 → 30.01). */
export function centavosParaReais(centavos: Centavos): number {
  return centavos / 100
}

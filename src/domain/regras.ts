import { dataValida } from './data'
import { formatarReais, lerLimite, lerValor, MSG_VALOR_POSITIVO } from './dinheiro'
import type { Centavos, Cliente, Lancamento, TipoLancamento } from './tipos'

/* ------------------------------------------------------------------ *
 * Regras de negócio da Caderneta (SPEC.md, seção 5).
 * Funções puras, sem tela e sem banco, para serem testadas direto.
 * Cada regra também existe no banco (supabase/schema.sql) com a MESMA
 * mensagem: a tela avisa cedo, o banco garante.
 * ------------------------------------------------------------------ */

export const TAMANHO = { nome: 80, telefone: 20, descricao: 120 } as const

type Parte = { tipo: TipoLancamento; valor: Centavos }

/** Compra aumenta a dívida; pagamento diminui. */
export function efeito(l: Parte): Centavos {
  return l.tipo === 'compra' ? l.valor : -l.valor
}

/** Saldo devedor = soma das compras − soma dos pagamentos. */
export function saldoDoCliente(lancamentos: ReadonlyArray<Parte>): Centavos {
  return lancamentos.reduce((soma, l) => soma + efeito(l), 0)
}

export type Mudanca = {
  operacao: 'criar' | 'editar' | 'excluir'
  /** saldo do cliente ANTES da mudança */
  saldoAtual: Centavos
  limite: Centavos
  /** lançamento como era (editar, excluir) */
  antigo?: Parte
  /** lançamento como ficará (criar, editar) */
  novo?: Parte
}

/**
 * RN01, RN02 e RN03 sobre uma mudança nos lançamentos.
 * Devolve a mensagem de erro ou null se pode seguir.
 *
 *  - RN01: valor maior que zero
 *  - RN02: o saldo nunca fica negativo (pagamento ≤ dívida atual)
 *  - RN03: a dívida não passa do limite; só barra mudanças que AUMENTAM a
 *    dívida, então reduzir o limite abaixo do saldo não trava o histórico
 */
export function validarMudanca(m: Mudanca): string | null {
  if (m.novo && m.novo.valor <= 0) return MSG_VALOR_POSITIVO

  const saldoNovo = m.saldoAtual - (m.antigo ? efeito(m.antigo) : 0) + (m.novo ? efeito(m.novo) : 0)

  if (saldoNovo < 0) {
    return m.operacao === 'criar'
      ? `O pagamento não pode ser maior que a dívida atual (${formatarReais(m.saldoAtual)}).`
      : 'Não é possível: os pagamentos registrados ficariam maiores que a dívida do cliente.'
  }

  if (saldoNovo > m.limite && saldoNovo > m.saldoAtual) {
    const disponivel = Math.max(m.limite - m.saldoAtual, 0)
    const quem = m.operacao === 'criar' ? 'Esta compra' : 'Esta alteração'
    return `${quem} ultrapassa o limite de fiado (${formatarReais(m.limite)}). Valor disponível: ${formatarReais(disponivel)}.`
  }
  return null
}

/** Excluir cliente com dívida é bloqueado. */
export function validarExclusaoCliente(saldo: Centavos): string | null {
  return saldo > 0
    ? `Este cliente ainda deve ${formatarReais(saldo)}. Registre o pagamento antes de excluir.`
    : null
}

/* ---------------- cadastro de cliente ---------------- */

export type EntradaCliente = { nome: string; telefone: string; limite: string }
export type DadosCliente = { nome: string; telefone: string | null; limite: Centavos }
export type ErrosCliente = Partial<Record<keyof EntradaCliente, string>>

export function validarCliente(
  entrada: EntradaCliente,
): { ok: true; dados: DadosCliente } | { ok: false; erros: ErrosCliente } {
  const erros: ErrosCliente = {}

  const nome = entrada.nome.trim().replace(/\s+/g, ' ')
  if (nome.length < 1 || nome.length > TAMANHO.nome) {
    erros.nome = `Informe o nome do cliente (até ${TAMANHO.nome} caracteres).`
  }

  const telefone = entrada.telefone.trim()
  if (telefone.length > TAMANHO.telefone) {
    erros.telefone = `O telefone pode ter no máximo ${TAMANHO.telefone} caracteres.`
  }

  const limite = lerLimite(entrada.limite)
  if (!limite.ok) erros.limite = limite.erro

  if (Object.keys(erros).length > 0 || !limite.ok) return { ok: false, erros }
  return { ok: true, dados: { nome, telefone: telefone || null, limite: limite.centavos } }
}

/* ---------------- consulta e resumo ---------------- */

/** "João" → "joao": busca sem diferenciar maiúsculas nem acentos. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function filtrarClientes(
  clientes: ReadonlyArray<Cliente>,
  busca: string,
  soDevedores: boolean,
): Cliente[] {
  const termo = normalizarBusca(busca)
  return clientes.filter(
    (c) => (!soDevedores || c.saldo > 0) && (termo === '' || normalizarBusca(c.nome).includes(termo)),
  )
}

/** Total a receber = soma dos saldos devedores de todos os clientes. */
export function totalAReceber(clientes: ReadonlyArray<Pick<Cliente, 'saldo'>>): Centavos {
  return clientes.reduce((soma, c) => soma + Math.max(c.saldo, 0), 0)
}

export function contarDevedores(clientes: ReadonlyArray<Pick<Cliente, 'saldo'>>): number {
  return clientes.filter((c) => c.saldo > 0).length
}

/** Histórico do mais recente para o mais antigo. */
export function ordenarHistorico(lancamentos: ReadonlyArray<Lancamento>): Lancamento[] {
  return [...lancamentos].sort(
    (a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm),
  )
}

export const MSG_DATA_OBRIGATORIA = 'Informe a data do lançamento.'

export function validarDescricao(texto: string): string | null {
  return texto.trim().length > TAMANHO.descricao
    ? `A descrição pode ter no máximo ${TAMANHO.descricao} caracteres.`
    : null
}

/* ---------------- cadastro de lançamento ---------------- */

export type EntradaLancamento = {
  tipo: TipoLancamento
  valor: string
  data: string
  descricao: string
}
export type DadosLancamento = {
  tipo: TipoLancamento
  valor: Centavos
  data: string
  descricao: string | null
}
export type ErrosLancamento = Partial<Record<'valor' | 'data' | 'descricao', string>>

/**
 * Valida o formulário de lançamento: RN01 (valor), RN02 e RN03 (contra o
 * saldo e o limite do cliente). `antigo` só vem quando é uma edição.
 */
export function validarEntradaLancamento(
  entrada: EntradaLancamento,
  contexto: { saldoAtual: Centavos; limite: Centavos; antigo?: Parte },
): { ok: true; dados: DadosLancamento } | { ok: false; erros: ErrosLancamento } {
  const erros: ErrosLancamento = {}

  const valor = lerValor(entrada.valor)
  if (!valor.ok) erros.valor = valor.erro

  if (!dataValida(entrada.data)) erros.data = MSG_DATA_OBRIGATORIA

  const erroDescricao = validarDescricao(entrada.descricao)
  if (erroDescricao) erros.descricao = erroDescricao

  if (valor.ok) {
    const erroRegra = validarMudanca({
      operacao: contexto.antigo ? 'editar' : 'criar',
      saldoAtual: contexto.saldoAtual,
      limite: contexto.limite,
      antigo: contexto.antigo,
      novo: { tipo: entrada.tipo, valor: valor.centavos },
    })
    if (erroRegra) erros.valor = erroRegra
  }

  if (Object.keys(erros).length > 0 || !valor.ok) return { ok: false, erros }
  return {
    ok: true,
    dados: {
      tipo: entrada.tipo,
      valor: valor.centavos,
      data: entrada.data,
      descricao: entrada.descricao.trim() || null,
    },
  }
}

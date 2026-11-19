/** Todo dinheiro é guardado em centavos (inteiros): nada de ponto flutuante. */
export type Centavos = number

export type TipoLancamento = 'compra' | 'pagamento'

export type Cliente = {
  id: string
  nome: string
  telefone: string | null
  limite: Centavos
  saldo: Centavos
}

export type Lancamento = {
  id: string
  clienteId: string
  tipo: TipoLancamento
  valor: Centavos
  descricao: string | null
  /** AAAA-MM-DD */
  data: string
  criadoEm: string
}

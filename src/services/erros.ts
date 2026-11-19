import {
  MSG_LIMITE_INVALIDO,
  MSG_VALOR_POSITIVO,
} from '../domain/dinheiro'

type ErroDoSupabase = { code?: string; message?: string }

/**
 * Traduz o erro do banco para uma mensagem que o comerciante entende.
 * As regras de negócio (RN01 a RN04) já vêm em português do próprio banco
 * (código P0001); os demais casos são traduzidos aqui.
 */
export function traduzirErroDb(error: ErroDoSupabase): string {
  const codigo = error.code ?? ''
  const msg = error.message ?? ''

  if (codigo === 'P0001') return msg

  if (codigo === '23514') {
    if (msg.includes('lancamentos_valor_ck')) return MSG_VALOR_POSITIVO
    if (msg.includes('clientes_nome_ck')) return 'Informe o nome do cliente (até 80 caracteres).'
    if (msg.includes('clientes_limite_ck')) return MSG_LIMITE_INVALIDO
    if (msg.includes('clientes_telefone_ck')) return 'O telefone pode ter no máximo 20 caracteres.'
    if (msg.includes('lancamentos_descricao_ck')) return 'A descrição pode ter no máximo 120 caracteres.'
  }

  if (codigo === '42501' || codigo === 'PGRST301' || /jwt/i.test(msg)) {
    return 'Sua sessão expirou ou você não tem permissão. Entre novamente.'
  }
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
  }
  return 'Não foi possível concluir. Tente novamente.'
}

/** Mensagem pronta para mostrar na tela, venha o erro de onde vier. */
export function mensagemDeErro(e: unknown): string {
  if (e instanceof Error) return e.message
  return 'Algo deu errado. Tente novamente.'
}

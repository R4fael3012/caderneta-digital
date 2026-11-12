import type { AuthError, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { normalizarEmail, normalizarNome } from '../lib/validacao'

function traduzirErro(error: AuthError): string {
  const codigo = error.code ?? ''
  const msg = error.message.toLowerCase()

  if (error.name === 'AuthRetryableFetchError') {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
  }
  if (codigo === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (codigo === 'email_not_confirmed' || msg.includes('not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.'
  }
  if (codigo === 'user_already_exists' || msg.includes('already registered')) {
    return 'Este e-mail já está cadastrado. Entre ou use outro e-mail.'
  }
  if (codigo === 'weak_password') {
    return 'A senha é fraca demais. Use pelo menos 8 caracteres, com letra e número.'
  }
  if (error.status === 429 || codigo.includes('rate_limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  }
  return 'Não foi possível concluir. Tente novamente.'
}

export async function entrar(email: string, senha: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizarEmail(email),
    password: senha,
  })
  if (error) throw new Error(traduzirErro(error))
}

/** Retorna true se o Supabase exige confirmar o e-mail antes de entrar. */
export async function cadastrar(nome: string, email: string, senha: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: normalizarEmail(email),
    password: senha,
    options: { data: { nome: normalizarNome(nome) } },
  })
  if (error) throw new Error(traduzirErro(error))
  return data.session === null
}

export async function sair(): Promise<void> {
  await supabase.auth.signOut()
}

export function nomeDoUsuario(user: User): string {
  const nome = user.user_metadata?.nome
  return typeof nome === 'string' && nome ? nome : (user.email ?? 'comerciante')
}

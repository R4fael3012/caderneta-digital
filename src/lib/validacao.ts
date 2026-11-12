/**
 * Validação dos formulários de acesso.
 * Isto melhora a experiência na tela, mas NÃO é a segurança: quem decide
 * é o Supabase (tamanho mínimo da senha em Authentication, limite de
 * tentativas no servidor).
 */

export const LIMITES = {
  nomeMin: 2,
  nomeMax: 80,
  emailMax: 254,
  senhaMin: 8,
  senhaMax: 128,
} as const

const SENHAS_COMUNS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'senha123',
  'senha1234', 'qwerty123', 'abc12345', '11111111', '00000000', 'mudar123',
])

export const normalizarEmail = (v: string) => v.trim().toLowerCase()
export const normalizarNome = (v: string) => v.trim().replace(/\s+/g, ' ')

export function validarNome(v: string): string {
  const s = normalizarNome(v)
  if (s.length < LIMITES.nomeMin) return 'Informe seu nome (mínimo 2 letras).'
  if (s.length > LIMITES.nomeMax) return 'O nome pode ter no máximo 80 caracteres.'
  return ''
}

export function validarEmail(v: string): string {
  const s = normalizarEmail(v)
  if (!s) return 'Informe seu e-mail.'
  if (s.length > LIMITES.emailMax || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) {
    return 'Digite um e-mail válido, como nome@exemplo.com.'
  }
  return ''
}

export type ChaveRegraSenha = 'tamanho' | 'letra' | 'numero'

export function regrasSenha(v: string): Record<ChaveRegraSenha, boolean> {
  return {
    tamanho: v.length >= LIMITES.senhaMin,
    letra: /[A-Za-zÀ-ÿ]/.test(v),
    numero: /\d/.test(v),
  }
}

export const TEXTO_REGRAS_SENHA: { chave: ChaveRegraSenha; texto: string }[] = [
  { chave: 'tamanho', texto: 'Pelo menos 8 caracteres' },
  { chave: 'letra', texto: 'Uma letra' },
  { chave: 'numero', texto: 'Um número' },
]

export function validarSenha(v: string): string {
  if (!v) return 'Crie uma senha.'
  if (v.length < LIMITES.senhaMin) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (v.length > LIMITES.senhaMax) return 'A senha pode ter no máximo 128 caracteres.'
  const r = regrasSenha(v)
  if (!r.letra || !r.numero) return 'Use pelo menos uma letra e um número.'
  if (SENHAS_COMUNS.has(v.toLowerCase()) || /^(.)\1+$/.test(v)) {
    return 'Essa senha é muito comum. Escolha outra.'
  }
  return ''
}

export function validarConfirmacao(senha: string, confirma: string): string {
  if (!confirma) return 'Repita a senha.'
  if (senha !== confirma) return 'As senhas não são iguais.'
  return ''
}

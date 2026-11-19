#!/usr/bin/env node
/**
 * Ataque ao próprio site (aula 22/10, etapa E6) contra o Supabase REAL.
 * Prova que o banco diz "não" mesmo quando a tela é ignorada.
 *
 * Como rodar (Node 20+), com duas contas de teste já criadas e confirmadas:
 *
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co \
 *   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
 *   EMAIL_A=a@teste.com SENHA_A=... EMAIL_B=b@teste.com SENHA_B=... \
 *   node scripts/ataque.mjs
 *
 * Use contas de TESTE. O script cria e apaga um cliente de teste na conta A.
 * Nunca coloque a chave secreta (service_role) aqui: só a publicável.
 */
import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: chave } = process.env
const { EMAIL_A, SENHA_A, EMAIL_B, SENHA_B } = process.env
if (!url || !chave || !EMAIL_A || !SENHA_A || !EMAIL_B || !SENHA_B) {
  console.error('Faltam variáveis de ambiente. Veja o cabeçalho de scripts/ataque.mjs.')
  process.exit(2)
}
if (/sb_secret_|service_role/.test(chave)) {
  console.error('Essa é a chave SECRETA. Use só a chave publicável (sb_publishable_...).')
  process.exit(2)
}

let falhas = 0
function conferir(nome, passou, detalhe = '') {
  console.log(`${passou ? 'OK   ' : 'FALHA'}  ${nome}${detalhe ? `  → ${detalhe}` : ''}`)
  if (!passou) falhas++
}

const novo = () => createClient(url, chave, { auth: { persistSession: false } })
async function entrar(email, senha) {
  const c = novo()
  const { error } = await c.auth.signInWithPassword({ email, password: senha })
  if (error) throw new Error(`Login de ${email} falhou: ${error.message}`)
  return c
}

// ---- 1. Visitante SEM login (só a chave pública) ----
const anon = novo()
{
  const r = await fetch(`${url}/rest/v1/clientes?id=not.is.null`, {
    method: 'DELETE',
    headers: { apikey: chave },
  })
  conferir('visitante apagar todos os clientes', [401, 403].includes(r.status), `HTTP ${r.status} (esperado 401/403)`)
}
{
  const { data, error } = await anon.from('clientes').select('*')
  conferir('visitante ler clientes', !!error || (data ?? []).length === 0, error ? error.message : `${data.length} linhas`)
}
{
  const { error } = await anon.from('clientes').insert({ nome: 'invasor', limite: 1 })
  conferir('visitante criar cliente', !!error, error?.message)
}
{
  const { data, error } = await anon.from('clientes_com_saldo').select('*')
  conferir('visitante ler a visão de saldos', !!error || (data ?? []).length === 0, error ? error.message : `${data.length} linhas`)
}

// ---- 2. Dois comerciantes ----
const A = await entrar(EMAIL_A, SENHA_A)
const B = await entrar(EMAIL_B, SENHA_B)

const { data: criado, error: erroCriar } = await A.from('clientes')
  .insert({ nome: '[teste ataque]', limite: 100 })
  .select('id')
  .single()
if (erroCriar) throw new Error(`Não consegui criar o cliente de teste: ${erroCriar.message}`)
const id = criado.id

try {
  // RN04: B não vê, não altera, não apaga e não lança no cliente de A
  {
    const { data } = await B.from('clientes').select('*').eq('id', id)
    conferir('RN04 · B ler o cliente de A', (data ?? []).length === 0, `${(data ?? []).length} linhas`)
  }
  {
    const { data } = await B.from('clientes').update({ nome: 'invadido' }).eq('id', id).select()
    conferir('RN04 · B alterar o cliente de A', (data ?? []).length === 0, `${(data ?? []).length} linhas afetadas`)
  }
  {
    const { data } = await B.from('clientes').delete().eq('id', id).select()
    conferir('RN04 · B apagar o cliente de A', (data ?? []).length === 0, `${(data ?? []).length} linhas afetadas`)
  }
  {
    const { error } = await B.from('lancamentos').insert({ cliente_id: id, tipo: 'compra', valor: 10 })
    conferir('RN04 · B lançar na conta do cliente de A', !!error, error?.message)
  }

  // RN01: valores inválidos direto na API, pulando a tela
  for (const [rotulo, valor] of [['zero', 0], ['negativo', -5], ['3 casas decimais', 10.005]]) {
    const { error } = await A.from('lancamentos').insert({ cliente_id: id, tipo: 'compra', valor })
    conferir(`RN01 · valor ${rotulo}`, !!error, error?.message)
  }

  // RN02 e RN03
  {
    const { error } = await A.from('lancamentos').insert({ cliente_id: id, tipo: 'pagamento', valor: 0.01 })
    conferir('RN02 · pagamento com saldo zero', !!error, error?.message)
  }
  {
    const { error } = await A.from('lancamentos').insert({ cliente_id: id, tipo: 'compra', valor: 100.01 })
    conferir('RN03 · compra acima do limite (R$ 100)', !!error, error?.message)
  }
  {
    const { error } = await A.from('lancamentos').insert({ cliente_id: id, tipo: 'compra', valor: 100 })
    conferir('RN03 · compra exatamente no limite é aceita', !error, error?.message)
  }
  {
    const { error } = await A.from('lancamentos').insert({ cliente_id: id, tipo: 'pagamento', valor: 100.01 })
    conferir('RN02 · pagamento R$ 0,01 acima da dívida', !!error, error?.message)
  }
  {
    const { error } = await A.from('clientes').delete().eq('id', id)
    conferir('Excluir cliente que ainda deve é bloqueado', !!error, error?.message)
  }
  {
    const { error } = await A.from('lancamentos').insert({ cliente_id: id, tipo: 'pagamento', valor: 100 })
    conferir('RN02 · pagamento igual à dívida é aceito', !error, error?.message)
  }
} finally {
  // limpeza: com saldo zero o cliente (e o histórico) pode ser excluído
  const { error } = await A.from('clientes').delete().eq('id', id)
  if (error) console.warn(`Atenção: apague o cliente "[teste ataque]" à mão. (${error.message})`)
}

console.log(falhas === 0 ? '\nTudo certo: o banco recusou o que devia.' : `\n${falhas} verificação(ões) falharam.`)
process.exit(falhas === 0 ? 0 : 1)

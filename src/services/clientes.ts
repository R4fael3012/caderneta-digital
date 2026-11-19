import type { DadosCliente } from '../domain/regras'
import { centavosParaReais, reaisParaCentavos } from '../domain/dinheiro'
import type { Cliente } from '../domain/tipos'
import { supabase } from '../lib/supabase'
import { traduzirErroDb } from './erros'

type Linha = { id: string; nome: string; telefone: string | null; limite: number; saldo: number }

const COLUNAS = 'id, nome, telefone, limite, saldo'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const mapear = (l: Linha): Cliente => ({
  id: l.id,
  nome: l.nome,
  telefone: l.telefone,
  limite: reaisParaCentavos(Number(l.limite)),
  saldo: reaisParaCentavos(Number(l.saldo)),
})

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from('clientes_com_saldo').select(COLUNAS).order('nome')
  if (error) throw new Error(traduzirErroDb(error))
  return (data as Linha[]).map(mapear)
}

/** Devolve null se o cliente não existe OU é de outro comerciante (RN04). */
export async function buscarCliente(id: string): Promise<Cliente | null> {
  if (!UUID.test(id)) return null
  const { data, error } = await supabase.from('clientes_com_saldo').select(COLUNAS).eq('id', id).maybeSingle()
  if (error) throw new Error(traduzirErroDb(error))
  return data ? mapear(data as Linha) : null
}

export async function criarCliente(d: DadosCliente): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .insert({ nome: d.nome, telefone: d.telefone, limite: centavosParaReais(d.limite) })
  if (error) throw new Error(traduzirErroDb(error))
}

export async function atualizarCliente(id: string, d: DadosCliente): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .update({ nome: d.nome, telefone: d.telefone, limite: centavosParaReais(d.limite) })
    .eq('id', id)
  if (error) throw new Error(traduzirErroDb(error))
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw new Error(traduzirErroDb(error))
}

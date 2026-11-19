import { centavosParaReais, reaisParaCentavos } from '../domain/dinheiro'
import type { DadosLancamento } from '../domain/regras'
import type { Lancamento, TipoLancamento } from '../domain/tipos'
import { supabase } from '../lib/supabase'
import { traduzirErroDb } from './erros'

type Linha = {
  id: string
  cliente_id: string
  tipo: TipoLancamento
  valor: number
  descricao: string | null
  data: string
  created_at: string
}

const mapear = (l: Linha): Lancamento => ({
  id: l.id,
  clienteId: l.cliente_id,
  tipo: l.tipo,
  valor: reaisParaCentavos(Number(l.valor)),
  descricao: l.descricao,
  data: l.data,
  criadoEm: l.created_at,
})

/** Do mais recente para o mais antigo (RF09). */
export async function listarLancamentos(clienteId: string): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('id, cliente_id, tipo, valor, descricao, data, created_at')
    .eq('cliente_id', clienteId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new Error(traduzirErroDb(error))
  return (data as Linha[]).map(mapear)
}

export async function criarLancamento(clienteId: string, d: DadosLancamento): Promise<void> {
  const { error } = await supabase.from('lancamentos').insert({
    cliente_id: clienteId,
    tipo: d.tipo,
    valor: centavosParaReais(d.valor),
    descricao: d.descricao,
    data: d.data,
  })
  if (error) throw new Error(traduzirErroDb(error))
}

export async function atualizarLancamento(id: string, d: DadosLancamento): Promise<void> {
  const { error } = await supabase
    .from('lancamentos')
    .update({
      tipo: d.tipo,
      valor: centavosParaReais(d.valor),
      descricao: d.descricao,
      data: d.data,
    })
    .eq('id', id)
  if (error) throw new Error(traduzirErroDb(error))
}

export async function excluirLancamento(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos').delete().eq('id', id)
  if (error) throw new Error(traduzirErroDb(error))
}

import { useEffect, useRef, useState } from 'react'
import { Alerta } from '../components/Alerta'
import { FormCliente } from '../components/FormCliente'
import { FormLancamento } from '../components/FormLancamento'
import {
  classeBotaoPerigo,
  classeBotaoSecundario,
  classeCartao,
  classeLink,
  classeMuted,
} from '../components/estilos'
import { formatarData } from '../domain/data'
import { formatarReais } from '../domain/dinheiro'
import {
  validarExclusaoCliente,
  validarMudanca,
  type DadosCliente,
  type DadosLancamento,
} from '../domain/regras'
import type { Cliente, Lancamento } from '../domain/tipos'
import { irParaInicio, LINK_INICIO } from '../hooks/useRota'
import { atualizarCliente, buscarCliente, excluirCliente } from '../services/clientes'
import { mensagemDeErro } from '../services/erros'
import {
  atualizarLancamento,
  criarLancamento,
  excluirLancamento,
  listarLancamentos,
} from '../services/lancamentos'

type Props = { id: string }

export default function DetalheCliente({ id }: Props) {
  /** undefined = carregando, null = não existe (ou é de outro comerciante) */
  const [cliente, setCliente] = useState<Cliente | null | undefined>(undefined)
  const [historico, setHistorico] = useState<Lancamento[]>([])
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [versao, setVersao] = useState(0)
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let ativo = true
    buscarCliente(id)
      .then(async (c) => {
        const lancamentos = c ? await listarLancamentos(c.id) : []
        if (!ativo) return
        setCliente(c)
        setHistorico(lancamentos)
        setErro('')
      })
      .catch((e: unknown) => {
        if (ativo) setErro(mensagemDeErro(e))
      })
    return () => {
      ativo = false
    }
  }, [id, versao])

  useEffect(() => {
    if (cliente) {
      document.title = `${cliente.nome} · Caderneta Digital`
      titulo.current?.focus({ preventScroll: true })
    }
    // só quando o cliente aparece pela primeira vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente?.id])

  const recarregar = () => setVersao((v) => v + 1)

  if (erro && cliente === undefined) {
    return (
      <div className="space-y-3">
        <Alerta tipo="erro">{erro}</Alerta>
        <button type="button" onClick={recarregar} className={classeBotaoSecundario}>
          Tentar de novo
        </button>
      </div>
    )
  }

  if (cliente === undefined) {
    return (
      <p role="status" className={classeMuted}>
        Carregando cliente…
      </p>
    )
  }

  if (cliente === null) {
    return (
      <section className={classeCartao}>
        <h1 className="mb-2 text-2xl font-bold">Cliente não encontrado</h1>
        <p className={`mb-4 ${classeMuted}`}>Esse cliente não existe na sua caderneta.</p>
        <a href={LINK_INICIO} className={classeLink}>
          Voltar para a lista
        </a>
      </section>
    )
  }

  const atual: Cliente = cliente
  const disponivel = Math.max(atual.limite - atual.saldo, 0)

  async function salvarCliente(dados: DadosCliente) {
    await atualizarCliente(atual.id, dados)
    setEditandoCliente(false)
    recarregar()
  }

  async function apagarCliente() {
    setAviso('')
    const bloqueio = validarExclusaoCliente(atual.saldo)
    if (bloqueio) return setAviso(bloqueio)
    if (!window.confirm(`Excluir ${atual.nome} e todo o histórico dele? Isso não pode ser desfeito.`)) return
    try {
      await excluirCliente(atual.id)
      irParaInicio()
    } catch (e) {
      setAviso(mensagemDeErro(e))
    }
  }

  async function novoLancamento(dados: DadosLancamento) {
    await criarLancamento(atual.id, dados)
    recarregar()
  }

  async function editarLancamento(lancamentoId: string, dados: DadosLancamento) {
    await atualizarLancamento(lancamentoId, dados)
    setEditandoId(null)
    recarregar()
  }

  async function apagarLancamento(l: Lancamento) {
    setAviso('')
    const bloqueio = validarMudanca({
      operacao: 'excluir',
      saldoAtual: atual.saldo,
      limite: atual.limite,
      antigo: { tipo: l.tipo, valor: l.valor },
    })
    if (bloqueio) return setAviso(bloqueio)
    if (!window.confirm('Excluir este lançamento?')) return
    try {
      await excluirLancamento(l.id)
      recarregar()
    } catch (e) {
      setAviso(mensagemDeErro(e))
    }
  }

  return (
    <div className="space-y-4">
      <a href={LINK_INICIO} className={classeLink}>
        ← Voltar para a lista
      </a>

      <section aria-labelledby="titulo-cliente" className={classeCartao}>
        <h1 id="titulo-cliente" ref={titulo} tabIndex={-1} className="text-2xl font-bold outline-none">
          {atual.nome}
        </h1>
        {atual.telefone && <p className={classeMuted}>{atual.telefone}</p>}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[10px] bg-emerald-50 p-2 dark:bg-emerald-950">
            <span className={`block text-xs ${classeMuted}`}>{atual.saldo > 0 ? 'Deve' : 'Em dia'}</span>
            <strong data-testid="saldo">{formatarReais(atual.saldo)}</strong>
          </div>
          <div className="rounded-[10px] bg-stone-100 p-2 dark:bg-stone-800">
            <span className={`block text-xs ${classeMuted}`}>Limite</span>
            <strong>{formatarReais(atual.limite)}</strong>
          </div>
          <div className="rounded-[10px] bg-stone-100 p-2 dark:bg-stone-800">
            <span className={`block text-xs ${classeMuted}`}>Disponível</span>
            <strong>{formatarReais(disponivel)}</strong>
          </div>
        </div>

        {aviso && (
          <div className="mt-4">
            <Alerta tipo="erro">{aviso}</Alerta>
          </div>
        )}

        {editandoCliente ? (
          <div className="mt-4">
            <FormCliente inicial={atual} aoSalvar={salvarCliente} aoCancelar={() => setEditandoCliente(false)} />
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setEditandoCliente(true)} className={classeBotaoSecundario}>
              Editar cliente
            </button>
            <button type="button" onClick={apagarCliente} className={classeBotaoPerigo}>
              Excluir cliente
            </button>
          </div>
        )}
      </section>

      {editandoId === null && (
        <section aria-labelledby="titulo-novo" className={classeCartao}>
          <h2 id="titulo-novo" className="mb-3 text-lg font-bold">
            Novo lançamento
          </h2>
          <FormLancamento cliente={atual} aoSalvar={novoLancamento} />
        </section>
      )}

      <section aria-labelledby="titulo-historico" className={classeCartao}>
        <h2 id="titulo-historico" className="mb-3 text-lg font-bold">
          Histórico
        </h2>

        {historico.length === 0 ? (
          <p className={classeMuted}>Nenhum lançamento ainda. Registre a primeira compra acima.</p>
        ) : (
          <ul className="space-y-3">
            {historico.map((l) =>
              editandoId === l.id ? (
                <li key={l.id} className="rounded-[10px] border border-emerald-700 p-3 dark:border-emerald-400">
                  <FormLancamento
                    cliente={atual}
                    inicial={l}
                    aoSalvar={(d) => editarLancamento(l.id, d)}
                    aoCancelar={() => setEditandoId(null)}
                  />
                </li>
              ) : (
                <li key={l.id} className="rounded-[10px] border border-stone-300 p-3 dark:border-stone-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{l.tipo === 'compra' ? 'Compra fiada' : 'Pagamento'}</p>
                      <p className={`text-sm ${classeMuted}`}>
                        {formatarData(l.data)}
                        {l.descricao ? ` · ${l.descricao}` : ''}
                      </p>
                    </div>
                    <strong className="shrink-0">
                      {l.tipo === 'compra' ? '+ ' : '− '}
                      {formatarReais(l.valor)}
                    </strong>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAviso('')
                        setEditandoId(l.id)
                      }}
                      className={`${classeBotaoSecundario} min-h-10!`}
                    >
                      Editar
                    </button>
                    <button type="button" onClick={() => apagarLancamento(l)} className={`${classeBotaoPerigo} min-h-10!`}>
                      Excluir
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  )
}

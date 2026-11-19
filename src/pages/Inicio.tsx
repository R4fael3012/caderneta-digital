import { useEffect, useRef, useState } from 'react'
import { Alerta } from '../components/Alerta'
import { FormCliente } from '../components/FormCliente'
import { classeBotaoPrimario, classeBotaoSecundario, classeCartao, classeMuted } from '../components/estilos'
import { formatarReais } from '../domain/dinheiro'
import { contarDevedores, filtrarClientes, totalAReceber, type DadosCliente } from '../domain/regras'
import type { Cliente } from '../domain/tipos'
import { linkCliente } from '../hooks/useRota'
import { criarCliente, listarClientes } from '../services/clientes'
import { mensagemDeErro } from '../services/erros'

export default function Inicio() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState(0)
  const [busca, setBusca] = useState('')
  const [soDevedores, setSoDevedores] = useState(false)
  const [criando, setCriando] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = 'Clientes · Caderneta Digital'
    titulo.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    let ativo = true
    listarClientes()
      .then((lista) => {
        if (!ativo) return
        setClientes(lista)
        setErro('')
      })
      .catch((e: unknown) => {
        if (ativo) setErro(mensagemDeErro(e))
      })
    return () => {
      ativo = false
    }
  }, [versao])

  const recarregar = () => setVersao((v) => v + 1)

  async function salvarNovo(dados: DadosCliente) {
    await criarCliente(dados)
    setCriando(false)
    recarregar()
  }

  const lista = clientes ?? []
  const visiveis = filtrarClientes(lista, busca, soDevedores)

  return (
    <div className="space-y-4">
      <section aria-labelledby="titulo-inicio" className={classeCartao}>
        <h1 id="titulo-inicio" ref={titulo} tabIndex={-1} className="mb-4 text-2xl font-bold outline-none">
          Seus clientes
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[10px] bg-emerald-50 p-3 dark:bg-emerald-950">
            <span className={`block text-sm ${classeMuted}`}>Total a receber</span>
            <strong className="text-xl" data-testid="total-a-receber">
              {formatarReais(totalAReceber(lista))}
            </strong>
          </div>
          <div className="rounded-[10px] bg-emerald-50 p-3 dark:bg-emerald-950">
            <span className={`block text-sm ${classeMuted}`}>Devedores</span>
            <strong className="text-xl">
              {contarDevedores(lista)} de {lista.length}
            </strong>
          </div>
        </div>
      </section>

      {erro && (
        <div>
          <Alerta tipo="erro">{erro}</Alerta>
          <button type="button" onClick={recarregar} className={classeBotaoSecundario}>
            Tentar de novo
          </button>
        </div>
      )}

      {criando ? (
        <section className={classeCartao}>
          <FormCliente aoSalvar={salvarNovo} aoCancelar={() => setCriando(false)} />
        </section>
      ) : (
        <button type="button" onClick={() => setCriando(true)} className={classeBotaoPrimario}>
          Novo cliente
        </button>
      )}

      {clientes === null && !erro && (
        <p role="status" className={classeMuted}>
          Carregando clientes…
        </p>
      )}

      {clientes !== null && lista.length === 0 && (
        <div className="rounded-[10px] border-[1.5px] border-dashed border-stone-300 p-6 text-center dark:border-stone-600">
          <p className="font-bold">Cadastre seu primeiro cliente</p>
          <p className={`text-sm ${classeMuted}`}>
            Depois é só lançar as compras fiadas e os pagamentos dele.
          </p>
        </div>
      )}

      {lista.length > 0 && (
        <section aria-label="Lista de clientes" className="space-y-3">
          <div>
            <label htmlFor="busca" className="mb-1 block font-semibold">
              Buscar cliente
            </label>
            <input
              id="busca"
              type="search"
              autoComplete="off"
              placeholder="Digite parte do nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="min-h-12 w-full rounded-[10px] border-[1.5px] border-stone-300 bg-white px-3 py-2 text-base text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </div>

          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={soDevedores}
              onChange={(e) => setSoDevedores(e.target.checked)}
              className="size-5 accent-emerald-700"
            />
            Só quem está devendo
          </label>

          <p role="status" className={`text-sm ${classeMuted}`}>
            {visiveis.length === 1 ? '1 cliente' : `${visiveis.length} clientes`}
          </p>

          {visiveis.length === 0 ? (
            <p className="py-4 text-center">Nenhum cliente encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {visiveis.map((c) => (
                <li key={c.id}>
                  <a
                    href={linkCliente(c.id)}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-stone-300 bg-white px-4 py-3 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.nome}</span>
                      <span className={`block text-sm ${classeMuted}`}>
                        Limite {formatarReais(c.limite)}
                        {c.telefone ? ` · ${c.telefone}` : ''}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className={`block text-xs ${classeMuted}`}>{c.saldo > 0 ? 'Deve' : 'Em dia'}</span>
                      <strong>{formatarReais(c.saldo)}</strong>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

import { useId, useRef, useState, type FormEvent } from 'react'
import { hojeISO } from '../domain/data'
import { paraCampo } from '../domain/dinheiro'
import {
  validarEntradaLancamento,
  type DadosLancamento,
  type ErrosLancamento,
} from '../domain/regras'
import type { Cliente, Lancamento, TipoLancamento } from '../domain/tipos'
import { focarPrimeiroInvalido } from '../lib/foco'
import { mensagemDeErro } from '../services/erros'
import { Alerta } from './Alerta'
import { Campo } from './Campo'
import { classeBotaoPrimario, classeBotaoSecundario } from './estilos'

type Props = {
  /** Cliente com o saldo e o limite de agora, para avisar na tela antes do banco. */
  cliente: Cliente
  /** Se vier, é edição de um lançamento existente. */
  inicial?: Lancamento
  aoSalvar: (dados: DadosLancamento) => Promise<void>
  aoCancelar?: () => void
}

const ROTULO: Record<TipoLancamento, string> = { compra: 'Compra fiada', pagamento: 'Pagamento' }

export function FormLancamento({ cliente, inicial, aoSalvar, aoCancelar }: Props) {
  const nomeRadio = useId()
  const campoValor = useRef<HTMLDivElement>(null)
  const [tipo, setTipo] = useState<TipoLancamento>(inicial?.tipo ?? 'compra')
  const [valor, setValor] = useState(inicial ? paraCampo(inicial.valor) : '')
  const [data, setData] = useState(inicial?.data ?? hojeISO())
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [erros, setErros] = useState<ErrosLancamento>({})
  const [alerta, setAlerta] = useState('')
  const [enviando, setEnviando] = useState(false)

  const limpar = (campo: keyof ErrosLancamento) => setErros((x) => ({ ...x, [campo]: undefined }))

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setAlerta('')

    const r = validarEntradaLancamento(
      { tipo, valor, data, descricao },
      {
        saldoAtual: cliente.saldo,
        limite: cliente.limite,
        antigo: inicial ? { tipo: inicial.tipo, valor: inicial.valor } : undefined,
      },
    )
    if (!r.ok) {
      setErros(r.erros)
      return focarPrimeiroInvalido(form)
    }
    setErros({})

    setEnviando(true)
    try {
      await aoSalvar(r.dados)
      if (!inicial) {
        setValor('')
        setDescricao('')
        campoValor.current?.querySelector('input')?.focus()
      }
    } catch (err) {
      setAlerta(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-label={inicial ? 'Editar lançamento' : 'Novo lançamento'}>
      {alerta && <Alerta tipo="erro">{alerta}</Alerta>}

      <fieldset className="mb-4">
        <legend className="mb-1 font-semibold">Tipo</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['compra', 'pagamento'] as const).map((t) => (
            <label
              key={t}
              className="flex min-h-12 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-stone-300 px-3 font-semibold has-checked:border-emerald-700 has-checked:bg-emerald-50 has-checked:text-emerald-900 has-focus-visible:outline-[3px] has-focus-visible:outline-offset-2 has-focus-visible:outline-amber-500 dark:border-stone-600 dark:has-checked:border-emerald-400 dark:has-checked:bg-emerald-950 dark:has-checked:text-emerald-100"
            >
              <input
                type="radio"
                name={nomeRadio}
                value={t}
                checked={tipo === t}
                onChange={() => {
                  setTipo(t)
                  limpar('valor')
                }}
                className="sr-only"
              />
              {ROTULO[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <div ref={campoValor}>
        <Campo
          rotulo="Valor (R$)"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="Ex.: 25,90"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value)
            limpar('valor')
          }}
          erro={erros.valor}
        />
      </div>
      <Campo
        rotulo="Data"
        type="date"
        value={data}
        onChange={(e) => {
          setData(e.target.value)
          limpar('data')
        }}
        erro={erros.data}
      />
      <Campo
        rotulo="Descrição (opcional)"
        type="text"
        autoComplete="off"
        maxLength={120}
        placeholder="Ex.: arroz e feijão"
        value={descricao}
        onChange={(e) => {
          setDescricao(e.target.value)
          limpar('descricao')
        }}
        erro={erros.descricao}
      />

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} aria-busy={enviando} className={classeBotaoPrimario}>
          {enviando ? 'Salvando…' : inicial ? 'Salvar alteração' : `Registrar ${ROTULO[tipo].toLowerCase()}`}
        </button>
        {aoCancelar && (
          <button type="button" onClick={aoCancelar} disabled={enviando} className={classeBotaoSecundario}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

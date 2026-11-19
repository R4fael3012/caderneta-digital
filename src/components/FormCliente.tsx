import { useState, type FormEvent } from 'react'
import { paraCampo } from '../domain/dinheiro'
import { validarCliente, type DadosCliente, type ErrosCliente } from '../domain/regras'
import type { Cliente } from '../domain/tipos'
import { focarPrimeiroInvalido } from '../lib/foco'
import { mensagemDeErro } from '../services/erros'
import { Alerta } from './Alerta'
import { Campo } from './Campo'
import { classeBotaoPrimario, classeBotaoSecundario } from './estilos'

type Props = {
  /** Se vier, é edição; se não, é um cliente novo. */
  inicial?: Cliente
  aoSalvar: (dados: DadosCliente) => Promise<void>
  aoCancelar: () => void
}

export function FormCliente({ inicial, aoSalvar, aoCancelar }: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [limite, setLimite] = useState(inicial ? paraCampo(inicial.limite) : '')
  const [erros, setErros] = useState<ErrosCliente>({})
  const [alerta, setAlerta] = useState('')
  const [enviando, setEnviando] = useState(false)

  const limpar = (campo: keyof ErrosCliente) => setErros((x) => ({ ...x, [campo]: undefined }))

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setAlerta('')

    const r = validarCliente({ nome, telefone, limite })
    if (!r.ok) {
      setErros(r.erros)
      return focarPrimeiroInvalido(form)
    }
    setErros({})

    setEnviando(true)
    try {
      await aoSalvar(r.dados)
    } catch (err) {
      setAlerta(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-label={inicial ? 'Editar cliente' : 'Novo cliente'}>
      <h2 className="mb-3 text-lg font-bold">{inicial ? 'Editar cliente' : 'Novo cliente'}</h2>
      {alerta && <Alerta tipo="erro">{alerta}</Alerta>}

      <Campo
        rotulo="Nome"
        type="text"
        autoComplete="off"
        maxLength={80}
        value={nome}
        onChange={(e) => {
          setNome(e.target.value)
          limpar('nome')
        }}
        erro={erros.nome}
      />
      <Campo
        rotulo="Telefone (opcional)"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        maxLength={20}
        value={telefone}
        onChange={(e) => {
          setTelefone(e.target.value)
          limpar('telefone')
        }}
        erro={erros.telefone}
      />
      <Campo
        rotulo="Limite de fiado (R$)"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="Ex.: 200,00"
        value={limite}
        onChange={(e) => {
          setLimite(e.target.value)
          limpar('limite')
        }}
        erro={erros.limite}
      />

      <div className="flex gap-2">
        <button type="submit" disabled={enviando} aria-busy={enviando} className={classeBotaoPrimario}>
          {enviando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" onClick={aoCancelar} disabled={enviando} className={classeBotaoSecundario}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { entrar } from '../services/auth'
import { focarPrimeiroInvalido } from '../lib/foco'
import { validarEmail } from '../lib/validacao'
import { Alerta } from './Alerta'
import { Campo } from './Campo'
import { CampoSenha } from './CampoSenha'
import { classeBotaoPrimario } from './estilos'

export function FormEntrar() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState({ email: '', senha: '' })
  const [alerta, setAlerta] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setAlerta('')

    const novos = {
      email: validarEmail(email),
      senha: senha ? '' : 'Informe sua senha.',
    }
    setErros(novos)
    if (novos.email || novos.senha) return focarPrimeiroInvalido(form)

    setEnviando(true)
    try {
      await entrar(email, senha)
      /* sucesso: o App percebe a sessão nova e troca de tela */
    } catch (err) {
      setSenha('')
      setAlerta(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {alerta && <Alerta tipo="erro">{alerta}</Alerta>}

      <Campo
        rotulo="E-mail"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setErros((x) => ({ ...x, email: '' }))
        }}
        erro={erros.email}
      />

      <CampoSenha
        rotulo="Senha"
        autoComplete="current-password"
        valor={senha}
        aoMudar={(v) => {
          setSenha(v)
          setErros((x) => ({ ...x, senha: '' }))
        }}
        erro={erros.senha}
      />

      <button type="submit" disabled={enviando} aria-busy={enviando} className={classeBotaoPrimario}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { cadastrar } from '../services/auth'
import { focarPrimeiroInvalido } from '../lib/foco'
import {
  TEXTO_REGRAS_SENHA,
  regrasSenha,
  validarConfirmacao,
  validarEmail,
  validarNome,
  validarSenha,
} from '../lib/validacao'
import { Alerta } from './Alerta'
import { Campo } from './Campo'
import { CampoSenha } from './CampoSenha'
import { classeBotaoPrimario, classeMuted } from './estilos'

type Erros = { nome: string; email: string; senha: string; confirma: string }
const SEM_ERROS: Erros = { nome: '', email: '', senha: '', confirma: '' }

export function FormCadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erros, setErros] = useState<Erros>(SEM_ERROS)
  const [alerta, setAlerta] = useState<{ tipo: 'erro' | 'info'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const limpar = (campo: keyof Erros) => setErros((x) => ({ ...x, [campo]: '' }))
  const regras = regrasSenha(senha)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setAlerta(null)

    const novos: Erros = {
      nome: validarNome(nome),
      email: validarEmail(email),
      senha: validarSenha(senha),
      confirma: validarConfirmacao(senha, confirma),
    }
    setErros(novos)
    if (Object.values(novos).some(Boolean)) return focarPrimeiroInvalido(form)

    setEnviando(true)
    try {
      const precisaConfirmar = await cadastrar(nome, email, senha)
      if (precisaConfirmar) {
        setAlerta({
          tipo: 'info',
          texto: `Enviamos uma mensagem para ${email.trim()}. Abra o link para ativar a conta e depois entre. Se você já tem conta com esse e-mail, use "Entrar".`,
        })
        setSenha('')
        setConfirma('')
      }
      /* sem confirmação: o App percebe a sessão nova e troca de tela */
    } catch (err) {
      setAlerta({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      {alerta && <Alerta tipo={alerta.tipo}>{alerta.texto}</Alerta>}

      <Campo
        rotulo="Seu nome ou nome do comércio"
        type="text"
        autoComplete="name"
        maxLength={80}
        value={nome}
        onChange={(e) => {
          setNome(e.target.value)
          limpar('nome')
        }}
        onBlur={() => setErros((x) => ({ ...x, nome: validarNome(nome) }))}
        erro={erros.nome}
      />

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
          limpar('email')
        }}
        onBlur={() => setErros((x) => ({ ...x, email: validarEmail(email) }))}
        erro={erros.email}
      />

      <CampoSenha
        rotulo="Senha"
        autoComplete="new-password"
        valor={senha}
        aoMudar={(v) => {
          setSenha(v)
          limpar('senha')
        }}
        erro={erros.senha}
        extra={
          <ul className="text-sm">
            {TEXTO_REGRAS_SENHA.map(({ chave, texto }) => {
              const ok = regras[chave]
              return (
                <li key={chave} className={ok ? 'text-emerald-800 dark:text-emerald-300' : classeMuted}>
                  <span aria-hidden="true">{ok ? '●' : '○'}</span> {texto}{' '}
                  <span className="sr-only">{ok ? '(atendido)' : '(pendente)'}</span>
                </li>
              )
            })}
          </ul>
        }
      />

      <CampoSenha
        rotulo="Repita a senha"
        autoComplete="new-password"
        valor={confirma}
        aoMudar={(v) => {
          setConfirma(v)
          limpar('confirma')
        }}
        erro={erros.confirma}
      />

      <button type="submit" disabled={enviando} aria-busy={enviando} className={classeBotaoPrimario}>
        {enviando ? 'Criando conta…' : 'Criar conta'}
      </button>
    </form>
  )
}

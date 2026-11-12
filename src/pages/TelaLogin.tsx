import { useEffect, useRef, useState } from 'react'
import { FormCadastro } from '../components/FormCadastro'
import { FormEntrar } from '../components/FormEntrar'
import { classeMuted } from '../components/estilos'

type Modo = 'entrar' | 'cadastrar'

export default function TelaLogin() {
  const [modo, setModo] = useState<Modo>('entrar')
  const titulo = useRef<HTMLHeadingElement>(null)
  const primeiraVez = useRef(true)

  /* ao trocar de formulário, leva o foco ao título (leitores de tela e teclado) */
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    titulo.current?.focus({ preventScroll: true })
    document.title = (modo === 'entrar' ? 'Entrar' : 'Criar conta') + ' · Caderneta Digital'
  }, [modo])

  const entrando = modo === 'entrar'

  return (
    <section
      aria-labelledby="titulo-acesso"
      className="rounded-xl border border-stone-300 bg-white px-5 py-6 shadow-sm dark:border-stone-700 dark:bg-stone-900"
    >
      <h1 id="titulo-acesso" ref={titulo} tabIndex={-1} className="mb-1 text-2xl font-bold outline-none">
        {entrando ? 'Entrar na Caderneta' : 'Criar conta'}
      </h1>
      <p className={`mb-5 ${classeMuted}`}>
        {entrando
          ? 'Veja em segundos quanto cada cliente deve.'
          : 'Leva menos de um minuto. Seus clientes ficam só com você.'}
      </p>

      {entrando ? <FormEntrar /> : <FormCadastro />}

      <p className={`mt-5 text-center ${classeMuted}`}>
        {entrando ? 'Ainda não tem conta? ' : 'Já tem conta? '}
        <button
          type="button"
          onClick={() => setModo(entrando ? 'cadastrar' : 'entrar')}
          className="font-semibold text-emerald-800 underline dark:text-emerald-300"
        >
          {entrando ? 'Cadastre seu comércio' : 'Entrar'}
        </button>
      </p>
    </section>
  )
}


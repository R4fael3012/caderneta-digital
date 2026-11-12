import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { LIMITES } from '../lib/validacao'
import { classeInput, classeMuted } from './estilos'

type Props = {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  autoComplete: 'current-password' | 'new-password'
  erro?: string
  /** Conteúdo extra abaixo do campo, como a lista de regras da senha. */
  extra?: ReactNode
}

export function CampoSenha({ rotulo, valor, aoMudar, autoComplete, erro, extra }: Props) {
  const id = useId()
  const [visivel, setVisivel] = useState(false)
  const [capsLigado, setCapsLigado] = useState(false)

  const verCaps = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLigado(e.getModifierState('CapsLock'))
  }

  const ids = [extra && `${id}-extra`, capsLigado && `${id}-caps`, erro && `${id}-erro`]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block font-semibold">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          onKeyDown={verCaps}
          onKeyUp={verCaps}
          onBlur={() => setCapsLigado(false)}
          autoComplete={autoComplete}
          maxLength={LIMITES.senhaMax}
          aria-invalid={erro ? true : undefined}
          aria-describedby={ids || undefined}
          className={`${classeInput} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-1 right-1 rounded-lg px-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
        >
          {visivel ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {extra && (
        <div id={`${id}-extra`} className="mt-2">
          {extra}
        </div>
      )}
      {capsLigado && (
        <p id={`${id}-caps`} className={`mt-1 text-sm ${classeMuted}`}>
          Caps Lock está ligado.
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="mt-1 text-sm text-red-700 dark:text-red-300">
          {erro}
        </p>
      )}
    </div>
  )
}

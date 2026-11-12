import { useId, type InputHTMLAttributes } from 'react'
import { classeInput } from './estilos'

type Props = {
  rotulo: string
  erro?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-invalid' | 'aria-describedby'>

export function Campo({ rotulo, erro, ...input }: Props) {
  const id = useId()
  const erroId = `${id}-erro`

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? erroId : undefined}
        className={classeInput}
        {...input}
      />
      {erro && (
        <p id={erroId} className="mt-1 text-sm text-red-700 dark:text-red-300">
          {erro}
        </p>
      )}
    </div>
  )
}

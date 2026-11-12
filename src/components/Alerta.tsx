type Props = { tipo: 'erro' | 'info'; children: string }

export function Alerta({ tipo, children }: Props) {
  const cores =
    tipo === 'erro'
      ? 'border-red-700 bg-red-50 text-red-800 dark:border-red-300 dark:bg-red-950 dark:text-red-200'
      : 'border-emerald-700 bg-emerald-50 text-stone-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-stone-100'

  return (
    <div role="alert" className={`mb-4 rounded-[10px] border px-4 py-3 text-[0.95rem] ${cores}`}>
      {children}
    </div>
  )
}

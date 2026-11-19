import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  nomeUsuario?: string
  aoSair?: () => void
}

export function Layout({ children, nomeUsuario, aoSair }: Props) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <a
        href="#conteudo"
        className="absolute -left-[999px] top-0 z-10 bg-white px-4 py-2 text-stone-900 focus:left-0"
      >
        Ir para o conteúdo
      </a>

      <header className="flex items-center justify-between gap-4 border-b border-stone-300 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
        <a href="#/" className="flex items-center gap-2 font-bold no-underline">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-lg bg-emerald-700 font-extrabold text-white"
          >
            C
          </span>
          <span>Caderneta Digital</span>
        </a>

        {nomeUsuario && aoSair && (
          <div className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400">
            <span className="max-w-[10rem] truncate">{nomeUsuario}</span>
            <button
              type="button"
              onClick={aoSair}
              className="min-h-9 rounded-[10px] border-[1.5px] border-stone-300 px-3 text-stone-900 dark:border-stone-600 dark:text-stone-100"
            >
              Sair
            </button>
          </div>
        )}
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-[440px] px-4 pb-12 pt-5">
        {children}
      </main>
    </div>
  )
}

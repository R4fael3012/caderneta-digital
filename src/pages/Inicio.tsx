import { classeMuted } from '../components/estilos'

type Props = { nome: string; email: string }

export default function Inicio({ nome, email }: Props) {
  return (
    <section
      aria-labelledby="titulo-inicio"
      className="rounded-xl border border-stone-300 bg-white px-5 py-6 shadow-sm dark:border-stone-700 dark:bg-stone-900"
    >
      <h1 id="titulo-inicio" className="mb-1 text-2xl font-bold">
        Olá, {nome}
      </h1>
      <p className={`mb-5 ${classeMuted}`}>
        Esta caderneta é só sua: nenhum outro comerciante vê estes dados.
      </p>

      <div className="mb-4 rounded-[10px] border-[1.5px] border-dashed border-stone-300 p-6 text-center dark:border-stone-600">
        <p className="font-bold">Cadastre seu primeiro cliente</p>
        <p className={`text-sm ${classeMuted}`}>Clientes e lançamentos entram na próxima etapa.</p>
      </div>

      <p className={`text-sm ${classeMuted}`}>Conectado como {email}</p>
    </section>
  )
}


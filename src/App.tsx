import { Layout } from './components/Layout'
import { useRota } from './hooks/useRota'
import { useSessao } from './hooks/useSessao'
import DetalheCliente from './pages/DetalheCliente'
import Inicio from './pages/Inicio'
import TelaLogin from './pages/TelaLogin'
import { nomeDoUsuario, sair } from './services/auth'

export default function App() {
  const { session, carregando } = useSessao()
  const rota = useRota()

  if (carregando) {
    return (
      <Layout>
        <p role="status">Carregando…</p>
      </Layout>
    )
  }

  /* sem sessão, só a tela de acesso aparece (CA03) */
  if (!session) {
    return (
      <Layout>
        <TelaLogin />
      </Layout>
    )
  }

  return (
    <Layout nomeUsuario={nomeDoUsuario(session.user)} aoSair={sair}>
      {rota.nome === 'cliente' ? <DetalheCliente key={rota.id} id={rota.id} /> : <Inicio />}
    </Layout>
  )
}

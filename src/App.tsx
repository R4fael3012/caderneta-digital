import { Layout } from './components/Layout'
import { useSessao } from './hooks/useSessao'
import Inicio from './pages/Inicio'
import TelaLogin from './pages/TelaLogin'
import { nomeDoUsuario, sair } from './services/auth'

export default function App() {
  const { session, carregando } = useSessao()

  if (carregando) {
    return (
      <Layout>
        <p role="status">Carregando…</p>
      </Layout>
    )
  }

  /* sem sessão, só a tela de acesso aparece */
  if (!session) {
    return (
      <Layout>
        <TelaLogin />
      </Layout>
    )
  }

  const nome = nomeDoUsuario(session.user)
  return (
    <Layout nomeUsuario={nome} aoSair={sair}>
      <Inicio nome={nome} email={session.user.email ?? ''} />
    </Layout>
  )
}

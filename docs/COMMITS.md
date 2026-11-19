# Como fazer os commits (e por que importa)

A nota de Engenharia olha **commits dos dois integrantes, ao longo das semanas, com mensagens que explicam**. Um commit gigante no fim não é aceito.
Por isso o pacote não vem commitado: vocês criam os commits **com a identidade de vocês**, em partes, e **cada um faz os seus**.

> Não alterem datas nem autoria dos commits. O que vale é o histórico verdadeiro.

Antes de começar (cada um no seu computador):

```bash
git config user.name  "Seu Nome"
git config user.email "seu-email-do-github"
git pull
npm install
```

## Sequência sugerida

Cada bloco é um commit. Rodem `npm run lint && npm test` antes de commitar os blocos de código.
Dividam como quiserem: por exemplo **Pessoa A** faz 1 a 4 e **Pessoa B** faz 5 a 9. Quem faz o segundo grupo precisa dar `git pull` antes.

```bash
# 1. Pessoa A — consertar o build (o Tailwind não estava ativo) e preparar os testes
git add vite.config.ts package.json package-lock.json
git commit -m "fix: ativa o plugin do Tailwind no Vite e adiciona Vitest e PGlite"

# 2. Pessoa A — banco com regras e RLS
git add supabase/schema.sql
git commit -m "feat(banco): tabelas clientes e lancamentos com RN01 a RN03 em gatilho e RLS por usuário"

# 3. Pessoa A — regras de negócio na tela, com testes
git add src/domain
git commit -m "feat(dominio): regras RN01 a RN03, saldo, busca e total a receber, com testes"

# 4. Pessoa A — testes do banco
git add src/db
git commit -m "test(banco): testa regras e isolamento entre comerciantes com Postgres em memória"

# 5. Pessoa B — serviços que falam com o Supabase
git add src/services src/hooks/useRota.ts
git commit -m "feat(servicos): clientes, lancamentos e tradução dos erros do banco"

# 6. Pessoa B — formulários
git add src/components
git commit -m "feat(ui): formulários de cliente e lançamento com validação na tela"

# 7. Pessoa B — telas
git add src/pages src/App.tsx index.html
git commit -m "feat(telas): lista de clientes com busca, filtro e total; detalhe com histórico"

# 8. Pessoa B — CI e ataque
git add .github scripts
git commit -m "ci: roda lint, testes e build no GitHub Actions; script de ataque ao sistema"

# 9. Os dois — documentação (cada um pode commitar um arquivo)
git add README.md AGENTS.md IA.md docs
git commit -m "docs: README, AGENTS, IA.md e roteiros de defesa e revisão"

git push
```

Se preferirem commits menores, melhor: quanto mais passos pequenos e explicados, melhor o histórico.
Depois de publicar, façam também commits **de verdade** com o que mudarem a partir da revisão do outro grupo.

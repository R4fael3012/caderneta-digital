# Caderneta Digital

Controle de fiado para comércio de bairro, no lugar do caderno de papel.

> **Link no ar:** https://SEU-LINK-AQUI <!-- PREENCHER após o deploy (ver seção "Publicação") -->

## O que é

O dono de mercadinho hoje anota o fiado no caderno e perde dinheiro porque esquece quem deve quanto. Com a Caderneta, ele consegue ver em segundos quanto cada cliente deve e o total a receber.

**Para quem:** donos e atendentes de mercadinho, padaria, açougue, bar e lojas de bairro que vendem fiado.

### O que o sistema faz

- **Login:** cada comerciante vê somente os próprios clientes e lançamentos.
- **Clientes:** cadastro, edição, listagem e exclusão (nome, telefone e limite de fiado).
- **Lançamentos:** cada cliente tem várias compras fiadas e pagamentos, com CRUD completo.
- **Saldo:** o saldo devedor é calculado a partir dos lançamentos (compras − pagamentos).
- **Consulta e resumo:** busca por nome, filtro "somente devedores" e total a receber.

### Regras de negócio

| ID | Regra |
|---|---|
| RN01 | O valor do lançamento deve ser maior que zero. |
| RN02 | O pagamento não pode ser maior que a dívida atual. |
| RN03 | O cliente não pode passar do limite de fiado definido para ele. |
| RN04 | Um comerciante nunca acessa dados de outro. |

O planejamento completo (público, escopo, requisitos e critérios de aceitação) está em [`SPEC.md`](./SPEC.md).

## Tecnologias

- React + TypeScript + Vite
- Tailwind CSS
- Supabase: Postgres, login (Auth) e API REST. Não há servidor próprio; quem protege os dados é o banco (RLS)
- Vitest (testes) e PGlite (Postgres em memória, para testar o banco)
- GitHub Actions (lint, testes e build a cada push)
- Vercel (publicação)

### Como o sistema é organizado

```
src/domain/     regras de negócio em funções puras (RN01 a RN03, saldo, busca, total)
src/services/   conversa com o Supabase (clientes, lançamentos, login) e tradução de erros
src/pages/      telas: login, lista de clientes, detalhe do cliente
src/components/ formulários e peças de interface
src/db/         testes do banco com Postgres em memória
supabase/       schema.sql: tabelas, regras no banco, RLS e visão de saldo
scripts/        ataque.mjs: tenta quebrar o sistema pela API e confere que o banco recusa
docs/           roteiro da apresentação, checklists e revisão entre grupos
```

A regra vale **na tela e no banco**: a tela avisa cedo, mas o `supabase/schema.sql` garante mesmo que alguém ignore a tela e fale direto com a API.

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org) 20 ou superior
- npm (vem com o Node)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone <URL-DO-REPOSITORIO>
cd <NOME-DA-PASTA>

# 2. Instalar as dependências
npm install

# 3. Configurar as variáveis de ambiente
cp .env.example .env
# edite o .env: URL do projeto Supabase e a chave PUBLICÁVEL (sb_publishable_...)
# nunca use a chave secreta (sb_secret_ / service_role)

# 4. Iniciar em modo de desenvolvimento
npm run dev
```

O terminal mostra o endereço local, normalmente `http://localhost:5173`.

### Banco de dados (uma vez por projeto Supabase)

1. No Supabase, abra **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**. Pode rodar de novo quando o arquivo mudar: ele não apaga dados.
2. Em **Authentication › Sign In / Providers**, deixe **Email** ligado e defina o tamanho mínimo da senha em **8**.
3. Em **Authentication › URL Configuration**, coloque o endereço do site publicado em **Site URL** e também `http://localhost:5173` em **Redirect URLs**.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Serve localmente a versão de produção |
| `npm run lint` | Verifica o código com o ESLint |
| `npm test` | Roda os testes (regras de negócio e banco) |

## Como rodar os testes

```bash
# Roda todos os testes uma vez
npm test

# Modo observação (reexecuta ao salvar)
npm run test:watch
```

Não precisam de internet, de Supabase nem de chaves: o banco é simulado com o PGlite (Postgres de verdade, em memória) e o `supabase/schema.sql` é executado nele.

### O que os testes cobrem

| Arquivo | O que testa |
|---|---|
| `src/domain/regras.test.ts` | RN01 a RN03 na tela, edição e exclusão de lançamentos, cadastro de cliente, busca, filtro, total a receber |
| `src/domain/dinheiro.test.ts` | leitura do valor digitado (vírgula, ponto, centavos sem erro de ponto flutuante) e formatação em reais |
| `src/domain/data.test.ts` | datas |
| `src/db/schema.test.ts` | as mesmas regras **no banco**, o isolamento entre comerciantes (RN04), visitante sem login, e o próprio `schema.sql` (roda duas vezes e migra a tabela antiga) |

| Regra | Casos de fronteira testados |
|---|---|
| RN01 | valor `0`, negativo, vazio, não numérico, `0,01`, 3 casas decimais |
| RN02 | pagamento igual ao saldo (aceito), saldo + `0,01` (recusado), saldo `0` (recusado) |
| RN03 | compra que atinge exatamente o limite (aceita), limite + `0,01` (recusada), limite `0` |
| Edição e exclusão | excluir compra já paga em parte (recusado), editar pagamento além da dívida (recusado) |
| RN04 | um comerciante não enxerga, altera, apaga nem lança no cliente de outro; visitante sem login não faz nada |

### Ataque ao sistema no ar

Os testes acima rodam em memória. Para provar que o Supabase **real** também recusa, rode o [`scripts/ataque.mjs`](./scripts/ataque.mjs) com duas contas de teste (instruções no cabeçalho do arquivo).

## Publicação (link no ar)

O projeto gera arquivos estáticos em `dist/`, então pode ser publicado em Vercel, Netlify ou Cloudflare Pages.

Exemplo com a Vercel:

1. Suba o código para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), escolha **Add New → Project** e importe o repositório.
3. Configuração de build: comando `npm run build`, pasta de saída `dist` (a Vercel já detecta o Vite).
4. Em **Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os valores do `.env`.
5. Clique em **Deploy** e copie o endereço gerado para o topo deste README.
6. Volte ao Supabase (**Authentication › URL Configuration**) e coloque esse endereço em **Site URL**.

As telas usam rotas com `#` (ex.: `#/cliente/123`), então não é preciso configurar redirecionamento no servidor.

Antes de entregar, abra o link em uma aba anônima e confira que cadastro, login e lançamento de uma compra funcionam.

## Segurança

- A chave que vai para o navegador é a **publicável**, feita para ser pública. Quem protege os dados é o banco: as duas tabelas têm RLS ligado, com a política "cada comerciante só acessa as próprias linhas", e o visitante sem login não tem permissão nenhuma.
- Nenhuma chave secreta (`sb_secret_`, `service_role`) está no código nem no histórico. O `.env` fica fora do Git (`.env.example` mostra só os nomes).
- Texto digitado pelo usuário é sempre exibido pelo React como texto, nunca como HTML.

## Documentos do projeto

- [`SPEC.md`](./SPEC.md): problema, público, escopo, requisitos, regras de negócio e critérios de aceitação
- [`AGENTS.md`](./AGENTS.md): regras para agentes de IA que trabalham neste repositório
- [`IA.md`](./IA.md): registro do que foi pedido à IA, aceito e rejeitado
- [`docs/`](./docs): roteiro da apresentação, checklists e revisão entre grupos

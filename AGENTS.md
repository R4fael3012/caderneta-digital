# AGENTS.md — Caderneta Digital

Instruções para agentes de IA (Claude Code, Copilot, Codex, Antigravity etc.) que trabalham neste repositório.
Leia este arquivo e o `SPEC.md` antes de qualquer alteração.

## O que é o projeto

Caderneta Digital: aplicativo web para donos de comércio de bairro controlarem o fiado.
Cada comerciante entra com a própria conta e vê apenas os próprios clientes e lançamentos.
O problema, o público, o escopo do MVP e as regras de negócio estão no `SPEC.md`.
Em caso de conflito entre este arquivo e o `SPEC.md`, pare e pergunte.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (Postgres, Auth e API REST), acessado pelo front-end com a chave publicável
- ESLint
- Não há servidor próprio. A segurança dos dados é feita pelo banco (RLS).

## Como rodar

```bash
npm install
cp .env.example .env     # preencha com a URL e a chave publicável do Supabase
npm run dev              # servidor local
npm run lint             # ESLint
npm run build            # build de produção
npm test                 # testes das regras de negócio e do banco (Postgres em memória)
```

## Variáveis de ambiente

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_...`)

O `.env` fica fora do Git. Só o `.env.example` (sem valores) é versionado.

## Regras de segurança (inegociáveis)

- **Nunca** usar a chave secreta (`sb_secret_...` ou `service_role`) no código, no `.env.example`, em commits ou em exemplos.
- **Nunca** colocar senha, token ou chave no código. Use variáveis de ambiente.
- **Nunca** renderizar texto de usuário com `innerHTML` ou `dangerouslySetInnerHTML`. Use o JSX normal, que já escapa o texto.
- Toda tabela em `public` deve ter **RLS ligado** e políticas explícitas. Sem política, a operação é proibida.
- A política padrão é "cada usuário só acessa as próprias linhas" (`user_id = auth.uid()`).
- Regra de negócio vale **na tela e no banco** (check, constraint, trigger ou função). Validar só na tela não conta.
- Não mexer em dados de produção. Use dados de teste.

## Convenções de código

- TypeScript estrito. Evite `any`; se for inevitável, explique em um comentário.
- Componentes funcionais com hooks. Um componente por arquivo, nome em PascalCase.
- Acesso ao Supabase centralizado em `src/lib/supabase.ts` (um único cliente) e funções de dados em `src/services/`.
- Regras de negócio em funções puras, separadas da interface (em `src/domain/`), para que sejam testáveis.
- Mensagens de erro em português, claras e iguais às dos critérios de aceitação do `SPEC.md`.
- Layout pensado primeiro para celular (mobile-first) com as classes do Tailwind.
- Mudanças no banco ficam em arquivos SQL versionados em `supabase/` (por exemplo `supabase/schema.sql`).

## Estrutura do código

```
src/domain/      regras puras (RN01 a RN03, saldo, busca). Sem React, sem Supabase.
src/services/    única camada que fala com o Supabase; erros traduzidos em services/erros.ts
src/pages/       Inicio (lista), DetalheCliente, TelaLogin
src/components/  formulários e peças de interface
src/db/          testes do supabase/schema.sql com PGlite
supabase/        schema.sql (tabelas, gatilhos das regras, RLS, visão de saldo)
```

- Regra nova: primeiro no `SPEC.md`, depois em `src/domain/` com teste, depois no `supabase/schema.sql` com teste em `src/db/`, com a **mesma mensagem** nos dois lados.
- Dinheiro é sempre em **centavos inteiros** na tela; o banco usa `numeric` com no máximo 2 casas.

## Como trabalhar

1. **Planejar antes de codar.** Para qualquer tarefa que não seja trivial, proponha um plano em passos pequenos, cada um com um jeito de testar, e espere aprovação.
2. **Um incremento por vez.** Faça só o que foi pedido, no escopo pedido. Se houver um jeito melhor, diga em uma frase e faça o que foi pedido.
3. **Mostre o diff.** Ao terminar, liste os arquivos alterados e o motivo de cada mudança.
4. **Verifique com evidência.** Rode `npm run lint` e `npm run build` (e `npm test`, quando existir) e informe o resultado real. Não diga "pronto" sem rodar.
5. **Commits pequenos**, com mensagem que explica o porquê, no padrão `tipo: descrição` (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Pare e pergunte antes de

- apagar arquivos ou pastas;
- alterar o schema do banco, as políticas de RLS ou rodar SQL destrutivo (`drop`, `truncate`, `delete` sem filtro);
- instalar ou remover dependências;
- sair do escopo do `SPEC.md` ou mudar uma regra de negócio;
- mexer em arquivos de configuração (`vite.config.ts`, `tsconfig*.json`, ESLint) ou em `.env`;
- qualquer ação que dependa de uma chave ou permissão que você não deveria ter.

Ordem escrita em prompt não é permissão: se não é para o agente apagar algo, ele não deve ter acesso a isso.

## O que o agente não pode fazer

- Inventar requisitos, regras de negócio ou mensagens de erro que não estejam no `SPEC.md`.
- Revisar e aprovar o próprio trabalho como única verificação. Quem produz não aprova: a verificação vem dos testes, do navegador/celular e da revisão da dupla.
- Fazer `git push --force`, reescrever histórico ou commitar direto em outra branch sem pedido.
- Adicionar código copiado de terceiros sem indicar a origem.

## Registro do uso de IA

Tudo o que for pedido à IA e relevante (aceito, rejeitado e por quê) deve ser anotado no `IA.md` pela dupla. O agente deve ajudar a manter esse registro quando solicitado.
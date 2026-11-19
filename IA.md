# IA.md — registro do uso de IA

> **RASCUNHO. Leiam, corrijam e completem com o que VOCÊS realmente fizeram.**
> Este arquivo vale nota pela honestidade (pedido, aceito, rejeitado e por quê). As linhas marcadas
> com **[PREENCHER]** só vocês sabem responder. Apaguem este aviso quando terminarem.

## Ferramentas usadas

- Claude (chat), para ideia do produto, SPEC, AGENTS, banco, código dos Marcos e documentos.
- [PREENCHER: outras ferramentas, se houver (Copilot, Antigravity, Claude Code...)]

## Registro

| # | O que foi pedido à IA | O que a IA entregou | Aceito, rejeitado ou alterado | Por quê |
|---|---|---|---|---|
| 1 | Uma ideia de produto para o projeto | Caderneta Digital (fiado de comércio de bairro), com a frase-teste | Aceito | Cabe em 5 semanas, tem duas entidades relacionadas e três regras fáceis de testar. [PREENCHER: com quem conversaram sobre o problema real] |
| 2 | Como criar o repositório e o primeiro `AGENTS.md` | Passo a passo e um `AGENTS.md` adaptado a React + Supabase | Aceito com alterações | [PREENCHER: o que mudaram no AGENTS.md] |
| 3 | O `SPEC.md` | Problema, escopo, regras RN01 a RN05 e critérios de aceitação com mensagens exatas | Alterado | O SPEC atual foi reescrito pela dupla (RN04 virou isolamento, novos critérios, decisões de projeto). [PREENCHER: o que decidiram e por quê] |
| 4 | Processo de criar o Supabase e o login | Passo a passo e código de login (`signUp`, `signInWithPassword`, sessão) | Aceito | É o caminho B da aula, com login pronto. |
| 5 | Remodelar a tela de login feita pela dupla em `index.html` | Análise: o login guardava usuários e hashes no `localStorage`, o que não é login de verdade (qualquer um edita o navegador) e não usa o banco | **Rejeitada a autenticação própria**; aproveitada a interface | Não cumpre P3 nem P5. Foram mantidas as validações, mensagens, lista de regras da senha e acessibilidade, e a autenticação passou para o Supabase Auth. |
| 6 | Fazer os Marcos 2 e 3: banco, regras, telas, testes, CI | `supabase/schema.sql`, `src/domain`, serviços, telas, testes (domínio e banco), `.github/workflows/ci.yml`, `scripts/ataque.mjs`, documentos | [PREENCHER: o que vocês leram, testaram e mudaram] | [PREENCHER] |

## Erros da IA encontrados no caminho

Estes foram achados durante a própria construção, antes de qualquer entrega:

- O `vite.config.ts` não tinha o plugin do Tailwind. O build passava, mas o CSS saía sem as classes (o site publicado ficaria sem estilo). Corrigido.
- Num teste contra um Postgres de verdade, o gatilho das regras RN02/RN03 rodava antes dos `CHECK`s da tabela, então um valor negativo era recusado com a mensagem errada (pagamento maior que a dívida, em vez de valor maior que zero). Corrigido validando RN01 primeiro e mantendo os `CHECK`s como rede de segurança.
- [PREENCHER: erros ou alucinações que vocês pegaram, com o que a IA disse e o que era o certo]

## O que a IA NÃO fez (e vocês precisam fazer)

- Rodar o `schema.sql` no Supabase de vocês e configurar login, URLs e senha mínima.
- Publicar na Vercel e colar o link no README.
- Testar no celular e rodar o Lighthouse.
- Rodar o `scripts/ataque.mjs` contra o Supabase real.

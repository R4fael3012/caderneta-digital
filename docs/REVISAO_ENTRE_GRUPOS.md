# Revisão entre grupos (Marco 3)

Use este roteiro para revisar o projeto de outro grupo, e entregue-o ao grupo que vai revisar o seu.
Regra da aula: **quem produz não aprova**. Registrem o que viram com evidência (print, linha de código), não impressões.

**Grupo revisado:** ______________ **Link:** ______________ **Repositório:** ______________
**Revisores:** ______________ **Data:** ______________

## 1. Produto no ar (10 min)

| Item | OK? | Evidência / observação |
|---|---|---|
| O link público abre e funciona em aba anônima | | |
| Dá para criar conta e entrar | | |
| Criar, listar, editar e excluir as duas entidades | | |
| Há pelo menos 3 regras de negócio recusando dado inválido, com mensagem compreensível | | |
| Tela de consulta com busca ou filtro e um resumo | | |
| Usável no celular (sem rolar para o lado, botões grandes o bastante) | | |
| Os erros dizem o que fazer, não só "erro" | | |

## 2. Segurança (10 min)

| Item | OK? | Evidência |
|---|---|---|
| Sem login, as telas internas não aparecem | | |
| Com duas contas: uma não vê os dados da outra | | |
| Digitar `<b>oi</b>` num campo aparece como texto, não vira negrito | | |
| Procurar `innerHTML` / `dangerouslySetInnerHTML` no código: não há (ou está justificado) | | |
| Procurar `sb_secret_`, `service_role`, senhas: não há no código **nem no histórico** | | |
| `.env` fora do Git, com `.env.example` | | |
| As tabelas têm RLS ligado (ver o SQL do projeto) | | |
| A regra existe **no banco**, não só na tela (testar pela API ou ler o SQL) | | |

## 3. Engenharia (10 min)

| Item | OK? | Evidência |
|---|---|---|
| Commits dos dois integrantes, ao longo de vários dias, com mensagens que explicam | | |
| `SPEC.md` completo (problema, público, escopo, requisitos, regras, critérios de aceitação) | | |
| `AGENTS.md` útil (como rodar, convenções, o que o agente não pode fazer) | | |
| `README.md` com link no ar, como rodar e como rodar os testes | | |
| `IA.md` honesto (pedido, aceito, rejeitado e por quê) | | |
| Pelo menos 6 testes das regras de negócio e todos passam (rodar `npm test`) | | |
| Existe um workflow de testes no GitHub Actions e está verde | | |

## 4. Parecer

- **Três coisas que estão boas:**
  1.
  2.
  3.
- **Três coisas para corrigir antes do dia 26 (da mais para a menos importante):**
  1.
  2.
  3.
- **Uma pergunta que vocês fariam na defesa:**

---

### Sugestões de ataque para o revisor

- Tente criar um dado inválido pulando a tela: no Console do navegador, use `fetch` na URL do projeto com a chave publicável (aula 22/10).
- Entre com duas contas e tente abrir, pela URL, o registro que pertence à outra.
- Cole texto muito longo e caracteres especiais (`<`, `"`, `'`, emoji) em todos os campos.
- Dê dois cliques rápidos no botão de salvar: duplica o registro?

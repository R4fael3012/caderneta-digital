# Roteiro da apresentação · 26/11 (cerca de 15 minutos)

Ordem sorteada no dia. Link do produto e do repositório no Moodle **até 25/11**. Tenham um vídeo curto de reserva.

## 1. O problema (2 min)

- Quem sofre: dono de mercadinho, padaria, bar. Hoje anota o fiado no caderno e perde dinheiro porque esquece quem deve quanto.
- Frase-teste: "O dono de mercadinho hoje anota o fiado no caderno e perde dinheiro porque esquece quem deve quanto. Com a Caderneta, ele consegue ver em segundos quanto cada cliente deve e o total a receber."
- **A conversa com um usuário real** (a aula pede): [PREENCHER: com quem falaram, o que ele disse, o que mudou no SPEC por causa disso].

## 2. A solução, ao vivo (5 min)

Abram o **link público** (não o localhost), numa aba anônima, com uma conta de teste já criada. Siga esta ordem; cada passo mostra um requisito.

| # | Faça | O que aparece | Requisito |
|---|---|---|---|
| 1 | Entre com e-mail e senha | Lista de clientes com total a receber | P1, P3 |
| 2 | **Novo cliente**: "Maria Souza", limite `200` | Maria na lista | P4 |
| 3 | Abra a Maria. Compra fiada de `150` | Saldo "Deve R$ 150,00", disponível R$ 50,00 | P4 |
| 4 | Compra de `60` | **Recusa**: "Esta compra ultrapassa o limite de fiado (R$ 200,00). Valor disponível: R$ 50,00." | P6 (RN03) |
| 5 | Pagamento de `150,01` | **Recusa**: "O pagamento não pode ser maior que a dívida atual (R$ 150,00)." | P6 (RN02) |
| 6 | Valor `0` ou `-5` | **Recusa**: "O valor deve ser maior que zero." | P6 (RN01) |
| 7 | Pagamento de `100` | Saldo cai para R$ 50,00 na hora | P4 |
| 8 | Edite o pagamento para `200` | **Recusa**: pagamentos maiores que a dívida | P4, P6 |
| 9 | Volte à lista: busque `maria`, ligue "Só quem está devendo" | Filtro e total a receber | P7 |
| 10 | Abra no celular (ou DevTools em modo celular) | Tudo usável sem rolar para o lado | P8 |
| 11 | **O ataque** (veja abaixo) | O banco diz não | P3, P6 |

### O ataque (1 minuto, é o que mais impressiona)

No Console (F12) do site publicado, ou mostrando a saída do `scripts/ataque.mjs`:

- Visitante sem login tentando apagar tudo: **HTTP 401/403**.
- Compra de valor negativo ou acima do limite mandada direto pela API, pulando a tela: **o banco recusa com a mesma mensagem**.
- Outro comerciante tentando ler o cliente da Maria: **0 linhas**.

Frase para dizer: "A chave está no navegador, é pública de propósito. Quem decide é o banco."

## 3. Como fizeram (3 min)

- **Arquitetura:** React no navegador → Supabase (Postgres, login e API pronta). Sem servidor nosso. Publicado na Vercel.
- **Processo:** SPEC → AGENTS → banco com RLS → telas em incrementos → testes → CI no GitHub → ataque.
- **Um exemplo do que aceitamos da IA:** [PREENCHER, ex.: o esquema do banco com gatilhos].
- **Um exemplo do que recusamos:** o login que guardava usuários no `localStorage` (qualquer pessoa edita o navegador). Trocamos pelo Supabase Auth.
- **O que deu errado:** [PREENCHER, ex.: o CSS não saía no build porque faltava o plugin do Tailwind; o gatilho mostrava a mensagem errada para valor negativo, pego por um teste no banco].
- Mostre o `IA.md` e o verde do GitHub Actions.

## 4. Perguntas individuais (5 min)

Cada integrante responde sobre **qualquer parte**, mostrando o código. Treinem trocando de papel: um pergunta, o outro responde. Perguntas prováveis abaixo.

---

# Preparação para a defesa individual

A nota de defesa (0,75) e a prova sem IA exigem que **cada um explique o código**. Leiam estes arquivos nesta ordem; juntos são curtos.

| Ordem | Arquivo | Para entender |
|---|---|---|
| 1 | `SPEC.md` | o que o sistema promete |
| 2 | `supabase/schema.sql` | tabelas, regras no banco, RLS |
| 3 | `src/domain/regras.ts` | as regras na tela (a mesma lógica do banco) |
| 4 | `src/services/clientes.ts` e `lancamentos.ts` | como a tela fala com o banco |
| 5 | `src/pages/DetalheCliente.tsx` | a tela principal |
| 6 | `src/domain/regras.test.ts` e `src/db/schema.test.ts` | como provamos que funciona |

## Perguntas e respostas

**Por que a regra existe na tela E no banco?**
A tela avisa cedo e é amigável, mas qualquer pessoa pode ignorá-la e chamar a API direto. O banco é quem garante. É a "regra no banco, não só na tela" da aula.

**Se a chave do Supabase está no navegador, não é perigoso?**
A chave publicável é pública por design. O que protege os dados é o RLS: sem política, a operação é proibida. O caso do Lovable (aula) foi tabela sem RLS. A chave secreta (`service_role`) nunca está no código.

**O que é RLS e qual é a política de vocês?**
Segurança por linha: o banco confere cada operação linha a linha. Em `schema.sql`, a política `clientes_dono` diz que o usuário só vê e altera linhas onde `user_id = auth.uid()`. Para `lancamentos`, também exige que o cliente seja dele.

**Como o login funciona?**
O Supabase Auth cuida de senha, sessão e token. O token vai em cada requisição e o banco sabe quem é pelo `auth.uid()`. A tela só decide o que mostrar (sem sessão, só o login).

**Como o saldo é calculado? Por que não é uma coluna?**
Saldo = soma das compras − soma dos pagamentos, calculado pela visão `clientes_com_saldo`. Guardar o saldo numa coluna poderia ficar diferente do histórico. Derivar garante que sempre bate.

**Por que o dinheiro é em centavos na tela?**
Para não ter erro de ponto flutuante (`0.1 + 0.2`). `lerValor` converte o texto em centavos inteiros. O banco usa `numeric` com 2 casas.

**Como a RN02 funciona ao editar ou excluir?**
O gatilho `validar_lancamento` roda em todo insert, update e delete: calcula o saldo como ficaria e recusa se for negativo. Por isso excluir uma compra já paga em parte é bloqueado.

**E a RN03 ao editar? Por que só bloqueia o que aumenta a dívida?**
Se o comerciante reduz o limite abaixo do saldo, o histórico antigo não pode travar. Então só são recusadas mudanças que aumentam a dívida além do limite.

**Por que o gatilho trava a linha do cliente (`for update`)?**
Para duas gravações simultâneas não furarem a regra (cada uma veria o saldo antigo).

**O que impede um comerciante de ver os clientes do outro?**
RLS. Provamos de duas formas: teste no banco (`schema.test.ts`, grupo RN04) e o `scripts/ataque.mjs` no Supabase real.

**Como vocês evitam XSS?**
O React exibe texto como texto (`{l.descricao}`). Não há `dangerouslySetInnerHTML` nem `innerHTML` no projeto. É a regra do AGENTS.md. Teste: digitar `<b>oi</b>` aparece literal.

**O que os testes provam e o que não provam?**
Provam as regras na lógica e no banco (Postgres de verdade em memória). Não provam a interface nem o Supabase real; para isso há o teste manual no link público e o `ataque.mjs`.

**O que a IA fez e o que vocês fizeram?**
Respondam com o `IA.md`. Seja específico: o que foi aceito, o que foi recusado e por quê.

**O que daria errado se vocês perdessem a internet na demo?**
Por isso há o vídeo de reserva. O site depende do Supabase na nuvem.

**Mudem uma regra agora: o limite passa a valer só para compras acima de R$ 10.**
Onde mexer: `validarMudanca` em `src/domain/regras.ts`, a função `validar_lancamento` em `supabase/schema.sql`, e os testes dos dois lados. (Treinem fazer isso sem a IA.)

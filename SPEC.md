# Caderneta Digital: planejamento do MVP

## 1. Problema

O dono de mercadinho anota o fiado no caderno de papel. Isso gera quatro perdas:

- **Esquecimento:** ele não lembra quem deve quanto e deixa de cobrar.
- **Demora:** somar o caderno para saber o total a receber leva minutos, e às vezes é impossível.
- **Erros:** rasuras, contas erradas e páginas perdidas.
- **Descontrole:** nada impede que um cliente passe do que o dono aceitaria fiar.

**Frase-teste:** "O dono de mercadinho hoje anota o fiado no caderno e perde dinheiro porque esquece quem deve quanto. Com a Caderneta, ele consegue ver em segundos quanto cada cliente deve e o total a receber."

## 2. Público

**Usuário principal:** dono ou atendente de comércio de bairro que vende fiado (mercadinho, padaria, açougue, bar, loja de material de construção).

| Característica | Implicação para o produto |
|---|---|
| Pouca familiaridade com software | Telas simples, poucos cliques, linguagem do dia a dia ("fiado", "pagou") |
| Usa o celular no balcão | Layout responsivo, mobile-first |
| Atende com pressa | Registrar um lançamento em menos de 15 segundos |
| Confia em relações de vizinhança | Foco em controle, sem cobrança automática nem negativação |

**Fora do público do MVP:** os clientes endividados. Eles não têm acesso ao sistema.

## 3. Escopo do MVP

### Dentro

- Cadastro e login do comerciante (cada um vê apenas os próprios dados)
- CRUD de clientes (nome, telefone, limite de fiado)
- CRUD de lançamentos por cliente (compra fiada ou pagamento)
- Saldo devedor por cliente
- Busca por nome, filtro "somente devedores" e total a receber
- Testes automatizados das regras de negócio

### Fora (versões futuras)

- Cobrança por WhatsApp ou SMS
- Relatórios e gráficos, exportação para PDF ou Excel
- Múltiplos usuários por loja ou perfis de permissão
- Controle de estoque, PDV e integração com meios de pagamento
- Juros e multa, parcelamento
- Aplicativo nativo e modo offline

## 4. Requisitos

### 4.1 Funcionais

| ID | Requisito | Origem |
|---|---|---|
| RF01 | O comerciante pode se cadastrar e fazer login/logout. | P3 |
| RF02 | O sistema exibe somente os clientes e lançamentos do comerciante logado. | P3 |
| RF03 | O comerciante pode criar, listar, editar e excluir clientes (nome, telefone, limite de fiado). | P4 |
| RF04 | O comerciante pode criar, listar, editar e excluir lançamentos de um cliente, com tipo (compra ou pagamento), valor, data e descrição opcional. | P4 |
| RF05 | O sistema calcula e exibe o saldo devedor de cada cliente. | P7 |
| RF06 | O sistema permite buscar clientes por nome (parcial, sem diferenciar maiúsculas e acentos). | P7 |
| RF07 | O sistema permite filtrar apenas clientes com saldo devedor maior que zero. | P7 |
| RF08 | O sistema exibe o total a receber (soma dos saldos devedores de todos os clientes). | P7 |
| RF09 | O sistema exibe o histórico de lançamentos do cliente, do mais recente para o mais antigo. | P4 |
| RF10 | O sistema mostra mensagens claras quando uma regra de negócio é violada. | P6 |

### 4.2 Não funcionais

| ID | Requisito |
|---|---|
| RNF01 | **Usabilidade:** interface responsiva, utilizável em celular de tela pequena. |
| RNF02 | **Desempenho:** listagem e total a receber em até 2 s para 500 clientes. |
| RNF03 | **Segurança:** senhas armazenadas com hash, rotas protegidas por autenticação, validação de propriedade em toda consulta. |
| RNF04 | **Precisão monetária:** valores guardados em centavos (inteiros) ou decimal, nunca em ponto flutuante. |
| RNF05 | **Testabilidade:** regras de negócio isoladas da interface para serem testadas sem a UI. |
| RNF06 | **Consistência:** o saldo é sempre derivado dos lançamentos. Não é um campo editável livremente. |

## 5. Regras de negócio

**Definições**

- **Saldo devedor** = soma das compras − soma dos pagamentos do cliente.
- **Limite de fiado** = valor máximo que o saldo devedor pode atingir (definido por cliente).

| ID | Regra | Detalhamento |
|---|---|---|
| **RN01** | O valor do lançamento deve ser maior que zero. | Rejeita zero, negativo, vazio e não numérico. Aceita no máximo 2 casas decimais. Vale para compra e pagamento, na criação e na edição. |
| **RN02** | O pagamento não pode ser maior que a dívida atual. | Pagamento ≤ saldo devedor. Pagamento igual ao saldo é permitido e zera a dívida. Cliente com saldo 0 não aceita pagamento. |
| **RN03** | O cliente não pode passar do limite de fiado. | Saldo atual + nova compra ≤ limite. Compra que deixa o saldo exatamente no limite é permitida. |
| **RN04** | Isolamento por comerciante. | Um comerciante nunca lê, altera nem apaga dados de outro. Acessar um ID alheio retorna "não encontrado". |

### Decisões a fixar antes de codar

Estas situações de borda não estavam definidas na ideia. A decisão sugerida mantém o MVP simples:

1. **Limite igual a 0:** significa que o cliente não pode comprar fiado. O limite é obrigatório e ≥ 0.
2. **Reduzir o limite abaixo do saldo atual:** é permitido. O saldo não muda, mas novas compras ficam bloqueadas até a dívida cair.
3. **Editar ou excluir lançamento:** a regra deve ser revalidada sobre o histórico inteiro. Por exemplo, excluir uma compra de R$ 100 que já foi parcialmente paga deixaria o saldo negativo, então é bloqueado (RN02). Alternativa mais simples: lançamentos não são editáveis, só excluíveis com essa validação.
4. **Excluir cliente com saldo devedor:** bloquear, ou exigir confirmação explícita. Excluir o cliente apaga seus lançamentos (cascata).
5. **Nome duplicado:** permitido (existem dois "João"), mas o telefone ajuda a distinguir.

## 6. Critérios de aceitação

Formato: **Dado** (contexto), **Quando** (ação), **Então** (resultado).

### Login e isolamento (RF01, RF02, RN04)

- **CA01:** Dado um visitante sem conta, quando ele se cadastra com e-mail e senha válidos, então a conta é criada e ele acessa a lista de clientes vazia.
- **CA02:** Dado um e-mail já cadastrado, quando alguém tenta se cadastrar com ele, então o sistema recusa com mensagem clara.
- **CA03:** Dado um usuário não autenticado, quando ele acessa qualquer tela interna, então é redirecionado ao login.
- **CA04:** Dados os comerciantes A e B, cada um com clientes próprios, quando A lista clientes, então vê só os seus. Quando A tenta abrir pelo endereço um cliente de B, então recebe "não encontrado".

### Clientes (RF03)

- **CA05:** Dado um formulário com nome e limite ≥ 0, quando o comerciante salva, então o cliente aparece na lista com saldo R$ 0,00.
- **CA06:** Dado um cliente sem nome, ou com limite negativo, quando o comerciante tenta salvar, então o sistema recusa e indica o campo inválido.
- **CA07:** Dado um cliente existente, quando o comerciante edita nome, telefone ou limite, então a alteração é refletida na lista.
- **CA08:** Dado um cliente com saldo devedor, quando o comerciante tenta excluí-lo, então o sistema bloqueia (ou pede confirmação, conforme decisão 4).

### Lançamentos (RF04, RF05, RF09)

- **CA09:** Dado um cliente com limite R$ 200 e saldo 0, quando o comerciante registra uma compra de R$ 50, então o saldo passa a R$ 50 e o lançamento aparece no topo do histórico.
- **CA10:** Dado um cliente com saldo R$ 50, quando o comerciante registra um pagamento de R$ 20, então o saldo passa a R$ 30.
- **CA11:** Dado um cliente com saldo R$ 30, quando o comerciante registra um pagamento de R$ 30, então o saldo fica R$ 0,00 e o cliente deixa de aparecer no filtro "devedores".
- **CA12:** Dado um lançamento existente, quando o comerciante o exclui e a regra RN02 não é violada, então ele some do histórico e o saldo é recalculado.

### Regras de negócio (RF10)

- **CA13 (RN01):** Dado qualquer cliente, quando o comerciante registra valor 0, valor negativo ou vazio, então o lançamento é recusado com "O valor deve ser maior que zero" e o saldo não muda.
- **CA14 (RN02):** Dado um cliente com saldo R$ 30, quando o comerciante registra um pagamento de R$ 30,01, então é recusado com mensagem informando a dívida atual (R$ 30,00) e o saldo não muda.
- **CA15 (RN02):** Dado um cliente com saldo R$ 0, quando o comerciante registra qualquer pagamento, então é recusado.
- **CA16 (RN03):** Dado um cliente com limite R$ 200 e saldo R$ 150, quando o comerciante registra uma compra de R$ 60, então é recusada com mensagem informando o limite e o valor disponível (R$ 50,00).
- **CA17 (RN03):** Dado o mesmo cliente, quando registra uma compra de R$ 50, então é aceita e o saldo fica R$ 200 (igual ao limite).
- **CA18 (RN03):** Dado um cliente com limite R$ 0, quando o comerciante registra qualquer compra, então é recusada.

### Consulta e resumo (RF06, RF07, RF08)

- **CA19:** Dados os clientes "Maria Souza", "João Silva" e "Joana Lima", quando o comerciante busca "joa", então aparecem João e Joana, sem diferenciar maiúsculas nem acentos.
- **CA20:** Dado o filtro "devedores" ativo, então só aparecem clientes com saldo > 0. Combinado com a busca, os dois filtros se aplicam juntos.
- **CA21:** Dados três clientes com saldos R$ 50, R$ 30 e R$ 0, então o total a receber exibido é R$ 80,00.
- **CA22:** Quando um lançamento é criado, alterado ou excluído, então o total a receber e o saldo do cliente refletem a mudança sem recarregar manualmente.
- **CA23:** Dado um comerciante sem clientes, então o total a receber é R$ 0,00 e a tela mostra um estado vazio com orientação ("Cadastre seu primeiro cliente").

### Meta de usabilidade (RNF01)

- **CA24:** Um comerciante novo consegue cadastrar um cliente e lançar uma compra fiada em menos de 2 minutos, sem ajuda. Na lista, ele identifica o total a receber sem rolar a página.

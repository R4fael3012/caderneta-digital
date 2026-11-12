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

- React + TypeScript
- Vite
- Vitest (testes)

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

# 3. Configurar as variáveis de ambiente (se o projeto usar)
cp .env.example .env
# edite o .env com os valores do seu ambiente

# 4. Iniciar em modo de desenvolvimento
npm run dev
```

O terminal mostra o endereço local, normalmente `http://localhost:5173`.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Serve localmente a versão de produção |
| `npm run lint` | Verifica o código com o ESLint |

## Como rodar os testes

```bash
# Roda todos os testes uma vez
npm test

# Modo observação (reexecuta ao salvar)
npm run test:watch

# Com relatório de cobertura
npm run test:coverage
```

> Se esses scripts ainda não existem, instale o Vitest e adicione-os ao `package.json`:
>
> ```bash
> npm install -D vitest @vitest/coverage-v8
> ```
>
> ```json
> "scripts": {
>   "test": "vitest run",
>   "test:watch": "vitest",
>   "test:coverage": "vitest run --coverage"
> }
> ```

### O que os testes cobrem

As regras de negócio ficam em funções isoladas da interface, então os testes rodam sem abrir o navegador.

| Regra | Casos de fronteira testados |
|---|---|
| RN01 | valor `0`, negativo, vazio, não numérico, `0,01` |
| RN02 | pagamento igual ao saldo (aceito), saldo + `0,01` (recusado), saldo `0` (recusado) |
| RN03 | compra que atinge exatamente o limite (aceita), limite + `0,01` (recusada), limite `0` |
| Saldo e total | cálculo do saldo por cliente e do total a receber |
| RN04 | um comerciante não enxerga nem altera dados de outro |

## Publicação (link no ar)

O projeto gera arquivos estáticos em `dist/`, então pode ser publicado em Vercel, Netlify ou Cloudflare Pages.

Exemplo com a Vercel:

1. Suba o código para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), escolha **Add New → Project** e importe o repositório.
3. Configuração de build: comando `npm run build`, pasta de saída `dist`.
4. Cadastre as variáveis de ambiente do `.env` no painel do projeto.
5. Clique em **Deploy** e copie o endereço gerado para o topo deste README.

Antes de entregar, abra o link em uma aba anônima e confira que cadastro, login e lançamento de uma compra funcionam.

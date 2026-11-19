# Checklist até o dia 26

Marque cada item **com evidência** (print, link, saída do comando), não com "acho que está".

## Agora: pôr o MVP no ar (Marco 3 é 19/11)

- [ ] Extrair o pacote de arquivos na raiz do repositório e rodar `npm install`
- [ ] `npm run lint`, `npm test` e `npm run build` passam no seu computador
- [ ] Supabase › SQL Editor: colar `supabase/schema.sql` inteiro e **Run** (sem erro)
- [ ] Table Editor: `clientes` e `lancamentos` com o selo **RLS** ativo
- [ ] Authentication › Sign In / Providers: Email ligado, senha mínima **8**
- [ ] Criar o projeto na Vercel a partir do GitHub, cadastrar `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, fazer o deploy
- [ ] Authentication › URL Configuration: **Site URL** = endereço da Vercel; **Redirect URLs** inclui `http://localhost:5173`
- [ ] Colar o link no topo do `README.md`
- [ ] No link público, em aba anônima: cadastro, login, criar cliente, compra, pagamento, recusas (veja `docs/ROTEIRO_DEFESA.md`)
- [ ] Abrir no celular de verdade

## Commits (a nota de Engenharia olha o histórico)

- [ ] Fazer os commits em partes, com mensagens que explicam, **cada um com os próprios** (veja `docs/COMMITS.md`)
- [ ] Os dois integrantes têm commits no GitHub
- [ ] O workflow **CI** aparece verde na aba Actions

## Segurança (aula de 19/11)

- [ ] Rodar `scripts/ataque.mjs` com duas contas de teste: tudo `OK`. Guardar o print
- [ ] Nenhuma chave `sb_secret_` ou `service_role` no código nem no histórico:
      `git log -p --all | grep -E "sb_secret_|service_role"` (só pode aparecer em textos de documentação)
- [ ] `.env` não está no Git (`git ls-files | grep .env` mostra só `.env.example`)
- [ ] **Atenção:** o `.env` já foi commitado uma vez no histórico (depois removido). Ele só tinha a URL e a chave **publicável**, que é pública por design, então não vazou segredo. Saibam explicar isso se perguntarem.
- [ ] Lighthouse (DevTools › Lighthouse) com acessibilidade **≥ 90** na tela de login e na lista. Guardar o print

## Marco 3: revisão entre grupos

- [ ] Mandar o link e o repositório para o grupo que vai revisar, com `docs/REVISAO_ENTRE_GRUPOS.md`
- [ ] Revisar o projeto de outro grupo com o mesmo documento
- [ ] Anotar o que o outro grupo achou e o que vocês corrigiram (vira material para a apresentação)

## Documentos

- [ ] `IA.md` completo e honesto (tirar os **[PREENCHER]**)
- [ ] `README.md` com o link no ar
- [ ] `SPEC.md` coerente com o que foi construído
- [ ] `AGENTS.md` útil

## Até 25/11

- [ ] Link do produto e do repositório no **Moodle**
- [ ] Gravar o **vídeo de reserva** (2 a 3 minutos, o roteiro da demo)
- [ ] Conta de teste criada no site publicado, com 2 ou 3 clientes de exemplo
- [ ] Ensaiar a apresentação cronometrando (15 minutos) e treinar a defesa individual

## No dia 26

- [ ] Computador carregado, internet testada, Vercel e Supabase abertos
- [ ] Site aberto na conta de teste, em aba anônima
- [ ] Vídeo de reserva no computador
- [ ] Os dois sabem explicar **qualquer** arquivo do repositório

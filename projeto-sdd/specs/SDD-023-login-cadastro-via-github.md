# SDD-023 — Login e cadastro via GitHub (OAuth)

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário, quero poder me cadastrar e entrar usando minha conta do GitHub, para que eu não precise criar e lembrar de mais uma senha.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-023-login-cadastro-via-github.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md` |

## Comportamento esperado

### Migração de schema

- `Usuario.SenhaHash`: `string` (obrigatório) → `string?` (nullable) — contas criadas só via GitHub não têm senha local. Consequência direta no código pré-existente: `LoginService.AutenticarAsync` e `TrocarSenhaService.TrocarSenhaAsync` (de outras funcionalidades) passam a checar `usuario.SenhaHash is null` antes de chamar `BCrypt.Verify` — sem essa guarda, qualquer tentativa de login local ou troca de senha numa conta criada só via GitHub lançaria exceção. Em `LoginService`: `if (usuario is null || usuario.SenhaHash is null || !BCrypt.Net.BCrypt.Verify(senha, usuario.SenhaHash))`. Em `TrocarSenhaService`: `if (string.IsNullOrEmpty(request.SenhaAtual) || usuario.SenhaHash is null || !BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))`. Em ambos os casos o retorno é o mesmo erro genérico de credenciais/senha atual inválida já existente — nunca revelando que a conta existe só via login social.
- `Usuario.GithubId`: nova coluna `text` (sem `HasMaxLength`), mapeada como `github_id`; índice único parcial `ix_usuarios_github_id` (`HasFilter("github_id IS NOT NULL")`, ignorando nulos) — identificador numérico da conta GitHub (`id` do endpoint `/user`, convertido para string).
- Migração nomeada `LoginSocialGithub`.

### Backend

**`GithubOAuthSettings`** (`Features/Auth/LoginGithub/`): `ClientId`, `ClientSecret` — configuração sensível via `.env`/variável de ambiente (`GithubOAuth__ClientId`/`GithubOAuth__ClientSecret`), mesma disciplina fail-fast de `JwtSettings`/`SmtpSettings` em `Program.cs` (aplicação não sobe sem essas duas configuradas). Essa disciplina fail-fast vale só para `Program.cs`: em `docker-compose.yml` a configuração segue o padrão de `SmtpSettings`, não o de `JwtSettings` — usa valor de exemplo como *default* (`GITHUB_OAUTH_CLIENT_ID:-Iv1.exemplo000nao0real`, `GITHUB_OAUTH_CLIENT_SECRET:-exemplo-de-client-secret-nao-real-substitua-pelo-seu-github-oauth-app`, sintaxe `:-`) em vez de obrigatório (sintaxe `:?`, usada só para `Jwt` no mesmo arquivo) — para não quebrar `docker compose up` de quem não está trabalhando nesta funcionalidade. O pré-requisito operacional de um GitHub OAuth App real continua valendo para testar o fluxo de ponta a ponta.

**`IGithubOAuthClient`/`GithubOAuthClient`** (mesmo racional de `IEmailSender`/`SmtpEmailSender` — abstrai a chamada HTTP externa para permitir teste de unidade sem rede real). Toda chamada usa o `HttpClient` nomeado registrado em `Program.cs` (`GithubOAuthClient.NomeHttpClient`) com o header `User-Agent: Backend-App` (`client.DefaultRequestHeaders.UserAgent.ParseAdd("Backend-App")`) — exigido pela API do GitHub; requisições sem esse header recebem `403`:
- `TrocarCodePorAccessTokenAsync(code)`: `POST https://github.com/login/oauth/access_token` (`Accept: application/json`) com `client_id`, `client_secret`, `code` — retorna o `access_token` do GitHub.
- `ObterUsuarioAsync(accessToken)`: `GET https://api.github.com/user` (`Authorization: Bearer <access_token>`) — retorna `id`, `login`, `name`, `email` (pode vir `null` se o e-mail não for público).
- `ObterEmailPrimarioVerificadoAsync(accessToken)`: se `email` de `/user` for nulo, `GET https://api.github.com/user/emails` (requer escopo `user:email`) — retorna o e-mail com `primary: true` e `verified: true`. Se nenhum e-mail verificado existir, retorna `null`.

**`LoginGithubService.AutenticarAsync(code)`** (`POST /api/auth/login/github`):
1. Troca o `code` por `access_token` (erro na troca → `ErroValidacao("Não foi possível autenticar com o GitHub.")`).
2. Obtém dados do usuário GitHub; resolve e-mail (público ou via `/user/emails`). Sem e-mail verificado disponível → `ErroValidacao("Não foi possível obter um e-mail verificado da sua conta do GitHub.")`.
3. Busca `Usuario` por `GithubId`. Se existir, emite JWT e retorna (login).
4. Se não existir por `GithubId`, busca por `Email` (case-insensitive, mesmo critério de `SDD-004`). **Se já existir uma conta local com esse e-mail (criada por e-mail/senha ou por outra conta GitHub), rejeita** — `ErroValidacao("Já existe uma conta com este e-mail. Faça login com e-mail e senha.")`. Decisão deliberada (ver "Decisão de arquitetura" abaixo, "Alternativas consideradas"): sem vínculo automático nesta fase, para não abrir risco de apropriação de conta via e-mail. Vínculo explícito fica para SDD futura.
5. Se não existir por `GithubId` nem por `Email`, cria um novo `Usuario` (`Nome` = `name` do GitHub ou `login` como fallback; `Email`; `GithubId`; `SenhaHash = null`; `EmailVerificado = true`, já que o GitHub garantiu a posse). Emite JWT e retorna. Cobre a corrida entre a checagem de existência e o `SaveChangesAsync` (mesmo padrão de `CadastrarUsuarioService`): `catch (DbUpdateException ex) when (EhViolacaoDeUnicidade(ex))` em torno do `SaveChangesAsync`, retornando `ResultadoLoginGithub.Erro(MensagemFalhaAutenticacao)` — o mesmo erro genérico de falha de autenticação.

**`AuthController.LoginGithub`**: `POST /api/auth/login/github`, `{ "code": string }` → `200 LoginResponse` (mesmo tipo de `POST /api/auth/login`, reaproveitado) ou `400 ErroResponse`.

### Frontend

- Botão "Continuar com GitHub" (`GithubOAuthButton.tsx`), com um SVG inline do octocat mark antes do texto — a versão instalada de `lucide-react` não traz mais ícones de marca —, em `/login` e `/cadastro`, acima do formulário existente (separador "ou" entre os dois métodos).
- Ao clicar (`iniciarAutenticacaoGithub`, em `github-oauth.ts`): gera um `state` aleatório (`crypto.randomUUID()`), grava em `sessionStorage` sob a chave `GITHUB_OAUTH_STATE_KEY = "github_oauth_state"`, redireciona para `https://github.com/login/oauth/authorize?client_id=<NEXT_PUBLIC_GITHUB_CLIENT_ID>&redirect_uri=<origin>/auth/github/callback&scope=user:email&state=<state>`.
- Nova rota pública `/auth/github/callback` (componente `GithubCallbackForm.tsx`, orquestrado pelo hook `useGithubCallback`): lê `code`/`state` da query string, confere `state` contra o valor salvo em `sessionStorage` (descarta se não bater — proteção CSRF, RNF02) dentro de `autenticarComGithubCallback` (`github-oauth-callback.ts`), que então chama `POST /api/auth/login/github` com o `code`. Sucesso: salva o token no `auth-store` (mesmo mecanismo de `LoginForm`), exibe por 1500ms uma tela de confirmação ("Login realizado com sucesso!") e só então redireciona para `/inicio`. Erro do back-end: exibe a mensagem retornada com link para `/login`. Erro de validação local (cancelamento no GitHub ou `state` ausente/divergente, sem chamar o back-end): exibe "Não foi possível concluir a autenticação com o GitHub.". Falha de rede genérica na chamada ao back-end: exibe "Não foi possível entrar com o GitHub. Tente novamente em instantes.".

## Critérios de aceite

- [x] Critério 1 — Existe um botão "Continuar com GitHub" nas telas de login e cadastro.
- [x] Critério 2 — O sistema implementa o fluxo OAuth 2.0 Authorization Code do GitHub: o back-end troca o `code` recebido por um token de acesso do GitHub.
- [x] Critério 3 — Após a troca, o sistema obtém do GitHub os dados básicos do usuário (nome, e-mail, identificador da conta).
- [x] Critério 4 — O sistema aplica a decisão de vínculo/criação de conta definida nesta SDD (seção "Decisão de arquitetura" abaixo) quando o e-mail do GitHub já existe (ou não existe) como conta local.
- [x] Critério 5 — Ao concluir o fluxo com sucesso, o sistema emite o mesmo tipo de token JWT usado no login local (reaproveitando `JwtTokenService`, decidido em `specs/SDD-004-cadastro-de-usuario.md`) — uma única fonte de sessão autenticada no front-end.

## Decisão de arquitetura

**Contexto:** a decisão de autenticação original (`specs/SDD-004-cadastro-de-usuario.md`) descartou OAuth de terceiros (Google, Apple, Microsoft) "nesta fase", deixando explícito que a decisão poderia ser revisitada no futuro se o produto crescesse. O usuário decidiu agora adicionar login/cadastro via GitHub como método adicional de autenticação, mantendo e-mail+senha (`SDD-004`/`SDD-005`) como método primário.

**Decisão:** Implementar o fluxo OAuth 2.0 Authorization Code do GitHub **orquestrado pelo próprio back-end**, não por uma biblioteca de gerenciamento de sessão de terceiros no front-end: o front-end só redireciona o usuário para a tela de autorização do GitHub e recebe o `code` de volta; o back-end troca esse `code` por um token de acesso do GitHub, busca os dados do usuário, aplica a decisão de vínculo/criação de conta, e emite o mesmo JWT já usado no login local (`JwtTokenService`). Isso mantém uma única fonte de verdade de sessão autenticada no front-end.

**Alternativas consideradas:**
- **NextAuth.js/Auth.js gerenciando a sessão inteiramente no front-end** — descartado: criaria duas fontes de verdade de sessão (a sessão do NextAuth e o JWT emitido pelo back-end), a mesma armadilha que a decisão original (`specs/SDD-004-cadastro-de-usuario.md`) evitou ao escolher JWT stateless em vez de sessão server-side.
- **Continuar sem login social** — descartado: o usuário pediu explicitamente a funcionalidade.
- **Vincular automaticamente pelo e-mail sempre que já existir conta local com o mesmo e-mail** — considerado, mas levantado como risco de segurança (uma conta GitHub registrada com um e-mail que o titular não controla poderia sequestrar uma conta local existente). A resolução exata desse ponto (vínculo automático vs. confirmação explícita vs. bloqueio) está na seção "Comportamento esperado" acima (passo 4 de `LoginGithubService.AutenticarAsync`): bloqueio, sem vínculo automático.

**Consequências:**
- Nova dependência externa: GitHub OAuth App (Client ID/Secret) — configuração sensível via `.env`/variável de ambiente, nunca hardcoded (mesma disciplina já usada para JWT/SMTP).
- Schema do banco muda: `Usuario.SenhaHash` precisa aceitar ausência de senha local para contas criadas só via GitHub — nullable, detalhado na seção "Comportamento esperado" acima (Migração de schema).
- Usuários criados via GitHub não passam pelo fluxo de verificação de e-mail de `SDD-013` — o GitHub já garante posse do e-mail quando ele é público/verificado; o caso de e-mail privado/ausente é tratado como restrição conhecida em `requisitos/SDD-023-login-cadastro-via-github.md`.
- O novo endpoint de troca de `code` por sessão entra na regra já vigente de manter o Swagger/OpenAPI atualizado no mesmo commit.
- Sem o GitHub OAuth App registrado (Client ID/Secret configurados), o fluxo simplesmente não funciona em nenhum ambiente — mesma natureza de dependência operacional externa já aceita para o runner self-hosted (`specs/SDD-002-pipeline-cicd-self-hosted.md`).

## Casos de borda

- Usuário cancela a autorização no GitHub (volta sem `code`, com `error=access_denied` na query): `/auth/github/callback` trata como erro de validação local, sem chamar o backend — exibe "Não foi possível concluir a autenticação com o GitHub.".
- `state` ausente ou divergente: mesmo tratamento do caso anterior (mesma mensagem, sem chamar o backend).
- Falha de rede genérica na chamada a `POST /api/auth/login/github` (ex.: backend indisponível): exibe "Não foi possível entrar com o GitHub. Tente novamente em instantes.".

## Fora do escopo

Vínculo explícito de conta GitHub a uma conta local existente (usuário decide depois de autenticado) — SDD futura. Desvincular GitHub de uma conta. Outros provedores sociais (descartados na decisão original, `specs/SDD-004-cadastro-de-usuario.md`).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-023-login-cadastro-via-github.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md` | Convenções de back-end e de schema (campo de senha se torna opcional) |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Code (Claude Sonnet 5) — implementação do back-end.
- **Notas de conclusão:**
  Back-end completo e testado (`dotnet build`: 0 avisos/0 erros; `dotnet test`: 139 aprovados/0
  falhas). Front-end (Critério 1/Tarefa 1 — botão "Continuar com GitHub" e rota
  `/auth/github/callback`) permanece pendente, fora do escopo desta sessão — SDD continua **Em
  andamento** até essa parte ser implementada. Decisões tomadas sem 100% de explicitação na spec:
  (1) `LoginService`/`TrocarSenhaService` precisaram de guarda contra `SenhaHash` nulo (conta só via
  GitHub tentando login local ou troca de senha) — tratado como credenciais/senha atual inválida,
  nunca revelando que a conta só existe via login social; (2) `LoginGithubService` captura
  `DbUpdateException` de violação de unicidade no insert (mesmo padrão de `CadastrarUsuarioService`)
  para cobrir a corrida entre a checagem de existência e o `SaveChangesAsync`; (3)
  `docker-compose.yml` usa valores de exemplo como *default* (`:-`, mesmo padrão do Smtp) em vez de
  obrigatório (`:?`, padrão do Jwt) para `GithubOAuth__ClientId/ClientSecret`, para não quebrar
  `docker compose up` de quem não está trabalhando nesta SDD — o pré-requisito operacional de um
  GitHub OAuth App real continua valendo para testar o fluxo de ponta a ponta.
- **Arquivos alterados:**
  - `backend/Domain/Entities/Usuario.cs` (SenhaHash nullable, novo GithubId)
  - `backend/Infrastructure/EntityConfigurations/UsuarioConfiguration.cs` (SenhaHash não mais required, índice único parcial de GithubId)
  - `backend/Migrations/20260714161411_LoginSocialGithub.cs` (+ `.Designer.cs`, `AppDbContextModelSnapshot.cs`)
  - `backend/Features/Auth/LoginGithub/GithubOAuthSettings.cs` (novo)
  - `backend/Features/Auth/LoginGithub/GithubUsuario.cs` (novo)
  - `backend/Features/Auth/LoginGithub/IGithubOAuthClient.cs` (novo)
  - `backend/Features/Auth/LoginGithub/GithubOAuthClient.cs` (novo)
  - `backend/Features/Auth/LoginGithub/LoginGithubRequest.cs` (novo)
  - `backend/Features/Auth/LoginGithub/ResultadoLoginGithub.cs` (novo)
  - `backend/Features/Auth/LoginGithub/LoginGithubService.cs` (novo)
  - `backend/Features/Auth/Login/LoginService.cs` (guarda contra SenhaHash nulo)
  - `backend/Features/Auth/TrocaSenha/TrocarSenhaService.cs` (guarda contra SenhaHash nulo)
  - `backend/Controllers/AuthController.cs` (endpoint `POST /api/auth/login/github`)
  - `backend/Program.cs` (DI + fail-fast de `GithubOAuthSettings` + HttpClient nomeado)
  - `backend/appsettings.json`, `backend/appsettings.Development.json` (seção `GithubOAuth`)
  - `.env.example` (`GITHUB_OAUTH_CLIENT_ID`/`GITHUB_OAUTH_CLIENT_SECRET`)
  - `docker-compose.yml` (`GithubOAuth__ClientId`/`GithubOAuth__ClientSecret` no serviço backend)
  - `backend.Tests/Features/Auth/LoginGithub/GithubOAuthClientFalso.cs` (novo, duplo de teste)
  - `backend.Tests/Features/Auth/LoginGithub/LoginGithubServiceTests.cs` (novo, 16 casos)
  - `backend.Tests/Controllers/AuthController{Me,AtualizarPerfil,TrocarSenha,ExcluirConta}Tests.cs` (ajuste de construtor — novo parâmetro `LoginGithubService`)

- **Agente/modelo utilizado:** Claude Code (Claude Sonnet 5) — implementação do front-end (Critério 1/Tarefa 1).
- **Notas de conclusão:**
  Front-end completo e testado (`npx tsc --noEmit`: 0 erros; `pnpm lint`: 0 problemas; `pnpm test`:
  109 aprovados/0 falhas, sendo 25 novos). Verificado também manualmente no navegador (dev server
  local): botão renderiza em `/login` e `/cadastro`, acima do formulário, com separador "ou";
  `/auth/github/callback` sem `code`/`state` mostra o erro genérico esperado sem disparar nenhuma
  chamada de rede para `/api/auth/login/github` (confirmado via inspeção das requisições de rede).
  Pré-requisito operacional (GitHub OAuth App real registrado, Client ID em `.env.local`) continua
  pendente do usuário — fora do alcance de teste automatizado, mesmo como já registrado na spec
  ("Critérios de pronto"); por isso o **Status** desta SDD permanece **Em andamento**, não
  **Concluída**, até esse teste manual de ponta a ponta acontecer. Decisões tomadas sem 100%
  de explicitação na spec: (1) a versão instalada de `lucide-react` (1.24.0) não tem mais ícones de
  marca (Github/Gitlab/Slack/Twitter foram removidos do pacote) — usei um SVG inline do octocat mark
  em vez de adicionar uma dependência nova só para o ícone; (2) a validação do `state` contra
  `sessionStorage` (RNF02) foi isolada em `autenticarComGithubCallback`
  (`services/github-oauth-callback.ts`), usada como `mutationFn` de uma mutation TanStack Query
  (`useGithubCallback`), em vez de um `useState` local + `useEffect` no componente — a regra de lint
  `react-hooks/set-state-in-effect` (parte do `eslint-config-next` deste projeto) rejeita `setState`
  síncrono dentro de `useEffect`, e mover a validação para dentro do `mutationFn` evita o problema
  mantendo o componente sem estado local próprio; (3) o texto do separador é "ou" (minúsculo, sem
  transformação visual), já que a spec não especificava capitalização; (4) o botão fica dentro do
  mesmo `Card` do formulário de e-mail/senha (não em um `Card` separado) — mesmo padrão dos blocks de
  login do shadcn/ui (`login-04`/`login-05`, ver `knowledge/frontend-shadcn-ui.md`) já referenciados
  pelo projeto.
- **Arquivos alterados:**
  - `frontend/src/features/auth/services/github-oauth.ts` (novo — `iniciarAutenticacaoGithub`, início do fluxo OAuth)
  - `frontend/src/features/auth/services/github-oauth.test.ts` (novo)
  - `frontend/src/features/auth/services/github-oauth-callback.ts` (novo — `autenticarComGithubCallback`, validação de state/CSRF + chamada ao backend)
  - `frontend/src/features/auth/services/github-oauth-callback.test.ts` (novo)
  - `frontend/src/features/auth/services/auth.service.ts` (novo `loginGithub`/`LoginGithubRequest`, reaproveita `LoginResponse`)
  - `frontend/src/features/auth/hooks/useGithubCallback.ts` (novo)
  - `frontend/src/features/auth/hooks/useGithubCallback.test.tsx` (novo)
  - `frontend/src/features/auth/components/GithubOAuthButton.tsx` (novo)
  - `frontend/src/features/auth/components/GithubOAuthButton.test.tsx` (novo)
  - `frontend/src/features/auth/components/GithubCallbackForm.tsx` (novo)
  - `frontend/src/features/auth/components/GithubCallbackForm.test.tsx` (novo)
  - `frontend/src/features/auth/components/LoginForm.tsx` (botão GitHub + separador acima do formulário)
  - `frontend/src/features/auth/components/LoginForm.test.tsx` (novo teste do botão)
  - `frontend/src/features/auth/components/CadastroForm.tsx` (botão GitHub + separador acima do formulário)
  - `frontend/src/features/auth/components/CadastroForm.test.tsx` (novo teste do botão)
  - `frontend/src/features/auth/index.ts` (export de `GithubCallbackForm`)
  - `frontend/src/app/(public)/auth/github/callback/page.tsx` (novo)
  - `frontend/.env.local.example` (`NEXT_PUBLIC_GITHUB_CLIENT_ID`)

- **Verificação independente (orquestrador, Claude Sonnet 5):** repeti `dotnet build`/`dotnet test`
  (139/139) e `npx tsc --noEmit`/`pnpm lint`/`pnpm test` (109/109) eu mesmo, sem confiar só no
  autorrelato dos agentes. Li o código de `LoginGithubService.cs`, `GithubOAuthClient.cs`,
  `UsuarioConfiguration.cs` e a migração `LoginSocialGithub` linha a linha — implementação bate
  exatamente com os 5 passos da spec, inclusive a rejeição sem vínculo automático (Critério 4/`SDD-023`)
  e o fallback de e-mail privado via `/user/emails`. Apliquei a migração no Postgres local
  (`dotnet ef database update`), reconstruí o container do backend e testei ao vivo: `POST
  /api/auth/login/github` com um `code` inválido chama o GitHub de verdade e retorna `400` com a
  mensagem genérica esperada; o endpoint aparece no Swagger. No navegador: botão "Continuar com
  GitHub" renderiza corretamente em `/login`; clicar nele redireciona de fato para
  `github.com/login/oauth/authorize` com `redirect_uri`, `scope=user:email` e `state` (UUID)
  corretos — só `client_id` vem vazio, porque ainda não existe um GitHub OAuth App real registrado
  (esperado, ver "Notas"); `/auth/github/callback` sem `code`/`state` mostra o erro genérico sem
  disparar nenhuma chamada de rede pro backend (confirmado via `read_network_requests`). SDD
  passa para **Em revisão** — falta só o teste de ponta a ponta com credenciais reais do GitHub,
  que depende do usuário registrar o OAuth App (não é algo que dá pra automatizar).

## Notas

- Reabre a decisão de autenticação original (`specs/SDD-004-cadastro-de-usuario.md`, que descartou OAuth de terceiros "nesta fase", deixando explícito que poderia ser revisitado) — a decisão em si está na seção "Decisão de arquitetura" acima, não em `SDD-004`.
- Requer registrar um GitHub OAuth App (Client ID/Secret) antes de qualquer ambiente (local ou CI) conseguir testar o fluxo de ponta a ponta — pré-requisito operacional análogo ao runner self-hosted de `specs/SDD-002-pipeline-cicd-self-hosted.md`.
- Schema do banco muda: `Usuario.SenhaHash` precisa aceitar ausência de senha local para contas criadas só via GitHub — detalhado na seção "Comportamento esperado" acima (Migração de schema), não na "Decisão de arquitetura".

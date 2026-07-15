# SDD-005 — Login

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário cadastrado, quero entrar com e-mail e senha, para que eu possa acessar a área autenticada do sistema.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-005-login.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/clean-code.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md`, `knowledge/frontend-feedback-ui.md`, `knowledge/backend-arquitetura.md`, `knowledge/fluxo-login.md` |

## Comportamento esperado

**Entrada:** e-mail (`email`) e senha (`senha`), ambos obrigatórios, enviados no corpo da requisição como `{"email": "...", "senha": "..."}` (JSON, casing camelCase — serialização padrão do ASP.NET Core a partir do record `LoginRequest(string? Email, string? Senha)`). E-mail ou senha ausentes (nulo ou vazio) não geram um 400 de validação separado como em SDD-004 — são tratados como mais um caso de credenciais inválidas, caindo no mesmo 401 genérico descrito abaixo.

**Saída em sucesso:** status 200 com token JWT de curta duração (duração exata a definir na implementação, alinhada a RNF01 — ex: 15–30 min), retornado ao cliente no corpo `{"token": "..."}` (record `LoginResponse(string Token)`).

**Saída em erro:** status 401 com o corpo `{"erro": "Credenciais inválidas"}` (record `ErroResponse(string Erro)`) — texto literal `"Credenciais inválidas"`, a mesma resposta tanto para e-mail inexistente, senha incorreta, quanto para e-mail/senha ausentes (RF02/RNF02, evita enumeração de e-mails cadastrados). O front-end exibe esse texto tal qual devolvido pelo servidor, sem reescrevê-lo.

**Regras de negócio:**
- Verificação de credenciais compara a senha informada com o hash bcrypt armazenado (nunca compara texto puro).
- Rotas autenticadas exigem o token JWT válido no cabeçalho da requisição; token ausente, expirado ou malformado retorna 401 sem detalhar o motivo exato ao cliente.
- Logout é responsabilidade do cliente: descarta o token localmente. Não há invalidação do token no servidor nesta fase.
- A geração e validação do token (algoritmo JWT, duração curta, comparação via hash bcrypt) reaproveita a decisão de autenticação já tomada em [`specs/SDD-004-cadastro-de-usuario.md`](../specs/SDD-004-cadastro-de-usuario.md) — esta SDD não repete essa decisão, só a aplica ao fluxo de login.
- O token é assinado com o algoritmo `HmacSha256` e carrega as claims `sub`, `email` e `jti`, além de `iat` e `nbf` explícitos — o `JwtSecurityToken` não os preenche sozinho, então precisam ser definidos manualmente na emissão. A mesma classe (`JwtTokenService`) emite e valida o token, evitando divergência entre as duas pontas. Configuração via variáveis de ambiente `Jwt__Issuer`, `Jwt__Audience` e `Jwt__Key`; a validação na API usa `IncludeErrorDetails = false` e `MapInboundClaims = false` (ver `knowledge/backend-arquitetura.md`).

**Front-end:** formulário baseado no block `login-03` do shadcn/ui (`pnpm dlx shadcn@latest add login-03`, ver [`knowledge/frontend-shadcn-ui.md`](../knowledge/frontend-shadcn-ui.md)) — mesma variante usada em SDD-004, por consistência visual. ~~Sem login social (Google, Apple ou qualquer outro provedor OAuth).~~ **Superado por `specs/SDD-023-login-cadastro-via-github.md`**: a partir de SDD-023, o formulário passou a incluir um botão de login via GitHub (`GithubOAuthButton`) e um separador "ou" acima do formulário de e-mail/senha.

Componentes: `LoginForm.tsx` (formulário), `useLogin.ts` (hook de submissão), `login.schema.ts` (validação), `auth-store.ts` (store Zustand em memória, sem persistência — mecanismo concreto do "sem lembrar de mim" listado em "Fora do escopo") e `session-interceptor.ts` (interceptor de sessão), seguindo a convenção de nomenclatura de [`knowledge/frontend-arquitetura.md`](../knowledge/frontend-arquitetura.md).

**UX pós-sucesso:** ao autenticar, o front-end exibe a mensagem "Login realizado com sucesso!" seguida de "Redirecionando...", aguarda 1500ms (`REDIRECIONAMENTO_APOS_SUCESSO_MS`) e então redireciona para a rota `/inicio` (`ROTA_APOS_SUCESSO`), seguindo o padrão de feedback definido em [`knowledge/frontend-feedback-ui.md`](../knowledge/frontend-feedback-ui.md).

## Critérios de aceite

- [ ] Critério 1 — Login aceita e-mail e senha; credenciais inválidas (e-mail inexistente OU senha errada OU e-mail/senha ausentes) retornam 401 com a mesma mensagem genérica `"Credenciais inválidas"`, sem indicar qual dado está errado ou se algum campo está ausente.
- [ ] Critério 2 — Login bem-sucedido gera um token JWT de curta duração e o retorna ao cliente.
- [ ] Critério 3 — Requisição a uma rota autenticada sem token válido (ausente, expirado ou malformado) retorna 401, sem detalhar o motivo exato ao cliente.
- [ ] Critério 4 — Não há limite de tentativas nesta primeira versão (rate limiting é fora de escopo).
- [ ] Critério 5 — Logout descarta o token do lado do cliente.

## Casos de borda

- E-mail cadastrado com capitalização diferente da usada no login (case-insensitive, mesmo critério de SDD-004).
- Tentativa de acessar rota protegida sem token algum (cabeçalho ausente) — mesmo tratamento (401) que token inválido.
- Token expirado vs. token malformado — ambos retornam 401 com a mesma mensagem genérica ao cliente (não expor qual dos dois ocorreu).
- ~~Múltiplas tentativas de login seguidas com senha errada — aceitas sem bloqueio nesta versão (RNF/rate limiting fora de escopo).~~ **Superado por `specs/SDD-015-bloqueio-por-tentativas.md`**: a partir de SDD-015, 5 tentativas malsucedidas em 15 minutos por e-mail normalizado bloqueiam novas tentativas, com a mesma resposta 401 genérica já definida nesta spec (RNF01/SDD-015 reforça, não contradiz, o RNF02 desta funcionalidade).

## Fora do escopo

Refresh token / renovação automática, revogação de token no servidor (blacklist), "lembrar de mim". ~~Rate limiting ou bloqueio por tentativas~~ — deixou de ser "fora de escopo" a partir de `specs/SDD-015-bloqueio-por-tentativas.md` (ver nota em "Casos de borda" acima e `specs/SDD-015-bloqueio-por-tentativas.md` para o comportamento implementado).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-005-login.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/clean-code.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de back-end, qualidade de código e do block de UI usado |
| Conhecimento relacionado | `knowledge/frontend-arquitetura.md` | Convenção de nomenclatura de componentes, hooks e store do front-end |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Padrão de mensagem de sucesso/erro e redirecionamento pós-login seguido pelo `LoginForm.tsx` |
| Conhecimento relacionado | `knowledge/backend-arquitetura.md` | Padrão `Resultado*`, configuração fail-fast e claims/opções de validação do JWT |
| Diagrama de sequência | `knowledge/fluxo-login.md` | Sim — descreve o fluxo ponta a ponta desta funcionalidade e referencia esta SDD de volta |
| Decisão de autenticação (reaproveitada) | `specs/SDD-004-cadastro-de-usuario.md` | Sim — define geração/validação do token JWT e hash bcrypt reaproveitados aqui |
| Login via GitHub (supersede parcialmente o front-end) | `specs/SDD-023-login-cadastro-via-github.md` | Sim — adiciona o botão de login social ao `LoginForm.tsx` descrito nesta SDD |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** Backend: `POST /api/auth/login`, `JwtTokenService` único usado tanto pra emitir quanto pra validar o token (evita emissão/validação divergirem), duração de 20 min (dentro da faixa RNF01). `ResultadoLogin.Erro()` sem parâmetro — estruturalmente impossível vazar qual credencial falhou (RF02/RNF02), diferente de `ResultadoCadastro.Erro(mensagem)` de propósito. Front-end: `LoginForm` (mesmo block `login-03`, sem campo de nome), `useLogin` gravando o token só via store Zustand (nunca `localStorage` cru, sem persistência entre sessões — alinhado com "sem lembrar de mim" fora do escopo), `session-interceptor.ts` como esqueleto pronto pra limpar sessão e redirecionar em qualquer 401 futuro. **Nota de verificação:** o agente responsável por esta etapa do front-end retornou um resumo estruturado inválido (placeholder, não refletia o trabalho real) — os arquivos foram lidos e validados manualmente nesta sessão (`pnpm lint`, `tsc --noEmit`, `pnpm build`, todos passando) antes de aceitar o resultado como legítimo. Backend: `dotnet test` com a suíte completa (34/34, incluindo os 5 critérios de aceite desta SDD) confirmado de forma independente. Testado end-to-end via Docker real (login com senha correta → 200 + token; senha errada → 401 genérico). Revisão humana ainda pendente.
- **Arquivos alterados:** `backend/Features/Auth/Login/*`, `backend/Features/Auth/JwtSettings.cs`, `backend/Features/Auth/JwtTokenService.cs`, `backend.Tests/*` (testes de login), `frontend/src/features/auth/components/LoginForm.tsx`, `frontend/src/features/auth/hooks/useLogin.ts`, `frontend/src/features/auth/store/auth-store.ts`, `frontend/src/features/auth/services/session-interceptor.ts`, `frontend/src/features/auth/types/login.schema.ts`, `frontend/src/app/(public)/login/page.tsx`.

## Notas

- Implementada nesta sessão (2026-07-13) via Workflow — ver Registro de execução acima para detalhes e validação.

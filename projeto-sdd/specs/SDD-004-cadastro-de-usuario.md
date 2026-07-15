# SDD-004 — Cadastro de usuário

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como visitante do sistema, quero me cadastrar com nome, e-mail e senha, para que eu possa criar uma conta e depois acessar a área autenticada.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-004-cadastro-de-usuario.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/clean-code.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md`, `knowledge/postgresql.md`, `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

**Entrada:** nome (string, obrigatório), e-mail (string, formato válido, obrigatório, único no sistema), senha (string, obrigatório, mínimo 8 caracteres com ao menos uma letra e um número — RNF02).

**Contrato da API:** `POST /api/auth/cadastro`. Requisição: `{ nome, email, senha }`. Sucesso: `201 Created` com `{ id, nome, email, criadoEm }` (campos em camelCase). Erro de validação ou de negócio: `400 Bad Request` com `{ erro: string }`. No back-end, o endpoint é implementado por `CadastrarUsuarioService`, com `CadastrarUsuarioRequest`/`CadastrarUsuarioResponse` e o tipo de resultado `ResultadoCadastro`; no front-end, por `CadastroForm.tsx`, `useCadastro.ts` e `cadastro.schema.ts`.

**Saída em sucesso:** confirmação do cadastro (dados do usuário criado, sem senha nem hash), exibida em card de sucesso na tela, seguida de redirecionamento automático para `/login` após 1500 ms. Sem login automático nesta fase — o usuário cadastra e depois autentica separadamente via SDD-005.

**Saída em erro:** mensagem específica por tipo de erro, sem expor detalhes internos (stack trace, estrutura do banco). Mensagens exatas:
- Nome ausente: "Nome é obrigatório."
- E-mail ausente: "E-mail é obrigatório."
- Senha ausente: "Senha é obrigatória."
- E-mail em formato inválido: "E-mail em formato inválido."
- Senha fora do padrão (RNF02): "Senha deve ter no mínimo 8 caracteres, com ao menos uma letra e um número."
- E-mail já cadastrado: "E-mail já cadastrado."

**Regras de negócio:**
- A senha nunca é persistida, logada ou retornada em texto puro — hash bcrypt com fator de custo 12 (pacote `BCrypt.Net-Next`, RNF01) acontece antes de qualquer persistência.
- Unicidade de e-mail é verificada de forma case-insensitive (`Usuario@x.com` e `usuario@x.com` contam como o mesmo e-mail).
- Formato de e-mail é validado pela regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` (exige um `@`, texto antes e depois dele, e um domínio com ponto).
- Nome e e-mail passam por `trim` antes de validar (espaços em branco no início/fim não contam para validação).
- Ao final de um cadastro bem-sucedido, o sistema aciona a geração e o envio do token de verificação de e-mail — o disparo faz parte deste fluxo, mas o ciclo de vida do token (validação, reenvio, expiração) é especificado em [`SDD-013-verificacao-de-email.md`](./SDD-013-verificacao-de-email.md).

**Persistência:** tabela `usuarios`, colunas `id uuid` (chave primária, gerada na aplicação via `Guid.CreateVersion7()` — UUIDv7 — e não pelo banco), `nome varchar(200)`, `email citext(320)` com índice único `ix_usuarios_email` (tipo `citext` escolhido em vez de índice funcional sobre `lower(email)` para manter a unicidade case-insensitive na própria coluna), `senha_hash text`, `criado_em timestamptz`. Convenções gerais de nomenclatura e tipos seguem [`knowledge/postgresql.md`](../knowledge/postgresql.md).

**Front-end:** formulário baseado no block `login-03` do shadcn/ui (`pnpm dlx shadcn@latest add login-03`, ver [`knowledge/frontend-shadcn-ui.md`](../knowledge/frontend-shadcn-ui.md)), adaptado com campo adicional de nome. Acima do formulário, exibe também o botão de login via GitHub (`GithubOAuthButton`) com divisor "ou" — extensão introduzida por [`SDD-023-login-cadastro-via-github.md`](./SDD-023-login-cadastro-via-github.md), que revisa a decisão original de "sem login social" descrita na seção "Decisão de arquitetura" abaixo. Demais provedores (Google, Apple ou qualquer outro OAuth além do GitHub) continuam fora do escopo.

## Critérios de aceite

- [ ] Critério 1 — Cadastro exige nome, e-mail e senha; todos obrigatórios.
- [ ] Critério 2 — E-mail precisa ser único no sistema; tentativa de cadastro com e-mail já existente é rejeitada com mensagem clara.
- [ ] Critério 3 — Senha precisa atender aos critérios mínimos de força (ver `projeto-sdd/requisitos/SDD-004-cadastro-de-usuario.md`); cadastro com senha fora do padrão é rejeitado antes de persistir.
- [ ] Critério 4 — Senha é armazenada com hash bcrypt — nunca em texto puro, nunca reversível.
- [ ] Critério 5 — Cadastro bem-sucedido retorna confirmação sem expor senha nem hash em nenhuma resposta.
- [ ] Critério 6 — Erros de validação retornam mensagem amigável ao usuário; detalhes internos sensíveis ficam só no log.

## Decisão de arquitetura

**Contexto:** o time precisa de cadastro e login simples, mas seguro, sem depender de provedor externo (OAuth) nesta fase. É a primeira decisão de arquitetura de produto do projeto — define como a senha é validada/armazenada e como a sessão do usuário autenticado é mantida entre requisições, afetando diretamente este SDD (cadastro) e o SDD-005 (login).

**Decisão:** autenticação via e-mail e senha. A senha é validada contra critérios mínimos de força e armazenada apenas como hash bcrypt (nunca texto puro, nunca reversível). A sessão do usuário autenticado é mantida via token JWT de curta duração, emitido no login e enviado pelo cliente nas requisições autenticadas subsequentes.

**Alternativas consideradas:**
- **OAuth de terceiro (Google, Apple, Microsoft etc.)** — descartado nesta fase por adicionar complexidade de integração (provedor externo, tela de consentimento) sem benefício claro para o escopo inicial. Revisitado em [`SDD-023-login-cadastro-via-github.md`](./SDD-023-login-cadastro-via-github.md), que adicionou login/cadastro via GitHub OAuth nesta mesma tela; Google, Apple e demais provedores permanecem fora do escopo.
- **Sessão em memória no servidor (server-side session)** — descartada por não escalar horizontalmente sem um store de sessão compartilhado (ex: Redis). JWT evita esse acoplamento por ser stateless.
- **CQRS para separar comandos (cadastro/login) de queries (consulta de usuário)** — descartado nesta fase. Conforme [`knowledge/cqrs.md`](../knowledge/cqrs.md), CQRS agrega valor quando leitura e escrita têm necessidades muito diferentes de escala ou o domínio é complexo — não é o caso de um cadastro/login simples; a complexidade adicional (dois modelos, sincronização) não se paga aqui.

**Consequências:** duração curta do token obriga o usuário a autenticar de novo com frequência — aceitável nesta fase, já que não há refresh token. Revogar um token antes da expiração natural não é possível sem um mecanismo adicional (blacklist) — explicitamente fora do escopo nesta fase. Hash bcrypt é deliberadamente lento (proteção contra força bruta) — custo de CPU a monitorar se o volume de cadastros/logins crescer significativamente.

## Casos de borda

- Cadastro com e-mail em formato inválido (sem `@`, sem domínio) — rejeitado com mensagem de formato inválido.
- Cadastro com e-mail já existente, mas com capitalização diferente do já cadastrado — tratado como duplicado (RF02).
- Campos com espaços em branco no início/fim — normalizados antes da validação, não geram erro por si só.
- Senha que atende ao tamanho mínimo mas contém só letras ou só números — rejeitada (RNF02 exige letra **e** número).

## Fora do escopo

O ciclo de vida completo da confirmação de e-mail (validação do token, reenvio, expiração) — este SDD cobre apenas o disparo da geração/envio do token ao final de um cadastro bem-sucedido; o fluxo em si é especificado em [`SDD-013-verificacao-de-email.md`](./SDD-013-verificacao-de-email.md). Também fora do escopo: login automático após o cadastro, upload de foto de perfil ou coleta de dados além de nome/e-mail/senha.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-004-cadastro-de-usuario.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/clean-code.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md`, `knowledge/postgresql.md`, `knowledge/frontend-feedback-ui.md` | Convenções de back-end, front-end, persistência e feedback de UI usadas na implementação |
| Decisão relacionada | `projeto-sdd/specs/SDD-013-verificacao-de-email.md` | Especifica o ciclo de vida do token de verificação de e-mail disparado ao final deste cadastro |
| Decisão relacionada | `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md` | Revisa a decisão original de "sem login social", adicionando login/cadastro via GitHub OAuth nesta mesma tela |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** Backend: `POST /api/auth/cadastro`, entidade `Usuario` com Id gerado via `Guid.CreateVersion7()` (UUIDv7 nativo do BCL desde .NET 9 — sem pacote externo), unicidade de e-mail via coluna `citext` + checagem `.ToLower()` redundante na aplicação (testável sob EF InMemory), hash bcrypt com `workFactor: 12`, migration `InitialCreate` gerada e aplicada. Regras de negócio via tipo de resultado (`ResultadoCadastro`), não exceção — exceção só pra condição de corrida real (`DbUpdateException`/`UniqueViolation`). Front-end: `CadastroForm` adaptando o block `login-03` com campo de nome, `useCadastro` (TanStack Query), feedback conforme `knowledge/frontend-feedback-ui.md`. Validado de forma independente nesta sessão: `dotnet build`/`dotnet test` (34/34 testes passando, incluindo os 6 critérios de aceite desta SDD) e `pnpm lint`/`tsc --noEmit`/`pnpm build` no front-end. Testado end-to-end via Docker real (cadastro retornando 201 com dados esperados). Revisão humana ainda pendente.
- **Arquivos alterados:** `backend/Domain/Entities/Usuario.cs`, `backend/Infrastructure/EntityConfigurations/UsuarioConfiguration.cs`, `backend/Features/Auth/Cadastro/*`, `backend/Controllers/AuthController.cs`, `backend/Migrations/*`, `backend.Tests/*` (testes de cadastro), `frontend/src/features/auth/components/CadastroForm.tsx`, `frontend/src/features/auth/hooks/useCadastro.ts`, `frontend/src/features/auth/types/cadastro.schema.ts`, `frontend/src/app/(public)/cadastro/page.tsx`.

## Notas

- Implementada nesta sessão (2026-07-13) via Workflow — ver Registro de execução acima para detalhes e validação.

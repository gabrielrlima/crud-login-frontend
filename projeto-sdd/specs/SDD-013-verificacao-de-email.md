# SDD-013 — Verificação de e-mail no cadastro

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como sistema, quero confirmar que o usuário realmente tem acesso ao e-mail informado no cadastro, para que eu não crie contas com e-mails digitados errado ou pertencentes a terceiros.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-013-verificacao-de-email.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md`, `knowledge/boas-praticas-arquitetura.md`, `knowledge/ambiente-local-docker.md`, `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

**Ao concluir o cadastro (SDD-004):** gerar um token de verificação (alta entropia, ex.: 256 bits, codificado em base64url). O token nunca é persistido em texto puro: armazena-se só o hash SHA-256 (`SHA256.HashData`) numa tabela `tokens_verificacao_email`. Diferente do hash de senha (bcrypt, deliberadamente custoso), o token de verificação já nasce com alta entropia e uso único — um hash rápido é suficiente para a validação, sem o custo de CPU de um algoritmo lento.

A tabela `tokens_verificacao_email` tem as colunas `id` (uuid, gerado pela aplicação via `Guid.CreateVersion7()` — não pelo banco), `usuario_id` (chave estrangeira para o usuário, `ON DELETE CASCADE`), `token_hash`, `expira_em` (expiração, ex.: 24h) e `criado_em`, além do campo `usado_em` (nulo até ser consumido). Índice único em `token_hash` (validação do token recebido) e índice não-único em `usuario_id` (localizar tokens ativos do usuário ao invalidá-los num reenvio).

Enviar e-mail via `IEmailSender` (ver "Decisão de arquitetura" abaixo) com assunto "Confirme seu e-mail" e corpo contendo o texto "Confirme seu endereço de e-mail para concluir o cadastro:", o link `{FRONTEND_URL}/verificar-email?token={token}` e o aviso "Este link expira em 24 horas. Se você não solicitou este cadastro, ignore esta mensagem."

**`GET /api/auth/verificar-email?token={token}`:**
- Token válido (existe, não expirado, não usado): marca o usuário como `email_verificado = true`, marca o token como usado, retorna `200 { "mensagem": "E-mail verificado com sucesso." }`.
- Token inválido/expirado/já usado/inexistente: `400 { "erro": "Link de verificação inválido ou expirado." }` — mensagem genérica, sem detalhar qual dos casos ocorreu.

**`POST /api/auth/verificar-email/reenviar`:**
- Request: `{ "email": string }`.
- Sempre responde `200 { "mensagem": "Se o e-mail estiver cadastrado e pendente de verificação, um novo link foi enviado." }` — independente de o e-mail existir, já estar verificado, ou não (mesma garantia de não-enumeração de RF02/SDD-004).
- Limite de frequência: no máximo 1 reenvio por e-mail a cada 60 segundos (silenciosamente ignorado se dentro da janela — mesma resposta genérica, sem revelar que o limite foi atingido).
- Reenvio gera um **novo** token, invalidando qualquer token de verificação anterior para aquele usuário.

**Tela `/verificar-email` (front-end):** ao montar, chama `GET /api/auth/verificar-email` automaticamente com o `token` lido da query string.
- Sem token na URL: exibe o erro "Nenhum token de verificação foi informado no link." e o formulário de reenvio.
- Enquanto a chamada está em andamento: exibe "Verificando seu e-mail...".
- Sucesso: exibe "E-mail verificado com sucesso!" com um link "Ir para o login".
- Erro (token inválido, expirado, já usado ou inexistente): exibe a mensagem de erro retornada pela API e o formulário de reenvio.
- A consulta (`useVerificarEmail`) não faz nova tentativa nem refaz a chamada em foco de janela ou reconexão (`retry: false`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`) — evita reenviar automaticamente a validação de um token que a própria chamada já consumiu ou invalidou.

**Formulário de reenvio (`VerificarEmailForm`):** card com título "Verificação de e-mail" e descrição "Solicite um novo link informando seu e-mail cadastrado", campo de e-mail e botão "Reenviar link de verificação" (estado de carregamento: "Reenviando...").

## Critérios de aceite

- [ ] Critério 1 — O sistema gera um token de verificação de uso único e alta entropia ao concluir o cadastro (SDD-004).
- [ ] Critério 2 — O sistema envia um link de verificação por e-mail, sem confirmar a usuários não autenticados se um e-mail já existe na base (mantém a garantia de RF02/SDD-004).
- [ ] Critério 3 — O sistema marca a conta como "e-mail verificado" somente após validar um token existente, não expirado e não utilizado.
- [ ] Critério 4 — O sistema permite reenvio do e-mail de verificação, com limite de frequência (evita spam ao mesmo endereço).
- [ ] Critério 5 — O sistema rejeita token expirado, já usado ou inexistente com mensagem genérica, sem detalhar o motivo internamente.

## Decisão de arquitetura

**Contexto:** SDD-013 (verificação de e-mail no cadastro) e SDD-014 (recuperação de senha) precisam enviar e-mail de verdade. `specs/SDD-001-ambiente-docker-local.md` já estabeleceu o padrão deste projeto: resolver o ambiente de desenvolvimento local primeiro, sem depender de serviço externo, e deixar a decisão de produção para quando a estratégia de deploy existir. Esta decisão aplica o mesmo princípio ao envio de e-mail.

**Decisão:** Ambiente de desenvolvimento local usa **Mailpit** — servidor SMTP fake com interface web, rodando como serviço no `docker-compose.yml` — que captura os e-mails "enviados" sem entregá-los de verdade, permitindo testar o fluxo completo (cadastro → e-mail de verificação → clique no link) sem sair da máquina local.

O backend expõe uma abstração `IEmailSender` (contrato simples: destinatário, assunto, corpo), implementada via cliente SMTP apontando para o Mailpit em desenvolvimento. O provedor de produção (SendGrid, AWS SES, Postmark, Resend etc.) permanece em aberto — decisão própria, quando a estratégia de deploy for definida.

**Alternativas consideradas:**
- **Provedor real (SendGrid, AWS SES etc.) desde já** — descartado nesta fase: exigiria conta e API key de terceiro só para rodar localmente, contradizendo a premissa já estabelecida em `specs/SDD-001-ambiente-docker-local.md` de que o ambiente local não depende de serviço externo.
- **MailHog** — alternativa mais antiga a Mailpit, sem manutenção ativa recente; Mailpit é o sucessor recomendado pela comunidade, com a mesma proposta (SMTP fake + UI web).

**Consequências:**
- `docker-compose.yml` ganha o serviço `mailpit` (imagem `axllent/mailpit`), com a UI web exposta numa porta configurável via `.env` — permite inspecionar visualmente qualquer e-mail "enviado" durante o desenvolvimento.
- `IEmailSender` mantém o backend desacoplado do provedor real — trocar de Mailpit para um provedor de produção é troca de implementação da interface, não mudança de contrato nas funcionalidades que a consomem.
- Nenhum e-mail é entregue de verdade nesta fase — aceitável, já que não há usuário real ainda, só desenvolvimento e teste.
- Convenções de uso ficam em `knowledge/ambiente-local-docker.md` (novo serviço no compose) — sem knowledge doc dedicado a e-mail nesta fase, por proporcionalidade.

## Casos de borda

- Cadastro com provedor de e-mail (Mailpit) indisponível: cadastro (SDD-004) continua funcionando normalmente; o envio do e-mail de verificação falha silenciosamente (logado, não propagado como erro ao usuário) — RNF03.
- Usuário já verificado solicita reenvio: resposta genérica idêntica, nenhum e-mail novo é enviado de fato (mas a resposta não revela isso).
- Token de verificação de um cadastro antigo, após múltiplos reenvios: só o token mais recente é válido; os anteriores retornam "inválido ou expirado" mesmo que o prazo de expiração original não tenha passado.

## Fora do escopo

Bloquear login de contas não verificadas — decisão de produto separada, não tomada neste SDD. Provedor de e-mail de produção — decisão em aberto (ver "Decisão de arquitetura" acima).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-013-verificacao-de-email.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md`, `knowledge/boas-praticas-arquitetura.md` | Convenções de back-end e integração com dependência externa |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md` | Novo serviço `mailpit` no `docker-compose.yml` (ver "Decisão de arquitetura") |
| Conhecimento relacionado | `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-feedback-ui.md` | Tela e formulário de verificação/reenvio (TanStack Query, componentes shadcn, estados de carregamento/erro acessíveis) |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-14. Infraestrutura de suporte (Mailpit, `IEmailSender`, entidades/migration `SegurancaDeAcesso`) já existia de uma tarefa anterior na mesma sessão; esta execução implementou as rotas e a lógica de negócio da SDD em si.
- **Notas de conclusão:** Backend: `VerificacaoEmailService` (Features/Auth/VerificacaoEmail) concentra geração/envio de token, validação e reenvio. `CadastrarUsuarioService` (SDD-004) passou a chamar `GerarEEnviarTokenAsync` ao concluir o cadastro, sem quebrar o contrato/testes já existentes daquela SDD. Token de 256 bits gerado via `RandomNumberGenerator` e codificado em base64url (`System.Buffers.Text.Base64Url`); só o hash SHA-256 é persistido (`TokenVerificacaoEmail.TokenHash`), nunca o valor em texto puro — mesma disciplina de `SenhaHash`. Reenvio invalida qualquer token anterior não usado do mesmo usuário antes de gerar um novo (spec, "casos de borda") e aplica limite de 60s por e-mail, ambos verificados por teste. Falha do provedor de e-mail (RNF03) é engolida e logada dentro do próprio `VerificacaoEmailService.GerarEEnviarTokenAsync` — nunca propaga pro cadastro nem pro reenvio, que sempre respondem sucesso. Nova configuração `Frontend:Url` (`FrontendSettings`, fail-fast em `Program.cs`, mesmo padrão de `Jwt`/`Smtp`) monta o link `{FRONTEND_URL}/verificar-email?token=...`; adicionada a `appsettings.json`/`appsettings.Development.json`, `.env.example` (`FRONTEND_URL`) e `docker-compose.yml` (`Frontend__Url`). Rotas novas: `GET /api/auth/verificar-email` e `POST /api/auth/verificar-email/reenviar`, documentadas com XML doc comment + `ProducesResponseType` no `AuthController` (mesmo padrão de SDD-004/005 — sem `openapi.yaml` estático neste projeto, Swagger é gerado via Swashbuckle a partir dos atributos). Validado: `dotnet build` (0 erros/0 avisos) e `dotnet test` (47/47 testes passando, incluindo os 5 critérios de aceite desta SDD e 2 novos testes em `CadastrarUsuarioServiceTests` cobrindo a integração com SDD-004). Revisão humana e teste end-to-end via Docker/Mailpit ainda pendentes.
- **Arquivos alterados:** `backend/Features/Auth/FrontendSettings.cs`, `backend/Features/Auth/MensagemResponse.cs`, `backend/Features/Auth/VerificacaoEmail/*` (novo), `backend/Features/Auth/Cadastro/CadastrarUsuarioService.cs`, `backend/Controllers/AuthController.cs`, `backend/Program.cs`, `backend/appsettings.json`, `backend/appsettings.Development.json`, `docker-compose.yml`, `.env.example`, `backend.Tests/Features/Auth/VerificacaoEmail/*` (novo), `backend.Tests/Features/Auth/Cadastro/CadastrarUsuarioServiceTests.cs`.
- **Front-end (etapa em paralelo, mesma sessão):** `app/(public)/verificar-email/page.tsx` (lê `?token=`, chama `GET /api/auth/verificar-email` automaticamente ao montar, exibe loading/sucesso/erro) + formulário de reenvio em caso de erro/token ausente, `features/auth/components/VerificarEmailForm.tsx`, `hooks/useVerificarEmail.ts` e `useReenviarVerificacao.ts` (TanStack Query). Testado com Vitest + RTL (`VerificarEmailForm.test.tsx`). Validado por esta sessão de forma independente: `pnpm build` gera a rota `/verificar-email`, suíte completa de front-end em 55/55 testes (6 arquivos). Nota: o agente de front-end registrou em seu próprio resumo que "o backend ainda não existe" — informação desatualizada (checou o repositório antes da etapa de backend desta mesma SDD terminar); o backend estava, de fato, pronto e integrado ao concluir esta sessão, confirmado por `dotnet test` (64/64) e teste manual do Swagger.

## Notas

- Pré-requisito de confiabilidade para SDD-014 (recuperação de senha) — sem confirmar que o e-mail pertence ao usuário, o link de recuperação pode ir parar num endereço que não é do dono da conta.
- A decisão de provedor de e-mail (seção "Decisão de arquitetura" acima) já cobre também SDD-014 — não repetir a decisão lá, apenas referenciar esta SDD.

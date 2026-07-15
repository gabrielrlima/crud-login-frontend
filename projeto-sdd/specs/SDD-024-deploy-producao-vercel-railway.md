# SDD-024 — Deploy em produção (Vercel + Railway) e separação em repositórios

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em andamento

## Necessidade

> Como time, quero separar o projeto (hoje um único diretório local, sem repositório Git algum) em dois repositórios públicos no GitHub — um para o front-end, outro para o back-end — e publicar cada um em produção, para que o CRUD de login, autenticação e gestão de conta deixe de existir só em ambiente Docker local e passe a ter uma URL pública real.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-024-deploy-producao-vercel-railway.md` |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md`, `knowledge/backend-arquitetura.md`, `knowledge/frontend-arquitetura.md` |

## Comportamento esperado

**1. Separação em dois repositórios (públicos, no GitHub):**

- [`crud-login-frontend`](https://github.com/gabrielrlima/crud-login-frontend) — `frontend/` mantido como subpasta (não flattened para a raiz — Vercel suporta "Root Directory" configurável, evitando mexer em caminho interno algum), mais uma cópia completa de `projeto-sdd/`, `templates-sdd/`, `CLAUDE.md` e `esteira-desenvolvimento.md`, mais um `README.md` próprio (linkando de volta para o repositório de back-end).
- [`crud-login-backend`](https://github.com/gabrielrlima/crud-login-backend) — `backend/` e `backend.Tests/` mantidos como estão hoje (estrutura interna intacta, zero mudança de caminho relativo — `docker-compose.yml` e a referência de projeto de `backend.Tests` continuam corretos sem edição), mais `docker-compose.yml` e `.env.example` (ambiente de desenvolvimento local continua existindo, sem mudança), mais a mesma cópia completa de `projeto-sdd/`, `templates-sdd/`, `CLAUDE.md` e `esteira-desenvolvimento.md`, mais um `README.md` próprio (linkando de volta para o repositório de front-end).
- Como não existia nenhum commit no monorepo original, os dois repositórios novos começaram do zero — não houve histórico a dividir ou preservar.

**2. Deploy do front-end (Vercel):**

- Repositório de front-end conectado à Vercel via import direto do GitHub — build/deploy automático a cada push na branch principal (comportamento padrão da Vercel para projetos Next.js, sem configuração extra).
- Variáveis de ambiente configuradas direto no painel da Vercel (nunca em arquivo versionado, já que o repositório é público):
  - `NEXT_PUBLIC_API_URL` → URL pública do back-end na Railway.
  - `NEXT_PUBLIC_GITHUB_CLIENT_ID` → Client ID do GitHub OAuth App **de produção** (item 4 abaixo) — diferente do Client ID usado em desenvolvimento local.

**3. Deploy do back-end (Railway):**

- Repositório de back-end conectado à Railway via import direto do GitHub, usando o `backend/Dockerfile` já existente (multi-stage .NET) — nenhuma mudança de código necessária, a imagem já builda no formato que a Railway espera.
- Um serviço de PostgreSQL gerenciado provisionado dentro do mesmo projeto Railway (plugin nativo), substituindo o Postgres do `docker-compose.yml` (que continua existindo, mas só para desenvolvimento local).
- Variáveis de ambiente configuradas no painel da Railway:
  - `ConnectionStrings__DefaultConnection` → apontando para o Postgres gerenciado da Railway.
  - `Jwt__Issuer` / `Jwt__Audience` / `Jwt__Key` → valores de produção, distintos dos usados em desenvolvimento local.
  - `Smtp__Host` / `Smtp__Port` / `Smtp__FromAddress` / `Smtp__FromName` / `Smtp__Usuario` / `Smtp__Senha` / `Smtp__UseSsl` → credenciais do provedor SMTP real (ver "Decisão de arquitetura").
  - `GithubOAuth__ClientId` / `GithubOAuth__ClientSecret` → do GitHub OAuth App de produção (item 4 abaixo).
  - `Frontend__Url` → URL pública do front-end na Vercel. Reaproveitada tanto para montar links de e-mail (já existente, `SDD-013`/`SDD-014`) quanto para a política de CORS já existente em `Program.cs` (`PoliticaCorsFrontend`) — **nenhuma mudança de código necessária** para CORS funcionar em produção, só a variável correta.
- As três migrations já existentes (`InitialCreate`, `SegurancaDeAcesso`, `LoginSocialGithub`) aplicadas ao banco de produção antes do primeiro uso real (`dotnet ef database update` contra a connection string de produção — passo manual nesta fase, ver "Fora do escopo").

**4. GitHub OAuth App de produção:**

- Um segundo GitHub OAuth App, criado especificamente para produção — distinto do App usado em desenvolvimento local (`SDD-023`), porque a Authorization callback URL é diferente (domínio real da Vercel, não `localhost`). Não dá para reaproveitar o mesmo App entre os dois ambientes.

**5. CI em cada repositório:**

- Cada repositório novo recebe seu próprio `.github/workflows/ci.yml`, adaptado do workflow único hoje existente (`SDD-002`): o repositório de front-end fica só com o job de lint + build do front-end; o repositório de back-end fica com os jobs de lint + testes + build do back-end. A decisão de runner self-hosted já tomada em `SDD-002` continua valendo — só o workflow é dividido em dois arquivos, um por repositório.

## Critérios de aceite

- [ ] Critério 1 — Existem dois repositórios públicos no GitHub (front-end e back-end), cada um com o código-fonte da sua parte na raiz, e com `projeto-sdd/`, `templates-sdd/`, `CLAUDE.md` e `esteira-desenvolvimento.md` presentes em ambos.
- [ ] Critério 2 — O front-end está publicado na Vercel, acessível por uma URL pública, com deploy automático a cada push na branch principal.
- [ ] Critério 3 — O back-end está publicado na Railway, acessível por uma URL pública, com PostgreSQL gerenciado e as três migrations existentes aplicadas.
- [ ] Critério 4 — O fluxo de login/cadastro via GitHub funciona de ponta a ponta em produção, usando o GitHub OAuth App de produção.
- [ ] Critério 5 — Cadastro e recuperação de senha enviam e-mails reais em produção, via o provedor SMTP configurado.
- [ ] Critério 6 — Cada um dos dois repositórios roda seu próprio CI (lint/testes/build) a cada push/PR contra a branch principal.

## Decisão de arquitetura

**Contexto:** o projeto vinha rodando só em ambiente Docker local (`SDD-001`), com a estratégia de deploy em produção deliberadamente deixada em aberto (`esteira-desenvolvimento.md`, etapa 8: "decidida por SDD própria quando a necessidade surgir"). O provedor de e-mail de produção também tinha sido deixado em aberto pelo mesmo motivo (`SDD-013`, seção "Decisão de arquitetura"). Chegou o momento de decidir os dois: onde o front-end e o back-end rodam em produção, e como o projeto — hoje um único diretório local sem nenhum commit — se torna repositórios publicáveis.

**Decisão:**
- Front-end publicado na **Vercel** — combina naturalmente com Next.js (framework já decidido em `SDD-003`), import direto do repositório GitHub, sem infraestrutura própria a manter.
- Back-end publicado na **Railway**, a partir do `Dockerfile` já existente, com PostgreSQL gerenciado pela própria plataforma.
- O monorepo atual se torna **dois repositórios públicos separados**, cada um com sua própria cópia de `projeto-sdd/`, `templates-sdd/`, `CLAUDE.md` e `esteira-desenvolvimento.md` — a documentação de processo continua valendo para os dois lados, mesmo com o código fisicamente separado.
- Provedor de e-mail de produção: **sugestão desta SDD — um provedor com suporte a SMTP relay (ex.: Resend, Postmark, Mailgun, AWS SES, todos compatíveis)**, já que `SmtpEmailSender` usa MailKit de forma genérica e `SmtpSettings` já aceita usuário/senha e TLS — trocar de Mailpit para qualquer um desses é só configuração, nunca mudança de código. A escolha final entre eles fica a confirmar antes de implementar esta parte especificamente (não muda o comportamento do sistema, só qual conta/credencial é usada).
- Dois GitHub OAuth Apps distintos (um de desenvolvimento local, já existente desde `SDD-023`; um novo, de produção) — as Authorization callback URLs são diferentes (`localhost` vs. domínio real), então não dá para reaproveitar o mesmo App.
- O workflow de CI de `SDD-002` é duplicado e adaptado — um `ci.yml` por repositório nesta separação, cada um só com os jobs da sua parte.

**Alternativas consideradas:**
- **Monorepo único com dois deploys apontando para subpastas** (Vercel/Railway ambos suportam "root directory" configurável) — descartado: o pedido explícito foi por repositórios separados, o que também simplifica permissões e CI por repositório.
- **Back-end também na Vercel (serverless functions)** — descartado: Vercel não é pensado para rodar uma API ASP.NET Core tradicional com processo long-running conectado a Postgres; exigiria reescrever a API como funções serverless, fora de escopo.
- **VPS próprio (ex.: DigitalOcean Droplet) para o back-end** — descartado nesta fase: exigiria mais operação manual (patch de SO, systemd, TLS) sem necessidade real neste estágio do projeto.

**Consequências:**
- Os dois repositórios precisam ser mantidos manualmente em sincronia na parte de documentação (`projeto-sdd/`, `templates-sdd/`, `CLAUDE.md`, `esteira-desenvolvimento.md`) — sem automação de sincronia entre eles, mesmo racional já registrado em `projeto-sdd/README.md` sobre a duplicação de `knowledge/`/`diagramas/`.
- Produção passa a depender de contas externas reais (Vercel, Railway, um GitHub OAuth App de produção, um provedor SMTP real) — pré-requisitos operacionais fora do alcance de automação/teste completo, mesmo racional já registrado em `SDD-023` para o GitHub OAuth App de desenvolvimento.
- Cada repositório precisa de acesso a um runner self-hosted para CI (o mesmo runner de `SDD-002` pode ser registrado nos dois, ou cada repositório ganha o seu — decisão operacional no momento de configurar o CI de cada um).
- Rotação de qualquer secret de produção (chave JWT, secret do GitHub OAuth App, credenciais SMTP) exige atualização manual nos painéis da Vercel e da Railway — sem automação de rotação nesta fase.

## Casos de borda

- Se um dos dois lados (front-end ou back-end) for publicado antes do outro, a variável de ambiente que aponta para o outro lado (`NEXT_PUBLIC_API_URL` ou `Frontend__Url`) fica temporariamente apontando para um endereço que ainda não existe — precisa ser atualizada assim que ambos estiverem no ar.
- Migration nova, criada depois do primeiro deploy de produção: aplicada manualmente contra o banco de produção (não há pipeline de migration automática nesta fase — ver "Fora do escopo").
- Provedor de e-mail escolhido atinge limite de envio (rate limit/quota do plano gratuito, por exemplo): mensagens de cadastro/recuperação de senha passam a falhar silenciosamente do ponto de vista do usuário (mesmo comportamento de falha genérica já decidido em `SDD-013`/`SDD-014`) — sem alerta automático configurado nesta fase.
- **Achado real do primeiro deploy — tipo `citext` "desaparece" para o Npgsql após aplicar a migration:** se `dotnet ef database update` (que cria a extensão `citext` via `CREATE EXTENSION IF NOT EXISTS`) roda contra o banco de produção **depois** do processo do back-end já estar de pé, qualquer requisição que compare um valor contra a coluna `usuarios.email` (citext) falha com `System.NotSupportedException: The data type name 'citext'... could not be found in the types that were loaded by Npgsql` — mesmo com a extensão já existindo no Postgres (confirmável via `SELECT extname FROM pg_extension`). Causa: o Npgsql carrega e cacheia o catálogo de tipos do Postgres uma vez, na inicialização do pool de conexões do processo — se a extensão for criada depois desse cache já montado, o processo em execução nunca fica sabendo. **Correção:** reiniciar o serviço do back-end (`railway restart`) depois de aplicar a migration inicial — não é bug de código, é ordem de operações no primeiro deploy.
- **Achado real do primeiro deploy — Vercel detecta "Other" em vez de "Next.js" quando o projeto é criado via `vercel project add` antes do primeiro deploy:** causa a Vercel servir os arquivos como estáticos genéricos (`Output Directory: public ou .`) em vez de usar o roteamento do Next.js — toda rota além da raiz retorna 404 (`x-vercel-error: NOT_FOUND`), mesmo com o build do `next build` concluído com sucesso nos logs. **Correção:** commitar um `vercel.json` na raiz do diretório de deploy (`frontend/vercel.json`) com `{"framework": "nextjs"}`, forçando o preset — mais robusto que configurar isso só pelo dashboard, porque fica versionado.

## Fora do escopo

- Observabilidade avançada (APM, alertas, dashboards customizados) — usa só os dashboards nativos de Vercel e Railway por enquanto.
- Domínio customizado (ex.: `app.suaempresa.com`) — usa os domínios padrão gerados por Vercel/Railway nesta primeira fase; domínio próprio fica para SDD futura, se a necessidade surgir.
- Rotação automática de secrets.
- Ambiente de staging separado de produção — só um ambiente (produção) nesta fase.
- Pipeline automática de migration de banco via CI/CD — aplicação de migration em produção é manual nesta fase.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-024-deploy-producao-vercel-railway.md` | Sempre |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md`, `knowledge/backend-arquitetura.md`, `knowledge/frontend-arquitetura.md` | Convenções de ambiente, back-end e front-end reaproveitadas do desenvolvimento local |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (sessão interativa via CLI — `gh`, `railway`, `vercel`), 2026-07-15.
- **Notas de conclusão:** Dois repositórios públicos criados via `gh repo create` (crud-login-frontend, crud-login-backend), cada um com `projeto-sdd/`/`templates-sdd/`/`CLAUDE.md`/`esteira-desenvolvimento.md` completos. Front-end publicado na Vercel (projeto `crud-login-frontend`, Root Directory implícito por rodar a partir de `frontend/`) — corrigido um problema real de detecção de framework (ver "Casos de borda"). Back-end publicado na Railway (projeto `crud-login-backend`, serviço `crud-login-backend` com Root Directory `backend`, mais serviço `Postgres` gerenciado) — as 3 migrations existentes aplicadas contra o banco de produção via `dotnet ef database update` rodado localmente contra a connection string pública da Railway; corrigido um problema real de timing do Npgsql/citext (ver "Casos de borda"). Testado de ponta a ponta em produção: cadastro de usuário via UI real (Vercel → Railway → Postgres) concluído com sucesso. **Pendências conhecidas, deploy funcional mas incompleto:** (1) `Smtp__*` e `GithubOAuth__ClientId`/`ClientSecret` configurados com placeholders na Railway — e-mail transacional e login via GitHub não funcionam de verdade em produção até serem substituídos por credenciais reais; (2) conexão GitHub↔Vercel (Login Connection da conta) e deploy automático a cada push ainda não configurados — deploy de produção hoje é manual via CLI; (3) CI (`SDD-002`) não tem runner self-hosted registrado em nenhum dos dois repositórios ainda. Revisão humana pendente.
- **Arquivos alterados:** Criação de `crud-login-frontend/` (repositório completo) e `crud-login-backend/` (repositório completo); `frontend/vercel.json` (novo, força Framework Preset); variáveis de ambiente configuradas na Vercel (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GITHUB_CLIENT_ID`) e na Railway (`ConnectionStrings__DefaultConnection`, `Jwt__*`, `Smtp__*`, `GithubOAuth__*`, `Frontend__Url`).

## Notas

- Provedor de e-mail de produção: sugestão registrada na "Decisão de arquitetura" (qualquer provedor com SMTP relay) — confirmar a escolha final antes de implementar essa parte especificamente. Não afeta código, só configuração.
- Repositórios criados: [`crud-login-frontend`](https://github.com/gabrielrlima/crud-login-frontend) e [`crud-login-backend`](https://github.com/gabrielrlima/crud-login-backend), ambos públicos, via `gh` CLI.
- Esta SDD resolve, de uma vez, duas decisões que vinham deliberadamente em aberto em SDDs anteriores: estratégia de deploy (`esteira-desenvolvimento.md`, etapa 8) e provedor de e-mail de produção (`SDD-013`).

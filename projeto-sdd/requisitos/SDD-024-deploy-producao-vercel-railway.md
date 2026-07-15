# Requisitos — SDD-024 — Deploy em produção (front-end na Vercel, back-end na Railway) e separação em repositórios

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve existir em dois repositórios Git públicos separados no GitHub — um para o front-end, outro para o back-end — cada um com o código daquela parte na raiz do repositório. |
| RF02 | Cada um dos dois repositórios deve conter uma cópia completa de `projeto-sdd/` e `templates-sdd/`, além de `CLAUDE.md` e `esteira-desenvolvimento.md`, para que a documentação de processo permaneça íntegra e utilizável em qualquer um dos dois. |
| RF03 | O front-end deve ser publicado na Vercel, com build e deploy automáticos a cada push na branch principal do repositório de front-end. |
| RF04 | O back-end deve ser publicado na Railway, a partir do `Dockerfile` já existente, com um serviço de PostgreSQL gerenciado pela própria Railway. |
| RF05 | O back-end em produção deve enviar e-mails reais (verificação de cadastro, recuperação de senha) através de um provedor SMTP real, sem exigir alteração de código em `SmtpEmailSender`. |
| RF06 | O login/cadastro via GitHub deve funcionar em produção, usando um GitHub OAuth App próprio de produção (distinto do usado em desenvolvimento local), com Authorization callback URL apontando para o domínio real do front-end. |
| RF07 | As migrations do Entity Framework já existentes devem ser aplicadas ao banco de produção da Railway antes do primeiro uso real do sistema. |
| RF08 | Cada um dos dois repositórios deve ter seu próprio pipeline de CI (lint/testes/build da sua parte), adaptado do workflow único hoje existente no monorepo (`SDD-002`). |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Nenhum valor sensível de produção (chave JWT, secret do GitHub OAuth App de produção, credenciais SMTP, connection string do Postgres) pode estar em arquivo versionado — configurado direto nos painéis da Vercel/Railway. Crítico pelos repositórios serem públicos. |
| RNF02 | Disponibilidade / Dependência externa | O deploy depende de contas e configuração externas (Vercel, Railway, um GitHub OAuth App de produção, um provedor SMTP real) — pré-requisitos operacionais fora do alcance de automação completa, mesmo racional já registrado em `SDD-023` para o GitHub OAuth App de desenvolvimento. |
| RNF03 | Segurança | O back-end em produção só aceita requisições da origem real do front-end (CORS não permissivo/wildcard) — reaproveitando a configuração já existente via `Frontend__Url`, sem necessidade de mudança de código. |
| RNF04 | Observabilidade | Nesta fase, logs e métricas de produção usam só os dashboards nativos de Vercel e Railway — sem infraestrutura de observabilidade adicional. |

## Restrições conhecidas

- Não existe nenhum commit no repositório atual (monorepo local) — os dois repositórios novos começam com histórico de commit próprio, do zero; não há necessidade de dividir/preservar histórico existente.
- A política de CORS do back-end (`Program.cs`) já é configurável via `Frontend__Url` — não precisa de mudança de código para funcionar em produção, só da variável de ambiente correta.
- `SmtpSettings`/`SmtpEmailSender` já suportam usuário/senha e TLS (`UseSsl`) — qualquer provedor SMTP real pode ser usado só trocando configuração, sem alterar código.
- O provedor de e-mail de produção era uma decisão deixada em aberto em `SDD-013` ("provedor de produção... decisão em aberto, quando a estratégia de deploy for definida") — esta SDD é o gatilho para resolver essa decisão.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-024-deploy-producao-vercel-railway.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, já que múltiplos RNFs motivam uma |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md`, `knowledge/backend-arquitetura.md`, `knowledge/frontend-arquitetura.md` | Convenções de ambiente, back-end e front-end reaproveitadas do desenvolvimento local |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

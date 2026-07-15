# Knowledge — Ambiente de desenvolvimento local (Docker)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Toda SDD de backend depende de um ambiente local consistente. Este documento evita que cada spec reexplique como subir o ambiente, e mantém a mesma convenção entre o desenvolvimento local e o pipeline de CI (ver `specs/SDD-001-ambiente-docker-local.md` e `specs/SDD-002-pipeline-cicd-self-hosted.md`).

## Conteúdo

### Subir o ambiente

Comando único: `docker compose up` — sobe o backend e o serviço de banco de dados juntos. Sempre que uma dependência do projeto mudar (ex: pacote novo), reconstruir a imagem com `docker compose build` antes de subir de novo.

### Convenções

- Nome do serviço de backend no `docker-compose.yml`: `backend`.
- Nome do serviço de banco de dados: `postgres` (PostgreSQL — ver `specs/SDD-001-ambiente-docker-local.md` e `knowledge/postgresql.md` para convenções específicas de uso).
- Nome do serviço de e-mail transacional (dev): `mailpit` (imagem `axllent/mailpit` — ver `specs/SDD-013-verificacao-de-email.md`). SMTP (porta 1025) fica só na rede interna do compose, sem publicação no host — o backend fala com `mailpit:1025` pelo nome do serviço; só a UI web é exposta ao host, em porta configurável via `.env` (`MAILPIT_UI_PORT`, default `8025`) para inspecionar visualmente os e-mails "enviados". Backend consome host/porta via configuração `Smtp__Host`/`Smtp__Port` (ver `Features/Email/SmtpEmailSender.cs`).
- Segredos e configuração sensível (connection string, chaves) ficam em `.env`, **nunca versionado**. Um `.env.example` versionado documenta as chaves esperadas, sem valores reais.
- O `Dockerfile` do backend segue a versão de .NET documentada em [`knowledge/csharp.md`](./csharp.md) — atualizar os dois juntos se a versão mudar.
- O mesmo ambiente (mesmo `Dockerfile`/`docker-compose.yml`) é reaproveitado pelo job de CI — evita o cenário "passa local, falha no CI" ou vice-versa.

## Fora do escopo

- Convenções específicas de uso do Postgres (nomenclatura, tipos, chave primária) — ver `knowledge/postgresql.md`.
- Estratégia de deploy em produção — decisão de ADR próprio, ainda não tomada.
- Orquestração além de docker-compose (ex: Kubernetes) — fora de proporção para o estágio atual do projeto.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Ambiente Docker local | `specs/SDD-001-ambiente-docker-local.md` |
| SDD — Pipeline CI/CD self-hosted | `specs/SDD-002-pipeline-cicd-self-hosted.md` |
| SDD-001 — Ambiente de desenvolvimento local | `specs/SDD-001-ambiente-docker-local.md` |
| SDD-002 — CI/CD com runner self-hosted | `specs/SDD-002-pipeline-cicd-self-hosted.md` |
| SDD-001 — Motor de banco de dados | `specs/SDD-001-ambiente-docker-local.md` |
| SDD-013 — Provedor de e-mail transacional | `specs/SDD-013-verificacao-de-email.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- Convenção interna, definida junto com `SDD-001` e `SDD-002` — sem fonte externa específica.

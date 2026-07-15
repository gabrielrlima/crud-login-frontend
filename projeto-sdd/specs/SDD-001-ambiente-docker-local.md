# SDD-001 — Ambiente de desenvolvimento local via Docker

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como desenvolvedor (humano ou agente de IA) trabalhando neste projeto, quero subir o backend e o banco de dados com um único comando, para que eu tenha um ambiente de desenvolvimento consistente sem instalar dependências manualmente.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-001-ambiente-docker-local.md` |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md`, `knowledge/csharp.md`, `knowledge/postgresql.md` |

## Comportamento esperado

**Estrutura de arquivos:** `Dockerfile` na raiz (ou pasta do projeto de backend) + `backend/.dockerignore` (exclui `bin/`, `obj/`, `*.user`, `.vs/`, `.vscode/`, `.idea/`, `.DS_Store` — sem ele o `docker compose build` falha copiando artefato de build do host para dentro da imagem) + `docker-compose.yml` na raiz do repositório + `.env.example` versionado.

**`Dockerfile` do backend:**
- Baseado na imagem oficial do .NET 10 (SDK para build, runtime para execução — multi-stage build).
- Porta HTTP interna do container fixa via `ASPNETCORE_URLS=http://+:8080` (hardcoded no `Dockerfile` e no `docker-compose.yml`, não vem de variável de ambiente). O que é configurável via `.env` é a porta exposta no host (`BACKEND_PORT`, mapeada para a porta interna 8080).

**`docker-compose.yml`:**
- Serviço `backend`: builda a partir do `Dockerfile`, lê variáveis de `.env`, depende do serviço `postgres` com `depends_on: condition: service_healthy` — espera ativa até o Postgres responder a conexões, não apenas até o container iniciar (`depends_on` sem essa condição só garante ordem de start, causando falha intermitente do RNF01).
- Serviço `postgres`: imagem oficial `postgres:18` (ver decisão de arquitetura abaixo), variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` vindas do `.env`, volume nomeado (`postgres_data`) mapeado para `/var/lib/postgresql` (diretório pai — a imagem `postgres:18` falha ao iniciar se montado direto em `.../data`), porta `5432` exposta (configurável via `POSTGRES_PORT`). Healthcheck via `pg_isready` (`interval: 5s`, `timeout: 5s`, `retries: 10`), consumido pelo `depends_on` do serviço `backend`.
- Connection string montada diretamente no `docker-compose.yml` a partir das variáveis do Postgres — `ConnectionStrings__DefaultConnection` concatenando `Host=postgres`, `Port=5432` e `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` do `.env` — não existe uma variável única de connection string no `.env`. Segredos de aplicação, quando existirem, seguem injetados via `.env`, nunca hardcoded no `docker-compose.yml`.

**`.env.example`:** lista todas as chaves esperadas — `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (default `5432`), `BACKEND_PORT` (default `8080`), `ASPNETCORE_ENVIRONMENT` — com valores de exemplo não sensíveis (ex: `changeme`), nunca segredos reais.

**Comando único:** `docker compose up` (a partir da raiz do repositório) sobe backend + banco, prontos para uso, sem passo manual adicional além de copiar `.env.example` para `.env` na primeira vez.

## Critérios de aceite

- [ ] Critério 1 — `docker compose up` sobe o backend e o serviço de banco de dados, prontos para uso, com um único comando.
- [ ] Critério 2 — O `Dockerfile` do backend usa a versão de .NET documentada em `knowledge/csharp.md` (.NET 10).
- [ ] Critério 3 — Variáveis de ambiente sensíveis (connection string, segredos) são configuráveis via `.env`, nunca hardcoded no `docker-compose.yml` versionado.
- [ ] Critério 4 — O ambiente sobe do zero (clone limpo do repositório) sem nenhum passo manual além de `docker compose up`.

## Decisão de arquitetura

### Ambiente de desenvolvimento local via Docker

**Contexto:** o backend do CRUD de login (SDD-004, SDD-005 e as funcionalidades subsequentes) precisa de um ambiente de desenvolvimento consistente — backend + banco de dados — que funcione igual em qualquer máquina, seja de um desenvolvedor humano ou de uma sessão de IA, sem depender de instalação manual de SDK/banco em cada uma. Esta decisão cobre só o ambiente de desenvolvimento **local** — onde o backend roda em produção ainda não foi decidido.

**Decisão:** ambiente de desenvolvimento local via Docker: um `docker-compose.yml` na raiz do repositório sobe o backend (containerizado via `Dockerfile` próprio) e um serviço de banco de dados, permitindo `docker compose up` como único comando para ter o ambiente completo rodando. O motor de banco de dados específico foi decidido na subseção seguinte (PostgreSQL).

**Alternativas consideradas:**
- **Instalação direta na máquina (sem containerização)** — descartada por gerar divergência de ambiente entre desenvolvedores e sessões de IA diferentes ("funciona na minha máquina").
- **Ambiente de desenvolvimento hospedado (ex: GitHub Codespaces, Dev Containers na nuvem)** — descartado nesta fase por adicionar complexidade e custo desnecessários; Docker local é suficiente para o estágio atual do projeto.

**Consequências:** todo desenvolvedor ou sessão de IA precisa ter Docker instalado localmente para rodar o backend. `Dockerfile` do backend e `docker-compose.yml` passam a ser parte do repositório, mantidos junto do código — mesma disciplina do Swagger/OpenAPI (atualiza no mesmo commit que muda a dependência). Estratégia de deploy em produção (containerizado ou não, onde hospedar) permanece em aberto — não decidida aqui. Testes de integração que dependem de banco de dados devem rodar contra o serviço do `docker-compose`, não contra uma instância instalada à parte. O mesmo ambiente é reaproveitado pelo pipeline de CI (`specs/SDD-002-pipeline-cicd-self-hosted.md`), reduzindo divergência entre "passa localmente" e "passa no CI".

### Motor de banco de dados: PostgreSQL

**Contexto:** a decisão de ambiente Docker local deixou o motor de banco de dados deliberadamente em aberto. Todo SDD que persiste dado — a partir de SDD-004 — depende desta escolha, e o `docker-compose.yml` desta SDD precisa de um serviço de banco de dados real, não um placeholder.

**Decisão:** PostgreSQL como motor de banco de dados relacional do projeto — no ambiente de desenvolvimento local (container no `docker-compose.yml`) e, até decisão em contrário, também como direção para produção.

**Alternativas consideradas:**
- **SQL Server** — descartado por licenciamento mais restritivo em produção e menor alinhamento com um ambiente containerizado open-source.
- **MySQL/MariaDB** — descartado: PostgreSQL oferece tipos de dado e constraints (índices funcionais, `citext`) que resolvem diretamente regras já especificadas (ex: unicidade case-insensitive de e-mail em `specs/SDD-004-cadastro-de-usuario.md`) sem lógica extra na aplicação.
- **Banco NoSQL (MongoDB etc.)** — descartado: o domínio (cadastro, autenticação, conta de usuário) é relacional por natureza, sem necessidade de schema flexível.

**Consequências:** driver .NET: Npgsql — base para qualquer ORM ou acesso direto a dado (ORM específico ainda não decidido, ver `knowledge/csharp.md`). Convenções de nomenclatura, tipos e ambiente ficam em `knowledge/postgresql.md` — todo SDD que persiste dado consulta esse documento antes de desenhar uma tabela. O `docker-compose.yml` (desta SDD) passa a usar a imagem oficial `postgres`, com volume nomeado pra persistir dado entre reinícios do container. A regra de unicidade case-insensitive de e-mail (`specs/SDD-004-cadastro-de-usuario.md`, `specs/SDD-005-login.md`) ganha um caminho de implementação concreto em Postgres — detalhado em `knowledge/postgresql.md`.

## Casos de borda

- Repositório clonado pela primeira vez, sem `.env` ainda criado — o comando deve falhar com mensagem clara indicando que `.env` precisa existir (copiado de `.env.example`), não com erro genérico de variável ausente. Mecanismo: cada variável obrigatória no `docker-compose.yml` usa a sintaxe `${VAR:?mensagem}` do Docker Compose (ex: `${POSTGRES_USER:?defina POSTGRES_USER no .env (copie .env.example para .env)}`), que interrompe o `docker compose up` com essa mensagem literal em vez de um erro genérico.
- Porta já em uso na máquina local — documentar no `.env.example` como alterar a porta exposta: `BACKEND_PORT` (default `8080`) e `POSTGRES_PORT` (default `5432`) controlam a porta do host mapeada para o container; a porta interna do container (`8080` para o backend) permanece fixa e não é configurável.
- Mudança de dependência do projeto (novo pacote) sem rebuild da imagem — documentar que `docker compose build` é necessário nesse caso.
- Reinício do container (`docker compose restart`, ou `down`/`up` sem `-v`) não deve apagar dado já persistido no Postgres — validar o volume nomeado.

## Fora do escopo

Escolha de ORM/ferramenta de acesso a dado. Estratégia de deploy em produção. Orquestração além de docker-compose (Kubernetes ou similar).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-001-ambiente-docker-local.md` | Sempre |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md`, `knowledge/csharp.md`, `knowledge/postgresql.md` | Convenção de ambiente, versão de linguagem e banco de dados |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** `Dockerfile` (multi-stage .NET 10) + `docker-compose.yml` (backend + postgres:18) + `.env.example` criados e validados de ponta a ponta: `docker compose build`, `docker compose up -d`, cadastro/login reais via HTTP contra o backend containerizado, e persistência confirmada após `down`/`up` sem `-v`. **Achado real, não suposição:** a imagem `postgres:18` mudou a convenção de volume — não aceita mais montar direto em `/var/lib/postgresql/data`, exige o diretório pai `/var/lib/postgresql`. Corrigido no `docker-compose.yml` e em `knowledge/postgresql.md`. Variáveis obrigatórias usam `${VAR:?mensagem}` no compose — `.env` ausente falha com mensagem clara, não erro genérico (RNF01). Portas de Postgres e backend configuráveis via `.env` (`POSTGRES_PORT`, `BACKEND_PORT`). Adicionado `backend/.dockerignore` (não pedido explicitamente, mas necessário — sem ele o build falhava copiando `bin/obj` do host) e healthcheck do Postgres com `depends_on: condition: service_healthy` (resolve RNF01 na prática). Revisão humana e merge ainda pendentes.
- **Arquivos alterados:** `backend/Dockerfile`, `backend/.dockerignore`, `docker-compose.yml`, `.env.example`.

## Notas

- SDD fundacional: recomenda-se implementar antes ou junto de SDD-004/SDD-005, já que ambas dependem de um backend rodando para serem testadas de ponta a ponta.

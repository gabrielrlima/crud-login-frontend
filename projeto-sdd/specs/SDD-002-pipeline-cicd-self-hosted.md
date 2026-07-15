# SDD-002 — Pipeline de CI/CD com runner self-hosted

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como time, quero que lint, testes e build rodem automaticamente a cada push num runner próprio, para que a esteira tenha um gate de qualidade automatizado sem depender de infraestrutura de terceiro.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-002-pipeline-cicd-self-hosted.md` |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md` |

## Comportamento esperado

**Gatilho:** o workflow de CI (`.github/workflows/ci.yml`, `name: CI`) dispara em todo push e em toda PR aberta contra a branch `main`.

**Execução:** cada job do workflow aponta explicitamente `runs-on: [self-hosted]`, não o runner hospedado pelo provedor. O checkout do repositório usa `actions/checkout@v4` e o shell padrão dos steps é `bash` (`defaults.run.shell: bash`).

**Jobs (três jobs distintos do GitHub Actions — `lint`, `testes`, `build` — encadeados via `needs:`, cada um bloqueante e cada um com seu próprio `runs-on: [self-hosted]`, não steps de um job único):**

1. **`lint`** — roda `dotnet format --verify-no-changes` (backend, dentro do container — ver "Ambiente do backend" abaixo) e, em `frontend` (`working-directory: frontend`), `pnpm install --frozen-lockfile` seguido de `pnpm lint`.
2. **`testes`** (`needs: lint`) — roda `dotnet test backend.Tests/Backend.Tests.csproj`, dentro do mesmo container do backend. Cobre só o backend: o front-end tem um script `"test": "vitest run"` em `frontend/package.json`, mas este pipeline não o executa — testes automatizados de frontend ficam fora do escopo desta SDD (ver "Fora do escopo").
3. **`build`** (`needs: testes`) — roda `dotnet build` (backend, no container) e, em `frontend`, `pnpm build` (direto no runner, sem container).

**Ambiente do backend (steps de lint/testes/build que tocam backend):** os comandos `dotnet` não rodam direto no runner — rodam dentro da mesma imagem de SDK usada em `specs/SDD-001-ambiente-docker-local.md`. O workflow descobre a tag dessa imagem dinamicamente, extraindo-a do próprio `backend/Dockerfile`: `SDK_IMAGE=$(grep -m1 '^FROM .* AS build' backend/Dockerfile | awk '{print $2}')` — isso pressupõe que o estágio de build do Dockerfile continue nomeado literalmente `build`. Com a tag em mãos, o step roda os comandos via `docker run`, montando o workspace (`-v "${{ github.workspace }}":/src`) e o cache do NuGet do runner (`-v "$HOME/.nuget/packages":/root/.nuget/packages`) como volumes, com `/src` como diretório de trabalho. Assim, se a versão do SDK mudar no Dockerfile, o CI acompanha automaticamente, sem duplicar a versão em dois lugares.

**Ambiente do front-end (steps de lint/build que tocam frontend):** roda direto no runner (`working-directory: frontend`), sem container — diferente do backend, exige Node.js/pnpm pré-instalados na máquina do runner self-hosted. Essa assimetria é aceita nesta fase; containerizar o front-end é possível trabalho futuro, fora do escopo desta SDD (ver "Fora do escopo").

**Resultado:** falha em qualquer job marca o check da PR como falho e bloqueia o merge — `testes` só roda se `lint` passar, e `build` só roda se `testes` passar.

**Runner:** registrado e mantido pelo próprio time — configuração/registro do runner (máquina, serviço, atualização) é passo de infraestrutura documentado na implementação, não repetido aqui além do necessário para reprodutibilidade.

## Critérios de aceite

- [ ] Critério 1 — O pipeline de CI dispara automaticamente a cada push, executando lint (backend e frontend), testes (backend) e build (backend e frontend), em três jobs (`lint`, `testes`, `build`) encadeados via `needs:`.
- [ ] Critério 2 — O pipeline executa em runner self-hosted (`runs-on: [self-hosted]` em cada job), não no runner hospedado pelo provedor de CI.
- [ ] Critério 3 — Os steps de backend (lint, testes, build) reaproveitam o mesmo ambiente Docker de `specs/SDD-001-ambiente-docker-local.md`, via `docker run` na imagem do SDK extraída do `backend/Dockerfile`, evitando divergência entre "passa localmente" e "passa no CI" nessa parte; os steps de front-end (lint, build) rodam direto no runner, sem container.
- [ ] Critério 4 — Falha em qualquer job (lint, testes, build) bloqueia a PR.

## Decisão de arquitetura

**Contexto:** o projeto precisa de CI (lint, testes, build) e, futuramente, CD. Faltava decidir onde o pipeline efetivamente executa — runner hospedado pelo provedor de CI (ex: GitHub-hosted) ou runner próprio.

**Decisão:** o pipeline de CI/CD roda em runner self-hosted/local, dentro da infraestrutura própria do time, em vez do runner hospedado pelo provedor de CI. O serviço de CI/orquestração (ex: GitHub Actions) continua sendo usado normalmente — muda só onde o job efetivamente executa.

**Alternativas consideradas:**
- **Runner hospedado pelo provedor (cloud)** — descartado nesta fase em favor de manter a execução da esteira dentro da infraestrutura própria do time.

**Consequências:**
- O time é responsável por provisionar, manter e atualizar a máquina/runner (sistema operacional, dependências, Docker — ver `specs/SDD-001-ambiente-docker-local.md`, já que os jobs reaproveitam esse ambiente).
- Sem o runner online, o pipeline de CI/CD não executa — disponibilidade do runner vira responsabilidade operacional do time, não do provedor de CI.
- Os jobs de CI que tocam backend reaproveitam o mesmo ambiente Docker do desenvolvimento local (`specs/SDD-001-ambiente-docker-local.md`), reduzindo divergência entre "passa localmente" e "passa no CI" nessa parte; os steps de front-end rodam direto no runner, sem container.
- Estratégia de CD (onde o deploy final acontece) permanece em aberto — esta decisão cobre só onde o pipeline executa, não o destino do deploy.

## Casos de borda

- Runner offline no momento do push — o pipeline fica pendente/não executa; PR não pode ser mergeada até o runner voltar (consequência já registrada na seção "Decisão de arquitetura" acima).
- Job de CI (steps de backend) precisa da mesma versão de dependências do ambiente local — reaproveita o `Dockerfile`/`docker-compose.yml` de SDD-001 em vez de reinstalar dependências direto na máquina do runner.
- O `backend/Dockerfile` precisa manter o estágio de build nomeado literalmente `build` (`FROM ... AS build`) — o workflow extrai a tag da imagem do SDK a partir dessa linha via `grep`/`awk`; renomear o estágio sem atualizar o workflow quebra a descoberta da imagem.

## Fora do escopo

PR automática, Review & Merge e CD/Deploy — cobertas por SDDs futuras, se/quando o time decidir avançar essas etapas. Testes automatizados de front-end (`frontend/package.json` já define `"test": "vitest run"`, mas nenhum job deste workflow o executa) e containerização do front-end (lint e build de frontend rodam direto no runner, sem Docker) também ficam fora do escopo desta SDD, se/quando o time decidir avançar essas etapas.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-002-pipeline-cicd-self-hosted.md` | Sempre |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md` | O job de CI reaproveita o ambiente Docker documentado ali |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** `.github/workflows/ci.yml` criado com 3 jobs sequenciais (lint → testes → build, cada um bloqueante via `needs:`), todos em `runs-on: [self-hosted]`. RNF02 (mesmo ambiente do dev local) resolvido extraindo a tag da imagem SDK direto do `backend/Dockerfile` e rodando os comandos `dotnet` dentro dela via `docker run` — se a versão do SDK mudar no Dockerfile, o CI acompanha automaticamente, sem duplicar a versão em dois lugares. Front-end (`pnpm lint`/`pnpm build`) roda direto no runner, sem container (Next.js não é containerizado nesta fase, ver SDD-003). YAML validado sintaticamente. **Passo que este arquivo não resolve sozinho:** o runner self-hosted precisa ser registrado manualmente na infraestrutura do time — documentado em comentário no topo do workflow e em `.github/README.md`. Revisão humana ainda pendente.
- **Arquivos alterados:** `.github/workflows/ci.yml`, `.github/README.md`.

## Notas

- Depende de SDD-001 estar implementada (o job de CI reaproveita o Dockerfile/compose de lá).
- Qualquer referência de documentação em `.github/workflows/ci.yml` e `.github/README.md` (comentários de cabeçalho, links) deve apontar só para este documento (`projeto-sdd/specs/SDD-002-pipeline-cicd-self-hosted.md`) — identificadores do modelo de documentação anterior a este projeto não existem mais no repositório e não devem ser referenciados.

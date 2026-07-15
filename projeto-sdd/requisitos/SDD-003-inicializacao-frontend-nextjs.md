# Requisitos — SDD-003 — Inicialização do projeto front-end (Next.js + shadcn/ui)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve ter um projeto Next.js (App Router) inicializado no repositório. |
| RF02 | O sistema deve ter o shadcn/ui inicializado e configurado (`components.json`). |
| RF03 | O sistema deve ter React Hook Form, Zod e `@hookform/resolvers` instalados como dependências. |
| RF04 | O sistema deve ter TanStack Query e Zustand instalados como dependências, para gestão de estado de servidor e de cliente conforme `knowledge/frontend-arquitetura.md`. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Consistência | A estrutura de pastas do projeto deve seguir a convenção por feature documentada em `knowledge/frontend-arquitetura.md`. |
| RNF02 | Manutenibilidade | A versão do Next.js e demais dependências devem ficar fixadas via lockfile versionado no repositório (`pnpm-lock.yaml`). |

## Restrições conhecidas

- Não inclui containerização do front-end — roda nativo nesta fase (ver decisão de arquitetura em `specs/SDD-003-inicializacao-frontend-nextjs.md`).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-003-inicializacao-frontend-nextjs.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura de framework front-end |
| Conhecimento relacionado | `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de estrutura e instalação |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

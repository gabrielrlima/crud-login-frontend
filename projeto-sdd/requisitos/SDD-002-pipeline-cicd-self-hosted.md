# Requisitos — SDD-002 — Pipeline de CI/CD com runner self-hosted

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve disparar o pipeline de CI (lint, testes, build) automaticamente a cada push. |
| RF02 | O sistema deve bloquear a PR quando qualquer etapa do pipeline falhar. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Infraestrutura | O pipeline deve executar em runner self-hosted, não no runner hospedado pelo provedor de CI. |
| RNF02 | Consistência | O job de CI deve reaproveitar o mesmo ambiente Docker do desenvolvimento local (`SDD-001`), evitando divergência entre "passa localmente" e "passa no CI". |
| RNF03 | Disponibilidade operacional | A disponibilidade do runner é responsabilidade do time — sem o runner online, o pipeline não executa. |

## Restrições conhecidas

- Cobre só a etapa de CI (lint/testes/build) — PR automática, review/merge e CD/deploy ficam fora desta SDD.
- Depende de `specs/SDD-001-ambiente-docker-local.md` já implementada.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-002-pipeline-cicd-self-hosted.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md` | Ambiente reaproveitado pelo job de CI |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

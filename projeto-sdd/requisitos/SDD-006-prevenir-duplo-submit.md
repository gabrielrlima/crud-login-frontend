# Requisitos — SDD-006 — Prevenir duplo submit nos formulários de cadastro e login

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve desabilitar o controle de envio assim que a requisição é disparada. |
| RF02 | O sistema deve ignorar cliques ou teclas Enter repetidos enquanto uma requisição do mesmo formulário está em andamento. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Usabilidade | A guarda contra duplo submit deve ser aplicada de forma idêntica em cadastro e login, sem exceção. |

## Restrições conhecidas

- Não cobre idempotência do lado do servidor — só a guarda de interface (ver "Fora do escopo" do SDD).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-006-prevenir-duplo-submit.md` | A spec deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de estado de formulário durante envio |

> Todo RF e RNF listado aqui precisa aparecer refletido na spec — se um requisito não vira comportamento especificado, ele não será implementado.

# Requisitos — SDD-012 — Interação de logout na UI

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve expor um controle de logout visível em toda tela autenticada. |
| RF02 | O sistema deve descartar o token local e redirecionar para a tela de login ao logout, sem exigir recarregamento manual. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Usabilidade | A conclusão do logout deve ser confirmada visualmente ao usuário. |

## Restrições conhecidas

- Sem logout automático por inatividade nesta fase.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-012-interacao-de-logout.md` | A spec deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de feedback de ação concluída |

> Todo RF e RNF listado aqui precisa aparecer refletido na spec — se um requisito não vira comportamento especificado, ele não será implementado.

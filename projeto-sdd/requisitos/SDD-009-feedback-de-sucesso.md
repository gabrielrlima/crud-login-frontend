# Requisitos — SDD-009 — Feedback de sucesso e navegação pós-cadastro e pós-login

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve exibir confirmação visual ao concluir o cadastro com sucesso, antes de redirecionar. |
| RF02 | O sistema deve redirecionar para uma rota definida após cadastro bem-sucedido e após login bem-sucedido. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Consistência | O comportamento de feedback e redirecionamento deve ser testável explicitamente, não implícito na implementação. |

## Restrições conhecidas

- Nenhum onboarding/tour guiado nesta fase — só confirmação e redirecionamento básico.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-009-feedback-de-sucesso.md` | A spec deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de feedback de sucesso |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

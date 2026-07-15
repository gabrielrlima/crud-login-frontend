# Requisitos — SDD-008 — Estado de carregamento (loading) dos formulários de cadastro e login

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve exibir indicador de carregamento entre o envio do formulário e a resposta do servidor. |
| RF02 | O sistema deve desabilitar os campos de entrada durante o carregamento. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Usabilidade | O estado de carregamento deve reverter corretamente tanto em caso de sucesso quanto de erro, sem deixar o formulário travado. |

## Restrições conhecidas

- Feedback de progresso é binário (carregando / não carregando) nesta fase, sem indicador granular.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-008-estado-de-loading.md` | A spec deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de estado de carregamento |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

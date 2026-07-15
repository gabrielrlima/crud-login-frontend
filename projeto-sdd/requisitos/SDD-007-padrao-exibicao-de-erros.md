# Requisitos — SDD-007 — Padrão de exibição de erros de formulário (inline vs. genérico)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve exibir erros de validação de campo inline, abaixo do campo correspondente. |
| RF02 | O sistema deve exibir a mensagem de credenciais inválidas do login como mensagem genérica, não associada a um campo específico. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Acessibilidade | Toda mensagem de erro inline deve ser associada ao campo via `aria-describedby`, perceptível por leitor de tela. |
| RNF02 | Consistência | O momento de disparo da validação client-side deve ser único e documentado, igual entre cadastro e login. |

## Restrições conhecidas

- Mensagens de erro em um único idioma nesta fase (sem internacionalização).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-007-padrao-exibicao-de-erros.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de exibição de erro e acessibilidade |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

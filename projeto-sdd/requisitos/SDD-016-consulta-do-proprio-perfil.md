# Requisitos — SDD-016 — Consulta do próprio perfil (GET /me)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve expor um endpoint autenticado que retorna os dados do próprio usuário (nome, e-mail, data de cadastro). |
| RF02 | O sistema deve retornar 401 quando o token estiver ausente, expirado ou malformado. |
| RF03 | O sistema não deve retornar hash de senha nem qualquer outro dado sensível na resposta. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | A rota exige autenticação válida, sem exceção — mesma regra de SDD-005. |

## Restrições conhecidas

- Endpoint estritamente de "meus próprios dados" — sem consulta de outros usuários.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-016-consulta-do-proprio-perfil.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de back-end e componentes de exibição |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

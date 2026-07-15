# Requisitos — SDD-017 — Atualização de dados de perfil (nome e e-mail)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve permitir que o usuário autenticado atualize seu nome e e-mail. |
| RF02 | O sistema deve validar unicidade de e-mail (case-insensitive) ao trocar, reaplicando a regra de RF02/SDD-004. |
| RF03 | O sistema deve aplicar ao nome as mesmas regras de trim/validação usadas no cadastro. |
| RF04 | O sistema deve definir explicitamente se a troca de e-mail exige reverificação antes de considerar o novo e-mail confirmado. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | O efeito da troca de e-mail sobre o token JWT ativo (invalidar ou manter) deve ser definido e documentado — não implícito. |

## Restrições conhecidas

- Depende de `specs/SDD-016-consulta-do-proprio-perfil.md` (fonte dos dados atuais) e, se RF04 exigir reverificação, de `specs/SDD-013-verificacao-de-email.md`.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-017-atualizacao-de-perfil.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de back-end e formulário de edição |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

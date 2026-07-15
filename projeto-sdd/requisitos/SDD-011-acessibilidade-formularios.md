# Requisitos — SDD-011 — Acessibilidade dos formulários de cadastro e login

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve associar mensagens de erro de validação ao campo correspondente via `aria-describedby`/`aria-invalid`. |
| RF02 | O sistema deve mover o foco para o primeiro campo inválido após um envio malsucedido. |
| RF03 | O sistema deve anunciar erros assíncronos (banner inline) a leitores de tela via `aria-live`. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Acessibilidade | A ordem de tab deve permanecer lógica após a adaptação do block de login com campo extra de nome. |

## Restrições conhecidas

- Escopo restrito aos dois formulários desta SDD — não é auditoria de acessibilidade completa da aplicação.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-011-acessibilidade-formularios.md` | A spec deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-shadcn-ui.md` | Radix/shadcn cobrem parte da acessibilidade nativa |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

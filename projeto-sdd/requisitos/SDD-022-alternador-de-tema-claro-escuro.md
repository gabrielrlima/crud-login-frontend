# Requisitos — SDD-022 — Alternador de tema claro/escuro (dark mode)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve oferecer um controle de alternância entre tema claro e escuro, visível em todas as telas. |
| RF02 | O sistema deve persistir a preferência de tema escolhida localmente (ex: `localStorage`) e restaurá-la em acessos futuros. |
| RF03 | Na ausência de preferência salva, o sistema deve respeitar `prefers-color-scheme` do sistema operacional como tema inicial. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Acessibilidade | Os dois temas devem manter contraste de leitura adequado, reaproveitando as variáveis `.dark` já calibradas em `globals.css`. Como o controle de alternância é só ícone, sem texto visível, ele deve ter nomeação acessível via `aria-label` para leitores de tela. |

## Restrições conhecidas

- Preferência de tema é dado de UI local (navegador), não de conta — não sincroniza entre dispositivos nem passa pelo back-end.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-022-alternador-de-tema-claro-escuro.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md` | Variáveis de tema já definidas no setup do shadcn |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

# Requisitos — SDD-020 — Trocar fonte do projeto para DM Sans

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve carregar a fonte DM Sans via `next/font/google` e aplicá-la como fonte sans-serif padrão de toda a aplicação. |
| RF02 | A variável CSS que expõe a fonte ao Tailwind (`--font-sans`) deve resolver corretamente para a fonte carregada, sem cair no fallback serifado padrão do navegador. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|
| RNF01 | Performance | A fonte deve carregar com estratégia que evite bloqueio de renderização perceptível (`font-display: swap` ou equivalente do `next/font`, subsetting `latin`). |

## Restrições conhecidas

- Fonte monoespaçada (Geist Mono) não faz parte deste pedido — permanece inalterada.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-020-fonte-dm-sans.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md` | Configuração de tema/tipografia do shadcn |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

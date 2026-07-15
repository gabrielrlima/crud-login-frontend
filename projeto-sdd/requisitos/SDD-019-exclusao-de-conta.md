# Requisitos — SDD-019 — Exclusão da própria conta

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve permitir a exclusão da própria conta mediante autenticação válida. |
| RF02 | O sistema deve aplicar hard-delete (ver "Decisão de arquitetura" em `specs/SDD-019-exclusao-de-conta.md`) de forma consistente a todos os dados do usuário. |
| RF03 | O sistema deve definir e implementar o efeito sobre o token JWT ativo no momento da exclusão. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|
| RNF01 | Compliance / LGPD | Hard-delete imediato — sem prazo de retenção nesta decisão (ver "Decisão de arquitetura" em `specs/SDD-019-exclusao-de-conta.md`: revisão formal de Compliance/Jurídico exigida antes de produção real). |
| RNF02 | Segurança | A exclusão exige confirmação explícita do usuário, evitando exclusão acidental. |

## Restrições conhecidas

- Só autoexclusão pelo próprio usuário — sem exclusão administrativa ou em lote.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-019-exclusao-de-conta.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura que resolve RNF01/RNF02 |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/boas-praticas-arquitetura.md` | Convenções de back-end e decisão de ciclo de vida de dados |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

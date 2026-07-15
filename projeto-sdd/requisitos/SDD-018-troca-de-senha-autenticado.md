# Requisitos — SDD-018 — Troca de senha do usuário autenticado

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve exigir a senha atual correta antes de aceitar a definição de uma nova senha. |
| RF02 | O sistema deve reaplicar os critérios de força de senha de RNF02/SDD-004 à nova senha. |
| RF03 | O sistema deve gerar novo hash bcrypt (fator de custo 12) para a nova senha (RNF01/SDD-004). |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | O efeito da troca de senha sobre tokens JWT já emitidos deve ser definido e documentado — mesma decisão usada em SDD-014/SDD-017. |

## Restrições conhecidas

- Distinta de `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` — aqui o usuário já tem sessão válida.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-018-troca-de-senha-autenticado.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de back-end e formulário |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

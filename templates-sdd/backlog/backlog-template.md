# Backlog de SDDs

> Lista viva de funcionalidades (SDDs) do projeto, organizada por status — sem ciclos de tempo fixos. Adicione uma linha aqui ao criar um SDD novo; mova a linha de seção conforme o status muda. Copie este arquivo uma vez para `backlog.md` na raiz do projeto que for usar este modelo — depois só edite `backlog.md`, não recopie o template.

## A fazer

| SDD | Título |
|---|---|
| `SDD-XXX` | ... |

## Em andamento

| SDD | Título |
|---|---|
| `SDD-XXX` | ... |

## Em revisão

| SDD | Título |
|---|---|
| `SDD-XXX` | ... |

## Concluído

| SDD | Título | Concluído em |
|---|---|---|
| `SDD-XXX` | ... | AAAA-MM-DD |

---

## Critério para mover de "A fazer" para "Em andamento"

- [ ] O SDD tem critérios de aceite testáveis.
- [ ] Os requisitos (F/NF) relacionados já existem em `requisitos/`.

## Critério para mover de "Em andamento" para "Em revisão"

- [ ] Implementado e verificado (build/testes passando) — pendente só de revisão humana/PR.

## Critério para mover para "Concluído"

- [ ] Revisado e integrado (PR aprovado e mesclado).
- [ ] "Registro de execução" do SDD preenchido.
- [ ] Se a implementação divergiu do SDD original, o próprio SDD foi atualizado para refletir o que foi de fato construído — SDD desatualizado bloqueia o fechamento.

# Modelo SDD

> Modelo de organização da esteira baseado em Spec Driven Development: um documento único por funcionalidade (o SDD) reúne necessidade do usuário, requisitos, comportamento esperado, critérios de aceite e — quando existir — a decisão de arquitetura envolvida. Andamento é rastreado por status num backlog simples, sem ciclos de tempo fixos.

## Estrutura de pastas deste modelo

Cada pasta abaixo tem seu próprio `README.md` — o índice daquela pasta especificamente (o que entra, o que não entra, convenção de nome, como usar). Este arquivo aqui é só o mapa geral; para o detalhe de cada tipo de documento, entre na pasta correspondente.

```
requisitos/
  README.md              # índice desta pasta
  requisitos-template.md # RF/RNF por SDD
specs/
  README.md              # índice desta pasta
  spec-template.md       # documento central: necessidade + comportamento esperado +
                          # decisão de arquitetura (quando houver) + critérios de aceite
knowledge/
  README.md              # índice desta pasta
  knowledge-template.md  # conhecimento durável e transversal
diagramas/
  README.md              # índice desta pasta (convenções de SVG, sem template fixo)
backlog/
  README.md              # índice desta pasta
  backlog-template.md    # lista viva de SDDs por status
```

## Por onde começar

1. [`requisitos/README.md`](./requisitos/README.md) — requisitos funcionais/não funcionais de uma funcionalidade nova.
2. [`specs/README.md`](./specs/README.md) — o documento central deste modelo (o SDD em si).
3. [`knowledge/README.md`](./knowledge/README.md) — conhecimento durável, consulte antes de escrever um SDD.
4. [`diagramas/README.md`](./diagramas/README.md) — convenções de fluxograma SVG, se o SDD precisar de um.
5. [`backlog/README.md`](./backlog/README.md) — como rastrear andamento por status.

## Exemplo aplicado

Ver [`../projeto-sdd/`](../projeto-sdd/) — este modelo já aplicado a um projeto real (CRUD de login, autenticação por e-mail/senha e GitHub OAuth, recuperação de senha, gestão de perfil e conta), com todos os SDDs, requisitos, conhecimento e diagramas populados. Bom ponto de partida pra ver o nível de detalhe esperado antes de escrever um SDD do zero.

## Regra crítica

Nenhuma implementação acontece sem um SDD correspondente em `specs/`, e todo RF/RNF de `requisitos/` precisa aparecer refletido no SDD.

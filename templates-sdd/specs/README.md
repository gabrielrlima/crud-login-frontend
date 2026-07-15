# Specs (SDD) — índice

O documento central deste modelo. Um SDD por funcionalidade — necessidade do usuário, requisitos, comportamento esperado, critérios de aceite e (quando existir) decisão de arquitetura, tudo em um só lugar. A implementação parte daqui, nunca de instrução solta no chat.

## O que entra aqui

- Necessidade do usuário ("Como/quero/para que").
- Comportamento esperado — a fonte da verdade, detalhada o bastante pra implementar direto a partir dela.
- Critérios de aceite testáveis.
- Decisão de arquitetura, **só quando existir uma** — contexto, decisão, alternativas consideradas, consequências. Sem decisão de arquitetura relevante, a seção simplesmente não aparece no documento.
- Casos de borda e o que fica fora do escopo.

## O que NÃO entra aqui

- RF/RNF em forma de lista/tabela → isso é `requisitos/` (o SDD referencia, não duplica).
- Conhecimento reutilizado por mais de uma funcionalidade → isso é `knowledge/`.
- Desenho do fluxo → isso é `diagramas/`, referenciado a partir da seção "Baseado em".

## Convenção de nome

`specs/SDD-ID-nome-curto.md`.

## Como usar

1. Confirme que os requisitos (`requisitos/SDD-ID-nome.md`) já existem antes de começar.
2. Copie [`spec-template.md`](./spec-template.md).
3. Preencha "Decisão de arquitetura" só se a funcionalidade genuinamente envolver escolha de arquitetura, nova dependência externa ou trade-off relevante — a maioria dos SDDs não precisa dessa seção.
4. Nenhuma implementação começa sem um SDD com critérios de aceite claros.
5. Se a implementação divergir do que foi especificado, atualize o próprio SDD — não deixe o documento desatualizado.

## Documentos existentes

| Documento | Status |
|---|---|
| _(nenhum ainda — este é o modelo, não o projeto real)_ | |

---

*Ver [`../../projeto-sdd/specs/`](../../projeto-sdd/specs/) para exemplos reais de nível de detalhe.*

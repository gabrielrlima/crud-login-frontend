# Knowledge — índice

Conhecimento durável e transversal que vários SDDs compartilham — pra não repetir a mesma explicação de domínio em três SDDs diferentes.

## O que entra aqui

- Regras de negócio e domínio que atravessam múltiplos SDDs.
- Glossário de termos do domínio.
- Contratos e particularidades de integrações externas.
- Convenções técnicas do projeto que não mudam de funcionalidade para funcionalidade.

## O que NÃO entra aqui

- Comportamento específico de um SDD → isso é `specs/SDD-ID-nome.md`.
- Decisão de arquitetura pontual de uma funcionalidade → isso é a seção "Decisão de arquitetura" dentro do próprio SDD.
- Requisito funcional/não funcional de um SDD → isso é `requisitos/SDD-ID-nome.md`.

## Convenção de nome

`knowledge/tema-nome-curto.md`.

## Como usar

1. Antes de escrever um SDD, verifique se já existe conhecimento documentado aqui sobre o domínio.
2. Copie [`knowledge-template.md`](./knowledge-template.md) ao documentar um conhecimento novo.
3. Se nada referencia um documento de `knowledge/`, ele provavelmente não devia existir aqui (ou devia estar dentro de um SDD específico).

## Documentos existentes

| Documento | Tema |
|---|---|
| _(nenhum ainda — este é o modelo, não o projeto real)_ | |

---

*Ver [`../../projeto-sdd/knowledge/`](../../projeto-sdd/knowledge/) para exemplos reais.*

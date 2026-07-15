# Requisitos — índice

Requisitos funcionais (RF) e não funcionais (RNF) de cada SDD, um arquivo por funcionalidade.

## O que entra aqui

- Requisitos funcionais — o que o sistema deve fazer.
- Requisitos não funcionais — performance, segurança, disponibilidade, observabilidade, escalabilidade.
- Restrições conhecidas — técnicas, de prazo ou de dependência externa.

## O que NÃO entra aqui

- Comportamento detalhado de como o requisito é atendido → isso é `specs/SDD-ID-nome.md`.
- Conhecimento de domínio reutilizado por mais de uma funcionalidade → isso é `knowledge/`.

## Convenção de nome

`requisitos/SDD-ID-nome-curto.md` — mesmo ID e nome curto do SDD correspondente em `specs/`.

## Como usar

1. Copie [`requisitos-template.md`](./requisitos-template.md) ao começar uma funcionalidade nova.
2. Preencha RF/RNF antes de escrever o SDD — os requisitos são o insumo, o SDD é quem os transforma em comportamento especificado.
3. Todo RF/RNF listado aqui precisa aparecer refletido no SDD correspondente — requisito que não vira comportamento especificado não será implementado.

## Documentos existentes

| Documento | SDD relacionado |
|---|---|
| _(nenhum ainda — este é o modelo, não o projeto real)_ | |

---

*Ver [`../../projeto-sdd/requisitos/`](../../projeto-sdd/requisitos/) para exemplos reais.*

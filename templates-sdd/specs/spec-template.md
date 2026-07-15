# SDD-ID — Título curto da funcionalidade

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** A fazer / Em andamento / Em revisão / Concluído

## Necessidade

> Como `<perfil>`, quero `<ação>` para que `<benefício>`.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-ID-nome.md` |
| Conhecimento relacionado | `knowledge/tema-nome.md` |
| Diagrama (se houver) | `diagramas/nome-do-fluxo.svg` |

## Comportamento esperado

Descrição objetiva do que o sistema deve fazer. Esta seção é a fonte da verdade de comportamento — detalhada o bastante para implementar direto a partir dela, sem precisar voltar pro chat pra perguntar "e nesse caso, o que acontece?".

## Critérios de aceite

- [ ] Critério 1 — testável e objetivo
- [ ] Critério 2
- [ ] Critério 3

## Decisão de arquitetura

> Preencha esta seção **só se** a funcionalidade envolver escolha de arquitetura, nova dependência externa ou um trade-off relevante — nem todo SDD precisa disso (a maioria não precisa). Se não houver decisão de arquitetura aqui, apague a seção inteira em vez de deixá-la vazia — uma seção vazia é sinal de que alguém esqueceu de preencher, não de que a decisão não existe.

**Contexto:** o que motivou essa decisão precisar ser tomada.

**Decisão:** o que foi escolhido, de forma direta.

**Alternativas consideradas:**
- **Alternativa 1** — por que foi descartada
- **Alternativa 2** — por que foi descartada

**Consequências:** o que passa a ser verdade a partir daqui (trade-offs assumidos, o que fica mais fácil, o que fica mais difícil).

## Casos de borda

- Cenário fora do caminho feliz e o comportamento esperado para ele.

## Fora do escopo

O que este SDD explicitamente não cobre (evita ambiguidade com outros SDDs).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-ID-nome.md` | Sempre |
| Conhecimento relacionado | `knowledge/tema-nome.md` | Se depender de conhecimento de domínio já documentado |
| Diagrama | `diagramas/nome-do-fluxo.svg` | Se o fluxo tiver um desenho próprio |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:**
- **Notas de conclusão:**
- **Arquivos alterados:**

## Notas

- Se este SDD ainda não tem critérios de aceite claros, ele não está pronto para ser implementado.

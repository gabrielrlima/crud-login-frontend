# SDD-006 — Prevenir duplo submit nos formulários de cadastro e login

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário preenchendo cadastro ou login, quero que o sistema ignore cliques repetidos no botão de enviar, para que eu não dispare cadastros ou tentativas de login duplicadas por engano.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-006-prevenir-duplo-submit.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-arquitetura.md` |

## Comportamento esperado

Dupla camada de proteção, idêntica em `CadastroForm` e `LoginForm`:

1. **Visual:** botão e campos de entrada ficam `disabled` enquanto `enviando` (`isSubmitting` do React Hook Form OU `isPending` da mutation TanStack Query) é verdadeiro.
2. **Funcional (guarda de reentrância):** a função `onSubmit` verifica `if (enviando) return` como primeira instrução, antes de chamar `mutate(...)`. Isso garante que, mesmo que um segundo evento de submit chegue antes do re-render aplicar o `disabled` (Enter repetido, duplo clique na mesma janela de evento), a segunda chamada não dispara uma segunda requisição.

## Critérios de aceite

- [ ] Critério 1 — O sistema desabilita o botão de submit assim que a requisição é disparada. Em caso de erro, o botão volta a ficar habilitado após a resposta, permitindo nova tentativa. Em caso de sucesso, o botão não é reabilitado: `CadastroForm` e `LoginForm` trocam de ramo de renderização assim que `isSuccess` da mutação é verdadeiro e retornam uma tela de confirmação sem botão de envio, então o botão simplesmente deixa de existir na árvore.
- [ ] Critério 2 — O sistema ignora cliques ou teclas Enter repetidos enquanto uma requisição do mesmo formulário está em andamento.
- [ ] Critério 3 — Essa guarda se aplica igualmente ao formulário de cadastro (SDD-004) e ao de login (SDD-005).

## Casos de borda

- Enter pressionado duas vezes em sequência rápida, antes do primeiro re-render: a guarda de estado garante que só a primeira chamada de `onSubmit` efetivamente invoca `mutate`.
- Clique no botão já desabilitado: navegadores não disparam `click` em elemento `disabled`, reforço redundante à guarda funcional.
- Sucesso da submissão: o botão não passa por um estado de "reabilitado" — ele é substituído, junto com o restante do formulário, por uma tela de confirmação. A reabilitação após a resposta só ocorre no caminho de erro, quando o usuário precisa poder tentar de novo.

## Fora do escopo

Idempotência do lado do servidor (o backend tratar requisições duplicadas que cheguem mesmo assim) — se necessário no futuro, vira SDD própria de infraestrutura.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-006-prevenir-duplo-submit.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md` | Convenção de estado de formulário durante envio |

Comentários de código e blocos de teste (`describe`) que documentam essa guarda referenciam este documento exclusivamente como `SDD-006`, com o caminho `projeto-sdd/specs/SDD-006-prevenir-duplo-submit.md` — nenhum outro identificador ou caminho é válido para citar esta funcionalidade.

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** Guarda `if (enviando) return` adicionada como primeira instrução do `onSubmit` em `CadastroForm.tsx` e `LoginForm.tsx`, idêntica nos dois, complementando o `disabled` já existente. Coberto por teste automatizado (Vitest + RTL): dois `fireEvent.submit` disparados em sequência resultam em só uma chamada de `mutate`. Suíte de front-end (23/23) validada de forma independente nesta sessão.
- **Arquivos alterados:** `frontend/src/features/auth/components/CadastroForm.tsx`, `frontend/src/features/auth/components/LoginForm.tsx`, `frontend/src/features/auth/components/CadastroForm.test.tsx`, `frontend/src/features/auth/components/LoginForm.test.tsx`.

## Notas

- Identificada em análise de lacunas de UX sobre SDD-004/SDD-005 — nenhuma das duas tinha critério de aceite cobrindo isso.

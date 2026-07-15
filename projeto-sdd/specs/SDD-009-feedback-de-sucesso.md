# SDD-009 — Feedback de sucesso e navegação pós-cadastro e pós-login

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário que acabou de me cadastrar ou entrar com sucesso, quero uma confirmação visual clara e ser levado ao lugar certo, para que eu saiba que a ação funcionou e o que fazer em seguida.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-009-feedback-de-sucesso.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

Ao suceder a mutation (`onSuccess`), o conteúdo interno do formulário é substituído por uma confirmação visual, mas o wrapper `Card`/`CardContent` do shadcn é reaproveitado — não há troca do cartão por um elemento solto fora dele. A confirmação é estruturada em duas linhas com hierarquia tipográfica distinta — um título em destaque (`text-lg font-medium`) seguido de um subtítulo secundário (`text-sm text-muted-foreground`) — dentro de um contêiner com `role="status"` `aria-live="polite"`. Só então — após um atraso fixo de 1500ms (`REDIRECIONAMENTO_APOS_SUCESSO_MS`) — o redirecionamento acontece via `router.push`:

- **Cadastro bem-sucedido** → `/login` (sem login automático, ver `specs/SDD-004-cadastro-de-usuario.md`). Texto exibido: título "Cadastro realizado com sucesso!" seguido do subtítulo "Redirecionando para o login...".
- **Login bem-sucedido** → `/inicio` (home autenticada placeholder). Texto exibido: título "Login realizado com sucesso!" seguido do subtítulo "Redirecionando...".

## Critérios de aceite

- [ ] Critério 1 — O sistema exibe confirmação visual (toast ou transição de tela) ao concluir o cadastro com sucesso, antes de redirecionar.
- [ ] Critério 2 — O sistema define a rota de destino após cadastro bem-sucedido (ex.: tela de login) e após login bem-sucedido (ex.: home autenticada).
- [ ] Critério 3 — Esse comportamento é testável via critério de aceite explícito — não fica implícito na implementação.

## Casos de borda

- Usuário navega manualmente (ex: botão voltar do navegador) durante os 1500ms de espera: o componente é desmontado, o `setTimeout` pendente não afeta uma página que não existe mais — comportamento padrão do React/Next.js, sem necessidade de cleanup explícito adicional além do já natural do ciclo de vida do componente.

## Fora do escopo

Onboarding ou tour guiado após o primeiro login.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-009-feedback-de-sucesso.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-shadcn-ui.md` | Convenção de feedback de sucesso |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), implementado organicamente durante SDD-004/SDD-005 (2026-07-13), fechado nesta sessão.
- **Notas de conclusão:** Já estava coberto: confirmação visual (`role="status"` `aria-live="polite"`) substitui o formulário, aguarda 1500ms, redireciona (`/login` no cadastro, `/inicio` no login). Critério 3 (testável explicitamente) era o único genuinamente pendente — fechado nesta sessão com testes automatizados usando fake timers, confirmando a confirmação visual e a rota de destino correta em cada formulário.
- **Arquivos alterados:** `frontend/src/features/auth/components/CadastroForm.test.tsx`, `frontend/src/features/auth/components/LoginForm.test.tsx` (novos).

## Notas

- O SDD-004 já define a resposta de cadastro bem-sucedido; este SDD define o que a UI faz com ela.

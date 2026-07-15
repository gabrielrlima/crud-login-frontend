# SDD-010 — Tratamento de expiração de sessão (401) no front-end

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário navegando na área autenticada, quero ser avisado e redirecionado quando minha sessão expira, para que eu não fique preso numa tela quebrada sem entender o motivo.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-010-expiracao-de-sessao.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

`withSessionHandling(request)` (`features/auth/services/session-interceptor.ts`) envolve chamadas a rotas autenticadas: executa `request()`; se rejeitar com `ApiError` de `status === 401`, limpa o token do `auth-store` (`logout()`) e, se `window` existir (`typeof window !== "undefined"` — guard necessário para não quebrar em contexto sem DOM/SSR), redireciona via `window.location.href` para `/login?sessao=expirada`. Qualquer outro erro (rede, 500 etc.) é repassado (`throw`) sem alterar a sessão.

A leitura do parâmetro `sessao=expirada` acontece no Server Component da rota (`app/(public)/login/page.tsx`): `searchParams` é uma Promise (padrão do App Router a partir do Next.js 15), lida com `await searchParams`, e o resultado é repassado como a prop booleana `sessaoExpirada` para `LoginForm` — não via `useSearchParams()` direto no componente cliente.

`LoginForm` exibe, quando `sessaoExpirada` é verdadeiro e não existe simultaneamente um erro do próprio envio do formulário de login (`sessaoExpirada && !erroServidor` — ex.: usuário chega via redirect de sessão expirada e em seguida erra a senha), o aviso "Sua sessão expirou. Faça login novamente." num bloco `role="status"`/`aria-live="polite"` com estilo âmbar (`border-amber-500/50 bg-amber-500/10 text-amber-700`). Assim que existe erro de credenciais (`erroServidor`), esse aviso desaparece e dá lugar ao banner de erro — distinto: `role="alert"`/`aria-live="assertive"`, estilo destrutivo (`border-destructive/50 bg-destructive/10 text-destructive`) — nunca os dois exibidos ao mesmo tempo.

## Critérios de aceite

- [ ] Critério 1 — O sistema intercepta respostas 401 em qualquer rota autenticada durante o uso normal, fora do fluxo de login.
- [ ] Critério 2 — O sistema limpa o token armazenado localmente ao detectar um 401.
- [ ] Critério 3 — O sistema redireciona para a tela de login exibindo a mensagem "Sua sessão expirou. Faça login novamente.".

## Casos de borda

- Erro que não é 401 (ex: 500, falha de rede): a sessão permanece intacta, o erro é repassado para quem chamou `withSessionHandling` tratar.
- Chamada bem-sucedida: `withSessionHandling` é transparente, apenas retorna o resultado de `request()`.

## Fora do escopo

Renovação automática de sessão (refresh token) — explicitamente fora de escopo na decisão de autenticação original (`specs/SDD-004-cadastro-de-usuario.md`). Nenhuma rota autenticada real do front-end consome `withSessionHandling` ainda neste momento (só a página `/inicio`, que não faz chamada autenticada) — a função fica pronta para uso assim que a primeira chamada protegida existir.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-010-expiracao-de-sessao.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de aviso de sessão expirada |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** `withSessionHandling` (já existente como esqueleto desde SDD-005) revisado e confirmado testável isoladamente sem mudança de lógica — o guard `typeof window !== "undefined"` já é suficiente em ambiente jsdom. Coberto por 4 testes automatizados: limpa sessão e redireciona só em `ApiError` 401; não interfere em outros status nem em erro genérico; retorna o valor normal no caminho feliz. Nenhuma rota autenticada real consome a função ainda (fora do escopo desta SDD) — fica pronta para uso.
- **Arquivos alterados:** `frontend/src/features/auth/services/session-interceptor.ts` (JSDoc), `frontend/src/features/auth/services/session-interceptor.test.ts` (novo).

## Notas

- Consequência direta e já prevista de SDD-004 ("duração curta do token obriga o usuário a autenticar de novo com frequência") — esta SDD é o tratamento dessa consequência na UI.

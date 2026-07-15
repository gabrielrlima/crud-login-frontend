# SDD-012 — Interação de logout na UI

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário autenticado, quero um jeito claro e visível de sair da minha conta, para que eu tenha controle sobre encerrar minha sessão quando quiser.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-012-interacao-de-logout.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

`app/(internal)/inicio/page.tsx` expõe um botão "Sair". É hoje a única tela autenticada que cumpre RF01 (controle de logout visível): existe uma segunda tela autenticada, `app/(internal)/perfil/page.tsx` (via `PerfilForm.tsx`, SDD-016), que não expõe nenhum controle de logout próprio — nem botão dedicado, nem layout compartilhado, já que não existe `app/(internal)/layout.tsx`. Isso descumpre RF01 na rota `/perfil` (ver "Fora do escopo").

Ao clicar em "Sair" em `/inicio`:

1. `useAuthStore().logout()` limpa o token do store imediatamente.
2. A confirmação substitui todo o conteúdo da tela — inclusive o `ThemeToggle` fixo no canto — por um bloco `role="status"` `aria-live="polite"` com duas linhas de texto literal, nesta ordem: "Sessão encerrada" e "Redirecionando para o login...". Esse bloco fica visível por um intervalo exato de 800ms, fixado na constante `REDIRECIONAMENTO_APOS_LOGOUT_MS`, e não uma aproximação.
3. Redireciona para `/login`, sem exigir recarregamento manual da página.

## Critérios de aceite

- [ ] Critério 1 — O sistema expõe um controle de logout visível em toda tela autenticada (ex.: menu/avatar).
- [ ] Critério 2 — O sistema descarta o token local e redireciona para a tela de login imediatamente, sem exigir recarregamento manual da página.
- [ ] Critério 3 — O sistema exibe confirmação de que o logout foi concluído.

## Casos de borda

- Logout não faz chamada ao servidor — é responsabilidade só do cliente (RF05, mesma decisão de `specs/SDD-004-cadastro-de-usuario.md`, "Consequências": sem revogação de token no servidor nesta fase).

## Fora do escopo

Logout automático por inatividade. Subir o controle de logout para um layout compartilhado (`app/(internal)/layout.tsx` ou equivalente) que cubra todas as telas autenticadas continua fora do escopo desta SDD — hoje já existem duas rotas autenticadas, `/inicio` e `/perfil` (SDD-016), e `/perfil` não expõe controle de logout próprio, o que descumpre RF01 nessa rota. Essa pendência é dívida a ser fechada por uma SDD futura que introduza o layout compartilhado, não por esta.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-012-interacao-de-logout.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de feedback de ação concluída |
| SDD relacionado | `projeto-sdd/specs/SDD-016-consulta-do-proprio-perfil.md` | Introduz a rota `/perfil`, hoje sem controle de logout próprio (ver "Fora do escopo") |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** Adicionada confirmação visual "Sessão encerrada" (`role="status"` `aria-live="polite"`) em `app/(internal)/inicio/page.tsx`, exibida por 800ms antes do redirecionamento para `/login` — fecha o Critério 3 (confirmação de logout), que faltava. Critérios 1 e 2 já existiam. Sem teste automatizado cobrindo este fluxo — não há nenhum arquivo `*.test.*` para `app/(internal)/inicio/page.tsx` no repositório; a validação foi manual.
- **Arquivos alterados:** `frontend/src/app/(internal)/inicio/page.tsx`.

## Notas

- SDD-005 (Tarefa 4) já previa "logout no front-end (descarte do token)" de forma resumida; esta SDD detalha o comportamento de interface que faltava.

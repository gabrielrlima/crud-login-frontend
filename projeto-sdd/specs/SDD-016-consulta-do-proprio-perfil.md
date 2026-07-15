# SDD-016 — Consulta do próprio perfil (GET /me)

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário autenticado, quero consultar meus próprios dados de cadastro, para que eu veja minhas informações e possa usá-las como ponto de partida pra editar meu perfil.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-016-consulta-do-proprio-perfil.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md`, `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

**`GET /api/auth/me`** (autenticado — `Authorization: Bearer <token>`):
- 200: `{ "id": string (uuid), "nome": string, "email": string, "criadoEm": string (ISO 8601), "emailVerificado": boolean }`.
- 401: token ausente, expirado, malformado, ou usuário não encontrado (ex.: conta excluída) — mesma regra de `SDD-005`, sem detalhar o motivo. Diferente dos demais endpoints do `AuthController` (que retornam `Unauthorized(new ErroResponse(...))`, com corpo `{ "erro": string }`), aqui a resposta é `Unauthorized()` sem corpo — o front-end nunca exibe esse erro inline (ver tratamento de sessão expirada abaixo), então a ausência de corpo não chega a virar mensagem exibida ao usuário.
- Nunca retorna `SenhaHash` ou qualquer outro campo sensível.

**Front-end:** tela `/perfil` consome `GET /api/auth/me` através do hook `usePerfil` (TanStack Query: `useQuery({ queryKey: ["auth", "perfil"], queryFn: ..., enabled: !!token, retry: false })`) — a chamada só é disparada quando há token em memória no store de autenticação e nunca é reexecutada automaticamente em caso de erro.

A rota `/perfil` não tem guard de servidor (middleware ou layout) impedindo o acesso — limitação documentada no próprio componente: a única proteção é a checagem client-side do token no store Zustand, feita dentro do componente. Sem token, `PerfilForm` renderiza um card "Sessão não encontrada", com o texto "Você precisa estar autenticado para ver esta página." e um link "Ir para o login", em vez de disparar a chamada. Durante o carregamento, exibe "Carregando dados da conta..."; se a chamada falhar por um motivo que não seja `401`, exibe "Não foi possível carregar os dados da sua conta. Tente novamente em instantes.".

Em qualquer `401` (token ausente, expirado, malformado, ou usuário excluído), a chamada passa por `withSessionHandling`: o front-end limpa o store de autenticação (`logout`) e redireciona via `window.location.href` para `/login?sessao=expirada` — o usuário nunca chega a ver um erro inline para esse caso.

Com sucesso, a página exibe o título "Minha conta" e o subtítulo "Gerencie seus dados, sua senha e a sua conta.", e os dados servem de fonte para pré-preencher o formulário de `SDD-017`: `PerfilForm` repassa `perfil` por prop para `AtualizarPerfilForm` (componente de `SDD-017`), que é quem de fato pré-preenche os campos editáveis.

## Critérios de aceite

- [x] Critério 1 — O sistema expõe um endpoint autenticado que retorna os dados do próprio usuário (nome, e-mail, data de cadastro), exigindo token JWT válido.
- [x] Critério 2 — O sistema retorna 401 quando o token estiver ausente, expirado ou malformado, seguindo a mesma regra de SDD-005.
- [x] Critério 3 — O sistema não retorna hash de senha nem qualquer outro dado sensível na resposta.
- [x] Critério 4 — A resposta serve de fonte de dados pra pré-preencher o formulário de atualização de perfil (SDD-017) no front-end.

## Casos de borda

- Token válido de um usuário cuja conta foi excluída entre a emissão do token e a chamada: `401` (usuário não encontrado), mesmo comportamento de qualquer token inválido — dispara o mesmo redirecionamento para `/login?sessao=expirada`.
- Acesso a `/perfil` sem sessão ativa (sem token em memória): como não há guard de servidor, a navegação até a rota é possível; o componente identifica a ausência de token (`enabled: !!token` mantém a chamada a `GET /api/auth/me` sem disparar) e renderiza o card "Sessão não encontrada" em vez de qualquer dado.

## Fora do escopo

Consulta de dados de outros usuários. Edição de dados (`SDD-017`).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-016-consulta-do-proprio-perfil.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md`, `knowledge/frontend-feedback-ui.md` | Convenções de back-end, de componentes de exibição de dados e do padrão de sessão expirada |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Code (subagentes via Workflow, track back-end) + Claude Sonnet 5 (orquestração e verificação independente).
- **Notas de conclusão:** `GET /api/auth/me` implementado em `PerfilService`/`AuthController`, reaproveitando o `sub` da claim JWT (mesmo padrão de SDD-014/017/018). Resposta expõe só `nome`, `email`, `emailVerificado` e `criadoEm` — sem hash de senha. 401 quando token ausente/expirado/malformado ou quando o usuário do token não existe mais (conta excluída entre emissão e chamada). Front-end consome via `usePerfil` (TanStack Query); `PerfilForm` trata carregamento/erro/ausência de sessão e repassa os dados por prop para `AtualizarPerfilForm` (componente de `SDD-017`), que é quem de fato pré-preenche os campos editáveis. Verificado de forma independente: `dotnet build` (0 avisos/0 erros), `dotnet test` (124/124), `pnpm lint`/`tsc --noEmit`/`pnpm test` (84/84)/`pnpm build` sem erros.
- **Arquivos alterados:** `backend/Features/Auth/Perfil/{PerfilService,PerfilResponse,ResultadoPerfil}.cs`, `backend/Controllers/AuthController.cs` (endpoint `GET /me`), `backend.Tests/Features/Auth/Perfil/*`, `frontend/src/features/auth/hooks/usePerfil.ts`, `frontend/src/features/auth/components/PerfilForm.tsx` (+ teste), `frontend/src/app/(internal)/perfil/page.tsx`.

## Notas

- Pré-requisito direto de SDD-017 (atualização de perfil) — implementar antes dela.

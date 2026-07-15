# Knowledge — Arquitetura de código front-end (React)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

O front-end do projeto é React com **Next.js** (App Router) — decisão em [`specs/SDD-003-inicializacao-frontend-nextjs.md`](../specs/SDD-003-inicializacao-frontend-nextjs.md), confirmado também por [`knowledge/frontend-shadcn-ui.md`](./frontend-shadcn-ui.md). Este documento cobre como o código React é **organizado e escrito** — estrutura de pastas, gestão de estado, formulários, testes — complementar a `frontend-shadcn-ui.md` (biblioteca de componentes) e [`knowledge/frontend-feedback-ui.md`](./frontend-feedback-ui.md) (convenção de feedback de UI).

## Conteúdo

### Estrutura de pastas: por feature, não por tipo

Recomendação dominante em 2026: agrupar por feature/domínio, não por tipo técnico (nada de `components/`, `hooks/`, `services/` genéricos misturando funcionalidades diferentes).

**Árvore concreta adaptada ao App Router:**

```
src/
  app/                          # só roteamento: page.tsx, layout.tsx, loading.tsx, error.tsx, route.ts
    (public)/
      login/
        page.tsx                # fino — importa LoginForm e useLogin de features/auth
    (internal)/
      perfil/
        page.tsx                # fino — importa de features/perfil
        _components/            # componentes privados desta rota específica (não viram segmento de URL)
        _lib/                   # orquestração local à rota (ex.: Server Action que só chama o service da feature)
  features/
    auth/
      components/                # LoginForm, CadastroForm — internos, não exportados diretamente
      hooks/                     # useLogin, useCadastro
      services/                  # chamadas à API de autenticação
      types/                     # tipos/schemas Zod do domínio de auth
      index.ts                   # API pública da feature
    perfil/
      ...
      index.ts
  shared/                        # componentes/hooks genéricos reutilizados entre features
  lib/                           # utilitários puros, configuração de bibliotecas (cliente HTTP, etc.)
```

O critério que decide entre `app/<rota>/_components|_lib` e `features/<dominio>/`: se o componente ou a lógica é específico de uma única tela e não é reaproveitado em nenhuma outra rota, ele fica colocado na própria rota, em pasta privada prefixada com `_` (`_components/`, `_lib/`) — o underscore exclui a pasta do sistema de roteamento do Next.js, então não vira URL. Se a lógica é de domínio (regra de negócio, validação, chamada de API) e pode ser usada por mais de uma rota/tela, ela pertence a `features/<dominio>/`, nunca ao `app/`. `page.tsx`/`layout.tsx` nunca implementam regra — só importam e compõem o que já existe em `features/` ou no `_lib/` local.

**API pública da feature via `index.ts`:** cada feature expõe um `index.ts` na raiz da sua pasta reexportando só o que pode ser consumido por fora — o componente principal, o(s) hook(s) públicos, os tipos usados por quem consome a feature. Tudo que não passa pelo `index.ts` (subcomponentes internos, helpers de `services/`, estado interno) é implementação privada da feature, inacessível de fora por convenção (e, idealmente, por regra de lint — ver abaixo). Isso permite reorganizar o interior de uma feature sem quebrar quem a consome. Vale registrar o trade-off conhecido: builds baseados em Vite podem ter problemas de tree-shaking com barrel files, o que levou referências como o bulletproof-react a recuar dessa recomendação e passar a orientar import direto de arquivo interno; como este projeto roda em Next.js (webpack/Turbopack, não Vite), o `index.ts` como fronteira pública é a opção mais simples de governar aqui — mas é uma decisão explícita deste projeto, não um consenso universal.

**Regra de import entre features:** uma feature nunca importa de dentro de outra feature por caminho profundo (`features/perfil` importando `features/auth/components/LoginForm` diretamente) — só é permitido importar via `index.ts` (API pública) da outra feature, ou via `shared/`/`lib/`. Se duas features precisam do mesmo componente/lógica, ele sobe para `shared/`, não é referenciado cruzado. A arquitetura também é unidirecional: `app/` pode importar de `features/`, mas `features/` não importa de `app/`; `features/` e `app/` podem importar de `shared/`/`lib/`, mas `shared/`/`lib/` nunca importam de `features/` nem de `app/`. Forma prática de impor isso via lint: `eslint-plugin-boundaries` (define tipos de elemento por pasta e regras de dependência entre eles) ou, sem dependência extra, a regra nativa `no-restricted-imports` bloqueando qualquer caminho `@/features/*/**` exceto o próprio `index.ts` daquela feature.

**Onde ficam os testes:** testes unitários ficam colocados (co-located) ao lado do arquivo que testam, dentro da própria pasta da feature — `LoginForm.tsx` + `LoginForm.test.tsx`, `useLogin.ts` + `useLogin.test.ts`, no mesmo diretório. A justificativa é reduzir atrito: não há decisão de "em qual pasta esse teste vai", os imports ficam curtos e não quebram ao mover a feature inteira, e a cobertura fica visível de imediato na árvore de arquivos. Testes de integração e e2e, que cruzam múltiplas rotas/componentes e não pertencem a um único arquivo-fonte, ficam fora da feature, em pasta dedicada (`tests/` ou `e2e/`) na raiz do projeto.

**Nomenclatura de arquivo dentro de uma feature:**
- Componentes: PascalCase, um componente por arquivo (`LoginForm.tsx`, `CadastroForm.tsx`).
- Hooks: camelCase prefixado com `use` (`useLogin.ts`, `useCadastro.ts`).
- Serviços/chamadas de API: nome do domínio + sufixo descritivo (`auth.service.ts` ou `auth-api.ts`).
- Schemas Zod: sufixo `.schema.ts` (`auth.schema.ts`), separado de tipos TS puros quando ambos existem (`types.ts`).
- Teste: mesmo nome do arquivo testado + sufixo `.test.ts`/`.test.tsx`, colocado ao lado.
- API pública da feature: sempre `index.ts`, minúsculo, na raiz da pasta da feature.
- Rotas do Next.js: `(nome)` para route groups que agrupam layout/área sem afetar a URL (`(public)`, `(internal)`); `_nome` para pastas privadas coladas à rota (`_components/`, `_lib/`).

Tudo relacionado a autenticação (cadastro, login, recuperação de senha) vive dentro de `features/auth/` — componentes, hooks, tipos e chamadas de API juntos, não espalhados por pastas técnicas genéricas.

### Estado: servidor vs. cliente, tratados separadamente

- **Estado de servidor** (dado que vem da API — perfil do usuário, sessão): gerido por **TanStack Query**. Ele já resolve cache, refetch e loading/error state — não duplicar isso manualmente com `useState`+`useEffect`.
- **Estado de cliente** (UI local — modal aberto, tema, estado de formulário): `useState`/`useReducer` local por padrão; **Zustand** só quando o estado precisa ser compartilhado entre partes distantes da árvore de componentes (ex.: usuário autenticado, tema).
- Regra prática: **estado local primeiro**. Só sobe pra um store global quando múltiplos componentes não relacionados diretamente precisam do mesmo dado.
- Essa dupla (TanStack Query + Zustand) cobre a maior parte do que Redux resolvia, com bem menos código boilerplate.

### Formulários: React Hook Form + Zod

Padrão consolidado do ecossistema React em 2026 — e é literalmente o que o componente `Form` do shadcn/ui já espera (ver `knowledge/frontend-shadcn-ui.md`).

- Zod define o schema de validação **e** o tipo TypeScript no mesmo lugar (`z.infer<typeof schema>`) — evita declarar a mesma regra duas vezes.
- `zodResolver` (pacote `@hookform/resolvers`) conecta o schema Zod ao `useForm` do React Hook Form.
- Validação client-side (Zod) **nunca substitui** validação server-side — a spec do backend já define as regras reais (ex.: `specs/SDD-004-cadastro-de-usuario.md`); client-side é feedback rápido pro usuário, não garantia de integridade do dado.
- React Hook Form usa componentes não controlados por padrão — evita re-render a cada tecla digitada, relevante em formulários maiores.

### TypeScript

- TypeScript desde o início do projeto, não adicionado depois.
- Tipo inferido do schema Zod do formulário (`z.infer<typeof schema>`), evitando declarar o mesmo formato duas vezes (schema de validação + interface TypeScript separada).
- Evitar `any` — se o tipo não é conhecido de antemão, `unknown` força uma checagem antes de usar o valor.

### Testes de front-end

- **Vitest + React Testing Library** — testes de unidade/componente: lógica de validação (schemas Zod), hooks, comportamento de componente síncrono. Substituiu Jest como padrão no ecossistema Vite em 2026 (adoção subiu de 20% pra 52% entre 2023 e 2025).
- **Playwright** — fluxos de ponta a ponta críticos. Cadastro, login e recuperação de senha são exatamente o tipo de fluxo que a comunidade recomenda cobrir com Playwright — autenticação não deveria depender só de teste unitário.
- Regra prática: poucos testes E2E (3 a 5 fluxos críticos), muitos testes de unidade/componente rápidos.

### Performance: não otimizar prematuramente

- O **React Compiler** (estável desde o React 19) memoiza automaticamente boa parte do que antes exigia `useMemo`/`useCallback`/`React.memo` manual — não aplicar essas otimizações manualmente "por precaução" sem medir um problema real primeiro.
- `React.lazy` (code splitting) para rotas e componentes pesados — não para tudo.

### Next.js (App Router)

Decisão de framework em `specs/SDD-003-inicializacao-frontend-nextjs.md`, seção "Decisão de arquitetura".

- **Roteamento por sistema de arquivos**: cada rota é uma pasta em `app/` com um `page.tsx`. Isso não substitui a estrutura por feature — as rotas em `app/` ficam finas, só importando e renderizando componentes de dentro de `features/<nome>/`.
- **Server Components por padrão**: todo componente em `app/` é Server Component a menos que declare `"use client"` no topo do arquivo. Formulários e qualquer componente com `useState`/hooks de evento precisam de `"use client"`.
- **Bundler**: Turbopack (padrão do Next.js 16, tanto em dev quanto em build).
- **Execução local**: roda nativo via `pnpm dev` — não containerizado (ver `specs/SDD-003-inicializacao-frontend-nextjs.md`, "Decisão de arquitetura"/"Consequências").

## Fora do escopo

- Biblioteca de componentes (shadcn/ui) e catálogo de blocks — ver `knowledge/frontend-shadcn-ui.md`.
- Convenção de feedback de UI (loading, erro, sucesso, acessibilidade) — ver `knowledge/frontend-feedback-ui.md`.
- Cliente HTTP específico (fetch nativo, Axios, ky) — detalhe de implementação, não convenção arquitetural.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| Spec — Cadastro de usuário | `specs/SDD-004-cadastro-de-usuario.md` |
| Spec — Login | `specs/SDD-005-login.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [React 19 — React Compiler e novidades](https://react.dev/blog/2025/10/01/react-19-2)
- [TanStack Query — Does this replace client state managers?](https://tanstack.com/query/v5/docs/framework/react/guides/does-this-replace-client-state)
- [shadcn/ui — React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)
- [React Folder Structure Best Practices — Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/)
- [Next.js Docs — Getting Started: Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js Docs — Testing: Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [bulletproof-react — project-structure.md](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)

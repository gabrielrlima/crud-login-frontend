# SDD-003 — Inicialização do projeto front-end (Next.js + shadcn/ui)

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como desenvolvedor (humano ou agente de IA), quero um projeto Next.js inicializado com shadcn/ui configurado, para que eu tenha a base pronta pra implementar as telas de cadastro e login.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-003-inicializacao-frontend-nextjs.md` |
| Conhecimento relacionado | `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md` |

## Comportamento esperado

**Inicialização do Next.js:** `create-next-app` com TypeScript e App Router habilitados (versão 16), gerando o código-fonte sob `src/` na raiz do projeto front-end (`frontend/src/`).

**Inicialização do shadcn/ui:** `pnpm dlx shadcn@latest init -t next`, gerando `components.json`. Estilo visual (`style`, `tailwind.baseColor`, `tailwind.cssVariables`) escolhido nesta etapa fica fixo — não trocar depois (ver `knowledge/frontend-shadcn-ui.md`). Valores efetivamente escolhidos: `"style": "base-nova"`, `"tailwind": { "baseColor": "neutral", "cssVariables": true }`. O CLI desta versão também grava os campos `iconLibrary` (`"lucide"`), `menuColor` (`"default"`) e `menuAccent` (`"subtle"`) em `components.json` — mantidos no valor gerado pelo CLI, sem customização nesta etapa. Como parte desta inicialização, o block `login-03` (formulário sobre fundo `muted`, ver `knowledge/frontend-shadcn-ui.md`) é instalado via `pnpm dlx shadcn@latest add login-03`, gerando o scaffold visual de `app/(public)/login/page.tsx`.

**Estrutura de pastas** (conforme `knowledge/frontend-arquitetura.md`):
```
src/
  app/                  # rotas (App Router) — arquivos finos, importam de features/
  features/
    auth/
      components/
      hooks/
      services/
      types/
      store/
  shared/
  lib/
  components/
    ui/                 # componentes gerados pelo shadcn/ui
```

**Dependências de formulário:** `react-hook-form`, `zod`, `@hookform/resolvers` instaladas via `pnpm add`.

**Dependências de gestão de estado:** `@tanstack/react-query` (estado de servidor) e `zustand` (estado de cliente compartilhado) instaladas via `pnpm add`, conforme `knowledge/frontend-arquitetura.md`.

**Cliente HTTP (`src/lib/api-client.ts`):** módulo central de acesso à API, criado nesta etapa. `API_BASE_URL` default `http://localhost:8080`, sobrescrevível via variável de ambiente `NEXT_PUBLIC_API_URL`. Erros de resposta seguem o formato `{ erro: string }` (interface `ApiErrorBody`), lançados como instância de `ApiError` (estende `Error`, com propriedade `status`). Requisições autenticadas enviam header `Authorization: Bearer <token>`. Expõe métodos para os verbos GET, POST, PUT, PATCH e DELETE.

**Scripts esperados no `package.json`:** `dev`, `build`, `start`, `lint` (padrão gerado pelo `create-next-app`), mais `test` e `test:watch` (Vitest), com `vitest.config.ts` e `vitest.setup.ts` na raiz do projeto front-end para suportar testes de componente com Testing Library.

## Critérios de aceite

- [ ] Critério 1 — Projeto Next.js (App Router, versão 16) inicializado na estrutura de pastas do repositório.
- [ ] Critério 2 — shadcn/ui inicializado (`pnpm dlx shadcn@latest init -t next`) e configurado (`components.json`), com o block `login-03` instalado.
- [ ] Critério 3 — Estrutura de pastas segue o padrão por feature de `knowledge/frontend-arquitetura.md`, sob `src/` (`src/app`, `src/features`, `src/shared`, `src/lib`, `src/components/ui`).
- [ ] Critério 4 — Dependências de formulário instaladas via pnpm: React Hook Form, Zod, `@hookform/resolvers`.
- [ ] Critério 5 — Dependências de gestão de estado instaladas via pnpm: TanStack Query, Zustand.
- [ ] Critério 6 — `src/lib/api-client.ts` criado, expondo `API_BASE_URL` (via `NEXT_PUBLIC_API_URL`), `ApiError` e os métodos GET/POST/PUT/PATCH/DELETE.
- [ ] Critério 7 — Projeto roda localmente via `pnpm dev`, sem erro, a partir de um clone limpo.

## Decisão de arquitetura

**Contexto:** `knowledge/frontend-shadcn-ui.md` e `knowledge/frontend-arquitetura.md` deixaram o framework front-end deliberadamente em aberto (Next.js, Vite, React Router, TanStack Start e Astro são todos suportados pelo shadcn/ui). Toda funcionalidade de front-end (SDD-004, SDD-005, e as demais SDDs 003-009 de UX) depende dessa escolha para saber onde e como o código é estruturado.

**Decisão:** Next.js (App Router) como framework front-end do projeto — versão 16.

**Alternativas consideradas:**
- **Vite puro (SPA)** — descartado: exigiria montar manualmente roteamento e infraestrutura de build que o Next.js já resolve, sem necessidade real de SPA pura neste projeto.
- **React Router (framework mode)** e **TanStack Start** — descartados nesta fase por serem opções mais novas e menos consolidadas que o Next.js no ecossistema atual; podem ser revisitados se uma necessidade específica surgir.
- **Astro** — descartado: focado em sites majoritariamente estáticos/de conteúdo; não é o ajuste natural para uma aplicação com formulário autenticado e estado de sessão.

**Consequências:**
- **App Router** (não Pages Router) — Pages Router está em modo de manutenção; todo código novo usa a estrutura `app/`.
- Os blocks de login do shadcn/ui já assumiam essa estrutura (`app/login/page.tsx` + `components/login-form.tsx`, ver `knowledge/frontend-shadcn-ui.md`) — decisão que já estava implícita ali, agora formalizada.
- Componentes com estado/interatividade (formulários, hooks) precisam da diretiva `"use client"` — Server Components é o padrão por default no App Router.
- Roteamento é por sistema de arquivos (`app/<rota>/page.tsx`) — a estrutura "por feature" de `knowledge/frontend-arquitetura.md` se adapta: lógica de negócio fica em `features/auth/`, e as rotas em `app/` só importam e renderizam os componentes de lá.
- Bundler padrão: Turbopack (Next.js 16).
- Next.js precisa de runtime Node.js para rodar — roda nativo (`pnpm dev`) na máquina local, fora do `docker-compose.yml` de `SDD-001` (que cobre só backend + Postgres). Decisão confirmada, não apenas temporária.
- Gerenciador de pacote: **pnpm** — instalação mais rápida e mais eficiente em disco (store de conteúdo compartilhado entre projetos) e resolução de dependência mais estrita que o npm (evita phantom dependencies).

## Casos de borda

- `pnpm dev` deve funcionar imediatamente após `pnpm install` num clone limpo do repositório, sem passo manual adicional além de instalar dependências.
- Nenhuma versão mínima de Node.js é fixada nesta etapa — não há campo `engines` no `package.json` nem `.nvmrc` no repositório. O caso de borda acima pressupõe que a máquina já tem instalado um Node.js compatível com Next.js 16; fixar essa versão fica para uma etapa futura, caso a divergência de ambiente vire problema real.

## Fora do escopo

Containerização via Docker. Implementação da lógica funcional das telas de cadastro e login (validação, submissão, integração com API) — o scaffold visual do block `login-03` do shadcn/ui (formulário sobre fundo `muted`) é instalado nesta etapa como parte da inicialização do shadcn/ui, mas a tela funcional fica para as SDDs de cadastro e login.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-003-inicializacao-frontend-nextjs.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md` | Convenção de estrutura de pastas e instalação do shadcn |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-13.
- **Notas de conclusão:** Next.js 16.2.10 (App Router, Turbopack) inicializado em `frontend/` via `pnpm create next-app`, shadcn/ui inicializado com o block `login-03` instalado, React Hook Form + Zod + `@hookform/resolvers` + TanStack Query + Zustand instalados. Estrutura `src/features/auth/{components,hooks,services,types,store}`, `src/shared/`, `src/lib/` criada conforme `knowledge/frontend-arquitetura.md`. Cliente HTTP em `src/lib/api-client.ts` lendo `NEXT_PUBLIC_API_URL`. Validado com `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm build` (todos passando, verificado de forma independente nesta sessão) e `pnpm dev` real respondendo via `curl`. Revisão humana ainda pendente.
- **Arquivos alterados:** projeto `frontend/` completo (scaffold Next.js + configuração shadcn + estrutura de pastas).

## Notas

- Fundacional, como SDD-001/SDD-002 — recomenda-se implementar antes de SDD-004/SDD-005 (front-end), já que ambas dependem desta base.

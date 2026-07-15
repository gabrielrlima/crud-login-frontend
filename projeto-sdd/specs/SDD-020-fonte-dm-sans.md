# SDD-020 — Trocar fonte do projeto para DM Sans

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário, quero que o front-end use a fonte DM Sans de forma consistente, para que a interface tenha a tipografia pretendida em vez do fallback serifado do navegador.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-020-fonte-dm-sans.md` |

## Comportamento esperado

**`src/app/layout.tsx`:**
- Troca o import de `Geist`/`Geist_Mono` (`next/font/google`) por `DM_Sans`, mantendo a fonte monoespaçada (`Geist_Mono`) inalterada — fora de escopo desta SDD.
- `DM_Sans` é carregada com `variable: "--font-dm-sans"`, `subsets: ["latin"]` — mesmo padrão já usado para a fonte anterior.
- A classe aplicada em `<html>` inclui a nova variável (`dmSans.variable`), substituindo `geistSans.variable`.

**`src/app/globals.css`:**
- `--font-sans` (dentro do bloco `@theme inline`) aponta para `var(--font-dm-sans)` — mesma correção de padrão já aplicada informalmente durante o smoke test desta sessão (que na ocasião apontou para `--font-geist-sans`, já que a troca de fonte ainda não tinha sido formalizada nesta altura).
- `--font-heading` (linha 12 de `globals.css`, também dentro do `@theme inline`) já apontava para `var(--font-sans)` antes desta SDD e continua apontando — não é alterada diretamente por esta SDD, mas herda a troca de fonte por depender de `--font-sans`. É essa variável derivada que a classe utilitária `font-heading` consome — usada em `CardTitle` (`components/ui/card.tsx`, linha 41: `"font-heading text-xl leading-snug font-semibold ..."`), presente em praticamente todas as telas do Critério 3 (login, cadastro, verificar-email, redefinir-senha, perfil, esqueci-senha, excluir-conta, github/callback). Os títulos de card só passam a renderizar em DM Sans porque `--font-heading` deriva de `--font-sans` — nenhuma edição adicional é feita nela ou em `card.tsx`.
- A regra `html { @apply font-sans; }`, dentro de `@layer base` (linhas 127-129 de `globals.css`), é o mecanismo que efetivamente aplica `--font-sans` como fonte padrão de todo o documento — plumbing pré-existente do Tailwind, não alterado por esta SDD, mas responsável por tornar DM Sans a fonte padrão da aplicação via herança CSS a partir do `<html>`.
- Nenhuma outra variável do tema (`--color-*`, `--radius-*` etc.) é alterada por esta SDD.

**Verificação visual (Critério 3):** todas as telas públicas (`/login`, `/cadastro`, `/verificar-email`, `/esqueci-senha`, `/redefinir-senha`) e autenticadas (`/inicio`, `/perfil`) devem renderizar texto em DM Sans — incluindo títulos de card (`CardTitle`, classe `font-heading`) — nenhum elemento cai no fallback serifado do navegador.

## Critérios de aceite

- [ ] Critério 1 — A fonte DM Sans é carregada via `next/font/google` e usada como fonte sans-serif padrão (`--font-sans`) em todo o app, no lugar de Geist Sans.
- [ ] Critério 2 — A variável CSS `--font-sans` em `globals.css` resolve corretamente para a fonte carregada — sem repetir o bug de autorreferência (`--font-sans: var(--font-sans)`) encontrado e corrigido informalmente durante o smoke test local desta sessão.
- [ ] Critério 3 — Todas as telas (públicas e autenticadas) renderizam com a nova fonte — nenhuma renderiza com o fallback serifado padrão do navegador.
- [ ] Critério 4 — Os pesos de fonte usados pela UI (regular, medium, semibold) carregam sem bloqueio perceptível de renderização (`font-display: swap` ou equivalente do `next/font`).

## Casos de borda

- Enquanto a fonte carrega (antes do `font-display: swap` aplicar), o texto pode aparecer brevemente com a fonte de fallback do sistema — comportamento esperado do `next/font`, não é regressão.

## Fora do escopo

Fonte monoespaçada (permanece Geist Mono). Dimensionamento de componentes (`SDD-021`) e tema escuro (`SDD-022`), tratados em specs próprias.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-020-fonte-dm-sans.md` | Sempre |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Sonnet 5 (implementação direta, sem subagente).
- **Notas de conclusão:** `next/font/google` trocado de `Geist`/`Geist_Mono` para `DM_Sans`/`Geist_Mono` (mono mantida). Variável `--font-sans` em `globals.css` corrigida para apontar para `--font-dm-sans`. `tsc --noEmit` e `pnpm lint` sem erros. Verificado visualmente em `/login` no preview local — texto renderiza em DM Sans, sem fallback serifado.
- **Arquivos alterados:** `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css`.

## Notas

- O bug de autorreferência em `--font-sans` foi descoberto e corrigido informalmente durante um smoke test local desta sessão, antes desta SDD existir — a correção já está aplicada em `globals.css`/`layout.tsx`, mas usava a fonte Geist Sans (então já carregada no projeto). Esta SDD troca a fonte de fato para DM Sans, reaproveitando a mesma correção de variável.
- Pré-requisito natural de `specs/SDD-021-padronizacao-de-componentes-shadcn.md` — fazer a tipografia primeiro evita reajustar dimensões de componente duas vezes.

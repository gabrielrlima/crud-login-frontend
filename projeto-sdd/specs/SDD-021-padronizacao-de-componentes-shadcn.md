# SDD-021 — Padronizar dimensões dos componentes conforme os blocks de referência do shadcn/ui

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário, quero que os componentes de formulário (inputs, botões, cards) tenham o mesmo dimensionamento dos blocks de referência do shadcn/ui, para que a interface pareça consistente e profissional, em vez de divergir visualmente do exemplo que serviu de base.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-021-padronizacao-de-componentes-shadcn.md` |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md` |

## Comportamento esperado

Causa raiz medida (comparação direta com `ui.shadcn.com/view/new-york-v4/login-03`, via inspeção de estilos computados): `components.json` deste projeto usa `"style": "base-nova"`, cujos primitivos (`button.tsx`, `input.tsx`, `card.tsx`) têm dimensões sistematicamente menores que o estilo `new-york-v4` usado para gerar o block de referência. Não é um bug de instalação — são dois presets de tamanho diferentes. Ajuste: alinhar os valores abaixo nos componentes já copiados para o projeto (sem reinicializar `components.json` — reinicializar trocaria `style`/`baseColor` de todos os componentes já instalados, gerando inconsistência maior, conforme a própria regra de `knowledge/frontend-shadcn-ui.md`).

Os primitivos acessíveis por baixo de `button.tsx` e `input.tsx` (foco, teclado, ARIA) vêm de `@base-ui/react` (Base UI) — por exemplo `import { Button as ButtonPrimitive } from "@base-ui/react/button"` e `import { Input as InputPrimitive } from "@base-ui/react/input"` —, não de Radix UI. Isso diverge do que `knowledge/frontend-shadcn-ui.md` descreve genericamente para os primitivos do shadcn/ui; sem efeito nesta SDD, cujo ajuste é só de classes Tailwind em componentes já copiados, mas relevante caso algum desses componentes precise ser recriado do zero.

**`components/ui/input.tsx`:**
- Altura: `h-8` (32px) → `h-9` (36px).
- Padding horizontal: `px-2.5` (10px) → `px-3` (12px).
- Border-radius: `rounded-lg` → `rounded-md`.
- Adiciona `shadow-xs` (ausente hoje).

**`components/ui/button.tsx`:**
- Variante `size: default`: `h-8 gap-1.5 px-2.5` → `h-9 gap-2 px-4 py-2 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3` (o sufixo `has-data-[icon=...]` reduz o padding do lado em que um ícone é passado como filho do botão; o mesmo padrão, com valores de padding próprios, se repete em cada uma das demais variantes de tamanho abaixo).
- Border-radius: `rounded-lg` → `rounded-md`.
- Demais variantes de tamanho, valores efetivamente aplicados (escaladas a partir do novo `default`, não necessariamente com a mesma altura dele — ver "Casos de borda"):
  - `xs`: `h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs...`.
  - `sm`: `h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem]...`.
  - `lg`: `h-9 gap-1.5 px-2.5...`.
  - `icon`: `size-8`.
  - `icon-xs`: `size-6 rounded-[min(var(--radius-md),10px)]...`.
  - `icon-sm`: `size-7 rounded-[min(var(--radius-md),12px)]...`.
  - `icon-lg`: `size-9`.
  - `xs`, `sm`, `icon-xs` e `icon-sm` usam `rounded-[min(var(--radius-md),Npx)]` em vez de `rounded-md` puro — limita o raio da borda a um teto em pixels (10px/12px) pra não ficar desproporcional num botão desse tamanho.

**`components/ui/card.tsx`:**
- `Card`: troca `ring-1 ring-foreground/10` (sem sombra) por `border` + `shadow-sm` (com sombra), igual à referência.
- `--card-spacing` (padding vertical do card): `--spacing(4)` (16px) → `--spacing(6)` (24px).
- `CardTitle`: `text-base ... font-medium` (16px/500) → `text-xl font-semibold` (20px/600).
- Largura máxima (Critério de aceite 2): não é propriedade de `card.tsx` — cada página já define o limite no próprio wrapper que envolve o card, ex.: `className="flex w-full max-w-sm flex-col gap-6"` em `app/(public)/login/page.tsx`, replicado nas demais telas listadas em "Aplicação". Nenhuma mudança em `card.tsx` decorre disso.

**Aplicação:** a mudança é nos componentes de `components/ui/`, então se propaga automaticamente para todas as 7 telas que os usam (login, cadastro, esqueci-senha, redefinir-senha, verificar-email, perfil, troca de senha) — nenhuma tela precisa de edição própria.

## Critérios de aceite

- [ ] Critério 1 — Inputs, botões e demais componentes de formulário seguem a mesma altura, padding e tipografia do block de referência `login-03` (ver `knowledge/frontend-shadcn-ui.md`).
- [ ] Critério 2 — O card que envolve os formulários de autenticação segue a largura máxima, espaçamento interno, borda e sombra do exemplo de referência.
- [ ] Critério 3 — A padronização é aplicada de forma consistente a todas as telas que usam esses componentes (login, cadastro, esqueci-senha, redefinir-senha, verificar-email, perfil, troca de senha) — nenhuma tela fica com dimensão divergente das demais.
- [ ] Critério 4 — Nenhuma regressão funcional: a suíte de testes de front-end (Vitest) continua passando integralmente após o ajuste.

## Casos de borda

- A variante `icon` (`size-8`, 32px) é menor que o novo `default` (`h-9`, 36px) — não por escala proporcional incompleta, é intencional: alvo de toque quadrado para botão só com ícone, sem o texto que justifica a altura maior do `default`. É a variante usada pelo `ThemeToggle` (`shared/components/theme-toggle.tsx`), presente em praticamente todas as telas públicas e internas, inclusive as 7 listadas em "Aplicação". Para um botão só com ícone que precise da mesma altura do `default`, usa-se `icon-lg` (`size-9`, 36px). O link "Meu perfil" da home autenticada usa a variante `default` sem prop `size`, não `sm`/`lg`/`icon`.

## Fora do escopo

Troca de `components.json` (`style`, `baseColor`, `cssVariables`). Redesenho de layout ou fluxo de qualquer tela (comportamento já definido nas specs originais de cada funcionalidade). Tema escuro (`projeto-sdd/specs/SDD-022-alternador-de-tema-claro-escuro.md`) e troca de fonte (`projeto-sdd/specs/SDD-020-fonte-dm-sans.md`, já concluída), tratados em SDDs próprios.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-021-padronizacao-de-componentes-shadcn.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md` | Convenções de blocks/componentes shadcn/ui |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Sonnet 5 (implementação direta, sem subagente).
- **Notas de conclusão:** Medição direta contra `ui.shadcn.com/view/new-york-v4/login-03` (estilos computados via JS no navegador) confirmou que o desalinhamento vinha do preset `base-nova` do `components.json` ser mais compacto que `new-york-v4`, não de um erro de instalação. Ajustados `input.tsx` (h-8→h-9, px-2.5→px-3, rounded-lg→rounded-md, +shadow-xs), `button.tsx` (tamanho default h-8→h-9, px-2.5→px-4, +py-2, rounded-lg→rounded-md na classe base) e `card.tsx` (ring-1 sem sombra → border+shadow-sm, --card-spacing 16px→24px, CardTitle text-base/medium → text-xl/semibold). `components.json` não foi tocado. `pnpm lint`, `tsc --noEmit` e `pnpm test` (84/84) passando. Verificado visualmente em `/login`, `/cadastro` e `/perfil` no preview local.
- **Arquivos alterados:** `frontend/src/components/ui/input.tsx`, `frontend/src/components/ui/button.tsx`, `frontend/src/components/ui/card.tsx`.

## Notas

- Depende de `projeto-sdd/specs/SDD-020-fonte-dm-sans.md` estar concluída primeiro (tipografia correta antes de recalibrar dimensões).
- `components.json` deste projeto usa `"style": "base-nova"`, enquanto `knowledge/frontend-shadcn-ui.md` documenta `new-york` como exemplo de estilo — a causa raiz foi confirmada durante a execução: `base-nova` é de fato a origem do desalinhamento de tamanho percebido (ver "Registro de execução"), não uma questão de classes/props não usadas nos componentes já copiados para o projeto.

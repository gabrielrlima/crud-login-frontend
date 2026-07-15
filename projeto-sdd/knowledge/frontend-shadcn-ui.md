# Knowledge — shadcn/ui (componentes e blocks de front-end)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Toda SDD de front-end que envolve UI (formulários, autenticação, dashboards) usa shadcn/ui como base de componentes. Este documento evita que cada spec precise reexplicar o que é shadcn, como instalar um componente/block e onde o código gerado deve ficar no projeto.

Referência oficial: [ui.shadcn.com](https://ui.shadcn.com) — em especial [/blocks/login](https://ui.shadcn.com/blocks/login) para os blocos de autenticação.

## Conteúdo

### O que é shadcn/ui

Não é uma biblioteca de componentes tradicional — é, na definição da própria documentação, **"not a component library. It is how you build your component library"**. A diferença é estrutural:

- Bibliotecas tradicionais (Material UI, Ant Design etc.) são instaladas via NPM como dependência e consumidas como caixa-preta — customizar exige wrapping ou override de estilo.
- shadcn **copia o código-fonte do componente direto para o projeto** via CLI. O componente passa a ser código próprio, versionado no repositório do projeto, sem depender de update de pacote pra mudar.

**Implicação prática para quem for implementar:** um componente shadcn instalado não é "third-party" — pode e deve ser editado diretamente no arquivo onde foi copiado, como qualquer outro código do projeto.

### Linguagem e stack

- **React** — biblioteca de UI.
- **TypeScript** — tipagem estática (gera `.tsx` por padrão).
- **Tailwind CSS** — estilização via classes utilitárias (ou variáveis CSS semânticas, dependendo da config).
- **Radix UI** — primitivos acessíveis por baixo dos componentes (foco, teclado, ARIA).
- Frameworks suportados oficialmente: Next.js, Vite, TanStack Start, React Router, Astro, Laravel.

### Instalação e configuração do projeto

1. Inicializa o projeto com o CLI, indicando o framework. Framework confirmado para este projeto: **Next.js** (ver `specs/SDD-003-inicializacao-frontend-nextjs.md`):

   ```bash
   pnpm dlx shadcn@latest init -t next
   ```

   (outras opções de framework — `vite`, `start`, `react-router`, `astro` — não se aplicam aqui, mantidas só como referência da capacidade geral do shadcn. Gerenciador de pacote do projeto: **pnpm**.)

2. Isso gera o `components.json` na raiz — configuração central que o CLI usa para saber **onde** colocar cada componente adicionado depois:

   | Campo | Função |
   |---|---|
   | `style` | Estilo visual (ex: `new-york`). Fixo após o init. |
   | `tsx` | Gera `.tsx` (true) ou `.jsx` (false). |
   | `rsc` | Ativa React Server Components (adiciona `"use client"` automaticamente onde precisa). |
   | `tailwind.baseColor` | Cor base da paleta gerada (`neutral`, `stone`, `zinc` etc). Fixo após o init. |
   | `tailwind.cssVariables` | Variáveis CSS semânticas (`true`) vs. classes Tailwind inline (`false`). Fixo após o init. |
   | `aliases` | Mapeamento de import (`@/components`, `@/components/ui`, `@/lib`, `@/hooks`). Define onde cada tipo de arquivo cai. |

   `style`, `tailwind.baseColor` e `tailwind.cssVariables` não devem ser trocados depois de iniciado o projeto — trocar gera inconsistência visual entre componentes já instalados e novos.

### Componente individual vs. block

| | Componente | Block |
|---|---|---|
| O que é | Peça atômica (button, input, card, dialog) | Composição pronta de vários componentes, resolvendo um padrão de UI completo (ex: uma tela de login inteira) |
| Instalação | `pnpm dlx shadcn@latest add [componente]` | `pnpm dlx shadcn@latest add [block-name]` — mesmo comando, mesma sintaxe |
| Resultado | Um ou poucos arquivos em `components/ui/` | Página + componente(s) de suporte (ex: `app/login/page.tsx` + `components/login-form.tsx`) |
| Depois de instalado | Código próprio — edite livremente | Idem — é ponto de partida, não é "vendor code" a preservar intocado |

O comando `add` aceita `-o`/`--overwrite` (sobrescreve se já existe), `--dry-run` (mostra o que mudaria sem aplicar) e `-p`/`--path` (destino customizado).

### Blocks de login disponíveis (`/blocks/login`)

Catálogo atual em [ui.shadcn.com/blocks/login](https://ui.shadcn.com/blocks/login):

| Block | Layout | Comando |
|---|---|---|
| `login-01` | Formulário simples, centralizado na tela | `pnpm dlx shadcn@latest add login-01` |
| `login-02` | Duas colunas — formulário + imagem de capa (colapsa em telas menores) | `pnpm dlx shadcn@latest add login-02` |
| `login-03` | Formulário sobre fundo `muted` | `pnpm dlx shadcn@latest add login-03` |
| `login-04` | Formulário + imagem, ambos sobre fundo `muted` | `pnpm dlx shadcn@latest add login-04` |
| `login-05` | Só campo de e-mail (fluxo passwordless/magic-link), fundo padrão | `pnpm dlx shadcn@latest add login-05` |

Todos seguem a mesma arquitetura de arquivos:

- `app/login/page.tsx` — página, monta o layout (`flex` ou `grid` conforme o bloco).
- `components/login-form.tsx` — o formulário em si, reutilizável fora da página padrão se necessário.

**Ao escolher um bloco de login numa spec:** referencie o identificador do bloco (ex: `login-02`) e liste explicitamente os desvios do padrão (campos extras, validação, redirecionamento pós-login). O bloco é o ponto de partida visual, não a especificação de comportamento.

## Fora do escopo

- Comportamento de autenticação (validação, hashing, sessão, integração com backend) — isso é RF/RNF de `requisitos/` e regra de negócio de `specs/`, não deste documento.
- Decisão de qual bloco usar em qual SDD, ou personalização visual feita numa SDD específica — isso vai na spec da SDD (`specs/SDD-ID-nome.md`), que referencia este documento.
- Outras categorias de block (dashboard, sidebar, signup) — documentar aqui se/quando alguma SDD precisar.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Cadastro de usuário | `specs/SDD-004-cadastro-de-usuario.md` |
| SDD — Login | `specs/SDD-005-login.md` |
| Spec — Cadastro de usuário | `specs/SDD-004-cadastro-de-usuario.md` |
| Spec — Login | `specs/SDD-005-login.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [ui.shadcn.com](https://ui.shadcn.com) — documentação oficial
- [ui.shadcn.com/docs/installation](https://ui.shadcn.com/docs/installation) — instalação por framework
- [ui.shadcn.com/docs/components-json](https://ui.shadcn.com/docs/components-json) — configuração do `components.json`
- [ui.shadcn.com/docs/cli](https://ui.shadcn.com/docs/cli) — comandos do CLI
- [ui.shadcn.com/blocks/login](https://ui.shadcn.com/blocks/login) — catálogo de blocks de login

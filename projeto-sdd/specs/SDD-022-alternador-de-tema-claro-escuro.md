# SDD-022 — Alternador de tema claro/escuro (dark mode)

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário, quero poder alternar entre tema claro e escuro, para que eu use o app confortavelmente conforme minha preferência ou o ambiente de luz em que estou.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-022-alternador-de-tema-claro-escuro.md` |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md` |

## Comportamento esperado

**Biblioteca:** `next-themes` — padrão de mercado para dark mode em projetos Next.js/shadcn (evita mismatch de hidratação SSR/CSR ao aplicar a classe `.dark` antes do primeiro paint, o que uma implementação manual com `useEffect` não consegue garantir). Nova dependência do projeto.

**`app/layout.tsx`:** envolve a árvore com um `ThemeProvider` próprio (`shared/providers/ThemeProvider.tsx`), que reexporta o `ThemeProvider` de `next-themes` já configurado com `attribute="class"` (a classe `.dark` já existe em `globals.css`, sem mudança de variável necessária), `defaultTheme="system"` e `enableSystem` (RF03) — a detecção de `prefers-color-scheme` é responsabilidade da própria biblioteca, não de CSS/JS customizado. O `<html>` usa `suppressHydrationWarning`, necessário porque a lib aplica a classe `.dark` antes da hidratação.

**Componente de alternância (`shared/components/theme-toggle.tsx`, novo):** `Button` do shadcn com `variant="outline"` e `size="icon"`, e `aria-label="Alternar tema claro/escuro"` — como o botão só tem ícone, sem texto visível, o `aria-label` é a única forma de um leitor de tela identificar sua função (RNF01). Alterna entre `"light"`/`"dark"` via `useTheme()` do `next-themes`. Os dois ícones (`Sun`/`Moon`, `lucide-react`, já é dependência do projeto) ficam ambos no DOM, alternando visibilidade via CSS (`dark:hidden` no sol, `hidden dark:block` na lua) em vez de montagem/desmontagem condicional, evitando mismatch de hidratação.

Presente em todas as telas, públicas e autenticadas, sem posição fixa comum entre elas: nas 5 telas públicas (login, cadastro, verificar e-mail, esqueci senha, redefinir senha), ao lado do logo "Acme Inc."; em `/inicio`, isolado em `<div className="fixed top-6 right-6">`, no canto superior direito da viewport, sem relação de proximidade com o botão "Sair"; em `/perfil`, isolado em `<div className="flex justify-end">`, alinhado à direita acima do formulário (tela que, aliás, não tem botão "Meu perfil").

**Persistência (RF02):** delegada ao `next-themes`, que grava em `localStorage` (chave padrão `theme`) e a restaura antes da hidratação — nenhum código customizado de persistência é necessário.

## Critérios de aceite

- [ ] Critério 1 — Existe um controle visível (botão/ícone) que alterna entre tema claro e escuro, acessível em todas as telas (públicas e autenticadas), com `aria-label` descritivo (`"Alternar tema claro/escuro"`) já que o botão não tem texto visível.
- [ ] Critério 2 — A preferência escolhida é persistida localmente (ex: `localStorage`) e restaurada em navegações/recarregamentos futuros.
- [ ] Critério 3 — Quando o usuário ainda não escolheu manualmente, o tema inicial respeita `prefers-color-scheme` do sistema operacional.
- [ ] Critério 4 — O tema escuro usa as variáveis CSS já definidas em `.dark` no `globals.css` (existentes desde o setup inicial do shadcn, nunca ativadas até agora).
- [ ] Critério 5 — Nenhuma regressão perceptível de contraste/legibilidade em nenhum dos dois temas, em nenhuma tela.

## Casos de borda

- Usuário sem JavaScript (SSR puro): tema cai no padrão `system` resolvido no primeiro paint client-side; sem regressão perceptível maior do que qualquer app Next.js com dark mode via `next-themes`.

## Fora do escopo

Temas além de claro/escuro/sistema. Sincronizar tema entre dispositivos/conta.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-022-alternador-de-tema-claro-escuro.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-arquitetura.md` | Convenções de tema e organização de front-end |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Sonnet 5 (implementação direta, sem subagente).
- **Notas de conclusão:** Adicionada dependência `next-themes` (0.4.6). Criado `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`) envolvendo a árvore em `layout.tsx` (com `suppressHydrationWarning` no `<html>`, necessário porque a lib aplica a classe `.dark` antes da hidratação). Criado `ThemeToggle` (`shared/components/theme-toggle.tsx`) com troca de ícone via CSS (`dark:hidden`/`hidden dark:block`), evitando mismatch de hidratação. Botão adicionado nas 7 telas (5 públicas, ao lado do logo "Acme Inc."; `/inicio`, fixo no canto superior; `/perfil`, alinhado à direita acima do formulário). `pnpm lint`, `tsc --noEmit` e `pnpm test` (84/84) passando. Verificado visualmente: tema inicial respeitou `prefers-color-scheme` do ambiente (escuro), alternância funcionou, e a preferência persistiu corretamente após reload da página (sem flash de tema incorreto).
- **Arquivos alterados:** `frontend/package.json`, `frontend/src/app/layout.tsx`, `frontend/src/shared/providers/ThemeProvider.tsx` (novo), `frontend/src/shared/components/theme-toggle.tsx` (novo), e as 7 páginas: `app/(public)/{login,cadastro,verificar-email,esqueci-senha,redefinir-senha}/page.tsx`, `app/(internal)/{inicio,perfil}/page.tsx`.

## Notas

- Depende de `SDD-021` (padronização de componentes shadcn) estar concluída primeiro — validar o tema escuro contra componentes já corretamente dimensionados evita retrabalho.
- Persistência de preferência de tema é dado de UI, não de sessão de autenticação — não conflita com a decisão de "sem persistência" de token JWT (ver `specs/SDD-005-login.md`).

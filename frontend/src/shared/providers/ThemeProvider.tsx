"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Provider de tema claro/escuro (`next-themes`) — raiz da árvore, conforme
 * `projeto-sdd/specs/SDD-022-alternador-de-tema-claro-escuro.md`.
 *
 * `attribute="class"` porque `globals.css` já define as variáveis do tema
 * escuro sob a classe `.dark` (herdadas do setup inicial do shadcn/ui) — não
 * precisa de nova convenção de tema. `enableSystem` + `defaultTheme="system"`
 * cobrem o Critério 3 (respeitar `prefers-color-scheme` quando o usuário ainda
 * não escolheu manualmente); a escolha explícita e a persistência em
 * `localStorage` são responsabilidade da própria biblioteca (evita o
 * mismatch de hidratação SSR/CSR de uma implementação manual via `useEffect`).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}

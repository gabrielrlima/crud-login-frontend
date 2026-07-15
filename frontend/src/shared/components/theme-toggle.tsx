"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/**
 * Alternador de tema claro/escuro (`projeto-sdd/specs/SDD-022-alternador-de-tema-claro-escuro.md`,
 * Critério 1). Troca de ícone via CSS (`dark:hidden`/`hidden dark:block`), não via
 * `resolvedTheme` no JSX — evita mismatch de hidratação SSR/CSR, já que o servidor não
 * sabe qual tema o cliente vai resolver antes do primeiro paint.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Alternar tema claro/escuro"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  )
}

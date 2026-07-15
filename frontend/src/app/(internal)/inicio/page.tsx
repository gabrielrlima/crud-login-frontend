"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth"
import { ThemeToggle } from "@/shared/components/theme-toggle"

// Tempo que a confirmação de logout fica visível antes do redirecionamento —
// mesmo padrão de "feedback antes de qualquer redirecionamento" usado em
// CadastroForm/LoginForm (knowledge/frontend-feedback-ui.md, "Feedback de
// sucesso"), só que mais curto: logout é uma ação simples de um clique, sem
// dado novo pro usuário ler (SDD-012/RNF01).
const REDIRECIONAMENTO_APOS_LOGOUT_MS = 800

// Placeholder de home autenticada — destino do redirecionamento pós-login
// (SDD-005). Nenhum SDD existente pede uma tela autenticada real; esta
// página existe só pra dar um destino visível e coerente ao fluxo de
// login, e serve de base para quando a primeira rota autenticada de verdade
// (SDD futuro) precisar de uma chamada protegida via
// `features/auth/services/session-interceptor.ts`.
export default function InicioPage() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Controla a confirmação visual de logout concluído (SDD-012/RNF01: "a
  // conclusão do logout deve ser confirmada visualmente ao usuário").
  const [sessaoEncerrada, setSessaoEncerrada] = useState(false)

  function handleLogout() {
    // Logout é responsabilidade do cliente — só descarta o token local, sem
    // chamada ao servidor (RF05/SDD-005, ver SDD-004, seção "Decisão de arquitetura",
    // "Consequências", sobre a impossibilidade de revogar o token no servidor). O token é limpo
    // imediatamente; só o
    // redirecionamento espera a confirmação ser lida.
    logout()
    setSessaoEncerrada(true)

    window.setTimeout(() => {
      router.push("/login")
    }, REDIRECIONAMENTO_APOS_LOGOUT_MS)
  }

  if (sessaoEncerrada) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2"
        >
          <p className="text-lg font-medium">Sessão encerrada</p>
          <p className="text-sm text-muted-foreground">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="fixed top-6 right-6">
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-semibold">Área autenticada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Placeholder da home autenticada — destino do login (SDD-005). Rotas
        autenticadas reais chegam em futuros SDDs.
      </p>
      <p className="text-xs text-muted-foreground">
        Sessão ativa no store: {isAuthenticated ? "sim" : "não"}
      </p>
      <div className="flex gap-2">
        <Link href="/perfil" className={buttonVariants({ variant: "outline" })}>
          Meu perfil
        </Link>
        <Button onClick={handleLogout}>Sair</Button>
      </div>
    </div>
  )
}

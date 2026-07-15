import Link from "next/link"
import { GalleryVerticalEndIcon } from "lucide-react"

import { GithubCallbackForm } from "@/features/auth"
import { ThemeToggle } from "@/shared/components/theme-toggle"

interface GithubCallbackPageProps {
  // `searchParams` é uma Promise no App Router (Next.js 15+) — precisa de
  // `await` antes de ler qualquer chave (ver node_modules/next/dist/docs/01-app/
  // 03-api-reference/03-file-conventions/page.md, mesmo padrão de
  // `app/(public)/login/page.tsx` e `app/(public)/verificar-email/page.tsx`).
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Página fina — só compõe o layout e extrai `code`/`state`/`error` da query
// string devolvida pelo GitHub (ver knowledge/frontend-arquitetura.md,
// "Estrutura de pastas: por feature, não por tipo"). A conferência do
// `state` contra `sessionStorage` e a chamada a `POST /api/auth/login/github`
// vivem em `GithubCallbackForm` (`features/auth`) — `sessionStorage` só
// existe no navegador, então não pode ser lido aqui (Server Component).
export default async function GithubCallbackPage({
  searchParams,
}: GithubCallbackPageProps) {
  const params = await searchParams

  const codeParam = params.code
  const code = typeof codeParam === "string" ? codeParam : null

  const stateParam = params.state
  const state = typeof stateParam === "string" ? stateParam : null

  // Presente quando o usuário cancela a autorização no GitHub
  // (`error=access_denied`) — ver `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`, "Casos de borda".
  const errorParam = params.error
  const erroAutorizacao = typeof errorParam === "string" ? errorParam : null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </div>
            Acme Inc.
          </Link>
          <ThemeToggle />
        </div>
        <GithubCallbackForm
          code={code}
          state={state}
          erroAutorizacao={erroAutorizacao}
        />
      </div>
    </div>
  )
}

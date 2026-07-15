import Link from "next/link"
import { GalleryVerticalEndIcon } from "lucide-react"

import { VerificarEmailForm } from "@/features/auth"
import { ThemeToggle } from "@/shared/components/theme-toggle"

interface VerificarEmailPageProps {
  // `searchParams` é uma Promise no App Router (Next.js 15+) — precisa de
  // `await` antes de ler qualquer chave (ver node_modules/next/dist/docs/01-app/
  // 03-api-reference/03-file-conventions/page.md, mesmo padrão de
  // `app/(public)/login/page.tsx`).
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Página fina — só compõe o layout, lê o token de verificação da query
// string e importa o formulário de `features/auth` (ver
// knowledge/frontend-arquitetura.md, "Estrutura de pastas: por feature, não
// por tipo"). A chamada automática ao backend e toda a lógica de
// verificação/reenvio vivem em `VerificarEmailForm` e nos hooks da feature.
export default async function VerificarEmailPage({
  searchParams,
}: VerificarEmailPageProps) {
  const params = await searchParams
  const tokenParam = params.token
  const token = typeof tokenParam === "string" ? tokenParam : null

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
        <VerificarEmailForm token={token} />
      </div>
    </div>
  )
}

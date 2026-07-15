import Link from "next/link"
import { GalleryVerticalEndIcon } from "lucide-react"

import { CadastroForm } from "@/features/auth"
import { ThemeToggle } from "@/shared/components/theme-toggle"

// Página fina — só compõe o layout e importa o formulário de
// `features/auth` (ver knowledge/frontend-arquitetura.md, "Estrutura de
// pastas: por feature, não por tipo"). Nenhuma regra de validação ou
// chamada de API vive aqui.
export default function CadastroPage() {
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
        <CadastroForm />
      </div>
    </div>
  )
}

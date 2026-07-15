import { PerfilForm } from "@/features/auth"
import { ThemeToggle } from "@/shared/components/theme-toggle"

// Página fina — só compõe o layout e importa o formulário de
// `features/auth` (ver knowledge/frontend-arquitetura.md, "Estrutura de
// pastas: por feature, não por tipo"). Toda a busca de dados (`GET
// /api/auth/me`) e regra de negócio vivem em `PerfilForm` e nos hooks da
// feature.
//
// LIMITAÇÃO DOCUMENTADA (mesma de `app/(internal)/inicio/page.tsx`, e de
// SDD-016): o projeto ainda não implementa um guard de rota real (ex.:
// middleware do Next.js redirecionando não-autenticados antes de renderizar).
// A "proteção" hoje é só client-side, dentro de `PerfilForm`: sem token no
// `auth-store` em memória, ela mostra um aviso pra fazer login em vez de
// chamar a API — mas o próprio `page.tsx`/layout não impede o acesso à rota
// `/perfil` (alguém sem sessão consegue navegar até aqui, só não vê dados
// nenhum). Um guard de verdade (middleware, ou um layout de `(internal)` que
// redireciona) fica como próximo passo fora do escopo de SDD-016.
export default function PerfilPage() {
  return (
    <div className="flex min-h-svh flex-col items-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <PerfilForm />
      </div>
    </div>
  )
}

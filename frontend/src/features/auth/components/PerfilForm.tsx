"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { usePerfil } from "../hooks/usePerfil"
import { useAuthStore } from "../store/auth-store"
import { AtualizarPerfilForm } from "./AtualizarPerfilForm"
import { TrocarSenhaForm } from "./TrocarSenhaForm"
import { ExcluirContaSection } from "./ExcluirContaSection"

const MENSAGEM_ERRO_GENERICA =
  "Não foi possível carregar os dados da sua conta. Tente novamente em instantes."

/**
 * Tela de gestão de conta (`/perfil`) — orquestra as três ações self-service
 * do usuário autenticado: consulta/atualização de dados (SDD-016/SDD-017),
 * troca de senha (SDD-018) e exclusão de conta (SDD-019).
 *
 * Busca `GET /api/auth/me` (`usePerfil`) e só renderiza os formulários
 * depois que os dados chegam — eles dependem de `perfil.data` pra
 * pré-preencher (SDD-016, "front-end... servindo de fonte para
 * pré-preencher o formulário de SDD-017").
 *
 * Checagem de `token` aqui é a única "proteção" desta rota até o momento —
 * não existe ainda um guard de rota real no projeto (mesma limitação
 * documentada em `app/(internal)/inicio/page.tsx` e no comentário de
 * `app/(internal)/perfil/page.tsx`). Sem token em memória, nem chama a API:
 * mostra só um aviso pra fazer login.
 */
export function PerfilForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const token = useAuthStore((state) => state.token)
  const perfil = usePerfil()

  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sessão não encontrada</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para ver esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
            >
              <Link href="/login">Ir para o login</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (perfil.isPending) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-sm text-muted-foreground">
                Carregando dados da conta...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (perfil.isError) {
    const mensagem =
      perfil.error instanceof ApiError
        ? perfil.error.message
        : MENSAGEM_ERRO_GENERICA

    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
            >
              {mensagem}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <h1 className="text-2xl font-semibold">Minha conta</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus dados, sua senha e a sua conta.
        </p>
      </div>

      <AtualizarPerfilForm perfil={perfil.data} />
      <TrocarSenhaForm />
      <ExcluirContaSection />
    </div>
  )
}

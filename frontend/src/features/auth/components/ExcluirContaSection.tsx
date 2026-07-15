"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useExcluirConta } from "../hooks/useExcluirConta"

// Rota pública de destino pós-exclusão — nunca `/login`, pra não sugerir que
// a conta ainda existe (projeto-sdd/specs/SDD-019-exclusao-de-conta.md, "Front-end").
const ROTA_APOS_EXCLUSAO = "/"

// Mesmo padrão de "confirmação visível antes do redirecionamento" de
// LoginForm/TrocarSenhaForm (knowledge/frontend-feedback-ui.md).
const REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500

const MENSAGEM_ERRO_GENERICA =
  "Não foi possível excluir sua conta. Tente novamente em instantes."

export function ExcluirContaSection({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const excluirConta = useExcluirConta()

  // Diálogo controlado explicitamente (em vez de `AlertDialogTrigger`) —
  // precisa continuar aberto (mostrando "Excluindo...") enquanto a mutation
  // está pendente, e o botão de confirmação executa a exclusão de verdade,
  // não só fecha o diálogo.
  const [dialogoAberto, setDialogoAberto] = useState(false)

  const enviando = excluirConta.isPending

  function handleConfirmarExclusao() {
    if (enviando) return

    excluirConta.mutate(undefined, {
      onSuccess: () => {
        window.setTimeout(() => {
          router.push(ROTA_APOS_EXCLUSAO)
        }, REDIRECIONAMENTO_APOS_SUCESSO_MS)
      },
    })
  }

  if (excluirConta.isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-lg font-medium">Conta excluída com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const erroServidor = excluirConta.isError
    ? excluirConta.error instanceof ApiError
      ? excluirConta.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-xl text-destructive">
            Excluir conta
          </CardTitle>
          <CardDescription>
            Remove permanentemente sua conta e todos os dados associados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {erroServidor && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {erroServidor}
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            className="self-start"
            onClick={() => setDialogoAberto(true)}
          >
            Excluir conta
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os seus dados serão
              removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={enviando}
              onClick={handleConfirmarExclusao}
            >
              {enviando ? "Excluindo..." : "Sim, excluir minha conta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

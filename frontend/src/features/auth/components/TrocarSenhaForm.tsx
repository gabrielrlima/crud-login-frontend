"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { useTrocarSenha } from "../hooks/useTrocarSenha"
import {
  trocarSenhaSchema,
  type TrocarSenhaFormValues,
} from "../types/trocar-senha.schema"

// Tempo que a confirmação de sucesso fica visível antes do redirecionamento
// — mesmo padrão de LoginForm/RedefinirSenhaForm (knowledge/frontend-feedback-ui.md,
// "Feedback de sucesso").
const REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500

// Fallback para falha que não é a resposta 400 do contrato (rede fora do
// ar, erro 5xx). O erro esperado do contrato (400 — senha atual incorreta,
// ou nova senha fora do padrão) já vem pronto do servidor via ApiError.message.
const MENSAGEM_ERRO_GENERICA =
  "Não foi possível trocar sua senha. Tente novamente em instantes."

export function TrocarSenhaForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const trocarSenha = useTrocarSenha()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrocarSenhaFormValues>({
    resolver: zodResolver(trocarSenhaSchema),
  })

  const enviando = isSubmitting || trocarSenha.isPending

  function onSubmit(dados: TrocarSenhaFormValues) {
    // Guarda de reentrância (mesmo padrão de SDD-006 em LoginForm/CadastroForm).
    if (enviando) return

    // `confirmarSenha` é só validação de UI — não faz parte do contrato de
    // `POST /api/auth/senha/trocar` (ver `trocar-senha.schema.ts`).
    trocarSenha.mutate(
      { senhaAtual: dados.senhaAtual, novaSenha: dados.novaSenha },
      {
        onSuccess: () => {
          // A troca já invalidou o token desta sessão no servidor (mesmo
          // mecanismo `SenhaAlteradaEm` de SDD-014) — `useTrocarSenha` já
          // descartou o token local; aqui só resta redirecionar a UI.
          window.setTimeout(() => {
            router.push("/login")
          }, REDIRECIONAMENTO_APOS_SUCESSO_MS)
        },
      }
    )
  }

  if (trocarSenha.isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-lg font-medium">Senha alterada com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Sua sessão foi encerrada por segurança. Redirecionando para o
                login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const erroServidor = trocarSenha.isError
    ? trocarSenha.error instanceof ApiError
      ? trocarSenha.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Alterar senha</CardTitle>
          <CardDescription>
            Você precisará entrar novamente após concluir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {erroServidor && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {erroServidor}
                </div>
              )}

              <Field data-invalid={!!errors.senhaAtual}>
                <FieldLabel htmlFor="senhaAtual">Senha atual</FieldLabel>
                <Input
                  id="senhaAtual"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.senhaAtual}
                  aria-describedby={
                    errors.senhaAtual ? "senhaAtual-error" : undefined
                  }
                  {...register("senhaAtual")}
                  disabled={enviando}
                />
                <FieldError
                  id="senhaAtual-error"
                  errors={errors.senhaAtual ? [errors.senhaAtual] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.novaSenha}>
                <FieldLabel htmlFor="novaSenha">Nova senha</FieldLabel>
                <Input
                  id="novaSenha"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.novaSenha}
                  aria-describedby={
                    errors.novaSenha
                      ? "novaSenha-description novaSenha-error"
                      : "novaSenha-description"
                  }
                  {...register("novaSenha")}
                  disabled={enviando}
                />
                <FieldDescription id="novaSenha-description">
                  Mínimo de 8 caracteres, com ao menos uma letra e um número.
                </FieldDescription>
                <FieldError
                  id="novaSenha-error"
                  errors={errors.novaSenha ? [errors.novaSenha] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.confirmarSenha}>
                <FieldLabel htmlFor="confirmarSenha">
                  Confirmar nova senha
                </FieldLabel>
                <Input
                  id="confirmarSenha"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmarSenha}
                  aria-describedby={
                    errors.confirmarSenha ? "confirmarSenha-error" : undefined
                  }
                  {...register("confirmarSenha")}
                  disabled={enviando}
                />
                <FieldError
                  id="confirmarSenha-error"
                  errors={
                    errors.confirmarSenha ? [errors.confirmarSenha] : undefined
                  }
                />
              </Field>

              <Field>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Alterando..." : "Alterar senha"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

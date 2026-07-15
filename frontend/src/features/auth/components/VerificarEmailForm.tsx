"use client"

import Link from "next/link"
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

import { useVerificarEmail } from "../hooks/useVerificarEmail"
import { useReenviarVerificacao } from "../hooks/useReenviarVerificacao"
import {
  reenviarVerificacaoSchema,
  type ReenviarVerificacaoFormValues,
} from "../types/verificar-email.schema"

// Mensagem de fallback para falha que não é a resposta 400 do contrato (ex.:
// rede fora do ar, erro 5xx) na verificação automática ao carregar.
const MENSAGEM_ERRO_VERIFICACAO_GENERICA =
  "Não foi possível verificar seu e-mail. Tente novamente em instantes."

// Idem, para o reenvio do link de verificação.
const MENSAGEM_ERRO_REENVIO_GENERICA =
  "Não foi possível reenviar o link. Tente novamente em instantes."

// Resposta de reenvio sempre genérica (RF02/SDD-013, anti-enumeração) —
// exibida tal qual como veio do servidor, nunca reescrita.
interface VerificarEmailFormProps extends React.ComponentProps<"div"> {
  /**
   * Token lido de `?token=` pela página (Server Component,
   * `app/(public)/verificar-email/page.tsx`) — `null` quando o link foi
   * acessado sem o parâmetro.
   */
  token: string | null
}

export function VerificarEmailForm({
  className,
  token,
  ...props
}: VerificarEmailFormProps) {
  const verificacao = useVerificarEmail(token)
  const reenvio = useReenviarVerificacao()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReenviarVerificacaoFormValues>({
    resolver: zodResolver(reenviarVerificacaoSchema),
  })

  const enviandoReenvio = isSubmitting || reenvio.isPending

  function onSubmitReenvio(dados: ReenviarVerificacaoFormValues) {
    if (enviandoReenvio) return
    reenvio.mutate(dados)
  }

  // Verificação automática em andamento (token presente, GET disparado ao
  // montar via `useVerificarEmail`). Só entra aqui com token — com
  // `enabled: false` (sem token) o TanStack Query mantém `isPending: true`
  // indefinidamente, então este branch nunca deve depender só de
  // `isPending` sem checar `token` primeiro.
  if (token && verificacao.isPending) {
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
                Verificando seu e-mail...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sucesso: token válido, e-mail confirmado.
  if (token && verificacao.isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-lg font-medium">
                E-mail verificado com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                <Link href="/login">Ir para o login</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Reenvio concluído: resposta genérica de sucesso, sem revelar se o
  // e-mail existe, já está verificado, ou se o limite de frequência foi
  // atingido (RF02/SDD-013).
  if (reenvio.isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-lg font-medium">Link reenviado!</p>
              <p className="text-sm text-muted-foreground">
                Se o e-mail estiver cadastrado e pendente de verificação, um
                novo link foi enviado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Sem token, ou token inválido/expirado/já usado/inexistente (mesma
  // mensagem genérica do contrato — 400 "Link de verificação inválido ou
  // expirado.", ver `projeto-sdd/specs/SDD-013-verificacao-de-email.md`).
  const erroVerificacao = !token
    ? "Nenhum token de verificação foi informado no link."
    : verificacao.isError
      ? verificacao.error instanceof ApiError
        ? verificacao.error.message
        : MENSAGEM_ERRO_VERIFICACAO_GENERICA
      : null

  const erroReenvio = reenvio.isError
    ? reenvio.error instanceof ApiError
      ? reenvio.error.message
      : MENSAGEM_ERRO_REENVIO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verificação de e-mail</CardTitle>
          <CardDescription>
            Solicite um novo link informando seu e-mail cadastrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {erroVerificacao && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {erroVerificacao}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmitReenvio)} noValidate>
            <FieldGroup>
              {erroReenvio && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {erroReenvio}
                </div>
              )}

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                  disabled={enviandoReenvio}
                />
                <FieldError
                  id="email-error"
                  errors={errors.email ? [errors.email] : undefined}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={enviandoReenvio}>
                  {enviandoReenvio
                    ? "Reenviando..."
                    : "Reenviar link de verificação"}
                </Button>
                <FieldDescription className="text-center">
                  <Link href="/login">Voltar para o login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import Link from "next/link"
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

import { useRedefinirSenha } from "../hooks/useRedefinirSenha"
import {
  redefinirSenhaSchema,
  type RedefinirSenhaFormValues,
} from "../types/redefinir-senha.schema"

// Tempo que a confirmação de sucesso fica visível antes do redirecionamento
// — mesmo padrão de LoginForm/CadastroForm (knowledge/frontend-feedback-ui.md,
// "Feedback de sucesso").
const REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500

// Fallback para falha que não é a resposta 400 do contrato (rede fora do
// ar, erro 5xx). O erro esperado do contrato (400 — token inválido/expirado
// ou senha fora do padrão) já vem pronto do servidor via ApiError.message.
const MENSAGEM_ERRO_GENERICA =
  "Não foi possível redefinir sua senha. Tente novamente em instantes."

interface RedefinirSenhaFormProps extends React.ComponentProps<"div"> {
  /**
   * Token lido de `?token=` pela página (Server Component,
   * `app/(public)/redefinir-senha/page.tsx`) — `null` quando o link foi
   * acessado sem o parâmetro.
   */
  token: string | null
}

export function RedefinirSenhaForm({
  className,
  token,
  ...props
}: RedefinirSenhaFormProps) {
  const router = useRouter()
  const redefinir = useRedefinirSenha()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirSenhaFormValues>({
    resolver: zodResolver(redefinirSenhaSchema),
  })

  const enviando = isSubmitting || redefinir.isPending

  function onSubmit(dados: RedefinirSenhaFormValues) {
    // Guarda de reentrância (mesmo padrão de SDD-006 em LoginForm/
    // CadastroForm), além da checagem de token — sem token não há o que
    // enviar (o formulário nem é renderizado nesse caso, ver abaixo, mas a
    // guarda fica explícita por segurança).
    if (enviando || !token) return

    redefinir.mutate(
      { token, novaSenha: dados.novaSenha },
      {
        onSuccess: () => {
          window.setTimeout(() => {
            router.push("/login")
          }, REDIRECIONAMENTO_APOS_SUCESSO_MS)
        },
      }
    )
  }

  // Sem token na URL: nada a redefinir — orienta a solicitar um novo link
  // em vez de renderizar um formulário que resultaria garantidamente em erro.
  if (!token) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Link inválido</CardTitle>
            <CardDescription>
              Nenhum token de redefinição foi informado no link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
            >
              <Link href="/esqueci-senha">Solicitar um novo link</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (redefinir.isSuccess) {
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
                Senha redefinida com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Erro (400) chega pronto do servidor — mensagem específica de token
  // inválido/expirado ou senha fora do padrão (ver
  // `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md`), exibida tal qual, como banner
  // acima do formulário (não é atribuível só ao campo de senha, já que pode
  // ser o token que expirou).
  const erroServidor = redefinir.isError
    ? redefinir.error instanceof ApiError
      ? redefinir.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Redefinir senha</CardTitle>
          <CardDescription>
            Escolha uma nova senha para sua conta
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

              <Field>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Redefinindo..." : "Redefinir senha"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

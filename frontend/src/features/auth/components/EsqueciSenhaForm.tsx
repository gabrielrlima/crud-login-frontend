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

import { useEsqueciSenha } from "../hooks/useEsqueciSenha"
import {
  esqueciSenhaSchema,
  type EsqueciSenhaFormValues,
} from "../types/esqueci-senha.schema"

// Mensagem de sucesso sempre a mesma, exista ou não o e-mail informado
// (RF02/SDD-014 — anti-enumeração; RNF01, anti-timing-attack, é uma lacuna conhecida, não
// atendida pela implementação atual, ver Critério de aceite 1 do mesmo SDD). Nunca reescrita
// nem trocada por algo que revele se o e-mail existe na base.
const MENSAGEM_SUCESSO =
  "Se o e-mail estiver cadastrado, enviamos as instruções para redefinir a senha."

// Fallback para falha que não é a resposta 200 do contrato (rede fora do
// ar, erro 5xx) — o contrato não define um caso de erro para este endpoint.
const MENSAGEM_ERRO_GENERICA =
  "Não foi possível processar sua solicitação. Tente novamente em instantes."

export function EsqueciSenhaForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const esqueciSenha = useEsqueciSenha()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaFormValues>({
    resolver: zodResolver(esqueciSenhaSchema),
  })

  // Loading cobre tanto a validação síncrona do RHF quanto a requisição em
  // si — campos e botão ficam desabilitados durante todo esse intervalo
  // (knowledge/frontend-feedback-ui.md, "Estado de carregamento").
  const enviando = isSubmitting || esqueciSenha.isPending

  function onSubmit(dados: EsqueciSenhaFormValues) {
    // Guarda de reentrância (mesmo padrão de SDD-006 em LoginForm/
    // CadastroForm) — evita uma segunda `mutate` antes do próximo re-render
    // desabilitar visualmente o botão.
    if (enviando) return
    esqueciSenha.mutate(dados)
  }

  if (esqueciSenha.isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-lg font-medium">Solicitação enviada!</p>
              <p className="text-sm text-muted-foreground">
                {MENSAGEM_SUCESSO}
              </p>
              <Link
                href="/login"
                className="text-sm underline underline-offset-4"
              >
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const erroServidor = esqueciSenha.isError
    ? esqueciSenha.error instanceof ApiError
      ? esqueciSenha.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Esqueci minha senha</CardTitle>
          <CardDescription>
            Informe seu e-mail cadastrado para receber as instruções de
            redefinição
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
                  disabled={enviando}
                />
                <FieldError
                  id="email-error"
                  errors={errors.email ? [errors.email] : undefined}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar instruções"}
                </Button>
                <FieldDescription className="text-center">
                  Lembrou a senha? <Link href="/login">Entrar</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

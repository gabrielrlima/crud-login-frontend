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
import { Separator } from "@/components/ui/separator"

import { GithubOAuthButton } from "./GithubOAuthButton"
import { useLogin } from "../hooks/useLogin"
import { loginSchema, type LoginFormValues } from "../types/login.schema"

// Tempo que a confirmação de sucesso fica visível antes do redirecionamento
// — dá espaço pro usuário ler a mensagem antes de sair da tela (ver
// knowledge/frontend-feedback-ui.md, "Feedback de sucesso": confirmação
// visual sempre antes de qualquer redirecionamento).
const REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500

// Rota de destino pós-login — home autenticada placeholder (spec não define
// nenhuma tela real além do login em si nesta funcionalidade; ver
// projeto-sdd/specs/SDD-005-login.md, "Fora do escopo").
const ROTA_APOS_SUCESSO = "/inicio"

// Mensagem de fallback para falha que não é a resposta 401 do contrato (ex.:
// rede fora do ar, erro 5xx). O erro esperado do contrato (401 —
// "Credenciais inválidas") já vem pronto do servidor via ApiError.message,
// exibido como está — nunca é reescrito ou trocado por um texto mais
// específico (RF02/RNF02: mesma resposta pra e-mail inexistente e senha
// errada, sem indicar qual dado está errado).
const MENSAGEM_ERRO_GENERICA =
  "Não foi possível entrar. Tente novamente em instantes."

interface LoginFormProps extends React.ComponentProps<"div"> {
  /**
   * Indica que o usuário chegou aqui redirecionado por uma sessão expirada
   * (ver `features/auth/services/session-interceptor.ts`). Calculado no
   * Server Component da rota (`app/(public)/login/page.tsx`) a partir de
   * `searchParams` e passado como prop — mantém este componente livre de
   * `useEffect`/leitura de `window` só para um aviso opcional, e evita
   * divergência entre o HTML renderizado no servidor e a primeira hidratação
   * no cliente.
   */
  sessaoExpirada?: boolean
}

export function LoginForm({
  className,
  sessaoExpirada = false,
  ...props
}: LoginFormProps) {
  const router = useRouter()
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // Loading cobre tanto a validação síncrona do RHF quanto a requisição em
  // si — campos e botão ficam desabilitados durante todo esse intervalo
  // (knowledge/frontend-feedback-ui.md, "Estado de carregamento").
  const enviando = isSubmitting || login.isPending

  function onSubmit(dados: LoginFormValues) {
    // Guarda explícita de reentrância (SDD-006/RF02): o `disabled` do botão
    // só é aplicado no próximo re-render, então um segundo evento de submit
    // (Enter repetido, duplo clique na mesma janela de evento) pode chegar
    // aqui antes disso. Sem este `return` antecipado, a segunda chamada
    // dispararia uma segunda `mutate` mesmo com o botão visualmente
    // desabilitado (ver `projeto-sdd/specs/SDD-006-prevenir-duplo-submit.md`).
    if (enviando) return

    login.mutate(dados, {
      onSuccess: () => {
        window.setTimeout(() => {
          router.push(ROTA_APOS_SUCESSO)
        }, REDIRECIONAMENTO_APOS_SUCESSO_MS)
      },
    })
  }

  if (login.isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-lg font-medium">Login realizado com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Redirecionando...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Erro de credenciais (401) chega pronto do servidor como
  // "Credenciais inválidas" (contrato fixado — ver POST /api/auth/login) —
  // exibido tal qual, nunca inline num campo específico, já que o contrato
  // não indica se o problema foi o e-mail ou a senha
  // (knowledge/frontend-feedback-ui.md, "Exibição de erro").
  const erroServidor = login.isError
    ? login.error instanceof ApiError
      ? login.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Entrar na conta</CardTitle>
          <CardDescription>
            Informe seu e-mail e senha para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login social (RF01, `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`)
              — acima do formulário de e-mail/senha, separado por um divisor
              visual "ou". */}
          <div className="mb-6 flex flex-col gap-6">
            <GithubOAuthButton />

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">ou</span>
              <Separator className="flex-1" />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {sessaoExpirada && !erroServidor && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
                >
                  Sua sessão expirou. Faça login novamente.
                </div>
              )}

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

              <Field data-invalid={!!errors.senha}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="senha">Senha</FieldLabel>
                  <Link
                    href="/esqueci-senha"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.senha}
                  aria-describedby={errors.senha ? "senha-error" : undefined}
                  {...register("senha")}
                  disabled={enviando}
                />
                <FieldError
                  id="senha-error"
                  errors={errors.senha ? [errors.senha] : undefined}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Entrando..." : "Entrar"}
                </Button>
                <FieldDescription className="text-center">
                  Não tem uma conta? <Link href="/cadastro">Criar conta</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

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
import { useCadastro } from "../hooks/useCadastro"
import { cadastroSchema, type CadastroFormValues } from "../types/cadastro.schema"

// Tempo que a confirmação de sucesso fica visível antes do redirecionamento
// — dá espaço pro usuário ler a mensagem antes de sair da tela (ver
// knowledge/frontend-feedback-ui.md, "Feedback de sucesso": confirmação
// visual sempre antes de qualquer redirecionamento).
const REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500

const MENSAGEM_ERRO_GENERICA =
  "Não foi possível concluir o cadastro. Tente novamente em instantes."

export function CadastroForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const cadastro = useCadastro()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
  })

  // Loading cobre tanto a validação síncrona do RHF quanto a requisição em
  // si — campos e botão ficam desabilitados durante todo esse intervalo
  // (knowledge/frontend-feedback-ui.md, "Estado de carregamento").
  const enviando = isSubmitting || cadastro.isPending

  function onSubmit(dados: CadastroFormValues) {
    // Guarda explícita de reentrância (SDD-006/RF02): o `disabled` do botão
    // só é aplicado no próximo re-render, então um segundo evento de submit
    // (Enter repetido, duplo clique na mesma janela de evento) pode chegar
    // aqui antes disso. Sem este `return` antecipado, a segunda chamada
    // dispararia uma segunda `mutate` mesmo com o botão visualmente
    // desabilitado (ver `projeto-sdd/specs/SDD-006-prevenir-duplo-submit.md`).
    if (enviando) return

    cadastro.mutate(dados, {
      onSuccess: () => {
        window.setTimeout(() => {
          router.push("/login")
        }, REDIRECIONAMENTO_APOS_SUCESSO_MS)
      },
    })
  }

  // Sucesso: sem login automático (ver SDD-004, seção "Fora do escopo") —
  // troca o card pela confirmação e só então redireciona para /login (SDD-005).
  if (cadastro.isSuccess) {
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
                Cadastro realizado com sucesso!
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

  const erroServidor = cadastro.isError
    ? cadastro.error instanceof ApiError
      ? cadastro.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para se cadastrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login social (RF01, `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`)
              — acima do formulário existente, separado por um divisor
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
              {/* Erro que não aponta pra um campo específico (falha genérica
                  do servidor, ou mensagem do backend sem campo associado no
                  contrato — ver POST /api/auth/cadastro, 400): banner acima
                  do formulário, nunca inline num campo que não é a causa real
                  (knowledge/frontend-feedback-ui.md, "Exibição de erro"). */}
              {erroServidor && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {erroServidor}
                </div>
              )}

              <Field data-invalid={!!errors.nome}>
                <FieldLabel htmlFor="nome">Nome</FieldLabel>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? "nome-error" : undefined}
                  {...register("nome")}
                  disabled={enviando}
                />
                <FieldError
                  id="nome-error"
                  errors={errors.nome ? [errors.nome] : undefined}
                />
              </Field>

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
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.senha}
                  aria-describedby={
                    errors.senha
                      ? "senha-description senha-error"
                      : "senha-description"
                  }
                  {...register("senha")}
                  disabled={enviando}
                />
                <FieldDescription id="senha-description">
                  Mínimo de 8 caracteres, com ao menos uma letra e um número.
                </FieldDescription>
                <FieldError
                  id="senha-error"
                  errors={errors.senha ? [errors.senha] : undefined}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Cadastrando..." : "Criar conta"}
                </Button>
                <FieldDescription className="text-center">
                  Já tem uma conta? <Link href="/login">Entrar</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

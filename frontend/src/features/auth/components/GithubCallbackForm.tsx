"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { useGithubCallback } from "../hooks/useGithubCallback"
import { AutorizacaoGithubInvalidaError } from "../services/github-oauth-callback"

// Tempo que a confirmação de sucesso fica visível antes do redirecionamento
// — mesmo intervalo/racional de `LoginForm`/`CadastroForm` (ver
// knowledge/frontend-feedback-ui.md, "Feedback de sucesso").
const REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500

// Mesmo destino pós-login do login local (`LoginForm`) — uma única sessão
// autenticada, independente do método usado para entrar (SDD-023, seção
// "Decisão de arquitetura").
const ROTA_APOS_SUCESSO = "/inicio"

// Mensagem de fallback para falha que não é nem `ApiError` (erro do
// contrato do backend) nem `AutorizacaoGithubInvalidaError` (validação local
// de state/code) — ex.: rede fora do ar.
const MENSAGEM_ERRO_GENERICA =
  "Não foi possível entrar com o GitHub. Tente novamente em instantes."

interface GithubCallbackFormProps extends React.ComponentProps<"div"> {
  /** `code` lido de `?code=` pela página (Server Component, `app/(public)/auth/github/callback/page.tsx`). */
  code: string | null
  /** `state` lido de `?state=` pela página — conferido contra `sessionStorage` por `useGithubCallback`. */
  state: string | null
  /**
   * `error` lido de `?error=` pela página — presente quando o usuário cancela
   * a autorização no GitHub (`error=access_denied`).
   */
  erroAutorizacao: string | null
}

export function GithubCallbackForm({
  className,
  code,
  state,
  erroAutorizacao,
  ...props
}: GithubCallbackFormProps) {
  const router = useRouter()
  const githubCallback = useGithubCallback()

  useEffect(() => {
    // Roda uma única vez, ao montar (deps vazio de propósito) — dispara a
    // troca do `code` (ou a rejeição local por `state` inválido, decidida
    // dentro do próprio `mutationFn`, ver `services/github-oauth-callback.ts`)
    // assim que a página carrega, sem exigir clique do usuário. Sem
    // `setState` próprio aqui — todo o estado reativo vem da mutation
    // (`isPending`/`isSuccess`/`isError`), então não há o que a regra de
    // lint `react-hooks/set-state-in-effect` possa reclamar.
    githubCallback.mutate(
      { code, state, erroAutorizacao },
      {
        onSuccess: () => {
          window.setTimeout(() => {
            router.push(ROTA_APOS_SUCESSO)
          }, REDIRECIONAMENTO_APOS_SUCESSO_MS)
        },
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda só uma vez, ao montar (ver comentário acima)
  }, [])

  if (githubCallback.isSuccess) {
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

  // Erro do backend (400 — ver `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`,
  // "Backend") e erro de
  // validação local (`state`/`code` ausente ou divergente, ou usuário
  // cancelou no GitHub — RNF02) são exibidos da mesma forma: mensagem
  // pronta, link de volta pro login. A distinção entre os dois já aconteceu
  // antes de chegar aqui (dentro de `autenticarComGithubCallback`, que só
  // chama o backend quando a autorização é válida).
  const erroExibido = githubCallback.isError
    ? githubCallback.error instanceof ApiError ||
      githubCallback.error instanceof AutorizacaoGithubInvalidaError
      ? githubCallback.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  if (erroExibido) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardContent>
            <div
              role="alert"
              aria-live="assertive"
              className="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p className="text-sm text-destructive">{erroExibido}</p>
              <p className="text-sm text-muted-foreground">
                <Link href="/login">Voltar para o login</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado transitório: cobre tanto o instante entre a montagem e a mutation
  // resolver, quanto a requisição em andamento (`isPending`) —
  // knowledge/frontend-feedback-ui.md, "Estado de carregamento".
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Entrando com o GitHub</CardTitle>
          <CardDescription>Aguarde só um instante...</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-2 py-6 text-center"
          >
            <p className="text-sm text-muted-foreground">Verificando sua conta do GitHub...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

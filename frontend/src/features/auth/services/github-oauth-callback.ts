import { loginGithub, type LoginResponse } from "./auth.service"
import { GITHUB_OAUTH_STATE_KEY } from "./github-oauth"

/**
 * Orquestra o retorno do fluxo OAuth do GitHub em `/auth/github/callback`
 * (`projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`, "Frontend"/"Casos de
 * borda"): confere o `state` recebido contra o valor salvo em
 * `sessionStorage` (proteção CSRF, RNF02) *antes* de decidir se
 * `POST /api/auth/login/github` chega a ser chamado — nunca chama o backend
 * quando a autorização é inválida (usuário cancelou no GitHub, ou o `state`
 * está ausente/divergente).
 *
 * Validação isolada aqui (não dentro do componente) por dois motivos: (1)
 * mantém `GithubCallbackForm` livre de estado local próprio — o único estado
 * reativo do componente é o da mutation que usa esta função como
 * `mutationFn` (`hooks/useGithubCallback.ts`), evitando `setState` síncrono
 * dentro de `useEffect` (regra de lint `react-hooks/set-state-in-effect`,
 * ver comentário em `GithubCallbackForm.tsx`); (2) é testável isoladamente,
 * sem `render()`, mesmo racional de `withSessionHandling`
 * (`session-interceptor.ts`) e `iniciarAutenticacaoGithub`
 * (`github-oauth.ts`).
 */
export class AutorizacaoGithubInvalidaError extends Error {
  constructor() {
    super("Não foi possível concluir a autenticação com o GitHub.")
    this.name = "AutorizacaoGithubInvalidaError"
  }
}

export interface AutenticarComGithubCallbackParams {
  /** `code` lido de `?code=` da query string do callback. */
  code: string | null
  /** `state` lido de `?state=` da query string do callback. */
  state: string | null
  /** `error` lido de `?error=` — presente quando o usuário cancela a autorização (`access_denied`). */
  erroAutorizacao: string | null
}

export async function autenticarComGithubCallback({
  code,
  state,
  erroAutorizacao,
}: AutenticarComGithubCallbackParams): Promise<LoginResponse> {
  // Valor de uso único — removido de `sessionStorage` independente do
  // resultado da comparação abaixo, válida ou não.
  const stateGuardado = window.sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY)
  window.sessionStorage.removeItem(GITHUB_OAUTH_STATE_KEY)

  if (
    erroAutorizacao ||
    !code ||
    !state ||
    !stateGuardado ||
    state !== stateGuardado
  ) {
    throw new AutorizacaoGithubInvalidaError()
  }

  return loginGithub({ code })
}

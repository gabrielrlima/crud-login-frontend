/**
 * Início do fluxo OAuth 2.0 Authorization Code do GitHub, do lado do
 * navegador (RF01/RF02, `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`).
 *
 * Por que uma função isolada, testável sem `render()`/Testing Library — mesmo
 * racional de `withSessionHandling` em `session-interceptor.ts`: é um efeito
 * colateral puro (gerar `state`, gravar em `sessionStorage`, navegar), sem
 * nenhuma lógica de UI, então não precisa de um componente montado para ser
 * exercitado em teste.
 *
 * Decisão de arquitetura (SDD-023, seção "Decisão de arquitetura"): o front-end só
 * redireciona para a tela de autorização do GitHub — não troca o `code` por
 * token nem fala com a API do GitHub diretamente (isso é responsabilidade do
 * back-end, `POST /api/auth/login/github`, ver `services/auth.service.ts`).
 */

/**
 * Chave de `sessionStorage` onde o `state` gerado aqui é guardado, para ser
 * conferido de volta em `/auth/github/callback` (proteção CSRF, RNF02) —
 * exportado para o hook/componente de callback ler e limpar o mesmo valor.
 */
export const GITHUB_OAUTH_STATE_KEY = "github_oauth_state"

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"

/** Escopo mínimo necessário para obter o e-mail do usuário quando ele não é público (spec, "Backend"). */
const GITHUB_OAUTH_SCOPE = "user:email"

/** Rota pública que recebe `code`/`state` de volta do GitHub (spec, "Frontend"). */
const GITHUB_CALLBACK_PATH = "/auth/github/callback"

/**
 * Gera um `state` aleatório, grava em `sessionStorage` e redireciona o
 * navegador para a tela de autorização do GitHub, com `client_id`,
 * `redirect_uri` (origin atual + `/auth/github/callback`), `scope=user:email`
 * e o `state` gerado.
 *
 * `NEXT_PUBLIC_GITHUB_CLIENT_ID` não é segredo (Client ID de OAuth App é
 * público por design) — o Client Secret correspondente nunca é exposto ao
 * front-end, fica só na configuração do back-end (`GithubOAuthSettings`, ver
 * `.env.local.example` para o comentário completo).
 */
export function iniciarAutenticacaoGithub(): void {
  const state = crypto.randomUUID()
  window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, state)

  const redirectUri = `${window.location.origin}${GITHUB_CALLBACK_PATH}`

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    scope: GITHUB_OAUTH_SCOPE,
    state,
  })

  window.location.href = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
}

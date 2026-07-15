/**
 * Cliente HTTP base do front-end — wrapper fino sobre fetch nativo.
 *
 * Lê a URL base da API via `NEXT_PUBLIC_API_URL` (default
 * `http://localhost:8080`, backend exposto nessa porta em desenvolvimento).
 *
 * Não implementa nenhuma regra de domínio (cadastro, login) — isso é
 * responsabilidade de `features/auth/services`, conforme
 * `knowledge/frontend-arquitetura.md`. Este módulo só resolve o que é
 * transversal a qualquer chamada:
 *   - montar a URL a partir do path;
 *   - serializar/desserializar JSON;
 *   - anexar o header `Authorization: Bearer <token>` em rotas autenticadas;
 *   - normalizar erros da API no formato do contrato fixado com o backend
 *     (corpo de erro sempre `{ "erro": string }`, ex.:
 *     `POST /api/auth/cadastro` → 400, `POST /api/auth/login` → 401).
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

/** Formato de erro retornado pela API (contrato fixado com o backend). */
interface ApiErrorBody {
  erro: string
}

/** Erro lançado pelo cliente HTTP quando a API responde com status de erro. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export interface ApiClientOptions
  extends Omit<RequestInit, "body" | "method"> {
  /** Token JWT para rotas autenticadas — vira `Authorization: Bearer <token>`. */
  token?: string
}

async function request<TResponse>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options: ApiClientOptions = {}
): Promise<TResponse> {
  const { token, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Corpo pode vir vazio (ex.: 204) — evita `JSON.parse` explodir em string vazia.
  const raw = await response.text()
  const data = raw ? JSON.parse(raw) : undefined

  if (!response.ok) {
    // Contrato: corpo de erro sempre `{ erro: string }`. 401 de rota autenticada
    // não detalha o motivo (token ausente/expirado/malformado) — mensagem
    // genérica de fallback cobre esse caso quando o corpo não vem preenchido.
    const message =
      (data as ApiErrorBody | undefined)?.erro ?? response.statusText
    throw new ApiError(response.status, message)
  }

  return data as TResponse
}

/** Cliente HTTP genérico — base para os services de cada feature. */
export const apiClient = {
  get: <TResponse>(path: string, options?: ApiClientOptions) =>
    request<TResponse>("GET", path, undefined, options),

  post: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiClientOptions
  ) => request<TResponse>("POST", path, body, options),

  put: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiClientOptions
  ) => request<TResponse>("PUT", path, body, options),

  patch: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiClientOptions
  ) => request<TResponse>("PATCH", path, body, options),

  delete: <TResponse>(path: string, options?: ApiClientOptions) =>
    request<TResponse>("DELETE", path, undefined, options),
}

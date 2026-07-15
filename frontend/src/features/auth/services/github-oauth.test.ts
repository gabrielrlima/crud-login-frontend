import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { iniciarAutenticacaoGithub, GITHUB_OAUTH_STATE_KEY } from "./github-oauth"

/**
 * Testa `iniciarAutenticacaoGithub` isoladamente, sem `render()`/Testing
 * Library — mesmo racional de `session-interceptor.test.ts`: efeito
 * colateral puro, exercitado chamando a função diretamente. `window.location`
 * é substituído por um objeto controlado (jsdom não implementa navegação
 * real — ver JSDoc de `session-interceptor.ts`).
 */
function mockWindowLocation() {
  const location = { href: "", origin: "https://app.exemplo.com" }
  Object.defineProperty(window, "location", {
    value: location,
    writable: true,
    configurable: true,
  })
  return location
}

beforeEach(() => {
  mockWindowLocation()
  window.sessionStorage.clear()
  vi.stubEnv("NEXT_PUBLIC_GITHUB_CLIENT_ID", "client-id-de-teste")
  vi.spyOn(crypto, "randomUUID").mockReturnValue(
    "11111111-1111-4111-8111-111111111111"
  )
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("iniciarAutenticacaoGithub", () => {
  it("grava o state gerado em sessionStorage", () => {
    iniciarAutenticacaoGithub()

    expect(window.sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY)).toBe(
      "11111111-1111-4111-8111-111111111111"
    )
  })

  it("redireciona para a URL de autorização do GitHub com os parâmetros corretos", () => {
    iniciarAutenticacaoGithub()

    const url = new URL(window.location.href)

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://github.com/login/oauth/authorize"
    )
    expect(url.searchParams.get("client_id")).toBe("client-id-de-teste")
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://app.exemplo.com/auth/github/callback"
    )
    expect(url.searchParams.get("scope")).toBe("user:email")
    expect(url.searchParams.get("state")).toBe(
      "11111111-1111-4111-8111-111111111111"
    )
  })

  it("usa string vazia como client_id quando a variável de ambiente não está definida", () => {
    vi.stubEnv("NEXT_PUBLIC_GITHUB_CLIENT_ID", "")

    iniciarAutenticacaoGithub()

    const url = new URL(window.location.href)
    expect(url.searchParams.get("client_id")).toBe("")
  })
})

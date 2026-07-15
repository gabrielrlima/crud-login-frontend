import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useGithubCallback } from "./useGithubCallback"
import { useAuthStore } from "../store/auth-store"
import { autenticarComGithubCallback } from "../services/github-oauth-callback"

/**
 * `autenticarComGithubCallback` (validação de state/code + chamada ao
 * backend) já tem cobertura própria e isolada em
 * `github-oauth-callback.test.ts` — aqui só se testa a ligação entre a
 * mutation e o store de autenticação (`setToken` ao receber o token), que
 * não é exercitada por `GithubCallbackForm.test.tsx` (lá o hook inteiro é
 * mockado, mesmo padrão de `LoginForm.test.tsx`).
 */
vi.mock("../services/github-oauth-callback", async () => {
  const actual = await vi.importActual<
    typeof import("../services/github-oauth-callback")
  >("../services/github-oauth-callback")
  return {
    ...actual,
    autenticarComGithubCallback: vi.fn(),
  }
})

const autenticarComGithubCallbackMock = vi.mocked(autenticarComGithubCallback)

function renderComQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })

  return renderHook(() => useGithubCallback(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ token: null, isAuthenticated: false })
})

describe("useGithubCallback", () => {
  it("grava o token no store de autenticação ao concluir com sucesso", async () => {
    autenticarComGithubCallbackMock.mockResolvedValue({ token: "jwt-fake" })
    const { result } = renderComQueryClient()

    result.current.mutate({
      code: "codigo-do-github",
      state: "state-qualquer",
      erroAutorizacao: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().token).toBe("jwt-fake")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it("não grava token quando a autenticação falha", async () => {
    autenticarComGithubCallbackMock.mockRejectedValue(new Error("falhou"))
    const { result } = renderComQueryClient()

    result.current.mutate({
      code: "codigo-do-github",
      state: "state-qualquer",
      erroAutorizacao: null,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

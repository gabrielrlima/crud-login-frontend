import { describe, it, expect, beforeEach, vi } from "vitest"

import { ApiError } from "@/lib/api-client"

import { useAuthStore } from "../store/auth-store"
import {
  withSessionHandling,
  SESSAO_EXPIRADA_QUERY_PARAM,
  SESSAO_EXPIRADA_QUERY_VALUE,
} from "./session-interceptor"

/**
 * Testa `withSessionHandling` isoladamente, sem `render()`/Testing Library —
 * ver o JSDoc da própria função em `session-interceptor.ts` (SDD-010):
 * assinatura genérica `(request: () => Promise<T>) => Promise<T>`, chamada
 * diretamente com um `request` mockado. `window.location` é substituído por
 * um objeto controlado antes de cada teste, conforme documentado ali.
 */
function mockWindowLocation() {
  const location = { href: "" }
  Object.defineProperty(window, "location", {
    value: location,
    writable: true,
    configurable: true,
  })
  return location
}

beforeEach(() => {
  useAuthStore.setState({ token: "token-inicial", isAuthenticated: true })
  mockWindowLocation()
})

describe("withSessionHandling", () => {
  it("retorna o valor resolvido quando o request tem sucesso, sem mexer na sessão", async () => {
    const request = vi.fn().mockResolvedValue({ dado: "ok" })

    await expect(withSessionHandling(request)).resolves.toEqual({
      dado: "ok",
    })

    expect(useAuthStore.getState().token).toBe("token-inicial")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(window.location.href).toBe("")
  })

  it("limpa o token do store e redireciona para /login quando o request rejeita com ApiError 401", async () => {
    const erro401 = new ApiError(401, "Não autorizado")
    const request = vi.fn().mockRejectedValue(erro401)

    await expect(withSessionHandling(request)).rejects.toBe(erro401)

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(window.location.href).toBe(
      `/login?${SESSAO_EXPIRADA_QUERY_PARAM}=${SESSAO_EXPIRADA_QUERY_VALUE}`
    )
  })

  it("não limpa a sessão nem redireciona quando o erro é ApiError mas não é 401", async () => {
    const erro500 = new ApiError(500, "Erro interno do servidor")
    const request = vi.fn().mockRejectedValue(erro500)

    await expect(withSessionHandling(request)).rejects.toBe(erro500)

    expect(useAuthStore.getState().token).toBe("token-inicial")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(window.location.href).toBe("")
  })

  it("não limpa a sessão nem redireciona quando o erro não é ApiError", async () => {
    const erroGenerico = new Error("falha de rede")
    const request = vi.fn().mockRejectedValue(erroGenerico)

    await expect(withSessionHandling(request)).rejects.toBe(erroGenerico)

    expect(useAuthStore.getState().token).toBe("token-inicial")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(window.location.href).toBe("")
  })
})

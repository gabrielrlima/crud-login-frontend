import { describe, it, expect, beforeEach, vi } from "vitest"

import {
  autenticarComGithubCallback,
  AutorizacaoGithubInvalidaError,
} from "./github-oauth-callback"
import { GITHUB_OAUTH_STATE_KEY } from "./github-oauth"
import { loginGithub } from "./auth.service"

/**
 * `loginGithub` (chamada HTTP real ao backend) é mockado — testa-se aqui só
 * a orquestração de `autenticarComGithubCallback` (validação de
 * `state`/`code`, decisão de chamar ou não o backend), não a integração real
 * com a API (mesmo racional de `session-interceptor.test.ts`).
 */
vi.mock("./auth.service", () => ({
  loginGithub: vi.fn(),
}))

const loginGithubMock = vi.mocked(loginGithub)

const STATE_VALIDO = "state-salvo-antes-do-redirect"

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
})

describe("autenticarComGithubCallback", () => {
  describe("proteção contra CSRF (RNF02) — sem chamar o backend", () => {
    it("rejeita sem chamar o backend quando o state diverge do guardado em sessionStorage", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)

      await expect(
        autenticarComGithubCallback({
          code: "codigo-do-github",
          state: "state-diferente",
          erroAutorizacao: null,
        })
      ).rejects.toBeInstanceOf(AutorizacaoGithubInvalidaError)

      expect(loginGithubMock).not.toHaveBeenCalled()
    })

    it("rejeita sem chamar o backend quando não há state salvo em sessionStorage", async () => {
      await expect(
        autenticarComGithubCallback({
          code: "codigo-do-github",
          state: "algum-state",
          erroAutorizacao: null,
        })
      ).rejects.toBeInstanceOf(AutorizacaoGithubInvalidaError)

      expect(loginGithubMock).not.toHaveBeenCalled()
    })

    it("rejeita sem chamar o backend quando o code está ausente", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)

      await expect(
        autenticarComGithubCallback({
          code: null,
          state: STATE_VALIDO,
          erroAutorizacao: null,
        })
      ).rejects.toBeInstanceOf(AutorizacaoGithubInvalidaError)

      expect(loginGithubMock).not.toHaveBeenCalled()
    })

    it("rejeita sem chamar o backend quando o state está ausente", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)

      await expect(
        autenticarComGithubCallback({
          code: "codigo-do-github",
          state: null,
          erroAutorizacao: null,
        })
      ).rejects.toBeInstanceOf(AutorizacaoGithubInvalidaError)

      expect(loginGithubMock).not.toHaveBeenCalled()
    })

    it("rejeita sem chamar o backend quando o usuário cancela a autorização no GitHub (error=access_denied)", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)

      await expect(
        autenticarComGithubCallback({
          code: null,
          state: STATE_VALIDO,
          erroAutorizacao: "access_denied",
        })
      ).rejects.toBeInstanceOf(AutorizacaoGithubInvalidaError)

      expect(loginGithubMock).not.toHaveBeenCalled()
    })

    it("remove o state de sessionStorage mesmo quando a autorização é inválida (uso único)", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)

      await expect(
        autenticarComGithubCallback({
          code: "codigo-do-github",
          state: "state-diferente",
          erroAutorizacao: null,
        })
      ).rejects.toBeInstanceOf(AutorizacaoGithubInvalidaError)

      expect(window.sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY)).toBeNull()
    })
  })

  describe("autorização válida", () => {
    it("chama o backend com o code recebido quando o state bate com o guardado", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)
      loginGithubMock.mockResolvedValue({ token: "jwt-fake" })

      const resultado = await autenticarComGithubCallback({
        code: "codigo-do-github",
        state: STATE_VALIDO,
        erroAutorizacao: null,
      })

      expect(loginGithubMock).toHaveBeenCalledWith({ code: "codigo-do-github" })
      expect(resultado).toEqual({ token: "jwt-fake" })
    })

    it("consome (remove) o state de sessionStorage após validar com sucesso", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)
      loginGithubMock.mockResolvedValue({ token: "jwt-fake" })

      await autenticarComGithubCallback({
        code: "codigo-do-github",
        state: STATE_VALIDO,
        erroAutorizacao: null,
      })

      expect(window.sessionStorage.getItem(GITHUB_OAUTH_STATE_KEY)).toBeNull()
    })

    it("propaga o erro do backend (ApiError) quando a troca falha", async () => {
      window.sessionStorage.setItem(GITHUB_OAUTH_STATE_KEY, STATE_VALIDO)
      const erro400 = new Error("Já existe uma conta com este e-mail. Faça login com e-mail e senha.")
      loginGithubMock.mockRejectedValue(erro400)

      await expect(
        autenticarComGithubCallback({
          code: "codigo-do-github",
          state: STATE_VALIDO,
          erroAutorizacao: null,
        })
      ).rejects.toBe(erro400)
    })
  })
})

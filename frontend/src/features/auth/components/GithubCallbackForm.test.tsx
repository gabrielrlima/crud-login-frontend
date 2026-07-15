import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

import { ApiError } from "@/lib/api-client"

import { GithubCallbackForm } from "./GithubCallbackForm"
import { useGithubCallback } from "../hooks/useGithubCallback"
import { AutorizacaoGithubInvalidaError } from "../services/github-oauth-callback"

/**
 * `useGithubCallback` (TanStack Query) é mockado em todo este arquivo — mesma
 * justificativa de `LoginForm.test.tsx`/`CadastroForm.test.tsx`: teste de
 * unidade/componente, não integração real com o backend. A validação de
 * `state`/`code` contra `sessionStorage` (RNF02) e a decisão de chamar ou não
 * o backend vivem em `autenticarComGithubCallback`
 * (`services/github-oauth-callback.ts`) — testadas isoladamente em
 * `github-oauth-callback.test.ts`, sem `render()`.
 */
vi.mock("../hooks/useGithubCallback", () => ({
  useGithubCallback: vi.fn(),
}))

const push = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const useGithubCallbackMock = vi.mocked(useGithubCallback)

type GithubCallbackMutation = ReturnType<typeof useGithubCallback>

/** Constrói um retorno mockado de `useGithubCallback` com os campos que o componente lê. */
function mockGithubCallback(overrides: Partial<GithubCallbackMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as GithubCallbackMutation

  useGithubCallbackMock.mockReturnValue(mutation)
  return mutation
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGithubCallback()
})

describe("GithubCallbackForm", () => {
  describe("ao montar", () => {
    it("chama a mutation uma única vez com code/state/erroAutorizacao recebidos da página", () => {
      const mutation = mockGithubCallback()

      render(
        <GithubCallbackForm
          code="codigo-do-github"
          state="state-qualquer"
          erroAutorizacao={null}
        />
      )

      expect(mutation.mutate).toHaveBeenCalledTimes(1)
      expect(mutation.mutate).toHaveBeenCalledWith(
        {
          code: "codigo-do-github",
          state: "state-qualquer",
          erroAutorizacao: null,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })
  })

  describe("estado de carregamento", () => {
    it("mostra um status de verificação enquanto a mutation está pendente", () => {
      mockGithubCallback({ isPending: true })

      render(
        <GithubCallbackForm code="codigo" state="state" erroAutorizacao={null} />
      )

      expect(screen.getByRole("status")).toHaveTextContent(
        "Verificando sua conta do GitHub..."
      )
    })
  })

  describe("sucesso", () => {
    it("mostra a confirmação de sucesso em vez do formulário", () => {
      mockGithubCallback({ isSuccess: true })

      render(
        <GithubCallbackForm code="codigo" state="state" erroAutorizacao={null} />
      )

      expect(screen.getByRole("status")).toHaveTextContent(
        "Login realizado com sucesso!"
      )
    })

    it("redireciona para /inicio somente depois do intervalo de confirmação", async () => {
      const mutation = mockGithubCallback({
        mutate: vi.fn((_dados, options) => {
          options?.onSuccess?.({ token: "jwt-fake" }, _dados, undefined)
        }),
      })

      vi.useFakeTimers()
      try {
        render(
          <GithubCallbackForm code="codigo" state="state" erroAutorizacao={null} />
        )

        expect(mutation.mutate).toHaveBeenCalledTimes(1)
        expect(push).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1500)

        expect(push).toHaveBeenCalledWith("/inicio")
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe("autorização inválida (state divergente/ausente, ou cancelado no GitHub)", () => {
    it("mostra a mensagem genérica de autorização inválida com link para /login", () => {
      mockGithubCallback({
        isError: true,
        error: new AutorizacaoGithubInvalidaError(),
      })

      render(
        <GithubCallbackForm code={null} state={null} erroAutorizacao="access_denied" />
      )

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível concluir a autenticação com o GitHub."
      )
      expect(
        screen.getByRole("link", { name: "Voltar para o login" })
      ).toHaveAttribute("href", "/login")
    })
  })

  describe("erro do backend (400)", () => {
    it("mostra a mensagem retornada pelo backend (ApiError) com link para /login", () => {
      mockGithubCallback({
        isError: true,
        error: new ApiError(
          400,
          "Já existe uma conta com este e-mail. Faça login com e-mail e senha."
        ),
      })

      render(
        <GithubCallbackForm code="codigo" state="state" erroAutorizacao={null} />
      )

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Já existe uma conta com este e-mail. Faça login com e-mail e senha."
      )
      expect(
        screen.getByRole("link", { name: "Voltar para o login" })
      ).toHaveAttribute("href", "/login")
    })

    it("mostra mensagem genérica de fallback quando o erro não é ApiError nem AutorizacaoGithubInvalidaError", () => {
      mockGithubCallback({
        isError: true,
        error: new Error("falha de rede"),
      })

      render(
        <GithubCallbackForm code="codigo" state="state" erroAutorizacao={null} />
      )

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível entrar com o GitHub. Tente novamente em instantes."
      )
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { RedefinirSenhaForm } from "./RedefinirSenhaForm"
import { useRedefinirSenha } from "../hooks/useRedefinirSenha"

/**
 * `useRedefinirSenha` (TanStack Mutation) é mockado em todo este arquivo —
 * mesma justificativa de `LoginForm.test.tsx`/`CadastroForm.test.tsx`: aqui
 * é teste de unidade/componente, não integração real com o backend.
 */
vi.mock("../hooks/useRedefinirSenha", () => ({
  useRedefinirSenha: vi.fn(),
}))

const push = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const useRedefinirSenhaMock = vi.mocked(useRedefinirSenha)

type RedefinirSenhaMutation = ReturnType<typeof useRedefinirSenha>

/** Constrói um retorno mockado de `useRedefinirSenha` com os campos que o componente lê. */
function mockRedefinir(overrides: Partial<RedefinirSenhaMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as RedefinirSenhaMutation

  useRedefinirSenhaMock.mockReturnValue(mutation)
  return mutation
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRedefinir()
})

describe("RedefinirSenhaForm", () => {
  describe("sem token na URL", () => {
    it("mostra link inválido e não renderiza o formulário", () => {
      render(<RedefinirSenhaForm token={null} />)

      expect(screen.getByText("Link inválido")).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: "Solicitar um novo link" })
      ).toHaveAttribute("href", "/esqueci-senha")
      expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument()
    })
  })

  describe("validação client-side (Zod) — mesma força de senha do cadastro", () => {
    it("mostra mensagem inline quando a senha é muito curta", async () => {
      const user = userEvent.setup()
      render(<RedefinirSenhaForm token="token-valido" />)

      await user.type(screen.getByLabelText("Nova senha"), "abc123")
      fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))

      expect(
        await screen.findByText("A senha deve ter no mínimo 8 caracteres.")
      ).toBeInTheDocument()
      expect(mockRedefinir().mutate).not.toHaveBeenCalled()
    })

    it("rejeita senha sem número", async () => {
      const user = userEvent.setup()
      render(<RedefinirSenhaForm token="token-valido" />)

      await user.type(screen.getByLabelText("Nova senha"), "somenteletras")
      fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))

      expect(
        await screen.findByText("A senha deve conter ao menos um número.")
      ).toBeInTheDocument()
    })

    it("rejeita senha sem letra", async () => {
      const user = userEvent.setup()
      render(<RedefinirSenhaForm token="token-valido" />)

      await user.type(screen.getByLabelText("Nova senha"), "12345678")
      fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))

      expect(
        await screen.findByText("A senha deve conter ao menos uma letra.")
      ).toBeInTheDocument()
    })
  })

  describe("estado de carregamento", () => {
    it("desabilita campo e botão durante o envio", () => {
      mockRedefinir({ isPending: true })
      render(<RedefinirSenhaForm token="token-valido" />)

      expect(screen.getByLabelText("Nova senha")).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Redefinindo..." })
      ).toBeDisabled()
    })
  })

  describe("duplo submit", () => {
    it("ignora um segundo submit enquanto o envio anterior está em andamento", async () => {
      const mutation = mockRedefinir({ isPending: false })
      const { container, rerender } = render(
        <RedefinirSenhaForm token="token-valido" />
      )

      const user = userEvent.setup()
      await user.type(screen.getByLabelText("Nova senha"), "senha123")

      const form = container.querySelector("form")
      if (!form) throw new Error("formulário não encontrado")

      fireEvent.submit(form)
      await waitFor(() => expect(mutation.mutate).toHaveBeenCalledTimes(1))

      mockRedefinir({ isPending: true, mutate: mutation.mutate })
      rerender(<RedefinirSenhaForm token="token-valido" />)

      fireEvent.submit(form)

      expect(mutation.mutate).toHaveBeenCalledTimes(1)
    })
  })

  describe("envio", () => {
    it("chama a mutation com o token da URL e a nova senha informada", async () => {
      const mutation = mockRedefinir()
      const user = userEvent.setup()
      render(<RedefinirSenhaForm token="token-da-url" />)

      await user.type(screen.getByLabelText("Nova senha"), "senha123")
      fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }))

      await waitFor(() =>
        expect(mutation.mutate).toHaveBeenCalledWith(
          { token: "token-da-url", novaSenha: "senha123" },
          expect.anything()
        )
      )
    })
  })

  describe("erro do servidor", () => {
    it("exibe erro de token inválido/expirado como banner", () => {
      mockRedefinir({
        isError: true,
        error: new ApiError(400, "Link de redefinição inválido ou expirado."),
      })
      render(<RedefinirSenhaForm token="token-expirado" />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Link de redefinição inválido ou expirado."
      )
    })

    it("exibe erro de senha fora do padrão como banner", () => {
      mockRedefinir({
        isError: true,
        error: new ApiError(400, "Senha fora do padrão exigido."),
      })
      render(<RedefinirSenhaForm token="token-valido" />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Senha fora do padrão exigido."
      )
    })

    it("exibe mensagem genérica de fallback quando o erro não é ApiError", () => {
      mockRedefinir({
        isError: true,
        error: new Error("falha de rede"),
      })
      render(<RedefinirSenhaForm token="token-valido" />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível redefinir sua senha. Tente novamente em instantes."
      )
    })
  })

  describe("sucesso", () => {
    it("mostra a confirmação de sucesso em vez do formulário", () => {
      mockRedefinir({ isSuccess: true })
      render(<RedefinirSenhaForm token="token-valido" />)

      expect(screen.getByRole("status")).toHaveTextContent(
        "Senha redefinida com sucesso!"
      )
      expect(
        screen.queryByRole("button", { name: "Redefinir senha" })
      ).not.toBeInTheDocument()
    })

    it("redireciona para /login somente depois do intervalo de confirmação", async () => {
      const mutation = mockRedefinir({
        isPending: false,
        mutate: vi.fn((_dados, options) => {
          options?.onSuccess?.(
            { mensagem: "Senha redefinida com sucesso." },
            _dados,
            undefined
          )
        }),
      })
      const { container } = render(<RedefinirSenhaForm token="token-valido" />)

      fireEvent.change(screen.getByLabelText("Nova senha"), {
        target: { value: "senha123" },
      })

      vi.useFakeTimers()
      try {
        const form = container.querySelector("form")
        if (!form) throw new Error("formulário não encontrado")
        fireEvent.submit(form)

        await vi.advanceTimersByTimeAsync(0)
        expect(mutation.mutate).toHaveBeenCalledTimes(1)
        expect(push).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1500)

        expect(push).toHaveBeenCalledWith("/login")
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

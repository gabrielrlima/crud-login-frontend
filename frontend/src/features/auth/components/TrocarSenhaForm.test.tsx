import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { TrocarSenhaForm } from "./TrocarSenhaForm"
import { useTrocarSenha } from "../hooks/useTrocarSenha"

/**
 * `useTrocarSenha` (TanStack Mutation) é mockado em todo este arquivo —
 * mesma justificativa de `LoginForm.test.tsx`.
 */
vi.mock("../hooks/useTrocarSenha", () => ({
  useTrocarSenha: vi.fn(),
}))

const push = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const useTrocarSenhaMock = vi.mocked(useTrocarSenha)

type TrocarSenhaMutation = ReturnType<typeof useTrocarSenha>

/** Constrói um retorno mockado de `useTrocarSenha` com os campos que o componente lê. */
function mockTrocarSenha(overrides: Partial<TrocarSenhaMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as TrocarSenhaMutation

  useTrocarSenhaMock.mockReturnValue(mutation)
  return mutation
}

async function preencherFormularioValido() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Senha atual"), "senhaAtual123")
  await user.type(screen.getByLabelText("Nova senha"), "novaSenha123")
  await user.type(
    screen.getByLabelText("Confirmar nova senha"),
    "novaSenha123"
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockTrocarSenha()
})

describe("TrocarSenhaForm", () => {
  describe("validação client-side (Zod)", () => {
    it("mostra mensagens inline quando os campos obrigatórios estão vazios", async () => {
      render(<TrocarSenhaForm />)

      fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }))

      expect(
        await screen.findByText("Senha atual é obrigatória.")
      ).toBeInTheDocument()
      expect(
        screen.getByText("A senha deve ter no mínimo 8 caracteres.")
      ).toBeInTheDocument()
      expect(mockTrocarSenha().mutate).not.toHaveBeenCalled()
    })

    it("rejeita quando a confirmação não coincide com a nova senha", async () => {
      const user = userEvent.setup()
      render(<TrocarSenhaForm />)

      await user.type(screen.getByLabelText("Senha atual"), "senhaAtual123")
      await user.type(screen.getByLabelText("Nova senha"), "novaSenha123")
      await user.type(
        screen.getByLabelText("Confirmar nova senha"),
        "outraSenha123"
      )
      fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }))

      expect(
        await screen.findByText("As senhas não coincidem.")
      ).toBeInTheDocument()
      expect(mockTrocarSenha().mutate).not.toHaveBeenCalled()
    })
  })

  describe("estado de carregamento", () => {
    it("desabilita campos e botão durante o envio", () => {
      mockTrocarSenha({ isPending: true })
      render(<TrocarSenhaForm />)

      expect(screen.getByLabelText("Senha atual")).toBeDisabled()
      expect(screen.getByLabelText("Nova senha")).toBeDisabled()
      expect(screen.getByLabelText("Confirmar nova senha")).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Alterando..." })
      ).toBeDisabled()
    })
  })

  describe("envio", () => {
    it("chama a mutation só com senhaAtual e novaSenha (sem confirmarSenha)", async () => {
      const mutation = mockTrocarSenha()
      render(<TrocarSenhaForm />)
      await preencherFormularioValido()

      fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }))

      await waitFor(() =>
        expect(mutation.mutate).toHaveBeenCalledWith(
          { senhaAtual: "senhaAtual123", novaSenha: "novaSenha123" },
          expect.anything()
        )
      )
    })
  })

  describe("erro do servidor (400)", () => {
    it("exibe erro de senha atual incorreta como banner", () => {
      mockTrocarSenha({
        isError: true,
        error: new ApiError(400, "Senha atual incorreta."),
      })
      render(<TrocarSenhaForm />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Senha atual incorreta."
      )
    })

    it("exibe mensagem genérica de fallback quando o erro não é ApiError", () => {
      mockTrocarSenha({
        isError: true,
        error: new Error("falha de rede"),
      })
      render(<TrocarSenhaForm />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível trocar sua senha. Tente novamente em instantes."
      )
    })
  })

  describe("sucesso", () => {
    it("mostra a confirmação de sucesso em vez do formulário", () => {
      mockTrocarSenha({ isSuccess: true })
      render(<TrocarSenhaForm />)

      expect(screen.getByRole("status")).toHaveTextContent(
        "Senha alterada com sucesso!"
      )
      expect(
        screen.queryByRole("button", { name: "Alterar senha" })
      ).not.toBeInTheDocument()
    })

    it("redireciona para /login somente depois do intervalo de confirmação (SDD-018)", async () => {
      const mutation = mockTrocarSenha({
        isPending: false,
        mutate: vi.fn((_dados, options) => {
          options?.onSuccess?.(
            { mensagem: "Senha alterada com sucesso." },
            _dados,
            undefined
          )
        }),
      })
      render(<TrocarSenhaForm />)
      await preencherFormularioValido()

      vi.useFakeTimers()
      try {
        fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }))

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

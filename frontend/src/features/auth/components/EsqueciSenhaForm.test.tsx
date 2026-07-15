import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { EsqueciSenhaForm } from "./EsqueciSenhaForm"
import { useEsqueciSenha } from "../hooks/useEsqueciSenha"

/**
 * `useEsqueciSenha` (TanStack Query) é mockado em todo este arquivo — mesma
 * justificativa de `CadastroForm.test.tsx`/`LoginForm.test.tsx`: aqui é
 * teste de unidade/componente, não integração real com o backend.
 */
vi.mock("../hooks/useEsqueciSenha", () => ({
  useEsqueciSenha: vi.fn(),
}))

const useEsqueciSenhaMock = vi.mocked(useEsqueciSenha)

type EsqueciSenhaMutation = ReturnType<typeof useEsqueciSenha>

/** Constrói um retorno mockado de `useEsqueciSenha` com os campos que o componente lê. */
function mockEsqueciSenha(overrides: Partial<EsqueciSenhaMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as EsqueciSenhaMutation

  useEsqueciSenhaMock.mockReturnValue(mutation)
  return mutation
}

beforeEach(() => {
  vi.clearAllMocks()
  mockEsqueciSenha()
})

describe("EsqueciSenhaForm", () => {
  describe("validação client-side (Zod)", () => {
    it("mostra mensagem inline quando o e-mail está vazio", async () => {
      render(<EsqueciSenhaForm />)

      fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }))

      expect(
        await screen.findByText("E-mail é obrigatório.")
      ).toBeInTheDocument()
      expect(mockEsqueciSenha().mutate).not.toHaveBeenCalled()
    })

    it("rejeita e-mail em formato inválido", async () => {
      const user = userEvent.setup()
      render(<EsqueciSenhaForm />)

      await user.type(screen.getByLabelText("E-mail"), "nao-e-um-email")
      fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }))

      expect(
        await screen.findByText("Informe um e-mail em formato válido.")
      ).toBeInTheDocument()
    })
  })

  describe("estado de carregamento", () => {
    it("desabilita campo e botão durante o envio", () => {
      mockEsqueciSenha({ isPending: true })
      render(<EsqueciSenhaForm />)

      expect(screen.getByLabelText("E-mail")).toBeDisabled()
      expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled()
    })
  })

  describe("envio", () => {
    it("chama a mutation com o e-mail informado", async () => {
      const mutation = mockEsqueciSenha()
      const user = userEvent.setup()
      render(<EsqueciSenhaForm />)

      await user.type(screen.getByLabelText("E-mail"), "maria@example.com")
      fireEvent.click(screen.getByRole("button", { name: "Enviar instruções" }))

      await waitFor(() =>
        expect(mutation.mutate).toHaveBeenCalledWith({
          email: "maria@example.com",
        })
      )
    })

    it("ignora um segundo submit enquanto o envio anterior está em andamento", async () => {
      const mutation = mockEsqueciSenha({ isPending: false })
      const { container, rerender } = render(<EsqueciSenhaForm />)

      const user = userEvent.setup()
      await user.type(screen.getByLabelText("E-mail"), "maria@example.com")

      const form = container.querySelector("form")
      if (!form) throw new Error("formulário não encontrado")

      fireEvent.submit(form)
      await waitFor(() => expect(mutation.mutate).toHaveBeenCalledTimes(1))

      mockEsqueciSenha({ isPending: true, mutate: mutation.mutate })
      rerender(<EsqueciSenhaForm />)

      fireEvent.submit(form)

      expect(mutation.mutate).toHaveBeenCalledTimes(1)
    })
  })

  describe("sucesso — mensagem genérica de anti-enumeração", () => {
    it("mostra sempre a mesma mensagem genérica de sucesso", () => {
      mockEsqueciSenha({ isSuccess: true })
      render(<EsqueciSenhaForm />)

      expect(screen.getByRole("status")).toHaveTextContent(
        "Se o e-mail estiver cadastrado, enviamos as instruções para redefinir a senha."
      )
      expect(
        screen.queryByRole("button", { name: "Enviar instruções" })
      ).not.toBeInTheDocument()
    })
  })

  describe("erro genérico do servidor", () => {
    it("exibe erro de ApiError como banner", () => {
      mockEsqueciSenha({
        isError: true,
        error: new ApiError(500, "Falha no servidor."),
      })
      render(<EsqueciSenhaForm />)

      expect(screen.getByRole("alert")).toHaveTextContent("Falha no servidor.")
    })

    it("exibe mensagem genérica de fallback quando o erro não é ApiError", () => {
      mockEsqueciSenha({
        isError: true,
        error: new Error("falha de rede"),
      })
      render(<EsqueciSenhaForm />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível processar sua solicitação. Tente novamente em instantes."
      )
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { VerificarEmailForm } from "./VerificarEmailForm"
import { useVerificarEmail } from "../hooks/useVerificarEmail"
import { useReenviarVerificacao } from "../hooks/useReenviarVerificacao"

/**
 * `useVerificarEmail` (TanStack Query) e `useReenviarVerificacao` (TanStack
 * Mutation) são mockados em todo este arquivo — mesma justificativa de
 * `LoginForm.test.tsx`/`CadastroForm.test.tsx`: aqui é teste de
 * unidade/componente, não integração real com o backend.
 */
vi.mock("../hooks/useVerificarEmail", () => ({
  useVerificarEmail: vi.fn(),
}))
vi.mock("../hooks/useReenviarVerificacao", () => ({
  useReenviarVerificacao: vi.fn(),
}))

const useVerificarEmailMock = vi.mocked(useVerificarEmail)
const useReenviarVerificacaoMock = vi.mocked(useReenviarVerificacao)

type VerificacaoQuery = ReturnType<typeof useVerificarEmail>
type ReenvioMutation = ReturnType<typeof useReenviarVerificacao>

/** Constrói um retorno mockado de `useVerificarEmail` com os campos lidos pelo componente. */
function mockVerificacao(overrides: Partial<VerificacaoQuery> = {}) {
  const query = {
    data: undefined,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
    ...overrides,
  } as unknown as VerificacaoQuery

  useVerificarEmailMock.mockReturnValue(query)
  return query
}

/** Constrói um retorno mockado de `useReenviarVerificacao` com os campos lidos pelo componente. */
function mockReenvio(overrides: Partial<ReenvioMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ReenvioMutation

  useReenviarVerificacaoMock.mockReturnValue(mutation)
  return mutation
}

beforeEach(() => {
  vi.clearAllMocks()
  mockVerificacao()
  mockReenvio()
})

describe("VerificarEmailForm", () => {
  describe("verificação automática ao carregar", () => {
    it("mostra estado de carregamento enquanto a verificação está pendente (com token)", () => {
      mockVerificacao({ isPending: true })
      render(<VerificarEmailForm token="token-valido" />)

      expect(screen.getByRole("status")).toHaveTextContent(
        "Verificando seu e-mail..."
      )
    })

    it("mostra confirmação de sucesso quando o token é válido", () => {
      mockVerificacao({ isSuccess: true })
      render(<VerificarEmailForm token="token-valido" />)

      expect(screen.getByRole("status")).toHaveTextContent(
        "E-mail verificado com sucesso!"
      )
      expect(
        screen.getByRole("link", { name: "Ir para o login" })
      ).toHaveAttribute("href", "/login")
    })

    it("mostra erro genérico do contrato quando o token é inválido/expirado", () => {
      mockVerificacao({
        isError: true,
        error: new ApiError(
          400,
          "Link de verificação inválido ou expirado."
        ),
      })
      render(<VerificarEmailForm token="token-invalido" />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Link de verificação inválido ou expirado."
      )
      // Formulário de reenvio continua disponível junto do erro.
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    })

    it("mostra mensagem própria quando não há token na URL, sem chamar a verificação", () => {
      render(<VerificarEmailForm token={null} />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Nenhum token de verificação foi informado no link."
      )
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument()
    })
  })

  describe("reenvio de verificação — validação client-side (Zod)", () => {
    it("mostra mensagem inline quando o e-mail está vazio", async () => {
      render(<VerificarEmailForm token={null} />)

      fireEvent.click(
        screen.getByRole("button", { name: "Reenviar link de verificação" })
      )

      expect(
        await screen.findByText("E-mail é obrigatório.")
      ).toBeInTheDocument()
      expect(mockReenvio().mutate).not.toHaveBeenCalled()
    })

    it("rejeita e-mail em formato inválido", async () => {
      const user = userEvent.setup()
      render(<VerificarEmailForm token={null} />)

      await user.type(screen.getByLabelText("E-mail"), "nao-e-um-email")
      fireEvent.click(
        screen.getByRole("button", { name: "Reenviar link de verificação" })
      )

      expect(
        await screen.findByText("Informe um e-mail em formato válido.")
      ).toBeInTheDocument()
    })
  })

  describe("reenvio de verificação — envio", () => {
    it("chama a mutation de reenvio com o e-mail informado", async () => {
      const mutation = mockReenvio()
      const user = userEvent.setup()
      render(<VerificarEmailForm token={null} />)

      await user.type(screen.getByLabelText("E-mail"), "maria@example.com")
      fireEvent.click(
        screen.getByRole("button", { name: "Reenviar link de verificação" })
      )

      await waitFor(() =>
        expect(mutation.mutate).toHaveBeenCalledWith({
          email: "maria@example.com",
        })
      )
    })

    it("desabilita campo e botão durante o envio do reenvio", () => {
      mockReenvio({ isPending: true })
      render(<VerificarEmailForm token={null} />)

      expect(screen.getByLabelText("E-mail")).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Reenviando..." })
      ).toBeDisabled()
    })

    it("mostra mensagem genérica de sucesso após reenvio, sem revelar se o e-mail existe", () => {
      mockReenvio({ isSuccess: true })
      render(<VerificarEmailForm token={null} />)

      expect(screen.getByRole("status")).toHaveTextContent("Link reenviado!")
      expect(screen.getByRole("status")).toHaveTextContent(
        "Se o e-mail estiver cadastrado e pendente de verificação, um novo link foi enviado."
      )
    })

    it("exibe erro do servidor (ApiError) como banner", () => {
      // Token presente e verificação num estado neutro (nem pendente, nem
      // sucesso, nem erro) — isola o banner de erro do reenvio sem o banner
      // de "sem token"/erro de verificação concorrendo pelo mesmo `role="alert"`.
      mockReenvio({
        isError: true,
        error: new ApiError(400, "Falha ao reenviar o link."),
      })
      render(<VerificarEmailForm token="token-qualquer" />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Falha ao reenviar o link."
      )
    })

    it("exibe mensagem genérica de fallback quando o erro do reenvio não é ApiError", () => {
      mockReenvio({
        isError: true,
        error: new Error("falha de rede"),
      })
      render(<VerificarEmailForm token="token-qualquer" />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível reenviar o link. Tente novamente em instantes."
      )
    })
  })
})

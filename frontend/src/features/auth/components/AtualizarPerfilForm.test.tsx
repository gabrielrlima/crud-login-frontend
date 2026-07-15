import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { AtualizarPerfilForm } from "./AtualizarPerfilForm"
import { useAtualizarPerfil } from "../hooks/useAtualizarPerfil"

/**
 * `useAtualizarPerfil` (TanStack Mutation) é mockado em todo este arquivo —
 * mesma justificativa de `LoginForm.test.tsx`/`CadastroForm.test.tsx`: aqui
 * é teste de unidade/componente, não integração real com o backend.
 */
vi.mock("../hooks/useAtualizarPerfil", () => ({
  useAtualizarPerfil: vi.fn(),
}))

const useAtualizarPerfilMock = vi.mocked(useAtualizarPerfil)

type AtualizarPerfilMutation = ReturnType<typeof useAtualizarPerfil>

/** Constrói um retorno mockado de `useAtualizarPerfil` com os campos que o componente lê. */
function mockAtualizarPerfil(
  overrides: Partial<AtualizarPerfilMutation> = {}
) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: undefined,
    ...overrides,
  } as unknown as AtualizarPerfilMutation

  useAtualizarPerfilMock.mockReturnValue(mutation)
  return mutation
}

const PERFIL_FAKE = {
  id: "user-1",
  nome: "Maria Silva",
  email: "maria@example.com",
  criadoEm: "2026-01-01T00:00:00Z",
  emailVerificado: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAtualizarPerfil()
})

describe("AtualizarPerfilForm", () => {
  it("pré-preenche nome e e-mail com os dados de GET /me", () => {
    render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

    expect(screen.getByLabelText("Nome")).toHaveValue("Maria Silva")
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@example.com")
  })

  describe("validação client-side (Zod)", () => {
    it("mostra mensagens inline quando os campos obrigatórios ficam vazios", async () => {
      const user = userEvent.setup()
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      await user.clear(screen.getByLabelText("Nome"))
      await user.clear(screen.getByLabelText("E-mail"))
      fireEvent.click(
        screen.getByRole("button", { name: "Salvar alterações" })
      )

      expect(
        await screen.findByText("Nome é obrigatório.")
      ).toBeInTheDocument()
      expect(screen.getByText("E-mail é obrigatório.")).toBeInTheDocument()
      expect(mockAtualizarPerfil().mutate).not.toHaveBeenCalled()
    })

    it("rejeita e-mail em formato inválido", async () => {
      const user = userEvent.setup()
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      await user.clear(screen.getByLabelText("E-mail"))
      await user.type(screen.getByLabelText("E-mail"), "nao-e-um-email")
      fireEvent.click(
        screen.getByRole("button", { name: "Salvar alterações" })
      )

      expect(
        await screen.findByText("Informe um e-mail em formato válido.")
      ).toBeInTheDocument()
    })
  })

  describe("estado de carregamento", () => {
    it("desabilita campos e botão durante o envio", () => {
      mockAtualizarPerfil({ isPending: true })
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      expect(screen.getByLabelText("Nome")).toBeDisabled()
      expect(screen.getByLabelText("E-mail")).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Salvando..." })
      ).toBeDisabled()
    })
  })

  describe("envio", () => {
    it("chama a mutation com os dados do formulário", async () => {
      const mutation = mockAtualizarPerfil()
      const user = userEvent.setup()
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      await user.clear(screen.getByLabelText("Nome"))
      await user.type(screen.getByLabelText("Nome"), "Maria Souza")
      fireEvent.click(
        screen.getByRole("button", { name: "Salvar alterações" })
      )

      await waitFor(() =>
        expect(mutation.mutate).toHaveBeenCalledWith(
          { nome: "Maria Souza", email: "maria@example.com" },
          expect.anything()
        )
      )
    })

    it("exibe erro do servidor (e-mail duplicado) como banner", () => {
      mockAtualizarPerfil({
        isError: true,
        error: new ApiError(400, "E-mail já cadastrado."),
      })
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "E-mail já cadastrado."
      )
    })

    it("mostra aviso de reverificação quando o e-mail muda (SDD-017, Critério 3)", async () => {
      const novoPerfil = {
        ...PERFIL_FAKE,
        email: "novo@example.com",
        emailVerificado: false,
      }

      const mutate = vi.fn((_dados, options) => {
        mockAtualizarPerfil({ isSuccess: true, data: novoPerfil, mutate })
        options?.onSuccess?.(novoPerfil, _dados, undefined)
      })
      mockAtualizarPerfil({ mutate })

      const user = userEvent.setup()
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      await user.clear(screen.getByLabelText("E-mail"))
      await user.type(screen.getByLabelText("E-mail"), "novo@example.com")
      fireEvent.click(
        screen.getByRole("button", { name: "Salvar alterações" })
      )

      expect(
        await screen.findByText(/Enviamos um novo link de verificação/)
      ).toBeInTheDocument()
    })

    it("não mostra aviso de reverificação quando só o nome muda", async () => {
      const novoPerfil = { ...PERFIL_FAKE, nome: "Maria Souza" }

      const mutate = vi.fn((_dados, options) => {
        mockAtualizarPerfil({ isSuccess: true, data: novoPerfil, mutate })
        options?.onSuccess?.(novoPerfil, _dados, undefined)
      })
      mockAtualizarPerfil({ mutate })

      const user = userEvent.setup()
      render(<AtualizarPerfilForm perfil={PERFIL_FAKE} />)

      await user.clear(screen.getByLabelText("Nome"))
      await user.type(screen.getByLabelText("Nome"), "Maria Souza")
      fireEvent.click(
        screen.getByRole("button", { name: "Salvar alterações" })
      )

      expect(
        await screen.findByText("Perfil atualizado com sucesso!")
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/Enviamos um novo link de verificação/)
      ).not.toBeInTheDocument()
    })
  })
})

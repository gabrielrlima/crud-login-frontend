import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"

import { ApiError } from "@/lib/api-client"

import { PerfilForm } from "./PerfilForm"
import { usePerfil } from "../hooks/usePerfil"
import { useAuthStore } from "../store/auth-store"

/**
 * `usePerfil` (TanStack Query) é mockado — mesma justificativa de
 * `LoginForm.test.tsx`. Os três formulários filhos também são mockados
 * aqui: este arquivo testa só a orquestração (loading/erro/sem
 * token/sucesso) — o comportamento de cada formulário tem seu próprio
 * arquivo de teste (`AtualizarPerfilForm.test.tsx`,
 * `TrocarSenhaForm.test.tsx`, `ExcluirContaSection.test.tsx`).
 */
vi.mock("../hooks/usePerfil", () => ({
  usePerfil: vi.fn(),
}))

vi.mock("./AtualizarPerfilForm", () => ({
  AtualizarPerfilForm: () => <div data-testid="atualizar-perfil-form" />,
}))
vi.mock("./TrocarSenhaForm", () => ({
  TrocarSenhaForm: () => <div data-testid="trocar-senha-form" />,
}))
vi.mock("./ExcluirContaSection", () => ({
  ExcluirContaSection: () => <div data-testid="excluir-conta-section" />,
}))

const usePerfilMock = vi.mocked(usePerfil)

type PerfilQuery = ReturnType<typeof usePerfil>

/** Constrói um retorno mockado de `usePerfil` com os campos que o componente lê. */
function mockPerfil(overrides: Partial<PerfilQuery> = {}) {
  const query = {
    data: undefined,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
    ...overrides,
  } as unknown as PerfilQuery

  usePerfilMock.mockReturnValue(query)
  return query
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
  mockPerfil()
  useAuthStore.setState({ token: "jwt-fake", isAuthenticated: true })
})

afterEach(() => {
  useAuthStore.setState({ token: null, isAuthenticated: false })
})

describe("PerfilForm", () => {
  it("mostra aviso pra fazer login quando não há token em memória", () => {
    useAuthStore.setState({ token: null, isAuthenticated: false })
    render(<PerfilForm />)

    expect(
      screen.getByRole("link", { name: "Ir para o login" })
    ).toHaveAttribute("href", "/login")
    expect(
      screen.queryByTestId("atualizar-perfil-form")
    ).not.toBeInTheDocument()
  })

  it("mostra estado de carregamento enquanto o perfil está pendente", () => {
    mockPerfil({ isPending: true })
    render(<PerfilForm />)

    expect(screen.getByRole("status")).toHaveTextContent(
      "Carregando dados da conta..."
    )
  })

  it("mostra erro genérico do contrato quando a busca do perfil falha", () => {
    mockPerfil({
      isError: true,
      error: new ApiError(401, "Não autorizado."),
    })
    render(<PerfilForm />)

    expect(screen.getByRole("alert")).toHaveTextContent("Não autorizado.")
  })

  it("mostra mensagem genérica de fallback quando o erro não é ApiError", () => {
    mockPerfil({
      isError: true,
      error: new Error("falha de rede"),
    })
    render(<PerfilForm />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os dados da sua conta. Tente novamente em instantes."
    )
  })

  it("renderiza as três seções quando o perfil carrega com sucesso", () => {
    mockPerfil({ isSuccess: true, data: PERFIL_FAKE })
    render(<PerfilForm />)

    expect(screen.getByText("Minha conta")).toBeInTheDocument()
    expect(screen.getByTestId("atualizar-perfil-form")).toBeInTheDocument()
    expect(screen.getByTestId("trocar-senha-form")).toBeInTheDocument()
    expect(screen.getByTestId("excluir-conta-section")).toBeInTheDocument()
  })
})

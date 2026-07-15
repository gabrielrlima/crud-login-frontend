import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { ApiError } from "@/lib/api-client"

import { ExcluirContaSection } from "./ExcluirContaSection"
import { useExcluirConta } from "../hooks/useExcluirConta"

/**
 * `useExcluirConta` (TanStack Mutation) é mockado em todo este arquivo —
 * mesma justificativa de `LoginForm.test.tsx`.
 */
vi.mock("../hooks/useExcluirConta", () => ({
  useExcluirConta: vi.fn(),
}))

const push = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const useExcluirContaMock = vi.mocked(useExcluirConta)

type ExcluirContaMutation = ReturnType<typeof useExcluirConta>

/** Constrói um retorno mockado de `useExcluirConta` com os campos que o componente lê. */
function mockExcluirConta(overrides: Partial<ExcluirContaMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as ExcluirContaMutation

  useExcluirContaMock.mockReturnValue(mutation)
  return mutation
}

beforeEach(() => {
  vi.clearAllMocks()
  mockExcluirConta()
})

describe("ExcluirContaSection", () => {
  it("não mostra o diálogo de confirmação antes do clique em 'Excluir conta'", () => {
    render(<ExcluirContaSection />)

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("abre o diálogo de confirmação explícita ao clicar em 'Excluir conta'", async () => {
    render(<ExcluirContaSection />)

    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }))

    const dialogo = await screen.findByRole("alertdialog")
    expect(dialogo).toHaveTextContent("Excluir sua conta?")
    expect(dialogo).toHaveTextContent(
      "Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente."
    )
  })

  it("não chama a mutation ao cancelar", async () => {
    const mutation = mockExcluirConta()
    render(<ExcluirContaSection />)

    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }))
    await screen.findByRole("alertdialog")

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(mutation.mutate).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    )
  })

  it("chama a mutation de exclusão ao confirmar", async () => {
    const mutation = mockExcluirConta()
    render(<ExcluirContaSection />)

    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }))
    await screen.findByRole("alertdialog")

    fireEvent.click(
      screen.getByRole("button", { name: "Sim, excluir minha conta" })
    )

    expect(mutation.mutate).toHaveBeenCalledWith(undefined, expect.anything())
  })

  it("desabilita os botões do diálogo durante o envio", async () => {
    mockExcluirConta({ isPending: true })
    render(<ExcluirContaSection />)

    fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }))
    await screen.findByRole("alertdialog")

    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Excluindo..." })
    ).toBeDisabled()
  })

  it("exibe erro do servidor como banner", () => {
    mockExcluirConta({
      isError: true,
      error: new ApiError(401, "Não autorizado."),
    })
    render(<ExcluirContaSection />)

    expect(screen.getByRole("alert")).toHaveTextContent("Não autorizado.")
  })

  describe("sucesso", () => {
    it("mostra a confirmação de sucesso em vez do botão de exclusão", () => {
      mockExcluirConta({ isSuccess: true })
      render(<ExcluirContaSection />)

      expect(screen.getByRole("status")).toHaveTextContent(
        "Conta excluída com sucesso!"
      )
      expect(
        screen.queryByRole("button", { name: "Excluir conta" })
      ).not.toBeInTheDocument()
    })

    it("redireciona para / somente depois do intervalo de confirmação (SDD-019)", async () => {
      const mutation = mockExcluirConta({
        mutate: vi.fn((_dados, options) => {
          options?.onSuccess?.(
            { mensagem: "Conta excluída com sucesso." },
            _dados,
            undefined
          )
        }),
      })
      render(<ExcluirContaSection />)

      fireEvent.click(screen.getByRole("button", { name: "Excluir conta" }))
      await screen.findByRole("alertdialog")

      vi.useFakeTimers()
      try {
        fireEvent.click(
          screen.getByRole("button", { name: "Sim, excluir minha conta" })
        )

        await vi.advanceTimersByTimeAsync(0)
        expect(mutation.mutate).toHaveBeenCalledTimes(1)
        expect(push).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1500)
        expect(push).toHaveBeenCalledWith("/")
      } finally {
        vi.useRealTimers()
      }
    })
  })
})

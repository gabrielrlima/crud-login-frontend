import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { CadastroForm } from "./CadastroForm"
import { useCadastro } from "../hooks/useCadastro"

/**
 * `useCadastro` (TanStack Query) é mockado em todo este arquivo — os testes
 * cobrem o comportamento do componente (validação, loading, guarda de duplo
 * submit, exibição de erro/sucesso), não a integração real com o backend
 * (ver knowledge/frontend-arquitetura.md, "Testes de front-end": Playwright
 * cobre o fluxo real de ponta a ponta; aqui é teste de unidade/componente).
 */
vi.mock("../hooks/useCadastro", () => ({
  useCadastro: vi.fn(),
}))

const push = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const useCadastroMock = vi.mocked(useCadastro)

type CadastroMutation = ReturnType<typeof useCadastro>

/** Constrói um retorno mockado de `useCadastro` com os campos que o componente lê. */
function mockCadastro(overrides: Partial<CadastroMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as CadastroMutation

  useCadastroMock.mockReturnValue(mutation)
  return mutation
}

async function preencherFormularioValido() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Nome"), "Maria Silva")
  await user.type(screen.getByLabelText("E-mail"), "maria@example.com")
  await user.type(screen.getByLabelText("Senha"), "senha123")
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCadastro()
})

describe("CadastroForm", () => {
  describe("validação client-side (Zod)", () => {
    it("mostra mensagens inline quando os campos obrigatórios estão vazios", async () => {
      render(<CadastroForm />)

      fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))

      expect(await screen.findByText("Nome é obrigatório.")).toBeInTheDocument()
      expect(
        screen.getByText("E-mail é obrigatório.")
      ).toBeInTheDocument()
      expect(
        screen.getByText("A senha deve ter no mínimo 8 caracteres.")
      ).toBeInTheDocument()

      // Validação client-side não deve, por si só, disparar a mutation.
      expect(mockCadastro().mutate).not.toHaveBeenCalled()
    })

    it("rejeita e-mail em formato inválido", async () => {
      const user = userEvent.setup()
      render(<CadastroForm />)

      await user.type(screen.getByLabelText("Nome"), "Maria Silva")
      await user.type(screen.getByLabelText("E-mail"), "nao-e-um-email")
      await user.type(screen.getByLabelText("Senha"), "senha123")
      fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))

      expect(
        await screen.findByText("Informe um e-mail em formato válido.")
      ).toBeInTheDocument()
    })

    it("rejeita senha sem número", async () => {
      const user = userEvent.setup()
      render(<CadastroForm />)

      await user.type(screen.getByLabelText("Nome"), "Maria Silva")
      await user.type(screen.getByLabelText("E-mail"), "maria@example.com")
      await user.type(screen.getByLabelText("Senha"), "somenteletras")
      fireEvent.click(screen.getByRole("button", { name: "Criar conta" }))

      expect(
        await screen.findByText("A senha deve conter ao menos um número.")
      ).toBeInTheDocument()
    })
  })

  describe("login social — GitHub (RF01/SDD-023)", () => {
    it("mostra o botão 'Continuar com GitHub' acima do formulário", () => {
      render(<CadastroForm />)

      expect(
        screen.getByRole("button", { name: "Continuar com GitHub" })
      ).toBeInTheDocument()
      expect(screen.getByText("ou")).toBeInTheDocument()
    })
  })

  describe("estado de carregamento", () => {
    it("desabilita campos e botão durante o envio", () => {
      mockCadastro({ isPending: true })
      render(<CadastroForm />)

      expect(screen.getByLabelText("Nome")).toBeDisabled()
      expect(screen.getByLabelText("E-mail")).toBeDisabled()
      expect(screen.getByLabelText("Senha")).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Cadastrando..." })
      ).toBeDisabled()
    })
  })

  describe("duplo submit (SDD-006)", () => {
    it("ignora um segundo submit enquanto o envio anterior está em andamento", async () => {
      const mutation = mockCadastro({ isPending: false })
      const { container, rerender } = render(<CadastroForm />)
      await preencherFormularioValido()

      const form = container.querySelector("form")
      if (!form) throw new Error("formulário não encontrado")

      fireEvent.submit(form)
      await waitFor(() => expect(mutation.mutate).toHaveBeenCalledTimes(1))

      // Simula o estado logo após o primeiro submit: a mutation já está em
      // andamento (isPending: true) — o guard `if (enviando) return` deve
      // impedir uma segunda chamada a `mutate`, independente do `disabled`
      // do botão já ter sido aplicado visualmente ou não.
      mockCadastro({ isPending: true, mutate: mutation.mutate })
      rerender(<CadastroForm />)

      fireEvent.submit(form)

      expect(mutation.mutate).toHaveBeenCalledTimes(1)
    })
  })

  describe("erro genérico de servidor", () => {
    it("exibe erro de ApiError como banner (role=alert), não inline num campo", () => {
      mockCadastro({
        isError: true,
        error: new ApiError(400, "E-mail já cadastrado."),
      })
      render(<CadastroForm />)

      const banner = screen.getByRole("alert")
      expect(banner).toHaveTextContent("E-mail já cadastrado.")
      // Nenhum erro inline de campo deve existir junto com o banner.
      expect(document.getElementById("nome-error")).not.toBeInTheDocument()
      expect(document.getElementById("email-error")).not.toBeInTheDocument()
      expect(document.getElementById("senha-error")).not.toBeInTheDocument()
    })

    it("exibe mensagem genérica de fallback quando o erro não é ApiError", () => {
      mockCadastro({
        isError: true,
        error: new Error("falha de rede"),
      })
      render(<CadastroForm />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível concluir o cadastro. Tente novamente em instantes."
      )
    })
  })

  describe("sucesso", () => {
    it("mostra a confirmação de sucesso em vez do formulário", () => {
      mockCadastro({ isSuccess: true })
      render(<CadastroForm />)

      // `role="status"` não deriva nome acessível do próprio conteúdo (sem
      // `aria-label`) — verifica pelo texto dentro da região, não por `name`.
      expect(screen.getByRole("status")).toHaveTextContent(
        "Cadastro realizado com sucesso!"
      )
      expect(
        screen.queryByRole("button", { name: "Criar conta" })
      ).not.toBeInTheDocument()
    })

    it("redireciona para /login somente depois do intervalo de confirmação", async () => {
      // Preenchimento via `fireEvent.change` (síncrono), não `userEvent.type`
      // — evita misturar os delays internos de `userEvent` com fake timers,
      // que já é o suficiente para exercitar o `window.setTimeout` do
      // componente sem depender de um temporizador real de 1500ms no teste.
      const mutation = mockCadastro({
        isPending: false,
        mutate: vi.fn((_dados, options) => {
          options?.onSuccess?.(
            { id: "1", nome: "Maria", email: "m@e.com", criadoEm: "" },
            _dados,
            undefined
          )
        }),
      })
      const { container } = render(<CadastroForm />)

      fireEvent.change(screen.getByLabelText("Nome"), {
        target: { value: "Maria Silva" },
      })
      fireEvent.change(screen.getByLabelText("E-mail"), {
        target: { value: "maria@example.com" },
      })
      fireEvent.change(screen.getByLabelText("Senha"), {
        target: { value: "senha123" },
      })

      vi.useFakeTimers()
      try {
        const form = container.querySelector("form")
        if (!form) throw new Error("formulário não encontrado")
        fireEvent.submit(form)

        // Deixa a validação assíncrona do zodResolver/RHF resolver (promises
        // não são afetadas por fake timers, mas `advanceTimersByTimeAsync(0)`
        // também esvazia a fila de microtasks pendente) antes de checar que
        // `mutate` foi chamado.
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

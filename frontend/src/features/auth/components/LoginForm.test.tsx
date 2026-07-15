import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api-client"

import { LoginForm } from "./LoginForm"
import { useLogin } from "../hooks/useLogin"

/**
 * `useLogin` (TanStack Query) é mockado em todo este arquivo — mesma
 * justificativa de `CadastroForm.test.tsx`: aqui é teste de
 * unidade/componente, não integração real com o backend.
 */
vi.mock("../hooks/useLogin", () => ({
  useLogin: vi.fn(),
}))

const push = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

const useLoginMock = vi.mocked(useLogin)

type LoginMutation = ReturnType<typeof useLogin>

/** Constrói um retorno mockado de `useLogin` com os campos que o componente lê. */
function mockLogin(overrides: Partial<LoginMutation> = {}) {
  const mutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as LoginMutation

  useLoginMock.mockReturnValue(mutation)
  return mutation
}

async function preencherFormularioValido() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("E-mail"), "maria@example.com")
  await user.type(screen.getByLabelText("Senha"), "qualquer-senha")
}

beforeEach(() => {
  vi.clearAllMocks()
  mockLogin()
})

describe("LoginForm", () => {
  describe("validação client-side (Zod)", () => {
    it("mostra mensagens inline quando os campos obrigatórios estão vazios", async () => {
      render(<LoginForm />)

      fireEvent.click(screen.getByRole("button", { name: "Entrar" }))

      expect(
        await screen.findByText("E-mail é obrigatório.")
      ).toBeInTheDocument()
      expect(screen.getByText("Senha é obrigatória.")).toBeInTheDocument()

      expect(mockLogin().mutate).not.toHaveBeenCalled()
    })

    it("rejeita e-mail em formato inválido", async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      await user.type(screen.getByLabelText("E-mail"), "nao-e-um-email")
      await user.type(screen.getByLabelText("Senha"), "qualquer-senha")
      fireEvent.click(screen.getByRole("button", { name: "Entrar" }))

      expect(
        await screen.findByText("Informe um e-mail em formato válido.")
      ).toBeInTheDocument()
    })
  })

  describe("estado de carregamento", () => {
    it("desabilita campos e botão durante o envio", () => {
      mockLogin({ isPending: true })
      render(<LoginForm />)

      expect(screen.getByLabelText("E-mail")).toBeDisabled()
      expect(screen.getByLabelText("Senha")).toBeDisabled()
      expect(
        screen.getByRole("button", { name: "Entrando..." })
      ).toBeDisabled()
    })
  })

  describe("duplo submit (SDD-006)", () => {
    it("ignora um segundo submit enquanto o envio anterior está em andamento", async () => {
      const mutation = mockLogin({ isPending: false })
      const { container, rerender } = render(<LoginForm />)
      await preencherFormularioValido()

      const form = container.querySelector("form")
      if (!form) throw new Error("formulário não encontrado")

      fireEvent.submit(form)
      await waitFor(() => expect(mutation.mutate).toHaveBeenCalledTimes(1))

      mockLogin({ isPending: true, mutate: mutation.mutate })
      rerender(<LoginForm />)

      fireEvent.submit(form)

      expect(mutation.mutate).toHaveBeenCalledTimes(1)
    })
  })

  describe("erro genérico do servidor (401)", () => {
    it("exibe erro de credenciais inválidas (ApiError 401) como banner, não inline", () => {
      mockLogin({
        isError: true,
        error: new ApiError(401, "Credenciais inválidas."),
      })
      render(<LoginForm />)

      const banner = screen.getByRole("alert")
      expect(banner).toHaveTextContent("Credenciais inválidas.")
      expect(document.getElementById("email-error")).not.toBeInTheDocument()
      expect(document.getElementById("senha-error")).not.toBeInTheDocument()
    })

    it("exibe mensagem genérica de fallback quando o erro não é ApiError", () => {
      mockLogin({
        isError: true,
        error: new Error("falha de rede"),
      })
      render(<LoginForm />)

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Não foi possível entrar. Tente novamente em instantes."
      )
    })
  })

  describe("sucesso", () => {
    it("mostra a confirmação de sucesso em vez do formulário", () => {
      mockLogin({ isSuccess: true })
      render(<LoginForm />)

      // `role="status"` não deriva nome acessível do próprio conteúdo (sem
      // `aria-label`) — verifica pelo texto dentro da região, não por `name`.
      expect(screen.getByRole("status")).toHaveTextContent(
        "Login realizado com sucesso!"
      )
      expect(
        screen.queryByRole("button", { name: "Entrar" })
      ).not.toBeInTheDocument()
    })

    it("redireciona para /inicio somente depois do intervalo de confirmação", async () => {
      // Preenchimento via `fireEvent.change` (síncrono), não `userEvent.type`
      // — evita misturar os delays internos de `userEvent` com fake timers.
      const mutation = mockLogin({
        isPending: false,
        mutate: vi.fn((_dados, options) => {
          options?.onSuccess?.({ token: "jwt-fake" }, _dados, undefined)
        }),
      })
      const { container } = render(<LoginForm />)

      fireEvent.change(screen.getByLabelText("E-mail"), {
        target: { value: "maria@example.com" },
      })
      fireEvent.change(screen.getByLabelText("Senha"), {
        target: { value: "qualquer-senha" },
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

        expect(push).toHaveBeenCalledWith("/inicio")
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe("link de recuperação de senha (SDD-014)", () => {
    it("mostra o link 'Esqueci minha senha' apontando para /esqueci-senha", () => {
      render(<LoginForm />)

      expect(
        screen.getByRole("link", { name: "Esqueci minha senha" })
      ).toHaveAttribute("href", "/esqueci-senha")
    })
  })

  describe("login social — GitHub (RF01/SDD-023)", () => {
    it("mostra o botão 'Continuar com GitHub' acima do formulário", () => {
      render(<LoginForm />)

      expect(
        screen.getByRole("button", { name: "Continuar com GitHub" })
      ).toBeInTheDocument()
      expect(screen.getByText("ou")).toBeInTheDocument()
    })
  })

  describe("aviso de sessão expirada", () => {
    it("mostra aviso quando sessaoExpirada=true e não há erro de servidor", () => {
      render(<LoginForm sessaoExpirada />)

      expect(
        screen.getByText("Sua sessão expirou. Faça login novamente.")
      ).toBeInTheDocument()
    })

    it("prioriza o erro de servidor sobre o aviso de sessão expirada", () => {
      mockLogin({
        isError: true,
        error: new ApiError(401, "Credenciais inválidas."),
      })
      render(<LoginForm sessaoExpirada />)

      expect(
        screen.queryByText("Sua sessão expirou. Faça login novamente.")
      ).not.toBeInTheDocument()
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Credenciais inválidas."
      )
    })
  })
})

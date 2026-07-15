import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GithubOAuthButton } from "./GithubOAuthButton"
import { iniciarAutenticacaoGithub } from "../services/github-oauth"

/**
 * `iniciarAutenticacaoGithub` já tem cobertura própria e isolada em
 * `github-oauth.test.ts` (geração de state, URL de autorização) — aqui só se
 * testa que o componente está corretamente ligado a ela, mesmo padrão de
 * mockar o hook/serviço usado por `LoginForm.test.tsx`.
 */
vi.mock("../services/github-oauth", () => ({
  iniciarAutenticacaoGithub: vi.fn(),
}))

const iniciarAutenticacaoGithubMock = vi.mocked(iniciarAutenticacaoGithub)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GithubOAuthButton", () => {
  it("mostra o texto 'Continuar com GitHub'", () => {
    render(<GithubOAuthButton />)

    expect(
      screen.getByRole("button", { name: "Continuar com GitHub" })
    ).toBeInTheDocument()
  })

  it("inicia a autenticação com o GitHub ao clicar", () => {
    render(<GithubOAuthButton />)

    fireEvent.click(screen.getByRole("button", { name: "Continuar com GitHub" }))

    expect(iniciarAutenticacaoGithubMock).toHaveBeenCalledTimes(1)
  })
})

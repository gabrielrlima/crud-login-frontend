"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { iniciarAutenticacaoGithub } from "../services/github-oauth"

/**
 * Ícone de marca do GitHub via SVG inline, não via `lucide-react`.
 *
 * Decisão não 100% explícita na spec (`projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`
 * só diz "use um ícone de GitHub, confirme o nome exato disponível na versão instalada"): a
 * versão de `lucide-react` deste projeto (1.24.0, ver `package.json`) não
 * inclui mais ícones de marca (Github, Gitlab, Slack, Twitter...) — foram
 * removidos do pacote (motivo de licenciamento/trademark de logos de
 * terceiros). Confirmado checando `dist/lucide-react.d.ts` e
 * `dist/esm/icons/` do pacote instalado em `node_modules`: nenhum ícone
 * "Github" existe para importar. O path abaixo é o octocat mark oficial do
 * GitHub (mesmo SVG usado universalmente em botões "Continuar com GitHub"),
 * embutido localmente em vez de adicionar uma dependência nova só por causa
 * de um ícone.
 */
function GithubMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.084-.729.084-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.107-.775.42-1.305.763-1.605-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.467-2.381 1.235-3.221-.135-.303-.54-1.524.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.874.12 3.176.765.84 1.23 1.911 1.23 3.221 0 4.61-2.805 5.62-5.475 5.92.435.375.81 1.11.81 2.235 0 1.615-.015 2.92-.015 3.315 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

interface GithubOAuthButtonProps {
  className?: string
}

/**
 * Botão "Continuar com GitHub" (RF01) — usado tanto em `LoginForm` quanto em
 * `CadastroForm`, acima do formulário de e-mail/senha existente (spec,
 * "Frontend"). Ao clicar, inicia o fluxo OAuth 2.0 do GitHub
 * (`iniciarAutenticacaoGithub`, `services/github-oauth.ts`) — este componente
 * só cuida da apresentação, sem lógica própria de redirecionamento.
 */
export function GithubOAuthButton({ className }: GithubOAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full", className)}
      onClick={iniciarAutenticacaoGithub}
    >
      <GithubMarkIcon className="size-4" />
      Continuar com GitHub
    </Button>
  )
}

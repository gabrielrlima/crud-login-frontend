import { useMutation } from "@tanstack/react-query"

import { autenticarComGithubCallback } from "../services/github-oauth-callback"
import { useAuthStore } from "../store/auth-store"

/**
 * Mutation que orquestra o retorno do fluxo OAuth do GitHub em
 * `/auth/github/callback` — `mutationFn` (`autenticarComGithubCallback`)
 * confere o `state`/`code` recebidos e só então chama
 * `POST /api/auth/login/github` (ver JSDoc de `services/github-oauth-callback.ts`
 * para o porquê da validação viver lá, não aqui nem no componente).
 *
 * Ao receber o token (200), grava no store de autenticação (Zustand,
 * `store/auth-store.ts`) — mesmo mecanismo de `useLogin` (login local), uma
 * única fonte de sessão autenticada independente do método usado para
 * entrar (`SDD-023`, seção "Decisão de arquitetura").
 */
export function useGithubCallback() {
  const setToken = useAuthStore((state) => state.setToken)

  return useMutation({
    mutationFn: autenticarComGithubCallback,
    onSuccess: (data) => {
      setToken(data.token)
    },
  })
}

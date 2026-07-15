import { useMutation } from "@tanstack/react-query"

import { login } from "../services/auth.service"
import { useAuthStore } from "../store/auth-store"

/**
 * Mutation de login (`POST /api/auth/login`).
 *
 * Ao receber o token (200), grava no store de autenticação (Zustand,
 * `store/auth-store.ts`) — nunca em `localStorage` puro fora do store. Erro
 * (401) chega como `ApiError` genérica ("Credenciais inválidas") — quem
 * consome o hook (`LoginForm`) decide como exibir, este hook só orquestra a
 * chamada e o efeito colateral de sucesso.
 */
export function useLogin() {
  const setToken = useAuthStore((state) => state.setToken)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.token)
    },
  })
}

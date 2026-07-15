import { useMutation } from "@tanstack/react-query"

import { excluirConta } from "../services/auth.service"
import { withSessionHandling } from "../services/session-interceptor"
import { useAuthStore } from "../store/auth-store"

/**
 * Mutation de exclusão da própria conta (`DELETE /api/auth/conta`).
 *
 * Hard-delete imediato (`SDD-019`, seção "Decisão de arquitetura") — o usuário
 * deixa de existir no servidor, então não há mais sessão pra manter: sucesso
 * já descarta o token local (mesma lógica de logout). Quem consome o hook
 * (`ExcluirContaSection`) cuida do feedback visual e do redirecionamento para
 * uma rota pública (`/`, não `/login` — `projeto-sdd/specs/SDD-019-exclusao-de-conta.md`,
 * "Front-end": evita sugerir que a conta ainda existe).
 */
export function useExcluirConta() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: () => withSessionHandling(() => excluirConta(token as string)),
    onSuccess: () => {
      logout()
    },
  })
}

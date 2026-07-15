import { useMutation } from "@tanstack/react-query"

import { trocarSenha } from "../services/auth.service"
import { withSessionHandling } from "../services/session-interceptor"
import { useAuthStore } from "../store/auth-store"
import type { TrocarSenhaRequest } from "../services/auth.service"

/**
 * Mutation de troca de senha do usuário autenticado
 * (`POST /api/auth/senha/trocar`).
 *
 * Sucesso invalida todos os tokens JWT emitidos antes deste momento — em
 * qualquer dispositivo, inclusive o desta própria sessão (mesmo mecanismo
 * `SenhaAlteradaEm` de `SDD-014`, seção "Decisão de arquitetura", ver
 * `projeto-sdd/specs/SDD-018-troca-de-senha-autenticado.md`). Por isso este hook já
 * descarta o token local (mesma lógica de logout, `useAuthStore.logout`) —
 * quem consome o hook (`TrocarSenhaForm`) só cuida do feedback visual e do
 * redirecionamento para `/login`.
 */
export function useTrocarSenha() {
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: (dados: TrocarSenhaRequest) =>
      withSessionHandling(() => trocarSenha(token as string, dados)),
    onSuccess: () => {
      logout()
    },
  })
}

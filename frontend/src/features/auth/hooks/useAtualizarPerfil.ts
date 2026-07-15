import { useMutation, useQueryClient } from "@tanstack/react-query"

import { atualizarPerfil } from "../services/auth.service"
import { withSessionHandling } from "../services/session-interceptor"
import { useAuthStore } from "../store/auth-store"
import type { AtualizarPerfilFormValues } from "../types/atualizar-perfil.schema"

/**
 * Mutation de atualização de perfil (`PUT /api/auth/perfil`).
 *
 * Sucesso: grava a resposta direto no cache da query de perfil
 * (`["auth", "perfil"]`, mesma chave de `usePerfil`) — evita um refetch
 * redundante logo depois de já ter os dados atualizados na mão.
 *
 * Troca de e-mail **não** invalida o token da sessão atual (distinto de
 * troca de senha/SDD-018) — `projeto-sdd/specs/SDD-017-atualizacao-de-perfil.md`,
 * "Comportamento esperado", Critério 4 — por isso, ao contrário de
 * `useTrocarSenha`/`useExcluirConta`, este hook não mexe no `auth-store`.
 */
export function useAtualizarPerfil() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dados: AtualizarPerfilFormValues) =>
      withSessionHandling(() => atualizarPerfil(token as string, dados)),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "perfil"], data)
    },
  })
}

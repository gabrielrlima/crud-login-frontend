import { useMutation } from "@tanstack/react-query"

import { reenviarVerificacaoEmail } from "../services/auth.service"

/**
 * Mutation de reenvio do e-mail de verificação
 * (`POST /api/auth/verificar-email/reenviar`). Resposta sempre genérica
 * (ver `projeto-sdd/specs/SDD-013-verificacao-de-email.md`) — quem consome o hook
 * (`VerificarEmailForm`) exibe a mesma mensagem de sucesso independente do
 * e-mail existir, já estar verificado, ou o limite de frequência ter sido
 * atingido.
 */
export function useReenviarVerificacao() {
  return useMutation({
    mutationFn: reenviarVerificacaoEmail,
  })
}

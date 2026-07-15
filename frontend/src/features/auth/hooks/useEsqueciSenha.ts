import { useMutation } from "@tanstack/react-query"

import { solicitarRecuperacaoSenha } from "../services/auth.service"

/**
 * Mutation de solicitação de recuperação de senha
 * (`POST /api/auth/senha/esqueci`). Resposta sempre genérica (ver
 * `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md`) — quem consome o hook
 * (`EsqueciSenhaForm`) exibe a mesma mensagem de sucesso independente de o
 * e-mail existir ou não (RF01/RNF01, anti-enumeração e anti-timing-attack).
 */
export function useEsqueciSenha() {
  return useMutation({
    mutationFn: solicitarRecuperacaoSenha,
  })
}

import { useMutation } from "@tanstack/react-query"

import { redefinirSenha } from "../services/auth.service"

/**
 * Mutation de confirmação de nova senha (`POST /api/auth/senha/redefinir`).
 * Recebe `token` (lido da query string pela página) e `novaSenha` (do
 * formulário) — ver `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md`.
 */
export function useRedefinirSenha() {
  return useMutation({
    mutationFn: redefinirSenha,
  })
}

import { useMutation } from "@tanstack/react-query"

import { cadastrar } from "../services/auth.service"

/**
 * Mutation de cadastro de usuário (`POST /api/auth/cadastro`).
 *
 * Sem login automático após o cadastro (ver `SDD-004-cadastro-de-usuario.md`,
 * seção "Decisão de arquitetura", e `projeto-sdd/specs/SDD-004-cadastro-de-usuario.md`) —
 * esta mutation só confirma a criação da conta. Autenticar é responsabilidade da SDD-005 (login); o
 * redirecionamento pós-sucesso para `/login` é decisão de UI de quem consome
 * o hook (`CadastroForm`), não deste hook.
 */
export function useCadastro() {
  return useMutation({
    mutationFn: cadastrar,
  })
}

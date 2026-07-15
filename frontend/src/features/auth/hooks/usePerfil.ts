import { useQuery } from "@tanstack/react-query"

import { buscarPerfil } from "../services/auth.service"
import { withSessionHandling } from "../services/session-interceptor"
import { useAuthStore } from "../store/auth-store"

/**
 * Query do próprio perfil (`GET /api/auth/me`) — fonte dos dados exibidos em
 * `/perfil` e usada para pré-preencher o formulário de atualização
 * (SDD-016, base de SDD-017).
 *
 * Envolvida em `withSessionHandling` (mesma lógica de `SDD-010`): um 401
 * (token ausente/expirado/malformado, ou usuário não encontrado — ex.: conta
 * excluída entre a emissão do token e a chamada) limpa o store de
 * autenticação e redireciona para `/login`.
 *
 * `enabled: !!token` — sem token em memória (ex.: rota acessada diretamente
 * sem login, já que não existe ainda um guard de rota real, ver
 * `app/(internal)/perfil/page.tsx`), a query nem dispara; quem consome o
 * hook (`PerfilForm`) trata esse caso separado, sem chamar a API sabendo de
 * antemão que resultaria em 401.
 */
export function usePerfil() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ["auth", "perfil"],
    queryFn: () => withSessionHandling(() => buscarPerfil(token as string)),
    enabled: !!token,
    retry: false,
  })
}

import { useQuery } from "@tanstack/react-query"

import { verificarEmail } from "../services/auth.service"

/**
 * Query de verificação de e-mail (`GET /api/auth/verificar-email?token=`).
 *
 * Disparada automaticamente ao montar — é só uma query TanStack habilitada
 * (`enabled: !!token`), sem precisar de `useEffect` manual na página/tela
 * (ver SDD-013, seção "Comportamento esperado": "chama GET
 * /api/auth/verificar-email automaticamente ao carregar").
 *
 * O token é de uso único (`projeto-sdd/specs/SDD-013-verificacao-de-email.md`) — a
 * query nunca deve refazer a chamada sozinha depois da primeira resposta,
 * então `retry`/`refetchOnWindowFocus`/`refetchOnReconnect` ficam desligados;
 * repetir a chamada com o mesmo token após um sucesso ou erro só
 * consumiria/testaria o token de novo sem necessidade.
 *
 * `enabled: false` quando não há token (link acessado sem `?token=` na URL)
 * — quem consome o hook (`VerificarEmailForm`) trata esse caso separado, sem
 * chamar a API (nunca faria sentido pedir verificação sem token).
 */
export function useVerificarEmail(token: string | null) {
  return useQuery({
    queryKey: ["auth", "verificar-email", token],
    queryFn: () => verificarEmail(token as string),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

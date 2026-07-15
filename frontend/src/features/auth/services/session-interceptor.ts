import { ApiError } from "@/lib/api-client"

import { useAuthStore } from "../store/auth-store"

/**
 * Parâmetro de query lido pela tela de login para exibir a mensagem de
 * sessão expirada (ver `knowledge/frontend-feedback-ui.md`, "Sessão
 * expirada"). Mantido aqui (não em `LoginForm.tsx`) porque quem decide o
 * valor é quem dispara o redirecionamento.
 */
export const SESSAO_EXPIRADA_QUERY_PARAM = "sessao"
export const SESSAO_EXPIRADA_QUERY_VALUE = "expirada"

/**
 * Envolve chamadas a rotas autenticadas (`Authorization: Bearer <token>`).
 * Se a API responder 401 — token ausente, expirado ou malformado, o
 * contrato não distingue qual dos três (`projeto-sdd/specs/SDD-005-login.md`, "Regras
 * de negócio"/"Casos de borda") — limpa o token do store e redireciona para
 * `/login` com um indicador de sessão expirada, que a tela de login traduz
 * na mensagem amigável.
 *
 * Esqueleto básico (SDD-005): na época da implementação original ainda não
 * existia nenhuma rota autenticada real no front-end para exercitar isto de
 * ponta a ponta — nenhuma funcionalidade implementada até então tinha uma
 * tela que chamasse um endpoint protegido.
 * A função fica pronta para uso assim que a primeira chamada autenticada for
 * adicionada (ex.: `apiClient.get("/api/perfil", { token })` dentro de
 * `withSessionHandling(() => ...)`).
 *
 * Por que não fica dentro de `lib/api-client.ts`: o cliente HTTP é
 * infraestrutura genérica em `lib/`, que por regra de arquitetura nunca
 * importa de `features/` (`knowledge/frontend-arquitetura.md`, "Regra de
 * import entre features") — limpar o store de auth e redirecionar é lógica de
 * domínio de autenticação, então mora em `features/auth/`, que consome
 * `lib/api-client.ts` (direção permitida), não o contrário.
 *
 * Usa `window.location.href` (não `next/navigation`'s `useRouter`) de
 * propósito: esta função roda fora de componentes React (dentro de services
 * chamados por hooks do TanStack Query), onde não há acesso a hooks — uma
 * navegação de página inteira também garante que qualquer estado em memória
 * de uma sessão inválida seja descartado.
 *
 * Testabilidade isolada (SDD-010): a assinatura genérica
 * `(request: () => Promise<T>) => Promise<T>` permite testar esta função
 * chamando-a diretamente com um `request` mockado que rejeita com
 * `new ApiError(401, "...")`, sem precisar de `render()`/Testing Library nem
 * de uma rota autenticada real. O guard `typeof window !== "undefined"` não
 * existe para diferenciar "ambiente de teste" de "produção" — existe para
 * diferenciar a presença do global `window` (evita `ReferenceError` caso a
 * função rode num contexto sem DOM, ex.: SSR/Node puro). Em qualquer
 * ambiente de teste baseado em jsdom (Vitest/Jest com
 * `environment: "jsdom"`), `window` existe, então o guard é `true` e o
 * branch de redirecionamento roda normalmente — o que é o comportamento que
 * se quer exercitar (RF03). jsdom não implementa navegação real; atribuir
 * `window.location.href` não lança exceção, só não navega de fato — o teste
 * deve substituir `window.location` por um objeto controlado antes de
 * chamar a função (ex.: `Object.defineProperty(window, "location", { value:
 * { href: "" }, writable: true })`) e então inspecionar o valor atribuído.
 * `useAuthStore` é um store Zustand comum, resetável entre testes via
 * `useAuthStore.setState({ token: null, isAuthenticated: false })`. Guard já
 * suficiente como está — nenhuma mudança de lógica necessária.
 */
export async function withSessionHandling<T>(
  request: () => Promise<T>
): Promise<T> {
  try {
    return await request()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      useAuthStore.getState().logout()

      if (typeof window !== "undefined") {
        window.location.href = `/login?${SESSAO_EXPIRADA_QUERY_PARAM}=${SESSAO_EXPIRADA_QUERY_VALUE}`
      }
    }

    throw error
  }
}

import { create } from "zustand"

/**
 * Store de autenticação (Zustand) — guarda o token JWT emitido no login e
 * expõe as ações que o alteram.
 *
 * Por que aqui e não em `shared/`: token/sessão é dado de domínio de
 * autenticação, não um utilitário genérico — `knowledge/frontend-arquitetura.md`
 * é explícito ("Tudo relacionado a autenticação... vive dentro de
 * features/auth/"). Outras features que precisarem ler o estado autenticado
 * (ex.: exibir nome do usuário, decidir se mostra um botão de logout) importam
 * `useAuthStore` via `features/auth` (`index.ts`, API pública), nunca por
 * caminho profundo — mesma regra de import entre features do restante do
 * projeto.
 *
 * Por que SEM persistência (sem `zustand/middleware persist` / localStorage):
 * a spec (`projeto-sdd/specs/SDD-005-login.md`, "Fora do escopo") exclui
 * explicitamente "lembrar de mim" desta fase — persistir o token entre
 * reloads/sessões do navegador seria, na prática, implementar isso pela
 * porta dos fundos. Token vive só em memória: um F5 desloga o usuário,
 * coerente com SDD-004, seção "Decisão de arquitetura" (JWT stateless de
 * curta duração, sem refresh). Se "lembrar de mim" virar funcionalidade
 * no futuro, é aqui que entra o middleware `persist`.
 *
 * O contrato deixa explícito para nunca gravar o token em `localStorage` "cru"
 * fora deste store — qualquer código que precisar do token ou limpar a sessão
 * passa por `useAuthStore`, nunca por acesso direto a `window.localStorage`.
 */
interface AuthState {
  token: string | null
  isAuthenticated: boolean
  /** Salva o token recebido em um login bem-sucedido. */
  setToken: (token: string) => void
  /** Descarta o token — logout é responsabilidade do cliente (RF05/SDD-005; impossibilidade de revogar no servidor documentada em SDD-004, seção "Decisão de arquitetura"). */
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  setToken: (token) => set({ token, isAuthenticated: true }),
  logout: () => set({ token: null, isAuthenticated: false }),
}))

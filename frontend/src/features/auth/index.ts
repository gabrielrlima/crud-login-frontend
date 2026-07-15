// API pública da feature `auth` — único ponto de importação permitido por fora
// desta pasta (ver knowledge/frontend-arquitetura.md, "Regra de import entre
// features"). Não importe direto de `features/auth/components/...` fora daqui.

export { LoginForm } from "./components/LoginForm"
export { CadastroForm } from "./components/CadastroForm"
export { GithubCallbackForm } from "./components/GithubCallbackForm"
export { VerificarEmailForm } from "./components/VerificarEmailForm"
export { EsqueciSenhaForm } from "./components/EsqueciSenhaForm"
export { RedefinirSenhaForm } from "./components/RedefinirSenhaForm"
export { PerfilForm } from "./components/PerfilForm"
export { useCadastro } from "./hooks/useCadastro"
export { useLogin } from "./hooks/useLogin"
export { useAuthStore } from "./store/auth-store"
export {
  withSessionHandling,
  SESSAO_EXPIRADA_QUERY_PARAM,
  SESSAO_EXPIRADA_QUERY_VALUE,
} from "./services/session-interceptor"

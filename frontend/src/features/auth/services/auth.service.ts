import { apiClient } from "@/lib/api-client"

import type { CadastroFormValues } from "../types/cadastro.schema"
import type { LoginFormValues } from "../types/login.schema"
import type { ReenviarVerificacaoFormValues } from "../types/verificar-email.schema"
import type { EsqueciSenhaFormValues } from "../types/esqueci-senha.schema"
import type { AtualizarPerfilFormValues } from "../types/atualizar-perfil.schema"

/**
 * Resposta de sucesso de `POST /api/auth/cadastro` (contrato fixado com o
 * backend — ver `projeto-sdd/specs/SDD-004-cadastro-de-usuario.md`). Nunca inclui
 * senha nem hash (RF05).
 */
export interface CadastroResponse {
  id: string
  nome: string
  email: string
  criadoEm: string
}

/**
 * Chama o cadastro de usuário no backend. Erros (400 — campo obrigatório
 * faltando, e-mail já cadastrado, senha fora do padrão, e-mail em formato
 * inválido) chegam como `ApiError` lançado por `apiClient` (ver
 * `src/lib/api-client.ts`).
 */
export function cadastrar(
  dados: CadastroFormValues
): Promise<CadastroResponse> {
  return apiClient.post<CadastroResponse, CadastroFormValues>(
    "/api/auth/cadastro",
    dados
  )
}

/**
 * Resposta de sucesso de `POST /api/auth/login` (contrato fixado com o
 * backend — ver `projeto-sdd/specs/SDD-005-login.md`). Só o token — sem dados do
 * usuário, o back-end não retorna isso no login (ver contrato).
 */
export interface LoginResponse {
  token: string
}

/**
 * Chama o login no backend. Erro (401 — credenciais inválidas) chega como
 * `ApiError` lançado por `apiClient` (ver `src/lib/api-client.ts`) — mensagem
 * sempre genérica, igual tanto para e-mail inexistente quanto senha errada
 * (RF02/RNF02, evita enumeração de e-mails cadastrados).
 */
export function login(dados: LoginFormValues): Promise<LoginResponse> {
  return apiClient.post<LoginResponse, LoginFormValues>(
    "/api/auth/login",
    dados
  )
}

/** Corpo de `POST /api/auth/login/github` — contrato fixado (`projeto-sdd/specs/SDD-023-login-cadastro-via-github.md`). */
export interface LoginGithubRequest {
  code: string
}

/**
 * Troca o `code` do OAuth do GitHub pelo JWT da aplicação
 * (`POST /api/auth/login/github`). Resposta de sucesso é o mesmo
 * `LoginResponse` de `POST /api/auth/login` — reaproveitado, não duplicado
 * (contrato fixado, ver spec). Erro (400 — falha ao trocar o `code`, e-mail
 * não verificado disponível, ou e-mail já vinculado a uma conta local sem
 * vínculo automático, `SDD-023`, seção "Decisão de arquitetura") chega como `ApiError` com a mensagem
 * específica do contrato, exibida tal qual pelo chamador
 * (`GithubCallbackForm`).
 */
export function loginGithub(dados: LoginGithubRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse, LoginGithubRequest>(
    "/api/auth/login/github",
    dados
  )
}

/**
 * Resposta de sucesso de `GET /api/auth/verificar-email` (contrato fixado —
 * ver `projeto-sdd/specs/SDD-013-verificacao-de-email.md`). Erro (400 — token
 * inválido/expirado/já usado/inexistente) chega como `ApiError` genérico,
 * sem detalhar qual dos casos ocorreu (mesmo contrato).
 */
export interface VerificarEmailResponse {
  mensagem: string
}

/**
 * Confirma o e-mail a partir do token recebido por link (`?token=` na URL —
 * ver `app/(public)/verificar-email/page.tsx`). Token vai como query string,
 * não como corpo — rota é `GET` no contrato.
 */
export function verificarEmail(token: string): Promise<VerificarEmailResponse> {
  return apiClient.get<VerificarEmailResponse>(
    `/api/auth/verificar-email?token=${encodeURIComponent(token)}`
  )
}

/**
 * Resposta de sucesso de `POST /api/auth/verificar-email/reenviar` —
 * sempre a mesma mensagem genérica, exista ou não o e-mail, esteja ele
 * verificado ou não (RF02/SDD-013, anti-enumeração).
 */
export interface ReenviarVerificacaoResponse {
  mensagem: string
}

export function reenviarVerificacaoEmail(
  dados: ReenviarVerificacaoFormValues
): Promise<ReenviarVerificacaoResponse> {
  return apiClient.post<ReenviarVerificacaoResponse, ReenviarVerificacaoFormValues>(
    "/api/auth/verificar-email/reenviar",
    dados
  )
}

/**
 * Resposta de sucesso de `POST /api/auth/senha/esqueci` — sempre a mesma
 * mensagem genérica, exista ou não o e-mail informado (RF01/RNF01/SDD-014,
 * anti-enumeração e anti-timing-attack).
 */
export interface EsqueciSenhaResponse {
  mensagem: string
}

export function solicitarRecuperacaoSenha(
  dados: EsqueciSenhaFormValues
): Promise<EsqueciSenhaResponse> {
  return apiClient.post<EsqueciSenhaResponse, EsqueciSenhaFormValues>(
    "/api/auth/senha/esqueci",
    dados
  )
}

/**
 * Corpo de `POST /api/auth/senha/redefinir` — `token` vem da query string do
 * link recebido por e-mail (`?token=`), `novaSenha` do formulário.
 */
export interface RedefinirSenhaRequest {
  token: string
  novaSenha: string
}

/**
 * Resposta de sucesso de `POST /api/auth/senha/redefinir` (contrato fixado —
 * ver `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md`). Erro (400 — token
 * inválido/expirado/já usado, ou senha fora do padrão) chega como `ApiError`
 * com a mensagem específica do contrato (as duas situações têm mensagens
 * distintas, ao contrário do login/verificação de e-mail).
 */
export interface RedefinirSenhaResponse {
  mensagem: string
}

export function redefinirSenha(
  dados: RedefinirSenhaRequest
): Promise<RedefinirSenhaResponse> {
  return apiClient.post<RedefinirSenhaResponse, RedefinirSenhaRequest>(
    "/api/auth/senha/redefinir",
    dados
  )
}

/**
 * Resposta de sucesso de `GET /api/auth/me` e de `PUT /api/auth/perfil`
 * (mesmo formato nos dois — contrato fixado, ver
 * `projeto-sdd/specs/SDD-016-consulta-do-proprio-perfil.md` e
 * `projeto-sdd/specs/SDD-017-atualizacao-de-perfil.md`). Nunca inclui `senhaHash` ou
 * qualquer outro campo sensível.
 */
export interface PerfilResponse {
  id: string
  nome: string
  email: string
  criadoEm: string
  emailVerificado: boolean
}

/**
 * Busca os dados do próprio usuário autenticado (`GET /api/auth/me`). 401
 * (token ausente/expirado/malformado, ou usuário não encontrado) chega como
 * `ApiError` — tratado por `withSessionHandling` em `usePerfil`, não aqui.
 */
export function buscarPerfil(token: string): Promise<PerfilResponse> {
  return apiClient.get<PerfilResponse>("/api/auth/me", { token })
}

/** Corpo de `PUT /api/auth/perfil` — nome e e-mail, contrato fixado. */
export interface AtualizarPerfilRequest {
  nome: string
  email: string
}

/**
 * Atualiza nome/e-mail do próprio usuário (`PUT /api/auth/perfil`). Se o
 * e-mail mudou, o backend zera `emailVerificado` e reenvia a verificação
 * (RF03/SDD-017) — refletido no `PerfilResponse` retornado. Erro (400 —
 * e-mail duplicado, formato inválido, nome vazio) chega como `ApiError`.
 */
export function atualizarPerfil(
  token: string,
  dados: AtualizarPerfilFormValues
): Promise<PerfilResponse> {
  return apiClient.put<PerfilResponse, AtualizarPerfilRequest>(
    "/api/auth/perfil",
    dados,
    { token }
  )
}

/** Corpo de `POST /api/auth/senha/trocar` — contrato fixado. */
export interface TrocarSenhaRequest {
  senhaAtual: string
  novaSenha: string
}

/**
 * Resposta de sucesso de `POST /api/auth/senha/trocar` (contrato fixado —
 * ver `projeto-sdd/specs/SDD-018-troca-de-senha-autenticado.md`). Erro (400 — senha
 * atual incorreta, ou nova senha fora do padrão) chega como `ApiError` com a
 * mensagem específica do contrato.
 */
export interface TrocarSenhaResponse {
  mensagem: string
}

/**
 * Troca a senha do usuário autenticado (`POST /api/auth/senha/trocar`).
 * Sucesso invalida todos os tokens JWT emitidos antes deste momento
 * (mecanismo `SenhaAlteradaEm`, `SDD-014`, seção "Decisão de arquitetura") — inclusive o token
 * usado nesta própria chamada. Quem consome esta função (`useTrocarSenha`)
 * é responsável por descartar o token local também.
 */
export function trocarSenha(
  token: string,
  dados: TrocarSenhaRequest
): Promise<TrocarSenhaResponse> {
  return apiClient.post<TrocarSenhaResponse, TrocarSenhaRequest>(
    "/api/auth/senha/trocar",
    dados,
    { token }
  )
}

/**
 * Resposta de sucesso de `DELETE /api/auth/conta` (contrato fixado — ver
 * `projeto-sdd/specs/SDD-019-exclusao-de-conta.md`).
 */
export interface ExcluirContaResponse {
  mensagem: string
}

/**
 * Exclui definitivamente a própria conta (`DELETE /api/auth/conta`) —
 * hard-delete imediato (`SDD-019`, seção "Decisão de arquitetura"), sem parâmetro de corpo. Qualquer
 * requisição autenticada subsequente com o token antigo passa a retornar
 * 401 (usuário não encontrado).
 */
export function excluirConta(token: string): Promise<ExcluirContaResponse> {
  return apiClient.delete<ExcluirContaResponse>("/api/auth/conta", { token })
}

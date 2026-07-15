import { z } from "zod"

/**
 * Schema de validação do formulário de reenvio do e-mail de verificação
 * (`POST /api/auth/verificar-email/reenviar`) — ver
 * `projeto-sdd/specs/SDD-013-verificacao-de-email.md`.
 *
 * Mesma regra de e-mail usada em `cadastro.schema.ts`/`login.schema.ts` —
 * client-side é feedback rápido, não substitui a validação do backend (ver
 * `knowledge/frontend-arquitetura.md`, "Formulários: React Hook Form + Zod").
 */
export const reenviarVerificacaoSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .email("Informe um e-mail em formato válido."),
})

export type ReenviarVerificacaoFormValues = z.infer<
  typeof reenviarVerificacaoSchema
>

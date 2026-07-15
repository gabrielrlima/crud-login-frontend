import { z } from "zod"

/**
 * Schema de validação do formulário de "esqueci minha senha"
 * (`POST /api/auth/senha/esqueci`) — ver
 * `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md`.
 *
 * Mesma regra de e-mail usada em `cadastro.schema.ts`/`login.schema.ts` —
 * client-side é feedback rápido, não substitui a validação do backend (ver
 * `knowledge/frontend-arquitetura.md`, "Formulários: React Hook Form + Zod").
 */
export const esqueciSenhaSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .email("Informe um e-mail em formato válido."),
})

export type EsqueciSenhaFormValues = z.infer<typeof esqueciSenhaSchema>

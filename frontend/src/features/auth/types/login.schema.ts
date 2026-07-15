import { z } from "zod"

/**
 * Schema de validação do formulário de login (client-side).
 *
 * Espelha a entrada da spec (`projeto-sdd/specs/SDD-005-login.md`, "Comportamento
 * esperado"): e-mail e senha, ambos obrigatórios. Diferente do cadastro
 * (`cadastro.schema.ts`), aqui NÃO se aplica nenhuma regra de força de senha
 * — a spec é explícita que a regra de força só existe no cadastro; no login
 * a senha é comparada como veio contra o hash armazenado no servidor, então
 * qualquer valor não vazio é uma tentativa válida de ser enviada.
 *
 * Client-side é feedback rápido, não substitui a validação/autenticação real
 * do backend (ver `knowledge/frontend-arquitetura.md`, "Formulários: React
 * Hook Form + Zod").
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .email("Informe um e-mail em formato válido."),

  senha: z.string().min(1, "Senha é obrigatória."),
})

export type LoginFormValues = z.infer<typeof loginSchema>

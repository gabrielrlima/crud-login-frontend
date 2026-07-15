import { z } from "zod"

/**
 * Schema de validação do formulário de atualização de perfil (client-side,
 * `PUT /api/auth/perfil`).
 *
 * Mesma regra de `nome`/`email` do cadastro (`cadastro.schema.ts`) — trim +
 * obrigatório para nome, trim + formato para e-mail (ver
 * `projeto-sdd/specs/SDD-017-atualizacao-de-perfil.md`, "Comportamento esperado": "Nome:
 * mesma validação de trim de SDD-004. E-mail: mesma validação de formato +
 * unicidade case-insensitive de SDD-004"). Unicidade não é validável
 * client-side (depende do banco) — fica só no backend, como já é o caso do
 * cadastro.
 *
 * Client-side é feedback rápido, não substitui a validação do backend (ver
 * `knowledge/frontend-arquitetura.md`, "Formulários: React Hook Form + Zod").
 */
export const atualizarPerfilSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório."),

  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .email("Informe um e-mail em formato válido."),
})

export type AtualizarPerfilFormValues = z.infer<typeof atualizarPerfilSchema>

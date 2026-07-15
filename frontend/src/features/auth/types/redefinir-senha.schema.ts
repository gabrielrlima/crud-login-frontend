import { z } from "zod"

/**
 * Schema de validação do formulário de nova senha
 * (`POST /api/auth/senha/redefinir`) — mesma regra de força de senha do
 * cadastro (RNF02/SDD-004, ver `cadastro.schema.ts`): mínimo 8 caracteres,
 * com ao menos uma letra e um número (ver
 * `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md`, "Comportamento esperado").
 *
 * O `token` da URL não faz parte deste schema — não é um dado digitado pelo
 * usuário, é lido da query string pela página (Server Component) e passado
 * separadamente para a mutation (ver `RedefinirSenhaForm.tsx`).
 */
export const redefinirSenhaSchema = z.object({
  novaSenha: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra.")
    .regex(/[0-9]/, "A senha deve conter ao menos um número."),
})

export type RedefinirSenhaFormValues = z.infer<typeof redefinirSenhaSchema>

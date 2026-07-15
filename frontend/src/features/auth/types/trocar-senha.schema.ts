import { z } from "zod"

/**
 * Schema de validação do formulário de troca de senha autenticada
 * (client-side, `POST /api/auth/senha/trocar`).
 *
 * `senhaAtual`: só obrigatória aqui — é comparada contra o hash no servidor
 * (`BCrypt.Verify`), então qualquer valor não vazio é uma tentativa válida
 * de ser enviada (mesmo raciocínio de `login.schema.ts`).
 *
 * `novaSenha`: mesma regra de força de `RNF02/SDD-004` (mínimo 8
 * caracteres, ao menos uma letra e um número) — ver
 * `projeto-sdd/specs/SDD-018-troca-de-senha-autenticado.md`, "Comportamento esperado".
 *
 * `confirmarSenha`: campo só de UI (não faz parte do contrato de API —
 * `POST /api/auth/senha/trocar` só espera `senhaAtual`/`novaSenha`), existe
 * pra reduzir erro de digitação antes de trocar uma senha que invalida a
 * sessão atual. Validado via `.refine` comparando com `novaSenha`.
 */
export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Senha atual é obrigatória."),

    novaSenha: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra.")
      .regex(/[0-9]/, "A senha deve conter ao menos um número."),

    confirmarSenha: z.string().min(1, "Confirmação de senha é obrigatória."),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  })

export type TrocarSenhaFormValues = z.infer<typeof trocarSenhaSchema>

import { z } from "zod"

/**
 * Schema de validação do formulário de cadastro (client-side).
 *
 * Espelha as regras client-facing da spec
 * (`projeto-sdd/specs/SDD-004-cadastro-de-usuario.md`) e de
 * `projeto-sdd/requisitos/SDD-004-cadastro-de-usuario.md` (RNF02) — mas não
 * substitui a validação do backend (ver `knowledge/frontend-arquitetura.md`,
 * "Formulários: React Hook Form + Zod"): é feedback rápido pro usuário, a
 * regra real (unicidade de e-mail, hash de senha etc.) vive no servidor.
 *
 * `nome` e `email` passam por `trim` antes de validar — espaços em branco no
 * início/fim não contam para a validação (ver spec, "Regras de negócio" e
 * "Casos de borda"). `senha` não é normalizada.
 */
export const cadastroSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório."),

  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .email("Informe um e-mail em formato válido."),

  // RNF02: mínimo 8 caracteres, com ao menos uma letra e um número. Uma senha
  // só de letras ou só de números atende ao tamanho mínimo mas é rejeitada
  // (ver spec, "Casos de borda").
  senha: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Za-z]/, "A senha deve conter ao menos uma letra.")
    .regex(/[0-9]/, "A senha deve conter ao menos um número."),
})

export type CadastroFormValues = z.infer<typeof cadastroSchema>

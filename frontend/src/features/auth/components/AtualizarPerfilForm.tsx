"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { useAtualizarPerfil } from "../hooks/useAtualizarPerfil"
import {
  atualizarPerfilSchema,
  type AtualizarPerfilFormValues,
} from "../types/atualizar-perfil.schema"
import type { PerfilResponse } from "../services/auth.service"

// Fallback para falha que não é a resposta 400 do contrato (rede fora do
// ar, erro 5xx). O erro esperado do contrato (400 — e-mail duplicado,
// formato inválido, nome vazio) já vem pronto do servidor via ApiError.message.
const MENSAGEM_ERRO_GENERICA =
  "Não foi possível atualizar seu perfil. Tente novamente em instantes."

interface AtualizarPerfilFormProps extends React.ComponentProps<"div"> {
  /** Dados atuais do usuário (`GET /api/auth/me`) — pré-preenche o formulário (SDD-016). */
  perfil: PerfilResponse
}

export function AtualizarPerfilForm({
  className,
  perfil,
  ...props
}: AtualizarPerfilFormProps) {
  const atualizarPerfil = useAtualizarPerfil()

  // Guarda se a última submissão bem-sucedida trocou o e-mail — decide se
  // mostra o aviso de reverificação (SDD-017, Critério 3). Calculado
  // comparando o valor submetido contra `perfil.email` (prop no momento do
  // envio), não contra o estado pós-sucesso — que já reflete o e-mail novo
  // e sempre daria "igual".
  const [emailTrocadoNaUltimaSubmissao, setEmailTrocadoNaUltimaSubmissao] =
    useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AtualizarPerfilFormValues>({
    resolver: zodResolver(atualizarPerfilSchema),
    defaultValues: { nome: perfil.nome, email: perfil.email },
  })

  const enviando = isSubmitting || atualizarPerfil.isPending

  function onSubmit(dados: AtualizarPerfilFormValues) {
    // Guarda de reentrância (mesmo padrão de SDD-006 em LoginForm/CadastroForm).
    if (enviando) return

    const trocouEmail = dados.email !== perfil.email

    atualizarPerfil.mutate(dados, {
      onSuccess: (data) => {
        setEmailTrocadoNaUltimaSubmissao(trocouEmail)
        reset({ nome: data.nome, email: data.email })
      },
    })
  }

  const erroServidor = atualizarPerfil.isError
    ? atualizarPerfil.error instanceof ApiError
      ? atualizarPerfil.error.message
      : MENSAGEM_ERRO_GENERICA
    : null

  // Confirmação persiste até a próxima submissão (`isPending` volta a
  // `true`) — mesma ideia de "reversão ao estado normal ao receber qualquer
  // resposta" de `knowledge/frontend-feedback-ui.md`, adaptada pra um
  // formulário que continua editável depois do sucesso (não há
  // redirecionamento aqui, ao contrário de troca de senha/exclusão).
  const mostrarSucesso = atualizarPerfil.isSuccess && !enviando

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dados da conta</CardTitle>
          <CardDescription>Atualize seu nome e e-mail</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {mostrarSucesso && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
                >
                  Perfil atualizado com sucesso!
                  {emailTrocadoNaUltimaSubmissao && (
                    <>
                      {" "}
                      Enviamos um novo link de verificação para o e-mail
                      informado.
                    </>
                  )}
                </div>
              )}

              {erroServidor && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {erroServidor}
                </div>
              )}

              <Field data-invalid={!!errors.nome}>
                <FieldLabel htmlFor="perfil-nome">Nome</FieldLabel>
                <Input
                  id="perfil-nome"
                  autoComplete="name"
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? "perfil-nome-error" : undefined}
                  {...register("nome")}
                  disabled={enviando}
                />
                <FieldError
                  id="perfil-nome-error"
                  errors={errors.nome ? [errors.nome] : undefined}
                />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="perfil-email">E-mail</FieldLabel>
                <Input
                  id="perfil-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email
                      ? "perfil-email-description perfil-email-error"
                      : "perfil-email-description"
                  }
                  {...register("email")}
                  disabled={enviando}
                />
                <FieldDescription id="perfil-email-description">
                  Trocar o e-mail exige verificar o novo endereço novamente.
                </FieldDescription>
                <FieldError
                  id="perfil-email-error"
                  errors={errors.email ? [errors.email] : undefined}
                />
              </Field>

              <Field>
                <Button type="submit" disabled={enviando}>
                  {enviando ? "Salvando..." : "Salvar alterações"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

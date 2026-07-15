"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * Provider de estado de servidor (TanStack Query) — raiz da árvore para
 * qualquer hook de query/mutation das features (ex.: `useCadastro`, e
 * futuramente `useLogin`), conforme `knowledge/frontend-arquitetura.md`
 * ("Estado: servidor vs. cliente, tratados separadamente").
 *
 * `shared/`, não `features/auth/`, porque é infraestrutura genérica
 * reutilizada por qualquer feature — não é regra de domínio de autenticação.
 *
 * Uma instância de `QueryClient` por sessão de navegador via `useState`
 * (não módulo top-level) — evita compartilhar cache entre requisições
 * diferentes caso o componente participe de renderização no servidor.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

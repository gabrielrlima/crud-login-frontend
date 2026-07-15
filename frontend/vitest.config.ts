import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"

// Configuração de Vitest + React Testing Library para este projeto Next.js
// (App Router / Turbopack em dev e build, mas os testes de unidade/componente
// rodam sobre Vite — ver knowledge/frontend-arquitetura.md, "Testes de
// front-end", e node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).
//
// `tsconfigPaths()` resolve o alias `@/*` já usado no código-fonte
// (tsconfig.json) dentro dos testes, sem precisar duplicar o mapeamento aqui.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // `globals: false` (padrão): cada teste importa `describe`/`it`/`expect`
    // etc. explicitamente de "vitest" — evita precisar acrescentar
    // "vitest/globals" a `compilerOptions.types` do tsconfig.json só para
    // isto, então `tsc --noEmit` continua batendo com o build real do Next.js.
    css: true,
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/e2e/**",
    ],
  },
})

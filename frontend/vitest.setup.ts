import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

import "@testing-library/jest-dom/vitest"

// `globals: false` em vitest.config.ts (ver comentário lá) significa que a
// auto-limpeza que o React Testing Library registra sozinho (detectando um
// `afterEach` global de Jest/Vitest) não é acionada — sem isto, cada `render`
// de um teste ficava acumulado no `document.body` dos testes seguintes do
// mesmo arquivo, causando falsos "Found multiple elements" nos testes de
// CadastroForm/LoginForm.
afterEach(() => {
  cleanup()
})

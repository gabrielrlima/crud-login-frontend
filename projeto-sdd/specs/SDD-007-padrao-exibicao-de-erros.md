# SDD-007 — Padrão de exibição de erros de formulário (inline vs. genérico)

**Status:** Em revisão

## Necessidade

> Como usuário preenchendo cadastro ou login, quero ver mensagens de erro claras e no lugar certo da tela, para que eu entenda o que corrigir sem precisar adivinhar.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-007-padrao-exibicao-de-erros.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

**Erro de campo específico** (obrigatório, formato de e-mail, senha fora do padrão): renderizado inline, abaixo do campo (componente `FieldError` do shadcn), associado via `aria-invalid` + `aria-describedby` apontando para o `id` da mensagem de erro.

**Erro sem campo específico** (credenciais inválidas no login, falha genérica do servidor no cadastro): banner acima do formulário, `role="alert"` `aria-live="assertive"`, nunca renderizado dentro de um `Field`. O texto exibido depende de um `instanceof ApiError` sobre o erro capturado:

- Quando o erro é uma instância de `ApiError` (contrato de API), a mensagem chega pronta (`ApiError.message`) e é exibida tal qual, sem tentar mapeá-la a um campo.
- Quando o erro **não** é uma instância de `ApiError` (falha de rede, erro genérico não tratado), exibe-se em seu lugar uma string fixa de fallback, própria de cada formulário: `"Não foi possível entrar. Tente novamente em instantes."` em `LoginForm` (constante `MENSAGEM_ERRO_GENERICA`, `frontend/src/features/auth/components/LoginForm.tsx`) e `"Não foi possível concluir o cadastro. Tente novamente em instantes."` em `CadastroForm` (constante `MENSAGEM_ERRO_GENERICA`, `frontend/src/features/auth/components/CadastroForm.tsx`).

**Momento da validação client-side:** modo padrão do React Hook Form (validação disparada no `submit`), idêntico em `CadastroForm` e `LoginForm` — nenhum dos dois formulários sobrescreve o `mode` do `useForm`.

**Foco após envio malsucedido:** ao submeter o formulário com campos inválidos, o foco move automaticamente para o primeiro campo com erro — comportamento padrão do React Hook Form (`shouldFocusError: true`), não sobrescrito em nenhum dos dois formulários —, conforme exigido por `knowledge/frontend-feedback-ui.md`.

## Critérios de aceite

- [ ] Critério 1 — Erros de validação de campo (obrigatório, formato de e-mail, senha fora do padrão) aparecem inline, abaixo do campo correspondente, associados via `aria-describedby`.
- [ ] Critério 2 — A mensagem de credenciais inválidas do login aparece como mensagem genérica, não associada a um campo específico (conforme RNF02/SDD-005 — não indicar se o e-mail ou a senha está errada).
- [ ] Critério 3 — A validação client-side dispara em um momento único e documentado — apenas ao tentar enviar o formulário (modo padrão do React Hook Form, sem validação em blur) —, igual em cadastro e login.
- [ ] Critério 4 — Após um envio malsucedido, o foco move automaticamente para o primeiro campo inválido, igual em cadastro e login.
- [ ] Critério 5 — Quando o erro capturado não é uma instância de `ApiError`, exibe-se a mensagem de fallback fixa do formulário (constante `MENSAGEM_ERRO_GENERICA`) em vez do erro real.

## Casos de borda

- Campo com mais de uma regra violada (ex: senha curta e sem número): Zod retorna a primeira falha da regra combinada; `FieldError` exibe essa única mensagem, não uma lista.
- Erro de servidor chega depois que a validação client-side já passou (única ordem possível, já que o `handleSubmit` só invoca a mutation após a validação síncrona ser bem-sucedida) — os dois tipos de erro nunca aparecem simultaneamente para o mesmo campo.
- Campo com descrição permanente (`FieldDescription`) e erro de validação ao mesmo tempo: o `aria-describedby` referencia os dois ids combinados num único atributo espaço-separado, nunca só o id do erro (ex.: `aria-describedby={errors.senha ? "senha-description senha-error" : "senha-description"}`, em `CadastroForm`).
- No `LoginForm`, aviso de sessão expirada (`sessaoExpirada`) e erro de servidor (`erroServidor`) nunca aparecem juntos: quando os dois estão presentes ao mesmo tempo, o banner de erro do servidor tem precedência e o aviso de sessão expirada é suprimido (`sessaoExpirada && !erroServidor`).

## Fora do escopo

Internacionalização das mensagens de erro (idioma único nesta fase, conforme convenção do projeto).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-007-padrao-exibicao-de-erros.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-shadcn-ui.md` | Convenção de exibição de erro e acessibilidade |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), implementado organicamente durante SDD-004/SDD-005 (2026-07-13), fechado nesta sessão.
- **Notas de conclusão:** Já estava coberto pela implementação de cadastro/login: erro de campo via `FieldError` + `aria-describedby`/`aria-invalid`; erro sem campo (credenciais inválidas, falha genérica) via banner `role="alert"`; validação client-side no modo padrão do React Hook Form (disparo no submit), idêntico nos dois formulários. Auditado e confirmado nesta sessão (não precisou de código novo) — coberto por teste automatizado (inline vs. banner, nos dois formulários).
- **Arquivos alterados:** nenhum (comportamento já existente, confirmado via `frontend/src/features/auth/components/CadastroForm.test.tsx` e `LoginForm.test.tsx`).

## Notas

- Depende da convenção documentada em `knowledge/frontend-feedback-ui.md` — implementar este SDD antes de o knowledge doc existir gera inconsistência com formulários futuros.

# SDD-011 — Acessibilidade dos formulários de cadastro e login

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário que depende de leitor de tela ou navegação por teclado, quero conseguir me cadastrar e entrar sem obstáculos, para que o sistema seja utilizável independentemente de como eu interajo com ele.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-011-acessibilidade-formularios.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-shadcn-ui.md` |

## Comportamento esperado

- Todo campo com erro de validação tem `aria-invalid="true"` e `aria-describedby` apontando para o `id` da mensagem de erro correspondente (`FieldError`). O valor de `aria-describedby` é composto e condicional quando o campo também tem uma dica permanente (`FieldDescription`): no campo Senha do `CadastroForm`, é `"senha-description senha-error"` quando inválido e `"senha-description"` quando válido, para que a dica de senha permaneça associada ao campo mesmo sem erro. Os demais campos (Nome e E-mail em ambos os formulários, Senha no `LoginForm`, que não tem dica) seguem o padrão simples: `id` do erro quando inválido, `undefined` quando válido. Os IDs literais usados são `nome-error`, `email-error`, `senha-error` e `senha-description`.
- Após um envio malsucedido (validação Zod falha), o foco move automaticamente para o primeiro campo inválido — comportamento padrão do React Hook Form (`shouldFocusError`, ativado por padrão), sem código adicional.
- Mensagens assíncronas (banner de erro genérico, confirmação de sucesso) usam `aria-live` (`assertive` para erro, `polite` para sucesso/avisos), perceptíveis por leitor de tela sem precisar de foco explícito. A implementação é um banner inline — `<div role="alert" aria-live="assertive">`/`<div role="status" aria-live="polite">` renderizado acima do formulário — não um componente de toast flutuante.
- Ordem de tab segue a ordem natural do DOM. Em ambas as telas, o `GithubOAuthButton` (focável) precede todos os campos do formulário. No cadastro: Nome → E-mail → Senha → Enviar. No login: E-mail → link "Esqueci minha senha" → Senha → Enviar — o link (de SDD-014) é renderizado dentro do mesmo `Field` da senha, num `div` acima do `Input`, antes dele no DOM, por isso recebe foco antes do campo de senha. Nenhum `tabIndex` manual é necessário em nenhum dos dois casos.

## Critérios de aceite

- [ ] Critério 1 — Toda mensagem de erro de validação é associada ao campo correspondente via `aria-describedby`/`aria-invalid`.
- [ ] Critério 2 — Após um envio malsucedido, o foco move para o primeiro campo inválido.
- [ ] Critério 3 — Erros assíncronos (banner inline) são anunciados a leitores de tela via `aria-live`.
- [ ] Critério 4 — A ordem de tab permanece lógica após a adição do campo de nome ao formulário de cadastro (block de login adaptado).

## Casos de borda

- Múltiplos campos inválidos simultaneamente: o foco vai para o primeiro campo inválido na ordem do formulário (comportamento padrão do RHF), não necessariamente o primeiro a ser preenchido.

## Fora do escopo

Auditoria de acessibilidade completa (WCAG) do restante da aplicação — só os dois formulários desta SDD.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-011-acessibilidade-formularios.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md`, `knowledge/frontend-shadcn-ui.md` | Radix/shadcn cobrem parte da acessibilidade nativa; esta SDD cobre o que não é automático |
| SDD relacionado | `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` | O link "Esqueci minha senha" dessa SDD é renderizado dentro do `Field` da senha no `LoginForm`, antes do `Input`, e por isso faz parte da ordem de tab desta SDD |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), implementado organicamente durante SDD-004/SDD-005 (2026-07-13), fechado nesta sessão.
- **Notas de conclusão:** Já estava coberto: `aria-invalid`/`aria-describedby` em todo campo com erro; movimentação de foco para o primeiro campo inválido via comportamento padrão do React Hook Form (`shouldFocusError`); `aria-live` nas mensagens assíncronas; ordem de tab natural (nome→e-mail→senha no cadastro). Auditado e confirmado nesta sessão, sem código novo, por inspeção direta do código de `CadastroForm`/`LoginForm` — os testes automatizados dos dois formulários (`CadastroForm.test.tsx`, `LoginForm.test.tsx`) não contêm asserção de `aria-invalid`, `aria-describedby`, `aria-live` ou de foco (`toHaveFocus`), cobrindo hoje só texto de mensagem e estado `disabled`.
- **Arquivos alterados:** nenhum (comportamento já existente, confirmado via inspeção direta do código de `CadastroForm`/`LoginForm`).

## Notas

- Os primitivos Radix por trás do shadcn já cobrem boa parte da acessibilidade base — esta SDD foca no que a adaptação do block (campo extra, validação assíncrona) pode ter quebrado ou deixado incompleto.

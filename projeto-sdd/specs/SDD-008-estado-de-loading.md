# SDD-008 — Estado de carregamento (loading) dos formulários de cadastro e login

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário enviando o formulário de cadastro ou login, quero ver um indicador claro de que a ação está em andamento, para que eu saiba que não preciso clicar de novo.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-008-estado-de-loading.md` |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

Estado derivado `enviando = isSubmitting (React Hook Form) || mutation.isPending (TanStack Query)`, calculado a cada render, sem estado adicional próprio.

Enquanto `enviando` é verdadeiro:
- Todos os campos de entrada ficam `disabled`.
- O botão de envio fica `disabled` e troca o texto: `"Cadastrando..."` no cadastro, `"Entrando..."` no login — textos literais, não apenas ilustrativos.

O estado `enviando` não se propaga para o botão de login social (`GithubOAuthButton`) nem para os links de navegação do formulário (“Esqueci minha senha”, “Criar conta”/“Entrar”). Esses elementos permanecem clicáveis durante o envio — só os campos de entrada e o botão de submit do próprio formulário ficam `disabled`.

Assim que a mutation resolve — sucesso ou erro — `isPending` volta a `false` automaticamente (comportamento nativo do TanStack Query), revertendo o formulário ao estado normal sem código adicional de "reset" manual.

## Critérios de aceite

- [ ] Critério 1 — O sistema exibe indicador visual de carregamento (spinner e/ou texto do botão alterado) entre o clique em enviar e a resposta do servidor.
- [ ] Critério 2 — O sistema desabilita os campos de entrada durante o carregamento.
- [ ] Critério 3 — O sistema reverte ao estado normal do formulário assim que a resposta (sucesso ou erro) chega.
- [ ] Critério 4 — O botão de login social (GitHub) e os links de navegação do formulário permanecem habilitados durante o carregamento; só campos de entrada e botão de envio ficam `disabled`.

## Casos de borda

- Erro de rede (timeout, servidor fora do ar): a mutation rejeita, `isPending` reverte a `false`, campos e botão voltam a ficar habilitados, banner de erro genérico aparece (ver `specs/SDD-007-padrao-exibicao-de-erros.md`).
- Sucesso: `enviando` deixa de importar, pois o formulário inteiro é substituído pela tela de confirmação (ver `specs/SDD-009-feedback-de-sucesso.md`).

## Fora do escopo

Indicador de progresso granular (barra de progresso) — só estado binário carregando/não carregando.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-008-estado-de-loading.md` | Sempre |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de estado de carregamento (seção "Estado de carregamento") |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), implementado organicamente durante SDD-004/SDD-005 (2026-07-13), fechado nesta sessão.
- **Notas de conclusão:** Já estava coberto: `enviando = isSubmitting || mutation.isPending` desabilita campos/botão e altera o texto do botão; reverte automaticamente ao resolver a mutation (sucesso ou erro), sem estado manual de "reset". Auditado e confirmado nesta sessão — coberto por teste automatizado (loading durante envio, reversão em caso de erro).
- **Arquivos alterados:** nenhum (comportamento já existente, confirmado via testes de `CadastroForm`/`LoginForm`).

## Notas

- Complementa SDD-006 (prevenir duplo submit) — o mesmo estado de "enviando" alimenta as duas.

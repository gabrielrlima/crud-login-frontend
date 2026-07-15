# SDD-019 — Exclusão da própria conta

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário autenticado, quero poder excluir minha própria conta, para que eu tenha controle sobre encerrar meu relacionamento com o sistema e meus dados.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-019-exclusao-de-conta.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md`, `knowledge/frontend-feedback-ui.md` |
| Decisões relacionadas | `specs/SDD-015-bloqueio-por-tentativas.md` (normalização do identificador de `TentativaLogin`), `specs/SDD-010-expiracao-de-sessao.md` (interceptor global de sessão em respostas `401`) |

## Comportamento esperado

**`DELETE /api/auth/conta`** (autenticado):
- Remove definitivamente o registro do usuário do banco (hard-delete — ver "Decisão de arquitetura" abaixo), com remoção em cascata de `TokenVerificacaoEmail`, `TokenResetSenha` e, por identificador de e-mail normalizado, `TentativaLogin` associados. `TentativaLogin.Identificador` é sempre gravado em minúsculas (`email.ToLowerInvariant()` no registro da tentativa, decisão de `SDD-015`), enquanto `Usuario.Email` preserva o case exatamente como digitado no cadastro (só recebe `Trim()`, nunca lowercase). Por isso a exclusão calcula `usuario.Email.ToLowerInvariant()` antes de filtrar `TentativaLogin` pelo identificador — sem essa normalização, tentativas de login associadas a um e-mail cadastrado com maiúsculas ficariam órfãs no banco, violando o Critério 2.
- Sucesso: `200 { "mensagem": "Conta excluída com sucesso." }`.
- Efeito sobre o token ativo (Critério 3): natural — qualquer requisição autenticada subsequente com o token da conta excluída retorna `401` (usuário não encontrado, mesmo comportamento de `SDD-016` para conta inexistente).

**Front-end:** botão "Excluir conta" na tela `/perfil` (`ExcluirContaSection`), atrás de um `AlertDialog` de confirmação explícita — título "Excluir sua conta?", corpo "Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente." (a decisão de hard-delete é irreversível, ver "Decisão de arquitetura" abaixo), botões "Cancelar" e "Sim, excluir minha conta" (este último assume o estado de carregamento "Excluindo..." enquanto a chamada está em andamento).

Ao confirmar, chama o endpoint por meio do hook `useExcluirConta`. Em caso de sucesso, o próprio componente exibe inline as mensagens "Conta excluída com sucesso!" e, em seguida, "Redirecionando...", aguarda `1500ms` (constante `REDIRECIONAMENTO_APOS_SUCESSO_MS`) e só então redireciona para a home (`"/"`, constante `ROTA_APOS_EXCLUSAO`) — não `/login`, para não sugerir que a conta ainda existe.

Essa ausência de redirecionamento para `/login` vale para o caminho de sucesso tratado localmente pelo componente. `useExcluirConta` envolve a chamada com `withSessionHandling` (`features/auth/services/session-interceptor.ts` — interceptor global de sessão descrito em `SDD-010` e `knowledge/frontend-feedback-ui.md`), que se aplica a esta chamada como a qualquer outra rota autenticada: uma resposta `401` deste endpoint (não um erro de negócio comum, mas uma falha de autenticação — por exemplo a segunda chamada de uma chamada dupla, ver "Casos de borda") é interceptada antes de chegar ao componente, limpa a sessão local (`logout()`) e redireciona via `window.location.href` para `/login?sessao=expirada` — nesse caso específico, portanto, há sim redirecionamento para `/login`.

Qualquer outro erro que não seja capturado pelo interceptor (ou seja, que não seja um `401`) e não seja reconhecido como `ApiError` exibe a mensagem genérica "Não foi possível excluir sua conta. Tente novamente em instantes." (constante `MENSAGEM_ERRO_GENERICA`).

## Critérios de aceite

- [x] Critério 1 — O sistema exige autenticação válida (token JWT) para excluir a própria conta.
- [x] Critério 2 — O sistema aplica hard-delete (ver "Decisão de arquitetura" abaixo) a todos os dados do usuário, de forma consistente.
- [x] Critério 3 — O sistema define e implementa explicitamente o efeito sobre o token JWT ativo no momento da exclusão.
- [x] Critério 4 — Não há prazo de retenção nesta decisão (hard-delete imediato) — ver "Decisão de arquitetura" abaixo, "Nota de compliance".

## Decisão de arquitetura

**Contexto:** SDD-019 (exclusão da própria conta) precisa definir o que acontece aos dados do usuário ao excluir a conta. Esta decisão toca a LGPD (Lei 13.709/2018) diretamente — direito de eliminação dos dados pessoais (art. 18, VI) e as hipóteses em que o controlador pode conservar dado mesmo após pedido de eliminação (art. 16 — cumprimento de obrigação legal/regulatória, uso exclusivo do controlador vedado o acesso por terceiro, entre outras).

**Nota de compliance:** este é um projeto de exercício da esteira de desenvolvimento. Em um contexto real de produção da UY3, a escolha entre hard-delete e soft-delete/anonimização — e qualquer prazo de retenção — deve passar por revisão formal do time de Compliance/Jurídico antes de ir para produção. Este registro documenta uma decisão técnica de implementação para fins de aprendizado/demonstração, não um parecer jurídico. (Decisão registrada em 2026-07-14; status da decisão: Aceita.)

**Decisão:** hard-delete imediato — ao confirmar a exclusão, o registro do usuário e todos os dados diretamente associados (tokens de verificação de e-mail, tokens de reset de senha, tentativas de login registradas para aquele e-mail) são removidos definitivamente do banco de dados, sem período de carência e sem soft-delete/flag de inativação.

**Alternativas consideradas:**
- **Soft-delete com anonimização (retenção temporária)** — descartada nesta decisão: exigiria definir prazo de retenção e job de expurgo, decisão que dependeria de revisão de compliance antes de ser fixada; hard-delete evita gerar uma obrigação de retenção não avaliada por quem tem competência para isso.
- **Soft-delete com flag `excluido_em`, sem anonimização** — descartada: mantém dado pessoal identificável mesmo "excluído", o que não atende ao espírito do direito de eliminação (art. 18, VI, LGPD).

**Consequências:**
- Exclusão é **irreversível** — não há como recuperar a conta ou os dados após confirmada.
- **Nenhuma trilha de auditoria** permanece após a exclusão — se uma investigação de fraude/segurança precisar de histórico de uma conta excluída, o dado já não existe. Risco que deve ser avaliado pelo Compliance/Jurídico antes de qualquer ambiente de produção real.
- Token JWT ativo no momento da exclusão é invalidado como efeito colateral natural do hard-delete: o pipeline de autenticação busca o usuário pelo Id da claim `sub` a cada requisição (mesmo padrão de `SDD-014`); usuário inexistente rejeita a requisição (401) sem precisar de mecanismo adicional.
- Remoção em cascata dos registros dependentes (tokens de verificação/reset, tentativas de login) via `OnDelete(DeleteBehavior.Cascade)` nas configurações EF já existentes.
- RNF01 de `requisitos/SDD-019-exclusao-de-conta.md` ("respeitar prazo de retenção") deixa de se aplicar — não há período de retenção nesta decisão.
- Esta decisão deve ser **revisitada, não presumida como definitiva**, antes de qualquer ambiente de produção real com dados de usuários de verdade.

## Casos de borda

- Chamada dupla ao endpoint (ex.: duplo clique): a segunda chamada recebe `401` (usuário já não existe) — comportamento aceitável, não é um bug. No front-end, esse `401` é capturado pelo interceptor global de sessão (`withSessionHandling`, ver `SDD-010`), que limpa a sessão local e redireciona para `/login?sessao=expirada` — não para a tela de confirmação de sucesso descrita em "Comportamento esperado".

## Fora do escopo

Exclusão administrativa de contas de terceiros, exclusão em lote — só autoexclusão pelo próprio usuário. Qualquer forma de retenção, soft-delete ou período de carência — ver "Decisão de arquitetura" acima (hard-delete imediato).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-019-exclusao-de-conta.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md`, `knowledge/frontend-feedback-ui.md` | Convenções de back-end, decisão de ciclo de vida de dados e interceptor global de sessão |
| Decisões relacionadas | `specs/SDD-015-bloqueio-por-tentativas.md`, `specs/SDD-010-expiracao-de-sessao.md` | Normalização do identificador de `TentativaLogin`; comportamento do interceptor global em respostas `401` |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Code (subagentes via Workflow, track back-end + front-end em paralelo) + Claude Sonnet 5 (orquestração e verificação independente).
- **Notas de conclusão:** `DELETE /api/auth/conta` aplica hard-delete imediato (SDD-019): remove o `Usuario` e, explicitamente (não só via FK cascade, para continuar determinístico sob EF InMemory nos testes), `TokenVerificacaoEmail`/`TokenResetSenha` associados e `TentativaLogin` pelo e-mail normalizado. Efeito sobre o token ativo (Critério 3) é natural, sem mecanismo adicional: qualquer requisição autenticada subsequente falha com 401 porque o `sub` da claim não resolve mais um usuário — mesmo comportamento de SDD-016/017/018 para conta inexistente, inclusive no caso de chamada dupla ao próprio endpoint. Front-end: `ExcluirContaSection` em `/perfil` com `AlertDialog` de confirmação explícita ("esta ação não pode ser desfeita") antes de chamar o endpoint, redirecionando para tela pública de confirmação. Verificado de forma independente: `dotnet build` (0/0), `dotnet test` (124/124), `pnpm lint`/`tsc --noEmit`/`pnpm test` (84/84)/`pnpm build` sem erros.
- **Arquivos alterados:** `backend/Features/Auth/ExclusaoConta/{ExcluirContaService,ResultadoExcluirConta}.cs`, `backend/Controllers/AuthController.cs` (endpoint `DELETE /conta`), `backend.Tests/Features/Auth/ExclusaoConta/ExcluirContaServiceTests.cs`, `frontend/src/features/auth/hooks/useExcluirConta.ts`, `frontend/src/features/auth/components/ExcluirContaSection.tsx` (+ teste), `frontend/src/components/ui/alert-dialog.tsx` (novo componente shadcn/ui usado para a confirmação).

## Notas

- Decisão de soft vs. hard delete é de compliance/arquitetura (LGPD), distinta da tensão de token ativo de SDD-004 — mereceu decisão de arquitetura própria (ver "Decisão de arquitetura" acima), não a mesma revisão usada por SDD-014/SDD-017/SDD-018.
- Hard-delete confirmado explicitamente com o usuário em 2026-07-14, com nota de que é decisão técnica de projeto de exercício — pendente revisão formal de Compliance/Jurídico antes de produção real (ver "Decisão de arquitetura" acima).

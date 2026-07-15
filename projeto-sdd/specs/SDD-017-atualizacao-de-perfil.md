# SDD-017 — Atualização de dados de perfil (nome e e-mail)

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário autenticado, quero atualizar meu nome e e-mail, para que meus dados cadastrais fiquem corretos e atualizados.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-017-atualizacao-de-perfil.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md` |

## Comportamento esperado

**`PUT /api/auth/perfil`** (autenticado):
- Request: `{ "nome": string, "email": string }`.
- Nome: mesma validação de trim de `SDD-004` (obrigatório após trim). E-mail: obrigatório, validado contra a regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` (mesma usada em `SDD-004` — exige um único `@`, sem espaços internos antes ou depois, e um domínio após o ponto) e unicidade case-insensitive de `SDD-004` (ignorando o próprio usuário na checagem de duplicidade).
- **Troca de e-mail exige reverificação** (Critério 3): se o e-mail informado for diferente do atual, `EmailVerificado` volta para `false` e um novo token de verificação é gerado e enviado (reaproveitando `VerificacaoEmailService` de `SDD-013`) para o **novo** endereço.
- **Efeito sobre o token JWT ativo** (Critério 4): trocar o e-mail **não** invalida a sessão atual — só a troca de senha invalida (mecanismo `SenhaAlteradaEm`, decidido em `specs/SDD-014-recuperacao-de-senha.md`). Trocar e-mail é uma mudança de dado cadastral, não um evento de segurança equivalente a comprometimento de conta.
- Sucesso: `200` com os dados atualizados (mesmo formato de `GET /api/auth/me`).
- Erro: `400 { "erro": string }`, campos validados nesta ordem — nome antes de e-mail, e formato antes de duplicidade — de forma que, se mais de um campo for inválido ao mesmo tempo, prevalece o primeiro erro da lista: `"Nome é obrigatório."` (vazio ou só espaços após trim), `"E-mail é obrigatório."` (vazio ou só espaços), `"E-mail em formato inválido."` (não bate a regex acima), `"E-mail já cadastrado."` (duplicidade case-insensitive, ignorando o próprio usuário).
- 401: token ausente, expirado, malformado, ou usuário do token não encontrado (ex.: conta excluída) — mesma regra de `SDD-005`/`SDD-016`.

**Front-end:** `/perfil` (mesma tela de `SDD-016`) com formulário pré-preenchido; descrição fixa "Trocar o e-mail exige verificar o novo endereço novamente.", botão "Salvar alterações" (estado de carregamento: "Salvando..."). Sucesso exibe "Perfil atualizado com sucesso!"; ao trocar e-mail com sucesso, exibe também o aviso "Enviamos um novo link de verificação para o e-mail informado.".

## Critérios de aceite

- [x] Critério 1 — O sistema valida unicidade de e-mail (case-insensitive) ao trocar, reaplicando a regra de RF02/SDD-004.
- [x] Critério 2 — O sistema aplica ao nome as mesmas regras de trim/validação usadas no cadastro (SDD-004).
- [x] Critério 3 — O sistema define explicitamente se a troca de e-mail exige reverificação (reabrindo o fluxo de SDD-013) antes de considerar o novo e-mail confirmado.
- [x] Critério 4 — O sistema define e implementa explicitamente o efeito da troca de e-mail sobre o token JWT ativo (invalidar ou manter) — decisão registrada, não implícita.

## Casos de borda

- Usuário informa o mesmo e-mail já cadastrado, possivelmente com capitalização diferente (ex.: cadastro `usuaria@teste.com`, envio `USUARIA@TESTE.COM`): não reenvia verificação, não altera `EmailVerificado` — mas nome e e-mail são sempre regravados antes da checagem de mudança real, então a capitalização armazenada é atualizada para a forma recém-enviada mesmo sem disparar reverificação.
- Dois usuários tentando adotar o mesmo e-mail simultaneamente: a checagem de unicidade no banco (índice único `citext`) rejeita a segunda tentativa com `400`, mesma garantia de `SDD-004`.

## Fora do escopo

Alteração de outros dados além de nome e e-mail. Reversão automática do e-mail se a reverificação não for concluída (o usuário simplesmente permanece com `EmailVerificado = false` até verificar).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-017-atualizacao-de-perfil.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de back-end e formulário de edição |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Code (subagentes via Workflow, track back-end + front-end em paralelo) + Claude Sonnet 5 (orquestração e verificação independente).
- **Notas de conclusão:** `PUT /api/auth/perfil` valida nome (trim, não vazio) e e-mail (formato + unicidade `citext` ignorando o próprio usuário) com as mesmas regras de RF02/SDD-004. Troca de e-mail (Critério 3) zera `EmailVerificado` e reaproveita `VerificacaoEmailService` (SDD-013) para enviar novo token ao **novo** endereço. Decisão explícita registrada (Critério 4): troca de e-mail **não** invalida o token JWT ativo — só troca de senha invalida (mecanismo `SenhaAlteradaEm`/SDD-004); mudança de e-mail é dado cadastral, não evento de comprometimento de conta. Front-end: `AtualizarPerfilForm` pré-preenchido via SDD-016, com aviso de reverificação quando o e-mail muda. Verificado de forma independente: `dotnet build` (0/0), `dotnet test` (124/124), `pnpm lint`/`tsc --noEmit`/`pnpm test` (84/84)/`pnpm build` sem erros.
- **Arquivos alterados:** `backend/Features/Auth/Perfil/{AtualizarPerfilRequest,ResultadoAtualizarPerfil}.cs` (+ `PerfilService.cs` estendido), `backend/Controllers/AuthController.cs` (endpoint `PUT /perfil`), `backend.Tests/Features/Auth/Perfil/*`, `frontend/src/features/auth/types/atualizar-perfil.schema.ts`, `frontend/src/features/auth/hooks/useAtualizarPerfil.ts`, `frontend/src/features/auth/components/AtualizarPerfilForm.tsx` (+ teste).

## Notas

- Depende de SDD-016 (consulta de perfil) e, se a troca de e-mail exigir reverificação, de SDD-013 (verificação de e-mail).
- Mesma revisão de SDD-004 (efeito sobre token ativo) reaberta por SDD-014 e SDD-018 — resolver como uma decisão única, não três isoladas.

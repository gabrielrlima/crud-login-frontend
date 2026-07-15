# SDD-018 — Troca de senha do usuário autenticado

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário autenticado, quero trocar minha senha informando a senha atual, para que eu mantenha minha conta segura sem precisar do fluxo de recuperação por e-mail.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-018-troca-de-senha-autenticado.md` |
| SDD relacionado | `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` (mecanismo `SenhaAlteradaEm`/invalidação de JWT reaproveitado aqui, sem nova decisão de arquitetura) |
| SDD relacionado | `projeto-sdd/specs/SDD-016-consulta-do-proprio-perfil.md` (mesmo padrão de `401` sem corpo quando o usuário do token não existe mais) |
| SDD relacionado | `projeto-sdd/specs/SDD-017-atualizacao-de-perfil.md` (mesmo padrão de `401` sem corpo quando o usuário do token não existe mais) |
| SDD relacionado | `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md` (contas criadas só via GitHub têm `SenhaHash` nulo) |
| SDD relacionado | `projeto-sdd/specs/SDD-009-feedback-de-sucesso.md` (padrão e tempo de redirecionamento após sucesso reaproveitados aqui) |
| Conhecimento relacionado | `knowledge/csharp.md` |

## Comportamento esperado

**`POST /api/auth/senha/trocar`** (autenticado):
- Request: `{ "senhaAtual": string, "novaSenha": string }` — as duas propriedades são `string?` (nullable) no record da requisição, de propósito: a ausência de um campo no corpo cai na mesma validação de negócio abaixo, com a mesma mensagem de erro, em vez do 400 genérico de model binding do ASP.NET Core.
- Valida `senhaAtual` contra o hash armazenado (BCrypt.Verify) — se ausente ou incorreta, `400 { "erro": "Senha atual incorreta." }`. Usuário com conta criada só via GitHub (`SenhaHash` nulo — `SDD-023`) sempre cai nesse mesmo caso, já que não existe senha local para comparar; a resposta não distingue esse cenário do de senha errada.
- `novaSenha` reaplica os critérios de força de `RNF02/SDD-004` — se ausente ou fora do padrão, `400 { "erro": "Senha fora do padrão exigido." }`.
- Sucesso: gera novo hash bcrypt (fator de custo 12, mesmo valor de `RNF01/SDD-004`), atualiza `SenhaAlteradaEm` (mesmo campo/mecanismo de `SDD-014`) — **invalida todos os tokens JWT emitidos antes deste momento**, em qualquer dispositivo. Retorna `200 { "mensagem": "Senha alterada com sucesso." }`.
- 401 sem corpo (distinto do 400 com `{ "erro": string }` acima) quando o token estiver ausente, expirado, malformado, ou quando o usuário do token não existe mais no banco — conta excluída entre a emissão do token e esta chamada —, mesma regra e mesmo formato de resposta de `SDD-016`/`SDD-017`.

**Front-end:** formulário na tela `/perfil`, dentro de um `Card` com título "Alterar senha" e descrição "Você precisará entrar novamente após concluir" (três campos, nesta ordem: senha atual, nova senha, confirmação). Botão "Alterar senha" (estado de carregamento: "Alterando..."). Validação client-side (zod) antes de chamar a API: "Senha atual é obrigatória." (campo vazio), "A senha deve ter no mínimo 8 caracteres.", "A senha deve conter ao menos uma letra." e "A senha deve conter ao menos um número." (nova senha fora do padrão mínimo), "As senhas não coincidem." (confirmação divergente da nova senha — campo só de UI, não faz parte do contrato de API). Ao suceder, o próprio token da sessão atual também é invalidado (mesmo mecanismo): a tela troca o formulário por uma confirmação com o título "Senha alterada com sucesso!" e o subtexto "Sua sessão foi encerrada por segurança. Redirecionando para o login...", e após 1500ms redireciona para `/login` — mesmo padrão e mesmo tempo de feedback de sucesso definidos em `SDD-009`.

## Critérios de aceite

- [x] Critério 1 — O sistema exige a senha atual correta antes de aceitar a definição de uma nova senha.
- [x] Critério 2 — O sistema reaplica os critérios de força de senha de RNF02/SDD-004 à nova senha.
- [x] Critério 3 — O sistema gera novo hash bcrypt para a nova senha (RNF01/SDD-004).
- [x] Critério 4 — O sistema define e implementa explicitamente se tokens JWT já emitidos permanecem válidos após a troca — mesmo mecanismo `SenhaAlteradaEm` decidido em `specs/SDD-014-recuperacao-de-senha.md`, reaproveitado por `specs/SDD-017-atualizacao-de-perfil.md`.

## Casos de borda

- Usuário troca a senha e, na mesma janela, tenta usar o token antigo em outra aba: rejeitado (401), mesmo comportamento de `SDD-014`.
- Nova senha igual à atual: aceita normalmente (não há regra explícita proibindo reuso da mesma senha nesta fase).
- Usuário com conta criada só via GitHub (`SDD-023`, sem senha local) chama este endpoint: tratado como senha atual incorreta (`400`), mesma mensagem e código de qualquer senha errada — nunca revela que a conta não tem senha local.
- Token válido cujo usuário foi excluído entre a emissão do token e esta chamada: `401` sem corpo, mesmo comportamento de `SDD-016`/`SDD-017`.
- `senhaAtual` ou `novaSenha` ausente do corpo da requisição (não só vazia): cai na mesma validação de negócio do campo correspondente — `400` com a mensagem de erro de negócio, nunca o erro genérico de model binding do ASP.NET Core.

## Fora do escopo

Notificação por e-mail avisando a troca. Histórico/política de não reutilização de senhas antigas.

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-018-troca-de-senha-autenticado.md` | Sempre |
| SDD relacionado | `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` | Sim — mecanismo `SenhaAlteradaEm` já decidido lá, reaproveitado aqui sem nova decisão de arquitetura |
| SDD relacionado | `projeto-sdd/specs/SDD-016-consulta-do-proprio-perfil.md` | Sim — mesmo padrão de `401` sem corpo para usuário do token não encontrado |
| SDD relacionado | `projeto-sdd/specs/SDD-017-atualizacao-de-perfil.md` | Sim — mesmo padrão de `401` sem corpo para usuário do token não encontrado |
| SDD relacionado | `projeto-sdd/specs/SDD-023-login-cadastro-via-github.md` | Sim — contas criadas só via GitHub têm `SenhaHash` nulo, tratado aqui como senha atual incorreta |
| SDD relacionado | `projeto-sdd/specs/SDD-009-feedback-de-sucesso.md` | Sim — padrão e tempo de redirecionamento após sucesso reaproveitados aqui |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/frontend-shadcn-ui.md` | Convenções de back-end e formulário |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Code (subagentes via Workflow, track back-end + front-end em paralelo) + Claude Sonnet 5 (orquestração e verificação independente).
- **Notas de conclusão:** `POST /api/auth/senha/trocar` valida `senhaAtual` com `BCrypt.Verify` (400 "Senha atual incorreta." se falhar), reaplica os critérios de força de RNF02/SDD-004 na nova senha (400 "Senha fora do padrão exigido." se não atender), gera novo hash bcrypt (fator de custo 12) e atualiza `SenhaAlteradaEm`, reaproveitando o mecanismo já existente de `SDD-014` — invalida todos os JWTs emitidos antes da troca, em qualquer dispositivo, inclusive a sessão que fez a chamada. Front-end redireciona para `/login` após sucesso, coerente com essa invalidação. **Nota de verificação:** o workflow que gerou esta etapa avisou que o classificador de segurança (claude-sonnet-5) ficou indisponível ao revisar especificamente este subagente; por isso essa etapa recebeu verificação manual extra — leitura direta de `TrocarSenhaService.cs`, `TrocarSenhaRequest.cs`, `ResultadoTrocarSenha.cs` e do trecho correspondente de `AuthController.cs`, além de `dotnet build`/`dotnet test` reexecutados de forma independente. Nenhum problema encontrado: código segue exatamente o padrão já estabelecido em `RecuperacaoSenhaService`/`PerfilService`, sem lógica insegura ou divergente da spec. `dotnet build` (0 avisos/0 erros), `dotnet test` (124/124), `pnpm lint`/`tsc --noEmit`/`pnpm test` (84/84)/`pnpm build` sem erros.
- **Arquivos alterados:** `backend/Features/Auth/TrocaSenha/{TrocarSenhaService,TrocarSenhaRequest,ResultadoTrocarSenha}.cs`, `backend/Controllers/AuthController.cs` (endpoint `POST /senha/trocar`), `backend.Tests/Features/Auth/TrocaSenha/*`, `frontend/src/features/auth/types/trocar-senha.schema.ts`, `frontend/src/features/auth/hooks/useTrocarSenha.ts`, `frontend/src/features/auth/components/TrocarSenhaForm.tsx` (+ teste).

## Notas

- Distinta de SDD-014 (recuperação de senha): aqui o usuário já tem sessão válida e confirma a senha atual; lá o usuário não tem sessão e prova identidade via token de e-mail.

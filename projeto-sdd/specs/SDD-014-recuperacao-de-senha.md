# SDD-014 — Recuperação de senha via e-mail

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como usuário que esqueceu a senha, quero solicitar uma redefinição pelo meu e-mail cadastrado, para que eu recupere o acesso à minha conta sem depender de suporte manual.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-014-recuperacao-de-senha.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md`, `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-feedback-ui.md` |

## Comportamento esperado

**`POST /api/auth/senha/esqueci`:**
- Request: `{ "email": string }`.
- Sempre responde `200 { "mensagem": "Se o e-mail estiver cadastrado, enviamos as instruções para redefinir a senha." }`, independente de o e-mail existir (RF02, anti-enumeração por conteúdo da resposta). Não há equalização de tempo de resposta entre os dois ramos: quando o e-mail existe, o fluxo aguarda de forma síncrona a geração do token, a gravação em banco (`SaveChangesAsync`) e o envio do e-mail via SMTP antes de responder; quando o e-mail não existe, o fluxo retorna após uma única consulta (`SingleOrDefaultAsync`) — sem delay artificial nem envio em *fire-and-forget* para igualar os tempos. RNF01 (anti-timing-attack) não é atendido pela implementação atual.
- Se o e-mail existir: gera token de reset de 256 bits (`RandomNumberGenerator.GetBytes(32)`), codificado em base64url, hash calculado com SHA-256 (`SHA256.HashData`) antes de armazenar — nunca o valor em texto puro. O hash é gravado em `tokens_reset_senha` (colunas `id` uuid, `usuario_id` uuid com FK `ON DELETE CASCADE`, `token_hash` text not null, `expira_em` timestamptz not null — expiração de 30 minutos, `usado_em` timestamptz nullable, `criado_em` timestamptz not null; índice único `ix_tokens_reset_senha_token_hash` sobre `token_hash`), uso único, invalidando qualquer token de reset anterior do mesmo usuário. Envia e-mail via `IEmailSender` com assunto "Redefinição de senha" e corpo contendo o link `{FRONTEND_URL}/redefinir-senha?token={token}` e o aviso "Este link expira em 30 minutos. Se você não solicitou esta recuperação, ignore esta mensagem."

**`POST /api/auth/senha/redefinir`:**
- Request: `{ "token": string, "novaSenha": string }`.
- Token inválido, expirado ou já usado: `400 { "erro": "Link de redefinição inválido ou expirado." }`.
- Nova senha fora do padrão (RNF02/SDD-004 — mín. 8 caracteres, letra e número): `400 { "erro": "Senha fora do padrão exigido." }`.
- Token e senha inválidos ao mesmo tempo: o token é verificado antes da senha — se o token já é inválido, expirado ou usado, a resposta é sempre a de token inválido, independentemente de a nova senha atender ou não ao padrão exigido.
- Sucesso: gera novo hash bcrypt (RNF01/SDD-004), marca o token como usado, retorna `200 { "mensagem": "Senha redefinida com sucesso." }`.

**Tela `/esqueci-senha` (front-end, `page.tsx`):** formulário com campo de e-mail e botão "Enviar instruções". Ao responder com sucesso, exibe o estado "Solicitação enviada!" com a mesma mensagem genérica retornada pela API — nunca revela se o e-mail existe. Link "Esqueci minha senha" disponível em `LoginForm.tsx`, levando a esta tela.

**Tela `/redefinir-senha` (front-end, `page.tsx`):** lê o `token` da query string.
- Sem `token` na URL: exibe o estado "Link inválido" em vez do formulário.
- Com `token`: formulário de nova senha (mesma regra de força de SDD-004) e botão "Redefinir senha".
- Sucesso: exibe o estado "Senha redefinida com sucesso!" e redireciona para `/login` após `REDIRECIONAMENTO_APOS_SUCESSO_MS = 1500` (constante em `RedefinirSenhaForm.tsx`, via `router.push('/login')`).
- Erro: exibe a mensagem retornada pela API (link inválido/expirado ou senha fora do padrão), sem redirecionar.

**Efeito sobre tokens JWT ativos (RF05):** ao redefinir a senha com sucesso, todos os tokens JWT de sessão emitidos antes desse momento passam a ser considerados inválidos — o middleware de autenticação rejeita (401) qualquer requisição autenticada com um desses tokens na sequência. Mecanismo e decisão completos na seção "Decisão de arquitetura" abaixo.

## Critérios de aceite

- [x] Critério 1 — O sistema responde ao pedido de recuperação sempre com a mesma mensagem genérica, exista ou não o e-mail informado (evita enumeração de e-mail por conteúdo da resposta). Não há equalização de tempo de resposta entre os dois ramos — RNF01 (anti-timing-attack) não é atendido pela implementação atual.
- [x] Critério 2 — O sistema gera um token de reset de alta entropia, armazenado apenas como hash (nunca texto puro), com expiração curta (ex.: 30–60 min) e uso único.
- [x] Critério 3 — O sistema invalida o token de reset ao ser usado, ou ao gerar um novo token para o mesmo usuário (só o mais recente vale).
- [x] Critério 4 — O sistema reaplica a política de força de senha (RNF02/SDD-004) e gera novo hash bcrypt (RNF01/SDD-004) ao confirmar a nova senha.
- [x] Critério 5 — O sistema define e aplica explicitamente se tokens JWT de sessão já emitidos permanecem válidos após o reset (decisão registrada na seção "Decisão de arquitetura" abaixo, não deixada implícita).

## Decisão de arquitetura

**Contexto:** a decisão de autenticação original (SDD-004: e-mail/senha, sessão via JWT stateless de curta duração) deixou implícita se um token JWT ativo permanece válido depois que a conta muda (ex.: senha redefinida). Recuperação de senha reabre essa pergunta num cenário mais sensível — possível conta comprometida — exigindo uma resposta explícita, em vez de deixá-la implícita.

**Decisão:** sessão ativa é invalidada. Ao redefinir a senha com sucesso, todos os tokens JWT de sessão emitidos antes desse momento passam a ser considerados inválidos. Mecanismo (deliberadamente genérico, não específico de "esqueci minha senha", pensado para reuso por outras funcionalidades): campo `Usuario.SenhaAlteradaEm` (nulo até a primeira troca) é atualizado toda vez que a senha muda; `JwtTokenService.GerarToken` passou a incluir a claim `iat` (issued-at) explicitamente — o `JwtSecurityToken` do .NET não a adiciona sozinho a partir de `notBefore`/`expires`, confirmado em teste; o pipeline de autenticação (`Program.cs`, evento `JwtBearerEvents.OnTokenValidated`) rejeita (401) qualquer token cujo `iat` seja anterior a `SenhaAlteradaEm`, delegando a regra em si para `Features/Auth/ValidacaoSessaoAposTrocaDeSenha.cs` (função pura, testável sem pipeline HTTP).

**Alternativas consideradas:**
- **Manter sessões JWT ativas válidas mesmo após a redefinição de senha** (não fazer nada, deixá-las expirar naturalmente) — descartada porque recuperação de senha é, por definição, um cenário de possível conta comprometida; a sessão antiga não deveria sobreviver à troca.

**Consequências:** um usuário logado em múltiplos dispositivos é deslogado de todos eles ao redefinir a senha (não seletivo por dispositivo/sessão — não há armazenamento de sessão individual, coerente com a escolha original de JWT stateless de SDD-004). Isso é aceitável e desejado neste cenário — outra sessão comprometida é exatamente o que se quer invalidar. Esta implementação (campo + comparação de `iat`) é o mecanismo genérico que SDD-017 (atualização de dados de perfil) e SDD-018 (troca de senha do usuário autenticado) devem reaproveitar sem precisar de uma nova decisão de arquitetura — ambas só precisam garantir que tocam `SenhaAlteradaEm` (ou um campo equivalente, se a mudança não for de senha) no momento certo.

## Casos de borda

- Duas solicitações de recuperação seguidas para o mesmo e-mail: só o token mais recente é válido.
- Redefinição de senha bem-sucedida enquanto o usuário está logado em outro dispositivo: o token daquele outro dispositivo passa a ser rejeitado na próxima requisição autenticada (via `senha_alterada_em`).
- E-mail inexistente: mesma resposta genérica de sucesso, nenhum e-mail é enviado de fato.

## Fora do escopo

Notificação de segurança adicional ("sua senha foi alterada") — pode virar SDD própria. Provedor de e-mail de produção (ver "Decisão de arquitetura" em `specs/SDD-013-verificacao-de-email.md`).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `projeto-sdd/requisitos/SDD-014-recuperacao-de-senha.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md` | Convenções de back-end e de banco de dados usadas na implementação |
| Conhecimento relacionado | `knowledge/frontend-arquitetura.md`, `knowledge/frontend-shadcn-ui.md`, `knowledge/frontend-feedback-ui.md` | Telas de solicitação/redefinição (TanStack Query, componentes shadcn, estados de carregamento/erro acessíveis) |
| Provedor de e-mail (reaproveitado) | `projeto-sdd/specs/SDD-013-verificacao-de-email.md` | Sim — mesma dependência de provedor de e-mail transacional usada no envio do link de redefinição |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude Code (Claude Sonnet 5)
- **Notas de conclusão:** Implementado o back-end completo desta funcionalidade, exatamente conforme `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` e o contrato de API fixado: `POST /api/auth/senha/esqueci` e `POST /api/auth/senha/redefinir` (`RecuperacaoSenhaService`, reaproveitando a entidade `TokenResetSenha` e a coluna `Usuario.SenhaAlteradaEm` já preparadas na migration `SegurancaDeAcesso`). Critério de aceite 5 (efeito sobre sessões JWT ativas) implementado via claim `iat` explícita em `JwtTokenService.GerarToken` + `ValidacaoSessaoAposTrocaDeSenha` (regra pura, testável por unidade) integrada ao pipeline JWT em `Program.cs` (`JwtBearerEvents.OnTokenValidated`): qualquer token emitido antes de `SenhaAlteradaEm` é rejeitado com 401. **Front-end (etapa em paralelo, mesma sessão):** `app/(public)/esqueci-senha/page.tsx` (formulário de e-mail, sempre mesma mensagem genérica) e `app/(public)/redefinir-senha/page.tsx` (lê `?token=`, formulário de nova senha com a mesma regra de força de SDD-004), `features/auth/components/EsqueciSenhaForm.tsx` e `RedefinirSenhaForm.tsx`, hooks `useEsqueciSenha`/`useRedefinirSenha` (TanStack Query). Link "Esqueci minha senha" adicionado em `LoginForm.tsx`. Testado com Vitest + RTL. Status "Em revisão" reflete cadastro/login/verificação/recuperação completos, front-end e back-end, pendente só de revisão humana.
- **Arquivos alterados:** `backend/Features/Auth/RecuperacaoSenha/*` (novo), `backend/Features/Auth/ValidacaoSessaoAposTrocaDeSenha.cs` (novo), `backend/Features/Auth/JwtTokenService.cs` (claim `iat`), `backend/Controllers/AuthController.cs`, `backend/Program.cs` (registro de DI + `JwtBearerEvents`), `backend.Tests/Features/Auth/RecuperacaoSenha/RecuperacaoSenhaServiceTests.cs`, `backend.Tests/Features/Auth/ValidacaoSessaoAposTrocaDeSenhaTests.cs`; `frontend/src/app/(public)/esqueci-senha/page.tsx`, `frontend/src/app/(public)/redefinir-senha/page.tsx`, `frontend/src/features/auth/components/{EsqueciSenhaForm,RedefinirSenhaForm}.{tsx,test.tsx}`, `frontend/src/features/auth/hooks/{useEsqueciSenha,useRedefinirSenha}.ts`, `frontend/src/features/auth/components/LoginForm.tsx` (link).

## Notas

- Idealmente entregue depois ou junto de SDD-013 (verificação de e-mail), para o canal de recuperação já ser confiável.
- Reabre uma pergunta que a decisão de autenticação original (SDD-004) deixou implícita (token JWT não tem revogação) num cenário mais sensível — conta potencialmente comprometida. Resolvida na seção "Decisão de arquitetura" desta SDD, não como uma decisão nova isolada em outro documento.

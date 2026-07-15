# Requisitos — SDD-023 — Login e cadastro via GitHub (OAuth)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve oferecer um botão "Continuar com GitHub" nas telas de login e cadastro. |
| RF02 | O sistema deve implementar o fluxo OAuth 2.0 Authorization Code do GitHub, com o back-end trocando o `code` recebido por um token de acesso do GitHub. |
| RF03 | O sistema deve obter do GitHub os dados básicos do usuário (nome, e-mail, identificador da conta) após a troca do token. |
| RF04 | O sistema deve decidir e implementar o comportamento de vínculo/criação de conta quando o e-mail do GitHub já existir (ou não existir) como conta local, conforme decisão de arquitetura desta SDD (`specs/SDD-023-login-cadastro-via-github.md`). |
| RF05 | Ao concluir o fluxo com sucesso, o sistema deve emitir o mesmo tipo de token JWT usado no login local (reaproveitando `JwtTokenService`, decidido em `specs/SDD-004-cadastro-de-usuario.md`). |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Client ID/Secret do GitHub OAuth App são configuração sensível — via `.env`/variável de ambiente, nunca hardcoded. |
| RNF02 | Segurança | O fluxo deve validar o parâmetro `state` do OAuth (proteção contra CSRF), prática padrão de OAuth 2.0. |
| RNF03 | Disponibilidade/Dependência externa | Registro de um GitHub OAuth App é pré-requisito operacional — sem ele, o fluxo não funciona em nenhum ambiente (local, CI ou produção). |

## Restrições conhecidas

- O e-mail retornado pelo GitHub pode vir nulo, não verificado ou privado — o tratamento desse caso de borda é decisão a resolver na spec, antes de implementar.
- `Usuario.SenhaHash` precisa aceitar ausência de senha local para contas criadas só via GitHub — mudança de schema a detalhar na spec.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-023-login-cadastro-via-github.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md` | Convenções de back-end e de schema |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

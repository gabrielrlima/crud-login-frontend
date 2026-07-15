# Knowledge — Fluxo de login e recuperação de senha (front-end + back-end)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Diagrama dedicado ao fluxo de login e recuperação de acesso (e-mail/senha, GitHub OAuth e "esqueci minha senha"), cobrindo front-end **e** back-end juntos, peça por peça. Complementa `knowledge/backend-fluxo-de-requisicao.md` (que cobre o Container C4 e o pipeline de middleware de forma genérica, não específica de login) e `knowledge/backend-arquitetura.md` (que descreve, em prosa, o tipo de sessão/autenticação — JWT, stateless, sem refresh). Aqui: só o desenho de ponta a ponta.

## Conteúdo

### Fluxograma (SVG, com raias por ator)

Versão visual, com raias (swimlanes) separando o que cada ator faz — Usuário, Front-end, Back-end (e GitHub, no segundo). Arquivo próprio, autocontido (abre direto no navegador, com suporte a tema claro/escuro), complementar aos diagramas de sequência Mermaid abaixo, que detalham os nomes reais de função/arquivo.

**Login por e-mail e senha:**

![Fluxograma do login por e-mail e senha](../diagramas/fluxo-login-email-senha.svg)

**Login/cadastro via GitHub:**

![Fluxograma do login via GitHub](../diagramas/fluxo-login-github.svg)

**Recuperação de senha ("esqueci minha senha"):**

![Fluxograma de recuperação de senha](../diagramas/fluxo-esqueci-senha.svg)

### Login por e-mail e senha (`SDD-005`)

```mermaid
sequenceDiagram
    actor Usuario as Usuário
    participant Form as LoginForm.tsx<br/>(react-hook-form + zod)
    participant Hook as useLogin.ts<br/>(TanStack Query)
    participant Svc as auth.service.ts<br/>(login)
    participant Api as api-client.ts
    participant Store as auth-store.ts<br/>(Zustand)
    participant Ctrl as AuthController
    participant BSvc as LoginService
    participant DB as AppDbContext
    participant JWT as JwtTokenService

    Usuario->>Form: preenche e-mail/senha, submete
    Form->>Form: valida com loginSchema (zod)
    Form->>Hook: useLogin().mutate({ email, senha })
    Hook->>Svc: login(request)
    Svc->>Api: apiClient.post("/api/auth/login", request)
    Api->>Ctrl: POST /api/auth/login
    Ctrl->>BSvc: AutenticarAsync(request)
    BSvc->>DB: busca Usuario por e-mail (citext) +<br/>checa tentativas malsucedidas (SDD-015)
    DB-->>BSvc: Usuario | null
    BSvc->>BSvc: BCrypt.Verify(senha, SenhaHash)
    alt credenciais inválidas
        BSvc-->>Ctrl: ResultadoLogin.Erro()
        Ctrl-->>Api: 401 { erro }
        Api-->>Svc: throw ApiError(401, ...)
        Svc-->>Hook: erro
        Hook-->>Form: mutation.isError
        Form-->>Usuario: exibe "Credenciais inválidas"
    else credenciais corretas
        BSvc->>JWT: GerarToken(usuarioId, email)
        JWT-->>BSvc: token JWT
        BSvc-->>Ctrl: ResultadoLogin.Ok({ token })
        Ctrl-->>Api: 200 { token }
        Api-->>Svc: LoginResponse
        Svc-->>Hook: LoginResponse
        Hook->>Store: setToken(token)
        Hook-->>Form: mutation.isSuccess
        Form->>Usuario: redireciona para /inicio (após feedback visual)
    end
```

### Login/cadastro via GitHub (`SDD-023`)

```mermaid
sequenceDiagram
    actor Usuario as Usuário
    participant Btn as GithubOAuthButton.tsx
    participant Ini as github-oauth.ts<br/>(iniciarAutenticacaoGithub)
    participant GH as GitHub<br/>(oauth/authorize)
    participant CbPage as auth/github/callback/page.tsx
    participant CbForm as GithubCallbackForm.tsx
    participant CbHook as useGithubCallback.ts
    participant CbSvc as github-oauth-callback.ts
    participant Svc as auth.service.ts<br/>(loginGithub)
    participant Store as auth-store.ts
    participant Ctrl as AuthController
    participant GSvc as LoginGithubService
    participant OAuth as GithubOAuthClient
    participant DB as AppDbContext
    participant JWT as JwtTokenService

    Usuario->>Btn: clica "Continuar com GitHub"
    Btn->>Ini: iniciarAutenticacaoGithub()
    Ini->>Ini: gera state (crypto.randomUUID),<br/>grava em sessionStorage
    Ini->>GH: redireciona (client_id, redirect_uri, scope=user:email, state)
    GH-->>Usuario: tela de autorização do GitHub
    Usuario->>GH: autoriza
    GH-->>CbPage: redireciona com ?code&state
    CbPage->>CbForm: renderiza com code/state (searchParams)
    CbForm->>CbHook: dispara mutation ao montar
    CbHook->>CbSvc: autenticarComGithubCallback({ code, state })
    CbSvc->>CbSvc: confere state === sessionStorage<br/>(descarta o valor salvo de qualquer forma)
    alt state ausente/divergente ou usuário cancelou
        CbSvc-->>CbForm: throw AutorizacaoGithubInvalidaError<br/>(nenhuma chamada ao backend)
        CbForm-->>Usuario: exibe erro genérico + link pro login
    else state válido
        CbSvc->>Svc: loginGithub({ code })
        Svc->>Ctrl: POST /api/auth/login/github { code }
        Ctrl->>GSvc: AutenticarAsync(code)
        GSvc->>OAuth: TrocarCodePorAccessTokenAsync(code)
        OAuth->>GH: POST /login/oauth/access_token
        GH-->>OAuth: access_token
        GSvc->>OAuth: ObterUsuarioAsync(access_token)
        OAuth->>GH: GET /user (+ /user/emails se privado)
        GH-->>OAuth: id, nome, e-mail
        GSvc->>DB: busca por GithubId, senão por Email
        alt e-mail já existe (sem vínculo automático — SDD-023)
            GSvc-->>Ctrl: ResultadoLoginGithub.Erro(...)
            Ctrl-->>Svc: 400 { erro }
            Svc-->>CbSvc: throw ApiError
            CbForm-->>Usuario: exibe erro + link pro login
        else conta nova ou já vinculada por GithubId
            GSvc->>DB: cria Usuario (se novo) ou reaproveita existente
            GSvc->>JWT: GerarToken(usuarioId, email)
            JWT-->>GSvc: token JWT
            GSvc-->>Ctrl: ResultadoLoginGithub.Ok({ token })
            Ctrl-->>Svc: 200 { token }
            Svc-->>CbSvc: LoginResponse
            CbSvc-->>CbHook: LoginResponse
            CbHook->>Store: setToken(token)
            CbForm->>Usuario: "Login realizado com sucesso!" → redireciona para /inicio
        end
    end
```

### Recuperação de senha — "esqueci minha senha" (`SDD-014`)

```mermaid
sequenceDiagram
    actor Usuario as Usuário
    participant EForm as EsqueciSenhaForm.tsx
    participant EHook as useEsqueciSenha.ts
    participant Ctrl as AuthController
    participant Svc as RecuperacaoSenhaService
    participant DB as AppDbContext
    participant Mail as IEmailSender<br/>(Mailpit em dev)
    participant RForm as RedefinirSenhaForm.tsx
    participant RHook as useRedefinirSenha.ts

    Usuario->>EForm: informa e-mail, submete
    EForm->>EHook: mutate({ email })
    EHook->>Ctrl: POST /api/auth/senha/esqueci
    Ctrl->>Svc: EsqueciSenhaAsync(request)
    Svc->>DB: busca Usuario por e-mail
    alt e-mail cadastrado
        Svc->>DB: gera token (hash SHA-256, 30min), invalida tokens anteriores
        Svc->>Mail: envia e-mail com link /redefinir-senha?token=...
    end
    Svc-->>Ctrl: mensagem genérica (RF02/RNF01 — igual exista ou não o e-mail)
    Ctrl-->>EForm: 200 { mensagem }
    EForm-->>Usuario: exibe mensagem genérica

    Note over Usuario,Mail: Usuário sai do app e abre o e-mail recebido

    Usuario->>RForm: abre o link, informa nova senha
    RForm->>RHook: mutate({ token, novaSenha })
    RHook->>Ctrl: POST /api/auth/senha/redefinir
    Ctrl->>Svc: RedefinirSenhaAsync(request)
    Svc->>DB: busca token pelo hash
    alt token inexistente, expirado ou já usado
        Svc-->>Ctrl: ResultadoRedefinirSenha.Erro("Link inválido ou expirado")
        Ctrl-->>RForm: 400 { erro }
        RForm-->>Usuario: exibe erro
    else nova senha fora do padrão
        Svc-->>Ctrl: ResultadoRedefinirSenha.Erro("Senha fora do padrão")
        Ctrl-->>RForm: 400 { erro }
        RForm-->>Usuario: exibe erro
    else token e senha válidos
        Svc->>DB: SenhaHash novo (bcrypt), SenhaAlteradaEm = agora,<br/>token marcado como usado
        Note right of Svc: invalida todos os JWTs emitidos<br/>antes deste momento (SDD-004)
        Svc-->>Ctrl: ResultadoRedefinirSenha.Ok()
        Ctrl-->>RForm: 200 { mensagem }
        RForm-->>Usuario: sucesso → redireciona para /login
    end
```

### Pontos em comum entre os três fluxos

- **Convergência no token:** login por e-mail/senha e por GitHub terminam chamando `JwtTokenService.GerarToken` e gravando o resultado em `auth-store.ts` (`setToken`) — a partir daí, não há diferença nenhuma entre uma sessão iniciada por senha ou por GitHub (mesmo JWT, mesmas regras de expiração/invalidação, ver `knowledge/backend-arquitetura.md`, "Autenticação e sessão"). A recuperação de senha é a exceção deliberada: **não** gera sessão — termina redirecionando para `/login`, o usuário autentica de novo com a senha nova.
- **Erro sempre chega como mensagem pronta:** `ApiError` (erro HTTP do contrato), `AutorizacaoGithubInvalidaError` (validação local do `state`) e os erros de `RedefinirSenhaAsync` chegam ao componente como uma mensagem de texto já pronta para exibir — nenhum componente decide o texto do erro, só decide *onde* exibir.
- **Sem persistência entre reloads:** o token vive só em memória (`auth-store.ts`, sem `zustand/middleware persist`) — um F5 desloga, decisão deliberada de `specs/SDD-005-login.md` ("Fora do escopo").
- **Mesmo mecanismo de invalidação de sessão:** redefinir a senha (recuperação) e trocar a senha autenticado (`SDD-018`) usam o mesmo campo `Usuario.SenhaAlteradaEm` para invalidar JWTs antigos — um único mecanismo genérico (`SDD-004`, "Revisão — SDD-014"), não uma implementação por SDD.

## Fora do escopo

- Diagrama de Container/pipeline de middleware genérico — ver `knowledge/backend-fluxo-de-requisicao.md`.
- Detalhes de por que JWT/stateless foi escolhido — ver `specs/SDD-004-cadastro-de-usuario.md`.
- Fluxo de cadastro por e-mail/senha (`SDD-004`) e demais fluxos de conta (verificação de e-mail, troca de senha autenticado, exclusão de conta) — mesma estrutura de diagrama, ainda não desenhados; adicionar aqui se/quando fizerem falta.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Login | `specs/SDD-005-login.md` |
| SDD — Login e cadastro via GitHub | `specs/SDD-023-login-cadastro-via-github.md` |
| SDD — Recuperação de senha | `specs/SDD-014-recuperacao-de-senha.md` |
| Knowledge — Fluxo de requisição do back-end | `knowledge/backend-fluxo-de-requisicao.md` |
| Knowledge — Arquitetura do back-end | `knowledge/backend-arquitetura.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [Mermaid — Sequence diagrams](https://mermaid.js.org/syntax/sequenceDiagram.html)
- `knowledge/c4-model.md` — diagrama Dynamic é o equivalente C4 de um diagrama de sequência

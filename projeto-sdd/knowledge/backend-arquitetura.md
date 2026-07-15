# Knowledge — Arquitetura do back-end (.NET)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Toda SDD de back-end implementa uma regra de negócio em cima da mesma estrutura de camadas e das mesmas convenções — sem repositório, sem CQRS, um serviço por caso de uso (`SDD-004`, "Alternativas consideradas"). Isso já está implícito em mais de 20 SDDs implementadas, mas nunca tinha sido extraído para um documento — este é o equivalente, do lado do back-end, de `knowledge/frontend-arquitetura.md`. Para o **fluxo** de requisição (pipeline de middleware, diagramas C4/sequência), ver `knowledge/backend-fluxo-de-requisicao.md` — deliberadamente um documento separado deste.

## Conteúdo

### Estrutura de pastas

```
backend/
  Controllers/            # um controller por área (ex: AuthController) — sempre fino
  Features/<Dominio>/<CasoDeUso>/   # ex: Features/Auth/Login/, Features/Auth/LoginGithub/
    <CasoDeUso>Service.cs           # a regra de negócio em si
    <CasoDeUso>Request.cs           # shape do body recebido
    Resultado<CasoDeUso>.cs         # objeto de resultado (ver "Padrão Resultado" abaixo)
  Domain/Entities/         # entidades EF Core (Usuario, TokenVerificacaoEmail, ...)
  Infrastructure/           # AppDbContext, EntityConfigurations, integrações técnicas (email, OAuth)
  Migrations/               # migrações EF Core
```

### Autenticação e sessão

Resumo rápido do que este projeto usa — o "porquê" de cada escolha fica em `SDD-004`/`SDD-023`, aqui é só o retrato do que existe hoje:

| | |
|---|---|
| **Métodos de entrada** | E-mail + senha (bcrypt, `SDD-004`) **ou** GitHub OAuth (`SDD-023`) — os dois convergem no mesmo mecanismo de sessão abaixo; não há sessão "diferente" por método de login. |
| **Tipo de sessão** | JWT Bearer, **stateless** — nenhuma sessão guardada no servidor (sem Redis, sem tabela de sessão). O cliente manda `Authorization: Bearer <token>` em toda requisição autenticada. |
| **Duração** | Curta (ver `JwtTokenService`/`JwtSettings`) — **sem refresh token** nesta fase (`SDD-004`, "Consequências"): expirado, o usuário loga de novo. |
| **Revogação antecipada** | Não existe blacklist de token. A única invalidação antecipada é indireta: o campo `Usuario.SenhaAlteradaEm` + a claim `iat` do JWT — qualquer token emitido antes da última troca de senha é rejeitado (`Program.cs`, `JwtBearerEvents.OnTokenValidated` → `ValidacaoSessaoAposTrocaDeSenha`). Trocar e-mail **não** invalida a sessão (só troca de senha invalida — `SDD-004`, "Revisão — SDD-014"). |
| **Onde é emitido** | `JwtTokenService.GerarToken(usuarioId, email)` — chamado por todo caso de uso que autentica (`LoginService`, `LoginGithubService`), nunca reimplementado por fora. |
| **Claims/config** | Issuer/Audience/Key vêm de `JwtSettings` (fail-fast, ver abaixo) — nunca hardcoded. `MapInboundClaims = false` no pipeline (`Program.cs`) para manter os nomes de claim originais (`sub`, não a URI longa que o ASP.NET Core remapeia por padrão). |

### Camadas: Controller fino, Service com a regra

`Controllers/` só faz três coisas: lê a claim/request, chama o Service correspondente, mapeia o `Resultado*` retornado para um `IActionResult` (200/400/401 etc.). Nenhuma regra de negócio, nenhuma consulta ao `AppDbContext` diretamente no controller — sempre delega para um `<CasoDeUso>Service`.

Cada `Service` resolve **um único caso de uso** (`LoginService`, `TrocarSenhaService`, `LoginGithubService`...) e fala diretamente com `AppDbContext` — sem camada de repositório, sem CQRS (`SDD-004` descarta as duas: repositório adicionaria indireção sem benefício sobre o que o EF Core já oferece; CQRS agrega valor quando leitura e escrita têm necessidades muito diferentes de escala, não é o caso aqui — ver `knowledge/cqrs.md`).

### Padrão `Resultado*` — objeto de resultado em vez de exceção

Todo caso de uso retorna um objeto de resultado dedicado (`ResultadoLogin`, `ResultadoTrocarSenha`, `ResultadoLoginGithub`...) em vez de lançar exceção para desfechos de negócio esperados (credenciais inválidas, e-mail duplicado, usuário não encontrado). Formato típico:

```csharp
public sealed class ResultadoTrocarSenha
{
    public bool Sucesso { get; }
    public bool UsuarioNaoEncontrado { get; }
    public string? MensagemErro { get; }

    private ResultadoTrocarSenha(bool sucesso, bool usuarioNaoEncontrado, string? mensagemErro) { ... }

    public static ResultadoTrocarSenha Ok() => new(true, false, null);
    public static ResultadoTrocarSenha ErroValidacao(string mensagemErro) => new(false, false, mensagemErro);
    public static ResultadoTrocarSenha UsuarioInexistente() => new(false, true, null);
}
```

Construtor privado + factory methods nomeados (`Ok()`, `ErroValidacao(...)`, `UsuarioInexistente()`) — o nome do desfecho fica explícito no call site, em vez de um `new ResultadoX(true, false, null)` posicional. O Controller só faz `if (resultado.UsuarioNaoEncontrado) return Unauthorized(); if (!resultado.Sucesso) return BadRequest(...); return Ok(...)`.

**Por quê, não exceção:** os desfechos alternativos (senha errada, e-mail duplicado) são parte esperada do fluxo de negócio, não um erro de execução — usar exceção para isso mistura controle de fluxo com tratamento de erro de verdade (falha de conexão, bug), e exceções em .NET têm custo de performance não-trivial quando lançadas com frequência.

### Configuração fail-fast

Toda configuração sensível ou obrigatória (`JwtSettings`, `SmtpSettings`, `GithubOAuthSettings`) segue o mesmo padrão em `Program.cs`: lida da seção de configuração correspondente logo na subida da aplicação, e se algum valor obrigatório estiver ausente/vazio, lança `InvalidOperationException` **antes** de `builder.Build()` — a aplicação simplesmente não sobe com configuração incompleta, em vez de falhar de forma tardia e confusa na primeira requisição que precisar daquele valor.

```csharp
var xSettings = builder.Configuration.GetSection(XSettings.SecaoConfiguracao).Get<XSettings>();

if (xSettings is null || string.IsNullOrWhiteSpace(xSettings.CampoObrigatorio))
{
    throw new InvalidOperationException(
        "Configuração 'X:CampoObrigatorio' não encontrada. Defina em appsettings.json ou na variável de ambiente X__CampoObrigatorio.");
}

builder.Services.Configure<XSettings>(builder.Configuration.GetSection(XSettings.SecaoConfiguracao));
```

Toda classe `*Settings` expõe uma constante `SecaoConfiguracao` com o nome da seção — nunca uma string mágica repetida em mais de um lugar.

### Abstração de dependência externa via interface

Qualquer chamada a um serviço externo por rede (envio de e-mail, OAuth de terceiro) é abstraída por uma interface (`IEmailSender`/`SmtpEmailSender`, `IGithubOAuthClient`/`GithubOAuthClient`), registrada via DI (`AddScoped`/`AddSingleton` conforme o caso). Isso permite testar o `Service` que a usa com um fake simples (implementação de teste da interface, sem mock de framework pesado), sem chamada de rede real nos testes de unidade.

Chamadas HTTP a serviços externos usam `HttpClient` nomeado via `IHttpClientFactory` (`builder.Services.AddHttpClient("nome", ...)`), nunca `new HttpClient()` direto — evita esgotamento de sockets sob carga.

### Testes

xUnit (`backend.Tests/`), com EF Core **InMemory** para os testes de serviço que tocam `AppDbContext` — não é Postgres real, então qualquer recurso específico do Postgres (ex: `citext`, `ExecuteDelete`/`ExecuteUpdate` traduzidos) precisa de uma verificação alternativa que funcione sob InMemory também (ver comentários em `LoginService`/`RecuperacaoSenhaService` sobre isso). Testes de dependência externa usam um fake manual da interface (`GithubOAuthClientFalso`, por exemplo), não uma lib de mock.

## Fora do escopo

- Fluxo de requisição, ordem do pipeline de middleware, diagramas C4/sequência — ver `knowledge/backend-fluxo-de-requisicao.md`.
- Convenções de linguagem C# em si (nomenclatura, nullable, etc.) — ver `knowledge/csharp.md`.
- Convenções específicas de uso do Postgres — ver `knowledge/postgresql.md`.
- Motivo de não usar CQRS — já coberto em `knowledge/cqrs.md`, só referenciado aqui.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Login e cadastro via GitHub | `specs/SDD-023-login-cadastro-via-github.md` |
| ADR — Estratégia de autenticação | `specs/SDD-004-cadastro-de-usuario.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- Convenção interna, extraída do código já implementado neste projeto — sem fonte externa específica.

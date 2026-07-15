# Knowledge — C# (linguagem e convenções)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Convenções e idiomas de C# que orientam qualquer implementação de backend neste projeto — para manter consistência entre SDDs implementadas em momentos diferentes (por diferentes sessões de IA ou desenvolvedores), sem que cada spec precise reexplicar estilo de código.

## Conteúdo

### Versão atual (jul/2026)

**.NET 10** é a versão LTS (Long Term Support) atual, lançada em novembro/2025 e suportada até novembro/2028, com **C# 14**. .NET 9 (STS) e .NET 8 (LTS) ainda recebem suporte até novembro/2026 — se o projeto herdar código legado nessas versões, verificar disponibilidade de um recurso de linguagem mais novo antes de usá-lo.

Recursos de C# 14 relevantes pra código novo:

- **Extension members** — extension properties, extension operators e membros estáticos de extensão, declarados em bloco `extension`.
- **Field-backed properties** — o token `field` permite escrever o corpo de um acessador sem declarar um backing field explícito.
- **Atribuição null-conditional** — `?.` e `?[]` agora podem aparecer do lado esquerdo de uma atribuição.
- **Parâmetros de lambda com modificadores** — `scoped`, `ref`, `in`, `out`, `ref readonly` em parâmetros de lambda, sem precisar declarar o tipo.
- **`nameof` com tipo genérico não vinculado** — `nameof(List<>)` avalia para `"List"`.

### Convenções de nomenclatura

Baseadas nas diretrizes oficiais do .NET runtime/compiler (Roslyn), adotadas pela documentação da Microsoft:

- **PascalCase** — tipos, métodos, propriedades públicas, constantes, parâmetros de primary constructor em `record`.
- **camelCase** — variáveis locais, parâmetros de método, parâmetros de primary constructor em `class`/`struct`.
- Prefixo `I` em interfaces (`IRepository`, `ICommandHandler`).
- `var` **só** quando o tipo é óbvio pelo lado direito da expressão (`new`, cast explícito, literal). Não usar `var` quando o tipo não é claro à primeira vista, e não usar o nome da variável como substituto de tipo explícito.
- Tipos de dado da linguagem em vez do tipo do runtime: `string` (não `System.String`), `int` (não `System.Int32`).

### Nullable reference types

Habilitado por padrão em projetos novos (`<Nullable>enable</Nullable>`) desde o .NET 6. Tratar warning de nulidade como sinal de design a corrigir — não suprimir com `!` (null-forgiving operator) sem justificativa explícita, comentada no código.

### Idiomas e sintaxe atual

- **Namespace file-scoped**: `namespace MeuProjeto.Dominio;` em vez de bloco com chaves — reduz um nível de indentação, é a convenção atual.
- **`using` fora do namespace**: evita ambiguidade de resolução de nome quando um pacote introduz um tipo com nome igual ao de um namespace interno.
- **Collection expressions**: `string[] vowels = ["a", "e", "i", "o", "u"];` em vez de inicializadores antigos.
- **Raw string literals** (`"""..."""`) para blocos de texto multilinha, em vez de sequências de escape; `StringBuilder` para concatenação em loop.
- **`record`** para tipos imutáveis — DTOs, comandos e queries. Combina diretamente com CQRS (ver [`knowledge/cqrs.md`](./cqrs.md)).
- **`required` properties** em vez de forçar inicialização só via construtor, quando fizer sentido.

### Exceções e assincronismo

- `try/catch` só para exceções que o código sabe tratar de fato — não capturar `System.Exception` genericamente.
- `using`/`using var` em vez de `try/finally` só para chamar `Dispose`.
- `async`/`await` para operações I/O-bound; nunca bloquear com `.Result`/`.Wait()` (risco de deadlock); considerar `ConfigureAwait` quando aplicável.

### Estilo e formatação

- Chaves no estilo **Allman** (abre e fecha em linha própria).
- 4 espaços de indentação, nunca tab.
- Uma instrução e uma declaração por linha.
- Comentário de uma linha (`//`) para explicações breves — alinhado com a convenção geral da esteira: comentário só quando explica o **porquê**, não o **o quê**.
- Formatação consistente delegada ao analyzer/`.editorconfig` do projeto, não a decisão manual em cada PR.

### Testes

xUnit é o framework de fato no ecossistema .NET — um projeto de teste por projeto de produção, seguindo a mesma estrutura de pastas.

## Fora do escopo

- Framework web específico (ASP.NET Core, Minimal APIs, Entity Framework) — stack ainda não confirmada para o projeto; abrir documento próprio quando confirmado.
- Padrões de API REST/contrato HTTP — tratado via Swagger/OpenAPI, mantido atualizado junto do código, não aqui.
- Regras de lint específicas do projeto — ficam em `.editorconfig`, não neste documento.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Cadastro de usuário | `specs/SDD-004-cadastro-de-usuario.md` |
| SDD — Login | `specs/SDD-005-login.md` |
| Spec — Cadastro de usuário | `specs/SDD-004-cadastro-de-usuario.md` |
| Spec — Login | `specs/SDD-005-login.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [O que há de novo no C# 14 — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14)
- [Convenções de código C# — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [Releases e suporte do .NET — Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support)

# Knowledge — CQRS (Command Query Responsibility Segregation)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Padrão de arquitetura que tende a aparecer em decisões (ADR) sobre como estruturar a camada de aplicação/domínio do backend — especialmente quando alguma SDD tem necessidades de leitura e escrita muito diferentes. Documentado aqui para que toda spec ou ADR que considere (ou descarte) CQRS parta da mesma definição, em vez de reexplicar o conceito a cada vez.

## Conteúdo

### Definição

CQRS separa **comandos** (escrita — mudam estado, não retornam dado de domínio) de **queries** (leitura — nunca mudam estado, retornam DTOs prontos pra exibição). Vem do CQS — Command-Query Separation, de Bertrand Meyer — elevado a nível de arquitetura por Greg Young.

**Não é sinônimo de Event Sourcing** — é um mito comum. Os dois padrões combinam bem, mas são decisões independentes: dá pra usar CQRS sem event sourcing (e vice-versa).

### Espectro de implementação

1. **Mesma base de dados, modelos separados só no código** — write model com lógica de negócio e validação; read model retornando DTOs/projeções sem lógica de domínio. Nível básico, custo baixo, já traz a maior parte do benefício de clareza.
2. **Bases de dados separadas para leitura e escrita** — sincronizadas via eventos publicados pelo write model. Nível avançado: permite escalar e até usar tecnologias de armazenamento diferentes em cada lado, mas introduz consistência eventual — o dado lido pode estar momentaneamente atrasado em relação à última escrita.

### Benefícios

- Escalar leitura e escrita de forma independente (o padrão de tráfego dos dois raramente é simétrico).
- Schema otimizado pra cada lado — escrita pensada pra consistência transacional, leitura pensada pra consulta rápida (ex: view materializada, sem joins complexos).
- Separação de responsabilidade: lógica de negócio complexa concentrada na escrita; leitura fica simples e focada em performance.
- Times diferentes podem evoluir leitura e escrita de forma independente.

### Quando NÃO usar

Se o domínio é CRUD simples, CQRS adiciona complexidade sem benefício real — tanto a Microsoft (Azure Architecture Center) quanto Martin Fowler concordam que **não é um padrão default**. Sinais de que não vale a pena: regras de negócio triviais, interface simples de criar/ler/atualizar/excluir, volume de leitura e escrita parecido.

Quando bases de leitura e escrita são separadas, a spec da SDD precisa descrever explicitamente o que a interface faz com dado potencialmente desatualizado (ex: mostrar o pedido como "processando" por alguns segundos após a confirmação).

### Quando considerar CQRS numa SDD

- Interface orientada a tarefa de negócio (várias etapas/comandos, não só formulário de CRUD).
- Volume de leitura muito maior que o de escrita (dashboards, relatórios, catálogos).
- Necessidade de escalar leitura e escrita com perfis de carga diferentes.
- Times separados cuidando da lógica de escrita e da experiência de consulta.

### Como se relaciona com C#

Ver [`knowledge/csharp.md`](./csharp.md). O padrão comum no ecossistema .NET usa interfaces de comando/query com handlers dedicados — bibliotecas como MediatR implementam esse pipeline. Exemplo (adaptado do Azure Architecture Center):

```csharp
public interface ICommand
{
    Guid Id { get; }
}

public class RateProduct : ICommand
{
    public Guid Id { get; } = Guid.NewGuid();
    public int ProductId { get; set; }
    public int Rating { get; set; }
    public int UserId { get; set; }
}

public class ProductsCommandHandler : ICommandHandler<RateProduct>
{
    private readonly IRepository<Product> repository;

    public ProductsCommandHandler(IRepository<Product> repository) =>
        this.repository = repository;

    public void Handle(RateProduct command)
    {
        var product = repository.Find(command.ProductId);
        product?.RateProduct(command.UserId, command.Rating);
        repository.Save(product);
    }
}
```

O read model, em contraste, expõe só consultas e DTOs — sem lógica de domínio:

```csharp
public interface ProductsDao
{
    ProductDisplay FindById(int productId);
    ICollection<ProductDisplay> FindByName(string name);
}

public class ProductDisplay
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal UnitPrice { get; set; }
    public bool IsOutOfStock { get; set; }
}
```

## Fora do escopo

- Event Sourcing em detalhe — merece documento próprio se o projeto vier a adotá-lo.
- Decisão de adotar (ou não) CQRS num serviço específico — isso é ADR, com alternativas e consequências do contexto real do projeto.
- Escolha de biblioteca (MediatR ou outra) — decisão de implementação, cabe na spec ou ADR quando a hora chegar.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD-004 — Estratégia de autenticação do login | `specs/SDD-004-cadastro-de-usuario.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [CQRS pattern — Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [CQRS — Martin Fowler](https://martinfowler.com/bliki/CQRS.html)

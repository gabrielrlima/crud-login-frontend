# Knowledge — Clean Code

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Vocabulário e critério comum de qualidade de código — referência que specs, ADRs e revisões de PR (humanas ou assistidas por IA) podem citar em vez de reexplicar "o que é código limpo" a cada review. Baseado no livro *Clean Code* (Robert C. Martin, 2008); os princípios abaixo são o que se sustentou com o tempo, não uma transcrição do livro.

## Conteúdo

### Nomes

Revelam intenção — um nome bom responde "por que existe / o que faz / como se usa" sem precisar de comentário. Pronunciáveis, sem prefixo de tipo (evitar notação húngara). Verbo para função/método (`calcularTotal`), substantivo para classe (`Pedido`).

### Funções

Pequenas, fazem uma coisa só — e fazem bem. Poucos parâmetros (acima de ~3, considerar agrupar em objeto). Evitar parâmetro booleano que bifurca o comportamento internamente — geralmente é sinal de que são duas funções, não uma.

### Comentários

Código bom precisa de poucos. Comentário que explica **o quê** o código faz é sinal de que o código deveria estar mais claro (nome melhor, função extraída). Comentário vale quando explica o **porquê** — uma decisão não óbvia, uma restrição externa, um workaround para um bug específico. Esta já é a convenção adotada no resto da esteira, não é regra nova deste documento.

### Erros

Tratar com exceções específicas, não com código de retorno mágico. Nunca engolir exceção silenciosamente — um bloco `catch` vazio é falha grave, não atalho aceitável.

### Formatação

Consistente no projeto todo, delegada ao linter/formatter automático — não é uma decisão manual a cada PR.

### Classes

Alta coesão (Single Responsibility — uma razão para mudar), poucas dependências, dependências explícitas (injetadas, não instanciadas escondidas dentro do método).

### Testes

Legíveis como documentação do comportamento esperado. Um conceito lógico por teste. Princípio **F.I.R.S.T**: Fast, Independent, Repeatable, Self-validating, Timely.

### Nota de honestidade intelectual

Parte das recomendações originais do livro (regras rígidas de tamanho de função, algumas regras de formatação específicas) é debatida hoje e não deve ser aplicada como lei absoluta. O valor duradouro está nos princípios — nomes que revelam intenção, funções coesas, poucas dependências, responsabilidade única — não em números fixos. Na prática, prefira o princípio ao dogma quando os dois conflitarem num caso real.

## Fora do escopo

- Regra de lint/formatter específica do projeto — fica em `.editorconfig` ou config da ferramenta, não aqui.
- SOLID em profundidade — citado onde relevante, detalhado em [`knowledge/boas-praticas-arquitetura.md`](./boas-praticas-arquitetura.md).
- Convenções específicas de C# — ver [`knowledge/csharp.md`](./csharp.md).

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Cadastro de usuário | `specs/SDD-004-cadastro-de-usuario.md` |
| SDD — Login | `specs/SDD-005-login.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- Livro *Clean Code: A Handbook of Agile Software Craftsmanship*, Robert C. Martin (2008)

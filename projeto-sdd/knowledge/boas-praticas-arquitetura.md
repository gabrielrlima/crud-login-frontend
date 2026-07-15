# Knowledge — Boas práticas de arquitetura

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Princípios gerais que orientam qualquer decisão de arquitetura registrada em ADR. A diferença entre este documento e um ADR: o ADR registra **uma** decisão específica (contexto, alternativas, consequências); este documento é o pano de fundo de princípios que qualquer ADR de arquitetura deveria respeitar — ou justificar explicitamente por que está desviando.

## Conteúdo

### SOLID (resumo prático — o porquê importa mais que a definição acadêmica)

| Princípio | Ideia central | Por que importa |
|---|---|---|
| **S**ingle Responsibility | Uma classe/módulo, uma razão para mudar | Reduz o raio de impacto de qualquer alteração |
| **O**pen/Closed | Extensível sem alterar código existente que já funciona | Evita reintroduzir bugs em código já testado |
| **L**iskov Substitution | Uma subclasse substitui a classe-base sem quebrar quem depende dela | Garante que polimorfismo não é uma armadilha |
| **I**nterface Segregation | Interface pequena e específica, não uma grande genérica | Ninguém implementa método que não usa |
| **D**ependency Inversion | Módulo de alto nível não depende de detalhe de baixo nível — os dois dependem de abstração | Base de por que o domínio não deveria importar biblioteca de infraestrutura diretamente |

### Direção da dependência

Diferença central entre arquitetura em camadas tradicional e Clean Architecture/Hexagonal (Ports & Adapters): nesta última, o domínio **não conhece** a infraestrutura (banco, fila, API externa) — é a infraestrutura que depende de interfaces definidas pelo domínio, nunca o contrário.

Regra prática de verificação: se um `using`/`import` de código de domínio aponta para um driver de banco de dados ou SDK de terceiro, é sinal de inversão quebrada.

### Acoplamento e coesão

Meta de qualquer design: **alta coesão** dentro do módulo (tudo ali existe pelo mesmo motivo) e **baixo acoplamento** entre módulos (mudar um não obriga mudar o outro). A maioria dos problemas de manutenção de longo prazo vem de acoplamento alto disfarçado de "reuso".

### Estilos arquiteturais comuns (visão geral, sem prescrever um para este projeto)

- **Em camadas (layered)** — simples, conhecido; risco real de acoplar a camada de domínio à de infraestrutura se não houver disciplina de dependência.
- **Hexagonal / Ports & Adapters** — domínio no centro; portas (interfaces) definidas por ele; adaptadores (implementações concretas) de fora para dentro.
- **Clean Architecture** — evolução do hexagonal, com camadas explícitas de entidades / casos de uso / adaptadores de interface / infraestrutura.
- **Monólito modular vs. microsserviços** — o trade-off central não é tecnológico, é organizacional: microsserviço isola falha e permite escalar/deployar time a time, mas custa consistência transacional e complexidade operacional; monólito modular entrega separação de responsabilidade sem esse custo — desde que a modularidade seja imposta de verdade (não só pastas com nomes bonitos).

### Quando uma mudança merece ADR

Escolha de arquitetura, nova dependência, trade-off relevante de performance/custo/segurança, ou mudança que afeta outro time — neste modelo, vira a seção "Decisão de arquitetura" do próprio SDD (ver `../../templates-sdd/specs/spec-template.md`), não um documento à parte.

### Como este documento se conecta aos outros de `knowledge/`

- [`cqrs.md`](./cqrs.md) — um padrão específico dentro do espaço de escolhas descrito aqui.
- [`c4-model.md`](./c4-model.md) — como desenhar e comunicar a arquitetura escolhida.
- [`clean-code.md`](./clean-code.md) — o nível de código dentro de qualquer arquitetura adotada.

Este documento é a camada de princípios acima dos três.

## Fora do escopo

- Escolha do estilo arquitetural específico para este projeto — decisão concreta cabe num ADR, com alternativas e consequências do contexto real.
- Detalhamento de CQRS, C4 Model ou Clean Code — documentos próprios.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| | `specs/SDD-ID-nome.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- Livro *Clean Architecture*, Robert C. Martin
- [Azure Architecture Center — Microsoft Learn](https://learn.microsoft.com/en-us/azure/architecture/)

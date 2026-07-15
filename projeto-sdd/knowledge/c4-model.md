# Knowledge — C4 Model (documentação de arquitetura)

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Forma padronizada de visualizar e comunicar arquitetura de software, complementar ao ADR: o ADR registra o **porquê** de uma decisão; o C4 mostra **como o sistema se encaixa**, visualmente. Documentado aqui para que qualquer ADR ou spec que precise anexar um diagrama de arquitetura use a mesma linguagem visual.

## Conteúdo

### Origem

Criado por Simon Brown — [c4model.com](https://c4model.com) — sob licença Creative Commons Attribution 4.0.

### Os 4 níveis (do mais abstrato ao mais granular)

1. **System Context** — o sistema em análise, os usuários e os outros sistemas com que ele se relaciona. Visão de negócio: qualquer stakeholder entende sem conhecimento técnico.
2. **Container** — decompõe o sistema em unidades executáveis/armazenáveis de forma independente (API, worker, banco de dados, SPA). **"Container" aqui não é Docker** — é qualquer peça deployável separadamente.
3. **Component** — estrutura interna de um Container: módulos, serviços internos, camadas.
4. **Code** — classes e suas relações. Raramente desenhado à mão; quando necessário, gerado automaticamente por IDE/ferramenta a partir do código-fonte.

### Diagramas complementares

- **Dynamic** — sequência de interações entre elementos durante um cenário/operação específica (equivalente a um diagrama de sequência, usando os elementos do C4).
- **Deployment** — mapeia Containers para infraestrutura real (servidores, instâncias, regiões, nós de cluster).

### Notação

O modelo é agnóstico de ferramenta e não prescreve símbolos fixos — não é UML. Convenção prática: cada caixa traz nome + tecnologia + descrição curta; cada seta traz um verbo descrevendo a relação ("lê de", "publica evento em", "autentica via"). Consistência dentro do projeto importa mais que seguir um padrão externo rígido.

### Quando desenhar cada nível, na prática desta esteira

| Nível | Quando usar |
|---|---|
| Context | Sempre que houver um novo sistema ou integração externa relevante — bom anexo para um ADR de escopo maior. |
| Container | Quando o sistema tiver mais de uma peça móvel (ex: API + worker + banco + fila) — é o nível mais citado em ADRs de arquitetura. |
| Component | Só para um Container complexo o suficiente para justificar documentação interna — não é obrigatório para todo Container. |
| Code | Raramente à mão; a própria IDE já produz isso quando necessário. |

### Ferramentas comuns

- **Structurizr** — do próprio criador do modelo, abordagem "arquitetura como código".
- **Mermaid** — tem suporte a diagramas C4, útil por renderizar direto em Markdown/GitHub.
- **PlantUML** — com a extensão C4-PlantUML.

## Fora do escopo

- Ferramenta específica escolhida para o projeto — se vier a ser padronizada, registrar em ADR.
- Diagramas de sequência UML tradicionais fora do contexto do diagrama Dynamic do C4.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| | `specs/SDD-ID-nome.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [c4model.com](https://c4model.com)

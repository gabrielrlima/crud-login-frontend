# Requisitos — SDD-ID — Título curto

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve... |
| RF02 | O sistema deve... |
| RF03 | O sistema deve... |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Performance | Ex: tempo de resposta esperado, throughput |
| RNF02 | Segurança | Ex: criptografia, controle de acesso, LGPD |
| RNF03 | Disponibilidade | Ex: SLA esperado, estratégia de fallback |
| RNF04 | Observabilidade | Ex: logs, métricas e alertas esperados |
| RNF05 | Escalabilidade | Ex: volume esperado de uso, crescimento |

## Restrições conhecidas

- Restrição técnica, de prazo ou de dependência externa, se houver.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-ID-nome.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/tema-nome.md` | Se algum RF/RNF depender de regra de domínio já documentada |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

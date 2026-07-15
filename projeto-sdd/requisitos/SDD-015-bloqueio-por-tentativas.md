# Requisitos — SDD-015 — Bloqueio de conta por tentativas de login (rate limiting)

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve contabilizar tentativas de login malsucedidas por conta e por IP/origem, incluindo tentativas contra e-mails inexistentes. |
| RF02 | O sistema deve bloquear temporariamente novas tentativas após N falhas em uma janela de tempo. |
| RF03 | O sistema deve resetar o contador de tentativas após um login bem-sucedido. |
| RF04 | O sistema deve expirar o bloqueio automaticamente ao fim da duração configurada. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | A mensagem de erro deve ser idêntica entre "conta bloqueada" e "credenciais inválidas" — não reabre enumeração de e-mail (RNF02/SDD-005). |
| RNF02 | Performance | A verificação/contagem de tentativas não deve adicionar latência perceptível ao fluxo de login. |
| RNF03 | Escalabilidade | Se o contador exigir um store compartilhado (ex.: Redis), deve suportar múltiplas instâncias do back-end sem perder consistência do contador. |

## Restrições conhecidas

- N (número de tentativas) e a duração do bloqueio são parâmetros definidos no SDD, não neste documento.
- Contador persistido em tabela PostgreSQL dedicada, não em store separado tipo Redis (ver seção "Decisão de arquitetura" em `specs/SDD-015-bloqueio-por-tentativas.md`).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-015-bloqueio-por-tentativas.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura (RNF03) |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/boas-praticas-arquitetura.md` | Convenções de back-end e decisão de armazenamento |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

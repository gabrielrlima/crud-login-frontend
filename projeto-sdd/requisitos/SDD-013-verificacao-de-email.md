# Requisitos — SDD-013 — Verificação de e-mail no cadastro

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve gerar um token de verificação de uso único e alta entropia ao concluir o cadastro. |
| RF02 | O sistema deve enviar um link de verificação por e-mail, sem confirmar a terceiros não autenticados se um e-mail já existe na base. |
| RF03 | O sistema deve marcar a conta como "e-mail verificado" somente após validar um token existente, não expirado e não utilizado. |
| RF04 | O sistema deve permitir reenvio do e-mail de verificação, com limite de frequência. |
| RF05 | O sistema deve rejeitar token expirado, já usado ou inexistente com mensagem genérica. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Token de verificação deve ter alta entropia, uso único e expiração definida. |
| RNF02 | Observabilidade | Tentativas de verificação (sucesso e falha) devem ser logadas, sem dado sensível em texto puro. |
| RNF03 | Disponibilidade | Indisponibilidade do provedor de e-mail não deve impedir o cadastro em si (RF01/SDD-004) — só adia a verificação. |

## Restrições conhecidas

- Depende de Mailpit em desenvolvimento (ver "Decisão de arquitetura" em `specs/SDD-013-verificacao-de-email.md`) — produção ainda em aberto.
- Não decide, nesta funcionalidade, se o login exige e-mail verificado — ver "Fora do escopo" do SDD.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-013-verificacao-de-email.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/boas-praticas-arquitetura.md` | Convenções de back-end e integração com dependência externa |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

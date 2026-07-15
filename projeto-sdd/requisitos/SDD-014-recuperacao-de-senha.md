# Requisitos — SDD-014 — Recuperação de senha via e-mail

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve aceitar um pedido de recuperação de senha informando e-mail. |
| RF02 | O sistema deve responder ao pedido com a mesma mensagem genérica, exista ou não o e-mail informado. |
| RF03 | O sistema deve gerar um token de reset de alta entropia, armazenado apenas como hash, com expiração curta e uso único. |
| RF04 | O sistema deve invalidar o token de reset ao ser usado ou ao gerar um novo token para o mesmo usuário. |
| RF05 | O sistema deve reaplicar a política de força de senha e gerar novo hash bcrypt ao confirmar a nova senha. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | O tempo de resposta do pedido de recuperação deve ser aproximadamente igual, exista ou não o e-mail (anti-timing-attack), reforçando RF02. |
| RNF02 | Segurança | Token de reset nunca é armazenado em texto puro — só como hash, mesmo princípio de RF04/SDD-004 aplicado à senha. |
| RNF03 | Observabilidade | Tentativas de recuperação (sucesso e falha) devem ser logadas, sem dado sensível em texto puro. |

## Restrições conhecidas

- Depende do mesmo provedor de e-mail de SDD-013 (ver "Decisão de arquitetura" em `projeto-sdd/specs/SDD-013-verificacao-de-email.md`).
- Efeito sobre tokens JWT de sessão já emitidos é resolvido nesta própria funcionalidade — ver "Decisão de arquitetura" em `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` (revisão do mecanismo de autenticação original de SDD-004).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-014-recuperacao-de-senha.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/cqrs.md`, `knowledge/boas-praticas-arquitetura.md` | Convenções de back-end |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

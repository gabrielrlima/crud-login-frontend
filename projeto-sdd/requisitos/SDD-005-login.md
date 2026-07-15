# Requisitos — SDD-005 — Login

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve permitir que um usuário cadastrado autentique com e-mail e senha. |
| RF02 | O sistema deve rejeitar credenciais inválidas (e-mail inexistente ou senha incorreta) com mensagem genérica, sem indicar qual dado está errado. |
| RF03 | O sistema deve emitir um token JWT ao autenticar com sucesso. |
| RF04 | O sistema deve rejeitar requisições a rotas autenticadas sem token válido, retornando 401. |
| RF05 | O sistema deve permitir logout, descartando o token do lado do cliente. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Token JWT deve ter duração curta, reduzindo a janela de uso indevido em caso de vazamento (duração exata definida na spec). |
| RNF02 | Segurança | Mensagem de erro de autenticação não deve permitir enumeração de e-mails cadastrados — mesma resposta para e-mail inexistente e senha errada. |
| RNF03 | Observabilidade | Tentativas de login (sucesso e falha) devem ser logadas, sem registrar a senha em texto puro. |
| RNF04 | Performance | Verificação de credenciais (incluindo comparação de hash bcrypt) não deve gerar tempo de resposta perceptível ao usuário — a confirmar com medição real após implementação. |

## Restrições conhecidas

- Sem refresh token nem revogação de token no servidor nesta fase (ver `specs/SDD-004-cadastro-de-usuario.md`, decisão de autenticação reaproveitada por esta SDD).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-005-login.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/csharp.md` | Convenções de implementação do endpoint de login |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

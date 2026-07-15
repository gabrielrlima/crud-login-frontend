# Requisitos — SDD-004 — Cadastro de usuário

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve permitir que um visitante se cadastre informando nome, e-mail e senha. |
| RF02 | O sistema deve rejeitar cadastro com e-mail já existente, informando isso ao usuário de forma clara. |
| RF03 | O sistema deve validar a força da senha antes de aceitar o cadastro (ver RNF02). |
| RF04 | O sistema deve armazenar a senha apenas como hash, nunca em texto puro. |
| RF05 | O sistema deve retornar confirmação de cadastro sem expor a senha nem o hash em nenhuma resposta. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Hash de senha via bcrypt, com fator de custo adequado (definido na spec/implementação, revisável conforme capacidade de processamento disponível). |
| RNF02 | Segurança | Senha deve ter no mínimo 8 caracteres, com pelo menos uma letra e um número. |
| RNF03 | Observabilidade | Tentativas de cadastro (sucesso e falha) devem ser logadas, sem registrar a senha em texto puro em nenhum log. |
| RNF04 | Segurança / LGPD | Dados pessoais coletados no cadastro (nome, e-mail) são tratados conforme a política de dados pessoais do projeto; nenhum dado sensível adicional é coletado nesta fase. |

## Restrições conhecidas

- Sem integração com provedor de e-mail para confirmação de cadastro nesta fase (ver "Fora do escopo" do SDD).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-004-cadastro-de-usuario.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/csharp.md` | Convenções de implementação do endpoint de cadastro |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

# Requisitos — SDD-010 — Tratamento de expiração de sessão (401) no front-end

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve interceptar respostas 401 em qualquer rota autenticada durante o uso normal, fora do fluxo de login. |
| RF02 | O sistema deve limpar o token armazenado localmente ao detectar um 401. |
| RF03 | O sistema deve redirecionar para a tela de login exibindo mensagem de sessão expirada. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Segurança | Token inválido nunca deve permitir acesso a dado protegido — a interceptação no front-end é reforço de UX, a garantia real já existe no back-end (SDD-005). |

## Restrições conhecidas

- Sem renovação automática de sessão (refresh token), conforme `specs/SDD-004-cadastro-de-usuario.md`.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-010-expiracao-de-sessao.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-feedback-ui.md` | Convenção de aviso de sessão expirada |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

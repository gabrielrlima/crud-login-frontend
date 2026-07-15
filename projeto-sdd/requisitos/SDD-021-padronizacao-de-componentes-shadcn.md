# Requisitos — SDD-021 — Padronizar dimensões dos componentes conforme os blocks de referência do shadcn/ui

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve dimensionar altura, padding e tipografia de inputs, botões e cards de acordo com o block de referência `login-03` do shadcn/ui. |
| RF02 | O sistema deve aplicar a mesma padronização a todas as telas de autenticação e gestão de conta (login, cadastro, esqueci-senha, redefinir-senha, verificar-email, perfil, troca de senha). |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Consistência visual | Nenhuma tela deve divergir de dimensão/proporção das demais após o ajuste. |
| RNF02 | Regressão | A suíte de testes de front-end (Vitest) deve continuar passando integralmente após o ajuste. |

## Restrições conhecidas

- `components.json` deste projeto usa `"style": "base-nova"` — confirmar na spec se essa é a origem do desalinhamento de tamanho percebido em relação ao exemplo de referência (que pode ter sido gerado com outro `style`), ou se o ajuste é só de classes/props não aplicadas aos componentes já copiados.

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `projeto-sdd/specs/SDD-021-padronizacao-de-componentes-shadcn.md` | A spec deve cobrir todos os RFs e RNFs listados aqui |
| Conhecimento relacionado | `knowledge/frontend-shadcn-ui.md` | Convenções de blocks/componentes shadcn/ui |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

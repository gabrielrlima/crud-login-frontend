# Requisitos — SDD-001 — Ambiente de desenvolvimento local via Docker

> Requisitos funcionais e não funcionais desta funcionalidade. É o insumo principal do SDD (`specs/`) — todo RF/RNF listado aqui precisa aparecer refletido lá.

## Requisitos funcionais (RF)

| ID | Descrição |
|---|---|
| RF01 | O sistema deve subir o backend e o banco de dados com o comando `docker compose up`. |
| RF02 | O sistema deve permitir configurar variáveis sensíveis (connection string, segredos) via arquivo `.env`, não versionado. |
| RF03 | O sistema deve disponibilizar um `.env.example` versionado, documentando as chaves esperadas sem valores reais. |

## Requisitos não funcionais (RNF)

| ID | Categoria | Descrição |
|---|---|---|
| RNF01 | Consistência de ambiente | O ambiente deve subir de forma idêntica em qualquer máquina (dev humano ou sessão de IA), sem passos manuais além de `docker compose up`, a partir de um clone limpo do repositório. |
| RNF02 | Manutenibilidade | O `Dockerfile` do backend deve seguir a versão de .NET documentada em `knowledge/csharp.md`, atualizada em conjunto se a versão mudar. |
| RNF03 | Persistência de dado | O banco de dados deve manter os dados entre reinícios do container (via volume nomeado), sem perda ao rodar `docker compose down` sem a flag `-v`. |

## Restrições conhecidas

- Estratégia de deploy em produção não decidida por esta SDD (só ambiente de desenvolvimento local).

---

## Referências cruzadas

| Documento | Caminho | Relação |
|---|---|---|
| SDD (spec) | `specs/SDD-001-ambiente-docker-local.md` | O SDD deve cobrir todos os RFs e RNFs listados aqui — inclusive a decisão de arquitetura, se algum RNF motivar uma |
| Conhecimento relacionado | `knowledge/ambiente-local-docker.md`, `knowledge/csharp.md`, `knowledge/postgresql.md` | Convenções de ambiente, versão de linguagem e banco de dados |

> Todo RF e RNF listado aqui precisa aparecer refletido no SDD — se um requisito não vira comportamento especificado, ele não será implementado.

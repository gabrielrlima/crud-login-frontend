# Knowledge — PostgreSQL

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Motor de banco de dados relacional do projeto (decisão em `specs/SDD-001-ambiente-docker-local.md`). Este documento cobre convenções de uso — nomenclatura, tipos, ambiente local — para qualquer SDD que persista dado, evitando que cada spec reexplique como o Postgres é configurado neste projeto.

## Conteúdo

### Versão

PostgreSQL 18 (versão estável atual, lançada em 2026) — usar a tag `postgres:18` na imagem Docker. Versões anteriores (17, 16) recebem só patches de segurança; PostgreSQL 14 se aproxima do fim de vida (novembro/2026).

### Convenções de nomenclatura e tipos

- **snake_case** para tabelas e colunas — convenção idiomática do Postgres, diferente do PascalCase de C#. Se um ORM for adotado depois, configurar o mapeamento de convenção em vez de forçar PascalCase no schema.
- Identificadores não citados (sem aspas) são sempre convertidos para minúsculas pelo Postgres — nunca usar maiúscula em nome de tabela/coluna sem aspas, gera confusão entre o nome digitado e o nome realmente salvo.
- **Timestamps:** sempre `timestamptz` (with time zone), nunca `timestamp` sem timezone — evita ambiguidade de fuso horário.
- **Chave primária:** `uuid` gerado com `uuidv7()` (nativo desde o Postgres 18) em vez de identificador sequencial. UUIDv7 combina timestamp com bits aleatórios — mantém ordenação cronológica (boa localidade de índice, ao contrário de UUIDv4 puro) e ao mesmo tempo não é enumerável, alinhado com o RNF de anti-enumeração já usado em `specs/SDD-005` e `specs/SDD-014`. Em ambientes ainda em versão anterior ao Postgres 18, usar `gen_random_uuid()` (nativo desde o Postgres 13, sem extensão).

### Regra de unicidade case-insensitive (e-mail)

A regra já especificada em `specs/SDD-004` e `specs/SDD-005` ("e-mail verificado de forma case-insensitive") tem dois caminhos naturais em Postgres, sem precisar de lógica extra na aplicação:

- **Índice único funcional:** `CREATE UNIQUE INDEX ON usuarios (lower(email));`
- **Coluna `citext`** (extensão nativa do Postgres — `CREATE EXTENSION IF NOT EXISTS citext;`): a coluna já compara e ordena como case-insensitive nativamente.

Qualquer uma das duas resolve o requisito — a escolha fica registrada na implementação da SDD que criar a tabela de usuário pela primeira vez.

### Ambiente local (Docker)

Conforme `knowledge/ambiente-local-docker.md`:

- Imagem oficial: `postgres:18`.
- Variáveis de ambiente do container: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — vêm do `.env`, nunca hardcoded no `docker-compose.yml`.
- **Volume nomeado (ex: `postgres_data`) mapeado para `/var/lib/postgresql` (não `/var/lib/postgresql/data`)** — a partir da imagem `postgres:18`, o entrypoint oficial exige o volume no diretório pai; o próprio Postgres cria a subpasta versionada (ex: `18/docker`) dentro dele, para suportar `pg_upgrade --link` (ver [docker-library/postgres#1259](https://github.com/docker-library/postgres/issues/1259)). Montar direto em `.../data` faz o container sair com erro na inicialização — **verificado na prática ao implementar `SDD-001`**, não é suposição.
- Porta padrão exposta: `5432` — ajustável via `.env` se já estiver em uso na máquina local.

### Driver .NET

Npgsql é o driver padrão .NET para PostgreSQL — base para qualquer ORM (ex: `Npgsql.EntityFrameworkCore.PostgreSQL`, se Entity Framework Core for adotado) ou acesso direto via ADO.NET/Dapper. Escolha de ORM/ferramenta de acesso a dado ainda não decidida (ver `knowledge/csharp.md`).

## Fora do escopo

- Escolha de ORM/ferramenta de acesso a dado (Entity Framework Core, Dapper etc.) — ver `knowledge/csharp.md`, ainda não decidido.
- Ferramenta de migração de schema (EF Core Migrations, Flyway, DbUp etc.) — depende da escolha de ORM.
- Estratégia de backup, replicação ou tuning de performance em produção — decisão de ADR futuro, quando a estratégia de deploy for definida.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD-001 — Motor de banco de dados | `specs/SDD-001-ambiente-docker-local.md` |
| SDD — Ambiente Docker local | `specs/SDD-001-ambiente-docker-local.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- [PostgreSQL 18 — Release Notes](https://www.postgresql.org/docs/release/18.0/)
- [PostgreSQL — UUID Functions](https://www.postgresql.org/docs/current/functions-uuid.html)
- [Npgsql — documentação oficial](https://www.npgsql.org/)
- [docker-library/postgres#1259 — mudança de convenção de volume a partir da v18](https://github.com/docker-library/postgres/issues/1259)

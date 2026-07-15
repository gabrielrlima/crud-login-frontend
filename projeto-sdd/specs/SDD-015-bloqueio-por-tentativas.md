# SDD-015 — Bloqueio de conta por tentativas de login (rate limiting)

> Documento único desta funcionalidade — necessidade do usuário, requisitos, comportamento esperado e (quando existir) decisão de arquitetura, tudo em um só lugar. Não existem documentos separados de necessidade ou de decisão de arquitetura — o SDD é a fonte da verdade de ponta a ponta. A implementação parte daqui, nunca de instrução solta no chat.

**Status:** Em revisão

## Necessidade

> Como sistema, quero limitar tentativas de login malsucedidas, para que eu dificulte ataques de força bruta e credential stuffing contra contas de usuário.

## Baseado em

| Documento | Caminho |
|---|---|
| Requisitos (F/NF) | `requisitos/SDD-015-bloqueio-por-tentativas.md` |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md` |

## Comportamento esperado

**Parâmetros (fixados nesta SDD, conforme a seção "Decisão de arquitetura" abaixo):** máximo de **5 tentativas malsucedidas** em uma janela de **15 minutos**, por identificador. Identificador é o e-mail normalizado (lowercase/trim) informado na tentativa — cobre tentativas contra e-mails inexistentes, já que a contagem não depende de o usuário existir.

**A cada tentativa de login (`POST /api/auth/login`):**
1. Antes de validar credenciais: consulta `tentativas_login` — conta quantas tentativas malsucedidas existem para aquele identificador nos últimos 15 minutos (com base na coluna `criado_em`).
2. Se ≥ 5: retorna `401 { "erro": "Credenciais inválidas" }` — **mesma mensagem e status de credencial errada** (RNF01) — sem tentar validar a senha.
3. Se < 5: valida credenciais normalmente.
   - Sucesso: apaga (ou marca como resolvidas) as tentativas anteriores daquele identificador — contador reseta.
   - Falha: grava uma nova linha em `tentativas_login` (colunas `identificador` e `criado_em`) e retorna `401 { "erro": "Credenciais inválidas" }` (mesma resposta de sempre, ver `specs/SDD-005-login.md`).

**Expiração do bloqueio:** automática, por critério de consulta (`criado_em > agora - 15min`) — não exige job de limpeza para o bloqueio funcionar corretamente, só para evitar crescimento indefinido da tabela (limpeza periódica é detalhe de implementação, não observável externamente).

## Critérios de aceite

- [ ] Critério 1 — O sistema contabiliza tentativas de login malsucedidas por conta e por IP/origem, incluindo tentativas contra e-mails inexistentes (para não abrir brecha via enumeração, conforme RNF02/SDD-005).
- [ ] Critério 2 — O sistema bloqueia temporariamente novas tentativas após N falhas em uma janela de tempo (N e a janela definidos na SDD, não neste documento).
- [ ] Critério 3 — O sistema reseta o contador de tentativas após um login bem-sucedido.
- [ ] Critério 4 — A mensagem de erro é idêntica entre "conta bloqueada" e "credenciais inválidas" — não reabre enumeração de e-mail por essa via lateral.
- [ ] Critério 5 — O bloqueio expira automaticamente ao fim da duração configurada, sem intervenção manual.

## Decisão de arquitetura

**Contexto:** cobrir tentativas de login contra e-mails inexistentes exige um contador desacoplado do registro de usuário — não há usuário para guardar o contador —, o que tensiona com a premissa "stateless" da autenticação via JWT já decidida em `specs/SDD-004-cadastro-de-usuario.md` (seção "Decisão de arquitetura"). Um store compartilhado tipo Redis resolveria a escalabilidade entre múltiplas instâncias (RNF03), mas seria uma peça de infraestrutura nova só para este contador.

**Decisão:** usar uma tabela dedicada no PostgreSQL já existente (`tentativas_login`), não introduzir Redis. Esquema da tabela:

- `id` (uuid, chave primária) — gerado pela aplicação via UUIDv7 (`Guid.CreateVersion7()`), não pelo Postgres; mapeado com `ValueGeneratedNever()` no EF Core, mesmo padrão de geração client-side de identificador recomendado em `knowledge/postgresql.md`.
- `identificador` (varchar(320), not null) — e-mail normalizado; limite de 320 caracteres, mesmo tamanho máximo usado para e-mail de usuário.
- `criado_em` (timestamptz, not null) — data/hora de gravação da tentativa; base da janela de 15 minutos.

Cada tentativa malsucedida grava uma linha (`identificador`, `criado_em`); a verificação de bloqueio consulta a contagem de tentativas dentro da janela de tempo configurada via `WHERE criado_em > agora - 15min`. Não há necessidade de TTL nativo — a janela é aplicada na consulta, e uma limpeza periódica (job simples ou índice + consulta) evita crescimento indefinido da tabela.

**Alternativas consideradas:**
- **Redis (cache compartilhado)** — descartado nesta fase: adiciona uma peça de infraestrutura nova só para um contador, quando o Postgres já resolve com uma consulta simples; o volume de tentativas esperado nesta fase não justifica a complexidade operacional extra. Revisitar futuramente se o volume crescer a ponto de a tabela virar gargalo real.
- **Coluna de contador no próprio registro de usuário** — descartada: não cobre tentativas contra e-mails inexistentes, já que não há usuário para guardar o contador — deixaria exatamente a brecha de enumeração que RNF01 pede para fechar.

**Consequências:** nova tabela (`tentativas_login`) e migration correspondente. Consulta de bloqueio roda a cada tentativa de login — índice sobre (`identificador`, `criado_em`) necessário para manter a checagem rápida. Sem revogação/expiração nativa: a "janela de tempo" é sempre calculada na consulta (`criado_em > agora - janela`), não por TTL do banco. Se o volume de tentativas crescer a ponto de exigir alta performance ou TTL nativo, Redis pode ser revisitado — decisão adiada, não descartada permanentemente.

## Casos de borda

- 5 tentativas com senha errada, 6ª tentativa com senha **correta**: ainda bloqueado (a checagem de bloqueio acontece antes da validação de senha) — comportamento intencional, não é bug.
- Login bem-sucedido reseta o contador imediatamente — próxima tentativa (mesmo que falhe depois) começa a contar do zero.
- Tentativas contra e-mail que nunca existiu: contam normalmente para o mesmo identificador (e-mail normalizado), bloqueando novas tentativas contra aquele e-mail inexistente também — reforça RNF01 (não há diferença de comportamento observável entre e-mail existente e inexistente).

## Fora do escopo

Back-off progressivo. Bloqueio por IP (só por e-mail normalizado nesta primeira versão — RF01/`requisitos/SDD-015-bloqueio-por-tentativas.md` menciona IP como possível dimensão futura, não implementada nesta SDD).

---

## Referências cruzadas

| Documento | Caminho | Obrigatório? |
|---|---|---|
| Requisitos (F/NF) | `requisitos/SDD-015-bloqueio-por-tentativas.md` | Sempre |
| Conhecimento relacionado | `knowledge/csharp.md`, `knowledge/postgresql.md` | Convenções de back-end e persistência usadas na decisão de armazenamento |
| Decisão de autenticação (reaproveitada) | `specs/SDD-004-cadastro-de-usuario.md` | Sim — tensão com a premissa stateless de JWT motiva a decisão de armazenamento acima |
| Comportamento de login (estendido) | `specs/SDD-005-login.md` | Sim — endpoint e resposta genérica de erro reaproveitados; SDD-005 registra a supersessão do "fora de escopo" de rate limiting daquela funcionalidade |

> Regra rápida: todo SDD tem requisitos. Só ganha uma seção de "Decisão de arquitetura" quando existe de fato uma decisão de arquitetura, uma nova dependência ou um trade-off relevante por trás dela — do contrário a seção nem aparece no documento.

> Este documento é a única e exclusiva fonte de verdade do bloqueio por tentativas — não existe requisito, comportamento ou decisão de arquitetura desta funcionalidade registrado em outro lugar. Qualquer comentário no código-fonte que aponte para um caminho ou identificador diferente deste (`specs/SDD-015-bloqueio-por-tentativas.md`) está desatualizado e deve ser corrigido para referenciar só este documento.

## Registro de execução

> Preenchido durante ou após o desenvolvimento — quem (ou qual agente) implementou o quê, para rastreabilidade.

- **Agente/modelo utilizado:** Claude (subagente via Workflow), sessão de implementação de 2026-07-14.
- **Notas de conclusão:** Checagem de bloqueio integrada diretamente em `LoginService.AutenticarAsync` (sem extrair um serviço à parte — um caso de uso por classe, mesmo racional de `RecuperacaoSenhaService`): antes de validar credenciais, conta linhas de `tentativas_login` para o e-mail normalizado nos últimos 15 minutos (`ix_tentativas_login_identificador_criado_em`, já criado na migration `SegurancaDeAcesso`); se ≥ 5, retorna a mesma resposta `ResultadoLogin.Erro()` sem sequer buscar o usuário ou verificar a senha (RNF01 — nenhuma diferença observável entre bloqueado e credencial errada, já que `ResultadoLogin` nunca carrega mensagem, mesma garantia estrutural de SDD-005). Falha grava uma nova linha; sucesso apaga todas as linhas daquele identificador (reset do contador). Expiração é só por critério de consulta (`CriadoEm` dentro da janela) — sem TTL nativo nem job de limpeza (fora do escopo desta SDD, conforme a spec). Testes cobrem os 5 critérios de aceite, incluindo o caso de borda (6ª tentativa com senha correta ainda bloqueada, provado por inspeção direta do contador no banco InMemory) e a expiração automática (tentativas antigas fora da janela não bloqueiam). `specs/SDD-005-login.md` recebeu uma nota de supersessão (o "fora de escopo" de rate limiting daquela funcionalidade foi superado por esta).
- **Arquivos alterados:** `backend/Features/Auth/Login/LoginService.cs`, `backend/Controllers/AuthController.cs` (doc XML), `backend.Tests/Features/Auth/Login/LoginServiceTests.cs`, `specs/SDD-005-login.md`, `specs/SDD-015-bloqueio-por-tentativas.md`.

## Notas

- Cobrir tentativas contra e-mails inexistentes exige um contador desacoplado do registro do usuário (já que não há usuário pra guardar o contador) — isso tensiona com a premissa "stateless" da decisão de autenticação original (`specs/SDD-004-cadastro-de-usuario.md`, JWT sem store server-side). O cache/store compartilhado (Redis) que essa tensão levantaria como nova dependência está registrado e descartado na seção "Decisão de arquitetura" desta SDD, separada da decisão de armazenamento de e-mail (SDD-013/SDD-014).

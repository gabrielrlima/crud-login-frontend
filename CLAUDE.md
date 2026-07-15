# CLAUDE.md — Orientação para a IA

> Ponto de entrada único. Leia este arquivo primeiro em qualquer sessão neste projeto — ele mapeia tudo que existe e como as peças se conectam.

## O que é este projeto

Um CRUD de login, autenticação (e-mail/senha e GitHub OAuth) e gestão de conta — cadastro, login, verificação de e-mail, recuperação de senha, bloqueio por tentativas, consulta/atualização de perfil, troca de senha, exclusão de conta, e o design system do front-end. Backend em .NET, front-end em Next.js, Postgres, Docker para desenvolvimento local.

Documentação e desenvolvimento seguem o **modelo SDD** (Spec Driven Development): um documento único por funcionalidade — o SDD — reúne necessidade do usuário, requisitos, comportamento esperado, critérios de aceite e, quando existir, a decisão de arquitetura envolvida. Não há sprint, story ou ADR como documentos separados neste modelo.

> **Nota histórica:** as 23 primeiras funcionalidades deste projeto foram documentadas originalmente num modelo anterior, com sprint/story/ADR separados (pastas `sprints/`, `stories/`, `adr/`, e as versões de `requisitos/`/`specs/`/`knowledge/`/`diagramas/` na raiz do projeto). Esse modelo foi descontinuado e as pastas correspondentes não existem mais neste repositório — todo o conteúdo já foi migrado (e corrigido) para [`projeto-sdd/`](./projeto-sdd/), que é a única fonte viva a partir de agora. Toda funcionalidade nova, e toda consulta de conhecimento/diagrama daqui em diante, usa exclusivamente `projeto-sdd/`.

## Como o processo funciona (resumo)

```
Requisitos (F/NF) → SDD (necessidade + comportamento + decisão de arquitetura, quando houver)
      → Dev com Claude Code → Testes → CI → PR → Review & Merge → CD / Deploy → Fechamento
```

Fluxo completo, com o papel de cada etapa: [`esteira-desenvolvimento.md`](./esteira-desenvolvimento.md).

## Mapa de pastas

### Ativas — todo trabalho novo entra aqui

| Pasta | O que tem | Quando usar |
|---|---|---|
| [`projeto-sdd/`](./projeto-sdd/) | Documentação viva do projeto, modelo SDD — `requisitos/`, `specs/`, `knowledge/`, `diagramas/`, `backlog.md`. | Sempre. Veja [`projeto-sdd/README.md`](./projeto-sdd/README.md) para o mapa interno; cada subpasta tem seu próprio índice. |
| [`templates-sdd/`](./templates-sdd/) | Modelo de cada tipo de documento usado em `projeto-sdd/`. | Copie o template ao criar um SDD, requisito, conhecimento ou entrada de backlog novo. Não edite os templates para resolver um caso específico. |

### Históricas — removidas do repositório

O modelo anterior (sprint com objetivo/retrospectiva, story "Como/quero/para que" + critérios, decisão de arquitetura como documento à parte) usava as pastas `sprints/`, `stories/`, `adr/`, `templates/`, e versões de `requisitos/`/`specs/`/`knowledge/`/`diagramas/` na raiz do projeto. Essas pastas **não existem mais neste repositório** — todo o conteúdo relevante já foi migrado (e corrigido onde necessário) para `projeto-sdd/`/`templates-sdd/` antes da remoção, então nada foi perdido. Se alguma dessas pastas reaparecer no disco, trate como uma anomalia a investigar, não como algo a editar — trabalho novo nunca entra nelas, vai sempre em `projeto-sdd/`.

## Convenções

- **Idioma:** português do Brasil, em toda a documentação.
- **IDs:** `SDD-024`, `SDD-025`... — sequência contínua a partir de `SDD-023` (a última funcionalidade implementada no modelo anterior), sempre referenciado por ID + título curto no nome do arquivo (ex: `SDD-024-nome-curto.md`). Não reaproveite `STORY-`/`ADR-`/`SPRINT-` como prefixo — esses IDs pertencem só ao modelo histórico.
- **Status de SDD:** A fazer / Em andamento / Em revisão / Concluído — mesmo valor usado na seção correspondente do `backlog.md`.
- **Rastreabilidade:** todo SDD novo referencia os documentos relacionados (requisitos ↔ SDD ↔ knowledge ↔ diagrama). Documento sem referência cruzada é sinal de contexto perdido.

## Governança do backlog

Regra central: **nenhum trabalho de produto acontece sem um SDD correspondente em `projeto-sdd/specs/`.** Todo pedido — já previsto no backlog ou instrução solta no chat — só é implementado depois de estar refletido lá.

> **Exceção explícita:** isso vale para trabalho de produto (funcionalidade, comportamento ou código do sistema sendo construído). Organizar a própria esteira — ajustar templates, este arquivo, a knowledge base — é infraestrutura de processo, não produto, e não exige SDD.

### Todo pedido vira SDD no backlog

1. Consulte [`projeto-sdd/backlog.md`](./projeto-sdd/backlog.md) antes de implementar qualquer coisa.
2. Pedido novo → verifique se já existe um SDD em "A fazer" que cobre o pedido; se sim, escreva os requisitos (se ainda não existirem) e mova para "Em andamento". Se não existir nenhum, crie `projeto-sdd/requisitos/SDD-XXX-nome.md` e `projeto-sdd/specs/SDD-XXX-nome.md` a partir dos templates em `templates-sdd/`, e registre a linha em `projeto-sdd/backlog.md` ("A fazer" ou já em "Em andamento", conforme o caso).
3. Pedido pequeno não é exceção — ainda assim vira um SDD rastreado. Um SDD pequeno é rápido de escrever e mantém o histórico completo; pedido não rastreado é contexto perdido pra próxima sessão.

### Nenhum SDD entra em "Em andamento" sem os padrões mínimos

Antes de mover um SDD para **Em andamento** no backlog, confirme:

- [ ] O SDD tem critérios de aceite testáveis — SDD vago não entra em andamento.
- [ ] Os requisitos (F/NF) relacionados já existem em `projeto-sdd/requisitos/`.
- [ ] O SDD já identifica quais documentos de `projeto-sdd/knowledge/` se aplicam (linguagem, arquitetura, front-end).

A seção "Decisão de arquitetura" dentro do SDD **não** precisa estar preenchida antes de começar — só quando a funcionalidade genuinamente envolver escolha de arquitetura, nova dependência ou trade-off relevante, elaborada antes de implementar aquela parte específica. O gate de entrada é sobre o SDD estar registrado e minimamente definido, não sobre ter tudo pronto de antemão.

Se algum item falhar, o SDD não avança para "Em andamento" até o que falta ser resolvido.

### Todo SDD fecha batendo com a realidade implementada

Mover um SDD para **Concluído** no backlog exige:

- [ ] Revisado e integrado (PR aprovado e mesclado).
- [ ] O próprio SDD (`projeto-sdd/specs/`) reflete o que foi **de fato** implementado — se a implementação divergiu do que foi especificado, o SDD é atualizado, não deixado desatualizado.
- [ ] "Registro de execução" do SDD preenchido.

Um SDD sem essa atualização não é Concluído — continua Em revisão até o documento bater com a realidade implementada.

## Regras críticas para a IA

- **Todo pedido — mesmo instrução solta no chat — vira um SDD no backlog antes de qualquer implementação.** Sem SDD rastreado em `projeto-sdd/backlog.md`, não se implementa. Ver "Governança do backlog".
- **Nunca implemente a partir de instrução solta sem SDD** — aponte (ou crie primeiro) o SDD correspondente em `projeto-sdd/specs/`. Se ele não existir, o passo anterior é criá-lo, não pular direto pro código.
- **SDD não entra em "Em andamento" sem os padrões mínimos, e não fecha sem o documento atualizado.** Ver "Governança do backlog".
- **Verifique `projeto-sdd/knowledge/` antes de assumir uma regra de negócio** — se já existe documentado, use; se não existe e a regra se repete entre funcionalidades, documente lá em vez de repetir em cada SDD.
- **O código não pode fugir do padrão documentado em `projeto-sdd/knowledge/`** — antes de implementar, confira os documentos de linguagem e arquitetura relevantes (`csharp.md`, `clean-code.md`, `boas-praticas-arquitetura.md`, `cqrs.md`, `frontend-shadcn-ui.md`, `frontend-feedback-ui.md`, `frontend-arquitetura.md`, `backend-arquitetura.md`, `ambiente-local-docker.md`, `postgresql.md`, conforme o caso). Convenção nova que se repete entre funcionalidades vira documento em `projeto-sdd/knowledge/`, não fica implícita só no código.
- **Toda rota de API nova ou alterada atualiza o Swagger/OpenAPI no mesmo commit.**
- **Todo RF/RNF listado em `projeto-sdd/requisitos/` precisa aparecer refletido no SDD correspondente** — requisito que não virou comportamento especificado não será implementado.
- **Uma "Decisão de arquitetura" sem requisitos de origem é sinal de decisão tomada sem contexto suficiente** — vale revisar antes de aceitar.
- **Não recrie `sprints/`, `stories/`, `adr/`, `templates/`, ou versões de `requisitos/`/`specs/`/`knowledge/`/`diagramas/` na raiz** — esse modelo foi descontinuado e essas pastas foram removidas do repositório depois da migração para `projeto-sdd/`. Trabalho novo vai sempre em `projeto-sdd/`.

## Por onde começar

1. Veja [`projeto-sdd/backlog.md`](./projeto-sdd/backlog.md) para saber o que está planejado, em andamento, em revisão ou concluído.
2. Para o processo completo ponta a ponta, leia [`esteira-desenvolvimento.md`](./esteira-desenvolvimento.md).
3. Para criar um documento novo, copie o template correspondente em [`templates-sdd/`](./templates-sdd/) — cada subpasta (`requisitos/`, `specs/`, `knowledge/`, `diagramas/`, `backlog/`) tem seu próprio índice explicando quando usar.

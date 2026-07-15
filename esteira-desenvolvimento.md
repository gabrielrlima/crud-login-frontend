# Esteira de desenvolvimento

> Processo completo, ponta a ponta, de como uma funcionalidade nasce como requisito e chega a produção. Ver [`CLAUDE.md`](./CLAUDE.md) para o mapa de pastas e as regras críticas — este documento detalha o papel de cada etapa do fluxo resumido lá.

```
Requisitos (F/NF) → SDD → Dev com Claude Code → Testes → CI → PR → Review & Merge → CD / Deploy → Fechamento
```

Modelo de Spec Driven Development (SDD): sem sprint, sem story separada, sem ADR separado. Toda a documentação de processo vive em [`projeto-sdd/`](./projeto-sdd/), a partir dos templates em [`templates-sdd/`](./templates-sdd/).

## 1. Requisitos (F/NF)

Todo pedido — vindo de negócio, de um bug encontrado, ou de instrução solta no chat — começa virando requisitos funcionais (RF) e não funcionais (RNF) em `projeto-sdd/requisitos/SDD-XXX-nome.md`. Nenhuma implementação começa sem essa etapa: é o insumo do SDD, não um formalismo posterior.

Antes de escrever requisito novo, verifique `projeto-sdd/knowledge/` — se a regra de negócio ou convenção técnica já está documentada ali, o requisito só referencia, não reexplica.

## 2. SDD (especificação)

Com os requisitos definidos, escreve-se o SDD em `projeto-sdd/specs/SDD-XXX-nome.md` — o documento central do projeto. Reúne, num só lugar:

- **Necessidade** do usuário ("Como/quero/para que").
- **Comportamento esperado**, detalhado o bastante para implementar direto a partir dele.
- **Critérios de aceite** testáveis.
- **Decisão de arquitetura**, só quando a funcionalidade genuinamente envolver escolha de arquitetura, nova dependência externa ou trade-off relevante — a maioria dos SDDs não tem essa seção.
- **Casos de borda** e o que fica **fora do escopo**.

A implementação parte sempre do SDD, nunca de instrução solta no chat retida só na conversa. Se o pedido originou de uma mensagem solta, o primeiro passo é transformá-la em SDD — não pular direto para o código.

## 3. Desenvolvimento com Claude Code

Implementação a partir do SDD, seguindo os documentos de `projeto-sdd/knowledge/` aplicáveis (linguagem, arquitetura de back-end, arquitetura de front-end, convenções de UI/feedback, ambiente Docker, Postgres). Convenção nova que se repete entre funcionalidades vira documento em `knowledge/`, não fica implícita só no código.

Toda rota de API nova ou alterada atualiza o Swagger/OpenAPI no mesmo commit — nunca depois, em commit separado.

## 4. Testes

xUnit no backend, Vitest + React Testing Library no front-end (ver `projeto-sdd/knowledge/csharp.md` e `frontend-arquitetura.md`). Todo critério de aceite do SDD precisa ter um teste correspondente — critério sem teste é sinal de cobertura incompleta, não de critério trivial.

## 5. CI

Pipeline dispara automaticamente a cada push e a cada PR aberta contra a branch principal, em runner self-hosted (ver `projeto-sdd/knowledge/ambiente-local-docker.md`): lint → testes → build, cada etapa bloqueante. Falha em qualquer etapa marca o check da PR como falho e bloqueia o merge. O mesmo ambiente Docker do desenvolvimento local é reaproveitado pelo job de CI, para evitar o cenário "passa localmente, falha no CI".

## 6. PR

Pull request aberta contra a branch principal, referenciando o SDD correspondente (`projeto-sdd/specs/SDD-XXX-nome.md`) na descrição — quem revisar precisa conseguir abrir o SDD e entender o que era esperado, sem depender de contexto de chat.

## 7. Review & Merge

Revisão humana confirma que a implementação bate com o SDD (comportamento, critérios de aceite, decisão de arquitetura quando houver) — não só que o código "funciona". Divergência entre implementação e SDD é resolvida antes do merge: ou o código é ajustado, ou o SDD é atualizado para refletir a decisão tomada durante a implementação (nunca fica um documento desatualizado depois do merge).

## 8. CD / Deploy

Estratégia de deploy em produção é decidida por SDD próprio quando a necessidade surgir — não decidida antecipadamente sem contexto real de onde/como o sistema vai rodar em produção. Até lá, esta etapa permanece em aberto, registrado como tal no SDD relevante.

## 9. Fechamento

Depois do merge, o SDD correspondente move de "Em revisão" para "Concluído" em `projeto-sdd/backlog.md`, com o "Registro de execução" preenchido (quem/qual agente implementou, notas de conclusão, arquivos alterados). Um SDD só fecha quando o documento bate com o que foi de fato implementado — se a implementação divergiu do SDD original, o documento é atualizado nesta etapa, o mais tardar.

---

## Nota histórica

As 23 primeiras funcionalidades deste projeto foram implementadas sob um modelo anterior — Sprint Planning → Story → Requisitos → ADR → Spec → Dev → Testes → CI → PR Automática → Review & Merge → CD/Deploy → Fechamento — com sprint, story e ADR como documentos separados (`sprints/`, `stories/`, `adr/` na raiz do projeto). Esse modelo foi descontinuado e essas pastas não existem mais neste repositório — o conteúdo já foi migrado para `projeto-sdd/` antes da remoção; o fluxo descrito acima é o único usado a partir da adoção do modelo SDD. Ver `CLAUDE.md`, seção "Mapa de pastas", para o detalhe.

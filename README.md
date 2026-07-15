# CRUD de login, autenticação e gestão de conta — front-end

Front-end (Next.js, shadcn/ui) do CRUD de login, autenticação (e-mail/senha e GitHub OAuth) e gestão de conta — cadastro, login, verificação de e-mail, recuperação de senha, consulta/atualização de perfil, troca de senha, exclusão de conta, tema claro/escuro.

Repositório irmão (back-end): [crud-login-backend](https://github.com/gabrielrlima/crud-login-backend)

## Este projeto também é material de estudo

Além de código funcionando, este repositório é um exemplo real de **Spec Driven Development (SDD)** — um modelo de trabalho onde nenhuma linha de código é escrita antes de existir um documento descrevendo o comportamento esperado. Se você nunca trabalhou assim, vale ler esta seção antes de mexer em qualquer coisa.

**A ideia central:** em vez de pedir "implementa uma tela de login" e deixar a IA (ou um dev júnior) inventar o contrato, escreve-se antes um **SDD** — um documento único por funcionalidade que reúne:

- **Necessidade** — quem precisa de quê, e por quê (formato "Como `<perfil>`, quero `<ação>` para que `<benefício>`").
- **Comportamento esperado** — detalhado o bastante para implementar direto a partir dele, sem voltar pra perguntar "e nesse caso, o que acontece?" (ex.: texto exato de cada mensagem de erro, tempo exato de redirecionamento após sucesso).
- **Critérios de aceite** — testáveis, não "deve funcionar bem".
- **Decisão de arquitetura** — só quando a funcionalidade genuinamente envolve uma escolha de arquitetura, uma dependência nova ou um trade-off relevante. A maioria das funcionalidades **não** tem essa seção — e isso é o comportamento certo, não uma lacuna. Olhe qualquer SDD em [`projeto-sdd/specs/`](./projeto-sdd/specs/): das 24 funcionalidades documentadas, só 10 têm decisão de arquitetura própria (ex.: `SDD-003`, a escolha do Next.js). O resto é só comportamento de tela.

Por que a decisão de arquitetura mora *dentro* do SDD, e não num documento à parte (tipo um ADR clássico)? Porque a experiência real deste projeto mostrou que separar os dois cria dois lugares pra manter sincronizados, e um deles some da cabeça de quem está implementando. Um SDD que reaproveita uma decisão já tomada em outro simplesmente referencia o SDD de origem — nunca duplica o conteúdo.

### As pastas de apoio, e por que cada uma existe

- [`projeto-sdd/requisitos/`](./projeto-sdd/requisitos/) — os requisitos funcionais e não funcionais de cada SDD, escritos **antes** do comportamento esperado. É o insumo, não uma formalidade posterior: se um requisito nunca vira comportamento especificado, ele não é implementado.
- [`projeto-sdd/knowledge/`](./projeto-sdd/knowledge/) — conhecimento que se repete entre várias telas (convenções de shadcn/ui, feedback de UI — loading/erro/sucesso —, arquitetura de front-end por feature) documentado **uma vez só**, em vez de reexplicado em cada SDD. Antes de implementar qualquer coisa, confira aqui — o código não pode fugir do padrão documentado.
- [`projeto-sdd/diagramas/`](./projeto-sdd/diagramas/) — fluxogramas SVG dos fluxos que se beneficiam de um desenho (login, recuperação de senha, OAuth do GitHub). Nem todo SDD precisa de um.
- [`projeto-sdd/backlog.md`](./projeto-sdd/backlog.md) — todas as funcionalidades por status (A fazer / Em andamento / Em revisão / Concluído), sem sprint, sem ciclo de tempo fixo.
- [`templates-sdd/`](./templates-sdd/) — o modelo vazio de cada tipo de documento acima. Se você for começar uma funcionalidade nova em outro projeto, é por aqui que se copia a estrutura.

**Por onde começar de verdade:** leia [`CLAUDE.md`](./CLAUDE.md) — é o ponto de entrada único, carregado automaticamente por qualquer sessão do Claude Code neste repositório, e mapeia exatamente como as peças acima se conectam. Depois, abra qualquer arquivo em `projeto-sdd/specs/` e leia de ponta a ponta — a melhor forma de entender o modelo é ver um exemplo real implementado.

> Este repositório é a metade "front-end" do projeto. `projeto-sdd/` e `templates-sdd/` são cópias completas, mantidas manualmente em sincronia com o repositório de back-end — não há automação de sync entre os dois (ver `projeto-sdd/specs/SDD-024-deploy-producao-vercel-railway.md`, "Consequências").

## Ambiente de desenvolvimento local

O código-fonte fica em [`frontend/`](./frontend/) (subpasta, não na raiz — o repositório também carrega `projeto-sdd/`/`templates-sdd/` ao lado).

```bash
cd frontend
cp .env.local.example .env.local   # edite os valores conforme necessário
pnpm install
pnpm dev
```

## Deploy em produção

Publicado na [Vercel](https://vercel.com), com **Root Directory** configurado como `frontend` (o projeto Vercel aponta para a subpasta, não para a raiz do repositório). Ver [`projeto-sdd/specs/SDD-024-deploy-producao-vercel-railway.md`](./projeto-sdd/specs/SDD-024-deploy-producao-vercel-railway.md) para o comportamento esperado e a decisão de arquitetura completa — inclusive o raciocínio por trás de separar o projeto em dois repositórios em vez de manter um monorepo.

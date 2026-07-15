# CRUD de login, autenticação e gestão de conta — front-end

Front-end (Next.js, shadcn/ui) do CRUD de login, autenticação (e-mail/senha e GitHub OAuth) e gestão de conta — cadastro, login, verificação de e-mail, recuperação de senha, consulta/atualização de perfil, troca de senha, exclusão de conta, tema claro/escuro.

Repositório irmão (back-end): [crud-login-backend](https://github.com/gabrielrlima/crud-login-backend)

## Documentação e processo

Este projeto segue o modelo **SDD** (Spec Driven Development). Comece por [`CLAUDE.md`](./CLAUDE.md) — ponto de entrada único, carregado automaticamente por qualquer sessão do Claude Code neste repositório. Toda a documentação viva (requisitos, specs, conhecimento durável, diagramas, backlog) está em [`projeto-sdd/`](./projeto-sdd/); o modelo reutilizável de cada tipo de documento está em [`templates-sdd/`](./templates-sdd/).

> Este repositório é a metade "front-end" do projeto. `projeto-sdd/` e `templates-sdd/` são cópias completas, mantidas manualmente em sincronia com o repositório de back-end — não há automação de sync entre os dois (ver `projeto-sdd/specs/SDD-024-deploy-producao-vercel-railway.md`, "Consequências").

## Ambiente de desenvolvimento local

O código-fonte fica em [`frontend/`](./frontend/) (subpasta, não na raiz).

```bash
cd frontend
cp .env.local.example .env.local   # edite os valores conforme necessário
pnpm install
pnpm dev
```

## Deploy em produção

Publicado na [Vercel](https://vercel.com), com **Root Directory** configurado como `frontend` (o projeto Vercel aponta para a subpasta, não para a raiz do repositório). Ver [`projeto-sdd/specs/SDD-024-deploy-producao-vercel-railway.md`](./projeto-sdd/specs/SDD-024-deploy-producao-vercel-railway.md) para o comportamento esperado e a decisão de arquitetura completa.

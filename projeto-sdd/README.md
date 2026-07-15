# Projeto — CRUD de login, autenticação e gestão de conta

Documentação completa do projeto — cadastro, login por e-mail/senha e GitHub OAuth, verificação de e-mail, recuperação de senha, bloqueio de conta por tentativas, consulta/atualização de perfil, troca de senha, exclusão de conta, e o design system do front-end (tipografia, dimensionamento de componentes, tema claro/escuro). Modelo de Spec Driven Development (SDD), autocontido: todo o conhecimento necessário para entender e continuar o projeto está nesta pasta.

## O que tem aqui

```
projeto-sdd/
  requisitos/   # RF/RNF de cada funcionalidade — SDD-001 a SDD-024
  specs/        # SDD de cada funcionalidade — necessidade, comportamento esperado,
                # decisão de arquitetura (quando houver) e critérios de aceite
  knowledge/    # conhecimento durável e transversal ao projeto
  diagramas/    # fluxogramas SVG dos principais fluxos (login, recuperação de senha)
  backlog.md    # as funcionalidades, por status
```

Cada `SDD-XXX` em `specs/` reúne, num só documento: a necessidade do usuário, o comportamento esperado, os casos de borda, o que fica fora do escopo, os critérios de aceite e — só quando a funcionalidade genuinamente envolveu uma escolha de arquitetura — a seção "Decisão de arquitetura". A implementação parte sempre daqui, nunca de instrução solta.

## Decisões de arquitetura

A maioria das SDDs não tem decisão de arquitetura própria — só descreve comportamento. As que têm:

| SDD | Decisão |
|---|---|
| `SDD-001` | Ambiente de desenvolvimento local via Docker; motor de banco de dados PostgreSQL |
| `SDD-002` | Runner de CI/CD self-hosted |
| `SDD-003` | Framework de front-end (Next.js) |
| `SDD-004` | Estratégia de autenticação (e-mail/senha, JWT de curta duração, hash bcrypt) |
| `SDD-013` | Provedor de e-mail transacional (Mailpit em desenvolvimento) |
| `SDD-014` | Mecanismo de invalidação de sessão ao redefinir senha (campo `SenhaAlteradaEm` + claim `iat`) |
| `SDD-015` | Armazenamento do contador de tentativas de login |
| `SDD-019` | Exclusão da própria conta (hard-delete) |
| `SDD-023` | Login e cadastro via GitHub (OAuth) |
| `SDD-024` | Deploy em produção (Vercel + Railway), separação em repositórios e provedor de e-mail de produção |

Funcionalidades que reaproveitam uma decisão já tomada em outra (ex: `SDD-005` reaproveita a decisão de `SDD-004`; `SDD-018` reaproveita o mecanismo de `SDD-014`) não repetem o conteúdo — só referenciam a SDD de origem.

## Backlog

Ver [`backlog.md`](./backlog.md) — as funcionalidades por status, sem agrupamento por ciclo de tempo.

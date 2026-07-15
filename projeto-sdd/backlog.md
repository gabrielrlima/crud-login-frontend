# Backlog de SDDs — CRUD de login, autenticação e gestão de conta

> Mesmas 23 funcionalidades já implementadas no projeto (ver [`README.md`](./README.md)), listadas aqui só por status, sem agrupamento por ciclo de tempo — seguindo o modelo de [`templates-sdd/backlog/`](../templates-sdd/backlog/).

## A fazer

| SDD | Título |
|---|---|
| `SDD-024` | Deploy em produção (Vercel + Railway) e separação em repositórios |

## Em andamento

_(nenhuma)_

## Em revisão

| SDD | Título |
|---|---|
| `SDD-001` | Ambiente de desenvolvimento local via Docker |
| `SDD-002` | Pipeline de CI/CD com runner self-hosted |
| `SDD-003` | Inicialização do projeto front-end (Next.js + shadcn/ui) |
| `SDD-004` | Cadastro de usuário |
| `SDD-005` | Login |
| `SDD-006` | Prevenir duplo submit nos formulários de cadastro e login |
| `SDD-007` | Padrão de exibição de erros de formulário (inline vs. genérico) |
| `SDD-008` | Estado de carregamento (loading) dos formulários de cadastro e login |
| `SDD-009` | Feedback de sucesso e navegação pós-cadastro e pós-login |
| `SDD-010` | Tratamento de expiração de sessão (401) no front-end |
| `SDD-011` | Acessibilidade dos formulários de cadastro e login |
| `SDD-012` | Interação de logout na UI |
| `SDD-013` | Verificação de e-mail no cadastro |
| `SDD-014` | Recuperação de senha via e-mail |
| `SDD-015` | Bloqueio de conta por tentativas de login (rate limiting) |
| `SDD-016` | Consulta do próprio perfil (GET /me) |
| `SDD-017` | Atualização de dados de perfil (nome e e-mail) |
| `SDD-018` | Troca de senha do usuário autenticado |
| `SDD-019` | Exclusão da própria conta |
| `SDD-020` | Trocar fonte do projeto para DM Sans |
| `SDD-021` | Padronizar dimensões dos componentes conforme os blocks de referência do shadcn/ui |
| `SDD-022` | Alternador de tema claro/escuro (dark mode) |
| `SDD-023` | Login e cadastro via GitHub (OAuth) |

## Concluído

_(nenhuma ainda — "Em revisão" aqui significa implementado e autoverificado, pendente de revisão humana/PR e merge)_

---

## Notas

- Todas as 23 funcionalidades foram implementadas e verificadas (build/testes próprios passando, e a maioria com smoke test manual no navegador) — o que falta pra mover pra "Concluído" é só a revisão humana/PR, não trabalho técnico pendente.
- `SDD-023` (GitHub OAuth) tem uma pendência adicional documentada no próprio SDD: teste de ponta a ponta real depende de um GitHub OAuth App registrado, que é um pré-requisito operacional fora do alcance de teste automatizado.
- `SDD-024` (deploy em produção) resolve duas decisões que vinham em aberto: estratégia de deploy (`esteira-desenvolvimento.md`, etapa 8) e provedor de e-mail de produção (`SDD-013`). Passou pelo gate de entrada de "A fazer" (critérios de aceite testáveis, requisitos registrados, knowledge docs identificados) — falta confirmar o nome dos dois repositórios e o provedor de e-mail final antes de implementar.
- Próximo SDD novo começa em `SDD-025`.

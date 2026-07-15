# Knowledge Base — Padrão SDD

Conhecimento durável e transversal que várias SDDs, specs e ADRs compartilham — para não repetir a mesma explicação de domínio em três specs diferentes, e para a IA ter contexto de negócio/técnico antes de implementar.

> Se uma informação só importa para uma SDD específica, ela vai na spec daquela SDD (`specs/`), não aqui. Este espaço é para o que é verdade em várias SDDs.

## O que entra aqui

- Regras de negócio e domínio que atravessam múltiplas SDDs.
- Glossário de termos do domínio.
- Contratos e particularidades de integrações externas (sistemas, APIs de terceiros).
- Convenções técnicas do projeto que não mudam de SDD para SDD.

## O que NÃO entra aqui

- Comportamento específico de uma funcionalidade → isso é `specs/SDD-ID-nome.md`.
- Decisão de arquitetura pontual, com alternativas e trade-offs → isso é a seção "Decisão de arquitetura" dentro do próprio `specs/SDD-ID-nome.md`.
- Requisito funcional/não funcional de uma funcionalidade → isso é `requisitos/SDD-ID-nome.md`.

## Formato de cada documento (padrão SDD)

Cada arquivo em `knowledge/` segue a mesma disciplina de um SDD — escopo explícito e referências cruzadas — a partir de [`knowledge-template.md`](../../templates-sdd/knowledge/knowledge-template.md):

- **Contexto** — por que esse conhecimento existe e para quem importa.
- **Conteúdo** — o conhecimento em si, estruturado.
- **Fora do escopo** — o que este documento explicitamente não cobre (evita virar um "manual geral" vago).
- **Referenciado por** — quais specs/ADRs/SDDs dependem deste documento.

## Convenção de nome

`knowledge/tema-nome-curto.md` — ex: `knowledge/dominio-pagamentos.md`, `knowledge/glossario.md`, `knowledge/integracao-gateway-pagamento.md`.

## Documentos existentes

| Documento | Tema |
|---|---|
| [`frontend-shadcn-ui.md`](./frontend-shadcn-ui.md) | shadcn/ui — filosofia, instalação, componentes vs. blocks, catálogo de blocks de login |
| [`cqrs.md`](./cqrs.md) | CQRS — separação de comandos e queries, quando usar/não usar, exemplo em C# |
| [`csharp.md`](./csharp.md) | C# — versão atual, convenções de nomenclatura, nullable reference types, idiomas modernos |
| [`c4-model.md`](./c4-model.md) | C4 Model — níveis Context/Container/Component/Code, diagramas complementares |
| [`clean-code.md`](./clean-code.md) | Clean Code — nomes, funções, comentários, erros, classes, testes |
| [`boas-praticas-arquitetura.md`](./boas-praticas-arquitetura.md) | Princípios de arquitetura — SOLID, direção de dependência, acoplamento/coesão, estilos arquiteturais |
| [`frontend-feedback-ui.md`](./frontend-feedback-ui.md) | Convenção de feedback de UI — loading, exibição de erro, sucesso, sessão expirada, acessibilidade mínima |
| [`ambiente-local-docker.md`](./ambiente-local-docker.md) | Ambiente de desenvolvimento local via Docker — comando único, convenções de `.env`, mesmo ambiente reaproveitado pelo CI |
| [`postgresql.md`](./postgresql.md) | PostgreSQL — versão, convenções de nomenclatura/tipos, chave primária (UUIDv7), ambiente Docker, driver .NET |
| [`frontend-arquitetura.md`](./frontend-arquitetura.md) | Arquitetura de código React — estrutura por feature, estado (TanStack Query + Zustand), formulários (React Hook Form + Zod), testes (Vitest + Playwright) |
| [`backend-arquitetura.md`](./backend-arquitetura.md) | Arquitetura do back-end .NET — camadas Controller/Service, padrão `Resultado*`, configuração fail-fast, abstração de dependência externa, tipo de autenticação/sessão (JWT) |
| [`backend-fluxo-de-requisicao.md`](./backend-fluxo-de-requisicao.md) | Diagrama C4 Container e pipeline de middleware do back-end (ordem e por quê) |
| [`fluxo-login.md`](./fluxo-login.md) | Fluxo do login (e-mail/senha, GitHub OAuth) e recuperação de senha, front-end + back-end juntos — fluxograma SVG com raias por ator + diagrama de sequência Mermaid |

---

*Todo documento aqui deveria, idealmente, ser referenciado por pelo menos uma spec, ADR ou SDD — conhecimento que ninguém referencia é sinal de que devia estar em outro lugar (ou não existir).*

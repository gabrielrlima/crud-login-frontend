# Knowledge — Convenção de feedback de UI

> Conhecimento durável, usado por mais de um SDD. Se isso só importa para uma funcionalidade específica, mova para o SDD dela.

## Contexto

Toda SDD de front-end que envolve formulário ou ação do usuário (cadastro, login, e futuramente recuperação de senha, atualização de perfil, exclusão de conta) precisa comunicar estado — carregando, erro, sucesso — de forma consistente. Sem essa convenção documentada, cada SDD reinventa o padrão isoladamente, arriscando inconsistência visual e de comportamento entre telas.

Consolidado a partir de uma análise de lacunas sobre `specs/SDD-004-cadastro-de-usuario.md` e `specs/SDD-005-login.md`, que descreviam bem o comportamento de back-end mas não tinham nenhuma convenção de feedback de interface explicitada.

## Conteúdo

### Estado de carregamento (loading)

- Indicador visual (spinner e/ou alteração do texto do botão) entre o clique em enviar e a resposta.
- Campos de entrada desabilitados durante o carregamento.
- Botão de envio desabilitado durante a requisição — previne duplo submit.
- Reversão ao estado normal do formulário ao receber qualquer resposta (sucesso ou erro).

### Exibição de erro

- Erro de validação de campo específico (obrigatório, formato, força de senha): inline, abaixo do campo, associado via `aria-describedby`/`aria-invalid`.
- Erro que não aponta para um campo específico (ex.: credenciais inválidas, falha genérica do servidor): mensagem genérica acima do formulário ou toast — nunca inline num campo que não é a causa real do erro.
- Foco move para o primeiro campo inválido após um envio malsucedido.
- Erros assíncronos (toast) são anunciados a leitores de tela via `aria-live`.

### Feedback de sucesso

- Confirmação visual (toast ou transição de tela) antes de qualquer redirecionamento.
- Rota de destino pós-ação sempre definida explicitamente na spec da SDD — nunca deixada implícita na implementação.

### Sessão expirada

- Interceptar respostas 401 fora do fluxo de login, limpar o token local, redirecionar para login com mensagem clara ("sessão expirada, faça login novamente").

### Acessibilidade mínima

- Labels associados a inputs — já nativo nos componentes shadcn/Radix.
- `aria-describedby`/`aria-invalid` em erros de campo.
- `aria-live` em feedback assíncrono (toast).
- Ordem de tab lógica, revisada sempre que um formulário padrão for adaptado (campo adicionado ou removido).

## Fora do escopo

- Biblioteca ou componente específico de toast/notificação — é decisão de implementação da spec/SDD, não deste documento.
- Internacionalização de mensagens.
- Auditoria de acessibilidade WCAG completa da aplicação — este documento cobre a linha de base para formulários, não o produto inteiro.

---

## Referenciado por

| Documento | Caminho |
|---|---|
| SDD — Prevenir duplo submit | `specs/SDD-006-prevenir-duplo-submit.md` |
| SDD — Padrão de exibição de erros | `specs/SDD-007-padrao-exibicao-de-erros.md` |
| SDD — Estado de loading | `specs/SDD-008-estado-de-loading.md` |
| SDD — Feedback de sucesso | `specs/SDD-009-feedback-de-sucesso.md` |
| SDD — Expiração de sessão | `specs/SDD-010-expiracao-de-sessao.md` |
| SDD — Acessibilidade dos formulários | `specs/SDD-011-acessibilidade-formularios.md` |
| SDD — Interação de logout | `specs/SDD-012-interacao-de-logout.md` |

> Se nada referencia este documento, ele provavelmente não devia existir (ou devia estar dentro de uma spec específica).

## Referências

- Consolidado internamente a partir de análise de lacunas de UX sobre as primeiras funcionalidades de autenticação (cadastro e login) — sem fonte externa única; convenções alinhadas às práticas nativas de acessibilidade do Radix (base do shadcn/ui, ver [`knowledge/frontend-shadcn-ui.md`](./frontend-shadcn-ui.md)).

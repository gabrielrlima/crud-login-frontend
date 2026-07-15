# Diagramas — índice

Fluxogramas SVG autocontidos, referenciados a partir de `specs/` (seção "Baseado em") e, quando fizer sentido, de `knowledge/`.

## O que entra aqui

- Fluxogramas com raias (swimlanes) por ator — Usuário, Front-end, Back-end, sistemas externos.
- Diagramas de decisão (ex: "token válido?") com os dois desfechos.

## O que NÃO entra aqui

- Diagrama de sequência textual (nomes reais de função/arquivo) → isso pode ficar direto dentro do SDD, em bloco Mermaid, se preferir texto a SVG.
- Explicação de por que o fluxo é assim → isso é a seção "Comportamento esperado" do SDD; o diagrama é o desenho, não a justificativa.

## Convenção de nome

`diagramas/nome-do-fluxo.svg` — nome descritivo do fluxo, não do SDD (um diagrama pode ser referenciado por mais de um SDD).

## Convenções técnicas (não é um "template" — cada diagrama é desenhado sob medida)

- **Autocontido:** sem dependência de biblioteca externa — abre direto no navegador ou embutido em qualquer lugar (`<style>` inline com as cores, sem CDN).
- **Tema claro/escuro automático:** bloco `@media (prefers-color-scheme: dark)` dentro do próprio `<style>`, nunca cores hardcoded que quebrem no escuro.
- **Raias por ator:** divisórias verticais tracejadas e sutis, um header por raia (`Usuário`, `Front-end`, `Back-end` etc.).
- **Cor por categoria, não por sequência:** uma cor por ator/raia + uma cor de sucesso + uma cor de erro — nunca uma cor arbitrária por caixa.
- **`viewBox` e `role="img"`** com `<title>`/`<desc>` — acessível a leitor de tela mesmo sendo um SVG solto.

## Como usar

1. Veja se o fluxo já tem um diagrama equivalente antes de desenhar um novo.
2. Ao criar, teste abrindo o arquivo direto no navegador antes de referenciar no SDD — sem sobreposição de caixa/texto, sem quebrar no tema escuro.
3. Referencie o caminho relativo a partir do SDD, na seção "Baseado em".

## Documentos existentes

| Diagrama | Fluxo |
|---|---|
| _(nenhum ainda — este é o modelo, não o projeto real)_ | |

---

*Ver [`../../projeto-sdd/diagramas/`](../../projeto-sdd/diagramas/) para exemplos reais já testados.*

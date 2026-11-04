# Plano de Tagueamento — Web Analytics

Ferramenta aberta para **especificar eventos de Web Analytics antes do desenvolvimento**: quem pede a mensuração preenche uma página HTML com o contexto da iniciativa, os prints das telas, os eventos e os parâmetros — e a ferramenta gera o **documento para o time de desenvolvimento**, o **código sugerido** (`dataLayer`, `gtag` ou Adobe) e os **critérios de aceite para QA**.

O objetivo é garantir que eventos, parâmetros e fluxos de dados sejam definidos de forma **consistente desde a concepção do projeto**, e que o plano fique **versionado no Git** junto com o histórico de decisões.

## O que a página faz

| Etapa | O que a pessoa preenche | O que o dev recebe |
|---|---|---|
| **1. Projeto** | Objetivo de negócio, KPIs, responsáveis, ferramentas (GTM, GA4, Adobe…), método de implementação, parâmetros globais, histórico | Contexto: por que medir e quem decide |
| **2. Telas e prints** | Uma tela por etapa do fluxo, com URL/rota e print (colar com Ctrl+V, arrastar ou escolher arquivo) | O fluxo visual com os eventos marcados (E01, E02…) |
| **3. Eventos** | Nome, gatilho, pergunta de negócio, regra de disparo, tela, **ponto no print**, texto/seletor do elemento, parâmetros (tipo, obrigatoriedade, exemplo, origem do valor) | Especificação exata de cada evento + código pronto para adaptar |
| **4. Documento** | — | Documento completo para imprimir/PDF, HTML, Markdown com imagens anotadas (.zip), CSV (para Jira/planilha) e `implementacao.js` |

### Validações automáticas
As regras ficam em [`app/rules.js`](app/rules.js) e valem tanto na página quanto no CI:

- Nomes de evento e parâmetro em `snake_case`, até 40 caracteres.
- Nomes e prefixos reservados do GA4 (`session_start`, `first_visit`, `google_`, `ga_`, `firebase_`…).
- Até 25 parâmetros por evento (somando os globais).
- Parâmetros duplicados ou que repetem um parâmetro global.
- Eventos sem descrição de disparo, sem pergunta de negócio, sem tela ou sem marcação no print.

> Os limites do GA4 mudam ocasionalmente — confira a documentação oficial e ajuste `CONFIG` em `app/rules.js` para a convenção da sua empresa.

## Como usar

**Sem instalar nada:** abra o `index.html` no navegador (funciona por `file://`). Clique em **Exemplo** para ver um plano preenchido.

**Publicado para o time (recomendado):** ative o GitHub Pages (Settings → Pages → Source: *GitHub Actions*). O workflow [`pages.yml`](.github/workflows/pages.yml) publica a página a cada push na `main`.

### Fluxo de trabalho sugerido

1. Negócio/Analytics abre uma issue com o template **"Nova iniciativa de mensuração"**.
2. Preenche o plano na página e clica em **Salvar JSON**.
3. Abre um Pull Request adicionando o arquivo em `plans/` (ex.: `plans/emprestimo-pessoal-v1.0.0.json`).
4. O workflow [`validate.yml`](.github/workflows/validate.yml) valida o plano e **bloqueia o PR se houver erros**.
5. Dev revisa no PR, implementa usando o documento/código gerado e anexa evidências (GTM Preview / DebugView).
6. QA usa os critérios de aceite do documento. Ao publicar, atualize o status e o histórico do plano.

Detalhes em [`docs/processo.md`](docs/processo.md) e convenções em [`docs/convencao-de-nomenclatura.md`](docs/convencao-de-nomenclatura.md).

## Estrutura do repositório

```
├── index.html                  # a ferramenta (página única, sem build)
├── app/
│   ├── app.js                  # lógica da página, geração de documento e código
│   ├── rules.js                # regras de validação (compartilhadas com o CI)
│   └── example.js              # plano de exemplo
├── plans/                      # planos reais das iniciativas (JSON versionado)
├── examples/                   # exemplos em JSON
├── scripts/validate.js         # validador de linha de comando (Node, sem dependências)
├── docs/                       # processo, convenções e checklist de QA
└── .github/
    ├── workflows/validate.yml  # valida planos em PRs
    ├── workflows/pages.yml     # publica a página no GitHub Pages
    └── ISSUE_TEMPLATE/         # template de nova iniciativa
```

## Validar pela linha de comando

```bash
node scripts/validate.js                 # valida plans/ e examples/
node scripts/validate.js plans/meu.json  # valida um arquivo
```

## Formato do plano (JSON)

```jsonc
{
  "schemaVersion": "1.0",
  "project":      { "name": "...", "objective": "...", "method": "dataLayer", "tools": ["Google Analytics 4"], ... },
  "globalParams": [{ "name": "page_type", "type": "string", "required": true, "example": "home", ... }],
  "screens":      [{ "id": "scr_x", "name": "1. Home", "url": "/", "image": "data:image/...", ... }],
  "events":       [{ "id": "ev_x", "name": "cta_click", "screenId": "scr_x", "marker": { "x": 40, "y": 62 }, "params": [...], ... }],
  "changelog":    [{ "date": "2026-11-04", "author": "...", "change": "..." }]
}
```

Os prints ficam embutidos no JSON (comprimidos para até 1600 px). Para planos com muitas telas, prefira prints recortados na área relevante.

## Privacidade (LGPD)

A página não envia nada para servidores: tudo fica no navegador de quem usa (localStorage) e nos arquivos exportados. **Não cole prints com dados pessoais reais** (use ambientes de homologação ou dados fictícios) e nunca especifique parâmetros com CPF, nome, e-mail, telefone ou endereço.

## Personalizando

- **Convenções e limites:** `CONFIG` em `app/rules.js` (regex de nome, nomes reservados, listas de gatilhos, status, origens de valor).
- **Ferramentas e métodos:** `TOOLS` e `METHODS` no topo de `app/app.js`.
- **Visual:** variáveis CSS em `:root` no `index.html`.

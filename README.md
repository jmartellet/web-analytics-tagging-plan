# Plano de Tagueamento | Web Analytics

**Acesse a ferramenta:** https://jmartellet.github.io/web-analytics-tagging-plan/

Ferramenta aberta para **especificar eventos de Web Analytics antes do desenvolvimento**. Quem pede a mensuração preenche uma página com o contexto da iniciativa, os prints das telas, os eventos e os parâmetros. A ferramenta gera o **documento para o time de desenvolvimento**, o **código sugerido** (`dataLayer`, `gtag` ou Adobe) e os **critérios de aceite para QA**.

O objetivo é garantir que eventos, parâmetros e fluxos de dados sejam definidos de forma **consistente desde a concepção do projeto**, e que cada plano fique **versionado no Git** junto com o histórico de decisões.

## O que a ferramenta faz

| Etapa | O que a pessoa preenche | O que o dev recebe |
|---|---|---|
| **1. Projeto** | Objetivo de negócio, KPIs, responsáveis, ferramentas (GTM, GA4, Adobe…), método de implementação, parâmetros globais e histórico | Contexto: por que medir e quem decide |
| **2. Telas e prints** | Uma tela por etapa do fluxo, com URL/rota e print (colar com Ctrl+V, arrastar ou escolher arquivo) | O fluxo visual com os eventos marcados (E01, E02…) |
| **3. Eventos** | Nome, gatilho, pergunta de negócio, regra de disparo, tela, **ponto no print**, texto/seletor do elemento e parâmetros (tipo, obrigatoriedade, exemplo, origem do valor) | Especificação exata de cada evento e código pronto para adaptar |
| **4. Documento** | Nada: é gerado automaticamente | Documento completo para imprimir ou salvar em PDF, além de HTML, Markdown com imagens anotadas (.zip), CSV (para Jira ou planilha) e `implementacao.js` |

### Validações automáticas

As regras ficam em [`app/rules.js`](app/rules.js) e valem tanto na página quanto na validação automática do repositório:

- Nomes de evento e parâmetro em `snake_case`, com até 40 caracteres.
- Nomes e prefixos reservados do GA4 não são aceitos (`session_start`, `first_visit`, `google_`, `ga_`, `firebase_`…).
- Até 25 parâmetros por evento, somando os globais.
- Parâmetros duplicados ou que repetem um parâmetro global.
- Eventos sem regra de disparo, sem pergunta de negócio, sem tela ou sem marcação no print.

> Os limites do GA4 mudam ocasionalmente. Confira a documentação oficial e ajuste o `CONFIG` em `app/rules.js` para a convenção da sua empresa.

## Como usar

1. Acesse **https://jmartellet.github.io/web-analytics-tagging-plan/**.
2. Clique em **Exemplo** para ver um plano preenchido, ou em **Novo** para começar do zero.
3. Preencha as abas **Projeto**, **Telas e prints** e **Eventos**.
4. Na aba **Documento para o dev**, exporte no formato que o time preferir.
5. Clique em **Salvar JSON** e guarde o arquivo na pasta `plans/` deste repositório.

O plano fica salvo automaticamente no navegador de quem está preenchendo. Para não perder o trabalho e compartilhar com o time, sempre use **Salvar JSON**. Para continuar um plano depois, use **Abrir JSON**.

Também é possível usar sem internet: baixe o repositório e abra o `index.html` no navegador.

## Fluxo de trabalho

1. **Pedido:** Negócio ou Analytics abre uma issue com o modelo **"Nova iniciativa de mensuração"** (aba Issues → New issue).
2. **Plano:** o plano é preenchido na ferramenta e salvo como JSON.
3. **Revisão:** o arquivo é enviado para a pasta `plans/` (ex.: `plans/emprestimo-pessoal-v1.0.0.json`), de preferência por Pull Request.
4. **Validação:** o robô [`validate.yml`](.github/workflows/validate.yml) confere o plano automaticamente. Se houver erro, aparece um ❌ na aba Actions e no Pull Request.
5. **Implementação:** o dev usa o documento e o código gerados e anexa as evidências (GTM Preview ou DebugView do GA4).
6. **Homologação e publicação:** QA usa os critérios de aceite do documento. Depois de publicado, o status e o histórico do plano são atualizados.

Mais detalhes em [`docs/processo.md`](docs/processo.md), convenções em [`docs/convencao-de-nomenclatura.md`](docs/convencao-de-nomenclatura.md) e checklist em [`docs/checklist-qa.md`](docs/checklist-qa.md).

## Estrutura do repositório

```
├── index.html                       # a ferramenta (página única, sem instalação)
├── app/
│   ├── app.js                       # lógica da página, geração do documento e do código
│   ├── rules.js                     # regras de validação (usadas na página e no robô)
│   └── example.js                   # plano de exemplo
├── plans/                           # planos reais das iniciativas (JSON versionado)
├── examples/                        # exemplos em JSON
├── scripts/validate.js              # validador de linha de comando (Node, sem dependências)
├── docs/                            # processo, convenções e checklist de QA
└── .github/
    ├── workflows/validate.yml       # robô que valida os planos
    ├── ISSUE_TEMPLATE/              # modelo de pedido de nova iniciativa
    └── pull_request_template.md     # checklist para envio de alterações
```

## Validar pela linha de comando

Para quem tem Node instalado:

```bash
node scripts/validate.js                 # valida plans/ e examples/
node scripts/validate.js plans/meu.json  # valida um arquivo específico
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

Os prints ficam dentro do próprio JSON, reduzidos para até 1600 px de largura. Em planos com muitas telas, prefira prints recortados na área relevante.

## Privacidade (LGPD)

A ferramenta não envia nada para servidores. Tudo fica no navegador de quem usa e nos arquivos exportados.

- **Não use prints com dados pessoais reais.** Prefira ambientes de homologação ou dados fictícios.
- **Nunca especifique parâmetros** com CPF, nome, e-mail, telefone, endereço ou qualquer dado que identifique a pessoa.

## Personalização

- **Convenções e limites:** `CONFIG` em `app/rules.js` (padrão de nomes, nomes reservados, gatilhos, status e origens de valor).
- **Ferramentas e métodos de implementação:** `TOOLS` e `METHODS` no início de `app/app.js`.
- **Cores e visual:** variáveis CSS em `:root` no `index.html`.

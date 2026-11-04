# Processo: da ideia ao dado publicado

| # | Etapa | Responsável | Entrada | Saída |
|---|---|---|---|---|
| 1 | **Abertura** | Negócio / PO | Issue "Nova iniciativa de mensuração" | Objetivo e perguntas de negócio |
| 2 | **Desenho do plano** | Analytics | Protótipo/prints, perguntas | Plano preenchido na página (`plans/*.json`) |
| 3 | **Revisão** | Analytics + Dev (+ Privacidade, se houver dado sensível) | Pull Request com o JSON | PR aprovado, CI verde |
| 4 | **Implementação** | Dev | Documento + `implementacao.js` | Código com `dataLayer`/atributos `data-analytics` |
| 5 | **Configuração** | Analytics | Plano aprovado | Tags/acionadores/variáveis no GTM; dimensões personalizadas no GA4 |
| 6 | **Homologação** | QA / Analytics | Critérios de aceite do documento | Evidências (GTM Preview, DebugView, prints do dataLayer) |
| 7 | **Publicação** | Dev + Analytics | Homologação aprovada | Status "Publicado" e registro no histórico do plano |

## Regras do jogo

- **Nenhum evento é implementado sem estar no plano.** Mudou algo? Atualize o JSON, a versão e o histórico.
- **Um evento responde a uma pergunta de negócio.** Se ninguém sabe qual decisão o dado apoia, ele não entra.
- **Prefira parâmetros a novos eventos.** `cta_click` com `cta_name` é melhor do que `click_botao_azul_home`.
- **Versionamento semântico do plano:** `MAJOR` quando eventos/parâmetros existentes mudam de nome ou significado (quebra relatórios), `MINOR` quando eventos novos são adicionados, `PATCH` para correções de texto.
- **Evidência obrigatória:** o PR de implementação deve anexar a captura do GTM Preview ou DebugView de cada evento.

# Convenção de nomenclatura

## Eventos
- `snake_case`, só letras minúsculas, números e `_`, começando por letra, até **40** caracteres.
- Padrão **objeto_ação**: `loan_simulation_start`, `offer_select`, `form_submit_error`.
- Use os **eventos recomendados do GA4** quando existirem (`login`, `sign_up`, `search`, `generate_lead`, `purchase`, `select_content`…).
- Não use nomes/prefixos reservados (`session_start`, `first_visit`, `user_engagement`, `google_*`, `ga_*`, `firebase_*`).
- Não coloque valores variáveis no nome (❌ `click_oferta_24x`, ✅ `offer_select` + `installments: 24`).

## Parâmetros
- Mesmas regras de formato; até **40** caracteres no nome e **100** no valor.
- Máximo de **25** parâmetros por evento (somando os globais).
- O mesmo conceito tem sempre o mesmo nome em todos os eventos (`installments` nunca vira `parcelas` em outro lugar).
- Valores em minúsculas e sem acento quando forem categorias (`varejo`, `oferta_a`).
- Números sem máscara e com ponto decimal (`1.89`, não `1,89%`); moeda em `currency` ISO 4217 (`BRL`).

## Atributos no HTML
Para facilitar acionadores estáveis no GTM, peça ao dev um atributo dedicado em vez de depender de classes CSS:

```html
<button data-analytics="btn-contratar-oferta">Contratar esta oferta</button>
```

## Nunca enviar
CPF, RG, nome, e-mail, telefone, endereço, número de cartão/conta ou qualquer dado que identifique a pessoa (LGPD).

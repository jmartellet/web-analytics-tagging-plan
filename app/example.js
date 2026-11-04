/*
 * Plano de exemplo: fluxo de simulação e contratação de empréstimo pessoal.
 * Os "prints" são wireframes em SVG apenas para ilustrar — no uso real, cole o print da tela.
 */
(function (root) {
  'use strict';

  function svg(title, blocks) {
    const items = blocks.map(b => {
      if (b.t === 'text') return `<text x="${b.x}" y="${b.y}" font-family="Arial" font-size="${b.s || 16}" fill="${b.c || '#1f2937'}" font-weight="${b.w || 400}">${b.v}</text>`;
      if (b.t === 'input') return `<rect x="${b.x}" y="${b.y}" width="${b.wd}" height="44" rx="8" fill="#fff" stroke="#cbd5e1"/><text x="${b.x + 14}" y="${b.y + 28}" font-family="Arial" font-size="14" fill="#94a3b8">${b.v}</text>`;
      if (b.t === 'btn') return `<rect x="${b.x}" y="${b.y}" width="${b.wd}" height="48" rx="24" fill="${b.bg || '#0f766e'}"/><text x="${b.x + b.wd / 2}" y="${b.y + 30}" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="${b.fg || '#fff'}">${b.v}</text>`;
      if (b.t === 'card') return `<rect x="${b.x}" y="${b.y}" width="${b.wd}" height="${b.h}" rx="12" fill="${b.bg || '#f1f5f9'}" stroke="#e2e8f0"/>`;
      return '';
    }).join('');
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560"><rect width="800" height="560" fill="#f8fafc"/><rect width="800" height="64" fill="#0f172a"/><text x="32" y="40" font-family="Arial" font-size="18" font-weight="700" fill="#fff">Banco Exemplo</text><text x="768" y="40" text-anchor="end" font-family="Arial" font-size="14" fill="#cbd5e1">${title}</text>${items}</svg>`;
    return 'data:image/svg+xml;base64,' + (typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64'));
  }

  const plan = {
    schemaVersion: '1.0',
    project: {
      name: 'Empréstimo pessoal — simulação e contratação',
      code: 'EMP-2026-01',
      squad: 'Squad Crédito PF',
      owner: 'Ana Souza (Analytics)',
      devOwner: 'Bruno Lima (Front-end)',
      platform: 'Web (desktop e mobile)',
      domain: 'https://www.exemplo.com.br/emprestimo',
      method: 'dataLayer',
      tools: ['Google Tag Manager', 'Google Analytics 4'],
      objective: 'Entender onde as pessoas abandonam o funil de simulação até a contratação do empréstimo e quais valores/prazos são mais simulados.',
      kpis: 'Taxa de conversão simulação → contratação; abandono por etapa; ticket médio simulado.',
      version: '1.0.0',
      status: 'Em homologação (QA)',
      dueDate: '2026-12-15',
      notes: 'Não enviar dados pessoais (CPF, nome, e-mail, telefone) em nenhum parâmetro — LGPD.'
    },
    globalParams: [
      { name: 'page_type', type: 'string', required: true, example: 'emprestimo_simulacao', source: 'Dinâmico - página/DOM', description: 'Tipo/template da página.' },
      { name: 'user_logged', type: 'boolean', required: true, example: 'true', source: 'Dinâmico - backend/API', description: 'Se a pessoa está autenticada.' },
      { name: 'customer_segment', type: 'string', required: false, example: 'varejo', source: 'Dinâmico - backend/API', description: 'Segmento do cliente (nunca dados pessoais).' }
    ],
    screens: [
      {
        id: 'scr_simulacao', name: '1. Simulação', url: '/emprestimo/simular',
        description: 'Pessoa informa valor e prazo e clica em Simular.',
        image: svg('/emprestimo/simular', [
          { t: 'text', x: 60, y: 120, v: 'Simule seu empréstimo', s: 28, w: 700 },
          { t: 'text', x: 60, y: 175, v: 'Quanto você precisa?', s: 14, c: '#475569' },
          { t: 'input', x: 60, y: 185, wd: 320, v: 'R$ 10.000,00' },
          { t: 'text', x: 420, y: 175, v: 'Em quantas parcelas?', s: 14, c: '#475569' },
          { t: 'input', x: 420, y: 185, wd: 320, v: '24 meses' },
          { t: 'btn', x: 60, y: 270, wd: 220, v: 'Simular' },
          { t: 'text', x: 320, y: 300, v: 'Dúvidas frequentes', s: 15, c: '#0f766e', w: 700 }
        ])
      },
      {
        id: 'scr_resultado', name: '2. Resultado da simulação', url: '/emprestimo/resultado',
        description: 'Exibe as ofertas calculadas. A pessoa escolhe uma oferta para contratar.',
        image: svg('/emprestimo/resultado', [
          { t: 'text', x: 60, y: 120, v: 'Escolha sua oferta', s: 28, w: 700 },
          { t: 'card', x: 60, y: 150, wd: 320, h: 230, bg: '#ecfeff' },
          { t: 'text', x: 84, y: 190, v: 'Oferta A', s: 18, w: 700 },
          { t: 'text', x: 84, y: 225, v: '24x de R$ 512,30', s: 16 },
          { t: 'text', x: 84, y: 255, v: 'Taxa 1,89% a.m.', s: 14, c: '#475569' },
          { t: 'btn', x: 84, y: 300, wd: 270, v: 'Contratar esta oferta' },
          { t: 'card', x: 420, y: 150, wd: 320, h: 230 },
          { t: 'text', x: 444, y: 190, v: 'Oferta B', s: 18, w: 700 },
          { t: 'text', x: 444, y: 225, v: '36x de R$ 389,90', s: 16 },
          { t: 'text', x: 444, y: 255, v: 'Taxa 1,99% a.m.', s: 14, c: '#475569' },
          { t: 'btn', x: 444, y: 300, wd: 270, v: 'Contratar esta oferta' },
          { t: 'text', x: 60, y: 430, v: 'Refazer simulação', s: 15, c: '#0f766e', w: 700 }
        ])
      },
      {
        id: 'scr_sucesso', name: '3. Contratação concluída', url: '/emprestimo/sucesso',
        description: 'Confirmação após assinatura do contrato.',
        image: svg('/emprestimo/sucesso', [
          { t: 'card', x: 200, y: 110, wd: 400, h: 330, bg: '#f0fdf4' },
          { t: 'text', x: 400, y: 200, v: 'Pronto! Empréstimo contratado', s: 22, w: 700 },
          { t: 'text', x: 400, y: 240, v: 'O valor cai na sua conta em até 1 dia útil.', s: 14, c: '#475569' },
          { t: 'btn', x: 290, y: 330, wd: 220, v: 'Ver comprovante' }
        ].map(b => b.t === 'text' ? Object.assign({}, b, { x: b.x - 150 }) : b))
      }
    ],
    events: [
      {
        id: 'ev_1', name: 'loan_simulation_start', status: 'Em homologação (QA)', priority: 'Alta', trigger: 'Clique',
        businessQuestion: 'Quantas pessoas iniciam uma simulação e com quais valores/prazos?',
        description: 'Dispara ao clicar no botão "Simular", somente se o formulário for válido.',
        screenId: 'scr_simulacao', marker: { x: 21, y: 52.5 },
        elementText: 'Simular', selector: '[data-analytics="btn-simular"]', isConversion: false,
        params: [
          { name: 'loan_amount', type: 'number', required: true, example: '10000', source: 'Dinâmico - input do usuário', description: 'Valor solicitado, sem máscara.' },
          { name: 'installments', type: 'number', required: true, example: '24', source: 'Dinâmico - input do usuário', description: 'Quantidade de parcelas.' }
        ],
        notes: ''
      },
      {
        id: 'ev_2', name: 'loan_offer_view', status: 'Em homologação (QA)', priority: 'Média', trigger: 'Visualização de elemento',
        businessQuestion: 'Quantas ofertas são exibidas por simulação?',
        description: 'Dispara uma vez quando a lista de ofertas termina de carregar.',
        screenId: 'scr_resultado', marker: { x: 50, y: 24 },
        elementText: 'Escolha sua oferta', selector: '#lista-ofertas', isConversion: false,
        params: [
          { name: 'offers_count', type: 'number', required: true, example: '2', source: 'Dinâmico - backend/API', description: 'Quantidade de ofertas exibidas.' }
        ],
        notes: ''
      },
      {
        id: 'ev_3', name: 'loan_offer_select', status: 'Em homologação (QA)', priority: 'Alta', trigger: 'Clique',
        businessQuestion: 'Qual oferta (prazo/taxa) as pessoas escolhem?',
        description: 'Dispara ao clicar em "Contratar esta oferta" em qualquer card.',
        screenId: 'scr_resultado', marker: { x: 27.5, y: 58 },
        elementText: 'Contratar esta oferta', selector: '[data-analytics="btn-contratar-oferta"]', isConversion: false,
        params: [
          { name: 'offer_id', type: 'string', required: true, example: 'oferta_a', source: 'Dinâmico - backend/API', description: 'Identificador da oferta.' },
          { name: 'offer_position', type: 'number', required: true, example: '1', source: 'Dinâmico - página/DOM', description: 'Posição do card (1 = primeiro).' },
          { name: 'installments', type: 'number', required: true, example: '24', source: 'Dinâmico - backend/API', description: 'Parcelas da oferta.' },
          { name: 'interest_rate', type: 'number', required: true, example: '1.89', source: 'Dinâmico - backend/API', description: 'Taxa mensal, ponto como separador.' }
        ],
        notes: ''
      },
      {
        id: 'ev_4', name: 'loan_contract_success', status: 'Em desenvolvimento', priority: 'Alta', trigger: 'Sucesso / conversão',
        businessQuestion: 'Quantas contratações acontecem e de que valor?',
        description: 'Dispara quando a tela de sucesso é carregada após a confirmação do backend. Não disparar em recarregamento da página.',
        screenId: 'scr_sucesso', marker: { x: 50, y: 36 },
        elementText: 'Pronto! Empréstimo contratado', selector: '', isConversion: true,
        params: [
          { name: 'value', type: 'currency', required: true, example: '10000.00', source: 'Dinâmico - backend/API', description: 'Valor contratado.' },
          { name: 'currency', type: 'string', required: true, example: 'BRL', source: 'Fixo (valor constante)', description: 'Moeda (ISO 4217).' },
          { name: 'transaction_id', type: 'string', required: true, example: 'ctr_8f2a91', source: 'Dinâmico - backend/API', description: 'ID interno do contrato (não é dado pessoal).' }
        ],
        notes: 'Marcar como evento-chave (conversão) no GA4.'
      }
    ],
    changelog: [
      { date: '2026-11-04', author: 'Ana Souza', change: 'Criação do plano.' }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = plan;
  else root.EXAMPLE_PLAN = plan;
})(this);

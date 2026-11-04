/*
 * Regras de validação do Plano de Tagueamento.
 * Compartilhado entre o navegador (index.html) e o validador de CI (scripts/validate.js).
 * Ajuste aqui as convenções da sua empresa.
 */
(function (root) {
  'use strict';

  const CONFIG = {
    // Convenção de nomenclatura: snake_case, começando por letra
    nameRegex: /^[a-z][a-z0-9_]*$/,
    maxEventNameLength: 40,   // limite do GA4
    maxParamNameLength: 40,   // limite do GA4
    maxParamValueLength: 100, // limite do GA4 (parâmetros de evento)
    maxParamsPerEvent: 25,    // limite do GA4
    // Prefixos e nomes reservados pelo GA4 (confira a documentação oficial antes de publicar)
    reservedPrefixes: ['_', 'firebase_', 'ga_', 'google_', 'gtag.'],
    reservedEventNames: [
      'ad_activeview', 'ad_click', 'ad_exposure', 'ad_query', 'ad_reward', 'adunit_exposure',
      'app_background', 'app_clear_data', 'app_exception', 'app_remove', 'app_store_refund',
      'app_update', 'app_upgrade', 'error', 'first_open', 'first_visit', 'notification_dismiss',
      'notification_foreground', 'notification_open', 'notification_receive', 'os_update',
      'screen_view', 'session_start', 'user_engagement'
    ],
    // Eventos recomendados do GA4 — sugeridos no autocompletar
    recommendedEvents: [
      'page_view', 'login', 'sign_up', 'search', 'select_content', 'select_item', 'share',
      'generate_lead', 'view_item', 'view_item_list', 'add_to_cart', 'remove_from_cart',
      'view_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info', 'purchase',
      'refund', 'view_promotion', 'select_promotion', 'form_start', 'form_submit',
      'file_download', 'video_start', 'video_complete', 'tutorial_begin', 'tutorial_complete'
    ],
    paramTypes: ['string', 'number', 'boolean', 'currency', 'array', 'object'],
    paramSources: ['Fixo (valor constante)', 'Dinâmico - página/DOM', 'Dinâmico - backend/API', 'Dinâmico - input do usuário', 'Dinâmico - dataLayer existente'],
    triggers: ['Clique', 'Visualização de página', 'Visualização de elemento', 'Envio de formulário', 'Interação com campo', 'Scroll', 'Erro exibido', 'Sucesso / conversão', 'Vídeo / mídia', 'Download', 'Outro'],
    statuses: ['Proposto', 'Aprovado', 'Em desenvolvimento', 'Em homologação (QA)', 'Publicado', 'Descontinuado'],
    priorities: ['Alta', 'Média', 'Baixa']
  };

  function checkName(kind, name, maxLen) {
    const out = [];
    if (!name) { out.push({ level: 'error', msg: `${kind} sem nome.` }); return out; }
    if (!CONFIG.nameRegex.test(name)) out.push({ level: 'error', msg: `"${name}": use snake_case (minúsculas, números e "_", começando por letra).` });
    if (name.length > maxLen) out.push({ level: 'error', msg: `"${name}" tem ${name.length} caracteres (máx. ${maxLen}).` });
    const pre = CONFIG.reservedPrefixes.find(p => name.startsWith(p));
    if (pre) out.push({ level: 'error', msg: `"${name}" usa o prefixo reservado "${pre}".` });
    return out;
  }

  function validateEvent(ev, plan) {
    const issues = [];
    issues.push(...checkName('Evento', ev.name, CONFIG.maxEventNameLength));
    if (ev.name && CONFIG.reservedEventNames.includes(ev.name)) issues.push({ level: 'error', msg: `"${ev.name}" é um nome reservado do GA4.` });
    const dup = (plan.events || []).filter(e => e.name && e.name === ev.name).length;
    if (dup > 1) issues.push({ level: 'warning', msg: `O nome "${ev.name}" aparece em ${dup} eventos. Diferencie pelo parâmetro ou renomeie.` });
    if (!ev.description) issues.push({ level: 'warning', msg: 'Descreva quando o evento deve disparar.' });
    if (!ev.businessQuestion) issues.push({ level: 'warning', msg: 'Informe a pergunta de negócio que o evento responde.' });
    if (!ev.screenId) issues.push({ level: 'warning', msg: 'Vincule o evento a uma tela (print).' });
    else if (!ev.marker) issues.push({ level: 'info', msg: 'Marque no print onde o evento acontece.' });

    const params = ev.params || [];
    const globals = (plan.globalParams || []).length;
    if (params.length + globals > CONFIG.maxParamsPerEvent) issues.push({ level: 'error', msg: `${params.length + globals} parâmetros (incluindo globais) — o máximo é ${CONFIG.maxParamsPerEvent}.` });
    const seen = new Set();
    params.forEach((p, i) => {
      const label = `Parâmetro ${i + 1}`;
      checkName(label, p.name, CONFIG.maxParamNameLength).forEach(x => issues.push(x));
      if (p.name && seen.has(p.name)) issues.push({ level: 'error', msg: `Parâmetro "${p.name}" duplicado.` });
      if (p.name) seen.add(p.name);
      if (p.name && (plan.globalParams || []).some(g => g.name === p.name)) issues.push({ level: 'warning', msg: `"${p.name}" já é um parâmetro global.` });
      if (p.name && !p.example) issues.push({ level: 'warning', msg: `Dê um exemplo de valor para "${p.name}".` });
      if (p.example && String(p.example).length > CONFIG.maxParamValueLength) issues.push({ level: 'warning', msg: `Exemplo de "${p.name}" passa de ${CONFIG.maxParamValueLength} caracteres.` });
    });
    return issues;
  }

  function validatePlan(plan) {
    const result = { project: [], globals: [], events: {} };
    const p = plan.project || {};
    if (!p.name) result.project.push({ level: 'error', msg: 'Informe o nome do projeto.' });
    if (!p.owner) result.project.push({ level: 'warning', msg: 'Informe a pessoa responsável (negócio/analytics).' });
    if (!p.objective) result.project.push({ level: 'warning', msg: 'Descreva o objetivo de negócio da iniciativa.' });
    (plan.globalParams || []).forEach((g, i) => {
      result.globals.push(...checkName(`Parâmetro global ${i + 1}`, g.name, CONFIG.maxParamNameLength));
    });
    (plan.events || []).forEach(ev => { result.events[ev.id] = validateEvent(ev, plan); });
    return result;
  }

  function countIssues(res) {
    const all = [...res.project, ...res.globals, ...Object.values(res.events).flat()];
    return {
      error: all.filter(i => i.level === 'error').length,
      warning: all.filter(i => i.level === 'warning').length,
      info: all.filter(i => i.level === 'info').length
    };
  }

  const api = { CONFIG, validateEvent, validatePlan, countIssues };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TaggingRules = api;
})(this);

/* Plano de Tagueamento — Web Analytics
 * Aplicação estática (sem build). Estado em localStorage; exporta JSON, HTML, Markdown (.zip), CSV e código.
 */
(function () {
  'use strict';

  const R = window.TaggingRules;
  const C = R.CONFIG;
  const STORAGE_KEY = 'wa-tagging-plan-v1';
  const SCHEMA_VERSION = '1.0';
  const TOOLS = ['Google Tag Manager', 'Google Analytics 4', 'Adobe Analytics', 'Adobe Launch / Tags', 'Tealium', 'Meta Pixel', 'Outra'];
  const METHODS = { dataLayer: 'dataLayer.push (GTM)', gtag: 'gtag() direto', adobe: 'adobeDataLayer.push (Adobe)' };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);
  const today = () => new Date().toISOString().slice(0, 10);
  const num = i => 'E' + String(i + 1).padStart(2, '0');
  const slug = s => (s || 'plano').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plano';

  // ---------- Estado ----------
  function blankPlan() {
    return {
      schemaVersion: SCHEMA_VERSION,
      project: { name: '', code: '', squad: '', owner: '', devOwner: '', platform: 'Web', domain: '', method: 'dataLayer', tools: ['Google Tag Manager', 'Google Analytics 4'], objective: '', kpis: '', version: '1.0.0', status: 'Proposto', dueDate: '', notes: '' },
      globalParams: [],
      screens: [],
      events: [],
      changelog: [{ date: today(), author: '', change: 'Criação do plano.' }]
    };
  }
  function blankParam() { return { name: '', type: 'string', required: true, example: '', source: C.paramSources[1], description: '' }; }
  function blankEvent() {
    return { id: uid('ev'), name: '', status: 'Proposto', priority: 'Média', trigger: 'Clique', businessQuestion: '', description: '', screenId: '', marker: null, elementText: '', selector: '', isConversion: false, params: [], notes: '' };
  }
  function normalize(p) {
    const b = blankPlan();
    p = p || {};
    const plan = {
      schemaVersion: SCHEMA_VERSION,
      project: Object.assign({}, b.project, p.project || {}),
      globalParams: (p.globalParams || []).map(x => Object.assign(blankParam(), x)),
      screens: (p.screens || []).map(s => Object.assign({ id: uid('scr'), name: '', url: '', description: '', image: '' }, s)),
      events: (p.events || []).map(e => Object.assign(blankEvent(), e, { params: (e.params || []).map(x => Object.assign(blankParam(), x)) })),
      changelog: p.changelog || []
    };
    if (!Array.isArray(plan.project.tools)) plan.project.tools = [];
    return plan;
  }

  let plan = load();
  const openEvents = new Set();
  let focusedScreen = null;
  let markerTarget = null;

  function load() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) { /* sem storage */ }
    return blankPlan();
  }
  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const el = $('#saveState');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
        el.textContent = 'salvo neste navegador'; el.classList.remove('bad');
      } catch (e) {
        el.textContent = 'não coube no navegador — use “Salvar JSON”'; el.classList.add('bad');
      }
    }, 300);
  }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }

  function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function setPath(obj, path, value) {
    const keys = path.split('.'); const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], obj); target[last] = value;
  }

  // ---------- Componentes ----------
  const opts = (list, cur) => list.map(o => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('');

  function field(label, path, type = 'text', extra = {}) {
    const v = getPath(plan, path) || '';
    const cls = extra.wide ? 'f wide' : 'f';
    let input;
    if (type === 'textarea') input = `<textarea data-path="${path}" placeholder="${esc(extra.ph || '')}">${esc(v)}</textarea>`;
    else if (type === 'select') input = `<select data-path="${path}">${extra.options.map(o => typeof o === 'string' ? `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>` : `<option value="${esc(o[0])}" ${o[0] === v ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    else input = `<input type="${type}" data-path="${path}" value="${esc(v)}" placeholder="${esc(extra.ph || '')}" ${extra.list ? `list="${extra.list}"` : ''} class="${extra.code ? 'code' : ''}">`;
    return `<label class="${cls}">${esc(label)}${input}</label>`;
  }

  function paramTable(params, base, allowEmptyText) {
    if (!params.length) return `<div class="muted" style="color:var(--muted);font-size:13px;padding:6px 0">${allowEmptyText}</div>`;
    return `<div class="table-wrap"><table class="params"><thead><tr>
      <th style="width:18%">Nome</th><th style="width:10%">Tipo</th><th style="width:6%">Obrig.</th><th style="width:15%">Exemplo de valor</th><th style="width:18%">Origem do valor</th><th>Descrição / regra</th><th style="width:36px"></th></tr></thead><tbody>
      ${params.map((p, i) => `<tr>
        <td><input type="text" class="code" data-path="${base}.${i}.name" value="${esc(p.name)}" placeholder="ex.: offer_id"></td>
        <td><select data-path="${base}.${i}.type">${opts(C.paramTypes, p.type)}</select></td>
        <td class="c"><input type="checkbox" data-path="${base}.${i}.required" ${p.required ? 'checked' : ''} aria-label="Obrigatório"></td>
        <td><input type="text" class="code" data-path="${base}.${i}.example" value="${esc(p.example)}" placeholder="ex.: oferta_a"></td>
        <td><select data-path="${base}.${i}.source">${opts(C.paramSources, p.source)}</select></td>
        <td><input type="text" data-path="${base}.${i}.description" value="${esc(p.description)}" placeholder="O que é, formato, de onde vem"></td>
        <td class="c"><button class="btn small danger" data-action="del-param" data-base="${base}" data-i="${i}" title="Remover parâmetro">✕</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function issuesList(list) { return list.map(i => `<li class="${i.level}">${esc(i.msg)}</li>`).join(''); }

  // ---------- 1. Projeto ----------
  function renderProject() {
    const p = 'project.';
    $('#projectForm').innerHTML = [
      field('Nome da iniciativa *', p + 'name', 'text', { ph: 'Ex.: Novo fluxo de simulação de empréstimo' }),
      field('Código / ticket', p + 'code', 'text', { ph: 'Ex.: JIRA-1234' }),
      field('Squad / área', p + 'squad'),
      field('Responsável (negócio / analytics) *', p + 'owner'),
      field('Responsável técnico (dev)', p + 'devOwner'),
      field('Plataforma', p + 'platform', 'select', { options: ['Web', 'Web (desktop e mobile)', 'Web mobile', 'App (WebView)', 'Outra'] }),
      field('Domínio / URL base', p + 'domain', 'url', { ph: 'https://www.seusite.com.br' }),
      field('Método de implementação', p + 'method', 'select', { options: Object.entries(METHODS) }),
      field('Status do plano', p + 'status', 'select', { options: C.statuses }),
      field('Versão do plano', p + 'version', 'text', { ph: '1.0.0' }),
      field('Data prevista de publicação', p + 'dueDate', 'date'),
      `<label class="f wide">Ferramentas<div class="checks">${TOOLS.map(t => `<label><input type="checkbox" data-arr="project.tools" data-val="${esc(t)}" ${plan.project.tools.includes(t) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div></label>`,
      field('Objetivo de negócio *', p + 'objective', 'textarea', { wide: true, ph: 'Qual decisão estes dados vão apoiar?' }),
      field('KPIs / métricas de sucesso', p + 'kpis', 'textarea', { wide: true, ph: 'Ex.: taxa de conversão por etapa, abandono, ticket médio' }),
      field('Observações para o time (privacidade, consentimento, exceções)', p + 'notes', 'textarea', { wide: true, ph: 'Ex.: não enviar CPF, e-mail ou nome em nenhum parâmetro (LGPD)' })
    ].join('');
    renderGlobals();
    renderChangelog();
  }
  function renderGlobals() {
    $('#globalParams').innerHTML = paramTable(plan.globalParams, 'globalParams', 'Nenhum parâmetro global. Exemplos comuns: page_type, user_logged, site_section, environment.');
    refreshGlobalIssues();
  }
  function refreshGlobalIssues() { const res = R.validatePlan(plan); $('#globalIssues').innerHTML = issuesList([...res.project, ...res.globals]); }
  function renderChangelog() {
    const rows = plan.changelog.map((c, i) => `<tr>
      <td style="width:150px"><input type="date" data-path="changelog.${i}.date" value="${esc(c.date)}"></td>
      <td style="width:200px"><input type="text" data-path="changelog.${i}.author" value="${esc(c.author)}" placeholder="Quem"></td>
      <td><input type="text" data-path="changelog.${i}.change" value="${esc(c.change)}" placeholder="O que mudou"></td>
      <td class="c" style="width:36px"><button class="btn small danger" data-action="del-log" data-i="${i}" title="Remover">✕</button></td></tr>`).join('');
    $('#changelog').innerHTML = plan.changelog.length ? `<div class="table-wrap"><table class="params" style="min-width:600px"><thead><tr><th>Data</th><th>Autor</th><th>Alteração</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div style="color:var(--muted);font-size:13px">Sem registros.</div>';
  }

  // ---------- 2. Telas ----------
  function markersFor(screenId, cls = 'marker') {
    return plan.events.map((e, i) => ({ e, i })).filter(x => x.e.screenId === screenId && x.e.marker)
      .map(x => `<span class="${cls}" style="left:${x.e.marker.x}%;top:${x.e.marker.y}%" data-goto="${x.e.id}" title="${esc(num(x.i) + ' · ' + (x.e.name || 'sem nome'))}">${num(x.i)}</span>`).join('');
  }
  function shotHTML(s) {
    if (!s.image) return `<div class="shot" data-drop="${s.id}" tabindex="0"><div>Cole (Ctrl+V), arraste ou <u>clique</u> para adicionar o print<br><small>PNG, JPG, SVG ou WebP</small></div></div>`;
    return `<div class="shot has-img" data-drop="${s.id}" tabindex="0"><img src="${s.image}" alt="${esc(s.name)}">${markersFor(s.id)}</div>`;
  }
  function renderScreens() {
    const el = $('#screens');
    if (!plan.screens.length) { el.innerHTML = '<div class="empty" style="grid-column:1/-1">Nenhuma tela ainda. Clique em “+ Nova tela” ou cole um print aqui com Ctrl+V.</div>'; return; }
    el.innerHTML = plan.screens.map((s, i) => {
      const evs = plan.events.map((e, k) => ({ e, k })).filter(x => x.e.screenId === s.id);
      return `<div class="card" style="margin:0">
        <div class="grid" style="grid-template-columns:1fr 1fr;margin-bottom:10px">
          <label class="f">Nome da tela / etapa<input type="text" data-path="screens.${i}.name" value="${esc(s.name)}" placeholder="Ex.: 1. Simulação"></label>
          <label class="f">URL / rota<input type="text" class="code" data-path="screens.${i}.url" value="${esc(s.url)}" placeholder="/caminho/da-pagina"></label>
          <label class="f wide">Descrição / contexto<input type="text" data-path="screens.${i}.description" value="${esc(s.description)}" placeholder="O que a pessoa faz nesta tela"></label>
        </div>
        ${shotHTML(s)}
        <div class="row" style="margin-top:10px">
          <span style="color:var(--muted);font-size:12px">${evs.length ? 'Eventos: ' + evs.map(x => `<a href="#" data-goto="${x.e.id}">${num(x.k)} ${esc(x.e.name || '(sem nome)')}</a>`).join(', ') : 'Nenhum evento vinculado'}</span>
          <span class="spacer"></span>
          <button class="btn small" data-action="add-event-screen" data-id="${s.id}">+ Evento nesta tela</button>
          ${s.image ? `<button class="btn small" data-action="replace-img" data-id="${s.id}">Trocar print</button>` : ''}
          <button class="btn small" data-action="move-screen" data-i="${i}" data-dir="-1" title="Mover para cima" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn small" data-action="move-screen" data-i="${i}" data-dir="1" title="Mover para baixo" ${i === plan.screens.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn small danger" data-action="del-screen" data-i="${i}">Excluir</button>
        </div>
      </div>`;
    }).join('');
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Arquivo não é imagem'));
      const fr = new FileReader();
      fr.onload = () => {
        const original = fr.result;
        if (file.type === 'image/svg+xml') return resolve(original);
        const img = new Image();
        img.onload = () => {
          const maxW = 1600; const scale = Math.min(1, maxW / img.naturalWidth);
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.naturalWidth * scale); cv.height = Math.round(img.naturalHeight * scale);
          const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
          const jpg = cv.toDataURL('image/jpeg', 0.85);
          resolve(jpg.length < original.length ? jpg : original);
        };
        img.onerror = () => resolve(original);
        img.src = original;
      };
      fr.onerror = reject; fr.readAsDataURL(file);
    });
  }
  async function setScreenImage(screenId, file) {
    try {
      const data = await readImage(file);
      const s = plan.screens.find(x => x.id === screenId); if (!s) return;
      s.image = data; save(); renderScreens(); renderEvents(); toast('Print adicionado');
    } catch (e) { toast('Não foi possível ler a imagem'); }
  }
  function pickImage(screenId) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => inp.files[0] && setScreenImage(screenId, inp.files[0]);
    inp.click();
  }
  function addScreen(image) {
    const s = { id: uid('scr'), name: `${plan.screens.length + 1}. `, url: '', description: '', image: image || '' };
    plan.screens.push(s); focusedScreen = s.id; save(); renderAll(); return s;
  }

  // ---------- 3. Eventos ----------
  function evIssues(ev) { return R.validateEvent(ev, plan); }
  function statusPill(list) {
    const e = list.filter(x => x.level === 'error').length, w = list.filter(x => x.level === 'warning').length;
    if (e) return `<span class="pill err">${e} erro${e > 1 ? 's' : ''}</span>`;
    if (w) return `<span class="pill warn">${w} alerta${w > 1 ? 's' : ''}</span>`;
    return '<span class="pill ok">ok</span>';
  }
  function summaryHTML(ev, i) {
    const scr = plan.screens.find(s => s.id === ev.screenId);
    return `<span class="ev-num">${num(i)}</span><span class="ev-name">${esc(ev.name || '(sem nome)')}</span>
      <span class="pill">${esc(ev.trigger)}</span>${ev.isConversion ? '<span class="pill ok">conversão</span>' : ''}
      <span class="pill">${esc(scr ? scr.name : 'sem tela')}</span><span class="pill">${esc(ev.status)}</span>
      <span class="spacer"></span>${statusPill(evIssues(ev))}`;
  }
  function eventThumb(ev) {
    const s = plan.screens.find(x => x.id === ev.screenId);
    if (!s) return '<div style="color:var(--muted);font-size:13px">Escolha a tela para marcar onde o evento acontece.</div>';
    if (!s.image) return '<div style="color:var(--muted);font-size:13px">Esta tela ainda não tem print. Adicione na aba “Telas e prints”.</div>';
    const i = plan.events.indexOf(ev);
    const mk = ev.marker ? `<span class="marker" style="left:${ev.marker.x}%;top:${ev.marker.y}%">${num(i)}</span>` : '';
    return `<div class="shot has-img thumb" data-action="open-marker" data-id="${ev.id}" style="cursor:pointer" title="Clique para marcar"><img src="${s.image}" alt="">${mk}</div>`;
  }
  function eventCard(ev, i) {
    const b = `events.${i}`;
    return `<details class="event" data-ev="${ev.id}" ${openEvents.has(ev.id) ? 'open' : ''}>
      <summary>${summaryHTML(ev, i)}</summary>
      <div class="ev-body">
        <div class="grid">
          ${field('Nome do evento *', b + '.name', 'text', { ph: 'ex.: loan_offer_select', list: 'recommendedEvents', code: true })}
          ${field('Gatilho', b + '.trigger', 'select', { options: C.triggers })}
          ${field('Status', b + '.status', 'select', { options: C.statuses })}
          ${field('Prioridade', b + '.priority', 'select', { options: C.priorities })}
          ${field('Pergunta de negócio que responde *', b + '.businessQuestion', 'textarea', { wide: true, ph: 'Ex.: Qual oferta as pessoas escolhem com mais frequência?' })}
          ${field('Quando deve disparar (regra para o dev) *', b + '.description', 'textarea', { wide: true, ph: 'Ex.: Ao clicar em "Contratar", somente após validação do formulário. Não disparar em recarregamento.' })}
        </div>
        <div class="grid two">
          <div>
            <p class="sub">Onde acontece</p>
            <div class="grid" style="grid-template-columns:1fr">
              <label class="f">Tela<select data-path="${b}.screenId" data-structural="1"><option value="">— selecione —</option>${plan.screens.map(s => `<option value="${s.id}" ${s.id === ev.screenId ? 'selected' : ''}>${esc(s.name || '(tela sem nome)')}</option>`).join('')}</select></label>
              ${field('Texto visível do elemento', b + '.elementText', 'text', { ph: 'Ex.: Contratar esta oferta' })}
              ${field('Seletor / atributo sugerido', b + '.selector', 'text', { ph: `[data-analytics="${ev.name || 'nome_do_evento'}"]`, code: true })}
              <label class="row" style="font-size:14px"><input type="checkbox" data-path="${b}.isConversion" ${ev.isConversion ? 'checked' : ''}> É conversão / evento-chave</label>
            </div>
          </div>
          <div><p class="sub">Marcação no print</p><div data-thumb>${eventThumb(ev)}</div>
            ${ev.screenId ? `<div class="row" style="margin-top:6px"><button class="btn small" data-action="open-marker" data-id="${ev.id}">${ev.marker ? 'Ajustar marcação' : 'Marcar no print'}</button></div>` : ''}
          </div>
        </div>
        <div>
          <div class="row" style="margin-bottom:6px"><p class="sub" style="margin:0">Parâmetros do evento</p><span class="spacer"></span><button class="btn small" data-action="add-param" data-base="${b}.params">+ Parâmetro</button></div>
          ${paramTable(ev.params, b + '.params', 'Sem parâmetros específicos. Os parâmetros globais são enviados automaticamente.')}
        </div>
        ${field('Observações (exceções, dependências, regras de deduplicação)', b + '.notes', 'textarea', { wide: true })}
        <ul class="issues" data-issues>${issuesList(evIssues(ev))}</ul>
        <div>
          <div class="code-head"><p class="sub" style="margin:0">Código sugerido para o dev · ${esc(METHODS[plan.project.method] || '')}</p><button class="btn small" data-action="copy-code" data-id="${ev.id}">Copiar</button></div>
          <pre class="code" data-code>${esc(genCode(ev))}</pre>
        </div>
        <div class="row"><span class="spacer"></span>
          <button class="btn small" data-action="move-event" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑ Subir</button>
          <button class="btn small" data-action="move-event" data-i="${i}" data-dir="1" ${i === plan.events.length - 1 ? 'disabled' : ''}>↓ Descer</button>
          <button class="btn small" data-action="dup-event" data-i="${i}">Duplicar</button>
          <button class="btn small danger" data-action="del-event" data-i="${i}">Excluir evento</button>
        </div>
      </div>
    </details>`;
  }
  function renderEvents() {
    const el = $('#events');
    el.innerHTML = (plan.events.length ? plan.events.map(eventCard).join('') : '<div class="empty">Nenhum evento ainda. Clique em “+ Novo evento”.</div>')
      + `<datalist id="recommendedEvents">${C.recommendedEvents.map(n => `<option value="${n}">`).join('')}</datalist>`;
    updateCounts();
  }
  function refreshEventCard(evId) {
    const i = plan.events.findIndex(e => e.id === evId); if (i < 0) return;
    const ev = plan.events[i]; const card = $(`details[data-ev="${evId}"]`); if (!card) return;
    card.querySelector('summary').innerHTML = summaryHTML(ev, i);
    card.querySelector('[data-issues]').innerHTML = issuesList(evIssues(ev));
    card.querySelector('[data-code]').textContent = genCode(ev);
  }
  function updateCounts() { $('#cntScreens').textContent = plan.screens.length; $('#cntEvents').textContent = plan.events.length; }

  // ---------- Geração de código ----------
  function sampleValue(p) {
    const ex = p.example;
    switch (p.type) {
      case 'number': case 'currency': return ex !== '' && !isNaN(Number(ex)) ? String(Number(ex)) : '0';
      case 'boolean': return /^(true|sim|1)$/i.test(ex) ? 'true' : 'false';
      case 'array': return ex && ex.trim().startsWith('[') ? ex : '[]';
      case 'object': return ex && ex.trim().startsWith('{') ? ex : '{}';
      default: return `'${String(ex || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }
  }
  function paramLines(params, indent) {
    const valid = params.filter(p => p.name);
    const w = Math.max(0, ...valid.map(p => (p.name + ': ' + sampleValue(p) + ',').length));
    return valid.map(p => {
      const line = `${p.name}: ${sampleValue(p)},`;
      const cmt = [p.type, p.required ? 'obrigatório' : 'opcional', p.description].filter(Boolean).join(' · ');
      return `${indent}${line.padEnd(w)}  // ${cmt}`;
    });
  }
  function genCode(ev) {
    const name = ev.name || 'nome_do_evento';
    const head = `// ${ev.description ? ev.description.replace(/\s+/g, ' ') : 'Descreva quando o evento dispara.'}`;
    const lines = paramLines(ev.params, '  ');
    const globals = plan.globalParams.filter(g => g.name).map(g => g.name);
    const gNote = globals.length ? `\n// Parâmetros globais (${globals.join(', ')}) devem estar no dataLayer/config da página.` : '';
    const m = plan.project.method;
    if (m === 'gtag') return `${head}${gNote}\ngtag('event', '${name}', {\n${lines.join('\n')}\n});`;
    if (m === 'adobe') return `${head}${gNote}\nwindow.adobeDataLayer = window.adobeDataLayer || [];\nwindow.adobeDataLayer.push({\n  event: '${name}',\n  eventInfo: {\n${paramLines(ev.params, '    ').join('\n')}\n  }\n});`;
    return `${head}${gNote}\nwindow.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({\n  event: '${name}',\n${lines.join('\n')}\n});`;
  }
  function genFullCode() {
    const p = plan.project;
    const hdr = `/**\n * Plano de tagueamento: ${p.name || '(sem nome)'} — v${p.version || ''}\n * Gerado em ${today()} · Método: ${METHODS[p.method]}\n * Os valores abaixo são EXEMPLOS: substitua pelos valores reais em tempo de execução.\n */\n`;
    const glob = plan.globalParams.filter(g => g.name).length
      ? `\n// ===== Parâmetros globais (enviar no carregamento de cada página) =====\nwindow.dataLayer = window.dataLayer || [];\nwindow.dataLayer.push({\n${paramLines(plan.globalParams, '  ').join('\n')}\n});\n` : '';
    const evs = plan.events.map((e, i) => {
      const scr = plan.screens.find(s => s.id === e.screenId);
      return `\n// ===== ${num(i)} · ${e.name || '(sem nome)'} =====\n// Tela: ${scr ? scr.name + (scr.url ? ' (' + scr.url + ')' : '') : '—'} · Gatilho: ${e.trigger}${e.selector ? ' · Elemento: ' + e.selector : ''}\n${genCode(e)}\n`;
    }).join('');
    return hdr + glob + evs;
  }

  // ---------- Marcação no print ----------
  function openMarker(evId) {
    const ev = plan.events.find(e => e.id === evId); if (!ev) return;
    const s = plan.screens.find(x => x.id === ev.screenId);
    if (!s || !s.image) { toast('Adicione o print desta tela primeiro'); return; }
    markerTarget = ev.id;
    const i = plan.events.indexOf(ev);
    $('#markerTitle').textContent = `${num(i)} · ${ev.name || '(sem nome)'} — ${s.name}`;
    drawMarkerShot();
    $('#markerDialog').showModal();
  }
  function drawMarkerShot() {
    const ev = plan.events.find(e => e.id === markerTarget); const s = plan.screens.find(x => x.id === ev.screenId);
    const others = plan.events.map((e, i) => ({ e, i })).filter(x => x.e.screenId === s.id && x.e.marker && x.e.id !== ev.id)
      .map(x => `<span class="marker" style="left:${x.e.marker.x}%;top:${x.e.marker.y}%;opacity:.45;pointer-events:none">${num(x.i)}</span>`).join('');
    const mine = ev.marker ? `<span class="marker" style="left:${ev.marker.x}%;top:${ev.marker.y}%;pointer-events:none">${num(plan.events.indexOf(ev))}</span>` : '';
    $('#markerShot').innerHTML = `<img src="${s.image}" alt="">${others}${mine}`;
  }
  $('#markerShot').addEventListener('click', e => {
    const img = $('#markerShot img'); if (!img) return;
    const r = img.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100, y = ((e.clientY - r.top) / r.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    const ev = plan.events.find(v => v.id === markerTarget);
    ev.marker = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    save(); drawMarkerShot(); afterMarkerChange(ev);
  });
  function afterMarkerChange(ev) {
    const card = $(`details[data-ev="${ev.id}"]`);
    if (card) card.querySelector('[data-thumb]').innerHTML = eventThumb(ev);
    refreshEventCard(ev.id); renderScreens();
  }
  $('#btnCloseMarker').onclick = () => $('#markerDialog').close();
  $('#btnClearMarker').onclick = () => { const ev = plan.events.find(v => v.id === markerTarget); if (ev) { ev.marker = null; save(); drawMarkerShot(); afterMarkerChange(ev); } };

  // ---------- 4. Documento ----------
  function docHTML() {
    const p = plan.project; const res = R.validatePlan(plan); const cnt = R.countIssues(res);
    const kv = rows => `<table class="kv">${rows.filter(r => r[1]).map(r => `<tr><th>${esc(r[0])}</th><td>${r[2] ? r[1] : esc(r[1]).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
    const pTable = params => params.filter(x => x.name).length ? `<table><thead><tr><th>Parâmetro</th><th>Tipo</th><th>Obrig.</th><th>Exemplo</th><th>Origem</th><th>Descrição / regra</th></tr></thead><tbody>${params.filter(x => x.name).map(x => `<tr><td><code>${esc(x.name)}</code></td><td>${esc(x.type)}</td><td>${x.required ? 'Sim' : 'Não'}</td><td><code>${esc(x.example)}</code></td><td>${esc(x.source)}</td><td>${esc(x.description)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Sem parâmetros específicos.</p>';
    const scrName = id => { const s = plan.screens.find(x => x.id === id); return s ? s.name : '—'; };

    let h = `<div class="doc">
      <h1>${esc(p.name || 'Plano de tagueamento (sem nome)')}</h1>
      <div class="meta">Plano de tagueamento · v${esc(p.version)} · ${esc(p.status)}${p.code ? ' · ' + esc(p.code) : ''} · atualizado em ${today()}</div>
      ${p.notes ? `<div class="note"><strong>Atenção:</strong> ${esc(p.notes).replace(/\n/g, '<br>')}</div>` : ''}
      <h2>1. Resumo da iniciativa</h2>
      ${kv([['Objetivo de negócio', p.objective], ['KPIs / métricas', p.kpis], ['Squad / área', p.squad], ['Responsável (negócio/analytics)', p.owner], ['Responsável técnico', p.devOwner], ['Plataforma', p.platform], ['Domínio', p.domain], ['Ferramentas', (p.tools || []).join(', ')], ['Método de implementação', METHODS[p.method]], ['Publicação prevista', p.dueDate]])}
      <h2>2. Visão geral dos eventos</h2>
      ${plan.events.length ? `<table><thead><tr><th>#</th><th>Evento</th><th>Tela</th><th>Gatilho</th><th>Conversão</th><th>Prioridade</th><th>Status</th></tr></thead><tbody>${plan.events.map((e, i) => `<tr><td>${num(i)}</td><td><code>${esc(e.name || '(sem nome)')}</code></td><td>${esc(scrName(e.screenId))}</td><td>${esc(e.trigger)}</td><td>${e.isConversion ? 'Sim' : '—'}</td><td>${esc(e.priority)}</td><td>${esc(e.status)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nenhum evento cadastrado.</p>'}
      <h2>3. Parâmetros globais</h2>
      <p class="muted">Enviados em todas as páginas/eventos desta iniciativa.</p>
      ${pTable(plan.globalParams)}
      <h2>4. Fluxo de telas</h2>`;
    if (!plan.screens.length) h += '<p class="muted">Nenhuma tela cadastrada.</p>';
    plan.screens.forEach(s => {
      const evs = plan.events.map((e, i) => ({ e, i })).filter(x => x.e.screenId === s.id);
      h += `<div class="screen-block"><h3>${esc(s.name || '(tela sem nome)')}${s.url ? ` <code>${esc(s.url)}</code>` : ''}</h3>
        ${s.description ? `<p>${esc(s.description)}</p>` : ''}
        ${s.image ? `<div class="shot-doc"><img src="${s.image}" alt="${esc(s.name)}">${markersFor(s.id, 'mk')}</div>` : '<p class="muted">(sem print)</p>'}
        ${evs.length ? `<p><strong>Eventos nesta tela:</strong> ${evs.map(x => `<code>${num(x.i)}</code> ${esc(x.e.name || '(sem nome)')}`).join(' · ')}</p>` : ''}</div>`;
    });
    h += '<h2>5. Especificação dos eventos</h2>';
    plan.events.forEach((e, i) => {
      const s = plan.screens.find(x => x.id === e.screenId);
      const issues = res.events[e.id] || [];
      h += `<div class="event-block">
        <h3><span class="mk" style="position:static;transform:none;display:inline-block;margin-right:6px">${num(i)}</span><code>${esc(e.name || '(sem nome)')}</code> ${e.isConversion ? '<span class="tag conv">conversão</span>' : ''}<span class="tag">${esc(e.priority)}</span><span class="tag">${esc(e.status)}</span></h3>
        ${kv([['Pergunta de negócio', e.businessQuestion], ['Quando dispara', e.description], ['Gatilho', e.trigger], ['Tela', s ? s.name + (s.url ? ' — ' + s.url : '') : ''], ['Texto do elemento', e.elementText], ['Seletor / atributo', e.selector ? `<code>${esc(e.selector)}</code>` : '', true], ['Observações', e.notes]])}
        ${s && s.image && e.marker ? `<div class="shot-doc" style="max-width:520px"><img src="${s.image}" alt=""><span class="mk" style="left:${e.marker.x}%;top:${e.marker.y}%">${num(i)}</span></div>` : ''}
        <strong>Parâmetros</strong>${pTable(e.params)}
        <strong>Código sugerido</strong><pre>${esc(genCode(e))}</pre>
        <strong>Critérios de aceite (QA)</strong><ul class="qa">${qaCriteria(e).map(c => `<li>☐ ${c}</li>`).join('')}</ul>
        ${issues.filter(x => x.level !== 'info').length ? `<div class="note"><strong>Pendências:</strong> ${issues.filter(x => x.level !== 'info').map(x => esc(x.msg)).join(' · ')}</div>` : ''}
      </div>`;
    });
    if (!plan.events.length) h += '<p class="muted">Nenhum evento cadastrado.</p>';
    h += `<h2>6. Checklist geral de homologação</h2><ul class="qa">${[
      'Nenhum parâmetro envia dados pessoais (CPF, nome, e-mail, telefone, endereço) — LGPD.',
      'Os eventos só disparam após o consentimento exigido pela política de cookies.',
      'Nenhum evento dispara em duplicidade (recarregar a página, voltar no navegador, cliques repetidos).',
      'Parâmetros globais presentes em todas as páginas do fluxo.',
      ...(p.tools || []).includes('Google Tag Manager') ? ['Validado no modo de visualização (Preview) do GTM.'] : [],
      ...(p.tools || []).includes('Google Analytics 4') ? ['Eventos e parâmetros conferidos no DebugView do GA4; dimensões personalizadas criadas para os parâmetros usados em relatórios.'] : [],
      'Testado em desktop e mobile, nos navegadores suportados.'
    ].map(c => `<li>☐ ${esc(c)}</li>`).join('')}</ul>`;
    h += `<h2>7. Status de validação do plano</h2><p>${cnt.error} erro(s) · ${cnt.warning} alerta(s) · ${cnt.info} sugestão(ões).</p>`;
    const pend = [...res.project, ...res.globals].filter(x => x.level !== 'info');
    if (pend.length) h += `<ul>${pend.map(x => `<li>${esc(x.msg)}</li>`).join('')}</ul>`;
    if (plan.changelog.length) h += `<h2>8. Histórico de alterações</h2><table><thead><tr><th>Data</th><th>Autor</th><th>Alteração</th></tr></thead><tbody>${plan.changelog.map(c => `<tr><td>${esc(c.date)}</td><td>${esc(c.author)}</td><td>${esc(c.change)}</td></tr>`).join('')}</tbody></table>`;
    return h + '</div>';
  }
  function qaCriteria(e) {
    const out = [`O evento <code>${esc(e.name || '?')}</code> é enviado <strong>uma única vez</strong> no momento descrito em “Quando dispara”.`];
    e.params.filter(p => p.name).forEach(p => out.push(`<code>${esc(p.name)}</code> ${p.required ? 'está sempre presente' : 'aparece quando aplicável'}, do tipo <em>${esc(p.type)}</em>${p.example ? ` (ex.: <code>${esc(p.example)}</code>)` : ''}.`));
    if (e.selector) out.push(`O elemento possui o seletor/atributo <code>${esc(e.selector)}</code>.`);
    if (e.isConversion) out.push('O evento está marcado como evento-chave/conversão na ferramenta.');
    return out;
  }
  function renderDoc() {
    const res = R.validatePlan(plan); const c = R.countIssues(res);
    $('#summaryBar').innerHTML = `<span class="pill">${plan.screens.length} tela(s)</span><span class="pill">${plan.events.length} evento(s)</span>
      <span class="pill ${c.error ? 'err' : 'ok'}">${c.error} erro(s)</span><span class="pill ${c.warning ? 'warn' : 'ok'}">${c.warning} alerta(s)</span>`;
    $('#docView').innerHTML = docHTML();
  }

  // ---------- Exportações ----------
  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const baseName = () => `${slug(plan.project.name)}-v${(plan.project.version || '1').replace(/[^0-9a-z.]/gi, '')}`;

  function exportHtml() {
    const css = $('#doc-css').textContent;
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(plan.project.name || 'Plano de tagueamento')}</title><style>body{margin:0;background:#f6f7f9;padding:24px}.doc{max-width:1000px;margin:0 auto}${css}</style></head><body>${docHTML()}</body></html>`;
    download(baseName() + '.html', html, 'text/html;charset=utf-8');
  }
  function csvCell(v) { const s = String(v == null ? '' : v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
  function exportCsv() {
    const head = ['numero', 'evento', 'tela', 'url', 'gatilho', 'quando_dispara', 'pergunta_negocio', 'texto_elemento', 'seletor', 'conversao', 'prioridade', 'status', 'parametros'];
    const rows = plan.events.map((e, i) => {
      const s = plan.screens.find(x => x.id === e.screenId) || {};
      return [num(i), e.name, s.name, s.url, e.trigger, e.description, e.businessQuestion, e.elementText, e.selector, e.isConversion ? 'sim' : 'nao', e.priority, e.status,
        e.params.filter(p => p.name).map(p => `${p.name} (${p.type}${p.required ? ', obrigatório' : ''}) = ${p.example}`).join(' | ')];
    });
    download(baseName() + '.csv', '﻿' + [head, ...rows].map(r => r.map(csvCell).join(';')).join('\n'), 'text/csv;charset=utf-8');
  }
  function mdEscape(s) { return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }
  function genMarkdown(imgPath) {
    const p = plan.project;
    const pt = params => params.filter(x => x.name).length ? '| Parâmetro | Tipo | Obrig. | Exemplo | Origem | Descrição |\n|---|---|---|---|---|---|\n' + params.filter(x => x.name).map(x => `| \`${x.name}\` | ${x.type} | ${x.required ? 'Sim' : 'Não'} | \`${mdEscape(x.example)}\` | ${mdEscape(x.source)} | ${mdEscape(x.description)} |`).join('\n') + '\n' : '_Sem parâmetros específicos._\n';
    let md = `# ${p.name || 'Plano de tagueamento'}\n\n> v${p.version} · ${p.status}${p.code ? ' · ' + p.code : ''} · atualizado em ${today()}\n\n`;
    if (p.notes) md += `> **Atenção:** ${mdEscape(p.notes)}\n\n`;
    md += `## 1. Resumo\n\n| Campo | Valor |\n|---|---|\n` + [['Objetivo', p.objective], ['KPIs', p.kpis], ['Squad', p.squad], ['Responsável', p.owner], ['Dev', p.devOwner], ['Plataforma', p.platform], ['Domínio', p.domain], ['Ferramentas', (p.tools || []).join(', ')], ['Método', METHODS[p.method]], ['Publicação prevista', p.dueDate]].filter(r => r[1]).map(r => `| ${r[0]} | ${mdEscape(r[1])} |`).join('\n') + '\n\n';
    md += `## 2. Eventos\n\n| # | Evento | Tela | Gatilho | Conversão | Status |\n|---|---|---|---|---|---|\n` + plan.events.map((e, i) => { const s = plan.screens.find(x => x.id === e.screenId); return `| ${num(i)} | \`${e.name}\` | ${mdEscape(s ? s.name : '—')} | ${e.trigger} | ${e.isConversion ? 'Sim' : '—'} | ${e.status} |`; }).join('\n') + '\n\n';
    md += `## 3. Parâmetros globais\n\n${pt(plan.globalParams)}\n## 4. Telas\n\n`;
    plan.screens.forEach(s => { md += `### ${s.name}${s.url ? ` — \`${s.url}\`` : ''}\n\n${s.description ? s.description + '\n\n' : ''}${s.image && imgPath ? `![${s.name}](${imgPath(s)})\n\n` : ''}`; });
    md += '## 5. Especificação dos eventos\n\n';
    plan.events.forEach((e, i) => {
      const s = plan.screens.find(x => x.id === e.screenId);
      md += `### ${num(i)} · \`${e.name}\`${e.isConversion ? ' (conversão)' : ''}\n\n- **Pergunta de negócio:** ${mdEscape(e.businessQuestion)}\n- **Quando dispara:** ${mdEscape(e.description)}\n- **Gatilho:** ${e.trigger}\n- **Tela:** ${s ? mdEscape(s.name) + (s.url ? ` (\`${s.url}\`)` : '') : '—'}\n`;
      if (e.elementText) md += `- **Texto do elemento:** ${mdEscape(e.elementText)}\n`;
      if (e.selector) md += `- **Seletor:** \`${e.selector}\`\n`;
      md += `- **Prioridade / status:** ${e.priority} / ${e.status}\n\n${pt(e.params)}\n\`\`\`js\n${genCode(e)}\n\`\`\`\n\n**Critérios de aceite**\n\n${qaCriteria(e).map(c => '- [ ] ' + c.replace(/<\/?code>/g, '`').replace(/<\/?(strong|em)>/g, '')).join('\n')}\n\n`;
      if (e.notes) md += `> ${mdEscape(e.notes)}\n\n`;
    });
    if (plan.changelog.length) md += `## Histórico\n\n| Data | Autor | Alteração |\n|---|---|---|\n${plan.changelog.map(c => `| ${c.date} | ${mdEscape(c.author)} | ${mdEscape(c.change)} |`).join('\n')}\n`;
    return md;
  }
  // Desenha o print com os marcadores "queimados" na imagem (para Markdown/GitHub)
  function annotatedImage(s) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 800, h = img.naturalHeight || 560;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
        const fs = Math.max(12, Math.round(w / 60));
        plan.events.forEach((e, i) => {
          if (e.screenId !== s.id || !e.marker) return;
          const x = e.marker.x / 100 * w, y = e.marker.y / 100 * h; const label = num(i);
          ctx.font = `700 ${fs}px monospace`; const tw = ctx.measureText(label).width; const bw = tw + fs, bh = fs * 1.7;
          ctx.fillStyle = '#e8590c'; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, fs / 6);
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2); else ctx.rect(x - bw / 2, y - bh / 2, bw, bh);
          ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 1);
        });
        cv.toBlob(b => resolve(b), 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = s.image;
    });
  }
  async function exportMarkdownZip() {
    const md0 = () => genMarkdown(null);
    if (!window.JSZip) { download(baseName() + '.md', md0(), 'text/markdown;charset=utf-8'); toast('Sem conexão com a biblioteca de ZIP: baixado só o .md (sem imagens)'); return; }
    const zip = new JSZip(); const folder = baseName();
    const imgName = s => `img/${slug(s.name) || s.id}.png`;
    for (const s of plan.screens) { if (!s.image) continue; const blob = await annotatedImage(s); if (blob) zip.file(`${folder}/${imgName(s)}`, blob); }
    zip.file(`${folder}/README.md`, genMarkdown(s => imgName(s)));
    zip.file(`${folder}/plano.json`, JSON.stringify(plan, null, 2));
    zip.file(`${folder}/implementacao.js`, genFullCode());
    download(folder + '.zip', await zip.generateAsync({ type: 'blob' }));
  }

  // ---------- Navegação ----------
  function showTab(name) {
    $$('nav.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    $$('section.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + name));
    if (name === 'doc') renderDoc();
    if (name === 'screens') renderScreens();
    try { localStorage.setItem(STORAGE_KEY + ':tab', name); } catch (e) { /* ok */ }
  }
  function gotoEvent(id) {
    openEvents.add(id); showTab('events'); renderEvents();
    const el = $(`details[data-ev="${id}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderAll() { renderProject(); renderScreens(); renderEvents(); updateCounts(); }

  // ---------- Eventos de UI ----------
  $$('nav.tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

  function onFieldChange(el) {
    if (el.dataset.arr) {
      const arr = getPath(plan, el.dataset.arr); const v = el.dataset.val;
      const i = arr.indexOf(v); if (el.checked && i < 0) arr.push(v); if (!el.checked && i >= 0) arr.splice(i, 1);
      save(); return;
    }
    const path = el.dataset.path; if (!path) return;
    let val = el.type === 'checkbox' ? el.checked : el.value;
    if (/\.name$/.test(path) && /^(events|globalParams)\./.test(path) || /\.params\.\d+\.name$/.test(path)) {
      // força snake_case enquanto digita
      const fixed = val.replace(/\s+/g, '_');
      if (fixed !== val) { const pos = el.selectionStart; el.value = fixed; el.setSelectionRange(pos, pos); val = fixed; }
    }
    setPath(plan, path, val); save();
    const m = path.match(/^events\.(\d+)\./);
    if (m) {
      const ev = plan.events[+m[1]];
      if (el.dataset.structural) { ev.marker = null; openEvents.add(ev.id); renderEvents(); renderScreens(); return; }
      refreshEventCard(ev.id);
      if (/\.name$/.test(path)) renderScreensLight();
    }
    if (path === 'project.method') renderEvents();
    if (/^(project|globalParams)\./.test(path)) { refreshGlobalIssues(); if (/^globalParams/.test(path)) plan.events.forEach(e => refreshEventCard(e.id)); }
    if (/^screens\.\d+\.name$/.test(path)) renderEvents();
    updateCounts();
  }
  let screensLightTimer;
  function renderScreensLight() { clearTimeout(screensLightTimer); screensLightTimer = setTimeout(() => { if ($('#tab-screens').classList.contains('active')) renderScreens(); }, 400); }

  document.addEventListener('input', e => { if (e.target.matches('[data-path],[data-arr]') && e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') onFieldChange(e.target); });
  document.addEventListener('change', e => { if (e.target.matches('[data-path],[data-arr]') && (e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) onFieldChange(e.target); });
  document.addEventListener('toggle', e => { const d = e.target; if (d.matches && d.matches('details.event')) { d.open ? openEvents.add(d.dataset.ev) : openEvents.delete(d.dataset.ev); } }, true);

  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (go) { e.preventDefault(); if ($('#markerDialog').open) return; gotoEvent(go.dataset.goto); return; }
    const a = e.target.closest('[data-action]');
    const drop = e.target.closest('[data-drop]');
    if (drop) focusedScreen = drop.dataset.drop;
    if (!a) { if (drop && !drop.classList.contains('has-img')) pickImage(drop.dataset.drop); return; }
    const d = a.dataset; const act = d.action;
    if (act === 'del-param') { getPath(plan, d.base).splice(+d.i, 1); }
    else if (act === 'add-param') { getPath(plan, d.base).push(blankParam()); }
    else if (act === 'del-log') { plan.changelog.splice(+d.i, 1); }
    else if (act === 'del-screen') {
      const s = plan.screens[+d.i]; const n = plan.events.filter(x => x.screenId === s.id).length;
      if (!confirm(`Excluir a tela "${s.name}"?${n ? ` ${n} evento(s) ficarão sem tela.` : ''}`)) return;
      plan.events.forEach(x => { if (x.screenId === s.id) { x.screenId = ''; x.marker = null; } }); plan.screens.splice(+d.i, 1);
    }
    else if (act === 'move-screen' || act === 'move-event') {
      const arr = act === 'move-screen' ? plan.screens : plan.events; const i = +d.i, j = i + (+d.dir);
      if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    else if (act === 'replace-img') { pickImage(d.id); return; }
    else if (act === 'add-event-screen') { const ev = blankEvent(); ev.screenId = d.id; plan.events.push(ev); openEvents.add(ev.id); save(); renderAll(); gotoEvent(ev.id); return; }
    else if (act === 'open-marker') { openMarker(d.id); return; }
    else if (act === 'copy-code') {
      const ev = plan.events.find(x => x.id === d.id);
      navigator.clipboard.writeText(genCode(ev)).then(() => toast('Código copiado'), () => toast('Não foi possível copiar')); return;
    }
    else if (act === 'dup-event') { const src = plan.events[+d.i]; const c = JSON.parse(JSON.stringify(src)); c.id = uid('ev'); c.name = src.name ? src.name + '_copia' : ''; c.marker = null; plan.events.splice(+d.i + 1, 0, c); openEvents.add(c.id); }
    else if (act === 'del-event') { if (!confirm('Excluir este evento?')) return; plan.events.splice(+d.i, 1); }
    else return;
    save(); renderAll();
  });

  // Arrastar e soltar / colar prints
  document.addEventListener('dragover', e => { const d = e.target.closest('[data-drop]'); if (d) { e.preventDefault(); d.classList.add('drag'); } });
  document.addEventListener('dragleave', e => { const d = e.target.closest('[data-drop]'); if (d) d.classList.remove('drag'); });
  document.addEventListener('drop', e => {
    const d = e.target.closest('[data-drop]'); if (!d) return; e.preventDefault(); d.classList.remove('drag');
    const f = e.dataTransfer.files[0]; if (f) setScreenImage(d.dataset.drop, f);
  });
  document.addEventListener('paste', e => {
    if (!$('#tab-screens').classList.contains('active')) return;
    const item = Array.from(e.clipboardData.items || []).find(i => i.type.startsWith('image/')); if (!item) return;
    e.preventDefault(); const file = item.getAsFile();
    let target = plan.screens.find(s => s.id === focusedScreen && !s.image) || plan.screens.find(s => s.id === focusedScreen);
    if (!target || (target.image && !confirm('Substituir o print da tela selecionada? (Cancelar cria uma nova tela)'))) target = addScreen();
    setScreenImage(target.id, file);
  });

  // Barra superior
  $('#btnAddGlobal').onclick = () => { plan.globalParams.push(blankParam()); save(); renderGlobals(); };
  $('#btnAddLog').onclick = () => { plan.changelog.push({ date: today(), author: '', change: '' }); save(); renderChangelog(); };
  $('#btnAddScreen').onclick = () => addScreen();
  $('#btnAddEvent').onclick = () => { const ev = blankEvent(); plan.events.push(ev); openEvents.add(ev.id); save(); renderEvents(); gotoEvent(ev.id); };
  $('#btnCollapse').onclick = () => { openEvents.clear(); $$('details.event').forEach(d => { d.open = false; }); };
  $('#btnNew').onclick = () => { if (!confirm('Começar um plano novo? O plano atual será apagado deste navegador (baixe o JSON antes, se precisar).')) return; plan = blankPlan(); save(); renderAll(); showTab('project'); };
  $('#btnExample').onclick = () => { if (plan.events.length && !confirm('Substituir o plano atual pelo exemplo?')) return; plan = normalize(JSON.parse(JSON.stringify(window.EXAMPLE_PLAN))); save(); renderAll(); showTab('screens'); toast('Exemplo carregado'); };
  $('#btnExportJson').onclick = () => { download(baseName() + '.json', JSON.stringify(plan, null, 2), 'application/json'); toast('JSON baixado — salve na pasta plans/ do repositório'); };
  $('#fileImport').onchange = e => {
    const f = e.target.files[0]; if (!f) return; const fr = new FileReader();
    fr.onload = () => { try { plan = normalize(JSON.parse(fr.result)); save(); renderAll(); showTab('doc'); toast('Plano carregado'); } catch (err) { alert('Arquivo JSON inválido.'); } e.target.value = ''; };
    fr.readAsText(f);
  };
  $('#btnPrint').onclick = () => { renderDoc(); window.print(); };
  $('#btnExportHtml').onclick = exportHtml;
  $('#btnExportCsv').onclick = exportCsv;
  $('#btnExportJs').onclick = () => download(baseName() + '-implementacao.js', genFullCode(), 'text/javascript;charset=utf-8');
  $('#btnExportMd').onclick = () => exportMarkdownZip().catch(() => toast('Falha ao gerar o .zip'));
  window.addEventListener('beforeprint', renderDoc);

  // Início
  renderAll();
  let startTab = 'project';
  try { startTab = localStorage.getItem(STORAGE_KEY + ':tab') || 'project'; } catch (e) { /* ok */ }
  showTab(startTab);
  if (!plan.project.name && !plan.events.length) $('#saveState').textContent = '· clique em “Exemplo” para ver um plano';
})();

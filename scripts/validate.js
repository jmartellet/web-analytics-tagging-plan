#!/usr/bin/env node
/*
 * Valida os planos de tagueamento (.json) com as mesmas regras da página.
 * Uso: node scripts/validate.js [arquivos ou pastas...]   (padrão: plans/ e examples/)
 * Sai com código 1 se houver erros — usado no GitHub Actions para bloquear PRs.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { validatePlan, countIssues } = require('../app/rules.js');

const args = process.argv.slice(2);
const targets = args.length ? args : ['plans', 'examples'];
const files = [];
for (const t of targets) {
  if (!fs.existsSync(t)) continue;
  if (fs.statSync(t).isDirectory()) fs.readdirSync(t).filter(f => f.endsWith('.json')).forEach(f => files.push(path.join(t, f)));
  else files.push(t);
}

if (!files.length) { console.log('Nenhum plano .json encontrado.'); process.exit(0); }

let totalErrors = 0;
const icon = { error: '✖', warning: '⚠', info: 'ℹ' };
for (const file of files) {
  let plan;
  try { plan = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.log(`\n✖ ${file}: JSON inválido (${e.message})`); totalErrors++; continue; }
  const res = validatePlan(plan);
  const c = countIssues(res);
  totalErrors += c.error;
  console.log(`\n${c.error ? '✖' : '✔'} ${file} — ${(plan.events || []).length} evento(s), ${c.error} erro(s), ${c.warning} alerta(s)`);
  [...res.project, ...res.globals].forEach(i => console.log(`   ${icon[i.level]} ${i.msg}`));
  (plan.events || []).forEach((ev, idx) => {
    const list = (res.events[ev.id] || []).filter(i => i.level !== 'info');
    if (list.length) {
      console.log(`   E${String(idx + 1).padStart(2, '0')} ${ev.name || '(sem nome)'}`);
      list.forEach(i => console.log(`      ${icon[i.level]} ${i.msg}`));
    }
  });
}
console.log(`\n${files.length} plano(s) verificados, ${totalErrors} erro(s).`);
process.exit(totalErrors ? 1 : 0);

// 3 · What can go wrong: likelihood × impact plane on the left, the numbered risk list on the right.
// Hovering a row highlights its dot and the other way round. Risk numbers are row positions in SSE.RISKS (display order).
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).threats = function (t, D) {
  const SHOW_CHART = false;  // false: show the Spanish draft list instead of the chart and table
  const SEV_MAX = 5;          // severity scale of the draft list, 1 (low) … SEV_MAX (critical)
  const SEV_STEP = 0.5;       // calibration snaps to this step; click at the far left (below half a step) clears the bar
  // Default severity per draft line (trimmed text), a first guess. Calibrated values are saved over it as JSON in edits.js (key threats.sev).
  // Lines not listed, empty lines and titles get no bar.
  const SEV = {
    'Define mal el goal o scope': 4, 'No mira el swarm': 4, 'Se cansa de tocar approve': 3, 'No recibe alertas criticas': 4, 'Lo engaña el swarm desalineado': 5,
    'Llena mal los gaps en la definicion de goal o scope': 3, 'Toma decisiones peligrosas por el usuario': 4, 'No tiene suficiente visibilidad de los contextos': 3,
    'No tiene suficiente visibilidad de tools': 3, 'No sabe que version de modelo se usa en inferencia': 2, 'No conoce las capacidades emergentes de modelos nuevos': 3,
    'Recibe reportes incompletos o sesgados': 3, 'Goalmaxxea y deja pasar cosas graves': 4, 'Lo Engaña el swarm desalineado': 5,
    'Se ataca la implementacion': 4, 'Servicio Mal configurado': 3, 'No loggea atribucion': 2, 'Permite protocolos': 3, 'No aplica whitelist': 4,
    'Se usa de pivot para ataques': 5, 'Stack Vulnerable': 3, 'Mal configurado': 3, 'Sin controles reactivos': 3, 'Sandbox escape al nodo/host': 5,
    'Se usa para moverse lateralmente': 5, 'Propaga instrucciones adversarias': 4, 'Propaga exploits y payloads': 5, 'No tiene controles reactivos': 3,
    'No tiene permisos bien definidos': 4, 'Son modificados externamente': 4, 'Input externo': 4, 'Capa de inferencia': 4,
    'Se ataca el motor de inferencia': 4, 'Ofrece herramientas peligrosas': 4, 'Se sustituye el model por otro checkpoint': 3,
    'Oculta chain of thought deliberadamente': 4, 'Oculta intent fuera de scope': 5, 'Intent desalineado con plausible deniability': 5, 'Genera instrucciones desalineadas': 4,
  };
  const r = k => t('risks.' + k);
  const name = id => t(`threats.${id}.t`);
  let n = 0;
  const groups = D.RISKS.map(([cat, rows]) => [cat, rows.map(x => [++n, cat, ...x])]);
  const all = groups.flatMap(([, rows]) => rows);

  // impact high → low from the top (only levels that have risks), likelihood low → high from the left
  const impacts = [3, 2, 1].filter(i => all.some(x => x[4] === i));
  const tint = (l, i) => l + i === 6 ? ' hot' : l + i === 5 ? ' warm' : '';
  const chart = `<div class="rchart">
      <div class="ry">${r('chart.y')}</div>
      <div class="rgrid">${impacts.map(i => `<div class="rlab">${r('level.' + i)}</div>${[1, 2, 3].map(l =>
        `<div class="rcell${tint(l, i)}">${all.filter(x => x[3] === l && x[4] === i).map(([k, cat]) => `<span class="rnum rc-${cat}" data-r="${k}">${k}</span>`).join('')}</div>`).join('')}`).join('')}
        <div></div>${[1, 2, 3].map(l => `<div class="rlab x">${r('level.' + l)}</div>`).join('')}</div>
      <div class="rx">${r('chart.x')}</div></div>`;
  const list = `<div class="rlist">${groups.map(([cat, rows]) => `<div class="rcat">${r('cat.' + cat)}</div>${rows.map(([k, , id, , , stop]) =>
      `<div class="rrow" data-r="${k}" title="${name(id)} — ${r('stop.' + stop)}"><span class="rnum rc-${cat}">${k}</span>${name(id)}<span class="mute"> — ${r('stop.' + stop)}</span></div>`).join('')}`).join('')}</div>`;

  const el = document.createElement('div');
  el.className = 'threats';
  // Draft list in Spanish (`threats.draft`, one line per row) while the risks are rewritten; the chart comes back with SHOW_CHART.
  // Each line: "threat | consequence" (the consequence is optional). A row = threat, consequence, severity bar; rows can be dragged, edited and added.
  // A bar only on item rows: not empty, not a title (wrapped in <b>…</b> or ending in ":"). Severity is keyed by the threat text, so rows can move.
  const ED = window.SSE_EDIT;  // editing (severity, reorder, edit, add) only when app.js turns it on
  const raw = t('threats.draft', null, true).split('\n');
  const split = l => { const k = l.indexOf(' | '); return k < 0 ? [l, ''] : [l.slice(0, k), l.slice(k + 3)]; };
  const join = (a, c) => c.trim() ? `${a} | ${c.trim()}` : a;
  const isTitle = l => /^<b>.*<\/b>$|:$/.test(l.trim());
  let saved = {};
  try { saved = JSON.parse(t('threats.sev', null, true)); } catch (e) {}
  const sev = Object.assign({}, SEV, saved);
  const save = (edits = {}) => window.SSE_SET(Object.assign({ 'threats.draft': raw.join('\n'), 'threats.sev': JSON.stringify(saved) }, edits));
  const bar = s => s ? `<b style="width:${s / SEV_MAX * 100}%;background:hsl(${Math.max(0, 50 - (s - 1) / (SEV_MAX - 1) * 50)},85%,52%)" title="${s}/${SEV_MAX}"></b>` : '';
  const row = (l, i) => {
    const [a, c] = split(l), item = a.trim() && !isTitle(a);
    return `<div class="trow" draggable="${ED}" data-i="${i}"><span class="ttx">${a}</span><span class="tcons">${c}</span>${item ? `<i class="sv" data-l="${a.trim().replace(/"/g, '&quot;')}">${bar(sev[a.trim()] || 0)}</i>` : '<i></i>'}</div>`;
  };
  const scale = `<div class="tscale">${Array.from({ length: SEV_MAX }, (_, k) => `<span style="left:${(k + 1) / SEV_MAX * 100}%">${k + 1}</span>`).join('')}</div>`;
  el.innerHTML = SHOW_CHART ? `<div class="rwrap">${chart}${list}</div>` : `<div class="tdraft"><div></div><div></div><div class="tcons-h">${t('threats.consT')}</div>${scale}
      <i class="tvert" style="grid-row:2/${raw.length + 2}"></i>${raw.map(row).join('')}${ED ? `<button class="btn tadd">${t('threats.add')}</button>` : ''}</div>`;

  // Severity: click or drag on a row's slot; saved on mouse up.
  let drag = null;
  const setSev = (slot, x) => {
    const r = slot.getBoundingClientRect(), v = Math.round((x - r.left) / r.width * SEV_MAX / SEV_STEP) * SEV_STEP;
    const s = Math.max(0, Math.min(SEV_MAX, v));
    saved[slot.dataset.l] = s; slot.innerHTML = bar(s);
  };
  el.addEventListener('mousedown', e => { if (!ED) return; const s = e.target.closest('.sv'); if (!s) return; e.preventDefault(); drag = s; setSev(s, e.clientX); });
  el.addEventListener('mousemove', e => { if (drag) setSev(drag, e.clientX); });
  document.addEventListener('mouseup', () => { if (drag) { drag = null; save(); } });

  // Reorder: drag a row onto another; it lands above or below it depending on the half.
  let from = null, mark = null;
  const unmark = () => mark && mark.classList.remove('dropt', 'dropb');
  el.addEventListener('dragstart', e => { if (!ED) return; const r = e.target.closest?.('.trow'); if (!r) return; from = +r.dataset.i; r.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ''); });
  el.addEventListener('dragover', e => {
    const r = e.target.closest?.('.trow'); if (!r || from === null) return;
    e.preventDefault(); unmark(); mark = r;
    const b = r.getBoundingClientRect(); r.classList.add(e.clientY > b.top + b.height / 2 ? 'dropb' : 'dropt');
  });
  el.addEventListener('drop', e => {
    if (!mark || from === null) return;
    e.preventDefault();
    let to = +mark.dataset.i + (mark.classList.contains('dropb') ? 1 : 0);
    if (to > from) to--;
    const [l] = raw.splice(from, 1); raw.splice(to, 0, l);
    from = null; save();
  });
  el.addEventListener('dragend', () => { unmark(); from = null; el.querySelector('.trow.drag')?.classList.remove('drag'); });

  // Edit a threat or consequence in place (double click, source shown for titles). Enter saves, Escape cancels.
  // An emptied row (no threat, no consequence) is removed; severity follows a renamed threat.
  const edit = cell => {
    const r = cell.parentElement, i = +r.dataset.i, [a, c] = split(raw[i]), isT = cell.classList.contains('ttx');
    const start = isT ? a.trim() : c;
    r.draggable = false; cell.textContent = start; cell.contentEditable = 'true'; cell.focus();
    getSelection().selectAllChildren(cell); getSelection().collapseToEnd();
    let cancel = false;
    cell.addEventListener('keydown', k => { if (k.key === 'Enter') { k.preventDefault(); cell.blur(); } if (k.key === 'Escape') { cancel = true; cell.blur(); } });
    cell.addEventListener('blur', () => {
      const v = cell.textContent.trim();
      if (cancel || v === start) { cell.contentEditable = 'false'; r.draggable = true; cell.innerHTML = isT ? a : c; return; }
      if (isT) {
        if (a.trim() in saved) { saved[v] = saved[a.trim()]; delete saved[a.trim()]; }
        raw[i] = join(a.match(/^\s*/)[0] + v, c);
      } else raw[i] = join(a, v);
      if (!split(raw[i])[0].trim() && !split(raw[i])[1].trim() && start) raw.splice(i, 1);
      save();
    }, { once: true });
  };
  el.addEventListener('dblclick', e => { if (!ED) return; const c = e.target.closest('.ttx, .tcons'); if (!c || !c.closest('.trow')) return; e.stopPropagation(); edit(c); });
  // Add: a new empty row at the bottom, opened for editing.
  el.addEventListener('click', e => { if (!e.target.closest('.tadd')) return; raw.push(''); window.SSE_SECTIONS.threats.addEdit = true; save(); });
  if (window.SSE_SECTIONS.threats.addEdit) { window.SSE_SECTIONS.threats.addEdit = false; setTimeout(() => { const c = document.querySelector('.tdraft .trow:last-of-type .ttx'); c && edit(c); }); }
  const hl = k => el.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('hl', x.dataset.r === k));
  el.addEventListener('mouseover', e => { const x = e.target.closest('[data-r]'); hl(x ? x.dataset.r : null); });
  el.addEventListener('mouseleave', () => hl(null));
  el.addEventListener('click', e => { const x = e.target.closest('[data-r]'); hl(x ? x.dataset.r : null); }); // tap on touch screens
  return el;
};

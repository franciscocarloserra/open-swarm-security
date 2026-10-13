// 1 · Swarm control: the human operator's panel.
// The human sets goal and budget and approves or stops; the orchestrator decides everything granular.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).console = function (t, D) {
  const HIST_BINS = 36;        // tool-call histograms: one bar per 10 minutes, same span as the incident timeline
  const HIST_SPREAD = 0.8;     // how much bars vary around the hourly average (0 = flat)
  const M = D.MOCK;
  const c = (k, v) => t('console.' + k, v), o = (k, v) => t('orchestrator.' + k, v);
  // Minimal Python highlighting: comments, strings, numbers, keywords, calls. Spans add no text, so double-click editing still matches.
  const PY = /(#.*)|("(?:[^"\\]|\\.)*")|\b(\d[\d_]*)\b|\b(def|return|if|else|for|in|import|from|class|None|True|False)\b|(\w+)(?=\()/g;
  const py = s => s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])
    .replace(PY, (m, cm, st, nu, kw) => `<span class="py-${cm ? 'c' : st ? 's' : nu ? 'n' : kw ? 'k' : 'f'}">${m}</span>`);
  const stateOf = i => M.state[i] || 'ok';
  // Green lets work go on (approve, release, relax); yellow looks closer (inspect); red ends it (kill); gray for the rest.
  const GO = ['approve', 'release', 'relax'], LOOK = ['inspect'], STOP = ['kill'];
  const btn = id => `<button class="btn${GO.includes(id) ? ' go' : LOOK.includes(id) ? ' look' : STOP.includes(id) ? ' stop' : ''}" data-act="${id}">${c('act.' + id)}</button>`;
  const dot = st => `<i class="dot a-${st}" title="${c('st.' + st)}"></i>`;

  const SHOWN = ['ok', 'watch', 'paused'];  // states in the status bar (quarantined left out)
  const all = Array.from({ length: M.contexts }, (_, i) => stateOf(i));
  const count = st => all.filter(x => x === st).length;
  const needWhat = ([id]) => c('need.' + id, { n: count('paused') });
  const usd = n => n.toLocaleString('en');
  const bar = (pct, cls = '') => `<div class="pbar${cls}"><i style="width:${pct}%"></i></div>`;
  const split = M.split.map(([r, p]) => `${o('regions.' + r)} ${p}%`).join(' · ');

  // Each cell: title and value on one line, a bar, one small line.
  const top = `<div class="blk c-top">
      <div class="cb cs-${M.swarm}"><div class="cv"><h5>${c('status')}</h5><span class="st-${M.swarm}">${c('swarm.' + M.swarm)}</span></div>
        <div class="sbar">${SHOWN.map(s => `<i class="a-${s}" style="flex:${count(s)}"></i>`).join('')}</div>
        <div class="legend">${SHOWN.map(s => `<span class="cnt">${dot(s)}${count(s)} ${c('st.' + s)}</span>`).join(' · ')}</div></div>
      <div class="cb"><div class="cv"><h5>${c('goal')}</h5><span>${c('goalV')}</span></div>${bar(M.goalPct)}<div class="mute">${c('done', { p: M.goalPct })}</div></div>
      <div class="cb"><div class="cv"><h5>${c('budget')}</h5><span>${c('spent', { s: usd(M.spent), b: usd(M.budget) })}</span></div>${bar(M.spent / M.budget * 100)}
        <div class="mute">${c('tokens', { t: M.tokens[0], T: M.tokens[1] })} · ${c('days', { d: M.days[0], D: M.days[1] })}</div></div>
    </div>`;

  // Incident timeline: one colored slot per 10 minutes, oldest on the left.
  const SEV = { g: 'ok', y: 'watch', r: 'paused' };
  const SLOT_MIN = 10;
  const hours = M.incidents.length * SLOT_MIN / 60;
  const [eh, em] = M.incidentsEnd.split(':').map(Number);
  const slotTime = s => { const m = eh * 60 + em - (M.incidents.length - s) * SLOT_MIN; return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
  // Readout on the right: the hovered slot, or the latest incident when nothing is hovered.
  const slotText = s => { const [k, ctx] = M.incidentInfo[s] || ['none', []]; return `${slotTime(s)} · ${c('inc.' + k)}${ctx.length ? ' · ' + ctx.map(i => '#' + (i + 1)).join(' ') : ''}`; };
  const latest = Math.max(...Object.keys(M.incidentInfo).map(Number));
  const timeline = `<div class="blk itl"><h5>${c('incidents')}</h5><span class="mute">${c('ago', { h: hours })}</span>
      <span class="itl-s">${[...M.incidents].map((x, s) => `<i class="a-${SEV[x]}" data-s="${s}"></i>`).join('')}</span><span class="mute">${c('now')}</span>
      <span class="itl-r">${slotText(latest)}</span></div>`;

  // Tool calls: one small boxed histogram per tool, side by side. Bars are illustrative (fixed pseudo-random around calls/hour).
  // Colors follow the status palette: green normal, amber where a tripwire is near its limit, red where calls were blocked.
  const rnd = (a, b) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
  const hist = (id, ti) => {
    const [, bl] = M.tools[id], st = M.tripwires[id][1];
    const red = new Set(Array.from({ length: Math.round(bl) }, (_, k) => Math.floor(rnd(ti, k + 9) * HIST_BINS)));
    if (st === 'tripped') red.add(HIST_BINS - 1).add(HIST_BINS - 2);
    const amber = st === 'near' ? [HIST_BINS - 1, HIST_BINS - 2] : [];
    const h = Array.from({ length: HIST_BINS }, (_, b) => 1 - HIST_SPREAD / 2 + HIST_SPREAD * rnd(ti, b));
    const top = Math.max(...h);
    return h.map((v, b) => `<i class="a-${red.has(b) ? 'paused' : amber.includes(b) ? 'watch' : 'ok'}" style="height:${v / top * 100}%"></i>`).join('');
  };
  const tools = `<div class="blk"><h5>${c('tools')}<span>${c('histNote')}</span></h5><div class="hists">
      ${D.TOOLS.map((id, ti) => { const [n, bl] = M.tools[id]; return `<div class="hist">
        <div class="hist-h"><b data-k="console.toolNames.${id} arch.tools.sub.${id}">${c('toolNames.' + id)}</b><small>${n.toLocaleString('en')} ${c('perHour')} · ${bl ? bl.toFixed(1) : 0}% ${c('blocked')}</small></div>
        <div class="hist-b">${hist(id, ti)}</div></div>`; }).join('')}</div></div>`;

  // Agents (contexts) and tool histograms (2×2) side by side; tripwires sit next to the orchestrator log.
  const TW = { ok: 'ok', near: 'watch', tripped: 'paused' };
  const w = (k, v) => c('tripwires.' + k, v);
  const agents = `<div class="two"><div class="blk"><h5>${c('agents')}<span>${c('contextsN', { n: M.contexts })}</span></h5>
      <div class="cells" style="--n:${M.perRow}">${all.map((st, i) => `<span class="cell a-${st}" data-i="${i}" style="animation-delay:-${(i * 37 % 29) / 10}s"></span>`).join('')}<div class="insp" hidden></div></div></div>
    ${tools}</div>`;

  const needs = `<div class="blk"><h5>${c('needs')}</h5>
      ${M.needs.map(n => `<div class="need">${dot('paused')}<span>${needWhat(n)}</span><span class="acts">${n[2].map(btn).join('')}</span></div>`).join('')}</div>`;

  // Orchestrator: its decision log, newest first.
  const logVars = { p: count('paused'), b: M.blockedUploads, s: split, n: M.permLevel };
  const orch = `<div class="blk oblk"><h5>${o('title')}</h5>
      ${M.orchLog.map(([tm, id, col, hl]) => `<div class="olog c-${col}${hl ? ' hl' : ''}"><span class="mute">${tm}</span><span>${o('log.' + id, logVars)}</span></div>`).join('')}</div>`;

  // Tripwires: compact column to the right of the orchestrator log; click a row for details.
  const trips = `<div class="blk trips"><h5>${w('title')}<span>${w('toolsN', { n: D.TOOLS.length })}</span></h5>
      ${D.TOOLS.map(id => [id, ...M.tripwires[id]]).map(([id, rule, st]) => `<button class="tw" data-tw="${id}"><i class="dot a-${TW[st]}" title="${w('st.' + st)}"></i>
        <span data-k="console.toolNames.${id} arch.tools.sub.${id}">${c('toolNames.' + id)}</span><span class="mute">${w('rule.' + rule)}</span></button>`).join('')}
      <div class="tw-insp" hidden></div></div>`;

  // Context analysis: same compact look as tripwires, one row per check run on contexts; not clickable.
  const x = (k, v) => c('ctxAnalysis.' + k, v);
  const ctx = `<div class="blk trips"><h5>${x('title')}<span>${x('checksN', { n: M.ctxChecks.length })}</span></h5>
      ${M.ctxChecks.map(([id, st, n, f]) => `<div class="tw cxa"><i class="dot a-${TW[st]}" title="${w('st.' + st)}"></i>
        <span>${x('check.' + id)}</span><span class="mute">${x('stat', { n: n.toLocaleString('en'), f, p: (100 * f / n).toFixed(2) })}</span></div>`).join('')}</div>`;

  const el = document.createElement('div');
  el.className = 'win';
  el.innerHTML = `<div class="wbar"><i></i><i></i><i></i><span>${c('window')}</span></div><div class="modal" hidden></div><div class="c1">${top + needs + timeline + agents + `<div class="two orch-row">${ctx + orch + trips}</div>`}</div>`;

  // ───────── inspector: closed until a context is clicked ─────────
  const insp = el.querySelector('.insp');
  let sel = null;
  // Tripwire inspector: what happened, last blocked call, keep or relax.
  const twInsp = el.querySelector('.tw-insp');
  let twSel = null;
  function tripwire(row) {
    el.querySelectorAll('.tw.sel').forEach(x => x.classList.remove('sel'));
    twSel = twSel === row.dataset.tw ? null : row.dataset.tw;
    twInsp.hidden = !twSel;
    if (!twSel) return;
    row.classList.add('sel');
    const id = twSel, st = M.tripwires[id][1], k = t.has('console.tripwires.what.' + id) ? id : 'ok';
    twInsp.innerHTML = `<div>${dot(TW[st])}${w('st.' + st)}</div><div>${w('what.' + k)}</div>
      <div class="mute">${w('last')}: ${w('lastV.' + (t.has('console.tripwires.lastV.' + id) ? id : 'none'))}</div>
      <div class="acts">${btn('keepRule')}${btn('relax')}</div>`;
  }

  // Hovering a timeline slot highlights the contexts involved.
  const readout = el.querySelector('.itl-r');
  el.querySelector('.itl-s').addEventListener('mouseover', e => {
    const s = e.target.dataset.s;
    if (s == null) return;
    readout.textContent = slotText(+s);
    const ctx = (M.incidentInfo[s] || [, []])[1];
    el.querySelectorAll('.cell.hl').forEach(x => x.classList.remove('hl'));
    ctx.forEach(i => el.querySelector(`.cell[data-i="${i}"]`).classList.add('hl'));
  });
  el.querySelector('.itl-s').addEventListener('mouseleave', () => {
    readout.textContent = slotText(latest);
    el.querySelectorAll('.cell.hl').forEach(x => x.classList.remove('hl'));
  });

  // Context inspector: a popup above the hovered cell; it lives inside .cells, so moving into it keeps it open.
  // A click on a cell opens its agent log.
  el.addEventListener('mouseover', e => {
    const cell = e.target.closest('.cell');
    if (cell) show(+cell.dataset.i);
  });
  el.querySelector('.cells').addEventListener('mouseleave', () => show(null));
  el.addEventListener('click', e => {
    const tw = e.target.closest('.tw');
    if (tw) { tripwire(tw); return; }
    if (e.target.closest('.modal-x') || e.target === modal) { modal.hidden = true; return; }
    // Discuss: closes the log and adds a yellow line to the orchestrator log (mockup).
    if (e.target.closest('.mdisc')) {
      modal.hidden = true;
      el.querySelector('.oblk').insertAdjacentHTML('beforeend', `<div class="olog olog-y"><span class="mute">${M.incidentsEnd}</span><span>${o('log.discuss', { n: +modal.dataset.i + 1 })}</span></div>`);
      return;
    }
    if (e.target.closest('[data-act="inspect"]')) { openLog(all.indexOf('paused')); return; }  // log of the first held context
    // Release turns into a blue "Sure?" in the same place; confirming shows the swarm as running.
    const rel = e.target.closest('[data-act="release"]');
    if (rel) { rel.dataset.act = 'sure'; rel.className = 'btn sure'; rel.textContent = c('act.sure'); return; }
    // Sure → status running (no red); Freeze run → status frozen (red).
    const status = st => { const cb = el.querySelector('.c-top .cb'), v = cb.querySelector('.cv span'); cb.className = 'cb cs-' + (st === 'frozen' ? 'paused' : st); v.className = 'st-' + st; v.textContent = c('swarm.' + st); el.classList.toggle('frozen', st === 'frozen'); };
    // Sure hides the button (back to a hidden Release); Freeze run shows Release again.
    const sure = e.target.closest('[data-act="sure"]');
    if (sure) { status('running'); sure.outerHTML = btn('release').replace('<button', '<button hidden'); return; }
    if (e.target.closest('[data-act="kill"]')) { status('frozen'); el.querySelectorAll('[data-act="release"][hidden]').forEach(b => b.hidden = false); return; }
    const cell = e.target.closest('.cell');
    if (cell) openLog(+cell.dataset.i);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.hidden = true; });

  // Agent log modal (mockup): auto-classification on top, then input, thinking, tool calls and results in order.
  const modal = el.querySelector('.modal');
  function openLog(i) {
    const st = stateOf(i), k = st === 'ok' ? 'clean' : 'flagged', L = M.agentLog[k], g = (p, v) => c('alog.' + p, v);
    const lines = c('alog.' + k);
    modal.innerHTML = `<div class="mbox">
      <div class="mhead"><b>${g('title')} · #${i + 1}</b><span class="mute">${c('st.' + st)}</span><button class="modal-x" title="${g('close')}">✕</button></div>
      <div class="mcls"><span class="mute">${g('cls')}</span><span class="vd vd-${k}">${g('verdict.' + k)}</span>
        ${D.CONTROL_TYPES.map(id => `<span class="chk">${dot(L.checks[id] === 'ok' ? 'ok' : 'paused')}${g(`checks.${k}.${id}`)}</span>`).join('')}</div>
      <div class="alog">${L.kinds.map((kind, n) => `<div class="al al-${kind}${L.flag.includes(n) ? ' flag' : ''}"><span>${g('kind.' + kind)}</span><span>${lines[n]}</span></div>`).join('')}</div>
      <div class="mfoot"><button class="btn look mdisc">${g('discuss')}</button></div>
    </div>`;
    modal.dataset.i = i;
    modal.hidden = false;
    modal.firstElementChild.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }
  function show(i) {
    el.querySelectorAll('.cell.sel').forEach(x => x.classList.remove('sel'));
    sel = i;
    insp.hidden = sel === null;
    if (sel === null) return;
    const cell = el.querySelector(`.cell[data-i="${sel}"]`), grid = cell.parentElement;
    cell.classList.add('sel');
    const st = stateOf(sel), steps = t.has('console.trace.' + st) ? c('trace.' + st) : [];
    insp.innerHTML = `<div>${dot(st)}#${sel + 1} · ${c('st.' + st)}</div>
      ${steps.length ? `<ol class="trace">${steps.map(x => `<li>${x}</li>`).join('')}</ol>` : ''}
      ${steps.length ? `<div class="acts">${btn('release')}</div>` : ''}`;
    // Popup just above the hovered cell, touching it, so the mouse can move straight into it.
    insp.style.left = Math.max(0, Math.min(cell.offsetLeft - 16, grid.offsetWidth - insp.offsetWidth)) + 'px';
    insp.style.bottom = (grid.offsetHeight - cell.offsetTop + 1) + 'px';
  }
  // Subsections under the mockup: scope definition (title + paragraph), then orchestrator UX (title + paragraph + code block).
  const wrap = document.createElement('div');
  wrap.appendChild(el);
  wrap.insertAdjacentHTML('beforeend', `<h3 class="sub-h">${c('scope.t')}</h3><p class="sub-p">${c('scope.p')}</p>
    <h3 class="sub-h">${c('orchUx.t')}</h3><p class="sub-p">${c('orchUx.p')}</p><pre class="sub-code">${py(c('orchUx.code'))}</pre>`);
  return wrap;
};

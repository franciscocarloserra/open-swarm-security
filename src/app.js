// Mounts the sections (src/sections/*.js) in order and handles language + layer toggles.
// Each section: window.SSE_SECTIONS.<name>(t, SSE) → DOM element, with its own click handling.
(function () {
  const GITHUB = 'https://github.com/franciscocarloserra';  // author link in the byline above the title
  const CONTACT = 'https://forms.gle/jmzs1QfNfDbSu6Ue7';  // contact form, in both signatures
  const X_URL = 'https://x.com/francarloerra';
  const EDIT = false;  // inline text editors, saved through serve.py; off for the published page
  window.SSE_EDIT = EDIT;
  const D = window.SSE, L = window.SSE_I18N, S = window.SSE_SECTIONS;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  // ───────── i18n ─────────
  const q = new URLSearchParams(location.search);
  let lang = q.get('lang') || localStorage.getItem('sse-lang') || 'en';
  if (!L[lang] || !D.LANGS.includes(lang)) lang = 'en';
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  // Markdown-style bullets: lines starting with "- " or "* " become list items (span blocks, valid inside <p>); indent 2 spaces per level.
  // Bare URLs become links (not the ones already inside an attribute or tag).
  const URL_RE = /(?<![="'>])\bhttps?:\/\/[^\s<"']+/g;
  const md = s => mdList(s.replace(URL_RE, u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`));
  const mdList = s => /^[ \t]*[-*] /m.test(s) ? s.replace(/^([ \t]*)[-*] (.*)$/gm, (m, ind, x) => `<span class="li" style="margin-left:${1.2 + ind.length / 2}em">${x}</span>`)
    .replace(/\n?(<span class="li"[^>]*>.*?<\/span>)\n?/g, '$1') : s;
  // src: return the stored text as is (for the editor), without the markdown rendering.
  function t(p, vars, src) {
    let s = get(L[lang], p);
    if (s == null || s === '') s = get(L.en, p);
    if (s == null) { console.warn('missing i18n key:', p); return p; }
    if (vars && typeof s === 'string') for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    return src || typeof s !== 'string' ? s : md(s);
  }
  // Dark mode: saved in localStorage, toggled from the header.
  let dark = true;  // dark by default
  try { dark = localStorage.getItem('sse-dark') !== '0'; } catch (e) {}
  t.has = p => get(L[lang], p) != null || get(L.en, p) != null;

  // ───────── text edits (src/i18n/edits.js, written by serve.py) ─────────
  // Served over http: double-click a text to edit it, Enter saves, Shift+Enter new line, Esc cancels.
  // Texts with {vars} are matched as templates; the values stay as {vars} when saved. Texts with markup are edited as source.
  // Composed texts (several keys in one line) can't be edited. Same text under several keys changes them all, unless the element has data-k.
  const setp = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k] = a[k] || {}, o)[last] = v; };
  const E = window.SSE_EDITS || {};
  for (const lg in E) if (L[lg]) for (const p in E[lg]) setp(L[lg], p, E[lg][p]);
  const leaves = (o, pre, out = []) => { for (const k in o) { const v = o[k], p = pre ? pre + '.' + k : k; if (typeof v === 'string') out.push(p); else if (v && typeof v === 'object') leaves(v, p, out); } return out; };
  const norm = s => s.trim().replace(/^[—·:\s]+|[—·:\s]+$/g, '');
  const own = el => [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
  const plain = s => { const d = document.createElement('div'); d.innerHTML = s; return norm(d.textContent); };
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Each editable text: {paths, raw, re (templates only), names}
  function catalog() {
    const out = {}, tpl = [];
    for (const p of leaves(L.en, '')) {
      const raw = t(p, null, true), key = plain(md(raw));
      if (/\{\w+\}/.test(raw)) {
        const names = [...raw.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
        tpl.push({ paths: [p], raw, names, re: new RegExp('^' + esc(key).replace(/\\\{\w+\\\}/g, '(.+?)') + '$') });
      } else (out[key] = out[key] || { paths: [], raw }).paths.push(p);
    }
    return s => out[s] || tpl.find(x => x.re.test(s));
  }
  document.addEventListener('dblclick', e => {
    if (!EDIT || location.protocol === 'file:') return;
    const find = catalog();
    let el = e.target, read, hit;
    for (; el && el !== document.body; el = el.parentElement) {
      // data-k pins the keys, for texts that another key shares (e.g. two tools renamed alike).
      if (el.dataset.k) { const paths = el.dataset.k.split(' '); hit = { paths, raw: t(paths[0]) }; read = () => norm(el.textContent); break; }
      if ((hit = find(norm(el.textContent)))) { read = () => norm(el.textContent); break; }
      if ((hit = find(norm(own(el))))) {
        // Mixed element: edit only its own text, wrapped in a span, so the child elements can't be touched.
        const nodes = [...el.childNodes].filter(n => n.nodeType === 3), span = document.createElement('span');
        span.textContent = norm(own(el));
        el.insertBefore(span, nodes[0]);
        nodes.forEach(n => n.remove());
        el = span;
        read = () => norm(el.textContent);
        break;
      }
    }
    if (!hit) return;
    // Same text under several keys: keep only the keys this section uses, so boxes in different sections don't overwrite each other.
    const mine = used.get(el.closest('section.sec')?.id || (el.closest('footer') ? 'footer' : 'header'));
    const scoped = !el.dataset.k && mine ? hit.paths.filter(p => mine.has(p) || mine.has(p.replace(/\.\d+$/, ''))) : [];
    const old = read(), paths = scoped.length ? scoped : hit.paths;
    // Templates: values shown now → {vars} on save. Markup: show and save the source.
    const vals = hit.re ? old.match(hit.re).slice(1) : [];
    const toRaw = v => hit.re ? vals.reduce((s, x, i) => s.replace(x, '{' + hit.names[i] + '}'), v) : v;
    if (/</.test(hit.raw) || md(hit.raw) !== hit.raw) { el.textContent = hit.raw; read = () => el.textContent.trim(); }
    const start = read();
    el.setAttribute('contenteditable', 'true');
    el.focus();
    // Shift+Enter: new line as a plain "\n" (shown by white-space:pre-line where the block allows it).
    const nl = () => { const r = getSelection().getRangeAt(0), n = document.createTextNode('\n'); r.deleteContents(); r.insertNode(n); r.setStartAfter(n); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r); };
    // Bold: Ctrl+B or the floating B button wraps the selection in literal <b>…</b>, saved as markup (edited as source next time).
    const bold = () => { const r = getSelection().getRangeAt(0); if (r.collapsed || !el.contains(r.commonAncestorContainer)) return; const n = document.createTextNode(`<b>${r.toString()}</b>`); r.deleteContents(); r.insertNode(n); r.setStartAfter(n); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r); };
    const bb = document.createElement('button'), box = el.getBoundingClientRect();
    bb.className = 'boldbtn'; bb.textContent = 'B'; bb.style.left = box.left + 'px'; bb.style.top = Math.max(0, box.top - 30) + 'px';
    bb.addEventListener('mousedown', e => { e.preventDefault(); bold(); });
    document.body.appendChild(bb);
    const key = k => { if (k.key === 'b' && (k.ctrlKey || k.metaKey)) { k.preventDefault(); return bold(); } if (k.key === 'Enter' && k.shiftKey) { k.preventDefault(); return nl(); } if (k.key === 'Enter') { k.preventDefault(); el.blur(); } if (k.key === 'Escape') { el.dataset.cancel = 1; el.blur(); } };
    el.addEventListener('keydown', key);
    // Paste as plain text: keeps the pasted line breaks as "\n" instead of <br>/<div>, which textContent would drop.
    const paste = e => { e.preventDefault(); const r = getSelection().getRangeAt(0), n = document.createTextNode(e.clipboardData.getData('text/plain')); r.deleteContents(); r.insertNode(n); r.setStartAfter(n); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r); };
    el.addEventListener('paste', paste);
    el.addEventListener('blur', () => {
      el.removeEventListener('keydown', key);
      el.removeEventListener('paste', paste);
      bb.remove();
      const v = read();
      if (el.dataset.cancel || !v || v === start) return render();
      const edits = {};
      for (const p of paths) {
        const m = p.match(/^(.*)\.(\d+)$/);  // list item: save the whole list
        if (m) { const arr = [...t(m[1])]; arr[m[2]] = toRaw(v); edits[m[1]] = arr; setp(L[lang], m[1], arr); }
        else { edits[p] = toRaw(v); setp(L[lang], p, edits[p]); }
      }
      fetch('save', { method: 'POST', body: JSON.stringify({ lang, edits }) }).catch(err => console.error('save failed', err));
      render();
    }, { once: true });
  });

  // Sections that edit their own keys (threat rows: reorder, add, severities): update, persist, redraw.
  window.SSE_SET = edits => {
    for (const p in edits) setp(L[lang], p, edits[p]);
    if (EDIT && location.protocol !== 'file:') fetch('save', { method: 'POST', body: JSON.stringify({ lang, edits }) }).catch(err => console.error('save failed', err));
    render();
  };

  // [number shown, id, section, text key ui.<key> + optional ui.<key>p]; number null = no heading.
  const ORDER = [[1, 'problem', 'problem', 'sb'], [2, 'arch', 'arch', 's2'], [3, 'layers', 'layers', 's5'], [4, 'threats', 'threats', 's3'], [5, 'controls', 'controls', 'sk'], [6, 'tools', 'tools', 'st'], [7, 'ux', 'console', 's1'], [8, 'complexity', 'complexity', 'sv'], [9, 'considerations', 'considerations', 'sc'], [10, 'cta', 'cta', 'sa'], [11, 'sources', 'sources', 'so'], [12, 'disclaimer', 'disclaimer', 'sd']];

  // Keys each section reads (section id → Set), recorded by a wrapped t, also for texts drawn later on click.
  const used = new Map();
  const tracked = id => { const set = new Set(); used.set(id, set); return Object.assign((p, v) => (set.add(p), t(p, v)), { has: t.has }); };

  function render() {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle('dark', dark);
    document.title = t('ui.title');
    document.body.classList.remove('tracing');
    const app = $('#app'), th = tracked('header');
    app.innerHTML = `
      <header><div><div class="byline"><a href="${GITHUB}">${th('ui.author')}</a> · <a href="${CONTACT}" target="_blank" rel="noopener">${th('ui.contact')}</a> · <a href="${X_URL}" target="_blank" rel="noopener">${th('ui.x')}</a> · <span>${th('ui.date')}</span></div><h1>${th('ui.title')}</h1><p>${th('ui.subtitle')}</p></div>
        <nav class="langs">${D.LANGS.length < 2 ? '' : D.LANGS.filter(k => L[k]).map(k => `<a href="?lang=${k}" class="${k === lang ? 'on' : ''}" data-lang="${k}">${L[k].meta.name}</a>`).join('')}<button class="theme" data-theme>${dark ? '☀' : '☾'}</button></nav></header>
      <div class="kp">${D.KEYPOINTS.map(k => `<div><span><b data-k="kp.${k}.t">${th(`kp.${k}.t`)}</b><span data-k="kp.${k}.d">${th(`kp.${k}.d`)}</span></span></div>`).join('')}</div>
      <div class="exec"><h3 class="sub-h">${th('ui.exec.t')}</h3><p class="sub-p">${th('ui.exec.p')}</p></div>`;
    for (const [n, id, name, key] of ORDER) {
      const sec = document.createElement('section');
      sec.className = 'sec';
      sec.id = id;
      const ts = tracked(id);
      if (n) sec.innerHTML = `<h2><span class="n">${n}</span>${ts('ui.' + key)}</h2>` + (t.has(`ui.${key}p`) ? `<p class="sp">${ts(`ui.${key}p`)}</p>` : '');
      sec.appendChild(S[name](ts, D));
      app.appendChild(sec);
    }
    const tf = tracked('footer');
    app.insertAdjacentHTML('beforeend', `<footer class="sign"><a href="${GITHUB}">${tf('ui.author')}</a> · <a href="${CONTACT}" target="_blank" rel="noopener">${tf('ui.contact')}</a> · <a href="${X_URL}" target="_blank" rel="noopener">${tf('ui.x')}</a> · <span>${tf('ui.date')}</span><p class="about">${tf('ui.aboutp')}</p></footer>`);
    $('#lt').innerHTML = D.LAYERS.map(l => `<button class="on" data-g="${l.id}">${t(`layers.${l.id}.t`)}</button>`).join('');
    $('#ctl summary').textContent = t('ui.layers');
  }

  // Illustrative images: click opens them large; click anywhere or Esc closes.
  const zoomOff = () => document.querySelector('.zoom')?.remove();
  document.addEventListener('click', e => {
    const img = e.target.closest('.sub-img img');
    if (img) document.body.insertAdjacentHTML('beforeend', `<div class="zoom"><img src="${img.src}" alt=""></div>`);
    else if (e.target.closest('.zoom')) zoomOff();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') zoomOff(); });
  document.addEventListener('click', e => {
    const lk = e.target.closest('[data-lang]');
    if (lk) { e.preventDefault(); lang = lk.dataset.lang; localStorage.setItem('sse-lang', lang); history.replaceState(null, '', '?lang=' + lang); render(); return; }
    if (e.target.closest('[data-theme]')) { dark = !dark; localStorage.setItem('sse-dark', dark ? '1' : '0'); render(); return; }
    const g = e.target.closest('#lt button');
    if (g) { g.classList.toggle('on'); $$(`.lrow[data-l="${g.dataset.g}"]`).forEach(s => s.classList.toggle('hide', !g.classList.contains('on'))); }
  });

  render();
})();

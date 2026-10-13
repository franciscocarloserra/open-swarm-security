// 2 · How it fits together: one column of 40px boxes, read top to bottom, with a black band of controls between layers.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).arch = function (t, D) {
  const a = (k, v) => t('arch.' + k, v);
  // Boxes in NO_DESC show only their title; their description stays in i18n.
  const NO_DESC = ['human', 'orch', 'ux', 'outside', 'harness', 'contexts', 'models'];
  const box = (k, extra = '', cls = '') => `<div class="abox ${cls}"><b>${a(k + '.t')}</b>${NO_DESC.includes(k) ? '' : `<span>${a(k + '.d', { n: D.MOCK.contexts })}</span>`}${extra}</div>`;
  // Band title only; the list of controls (arch.<band>.d) is kept in i18n but not shown.
  const band = k => `<div class="ctl-band${k === 'between' ? ' crit' : ''}"><b>${a(k + '.t')}</b></div>`;
  const sample = `<span class="acells">${'<i></i>'.repeat(30)}</span>`;
  const tools = `<div class="atools"><b>${a('tools.t')}</b><div class="asub">${D.TOOLS.map(id =>
    `<span data-k="arch.tools.sub.${id} console.toolNames.${id}"${id === 'internet' ? ' class="proxy"' : D.DANGEROUS.includes(id) ? ' class="danger"' : ''}>${a('tools.sub.' + id)}</span>`).join('')}</div></div>`;
  // Side columns of black boxes: kinds of automated checks on the left, what a check can do on the right.
  const side = (k, ids, color = {}) => `<div class="aside"><b>${a(k + '.t')}</b>${ids.map(id =>
    `<div${color[id] ? ` class="ac-${color[id]}"` : ''}><b>${a(`${k}.${id}.t`)}</b></div>`).join('')}</div>`;
  const el = document.createElement('div');
  el.className = 'arch-wrap';
  el.innerHTML = `${side('ctypes', D.CONTROL_TYPES)}<div class="arch">${box('human')}<div class="arow">${box('orch')}${box('ux')}</div>
    <div class="aagent">${tools}${band('before')}${box('contexts', sample, 'actx')}</div>
    ${band('between')}${box('models')}</div>${side('actions', D.ACTIONS, D.ACTION_COLOR)}`;
  return el;
};

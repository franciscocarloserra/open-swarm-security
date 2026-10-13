// 4 · Main trade-offs (collapsed).
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).tradeoffs = function (t, D) {
  const el = document.createElement('details');
  el.className = 'tod';
  el.innerHTML = `<summary><span class="ic">⇄</span><b>${t('ui.s4')}</b><span>${t('ui.s4d')}</span></summary>
    <ol>${D.TRADEOFFS.map(k => `<li><b>${t(`tradeoffs.${k}.t`)}</b><span>${t(`tradeoffs.${k}.d`)}</span></li>`).join('')}</ol>`;
  return el;
};

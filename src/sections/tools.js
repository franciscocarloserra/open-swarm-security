// Tools in detail: one card per tool in SSE.TOOLS, side by side — name and one paragraph.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).tools = function (t, D) {
  const el = document.createElement('div');
  el.className = 'tcards';
  el.innerHTML = D.TOOLS.map(id => `<div class="tcard"><div class="tcard-h"><b data-k="console.toolNames.${id} arch.tools.sub.${id}">${t('console.toolNames.' + id)}</b></div>
      <p>${t(`toolsDetail.${id}.p`)}</p></div>`).join('');
  // Subsection under the cards: current harnesses, title + paragraph.
  // Tool Layer Proxy band above the cards, same text key as the architecture band.
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="ctl-band tl-band"><b>${t('arch.before.t')}</b></div>`;
  wrap.appendChild(el);
  wrap.insertAdjacentHTML('beforeend', `<h3 class="sub-h">${t('toolsDetail.harnesses.t')}</h3><p class="sub-p">${t('toolsDetail.harnesses.p')}</p>`);
  return wrap;
};

// Controls in detail: one card per control in SSE.CONTROLS, side by side — name and a paragraph.
// Cards are numbered C1…Cn so other sections can cite them.
// A scale above runs from proactive (left) to reactive (right), in the order of SSE.CONTROLS.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).controls = function (t, D) {
  const el = document.createElement('div');
  const s = k => t('controlsDetail.scale.' + k);
  el.innerHTML = `<div class="ctl-scale"><span>${s('pro')}</span><i></i><span>${s('re')}</span></div>
    <div class="tcards ctl-cards" style="grid-template-columns:repeat(${D.CONTROLS.length},1fr)">${D.CONTROLS.map((id, i) => `<div class="tcard${id === D.CRITICAL_CONTROL ? ' crit' : ''}"><div class="tcard-h"><span class="cnum">C${i + 1}</span><b>${t(`controlsDetail.${id}.t`)}</b></div>
      <p>${t(`controlsDetail.${id}.p`)}</p></div>`).join('')}</div>
    <div class="sub-img"><figure><img src="img/model-selection.png" alt=""><figcaption>${t('arch.modelSel.cap')}</figcaption></figure><h3 class="sub-h">${t('arch.modelSel.t')}</h3><p class="sub-p">${t('arch.modelSel.p')}</p></div>
    <div class="sub-img ctl-ex-fig"><figure><img src="img/alerts.png" alt=""><figcaption>${t('controlsDetail.examples.cap')}</figcaption></figure><h3 class="ctl-ex-h">${t('controlsDetail.examples.t')}</h3>
    <p class="ctl-ex-p">${t('controlsDetail.examples.pre')}</p></div>
    <div class="ctl-ex">${t('controlsDetail.examples.items').map(x => `<p>${x}</p>`).join('')}</div>
    <p class="ctl-ex-p">${t('controlsDetail.examples.post')}</p>
    <h3 class="sub-h">${t('controlsDetail.bitter.t')}</h3><p class="sub-p">${t('controlsDetail.bitter.p')}</p>`;
  return el;
};

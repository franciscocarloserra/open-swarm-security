// The problem: what a swarm is and why it differs from many agents. Subsection with the definition and an illustrative image on the right, text in `problem`.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).problem = function (t) {
  const el = document.createElement('div');
  el.innerHTML = `<div class="sub-img"><figure><img src="img/swarm.png" alt=""><figcaption>${t('problem.swarm.cap')}</figcaption></figure>
    <h3 class="sub-h">${t('problem.def.t')}</h3><p class="sub-p">${t('problem.def.p')}</p></div>`;
  return el;
};

// Important considerations: free text, one <p> per item of `considerations`.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).considerations = function (t) {
  const el = document.createElement('div');
  el.className = 'consid';
  // Jensen screenshot on the right; its caption key stayed under problem.def.cap, where it was edited.
  el.innerHTML = `<div class="sub-img"><figure><img src="img/problem.png" alt=""><figcaption>${t('problem.def.cap')}</figcaption></figure>` + t('considerations').map(p => `<p>${p}</p>`).join('') + '</div>';
  return el;
};

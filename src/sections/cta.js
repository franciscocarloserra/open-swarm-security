// Call to action: title and first paragraph (ui.sa, ui.sap) drawn by app.js; here the additional paragraphs.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).cta = function (t) {
  const el = document.createElement('div');
  el.innerHTML = `<p class="sp">${t('cta.p2')}</p><p class="sp">${t('cta.p3')}</p>`;
  return el;
};

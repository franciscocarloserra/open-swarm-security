// On complexity and vibing: title and paragraph (ui.sv, ui.svp) drawn by app.js; here only the screenshot, placed left of the paragraph by CSS grid.
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).complexity = function (t) {
  const el = document.createElement('div');
  el.className = 'sub-img cx-fig';
  el.innerHTML = `<figure><img src="img/complexity.png" alt=""><figcaption>${t('complexity.cap')}</figcaption></figure>`;
  return el;
};

// Actors: one table row per layer (layer, definition; the controls and trade-off columns are hidden, texts stay in i18n).
(window.SSE_SECTIONS = window.SSE_SECTIONS || {}).layers = function (t, D) {
  const col = k => t('layersTable.' + k);
  const el = document.createElement('div');
  // Layer, definition, controls, trade-off; the last three are hand-written (layersTable.rows), the old texts stay in i18n.
  const cell = (id, k) => t(`layersTable.rows.${id}.${k}`);
  el.innerHTML = `<table class="ltable"><thead><tr>${['layer', 'def'].map(k => `<th>${col(k)}</th>`).join('')}</tr></thead><tbody>
    ${D.LAYERS.map(l => `<tr class="lrow" data-l="${l.id}">
      <td><b>${t(`layers.${l.id}.t`)}</b></td>
      <td>${cell(l.id, 'd')}</td></tr>`).join('')}</tbody></table>`;
  return el;
};

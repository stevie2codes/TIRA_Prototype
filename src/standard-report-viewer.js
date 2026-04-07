import './standard-report-viewer.css';
import { getViewsForReport, saveView, applyView, getCurrentOverrides } from './saved-views.js';

export function buildStandardReportPanel(report) {
  const views = getViewsForReport(report.id);
  const defaultParams = {};
  for (const p of report.parameters) { defaultParams[p.id] = p.default; }
  return `
    <div class="sr-viewer" data-report-id="${report.id}">
      ${buildHeader(report, views)}
      ${buildFilterBar(report, defaultParams)}
      <div class="sr-viewer__body">
        ${report.sections.map(s => buildSection(s, report)).join('')}
      </div>
    </div>`;
}

function buildHeader(report, views) {
  const viewOptions = [`<option value="">Default View</option>`, ...views.map(v => `<option value="${v.id}">${v.name}</option>`)].join('');
  return `
    <div class="sr-viewer__header">
      <div class="sr-viewer__title-row">
        <span class="sr-viewer__title">${report.name}</span>
        <span class="sr-viewer__badge">Standard</span>
      </div>
      <div class="sr-viewer__actions">
        <select class="sr-viewer__view-select" data-action="view-select">${viewOptions}</select>
        <button class="sr-viewer__save-btn" data-action="save-view">Save View</button>
        <button class="sr-viewer__designer-btn" data-action="open-designer">Open in Designer</button>
        <button class="sr-viewer__close-btn" data-action="close-viewer" title="Close report">&#10005;</button>
      </div>
    </div>`;
}

function buildFilterBar(report, currentParams) {
  const filters = report.parameters.map(p => {
    const options = p.options.map(opt => `<option value="${opt}" ${currentParams[p.id] === opt ? 'selected' : ''}>${opt}</option>`).join('');
    return `<div style="display:flex;flex-direction:column;gap:2px;"><span class="sr-viewer__filter-label">${p.label}</span><select class="sr-viewer__filter-select" data-param-id="${p.id}">${options}</select></div>`;
  }).join('');
  return `<div class="sr-viewer__filters">${filters}</div>`;
}

function buildSection(section, report) {
  switch (section.type) {
    case 'kpi-row': return buildKpiRow(section);
    case 'chart': return buildChart(section, report);
    case 'table': return buildTable(section, report);
    default: return '';
  }
}

function buildKpiRow(section) {
  const kpis = section.items.map(item => `
    <div class="sr-viewer__kpi">
      <div class="sr-viewer__kpi-value sr-viewer__kpi-value--${item.color || 'primary'}">${item.value}</div>
      <div class="sr-viewer__kpi-label">${item.label}</div>
    </div>`).join('');
  return `<div class="sr-viewer__kpi-row">${kpis}</div>`;
}

function buildChart(section, report) {
  const chartData = report.data[section.dataKey] || [];
  const maxVal = Math.max(...chartData.map(d => d.value));
  const bars = chartData.map(d => {
    const heightPct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
    return `<div class="sr-viewer__bar" style="height:${heightPct}%;" title="${d.month}: ${d.value}"><span class="sr-viewer__bar-value">${d.value}</span><span class="sr-viewer__bar-label">${d.month}</span></div>`;
  }).join('');
  return `<div class="sr-viewer__chart"><div class="sr-viewer__chart-title">${section.title}</div><div class="sr-viewer__chart-container">${bars}</div></div>`;
}

function buildTable(section, report) {
  const data = report.data[section.dataKey] || [];
  const columns = section.columns || [];
  const thead = columns.map(c => `<th>${c.header}</th>`).join('');
  const tbody = data.map(row => { const cells = columns.map(c => `<td>${row[c.property] ?? ''}</td>`).join(''); return `<tr>${cells}</tr>`; }).join('');
  return `<div class="sr-viewer__table-section"><div class="sr-viewer__table-title">${section.title}</div><table class="sr-viewer__table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
}

function simulateFilteredData(report, currentParams) {
  const paramStr = Object.values(currentParams).join('|');
  let hash = 0;
  for (let i = 0; i < paramStr.length; i++) { hash = ((hash << 5) - hash) + paramStr.charCodeAt(i); hash |= 0; }
  const isDefault = report.parameters.every(p => currentParams[p.id] === p.default);
  if (isDefault) return { sections: report.sections, data: report.data };
  const multiplier = 0.3 + (Math.abs(hash % 60) / 100);
  const sections = report.sections.map(s => {
    if (s.type === 'kpi-row') {
      return { ...s, items: s.items.map((item, idx) => {
        const numMatch = item.value.match(/([\d,.]+)/);
        if (!numMatch) return item;
        const origNum = parseFloat(numMatch[1].replace(/,/g, ''));
        const varied = Math.round(origNum * (multiplier + (idx * 0.1)));
        const prefix = item.value.match(/^[^0-9]*/)[0];
        const suffix = item.value.match(/[^0-9]*$/)[0];
        const formatted = varied >= 1000 ? varied.toLocaleString() : String(varied);
        return { ...item, value: `${prefix}${formatted}${suffix}` };
      })};
    }
    return s;
  });
  const data = {};
  for (const [key, rows] of Object.entries(report.data)) {
    data[key] = rows.map((row, ri) => {
      const newRow = { ...row };
      for (const [prop, val] of Object.entries(newRow)) {
        if (typeof val === 'number') { const variance = 1 + ((hash + ri) % 40 - 20) / 100; newRow[prop] = Math.round(val * multiplier * variance); }
      }
      return newRow;
    });
  }
  return { sections, data };
}

function updateReportBody(panelEl, report, currentParams) {
  const body = panelEl.querySelector('.sr-viewer__body');
  if (!body) return;
  const { sections, data } = simulateFilteredData(report, currentParams);
  const simulatedReport = { ...report, sections, data };
  body.innerHTML = sections.map(s => buildSection(s, simulatedReport)).join('');
}

export function wireStandardReportPanel(panelEl, report, callbacks = {}) {
  let currentParams = {};
  for (const p of report.parameters) { currentParams[p.id] = p.default; }

  const filterSelects = panelEl.querySelectorAll('.sr-viewer__filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', () => {
      const paramId = select.dataset.paramId;
      currentParams[paramId] = select.value;
      updateReportBody(panelEl, report, currentParams);
      if (callbacks.onFilterChange) callbacks.onFilterChange(paramId, select.value, { ...currentParams });
    });
  });

  const viewSelect = panelEl.querySelector('[data-action="view-select"]');
  if (viewSelect) {
    viewSelect.addEventListener('change', () => {
      const viewId = viewSelect.value;
      const views = getViewsForReport(report.id);
      const view = views.find(v => v.id === viewId) || null;
      currentParams = applyView(report, view);
      filterSelects.forEach(select => { const paramId = select.dataset.paramId; if (currentParams[paramId] !== undefined) select.value = currentParams[paramId]; });
      updateReportBody(panelEl, report, currentParams);
      if (callbacks.onViewChange) callbacks.onViewChange(view, { ...currentParams });
    });
  }

  const saveBtn = panelEl.querySelector('[data-action="save-view"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showSaveViewDialog(report, currentParams, (newView) => {
        if (viewSelect) { const option = document.createElement('option'); option.value = newView.id; option.textContent = newView.name; viewSelect.appendChild(option); viewSelect.value = newView.id; }
        if (callbacks.onViewSaved) callbacks.onViewSaved(newView);
      });
    });
  }

  const closeBtn = panelEl.querySelector('[data-action="close-viewer"]');
  if (closeBtn) { closeBtn.addEventListener('click', () => { if (callbacks.onClose) callbacks.onClose(); }); }

  const designerBtn = panelEl.querySelector('[data-action="open-designer"]');
  if (designerBtn) { designerBtn.addEventListener('click', () => { if (callbacks.onOpenDesigner) callbacks.onOpenDesigner({ ...currentParams }); }); }

  return {
    setParam(paramId, value) {
      currentParams[paramId] = value;
      const select = panelEl.querySelector(`.sr-viewer__filter-select[data-param-id="${paramId}"]`);
      if (select) select.value = value;
      updateReportBody(panelEl, report, currentParams);
    },
    getParams() { return { ...currentParams }; }
  };
}

function showSaveViewDialog(report, currentParams, onSave) {
  const overrides = getCurrentOverrides(report, currentParams);
  const overrideLabels = Object.entries(overrides).map(([key, val]) => { const param = report.parameters.find(p => p.id === key); return param ? `${param.label}: ${val}` : `${key}: ${val}`; });
  const overlay = document.createElement('div');
  overlay.className = 'sr-viewer__save-dialog-overlay';
  overlay.innerHTML = `
    <div class="sr-viewer__save-dialog">
      <h3>Save View</h3>
      <input type="text" placeholder="View name (e.g., My Q1 Downtown View)" autofocus />
      <div class="sr-viewer__save-dialog-hint">${overrideLabels.length > 0 ? `Saves: ${overrideLabels.join(', ')}` : 'No filter changes from default — adjust filters first.'}</div>
      <div class="sr-viewer__save-dialog-actions"><button data-action="cancel">Cancel</button><button data-action="confirm" class="primary">Save</button></div>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('input');
  const cancelBtn = overlay.querySelector('[data-action="cancel"]');
  const confirmBtn = overlay.querySelector('[data-action="confirm"]');
  cancelBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  confirmBtn.addEventListener('click', () => { const name = input.value.trim(); if (!name) { input.focus(); return; } const view = saveView(report.id, name, overrides); overlay.remove(); onSave(view); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmBtn.click(); if (e.key === 'Escape') overlay.remove(); });
}

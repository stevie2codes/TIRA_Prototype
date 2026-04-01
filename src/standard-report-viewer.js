// src/standard-report-viewer.js
import './standard-report-viewer.css';
import { getViewsForReport, saveView, applyView, getCurrentOverrides } from './saved-views.js';

export function buildStandardReportPanel(report) {
  const views = getViewsForReport(report.id);
  const defaultParams = {};
  for (const p of report.parameters) {
    defaultParams[p.id] = p.default;
  }

  return `
    <div class="sr-viewer" data-report-id="${report.id}">
      ${buildHeader(report, views)}
      ${buildFilterBar(report, defaultParams)}
      <div class="sr-viewer__body">
        ${report.sections.map(s => buildSection(s, report)).join('')}
      </div>
    </div>
  `;
}

function buildHeader(report, views) {
  const viewOptions = [
    `<option value="">Default View</option>`,
    ...views.map(v => `<option value="${v.id}">${v.name}</option>`)
  ].join('');

  return `
    <div class="sr-viewer__header">
      <div class="sr-viewer__title-row">
        <span class="sr-viewer__title">${report.name}</span>
        <span class="sr-viewer__badge">Standard</span>
      </div>
      <div class="sr-viewer__actions">
        <select class="sr-viewer__view-select" data-action="view-select">
          ${viewOptions}
        </select>
        <button class="sr-viewer__save-btn" data-action="save-view">Save View</button>
        <div class="sr-viewer__report-actions-wrap">
          <button class="sr-viewer__report-actions-btn" data-action="report-actions">
            <forge-icon name="more_vert"></forge-icon>
            <span>Report Actions</span>
            <forge-icon name="arrow_drop_down" class="sr-viewer__dropdown-arrow"></forge-icon>
          </button>
          <div class="sr-viewer__report-actions-dropdown" data-state="closed">
            <button class="sr-viewer__dropdown-item" type="button" data-report-action="open-designer">
              <div class="sr-viewer__dropdown-item-row">
                <forge-icon name="open_in_new"></forge-icon>
                <span class="sr-viewer__dropdown-item-label">Open in Designer</span>
              </div>
              <span class="sr-viewer__dropdown-item-desc">Edit layout and structure</span>
            </button>
            <button class="sr-viewer__dropdown-item" type="button" data-report-action="export">
              <div class="sr-viewer__dropdown-item-row">
                <forge-icon name="file_download"></forge-icon>
                <span class="sr-viewer__dropdown-item-label">Export</span>
              </div>
              <span class="sr-viewer__dropdown-item-desc">Download as PDF, CSV, or Excel</span>
            </button>
            <button class="sr-viewer__dropdown-item" type="button" data-report-action="schedule">
              <div class="sr-viewer__dropdown-item-row">
                <forge-icon name="schedule"></forge-icon>
                <span class="sr-viewer__dropdown-item-label">Schedule</span>
              </div>
              <span class="sr-viewer__dropdown-item-desc">Set up recurring delivery</span>
            </button>
            <button class="sr-viewer__dropdown-item" type="button" data-report-action="share">
              <div class="sr-viewer__dropdown-item-row">
                <forge-icon name="share"></forge-icon>
                <span class="sr-viewer__dropdown-item-label">Share</span>
              </div>
              <span class="sr-viewer__dropdown-item-desc">Send to colleagues or teams</span>
            </button>
            <button class="sr-viewer__dropdown-item" type="button" data-report-action="print">
              <div class="sr-viewer__dropdown-item-row">
                <forge-icon name="print"></forge-icon>
                <span class="sr-viewer__dropdown-item-label">Print</span>
              </div>
              <span class="sr-viewer__dropdown-item-desc">Print-ready formatted output</span>
            </button>
          </div>
        </div>
        <button class="sr-viewer__close-btn" data-action="close-viewer" title="Close report">&#10005;</button>
      </div>
    </div>
  `;
}

function buildFilterBar(report, currentParams) {
  const activeCount = report.parameters.filter(p => currentParams[p.id] !== p.default).length;
  const activeLabel = activeCount > 0 ? `${activeCount} active` : '';

  const filters = report.parameters.map(p => {
    const options = p.options.map(opt =>
      `<option value="${opt}" ${currentParams[p.id] === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');
    return `
      <div class="sr-viewer__filter-item">
        <span class="sr-viewer__filter-label">${p.label}</span>
        <select class="sr-viewer__filter-select" data-param-id="${p.id}">
          ${options}
        </select>
      </div>
    `;
  }).join('');

  return `
    <div class="sr-viewer__filter-bar">
      <button class="sr-viewer__filter-toggle" data-action="toggle-filters">
        <span>Filters &amp; Parameters</span>
        ${activeLabel ? `<span class="sr-viewer__filter-count">${activeLabel}</span>` : ''}
        <span class="sr-viewer__filter-chevron">&#9660;</span>
      </button>
      <div class="sr-viewer__filter-panel" data-state="collapsed">
        <div class="sr-viewer__filter-grid">
          ${filters}
        </div>
      </div>
    </div>
  `;
}

function buildSection(section, report) {
  switch (section.type) {
    case 'kpi-row': return buildKpiRow(section);
    case 'chart': return buildChart(section, report);
    case 'table': return buildTable(section, report);
    case 'report-header': return buildReportHeader(section);
    case 'grouped-table': return buildGroupedTable(section, report);
    case 'summary-row': return buildSummaryRow(section);
    default: return '';
  }
}

function buildKpiRow(section) {
  const kpis = section.items.map(item => `
    <div class="sr-viewer__kpi">
      <div class="sr-viewer__kpi-value sr-viewer__kpi-value--${item.color || 'primary'}">${item.value}</div>
      <div class="sr-viewer__kpi-label">${item.label}</div>
    </div>
  `).join('');
  return `<div class="sr-viewer__kpi-row">${kpis}</div>`;
}

function buildChart(section, report) {
  const chartData = report.data[section.dataKey] || [];
  const maxVal = Math.max(...chartData.map(d => d.value));
  const bars = chartData.map(d => {
    const heightPct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
    return `
      <div class="sr-viewer__bar" style="height: ${heightPct}%;" title="${d.month}: ${d.value}">
        <span class="sr-viewer__bar-value">${d.value}</span>
        <span class="sr-viewer__bar-label">${d.month}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="sr-viewer__chart">
      <div class="sr-viewer__chart-title">${section.title}</div>
      <div class="sr-viewer__chart-container">${bars}</div>
    </div>
  `;
}

function buildTable(section, report) {
  const data = report.data[section.dataKey] || [];
  const columns = section.columns || [];

  const thead = columns.map(c => `<th>${c.header}</th>`).join('');
  const tbody = data.map(row => {
    const cells = columns.map(c => `<td>${row[c.property] ?? ''}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="sr-viewer__table-section">
      <div class="sr-viewer__table-title">${section.title}</div>
      <table class="sr-viewer__table">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;
}

function buildReportHeader(section) {
  const fields = section.fields.map(f => `
    <div class="sr-viewer__rh-field">
      <span class="sr-viewer__rh-label">${f.label}</span>
      <span class="sr-viewer__rh-value">${f.value}</span>
    </div>
  `).join('');

  return `
    <div class="sr-viewer__report-header">
      ${section.title ? `<div class="sr-viewer__rh-title">${section.title}</div>` : ''}
      <div class="sr-viewer__rh-fields">${fields}</div>
    </div>
  `;
}

function buildGroupedTable(section, report) {
  const groups = section.groups || [];
  const columns = section.columns || [];
  const thead = columns.map(c => `<th>${c.header}</th>`).join('');

  const groupsHtml = groups.map(group => {
    const rows = (report.data[group.dataKey] || []).map(row => {
      const cells = columns.map(c => {
        const val = row[c.property] ?? '';
        const cls = c.align === 'right' ? ' class="sr-viewer__td--right"' : '';
        return `<td${cls}>${val}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const subtotalCells = group.subtotal
      ? columns.map(c => {
          const val = group.subtotal[c.property] ?? '';
          const cls = c.align === 'right' ? ' sr-viewer__td--right' : '';
          return `<td class="sr-viewer__subtotal${cls}">${val}</td>`;
        }).join('')
      : '';

    return `
      <tr class="sr-viewer__group-header">
        <td colspan="${columns.length}">${group.label}</td>
      </tr>
      ${rows}
      ${subtotalCells ? `<tr class="sr-viewer__subtotal-row">${subtotalCells}</tr>` : ''}
    `;
  }).join('');

  return `
    <div class="sr-viewer__table-section">
      ${section.title ? `<div class="sr-viewer__table-title">${section.title}</div>` : ''}
      <table class="sr-viewer__table sr-viewer__table--grouped">
        <thead><tr>${thead}</tr></thead>
        <tbody>${groupsHtml}</tbody>
      </table>
    </div>
  `;
}

function buildSummaryRow(section) {
  const items = section.items.map(item => `
    <div class="sr-viewer__summary-item">
      <span class="sr-viewer__summary-label">${item.label}</span>
      <span class="sr-viewer__summary-value">${item.value}</span>
    </div>
  `).join('');

  return `
    <div class="sr-viewer__summary-row">
      ${items}
    </div>
  `;
}

/**
 * Simulates data changes when filters are modified.
 * Applies a deterministic variance to numeric values based on the parameter combo.
 */
function simulateFilteredData(report, currentParams) {
  // Create a simple hash from current params to generate consistent variations
  const paramStr = Object.values(currentParams).join('|');
  let hash = 0;
  for (let i = 0; i < paramStr.length; i++) {
    hash = ((hash << 5) - hash) + paramStr.charCodeAt(i);
    hash |= 0;
  }

  const isDefault = report.parameters.every(p => currentParams[p.id] === p.default);
  if (isDefault) return { sections: report.sections, data: report.data };

  // Generate a multiplier between 0.3 and 0.9 based on hash
  const multiplier = 0.3 + (Math.abs(hash % 60) / 100);

  // Clone sections with adjusted KPI values
  const sections = report.sections.map(s => {
    if (s.type === 'kpi-row') {
      return {
        ...s,
        items: s.items.map((item, idx) => {
          const numMatch = item.value.match(/([\d,.]+)/);
          if (!numMatch) return item;
          const origNum = parseFloat(numMatch[1].replace(/,/g, ''));
          const varied = Math.round(origNum * (multiplier + (idx * 0.1)));
          const prefix = item.value.match(/^[^0-9]*/)[0];
          const suffix = item.value.match(/[^0-9]*$/)[0];
          const formatted = varied >= 1000 ? varied.toLocaleString() : String(varied);
          return { ...item, value: `${prefix}${formatted}${suffix}` };
        })
      };
    }
    return s;
  });

  // Clone data with varied numeric values
  const data = {};
  for (const [key, rows] of Object.entries(report.data)) {
    data[key] = rows.map((row, ri) => {
      const newRow = { ...row };
      for (const [prop, val] of Object.entries(newRow)) {
        if (typeof val === 'number') {
          const variance = 1 + ((hash + ri) % 40 - 20) / 100;
          newRow[prop] = Math.round(val * multiplier * variance);
        }
      }
      return newRow;
    });
  }

  return { sections, data };
}

function updateFilterCount(panelEl, report, currentParams) {
  const countEl = panelEl.querySelector('.sr-viewer__filter-count');
  const activeCount = report.parameters.filter(p => currentParams[p.id] !== p.default).length;
  if (countEl) {
    countEl.textContent = activeCount > 0 ? `${activeCount} active` : '';
    countEl.style.display = activeCount > 0 ? '' : 'none';
  }
}

/**
 * Re-renders the report body (KPIs, charts, tables) with simulated filtered data.
 */
function updateReportBody(panelEl, report, currentParams) {
  const body = panelEl.querySelector('.sr-viewer__body');
  if (!body) return;

  const { sections, data } = simulateFilteredData(report, currentParams);
  const simulatedReport = { ...report, sections, data };

  body.innerHTML = sections.map(s => buildSection(s, simulatedReport)).join('');
}

export function wireStandardReportPanel(panelEl, report, callbacks = {}) {
  let currentParams = {};
  for (const p of report.parameters) {
    currentParams[p.id] = p.default;
  }

  // Wire filter toggle
  const filterToggle = panelEl.querySelector('[data-action="toggle-filters"]');
  const filterPanel = panelEl.querySelector('.sr-viewer__filter-panel');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const isCollapsed = filterPanel.dataset.state === 'collapsed';
      filterPanel.dataset.state = isCollapsed ? 'expanded' : 'collapsed';
      filterToggle.querySelector('.sr-viewer__filter-chevron').textContent = isCollapsed ? '\u25B2' : '\u25BC';
    });
  }

  // Wire filter dropdowns
  const filterSelects = panelEl.querySelectorAll('.sr-viewer__filter-select');
  filterSelects.forEach(select => {
    select.addEventListener('change', () => {
      const paramId = select.dataset.paramId;
      currentParams[paramId] = select.value;
      updateReportBody(panelEl, report, currentParams);
      updateFilterCount(panelEl, report, currentParams);
      if (callbacks.onFilterChange) {
        callbacks.onFilterChange(paramId, select.value, { ...currentParams });
      }
    });
  });

  // Wire view dropdown
  const viewSelect = panelEl.querySelector('[data-action="view-select"]');
  if (viewSelect) {
    viewSelect.addEventListener('change', () => {
      const viewId = viewSelect.value;
      const views = getViewsForReport(report.id);
      const view = views.find(v => v.id === viewId) || null;
      currentParams = applyView(report, view);

      // Update filter dropdowns to reflect view
      filterSelects.forEach(select => {
        const paramId = select.dataset.paramId;
        if (currentParams[paramId] !== undefined) {
          select.value = currentParams[paramId];
        }
      });

      updateReportBody(panelEl, report, currentParams);

      if (callbacks.onViewChange) {
        callbacks.onViewChange(view, { ...currentParams });
      }
    });
  }

  // Wire save view button
  const saveBtn = panelEl.querySelector('[data-action="save-view"]');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      showSaveViewDialog(panelEl, report, currentParams, (newView) => {
        // Add new option to view dropdown
        if (viewSelect) {
          const option = document.createElement('option');
          option.value = newView.id;
          option.textContent = newView.name;
          viewSelect.appendChild(option);
          viewSelect.value = newView.id;
        }
        if (callbacks.onViewSaved) {
          callbacks.onViewSaved(newView);
        }
      });
    });
  }

  // Wire close button
  const closeBtn = panelEl.querySelector('[data-action="close-viewer"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (callbacks.onClose) callbacks.onClose();
    });
  }

  // Wire Report Actions dropdown
  const reportActionsBtn = panelEl.querySelector('[data-action="report-actions"]');
  const reportActionsDropdown = panelEl.querySelector('.sr-viewer__report-actions-dropdown');
  if (reportActionsBtn && reportActionsDropdown) {
    reportActionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = reportActionsDropdown.dataset.state === 'open';
      reportActionsDropdown.dataset.state = isOpen ? 'closed' : 'open';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      reportActionsDropdown.dataset.state = 'closed';
    });

    // Action item clicks with brief feedback
    const actionLabel = reportActionsBtn.querySelector('span');
    panelEl.querySelectorAll('[data-report-action]').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.reportAction;
        reportActionsDropdown.dataset.state = 'closed';

        if (action === 'open-designer') {
          if (callbacks.onOpenDesigner) callbacks.onOpenDesigner({ ...currentParams });
          return;
        }

        const feedbackMap = {
          export: 'Exporting…',
          schedule: 'Scheduled!',
          share: 'Shared!',
          print: 'Printing…'
        };
        actionLabel.textContent = feedbackMap[action] || 'Done!';
        reportActionsBtn.classList.add('sr-viewer__report-actions-btn--success');
        setTimeout(() => {
          actionLabel.textContent = 'Report Actions';
          reportActionsBtn.classList.remove('sr-viewer__report-actions-btn--success');
        }, 1500);
      });
    });
  }

  // Return a function to update filters programmatically (for AI chat sync)
  return {
    setParam(paramId, value) {
      currentParams[paramId] = value;
      const select = panelEl.querySelector(`.sr-viewer__filter-select[data-param-id="${paramId}"]`);
      if (select) select.value = value;
      // Re-render report body with simulated data
      updateReportBody(panelEl, report, currentParams);
    },
    getParams() {
      return { ...currentParams };
    }
  };
}

function showSaveViewDialog(panelEl, report, currentParams, onSave) {
  const overrides = getCurrentOverrides(report, currentParams);
  const overrideLabels = Object.entries(overrides).map(([key, val]) => {
    const param = report.parameters.find(p => p.id === key);
    return param ? `${param.label}: ${val}` : `${key}: ${val}`;
  });

  const overlay = document.createElement('div');
  overlay.className = 'sr-viewer__save-dialog-overlay';
  overlay.innerHTML = `
    <div class="sr-viewer__save-dialog">
      <h3>Save View</h3>
      <input type="text" placeholder="View name (e.g., My Q1 Downtown View)" autofocus />
      <div class="sr-viewer__save-dialog-hint">
        ${overrideLabels.length > 0
          ? `Saves: ${overrideLabels.join(', ')}`
          : 'No filter changes from default — adjust filters first.'}
      </div>
      <div class="sr-viewer__save-dialog-actions">
        <button data-action="cancel">Cancel</button>
        <button data-action="confirm" class="primary">Save</button>
      </div>
    </div>
  `;

  // Append inside the forge-dialog so the overlay renders above the modal
  const dialogHost = panelEl.closest('forge-dialog') || document.body;
  dialogHost.appendChild(overlay);

  const input = overlay.querySelector('input');
  const cancelBtn = overlay.querySelector('[data-action="cancel"]');
  const confirmBtn = overlay.querySelector('[data-action="confirm"]');

  cancelBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  confirmBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const view = saveView(report.id, name, overrides);
    overlay.remove();
    onSave(view);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmBtn.click();
    if (e.key === 'Escape') overlay.remove();
  });
}

// ---------------------------------------------------------------------------
// Parameter Configuration Panel
// ---------------------------------------------------------------------------

/**
 * Builds and shows a configuration panel for a standard report.
 * User selects a saved config (or default), adjusts parameters, then
 * chooses "Preview Report" or "Open in Chat".
 *
 * @param {Object} report - The standard report definition
 * @param {Object} callbacks - { onPreview(params), onOpenInChat(params), onClose() }
 */
export function showConfigPanel(report, callbacks = {}) {
  const views = getViewsForReport(report.id);

  // Start with default params
  let currentParams = {};
  for (const p of report.parameters) {
    currentParams[p.id] = p.default;
  }

  const overlay = document.createElement('div');
  overlay.className = 'sr-config__overlay';
  overlay.innerHTML = `
    <div class="sr-config__panel">
      <div class="sr-config__header">
        <div>
          <div class="sr-config__title">${report.name}</div>
          <div class="sr-config__subtitle">${report.description}</div>
        </div>
        <button class="sr-config__close" title="Close">&#10005;</button>
      </div>

      <div class="sr-config__body">
        <div class="sr-config__section">
          <label class="sr-config__label">Configuration</label>
          <select class="sr-config__config-select">
            <option value="">Default Settings</option>
            ${views.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
          </select>
        </div>

        <div class="sr-config__divider"></div>

        <div class="sr-config__section">
          <label class="sr-config__label">Parameters</label>
          <div class="sr-config__params">
            ${report.parameters.map(p => `
              <div class="sr-config__param">
                <label class="sr-config__param-label">${p.label}</label>
                <select class="sr-config__param-select" data-param-id="${p.id}">
                  ${p.options.map(opt =>
                    `<option value="${opt}" ${currentParams[p.id] === opt ? 'selected' : ''}>${opt}</option>`
                  ).join('')}
                </select>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sr-config__meta">
          <span>${report.freshness}</span>
          <span>${report.parameters.length} parameters</span>
          <span>${report.sections.length} sections</span>
        </div>
      </div>

      <div class="sr-config__actions">
        <button class="sr-config__btn sr-config__btn--secondary" data-action="open-in-chat">
          <span>Open in Chat</span>
        </button>
        <button class="sr-config__btn sr-config__btn--primary" data-action="preview">
          <span>Preview Report</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // --- Wire interactions ---

  const closeBtn = overlay.querySelector('.sr-config__close');
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    if (callbacks.onClose) callbacks.onClose();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (callbacks.onClose) callbacks.onClose();
    }
  });

  // Config dropdown → pre-fill params
  const configSelect = overlay.querySelector('.sr-config__config-select');
  const paramSelects = overlay.querySelectorAll('.sr-config__param-select');

  configSelect.addEventListener('change', () => {
    const viewId = configSelect.value;
    const view = views.find(v => v.id === viewId) || null;
    currentParams = applyView(report, view);

    // Update all param dropdowns
    paramSelects.forEach(select => {
      const paramId = select.dataset.paramId;
      if (currentParams[paramId] !== undefined) {
        select.value = currentParams[paramId];
      }
    });
  });

  // Param dropdowns → update currentParams
  paramSelects.forEach(select => {
    select.addEventListener('change', () => {
      currentParams[select.dataset.paramId] = select.value;
    });
  });

  // Action buttons
  overlay.querySelector('[data-action="preview"]').addEventListener('click', () => {
    overlay.remove();
    if (callbacks.onPreview) callbacks.onPreview({ ...currentParams });
  });

  overlay.querySelector('[data-action="open-in-chat"]').addEventListener('click', () => {
    overlay.remove();
    if (callbacks.onOpenInChat) callbacks.onOpenInChat({ ...currentParams });
  });
}

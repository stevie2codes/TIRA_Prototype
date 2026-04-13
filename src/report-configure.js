import { outputTemplates, getTemplateById } from './output-templates.js';
import './report-configure.css';

/**
 * Creates the report configuration state object from a suggestion.
 * This object is passed through all three modes (Explore → Configure → Publish).
 */
export function createReportConfig(suggestion) {
  return {
    name: suggestion.reportTitle || '',
    query: suggestion.sqlCode || '',
    columns: (suggestion.columns || []).map(col => ({
      property: col.property,
      header: col.header,
      displayName: col.header,
      visible: true,
      sortable: col.sortable ?? true,
    })),
    parameters: [
      { id: 'district', label: 'District', value: 'All Districts', fixed: false, defaultValue: 'All Districts' },
      { id: 'month', label: 'Month', value: 'All Months', fixed: false, defaultValue: 'All Months' },
      { id: 'permitType', label: 'Permit Type', value: 'All Types', fixed: false, defaultValue: 'All Types' },
    ],
    template: null,
    description: '',
    category: '',
    tags: [],
    visibility: 'only-me',
    roles: [],
    schedule: null,
    data: suggestion.data || [],
    dataSource: suggestion.dataSource || '',
    freshness: suggestion.freshness || '',
  };
}

/**
 * Cross-fades the right panel content from old to new.
 */
export function transitionMode(container, newContent) {
  const oldContent = container.firstElementChild;
  if (oldContent) {
    oldContent.style.transition = 'opacity 0.2s ease';
    oldContent.style.opacity = '0';
    setTimeout(() => {
      oldContent.remove();
      newContent.style.opacity = '0';
      container.appendChild(newContent);
      requestAnimationFrame(() => {
        newContent.style.transition = 'opacity 0.2s ease';
        newContent.style.opacity = '1';
      });
    }, 200);
  } else {
    container.appendChild(newContent);
  }
}

/**
 * Builds the Configure mode panel.
 * @param {Object} config - Report configuration state object
 * @param {Object} callbacks - { onBack: fn, onPublish: fn }
 * @returns {HTMLElement}
 */
export function buildConfigureMode(config, callbacks) {
  const panel = document.createElement('div');
  panel.className = 'configure-panel';

  // === Header: editable name + metadata ===
  const header = document.createElement('div');
  header.className = 'configure-header';
  header.innerHTML = `
    <input class="configure-name-input" type="text" value="${escapeAttr(config.name)}" placeholder="Report name..." />
    <div class="configure-meta">
      <forge-icon name="database_outline"></forge-icon>
      <span>${config.dataSource}</span>
      <span class="configure-meta-dot"></span>
      <span>${config.freshness}</span>
    </div>
  `;
  panel.appendChild(header);

  const nameInput = header.querySelector('.configure-name-input');
  nameInput.addEventListener('input', () => {
    config.name = nameInput.value;
    updatePublishBtn();
  });

  // === Tab bar ===
  const tabBarContainer = document.createElement('div');
  tabBarContainer.className = 'configure-tabs';
  const tabBar = document.createElement('forge-tab-bar');
  tabBar.setAttribute('active-tab', '0');
  tabBar.setAttribute('clustered', '');
  tabBar.innerHTML = `
    <forge-tab>Query</forge-tab>
    <forge-tab>Columns</forge-tab>
    <forge-tab>Parameters</forge-tab>
    <forge-tab>Template</forge-tab>
    <forge-tab>Details</forge-tab>
  `;
  tabBarContainer.appendChild(tabBar);
  panel.appendChild(tabBarContainer);

  // === Tab content ===
  const tabContent = document.createElement('div');
  tabContent.className = 'configure-tab-content';

  // --- Query tab ---
  const queryPanel = document.createElement('div');
  queryPanel.className = 'configure-tab-panel configure-tab-panel--active';
  queryPanel.dataset.tab = '0';
  queryPanel.innerHTML = `
    <div class="configure-sql-editor">
      <textarea spellcheck="false">${escapeHtml(config.query)}</textarea>
    </div>
    <button class="configure-run-btn" type="button">
      <forge-icon name="play_arrow"></forge-icon>
      Run Query
    </button>
  `;
  tabContent.appendChild(queryPanel);

  const sqlTextarea = queryPanel.querySelector('textarea');
  sqlTextarea.addEventListener('input', () => { config.query = sqlTextarea.value; });

  const runBtn = queryPanel.querySelector('.configure-run-btn');
  runBtn.addEventListener('click', () => {
    runBtn.innerHTML = '<forge-icon name="check"></forge-icon> Results updated';
    runBtn.style.background = '#4caf50';
    setTimeout(() => {
      runBtn.innerHTML = '<forge-icon name="play_arrow"></forge-icon> Run Query';
      runBtn.style.background = '';
    }, 1500);
  });

  // --- Columns tab ---
  const columnsPanel = document.createElement('div');
  columnsPanel.className = 'configure-tab-panel';
  columnsPanel.dataset.tab = '1';
  const columnList = document.createElement('div');
  columnList.className = 'configure-column-list';
  config.columns.forEach((col, i) => {
    const row = document.createElement('div');
    row.className = 'configure-column-row';
    row.innerHTML = `
      <div class="configure-column-drag"><forge-icon name="drag_indicator"></forge-icon></div>
      <input class="configure-column-name" type="text" value="${escapeAttr(col.displayName)}" data-index="${i}" />
      ${col.displayName !== col.header ? `<span class="configure-column-original">(${escapeHtml(col.header)})</span>` : ''}
      <button class="configure-visibility-toggle ${col.visible ? '' : 'hidden'}" type="button" data-index="${i}" title="${col.visible ? 'Hide column' : 'Show column'}">
        <forge-icon name="${col.visible ? 'visibility' : 'visibility_off'}"></forge-icon>
      </button>
    `;
    columnList.appendChild(row);
  });
  columnsPanel.appendChild(columnList);
  tabContent.appendChild(columnsPanel);

  columnList.addEventListener('input', (e) => {
    if (e.target.classList.contains('configure-column-name')) {
      const idx = parseInt(e.target.dataset.index);
      config.columns[idx].displayName = e.target.value;
    }
  });

  columnList.addEventListener('click', (e) => {
    const toggle = e.target.closest('.configure-visibility-toggle');
    if (!toggle) return;
    const idx = parseInt(toggle.dataset.index);
    config.columns[idx].visible = !config.columns[idx].visible;
    toggle.classList.toggle('hidden');
    const icon = toggle.querySelector('forge-icon');
    icon.name = config.columns[idx].visible ? 'visibility' : 'visibility_off';
    toggle.title = config.columns[idx].visible ? 'Hide column' : 'Show column';
  });

  // --- Parameters tab ---
  const paramsPanel = document.createElement('div');
  paramsPanel.className = 'configure-tab-panel';
  paramsPanel.dataset.tab = '2';
  const paramList = document.createElement('div');
  paramList.className = 'configure-param-list';
  config.parameters.forEach((param, i) => {
    const card = document.createElement('div');
    card.className = 'configure-param-card';
    card.innerHTML = `
      <div class="configure-param-header">
        <span class="configure-param-name">${escapeHtml(param.label)}</span>
        <div class="configure-param-type-toggle">
          <button class="configure-param-type-btn ${param.fixed ? 'active' : ''}" data-index="${i}" data-type="fixed" type="button">Fixed</button>
          <button class="configure-param-type-btn ${!param.fixed ? 'active' : ''}" data-index="${i}" data-type="adjustable" type="button">User-adjustable</button>
        </div>
      </div>
      <div class="configure-param-fields" style="${!param.fixed ? '' : 'display:none'}">
        <div class="configure-param-field">
          <label>Display Label</label>
          <input type="text" value="${escapeAttr(param.label)}" data-index="${i}" data-field="label" />
        </div>
        <div class="configure-param-field">
          <label>Default Value</label>
          <input type="text" value="${escapeAttr(param.defaultValue)}" data-index="${i}" data-field="default" />
        </div>
      </div>
    `;
    paramList.appendChild(card);
  });
  paramsPanel.appendChild(paramList);
  tabContent.appendChild(paramsPanel);

  paramList.addEventListener('click', (e) => {
    const btn = e.target.closest('.configure-param-type-btn');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index);
    const type = btn.dataset.type;
    config.parameters[idx].fixed = type === 'fixed';
    const card = btn.closest('.configure-param-card');
    card.querySelectorAll('.configure-param-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const fields = card.querySelector('.configure-param-fields');
    fields.style.display = type === 'fixed' ? 'none' : '';
  });

  paramList.addEventListener('input', (e) => {
    const input = e.target;
    if (!input.dataset.field) return;
    const idx = parseInt(input.dataset.index);
    if (input.dataset.field === 'label') config.parameters[idx].label = input.value;
    if (input.dataset.field === 'default') config.parameters[idx].defaultValue = input.value;
  });

  // --- Template tab ---
  const templatePanel = document.createElement('div');
  templatePanel.className = 'configure-tab-panel';
  templatePanel.dataset.tab = '3';
  const templateGrid = document.createElement('div');
  templateGrid.className = 'configure-template-grid';

  const noTplCard = document.createElement('div');
  noTplCard.className = `configure-template-card no-template ${config.template === null ? 'selected' : ''}`;
  noTplCard.dataset.templateId = '';
  noTplCard.innerHTML = `
    <div class="configure-template-preview"><span>No template</span></div>
    <div class="configure-template-info">
      <div class="configure-template-name">Plain data</div>
      <div class="configure-template-desc">No branding applied</div>
    </div>
  `;
  templateGrid.appendChild(noTplCard);

  outputTemplates.forEach(tpl => {
    const card = document.createElement('div');
    card.className = `configure-template-card ${config.template === tpl.id ? 'selected' : ''}`;
    card.dataset.templateId = tpl.id;
    card.innerHTML = `
      <div class="configure-template-preview">
        <div class="configure-template-preview-header" style="background:${tpl.header.background};">
          <forge-icon name="${tpl.logo}"></forge-icon>
          ${escapeHtml(tpl.name)}
        </div>
        <div class="configure-template-preview-body" style="background:${tpl.theme.surface};">
          <div class="configure-template-preview-row" style="background:${tpl.theme.tableBorder};"></div>
          <div class="configure-template-preview-row" style="background:${tpl.theme.tableStripe};"></div>
          <div class="configure-template-preview-row" style="background:${tpl.theme.tableBorder};"></div>
        </div>
      </div>
      <div class="configure-template-info">
        <div class="configure-template-name">${escapeHtml(tpl.name)}</div>
        <div class="configure-template-desc">${escapeHtml(tpl.description)}</div>
      </div>
    `;
    templateGrid.appendChild(card);
  });
  templatePanel.appendChild(templateGrid);
  tabContent.appendChild(templatePanel);

  templateGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.configure-template-card');
    if (!card) return;
    templateGrid.querySelectorAll('.configure-template-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    config.template = card.dataset.templateId || null;
  });

  // --- Details tab ---
  const detailsPanel = document.createElement('div');
  detailsPanel.className = 'configure-tab-panel';
  detailsPanel.dataset.tab = '4';
  detailsPanel.innerHTML = `
    <div class="configure-details-form">
      <div class="configure-field-group">
        <label>Description</label>
        <textarea placeholder="What does this report show and why?">${escapeHtml(config.description)}</textarea>
      </div>
      <div class="configure-field-group">
        <label>Category</label>
        <select>
          <option value="" ${config.category === '' ? 'selected' : ''}>Select a category...</option>
          <option value="building" ${config.category === 'building' ? 'selected' : ''}>Building</option>
          <option value="public-safety" ${config.category === 'public-safety' ? 'selected' : ''}>Public Safety</option>
          <option value="finance" ${config.category === 'finance' ? 'selected' : ''}>Finance</option>
          <option value="code-enforcement" ${config.category === 'code-enforcement' ? 'selected' : ''}>Code Enforcement</option>
          <option value="planning" ${config.category === 'planning' ? 'selected' : ''}>Planning & Zoning</option>
          <option value="utilities" ${config.category === 'utilities' ? 'selected' : ''}>Utilities</option>
          <option value="general" ${config.category === 'general' ? 'selected' : ''}>General</option>
        </select>
      </div>
      <div class="configure-field-group">
        <label>Tags</label>
        <div class="configure-tags-input">
          <input class="configure-tags-field" type="text" placeholder="Type and press Enter..." />
        </div>
      </div>
    </div>
  `;
  tabContent.appendChild(detailsPanel);

  const descTextarea = detailsPanel.querySelector('textarea');
  descTextarea.addEventListener('input', () => { config.description = descTextarea.value; });

  const categorySelect = detailsPanel.querySelector('select');
  categorySelect.addEventListener('change', () => { config.category = categorySelect.value; });

  const tagsContainer = detailsPanel.querySelector('.configure-tags-input');
  const tagsField = detailsPanel.querySelector('.configure-tags-field');

  function renderTags() {
    tagsContainer.querySelectorAll('.configure-tag').forEach(t => t.remove());
    config.tags.forEach((tag, i) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'configure-tag';
      tagEl.innerHTML = `${escapeHtml(tag)} <button class="configure-tag-remove" type="button" data-index="${i}">&times;</button>`;
      tagsContainer.insertBefore(tagEl, tagsField);
    });
  }

  tagsField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && tagsField.value.trim()) {
      e.preventDefault();
      config.tags.push(tagsField.value.trim());
      tagsField.value = '';
      renderTags();
    } else if (e.key === 'Backspace' && !tagsField.value && config.tags.length) {
      config.tags.pop();
      renderTags();
    }
  });

  tagsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.configure-tag-remove');
    if (!removeBtn) return;
    config.tags.splice(parseInt(removeBtn.dataset.index), 1);
    renderTags();
  });

  panel.appendChild(tabContent);

  // === Wire tab switching ===
  tabBar.addEventListener('forge-tab-bar-change', (e) => {
    const idx = e.detail.index;
    tabContent.querySelectorAll('.configure-tab-panel').forEach(p => p.classList.remove('configure-tab-panel--active'));
    const target = tabContent.querySelector(`.configure-tab-panel[data-tab="${idx}"]`);
    if (target) target.classList.add('configure-tab-panel--active');
  });

  // === Collapsible data preview ===
  const previewSection = document.createElement('div');
  previewSection.className = 'configure-preview-section';
  previewSection.innerHTML = `
    <button class="configure-preview-toggle" type="button">
      <span>Data Preview (${config.data.length} rows)</span>
      <forge-icon name="expand_more"></forge-icon>
    </button>
    <div class="configure-preview-body"></div>
  `;
  panel.appendChild(previewSection);

  const previewToggle = previewSection.querySelector('.configure-preview-toggle');
  const previewBody = previewSection.querySelector('.configure-preview-body');
  previewToggle.addEventListener('click', () => {
    previewToggle.classList.toggle('expanded');
    previewBody.classList.toggle('open');

    if (previewBody.classList.contains('open') && !previewBody.querySelector('forge-table')) {
      const table = document.createElement('forge-table');
      table.setAttribute('dense', '');
      table.setAttribute('fixed-headers', '');
      previewBody.appendChild(table);
      requestAnimationFrame(() => {
        table.columnConfigurations = config.columns
          .filter(c => c.visible)
          .map(c => ({ property: c.property, header: c.displayName, sortable: c.sortable }));
        table.data = config.data;
      });
    }
  });

  // === Footer ===
  const footer = document.createElement('div');
  footer.className = 'configure-footer';
  footer.innerHTML = `
    <button class="configure-footer-back" type="button">
      <forge-icon name="arrow_back"></forge-icon>
      Back to Explore
    </button>
    <button class="configure-footer-primary" type="button">
      <forge-icon name="publish"></forge-icon>
      Publish
    </button>
  `;
  panel.appendChild(footer);

  const publishBtn = footer.querySelector('.configure-footer-primary');
  function updatePublishBtn() {
    publishBtn.disabled = !config.name.trim();
  }
  updatePublishBtn();

  footer.querySelector('.configure-footer-back').addEventListener('click', () => {
    if (callbacks.onBack) callbacks.onBack();
  });

  publishBtn.addEventListener('click', () => {
    if (config.name.trim() && callbacks.onPublish) callbacks.onPublish();
  });

  return panel;
}

/**
 * Builds the Publish mode panel.
 * @param {Object} config - Report configuration state object
 * @param {Object} callbacks - { onBack, onClose, onViewLibrary }
 * @returns {HTMLElement}
 */
export function buildPublishMode(config, callbacks) {
  const panel = document.createElement('div');
  panel.className = 'publish-panel';

  const header = document.createElement('div');
  header.className = 'publish-header';
  header.innerHTML = `
    <div class="publish-report-name">${escapeHtml(config.name)}</div>
    <div class="publish-meta">
      ${config.category ? `<span class="publish-meta-badge">${escapeHtml(config.category)}</span>` : ''}
      ${config.template ? `<span class="publish-meta-badge"><forge-icon name="palette"></forge-icon> ${escapeHtml(config.template)}</span>` : ''}
      <span class="publish-meta-badge"><forge-icon name="database_outline"></forge-icon> ${escapeHtml(config.dataSource)}</span>
    </div>
  `;
  panel.appendChild(header);

  const body = document.createElement('div');
  body.className = 'publish-body';

  const permSection = document.createElement('div');
  permSection.className = 'publish-section';
  permSection.innerHTML = `
    <div class="publish-section-title">
      <forge-icon name="lock"></forge-icon>
      Permissions
    </div>
    <select class="publish-visibility-select">
      <option value="only-me" ${config.visibility === 'only-me' ? 'selected' : ''}>Only me (draft)</option>
      <option value="everyone" ${config.visibility === 'everyone' ? 'selected' : ''}>Everyone in my organization</option>
      <option value="specific-roles" ${config.visibility === 'specific-roles' ? 'selected' : ''}>Specific roles</option>
    </select>
    <div class="publish-roles-list" style="display:none;">
      <label class="publish-role-checkbox"><input type="checkbox" value="building-dept" /> Building Department</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="planning-dept" /> Planning & Zoning</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="finance-dept" /> Finance</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="public-safety" /> Public Safety</label>
      <label class="publish-role-checkbox"><input type="checkbox" value="admin" /> Administrators</label>
    </div>
  `;
  body.appendChild(permSection);

  const visSelect = permSection.querySelector('.publish-visibility-select');
  const rolesList = permSection.querySelector('.publish-roles-list');
  visSelect.addEventListener('change', () => {
    config.visibility = visSelect.value;
    rolesList.style.display = visSelect.value === 'specific-roles' ? '' : 'none';
  });

  rolesList.addEventListener('change', () => {
    config.roles = Array.from(rolesList.querySelectorAll('input:checked')).map(cb => cb.value);
  });

  const schedSection = document.createElement('div');
  schedSection.className = 'publish-section';
  schedSection.innerHTML = `
    <div class="publish-schedule-toggle">
      <div class="publish-section-title" style="margin-bottom:0;">
        <forge-icon name="schedule"></forge-icon>
        Recurring Delivery
      </div>
      <forge-icon name="expand_more" class="schedule-expand-icon"></forge-icon>
    </div>
    <div class="publish-schedule-fields">
      <div class="publish-schedule-row">
        <label>Frequency</label>
        <select class="schedule-frequency">
          <option value="daily">Daily</option>
          <option value="weekly" selected>Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div class="publish-schedule-row">
        <label>Day</label>
        <select class="schedule-day">
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
        </select>
      </div>
      <div class="publish-schedule-row">
        <label>Time</label>
        <input type="time" value="08:00" class="schedule-time" />
      </div>
      <div class="publish-schedule-row">
        <label>Delivery</label>
        <select class="schedule-delivery">
          <option value="email">Email</option>
          <option value="in-app">In-app notification</option>
        </select>
      </div>
    </div>
  `;
  body.appendChild(schedSection);

  const schedToggle = schedSection.querySelector('.publish-schedule-toggle');
  const schedFields = schedSection.querySelector('.publish-schedule-fields');
  const schedIcon = schedSection.querySelector('.schedule-expand-icon');
  let scheduleEnabled = false;

  schedToggle.addEventListener('click', () => {
    scheduleEnabled = !scheduleEnabled;
    schedFields.classList.toggle('open');
    schedIcon.style.transform = scheduleEnabled ? 'rotate(180deg)' : '';
    schedIcon.style.transition = 'transform 0.2s ease';
    if (!scheduleEnabled) {
      config.schedule = null;
    } else {
      config.schedule = {
        frequency: schedSection.querySelector('.schedule-frequency').value,
        day: schedSection.querySelector('.schedule-day').value,
        time: schedSection.querySelector('.schedule-time').value,
        delivery: schedSection.querySelector('.schedule-delivery').value,
      };
    }
  });

  schedFields.addEventListener('change', () => {
    if (scheduleEnabled) {
      config.schedule = {
        frequency: schedSection.querySelector('.schedule-frequency').value,
        day: schedSection.querySelector('.schedule-day').value,
        time: schedSection.querySelector('.schedule-time').value,
        delivery: schedSection.querySelector('.schedule-delivery').value,
      };
    }
  });

  panel.appendChild(body);

  const footer = document.createElement('div');
  footer.className = 'configure-footer';
  footer.innerHTML = `
    <button class="configure-footer-back" type="button">
      <forge-icon name="arrow_back"></forge-icon>
      Back to Configure
    </button>
    <button class="configure-footer-primary" type="button">
      <forge-icon name="publish"></forge-icon>
      Publish to Library
    </button>
  `;
  panel.appendChild(footer);

  footer.querySelector('.configure-footer-back').addEventListener('click', () => {
    if (callbacks.onBack) callbacks.onBack();
  });

  footer.querySelector('.configure-footer-primary').addEventListener('click', () => {
    showPublishConfirmation(panel, config, callbacks);
  });

  return panel;
}

/**
 * Replaces the publish panel content with a success confirmation.
 */
function showPublishConfirmation(panel, config, callbacks) {
  panel.innerHTML = '';
  const confirmation = document.createElement('div');
  confirmation.className = 'publish-confirmation';
  confirmation.innerHTML = `
    <div class="publish-confirmation-icon">
      <forge-icon name="check_circle"></forge-icon>
    </div>
    <div class="publish-confirmation-title">Report published</div>
    <div class="publish-confirmation-name">${escapeHtml(config.name)}</div>
    <div class="publish-confirmation-actions">
      <button class="publish-confirmation-btn secondary" type="button" data-action="close">Close</button>
      <button class="publish-confirmation-btn primary" type="button" data-action="library">View in Library</button>
    </div>
  `;
  panel.appendChild(confirmation);

  confirmation.querySelector('[data-action="close"]').addEventListener('click', () => {
    if (callbacks.onClose) callbacks.onClose();
  });

  confirmation.querySelector('[data-action="library"]').addEventListener('click', () => {
    if (callbacks.onViewLibrary) callbacks.onViewLibrary();
  });
}

/** Escapes HTML entities */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Escapes a string for use in an HTML attribute */
function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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

const STORAGE_KEY = 'tira-saved-views';
let views = loadFromStorage();

function loadFromStorage() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultViews();
  } catch { return getDefaultViews(); }
}

function persist() { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(views)); }

function getDefaultViews() {
  return [
    { id: 'view-demo-1', reportId: 'quarterly-permit-summary', name: 'Downtown Residential Only', createdBy: 'sarah.webb', parameterOverrides: { district: 'Downtown', permitType: 'Residential' } },
    { id: 'view-demo-2', reportId: 'monthly-code-violations', name: 'Open Violations - Riverside', createdBy: 'sarah.webb', parameterOverrides: { neighborhood: 'Riverside', resolution: 'Open' } }
  ];
}

export function getViewsForReport(reportId) { return views.filter(v => v.reportId === reportId); }

export function saveView(reportId, name, parameterOverrides) {
  const view = { id: `view-${Date.now()}`, reportId, name, createdBy: 'sarah.webb', parameterOverrides: { ...parameterOverrides } };
  views.push(view);
  persist();
  return view;
}

export function deleteView(viewId) { views = views.filter(v => v.id !== viewId); persist(); }

export function applyView(report, view) {
  const params = {};
  for (const param of report.parameters) {
    params[param.id] = view && view.parameterOverrides[param.id] !== undefined ? view.parameterOverrides[param.id] : param.default;
  }
  return params;
}

export function getCurrentOverrides(report, currentParams) {
  const overrides = {};
  for (const param of report.parameters) {
    if (currentParams[param.id] !== param.default) overrides[param.id] = currentParams[param.id];
  }
  return overrides;
}

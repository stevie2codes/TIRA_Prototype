// Hardcoded source catalog for the Data Layer's left palette.
// Mirrors the domain catalog in /src/user-context.js but adds source type + identifier.

export const sourceCatalog = [
  {
    system: 'EPL',
    sources: [
      { id: 'permit_applications', label: 'permit_applications', type: 'table', rowCount: 24128, description: 'All permit application records' },
      { id: 'inspection_results',  label: 'inspection_results',  type: 'table', rowCount: 8912,  description: 'Inspection outcomes per permit' },
      { id: 'citizen_complaints',  label: 'citizen_complaints',  type: 'view',  rowCount: 3210,  description: 'Citizen-filed complaint records' },
      { id: 'code_violations',     label: 'code_violations',     type: 'table', rowCount: 1845,  description: 'Recorded code violations' },
    ],
  },
  {
    system: 'ERP',
    sources: [
      { id: 'department_budgets',  label: 'department_budgets',  type: 'stored_proc', rowCount: 124, description: 'Department budget allocations' },
      { id: 'budget_actuals',      label: 'budget_actuals',      type: 'table',       rowCount: 5230, description: 'Actual spend per budget line' },
      { id: 'employee_roster',     label: 'employee_roster',     type: 'view',        rowCount: 412,  description: 'Active employees' },
    ],
  },
  {
    system: 'Courts',
    sources: [
      { id: 'court_cases',         label: 'court_cases',         type: 'table', rowCount: 18402, description: 'Filed court cases' },
      { id: 'court_dockets',       label: 'court_dockets',       type: 'view',  rowCount: 9120,  description: 'Active dockets' },
    ],
  },
];

export function findSource(sourceId) {
  for (const group of sourceCatalog) {
    const hit = group.sources.find(s => s.id === sourceId);
    if (hit) return { ...hit, system: group.system };
  }
  return null;
}

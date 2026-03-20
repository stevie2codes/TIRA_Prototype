/**
 * Static mock data service — replaces the gov-data-generator API
 * so the prototype works standalone without a backend.
 */

const MOCK_TYPES = [
  { type: 'departments', label: 'Departments', category: 'Reference', description: 'Government department directory', fieldCount: 3 },
  { type: 'budget_items', label: 'Budget Items', category: 'Finance', description: 'Annual budget allocations by department', fieldCount: 4 },
  { type: 'actuals', label: 'Actuals', category: 'Finance', description: 'Actual spend by department', fieldCount: 5 },
  { type: 'permits', label: 'Building Permits', category: 'Licensing', description: 'Permits issued and inspected', fieldCount: 6 },
  { type: 'citizens', label: 'Citizens', category: 'Reference', description: 'Resident records', fieldCount: 5 },
  { type: 'code_violations', label: 'Code Violations', category: 'Enforcement', description: 'Code enforcement cases', fieldCount: 7 },
];

const MOCK_ROWS = {
  departments: [
    { id: 1, name: 'Public Works', division: 'Infrastructure' },
    { id: 2, name: 'Parks & Recreation', division: 'Community' },
    { id: 3, name: 'Police', division: 'Public Safety' },
    { id: 4, name: 'Fire & Rescue', division: 'Public Safety' },
    { id: 5, name: 'Administration', division: 'General Government' },
    { id: 6, name: 'Planning & Zoning', division: 'Development' },
  ],
  budget_items: [
    { department_id: 1, fiscal_year: 2026, budgeted_amount: 2800000, category: 'Personnel' },
    { department_id: 1, fiscal_year: 2026, budgeted_amount: 1500000, category: 'Operations' },
    { department_id: 2, fiscal_year: 2026, budgeted_amount: 1200000, category: 'Personnel' },
    { department_id: 2, fiscal_year: 2026, budgeted_amount: 600000, category: 'Operations' },
    { department_id: 3, fiscal_year: 2026, budgeted_amount: 3500000, category: 'Personnel' },
    { department_id: 3, fiscal_year: 2026, budgeted_amount: 900000, category: 'Operations' },
  ],
  actuals: [
    { department_id: 1, fiscal_year: 2026, spent_amount: 2650000, category: 'Personnel', month: 'Q1-Q3' },
    { department_id: 1, fiscal_year: 2026, spent_amount: 1380000, category: 'Operations', month: 'Q1-Q3' },
    { department_id: 2, fiscal_year: 2026, spent_amount: 1100000, category: 'Personnel', month: 'Q1-Q3' },
    { department_id: 2, fiscal_year: 2026, spent_amount: 580000, category: 'Operations', month: 'Q1-Q3' },
    { department_id: 3, fiscal_year: 2026, spent_amount: 3400000, category: 'Personnel', month: 'Q1-Q3' },
    { department_id: 3, fiscal_year: 2026, spent_amount: 950000, category: 'Operations', month: 'Q1-Q3' },
  ],
  permits: [
    { id: 'P-001', type: 'Residential', status: 'Approved', district: 'North', date: '2026-01-15', value: 45000 },
    { id: 'P-002', type: 'Commercial', status: 'Pending', district: 'Central', date: '2026-02-03', value: 120000 },
    { id: 'P-003', type: 'Residential', status: 'Approved', district: 'South', date: '2026-02-18', value: 38000 },
    { id: 'P-004', type: 'Renovation', status: 'Approved', district: 'East', date: '2026-03-01', value: 22000 },
  ],
  citizens: [
    { id: 1, name: 'Jane Doe', address: '123 Main St', district: 'North', registered: true },
    { id: 2, name: 'John Smith', address: '456 Oak Ave', district: 'Central', registered: true },
    { id: 3, name: 'Maria Garcia', address: '789 Elm Dr', district: 'South', registered: false },
  ],
  code_violations: [
    { id: 'CV-001', type: 'Overgrown Lot', priority: 'Low', status: 'Open', zone: 'R-1', inspector: 'Adams', date: '2026-01-10' },
    { id: 'CV-002', type: 'Illegal Dumping', priority: 'High', status: 'Cited', zone: 'C-2', inspector: 'Baker', date: '2026-01-22' },
    { id: 'CV-003', type: 'Building Without Permit', priority: 'High', status: 'Open', zone: 'R-2', inspector: 'Adams', date: '2026-02-05' },
  ],
};

export async function fetchDataTypes() {
  // Simulate async
  return Promise.resolve(MOCK_TYPES);
}

export async function fetchSchema(type) {
  const rows = MOCK_ROWS[type] || [];
  const fields = rows.length > 0 ? Object.keys(rows[0]).map(k => ({ key: k, label: k })) : [];
  const meta = MOCK_TYPES.find(t => t.type === type) || { type, label: type, category: '', description: '' };
  return Promise.resolve({ ...meta, fields });
}

export async function fetchData(type, count = 50, fields = []) {
  let rows = MOCK_ROWS[type] || [];
  if (fields.length > 0) {
    rows = rows.map(row => {
      const filtered = {};
      fields.forEach(f => { if (f in row) filtered[f] = row[f]; });
      return filtered;
    });
  }
  return Promise.resolve(rows.slice(0, count));
}

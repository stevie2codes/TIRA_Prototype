// Field schemas per source. Each field carries: name, displayName, type, role, description.
// role: 'dimension' | 'measure'
// type: 'string' | 'number' | 'date' | 'currency' | 'enum'

export const sourceSchemas = {
  permit_applications: [
    { name: 'id',              displayName: 'Permit ID',         type: 'string',   role: 'dimension', description: 'Unique permit identifier' },
    { name: 'type',            displayName: 'Permit Type',       type: 'enum',     role: 'dimension', description: 'Residential, commercial, etc.' },
    { name: 'value',           displayName: 'Permit Value',      type: 'currency', role: 'measure',   description: 'Declared project value in USD' },
    { name: 'issued_date',     displayName: 'Issued Date',       type: 'date',     role: 'dimension', description: 'Date permit was issued' },
    { name: 'applied_date',    displayName: 'Applied Date',      type: 'date',     role: 'dimension', description: 'Date permit was applied for' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
    { name: 'status',          displayName: 'Status',            type: 'enum',     role: 'dimension', description: 'Application status' },
    { name: 'fee',             displayName: 'Permit Fee',        type: 'currency', role: 'measure',   description: 'Fee collected at issuance' },
  ],
  department_budgets: [
    { name: 'id',              displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'Unique department identifier' },
    { name: 'name',            displayName: 'Department Name',   type: 'string',   role: 'dimension', description: 'Department display name' },
    { name: 'budget_amount',   displayName: 'Budget Amount',     type: 'currency', role: 'measure',   description: 'Allocated budget for the fiscal year' },
    { name: 'population',      displayName: 'Population Served', type: 'number',   role: 'measure',   description: 'Population in service area' },
    { name: 'fiscal_year',     displayName: 'Fiscal Year',       type: 'number',   role: 'dimension', description: 'Fiscal year' },
  ],
  inspection_results: [
    { name: 'id',              displayName: 'Inspection ID',     type: 'string',   role: 'dimension', description: 'Unique inspection identifier' },
    { name: 'permit_id',       displayName: 'Permit ID',         type: 'string',   role: 'dimension', description: 'FK to permit' },
    { name: 'result',          displayName: 'Result',            type: 'enum',     role: 'dimension', description: 'Pass / fail / re-inspect' },
    { name: 'inspection_date', displayName: 'Inspection Date',   type: 'date',     role: 'dimension', description: 'Date of inspection' },
  ],
  citizen_complaints: [
    { name: 'id',              displayName: 'Complaint ID',      type: 'string',   role: 'dimension', description: 'Unique complaint identifier' },
    { name: 'status',          displayName: 'Status',            type: 'enum',     role: 'dimension', description: 'Open / closed / in-progress' },
    { name: 'filed_date',      displayName: 'Filed Date',        type: 'date',     role: 'dimension', description: 'Date complaint was filed' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
  ],
  code_violations: [
    { name: 'id',              displayName: 'Violation ID',      type: 'string',   role: 'dimension', description: 'Unique violation identifier' },
    { name: 'category',        displayName: 'Category',          type: 'enum',     role: 'dimension', description: 'Violation category' },
    { name: 'fine_amount',     displayName: 'Fine Amount',       type: 'currency', role: 'measure',   description: 'Fine assessed' },
    { name: 'issued_date',     displayName: 'Issued Date',       type: 'date',     role: 'dimension', description: 'Date violation issued' },
  ],
  budget_actuals: [
    { name: 'id',              displayName: 'Line ID',           type: 'string',   role: 'dimension', description: 'Budget line identifier' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
    { name: 'actual_amount',   displayName: 'Actual Amount',     type: 'currency', role: 'measure',   description: 'Spend to date' },
    { name: 'period',          displayName: 'Period',            type: 'date',     role: 'dimension', description: 'Reporting period' },
  ],
  employee_roster: [
    { name: 'id',              displayName: 'Employee ID',       type: 'string',   role: 'dimension', description: 'Unique employee identifier' },
    { name: 'department_id',   displayName: 'Department ID',     type: 'string',   role: 'dimension', description: 'FK to department' },
    { name: 'role',            displayName: 'Role',              type: 'string',   role: 'dimension', description: 'Job title' },
  ],
  court_cases: [
    { name: 'id',              displayName: 'Case ID',           type: 'string',   role: 'dimension', description: 'Case identifier' },
    { name: 'status',          displayName: 'Status',            type: 'enum',     role: 'dimension', description: 'Open / closed / appealed' },
    { name: 'filed_date',      displayName: 'Filed Date',        type: 'date',     role: 'dimension', description: 'Date case filed' },
  ],
  court_dockets: [
    { name: 'id',              displayName: 'Docket ID',         type: 'string',   role: 'dimension', description: 'Docket identifier' },
    { name: 'case_id',         displayName: 'Case ID',           type: 'string',   role: 'dimension', description: 'FK to case' },
    { name: 'scheduled_date',  displayName: 'Scheduled Date',    type: 'date',     role: 'dimension', description: 'Scheduled hearing date' },
  ],
};

export function getSchemaFor(sourceId) {
  return sourceSchemas[sourceId] || [];
}

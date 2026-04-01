/**
 * User context service — provides the current user profile,
 * role-based data source permissions, and personalization signals.
 */

export const currentUser = {
  id: 'usr-swebb',
  name: 'Sarah Webb',
  firstName: 'Sarah',
  role: 'Senior Planner',
  department: 'Community Development',
  title: 'Senior Planner — Community Development',
  avatar: 'SW',
};

/**
 * Product domains — top-level LoB systems.
 * Each domain contains datasets (the old "data sources").
 */
export const domains = [
  {
    id: 'epl',
    label: 'EPL',
    fullLabel: 'Enterprise Permitting & Licensing',
    icon: 'description',
    departments: ['Community Development', 'Planning', 'Code Enforcement', 'Public Works'],
    datasets: [
      { id: 'permits-licensing', label: 'Permits', icon: 'description' },
      { id: 'code-enforcement', label: 'Code Enforcement', icon: 'gavel' },
      { id: 'licensing', label: 'Licensing', icon: 'verified' },
      { id: 'inspections', label: 'Inspections', icon: 'checklist' },
    ],
  },
  {
    id: 'erp',
    label: 'ERP',
    fullLabel: 'Enterprise Resource Planning',
    icon: 'account_balance',
    departments: ['Finance', 'Admin & Finance', 'Community Development', 'Public Works', 'Capital Projects', 'Human Resources', 'Utilities'],
    datasets: [
      { id: 'financial', label: 'Finance', icon: 'account_balance' },
      { id: 'hr-payroll', label: 'HR & Payroll', icon: 'people' },
      { id: 'utilities', label: 'Utilities', icon: 'water' },
      { id: 'purchasing', label: 'Purchasing', icon: 'shopping_cart' },
    ],
  },
  {
    id: 'courts',
    label: 'Courts & Justice',
    fullLabel: 'Courts & Justice',
    icon: 'shield',
    departments: ['Public Safety', 'Justice', 'Legal', 'Community Development'],
    datasets: [
      { id: 'justice', label: 'Cases', icon: 'shield' },
      { id: 'arrests', label: 'Arrests', icon: 'report' },
      { id: 'warrants', label: 'Warrants', icon: 'assignment_late' },
      { id: 'dockets', label: 'Dockets', icon: 'event_note' },
    ],
  },
];

/**
 * Backward-compatible: flat list of all data sources (datasets) for code that still uses it.
 */
export const dataSources = domains.flatMap(d =>
  d.datasets.map(ds => ({ ...ds, domainId: d.id, departments: d.departments }))
);

/**
 * Returns domains visible to the current user based on their department.
 */
export function getVisibleDomains(user = currentUser) {
  return domains.filter(d => d.departments.includes(user.department));
}

/**
 * Returns data sources visible to the current user based on their department.
 */
export function getVisibleSources(user = currentUser) {
  return dataSources.filter(src =>
    src.departments.includes(user.department)
  );
}

/**
 * Maps old domain IDs from standard-reports to the new domain system.
 */
export const datasetToDomain = {
  'permits-licensing': 'epl',
  'code-enforcement': 'epl',
  'licensing': 'epl',
  'inspections': 'epl',
  'financial': 'erp',
  'hr-payroll': 'erp',
  'utilities': 'erp',
  'purchasing': 'erp',
  'justice': 'courts',
  'arrests': 'courts',
  'warrants': 'courts',
  'dockets': 'courts',
};

/**
 * Common questions per dataset — ad-hoc starting prompts for the "Ask a Question" tab.
 */
export const commonQuestions = {
  'permits-licensing': [
    { label: 'How many permits were issued this quarter?', suggestionIndex: 0 },
    { label: 'What are the average permit processing times by type?', query: 'What are the average permit processing times by type?' },
    { label: 'Show me all pending permit applications', query: 'Show me all pending permit applications' },
    { label: 'Top contractors by permit volume this year', query: 'Top contractors by permit volume this year' },
  ],
  'code-enforcement': [
    { label: 'Show me open violations by zone', suggestionIndex: 1 },
    { label: 'Which code inspections are overdue?', query: 'Which code inspections are overdue?' },
    { label: 'Average resolution time by violation type', query: 'Average resolution time by violation type' },
  ],
  'financial': [
    { label: 'Budget vs. actuals this fiscal year', suggestionIndex: 2 },
    { label: 'Revenue collected vs. projected this quarter', query: 'Revenue collected vs. projected this quarter' },
    { label: 'Outstanding purchase orders over $10K', query: 'Show outstanding purchase orders over $10K' },
  ],
  'hr-payroll': [
    { label: 'Current employee headcount by department', query: 'Current employee headcount by department' },
    { label: 'Overtime hours by department this month', query: 'Overtime hours by department this month' },
  ],
  'utilities': [
    { label: 'Accounts past due over 60 days', query: 'Accounts past due over 60 days' },
    { label: 'Water consumption trends by district', query: 'Water consumption trends by district this quarter' },
  ],
  'justice': [
    { label: 'Active cases by type and status', suggestionIndex: 3 },
    { label: 'Cases with upcoming court dates this week', query: 'Upcoming court dates this week' },
    { label: 'Case dispositions this month', suggestionIndex: 4 },
  ],
};

/**
 * Get common questions for an entire domain (aggregates all its datasets).
 */
export function getQuestionsForDomain(domainId) {
  const domain = domains.find(d => d.id === domainId);
  if (!domain) return [];
  const questions = [];
  for (const ds of domain.datasets) {
    const qs = commonQuestions[ds.id] || [];
    questions.push(...qs.map(q => ({ ...q, datasetId: ds.id, datasetLabel: ds.label })));
  }
  return questions;
}

/**
 * Default task-based suggestions shown when no domain is selected.
 */
export const defaultTaskSuggestions = [
  { label: "What needs my attention today?", icon: 'flag', type: 'task' },
  { label: "Show me what's overdue", icon: 'warning', type: 'task' },
  { label: "What changed since yesterday?", icon: 'update', type: 'task' },
];

/**
 * Filters standard reports by the current user's department visibility.
 * Uses the dataset's parent domain to determine access.
 */
export function getVisibleStandardReports(reports, user = currentUser) {
  return reports.filter(report => {
    const domainId = datasetToDomain[report.domain];
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.departments.includes(user.department) : false;
  });
}

/**
 * Get standard reports for a specific domain.
 */
export function getStandardReportsForDomain(reports, domainId) {
  return reports.filter(report => datasetToDomain[report.domain] === domainId);
}

/**
 * Recent activity for the current user — simulated session history.
 */
export const recentActivity = [
  {
    timestamp: '2026-03-20T14:22:00Z',
    label: 'Building Permits by Month — Downtown Only',
    type: 'saved_report',
    datasetId: 'permits-licensing',
    domainId: 'epl',
    timeAgo: '2h ago',
  },
  {
    timestamp: '2026-03-20T09:15:00Z',
    label: 'Code Violations Summary',
    type: 'suggestion',
    datasetId: 'code-enforcement',
    domainId: 'epl',
    suggestionIndex: 1,
    timeAgo: 'This morning',
  },
  {
    timestamp: '2026-03-19T16:40:00Z',
    label: 'Budget vs. Actuals — FY2025',
    type: 'saved_report',
    datasetId: 'financial',
    domainId: 'erp',
    timeAgo: 'Yesterday',
  },
  {
    timestamp: '2026-03-18T11:00:00Z',
    label: 'Active Cases by Status',
    type: 'suggestion',
    datasetId: 'justice',
    domainId: 'courts',
    suggestionIndex: 3,
    timeAgo: '2 days ago',
  },
];

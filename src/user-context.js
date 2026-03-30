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
 * Data sources the system knows about, with role-based visibility.
 * Each source has an id, label, icon, and which departments/roles can see it.
 */
export const dataSources = [
  {
    id: 'permits-licensing',
    label: 'Permits & Licensing',
    icon: 'description',
    departments: ['Community Development', 'Planning', 'Code Enforcement', 'Public Works'],
  },
  {
    id: 'code-enforcement',
    label: 'Code Enforcement',
    icon: 'gavel',
    departments: ['Code Enforcement', 'Community Development', 'Planning'],
  },
  {
    id: 'financial',
    label: 'Financial Management',
    icon: 'account_balance',
    departments: ['Finance', 'Admin & Finance', 'Community Development', 'Public Works', 'Capital Projects'],
  },
  {
    id: 'gis',
    label: 'GIS & Mapping',
    icon: 'map',
    departments: ['Community Development', 'Planning', 'Public Works', 'Code Enforcement', 'Capital Projects'],
  },
  {
    id: 'justice',
    label: 'Justice & Public Safety',
    icon: 'shield',
    departments: ['Public Safety', 'Justice', 'Legal', 'Community Development'],
  },
  {
    id: 'utilities',
    label: 'Utilities & Billing',
    icon: 'water',
    departments: ['Utilities', 'Public Works', 'Finance'],
  },
  {
    id: 'hr-payroll',
    label: 'HR & Payroll',
    icon: 'people',
    departments: ['Human Resources', 'Admin & Finance'],
  },
];

/**
 * Returns data sources visible to the current user based on their department.
 */
export function getVisibleSources(user = currentUser) {
  return dataSources.filter(src =>
    src.departments.includes(user.department)
  );
}

/**
 * Source-specific suggestions — when a user selects a data source,
 * these suggestions populate the chips.
 * Each maps a source id to an array of { label, query, suggestionIndex? }
 * suggestionIndex links to the full suggestion in mock-data for chat flow.
 */
export const sourceSuggestions = {
  'permits-licensing': [
    { label: 'Building permits by month', suggestionIndex: 0 },
    { label: 'Permit processing times', query: 'What are the average permit processing times by type?' },
    { label: 'Pending permit applications', query: 'Show me all pending permit applications' },
    { label: 'Permits by contractor', query: 'Top contractors by permit volume this year' },
    { label: 'Daily inspection queue', query: 'What inspections are scheduled for today?' },
  ],
  'code-enforcement': [
    { label: 'Violations summary', suggestionIndex: 1 },
    { label: 'Open cases by zone', query: 'Show me open violations grouped by enforcement zone' },
    { label: 'Overdue inspections', query: 'Which code inspections are overdue?' },
    { label: 'Resolution times by type', query: 'Average resolution time by violation type' },
    { label: 'Weekly ward failures', query: 'Failed inspections by ward this week' },
  ],
  'financial': [
    { label: 'Budget vs. actuals', suggestionIndex: 2 },
    { label: 'Expenditures by fund', query: 'Break down expenditures by fund for FY2025' },
    { label: 'Revenue tracking', query: 'Revenue collected vs. projected this quarter' },
    { label: 'Purchase orders pending', query: 'Show outstanding purchase orders over $10K' },
    { label: 'Payroll summary', query: 'Department payroll totals this month' },
  ],
  'gis': [
    { label: 'Parcels by zoning', query: 'Show parcel count by zoning classification' },
    { label: 'Recent annexations', query: 'List parcels annexed in the last 12 months' },
    { label: 'Vacant properties', query: 'How many vacant commercial properties are in each district?' },
    { label: 'Flood zone parcels', query: 'Parcels within designated flood zones' },
  ],
  'justice': [
    { label: 'Arrests summary', suggestionIndex: 3 },
    { label: 'Case disposition report', suggestionIndex: 4 },
    { label: 'Active caseload', query: 'Current active cases by type and status' },
    { label: 'Juvenile aging out', query: 'Subjects turning 18 this month with case details' },
    { label: 'Drug-related charges', query: 'Cases with drug-related charges, dismissed vs. active' },
    { label: 'Court scheduling', query: 'Upcoming court dates this week' },
  ],
  'utilities': [
    { label: 'Billing method breakdown', query: 'Accounts by billing method and service area' },
    { label: 'Delinquent accounts', query: 'Accounts past due over 60 days' },
    { label: 'Consumption trends', query: 'Water consumption trends by district this quarter' },
    { label: 'Service requests', query: 'Open utility service requests by type' },
  ],
  'hr-payroll': [
    { label: 'Headcount by department', query: 'Current employee headcount by department' },
    { label: 'Open positions', query: 'Show all open positions and time-to-fill' },
    { label: 'Overtime report', query: 'Overtime hours by department this month' },
    { label: 'Benefits enrollment', query: 'Benefits enrollment status by plan type' },
  ],
};

/**
 * Default task-based suggestions shown when "All sources" is selected.
 * A mix of actionable tasks and category shortcuts.
 */
export const defaultTaskSuggestions = [
  { label: "What needs my attention today?", icon: 'flag', type: 'task' },
  { label: "Show me what's overdue", icon: 'warning', type: 'task' },
  { label: "What changed since yesterday?", icon: 'update', type: 'task' },
];

export const defaultCategorySuggestions = [
  { label: 'Permits', sourceId: 'permits-licensing', icon: 'description' },
  { label: 'Violations', sourceId: 'code-enforcement', icon: 'gavel' },
  { label: 'Budget', sourceId: 'financial', icon: 'account_balance' },
  { label: 'Inspections', sourceId: 'permits-licensing', icon: 'checklist' },
];

/**
 * Recent activity for the current user — simulated session history.
 */
/**
 * Filters standard reports by the current user's department visibility.
 */
const domainDepartments = {
  'permits-licensing': ['Community Development', 'Planning', 'Code Enforcement', 'Public Works'],
  'code-enforcement': ['Code Enforcement', 'Community Development', 'Planning'],
  'financial': ['Finance', 'Admin & Finance', 'Community Development', 'Public Works', 'Capital Projects'],
  'justice': ['Public Safety', 'Justice', 'Legal'],
  'gis': ['Community Development', 'Planning', 'Public Works', 'Code Enforcement', 'Capital Projects'],
  'utilities': ['Utilities', 'Public Works', 'Finance'],
  'hr-payroll': ['Human Resources', 'Admin & Finance'],
};

export function getVisibleStandardReports(reports, user = currentUser) {
  return reports.filter(report => {
    const allowedDepts = domainDepartments[report.domain] || [];
    return allowedDepts.includes(user.department);
  });
}

export const recentActivity = [
  {
    timestamp: '2026-03-20T14:22:00Z',
    label: 'Building Permits by Month — Downtown Only',
    type: 'saved_report',
    sourceId: 'permits-licensing',
    timeAgo: '2h ago',
  },
  {
    timestamp: '2026-03-20T09:15:00Z',
    label: 'Code Violations Summary',
    type: 'suggestion',
    sourceId: 'code-enforcement',
    suggestionIndex: 1,
    timeAgo: 'This morning',
  },
  {
    timestamp: '2026-03-19T16:40:00Z',
    label: 'Budget vs. Actuals — FY2025',
    type: 'saved_report',
    sourceId: 'financial',
    timeAgo: 'Yesterday',
  },
];

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
    label: 'Building Permits by Month',
    type: 'suggestion',
    sourceId: 'permits-licensing',
    suggestionIndex: 0,
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
];

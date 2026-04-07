export const standardReports = [
  {
    id: 'quarterly-permit-summary',
    name: 'Quarterly Building Permit Summary',
    description: 'Permit counts, processing times, and revenue by district. Covers all permit types with quarterly breakdowns.',
    domain: 'permits-licensing',
    badge: 'Standard Report',
    freshness: 'Updated daily',
    parameters: [
      { id: 'quarter', label: 'Quarter', type: 'select', options: ['Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025'], default: 'Q1 2026' },
      { id: 'district', label: 'District', type: 'select', options: ['All Districts', 'Downtown', 'Westside', 'Eastside', 'North County'], default: 'All Districts' },
      { id: 'permitType', label: 'Permit Type', type: 'select', options: ['All Types', 'Residential', 'Commercial', 'Industrial'], default: 'All Types' },
      { id: 'status', label: 'Status', type: 'select', options: ['All Statuses', 'Approved', 'Pending', 'Denied'], default: 'All Statuses' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Total Permits', value: '847', color: 'primary' },
        { label: 'Avg Days to Process', value: '12.3', color: 'primary' },
        { label: 'Revenue', value: '$2.4M', color: 'success' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Permits by Month', dataKey: 'monthlyPermits' },
      { type: 'table', title: 'District Breakdown', dataKey: 'districtData', columns: [
        { property: 'district', header: 'District' },
        { property: 'permits', header: 'Permits' },
        { property: 'avgDays', header: 'Avg Days' },
        { property: 'revenue', header: 'Revenue' }
      ]}
    ],
    data: {
      monthlyPermits: [
        { month: 'Jan', value: 95 }, { month: 'Feb', value: 112 },
        { month: 'Mar', value: 134 }, { month: 'Apr', value: 98 },
        { month: 'May', value: 145 }, { month: 'Jun', value: 128 },
        { month: 'Jul', value: 108 }, { month: 'Aug', value: 87 },
        { month: 'Sep', value: 76 }, { month: 'Oct', value: 68 }
      ],
      districtData: [
        { district: 'Downtown', permits: 234, avgDays: 10.2, revenue: '$680K' },
        { district: 'Westside', permits: 198, avgDays: 11.8, revenue: '$542K' },
        { district: 'Eastside', permits: 178, avgDays: 14.1, revenue: '$498K' },
        { district: 'North County', permits: 237, avgDays: 13.0, revenue: '$680K' }
      ]
    },
    matchKeywords: ['building permit', 'permit activity', 'permit summary', 'quarterly permits', 'permit counts', 'permit revenue', 'permit processing'],
    suggestions: ['Filter to my district', 'Show only residential', 'Compare to last quarter', 'Add trend line', 'Export to Excel']
  },
  {
    id: 'monthly-code-violations',
    name: 'Monthly Code Violation Trends',
    description: 'Violation counts by type and neighborhood with trend analysis and resolution rates.',
    domain: 'code-enforcement',
    badge: 'Standard Report',
    freshness: 'Updated weekly',
    parameters: [
      { id: 'dateRange', label: 'Date Range', type: 'select', options: ['Last 30 Days', 'Last 90 Days', 'Last 6 Months', 'Last 12 Months'], default: 'Last 90 Days' },
      { id: 'violationType', label: 'Violation Type', type: 'select', options: ['All Types', 'Property Maintenance', 'Zoning', 'Building Code', 'Health & Safety'], default: 'All Types' },
      { id: 'neighborhood', label: 'Neighborhood', type: 'select', options: ['All Neighborhoods', 'Downtown', 'Riverside', 'Oak Park', 'Hillcrest'], default: 'All Neighborhoods' },
      { id: 'resolution', label: 'Resolution Status', type: 'select', options: ['All', 'Open', 'Resolved', 'In Progress'], default: 'All' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Total Violations', value: '1,243', color: 'primary' },
        { label: 'Resolution Rate', value: '72%', color: 'success' },
        { label: 'Avg Days to Resolve', value: '18.5', color: 'primary' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Violations by Type', dataKey: 'violationsByType' },
      { type: 'table', title: 'Neighborhood Summary', dataKey: 'neighborhoodData', columns: [
        { property: 'neighborhood', header: 'Neighborhood' },
        { property: 'violations', header: 'Violations' },
        { property: 'resolved', header: 'Resolved' },
        { property: 'avgDays', header: 'Avg Days' }
      ]}
    ],
    data: {
      violationsByType: [
        { month: 'Property Maintenance', value: 456 },
        { month: 'Zoning', value: 312 },
        { month: 'Building Code', value: 289 },
        { month: 'Health & Safety', value: 186 }
      ],
      neighborhoodData: [
        { neighborhood: 'Downtown', violations: 389, resolved: 298, avgDays: 15.2 },
        { neighborhood: 'Riverside', violations: 312, resolved: 218, avgDays: 19.8 },
        { neighborhood: 'Oak Park', violations: 287, resolved: 201, avgDays: 21.3 },
        { neighborhood: 'Hillcrest', violations: 255, resolved: 178, avgDays: 17.1 }
      ]
    },
    matchKeywords: ['code violation', 'violation trends', 'code enforcement', 'violations by type', 'violation summary', 'property maintenance'],
    suggestions: ['Show only open violations', 'Filter to my neighborhood', 'Show trend over time', 'Compare violation types', 'Show resolution timeline']
  },
  {
    id: 'budget-vs-actuals',
    name: 'Budget vs. Actuals',
    description: 'Year-to-date budget comparison with variance analysis by department and fund.',
    domain: 'financial',
    badge: 'Standard Report',
    freshness: 'Updated monthly',
    parameters: [
      { id: 'fiscalYear', label: 'Fiscal Year', type: 'select', options: ['FY 2025-2026', 'FY 2024-2025', 'FY 2023-2024'], default: 'FY 2025-2026' },
      { id: 'department', label: 'Department', type: 'select', options: ['All Departments', 'Public Works', 'Community Development', 'Police', 'Fire', 'Parks & Recreation'], default: 'All Departments' },
      { id: 'fund', label: 'Fund', type: 'select', options: ['All Funds', 'General Fund', 'Enterprise Fund', 'Capital Projects'], default: 'All Funds' },
      { id: 'category', label: 'Category', type: 'select', options: ['All Categories', 'Personnel', 'Operations', 'Capital'], default: 'All Categories' }
    ],
    sections: [
      { type: 'kpi-row', items: [
        { label: 'Total Budget', value: '$48.2M', color: 'primary' },
        { label: 'YTD Actuals', value: '$32.1M', color: 'primary' },
        { label: 'Variance', value: '-$1.8M', color: 'danger' }
      ]},
      { type: 'chart', chartType: 'bar', title: 'Budget vs. Actuals by Department', dataKey: 'deptComparison' },
      { type: 'table', title: 'Department Detail', dataKey: 'departmentData', columns: [
        { property: 'department', header: 'Department' },
        { property: 'budget', header: 'Budget' },
        { property: 'actuals', header: 'Actuals' },
        { property: 'variance', header: 'Variance' }
      ]}
    ],
    data: {
      deptComparison: [
        { month: 'Public Works', value: 8200 },
        { month: 'Community Dev', value: 5400 },
        { month: 'Police', value: 12100 },
        { month: 'Fire', value: 9800 },
        { month: 'Parks & Rec', value: 3600 }
      ],
      departmentData: [
        { department: 'Public Works', budget: '$12.4M', actuals: '$8.2M', variance: '-$0.4M' },
        { department: 'Community Development', budget: '$6.8M', actuals: '$5.4M', variance: '+$0.2M' },
        { department: 'Police', budget: '$15.2M', actuals: '$12.1M', variance: '-$1.2M' },
        { department: 'Fire', budget: '$11.8M', actuals: '$9.8M', variance: '-$0.3M' },
        { department: 'Parks & Recreation', budget: '$5.0M', actuals: '$3.6M', variance: '-$0.1M' }
      ]
    },
    matchKeywords: ['budget', 'actuals', 'budget vs actuals', 'variance', 'fiscal year', 'spending', 'expenditure', 'department budget'],
    suggestions: ['Show my department only', 'Show personnel costs', 'Compare to last fiscal year', 'Show quarterly trend', 'Highlight over-budget items']
  }
];

export function getStandardReportById(id) {
  return standardReports.find(r => r.id === id) || null;
}

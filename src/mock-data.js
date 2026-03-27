export const suggestions = [
  {
    id: 'building-permits',
    label: 'Building Permits by Month',
    query: 'Show me building permits issued by month, broken down by district',
    sqlCode: `SELECT
  DATE_FORMAT(p.issue_date, '%b %Y') AS month,
  SUM(CASE WHEN p.district = 'Downtown' THEN 1 ELSE 0 END) AS downtown,
  SUM(CASE WHEN p.district = 'Riverside' THEN 1 ELSE 0 END) AS riverside,
  SUM(CASE WHEN p.district = 'North End' THEN 1 ELSE 0 END) AS northEnd,
  SUM(CASE WHEN p.district = 'Westside' THEN 1 ELSE 0 END) AS westside,
  SUM(CASE WHEN p.district = 'Industrial' THEN 1 ELSE 0 END) AS industrial,
  COUNT(*) AS total
FROM permits p
WHERE p.issue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
  AND p.status = 'ISSUED'
GROUP BY DATE_FORMAT(p.issue_date, '%Y-%m')
ORDER BY p.issue_date;`,
    aiSummary: `I found **2,847 building permits** issued across 5 districts over the past 12 months. Here's a summary:

- **Downtown District** leads with 892 permits (31%), primarily residential renovations
- Permit volume peaked in **June 2025** (347 permits) and dipped in **December 2025** (142 permits)
- **Commercial permits** increased 18% year-over-year, driven by the Riverside corridor

The table below shows the full monthly breakdown by district. I can also break this down by permit type or show trend analysis.`,
    dataSource: 'Permits & Licensing DB',
    freshness: 'Updated 2 hours ago',
    reportTitle: 'Building Permits by Month',
    // Chat refinement chips — data-shaping only (§3.3)
    refinementChips: [
      'Filter by date range',
      'Break down by permit type',
      'Compare to last year',
      'Add residential vs. commercial split',
    ],
    // Transparency panel data (§4.1)
    transparency: {
      dataSourceDetail: 'Permits & Licensing Database',
      system: 'ERP Pro',
      totalRecords: '48,200',
      lastUpdated: 'March 20, 2026 10:14 AM',
      assumptions: [
        '"By month" interpreted as issue date, not application date',
        '"Broken down by district" uses the permit_district field, not applicant address',
        'Only permits with status = ISSUED are included (excludes pending, denied, withdrawn)',
      ],
      citations: [
        { label: 'permits table', detail: 'ERP Pro > Permits & Licensing > permits' },
        { label: 'district mapping', detail: 'ERP Pro > Admin > district_boundaries (joined on geo_zone_id)' },
      ],
    },
    // Handoff trigger scenario
    handoffTrigger: {
      userMessage: 'I also need the contractor license data cross-referenced with each permit',
      systemResponse: 'That requires joining the permits table with the contractor_licenses table, which works best in the Report Designer. I\'ll bring your current query and filters with you.',
      handoffLabel: 'Open in Report Designer',
    },
    columns: [
      { property: 'month', header: 'Month', sortable: true },
      { property: 'downtown', header: 'Downtown', sortable: true },
      { property: 'riverside', header: 'Riverside', sortable: true },
      { property: 'northEnd', header: 'North End', sortable: true },
      { property: 'westside', header: 'Westside', sortable: true },
      { property: 'industrial', header: 'Industrial', sortable: true },
      { property: 'total', header: 'Total', sortable: true },
    ],
    data: [
      { month: 'Jan 2025', downtown: 68, riverside: 45, northEnd: 32, westside: 28, industrial: 19, total: 192 },
      { month: 'Feb 2025', downtown: 72, riverside: 48, northEnd: 35, westside: 31, industrial: 21, total: 207 },
      { month: 'Mar 2025', downtown: 81, riverside: 54, northEnd: 41, westside: 36, industrial: 24, total: 236 },
      { month: 'Apr 2025', downtown: 85, riverside: 61, northEnd: 48, westside: 39, industrial: 27, total: 260 },
      { month: 'May 2025', downtown: 92, riverside: 68, northEnd: 55, westside: 44, industrial: 32, total: 291 },
      { month: 'Jun 2025', downtown: 98, riverside: 76, northEnd: 62, westside: 51, industrial: 35, total: 322 },
      { month: 'Jul 2025', downtown: 95, riverside: 72, northEnd: 58, westside: 47, industrial: 33, total: 305 },
      { month: 'Aug 2025', downtown: 88, riverside: 65, northEnd: 52, westside: 42, industrial: 30, total: 277 },
      { month: 'Sep 2025', downtown: 79, riverside: 58, northEnd: 44, westside: 37, industrial: 26, total: 244 },
      { month: 'Oct 2025', downtown: 74, riverside: 51, northEnd: 38, westside: 33, industrial: 22, total: 218 },
      { month: 'Nov 2025', downtown: 65, riverside: 42, northEnd: 30, westside: 27, industrial: 18, total: 182 },
      { month: 'Dec 2025', downtown: 52, riverside: 34, northEnd: 24, westside: 21, industrial: 14, total: 145 },
    ],
    chartLabel: 'Monthly Permit Trends by District',
    chartIcon: 'bar_chart',
  },
  {
    id: 'code-violations',
    label: 'Code Violations Summary',
    query: 'Summarize code violations by type and priority for the current year',
    sqlCode: `SELECT
  v.violation_type AS type,
  SUM(CASE WHEN v.priority = 'High' THEN 1 ELSE 0 END) AS high,
  SUM(CASE WHEN v.priority = 'Medium' THEN 1 ELSE 0 END) AS medium,
  SUM(CASE WHEN v.priority = 'Low' THEN 1 ELSE 0 END) AS low,
  SUM(CASE WHEN v.status = 'Open' THEN 1 ELSE 0 END) AS open,
  SUM(CASE WHEN v.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
  AVG(DATEDIFF(v.resolution_date, v.report_date)) AS avgDays
FROM violations v
WHERE YEAR(v.report_date) = YEAR(CURDATE())
GROUP BY v.violation_type
ORDER BY COUNT(*) DESC;`,
    aiSummary: `I pulled **1,423 code violations** reported year-to-date across all enforcement zones. Key findings:

- **Property maintenance** violations are the most common (38%), followed by **zoning** (24%) and **building code** (19%)
- **High-priority** violations account for 12% of all cases, with an average resolution time of 14 days
- The **Southeast zone** has the highest violation density — 3.2x the city average
- Open violations decreased **9%** compared to the same period last year

Below is the detailed breakdown by violation type and priority level.`,
    dataSource: 'Code Enforcement System',
    freshness: 'Updated 45 min ago',
    reportTitle: 'Code Violations Summary',
    refinementChips: [
      'Filter by zone',
      'Show only high priority',
      'Group by month',
      'Add inspector workload',
    ],
    transparency: {
      dataSourceDetail: 'Code Enforcement System',
      system: 'Enterprise Permitting & Licensing',
      totalRecords: '14,800',
      lastUpdated: 'March 20, 2026 9:35 AM',
      assumptions: [
        '"Current year" interpreted as calendar year 2026 to date',
        'Avg resolution time excludes violations still open (no resolution_date)',
        'Violation types are the primary category, not sub-categories',
      ],
      citations: [
        { label: 'violations table', detail: 'Enterprise P&L > Code Enforcement > violations' },
        { label: 'zone mapping', detail: 'Enterprise P&L > Admin > enforcement_zones' },
      ],
    },
    handoffTrigger: {
      userMessage: 'Can you calculate a resolution efficiency score that factors in priority weight and zone workload?',
      systemResponse: 'That needs a calculated field combining priority weights with zone-level workload metrics. Want to build it in the Report Designer? I\'ll bring your current filters with you.',
      handoffLabel: 'Open in Report Designer',
    },
    columns: [
      { property: 'type', header: 'Violation Type', sortable: true },
      { property: 'high', header: 'High', sortable: true },
      { property: 'medium', header: 'Medium', sortable: true },
      { property: 'low', header: 'Low', sortable: true },
      { property: 'open', header: 'Open', sortable: true },
      { property: 'resolved', header: 'Resolved', sortable: true },
      { property: 'avgDays', header: 'Avg Days to Resolve', sortable: true },
    ],
    data: [
      { type: 'Property Maintenance', high: 42, medium: 186, low: 312, open: 198, resolved: 342, avgDays: 18 },
      { type: 'Zoning Violations', high: 28, medium: 112, low: 198, open: 124, resolved: 214, avgDays: 22 },
      { type: 'Building Code', high: 56, medium: 98, low: 118, open: 96, resolved: 176, avgDays: 14 },
      { type: 'Fire Safety', high: 31, medium: 45, low: 22, open: 34, resolved: 64, avgDays: 8 },
      { type: 'Electrical', high: 12, medium: 38, low: 42, open: 28, resolved: 64, avgDays: 12 },
      { type: 'Plumbing', high: 8, medium: 24, low: 34, open: 22, resolved: 44, avgDays: 15 },
      { type: 'Signage', high: 2, medium: 18, low: 52, open: 26, resolved: 46, avgDays: 28 },
      { type: 'Noise/Nuisance', high: 5, medium: 32, low: 68, open: 38, resolved: 67, avgDays: 11 },
      { type: 'Accessibility', high: 14, medium: 22, low: 16, open: 18, resolved: 34, avgDays: 19 },
      { type: 'Environmental', high: 8, medium: 15, low: 12, open: 12, resolved: 23, avgDays: 25 },
    ],
    chartLabel: 'Violations by Type and Priority',
    chartIcon: 'pie_chart',
  },
  {
    id: 'budget-actuals',
    label: 'Budget vs. Actuals',
    query: 'Compare department budgets against actual expenditures for FY2025',
    sqlCode: `SELECT
  d.name AS department,
  b.budgeted_amount / 1000 AS budget,
  e.actual_amount / 1000 AS actual,
  (e.actual_amount - (b.budgeted_amount * 0.68)) / 1000 AS variance,
  CONCAT(ROUND((e.actual_amount / b.budgeted_amount) * 100, 1), '%') AS utilization,
  CASE
    WHEN (e.actual_amount / b.budgeted_amount) > 0.70 THEN 'Over pace'
    WHEN (e.actual_amount / b.budgeted_amount) < 0.60 THEN 'Under budget'
    ELSE 'On track'
  END AS status
FROM departments d
JOIN budgets b ON d.id = b.department_id
JOIN expenditures e ON d.id = e.department_id
WHERE b.fiscal_year = 2025
ORDER BY d.name;`,
    aiSummary: `Here's the **FY2025 Budget vs. Actuals** comparison across all departments. The fiscal year is **68% complete** as of this report.

- Total budgeted: **$142.8M** | Total spent: **$94.1M** (65.9% of budget)
- **Public Safety** is tracking 4.2% over pace — primarily overtime costs in Q2
- **Parks & Recreation** is the most under-budget department at 58.3% utilization
- **Capital Projects** shows the largest variance ($2.1M under) due to delayed procurement

The detailed department-level comparison is shown below.`,
    dataSource: 'Financial Management System',
    freshness: 'Updated daily at 6:00 AM',
    reportTitle: 'Budget vs. Actuals — FY2025',
    refinementChips: [
      'Filter by department',
      'Show only over-pace',
      'Add quarterly breakdown',
      'Include revenue comparison',
    ],
    transparency: {
      dataSourceDetail: 'Financial Management System',
      system: 'Munis ERP',
      totalRecords: '2,400 budget line items',
      lastUpdated: 'March 20, 2026 6:00 AM',
      assumptions: [
        '"FY2025" interpreted as fiscal year starting July 1, 2024',
        'Variance calculated as actual spend minus expected pace (budget × 0.68)',
        'Utilization = actual / total annual budget (not remaining budget)',
        'Amounts rounded to nearest $1K for readability',
      ],
      citations: [
        { label: 'departments table', detail: 'Munis > Administration > departments' },
        { label: 'budgets table', detail: 'Munis > Budget Management > budgets (FY2025 records)' },
        { label: 'expenditures table', detail: 'Munis > Accounts Payable > expenditures (aggregated)' },
      ],
    },
    handoffTrigger: {
      userMessage: 'I need to build a standard monthly report that combines this with revenue data and has subtotals by fund',
      systemResponse: 'Building a reusable report with multi-table joins and subtotal formatting is best done in the Report Designer. I\'ll bring your current budget data and filters with you.',
      handoffLabel: 'Open in Report Designer',
    },
    columns: [
      { property: 'department', header: 'Department', sortable: true },
      { property: 'budget', header: 'Budget ($K)', sortable: true },
      { property: 'actual', header: 'Actual ($K)', sortable: true },
      { property: 'variance', header: 'Variance ($K)', sortable: true },
      { property: 'utilization', header: '% Utilized', sortable: true },
      { property: 'status', header: 'Status', sortable: true },
    ],
    data: [
      { department: 'Public Safety', budget: 38200, actual: 26420, variance: -1180, utilization: '69.2%', status: 'Over pace' },
      { department: 'Public Works', budget: 24600, actual: 16100, variance: 220, utilization: '65.4%', status: 'On track' },
      { department: 'Community Dev', budget: 18400, actual: 12080, variance: 400, utilization: '65.7%', status: 'On track' },
      { department: 'Parks & Rec', budget: 12800, actual: 7460, variance: 1220, utilization: '58.3%', status: 'Under budget' },
      { department: 'Admin & Finance', budget: 11200, actual: 7540, variance: -140, utilization: '67.3%', status: 'On track' },
      { department: 'IT Services', budget: 9800, actual: 6580, variance: 70, utilization: '67.1%', status: 'On track' },
      { department: 'Human Resources', budget: 6200, actual: 4020, variance: 190, utilization: '64.8%', status: 'On track' },
      { department: 'Legal', budget: 5400, actual: 3680, variance: -10, utilization: '68.1%', status: 'On track' },
      { department: 'Capital Projects', budget: 9800, actual: 5440, variance: 2110, utilization: '55.5%', status: 'Under budget' },
      { department: 'Health Services', budget: 6400, actual: 4780, variance: -440, utilization: '74.7%', status: 'Over pace' },
    ],
    chartLabel: 'Budget vs. Actual by Department',
    chartIcon: 'bar_chart',
  },
];

// Saved Reports Library — kept as empty export for compatibility
export const savedReports = [];

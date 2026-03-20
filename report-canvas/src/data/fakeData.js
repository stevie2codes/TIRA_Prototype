export const departments = [
  { id: 1, name: 'Public Works', division: 'Infrastructure' },
  { id: 2, name: 'Parks & Recreation', division: 'Community' },
  { id: 3, name: 'Police', division: 'Public Safety' },
  { id: 4, name: 'Fire & Rescue', division: 'Public Safety' },
  { id: 5, name: 'Administration', division: 'General Government' },
  { id: 6, name: 'Planning & Zoning', division: 'Development' },
];

export const budgetItems = [
  { department_id: 1, fiscal_year: 2026, budgeted_amount: 2800000, category: 'Personnel' },
  { department_id: 1, fiscal_year: 2026, budgeted_amount: 1500000, category: 'Operations' },
  { department_id: 1, fiscal_year: 2026, budgeted_amount: 800000, category: 'Capital' },
  { department_id: 2, fiscal_year: 2026, budgeted_amount: 1200000, category: 'Personnel' },
  { department_id: 2, fiscal_year: 2026, budgeted_amount: 600000, category: 'Operations' },
  { department_id: 2, fiscal_year: 2026, budgeted_amount: 400000, category: 'Capital' },
  { department_id: 3, fiscal_year: 2026, budgeted_amount: 3500000, category: 'Personnel' },
  { department_id: 3, fiscal_year: 2026, budgeted_amount: 900000, category: 'Operations' },
  { department_id: 3, fiscal_year: 2026, budgeted_amount: 600000, category: 'Capital' },
  { department_id: 4, fiscal_year: 2026, budgeted_amount: 2200000, category: 'Personnel' },
  { department_id: 4, fiscal_year: 2026, budgeted_amount: 700000, category: 'Operations' },
  { department_id: 4, fiscal_year: 2026, budgeted_amount: 500000, category: 'Capital' },
  { department_id: 5, fiscal_year: 2026, budgeted_amount: 900000, category: 'Personnel' },
  { department_id: 5, fiscal_year: 2026, budgeted_amount: 300000, category: 'Operations' },
  { department_id: 5, fiscal_year: 2026, budgeted_amount: 150000, category: 'Capital' },
  { department_id: 6, fiscal_year: 2026, budgeted_amount: 700000, category: 'Personnel' },
  { department_id: 6, fiscal_year: 2026, budgeted_amount: 250000, category: 'Operations' },
  { department_id: 6, fiscal_year: 2026, budgeted_amount: 200000, category: 'Capital' },
];

export const actuals = [
  { department_id: 1, fiscal_year: 2026, spent_amount: 2650000, category: 'Personnel', month: 'Q1-Q3' },
  { department_id: 1, fiscal_year: 2026, spent_amount: 1380000, category: 'Operations', month: 'Q1-Q3' },
  { department_id: 1, fiscal_year: 2026, spent_amount: 920000, category: 'Capital', month: 'Q1-Q3' },
  { department_id: 2, fiscal_year: 2026, spent_amount: 1100000, category: 'Personnel', month: 'Q1-Q3' },
  { department_id: 2, fiscal_year: 2026, spent_amount: 580000, category: 'Operations', month: 'Q1-Q3' },
  { department_id: 2, fiscal_year: 2026, spent_amount: 350000, category: 'Capital', month: 'Q1-Q3' },
  { department_id: 3, fiscal_year: 2026, spent_amount: 3400000, category: 'Personnel', month: 'Q1-Q3' },
  { department_id: 3, fiscal_year: 2026, spent_amount: 950000, category: 'Operations', month: 'Q1-Q3' },
  { department_id: 3, fiscal_year: 2026, spent_amount: 480000, category: 'Capital', month: 'Q1-Q3' },
  { department_id: 4, fiscal_year: 2026, spent_amount: 2100000, category: 'Personnel', month: 'Q1-Q3' },
  { department_id: 4, fiscal_year: 2026, spent_amount: 680000, category: 'Operations', month: 'Q1-Q3' },
  { department_id: 4, fiscal_year: 2026, spent_amount: 450000, category: 'Capital', month: 'Q1-Q3' },
  { department_id: 5, fiscal_year: 2026, spent_amount: 870000, category: 'Personnel', month: 'Q1-Q3' },
  { department_id: 5, fiscal_year: 2026, spent_amount: 310000, category: 'Operations', month: 'Q1-Q3' },
  { department_id: 5, fiscal_year: 2026, spent_amount: 120000, category: 'Capital', month: 'Q1-Q3' },
  { department_id: 6, fiscal_year: 2026, spent_amount: 660000, category: 'Personnel', month: 'Q1-Q3' },
  { department_id: 6, fiscal_year: 2026, spent_amount: 230000, category: 'Operations', month: 'Q1-Q3' },
  { department_id: 6, fiscal_year: 2026, spent_amount: 180000, category: 'Capital', month: 'Q1-Q3' },
];

// Pre-aggregated data for charts
export const budgetVsActualsByDept = departments.map(dept => {
  const deptBudget = budgetItems
    .filter(b => b.department_id === dept.id)
    .reduce((sum, b) => sum + b.budgeted_amount, 0);
  const deptActual = actuals
    .filter(a => a.department_id === dept.id)
    .reduce((sum, a) => sum + a.spent_amount, 0);
  return {
    name: dept.name,
    budget: deptBudget,
    actual: deptActual,
    variance: deptBudget - deptActual,
  };
});

export const totalBudget = budgetItems.reduce((sum, b) => sum + b.budgeted_amount, 0);
export const totalSpent = actuals.reduce((sum, a) => sum + a.spent_amount, 0);
export const variancePercent = ((totalBudget - totalSpent) / totalBudget * 100).toFixed(1);

// Detailed line items for table widget
export const lineItems = departments.flatMap(dept => {
  const categories = ['Personnel', 'Operations', 'Capital'];
  return categories.map(cat => {
    const budgeted = budgetItems.find(b => b.department_id === dept.id && b.category === cat)?.budgeted_amount || 0;
    const spent = actuals.find(a => a.department_id === dept.id && a.category === cat)?.spent_amount || 0;
    return {
      department: dept.name,
      category: cat,
      budgeted,
      spent,
      variance: budgeted - spent,
    };
  });
});

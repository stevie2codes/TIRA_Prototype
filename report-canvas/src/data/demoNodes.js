export const demoNodes = [
  {
    id: 'source-departments',
    type: 'source',
    position: { x: 50, y: 50 },
    data: {
      label: 'Departments',
      icon: 'groups',
      fields: ['id', 'name', 'division'],
      subtype: 'database',
    },
  },
  {
    id: 'source-budget',
    type: 'source',
    position: { x: 50, y: 300 },
    data: {
      label: 'Budget Items',
      icon: 'account_balance',
      fields: ['department_id', 'fiscal_year', 'budgeted_amount', 'category'],
      subtype: 'database',
    },
  },
  {
    id: 'source-actuals',
    type: 'source',
    position: { x: 50, y: 580 },
    data: {
      label: 'Actuals',
      icon: 'receipt_long',
      fields: ['department_id', 'fiscal_year', 'spent_amount', 'category', 'month'],
      subtype: 'database',
    },
  },
  {
    id: 'output-report',
    type: 'output',
    position: { x: 550, y: 250 },
    data: {
      label: 'Report Data',
      fields: ['department', 'division', 'fiscal_year', 'budgeted_amount', 'spent_amount', 'category', 'month', 'variance'],
    },
  },
];

export const demoEdges = [
  {
    id: 'e-dept-output',
    source: 'source-departments',
    target: 'output-report',
    data: { joinType: 'inner', leftKey: 'id', rightKey: 'department_id' },
    animated: true,
  },
  {
    id: 'e-budget-output',
    source: 'source-budget',
    target: 'output-report',
    data: { joinType: 'inner', leftKey: 'department_id', rightKey: 'department_id' },
    animated: true,
  },
  {
    id: 'e-actuals-output',
    source: 'source-actuals',
    target: 'output-report',
    data: { joinType: 'left', leftKey: 'department_id', rightKey: 'department_id' },
    animated: true,
  },
];

// Standard preset options for date_range parameters. Stored as string keys in
// defaultValue; UI looks up label here for display.
export const DATE_RANGE_PRESETS = [
  { value: 'last_7d',   label: 'Last 7 days'   },
  { value: 'last_30d',  label: 'Last 30 days'  },
  { value: 'last_90d',  label: 'Last 90 days'  },
  { value: 'mtd',       label: 'Month to date' },
  { value: 'ytd',       label: 'Year to date'  },
  { value: 'last_year', label: 'Last year'     },
  { value: 'all_time',  label: 'All time'      },
];

export function getDateRangeLabel(value) {
  return DATE_RANGE_PRESETS.find(p => p.value === value)?.label || String(value);
}

export const PARAMETER_TYPES = [
  { value: 'string',       label: 'Text'         },
  { value: 'number',       label: 'Number'       },
  { value: 'date_range',   label: 'Date range'   },
  { value: 'multi_select', label: 'Multi-select' },
];

export function defaultValueForType(type) {
  if (type === 'date_range')   return 'last_90d';
  if (type === 'multi_select') return [];
  if (type === 'number')       return 0;
  return '';
}

export const COLUMN_FORMATS = [
  { value: 'auto',       label: 'Auto' },
  { value: 'number',     label: 'Number' },
  { value: 'currency',   label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'date',       label: 'Date' },
  { value: 'text',       label: 'Text' },
];

export const COLUMN_DENSITIES = [
  { value: 'compact',     label: 'Compact' },
  { value: 'normal',      label: 'Normal' },
  { value: 'comfortable', label: 'Comfortable' },
];

/**
 * Normalize a column binding entry to { fieldId, ...settings }. Accepts either
 * the legacy string shape (bare field ID) or the new object shape.
 */
export function normalizeColumn(entry) {
  if (typeof entry === 'string') return { fieldId: entry };
  if (entry && typeof entry === 'object' && entry.fieldId) return { ...entry };
  return null;
}

/**
 * Default alignment by field role.
 */
export function defaultAlign(fieldMeta) {
  if (!fieldMeta) return 'left';
  return fieldMeta.role === 'measure' ? 'right' : 'left';
}

/**
 * Auto-pick a format when the column's format is 'auto' (or absent).
 */
function autoFormat(fieldMeta) {
  if (!fieldMeta) return 'text';
  if (fieldMeta.type === 'currency') return 'currency';
  if (fieldMeta.type === 'date')     return 'date';
  if (fieldMeta.type === 'number')   return 'number';
  return 'text';
}

/**
 * Format a single cell value based on the column's format spec + field meta.
 * `rawValue` is whatever's in the data row (string, number, date string, null).
 */
export function formatCellValue(rawValue, column, fieldMeta) {
  if (rawValue == null || rawValue === '') return '—';
  const format = (column?.format && column.format !== 'auto') ? column.format : autoFormat(fieldMeta);
  const opts = column?.formatOptions || {};

  if (format === 'number') {
    const decimals = opts.decimals ?? 0;
    return Number(rawValue).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (format === 'currency') {
    const symbol = opts.symbol || '$';
    const decimals = opts.decimals ?? 0;
    const formatted = Number(rawValue).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${symbol}${formatted}`;
  }
  if (format === 'percentage') {
    const decimals = opts.decimals ?? 1;
    return `${Number(rawValue).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
  }
  if (format === 'date') {
    const d = new Date(rawValue);
    if (Number.isNaN(d.getTime())) return String(rawValue);
    const style = opts.dateStyle || 'medium';
    return d.toLocaleDateString(undefined, { dateStyle: style });
  }
  // text
  return String(rawValue);
}

/**
 * Compute the totals row value for a given column across rows. Returns the
 * formatted string (or null if no aggregation applies).
 */
export function aggregateForTotal(rows, column, fieldMeta, columnIndex, allColumnEntries) {
  if (!column.includeInTotals) return null;

  const fieldName = column.fieldId.split('.').pop();
  const role = fieldMeta?.role;

  if (role === 'measure') {
    const sum = rows.reduce((acc, r) => acc + (typeof r[column.fieldId] === 'number' ? r[column.fieldId] : (typeof r[fieldName] === 'number' ? r[fieldName] : 0)), 0);
    return formatCellValue(sum, column, fieldMeta);
  }

  // Dimension column gets a count, but only the first dimension flagged
  // for totals shows the count to avoid clutter — we show 'n rows' style.
  const firstDimWithTotals = (allColumnEntries || []).find(c => {
    const m = c._fieldMeta;
    return m && m.role !== 'measure' && c.includeInTotals;
  });
  if (firstDimWithTotals && firstDimWithTotals.fieldId === column.fieldId) {
    return `${rows.length} rows`;
  }
  return null;
}

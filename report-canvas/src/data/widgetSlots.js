// Shared slot definitions for widget data binding.
// Consumed by both WidgetConfigPanel (right-rail SlotEditor) and WidgetWrapper
// (canvas drop target's slot picker). Keeping these in one place prevents drift.
//
// Slot shape:
//   { id, label, accept: 'dimension' | 'measure' | 'any', optional?, multiple? }
//
// accept controls which fields a slot will receive:
//   - 'dimension'  → only fields tagged role === 'dimension'
//   - 'measure'    → only fields tagged role === 'measure'
//   - 'any'        → anything

export const WIDGET_SLOTS = {
  chart: [
    { id: 'xAxis',   label: 'X axis',   accept: 'dimension' },
    { id: 'yAxis',   label: 'Y axis',   accept: 'measure'   },
    { id: 'groupBy', label: 'Group by', accept: 'dimension', optional: true },
  ],
  table: [
    { id: 'columns', label: 'Columns',  accept: 'any', multiple: true },
  ],
  kpi: [
    { id: 'value',   label: 'Value',    accept: 'measure'   },
    { id: 'label',   label: 'Label',    accept: 'dimension', optional: true },
  ],
};

export const DATA_WIDGET_TYPES = Object.keys(WIDGET_SLOTS);

/**
 * Given a widget and a field, pick the slot to fill when dropping the field
 * directly onto the widget on the canvas.
 *
 * Strategy: first empty slot that accepts the field's role (preferring multiple-allowed
 * slots), then fall back to first slot that accepts the role at all.
 */
export function pickSlotForField(widget, field) {
  const slots = WIDGET_SLOTS[widget.type] || [];
  for (const slot of slots) {
    const filled = widget.bindings?.[slot.id];
    if (filled && !slot.multiple) continue;
    if (slot.accept === 'any') return slot.id;
    if (slot.accept === field.role) return slot.id;
  }
  const fallback = slots.find(s => s.accept === field.role || s.accept === 'any');
  return fallback?.id;
}

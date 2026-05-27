import { getSchemaFor } from '../data/sourceSchemas.js';

/**
 * Derive the unified Field Library from semantic-model state.
 * Returns an array of field entries that widgets and the chat AI consume.
 *
 * Each entry: { id, qualifiedName, displayName, role, type, sourceId, kind }
 * kind: 'field' (from source) | 'measure' (calculated)
 */
export function buildFieldLibrary(selectedSources, measures) {
  const fields = [];

  for (const sourceEntry of selectedSources) {
    const { sourceId, includedFields } = sourceEntry;
    const schema = getSchemaFor(sourceId);
    for (const field of schema) {
      if (!includedFields.includes(field.name)) continue;
      fields.push({
        id: `${sourceId}.${field.name}`,
        qualifiedName: `${sourceId}.${field.name}`,
        displayName: field.displayName,
        role: field.role,
        type: field.type,
        sourceId,
        kind: 'field',
      });
    }
  }

  for (const measure of measures) {
    fields.push({
      id: `measure.${measure.name}`,
      qualifiedName: measure.name,
      displayName: measure.displayName || measure.name,
      role: 'measure',
      type: measure.type || 'number',
      sourceId: null,
      kind: 'measure',
      expression: measure.expression,
    });
  }

  return fields;
}

/**
 * Group field-library entries by source for grouped display.
 * Calculated measures land in a synthetic 'measures' group.
 */
export function groupFieldsBySource(library) {
  const groups = {};
  for (const f of library) {
    const key = f.kind === 'measure' ? 'CALCULATED MEASURES' : f.sourceId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  return groups;
}

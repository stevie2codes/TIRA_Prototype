// Forge components: ForgeTextField, ForgeIcon
import { useState, useMemo } from 'react';
import { ForgeTextField } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { groupFieldsBySource } from '../../utils/fieldLibrary.js';
import './FieldsTab.css';

const ROLE_ICONS = {
  dimension: { glyph: '▦', color: '#3b6ea5' },
  measure:   { glyph: '∑', color: '#2d8659' },
};

const MEASURE_KIND_ICON = { glyph: 'ƒ', color: '#7a4ca8' };

export default function FieldsTab() {
  const { fieldLibrary } = useReport();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fieldLibrary;
    return fieldLibrary.filter(f =>
      f.qualifiedName.toLowerCase().includes(q) ||
      f.displayName.toLowerCase().includes(q)
    );
  }, [fieldLibrary, query]);

  const grouped = groupFieldsBySource(filtered);
  const sourceGroups = Object.keys(grouped).filter(k => k !== 'CALCULATED MEASURES');
  const measureGroup = grouped['CALCULATED MEASURES'] || [];

  const onDragStart = (event, field) => {
    event.dataTransfer.setData('application/x-tira-field', JSON.stringify(field));
    event.dataTransfer.effectAllowed = 'copy';
  };

  function iconFor(field) {
    if (field.kind === 'measure') return MEASURE_KIND_ICON;
    return ROLE_ICONS[field.role] || ROLE_ICONS.dimension;
  }

  if (fieldLibrary.length === 0) {
    return (
      <div className="fields-tab__empty">
        <p>No fields yet.</p>
        <p>Add sources in the Data Layer tab to populate the Field Library.</p>
      </div>
    );
  }

  return (
    <div className="fields-tab">
      <div className="fields-tab__search">
        <ForgeTextField density="small">
          <input
            type="text"
            placeholder="Search fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </ForgeTextField>
      </div>

      {sourceGroups.map(sourceId => (
        <div key={sourceId} className="fields-tab__group">
          <div className="fields-tab__group-title">{sourceId.toUpperCase()}</div>
          {grouped[sourceId].map(field => {
            const icon = iconFor(field);
            return (
              <div
                key={field.id}
                className="fields-tab__field"
                draggable
                onDragStart={(e) => onDragStart(e, field)}
                title={field.displayName}
              >
                <span className="fields-tab__field-icon" style={{ color: icon.color }}>{icon.glyph}</span>
                <span className="fields-tab__field-name">{field.qualifiedName}</span>
              </div>
            );
          })}
        </div>
      ))}

      {measureGroup.length > 0 && (
        <div className="fields-tab__group fields-tab__group--measures">
          <div className="fields-tab__group-title">CALCULATED MEASURES</div>
          {measureGroup.map(field => (
            <div
              key={field.id}
              className="fields-tab__field fields-tab__field--measure"
              draggable
              onDragStart={(e) => onDragStart(e, field)}
            >
              <span className="fields-tab__field-icon" style={{ color: MEASURE_KIND_ICON.color }}>ƒ</span>
              <span className="fields-tab__field-name">{field.qualifiedName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

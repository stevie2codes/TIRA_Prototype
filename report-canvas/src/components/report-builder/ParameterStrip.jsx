// Forge components: ForgeIcon, ForgeIconButton
import { useState } from 'react';
import { ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import './ParameterStrip.css';

function formatDefault(p) {
  if (Array.isArray(p.defaultValue)) {
    if (p.defaultValue.length === 0 || p.defaultValue.includes('all')) return 'All';
    return p.defaultValue.join(', ');
  }
  if (p.defaultValue === 'last_90d')  return 'Last 90 days';
  if (p.defaultValue === 'last_30d')  return 'Last 30 days';
  if (p.defaultValue === 'ytd')       return 'Year to date';
  return String(p.defaultValue ?? '—');
}

export default function ParameterStrip() {
  const { parameters, updateParameter } = useReport();
  const [editingId, setEditingId] = useState(null);

  if (parameters.length === 0) {
    return (
      <div className="param-strip param-strip--empty">
        <ForgeIcon name="tune" style={{ fontSize: 14 }} />
        <span>No parameters defined. Add them in the Data Layer's Inspector → MODEL → Parameters.</span>
      </div>
    );
  }

  return (
    <div className="param-strip">
      <span className="param-strip__label">
        <ForgeIcon name="tune" style={{ fontSize: 14 }} />
        PARAMETERS
      </span>
      {parameters.map(p => (
        <div key={p.id} className="param-strip__chip">
          <span className="param-strip__chip-name">{p.displayName}:</span>
          {editingId === p.id ? (
            <input
              autoFocus
              className="param-strip__chip-input"
              defaultValue={String(p.defaultValue)}
              onBlur={(e) => { updateParameter(p.id, { defaultValue: e.target.value }); setEditingId(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingId(null); }}
            />
          ) : (
            <span className="param-strip__chip-value" onClick={() => setEditingId(p.id)}>
              {formatDefault(p)}
            </span>
          )}
        </div>
      ))}
      <div className="param-strip__hint">Set defaults · Used by chat AI</div>
    </div>
  );
}

// Forge components: ForgeIcon, ForgeButton, ForgeIconButton
import { useState, useRef, useEffect } from 'react';
import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import ParameterValueEditor from '../data-layer/ParameterValueEditor.jsx';
import { DATE_RANGE_PRESETS } from '../../data/parameterPresets.js';
import './ParameterStrip.css';

function formatValueLabel(p, value) {
  if (p.type === 'date_range') {
    const preset = DATE_RANGE_PRESETS.find(x => x.value === value);
    return preset?.label || String(value ?? '—');
  }
  if (p.type === 'multi_select') {
    const arr = Array.isArray(value) ? value : [];
    if (arr.length === 0 || arr.includes('all')) return 'All';
    const labels = arr.map(v => (p.options || []).find(o => o.value === v)?.label || v);
    return labels.length <= 2 ? labels.join(', ') : `${labels.length} selected`;
  }
  if (value == null || value === '') return '—';
  return String(value);
}

function ParamChip({ param }) {
  const { updateParameter } = useReport();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const valueLabel = formatValueLabel(param, param.defaultValue);
  const isDefault = true; // For now, strip edits the parameter's default value directly.

  return (
    <div className="param-chip" ref={ref}>
      <button
        className={`param-chip__btn ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="param-chip__name">{param.displayName}</span>
        <span className="param-chip__sep">:</span>
        <span className="param-chip__value">{valueLabel}</span>
        <ForgeIcon name="arrow_drop_down" style={{ fontSize: 16, marginLeft: 2 }} />
      </button>
      {open && (
        <div className="param-chip__popover">
          <div className="param-chip__popover-label">{param.displayName}</div>
          {param.description && (
            <div className="param-chip__popover-desc">{param.description}</div>
          )}
          <ParameterValueEditor
            param={param}
            value={param.defaultValue}
            onChange={(v) => updateParameter(param.id, { defaultValue: v })}
            compact
          />
        </div>
      )}
    </div>
  );
}

export default function ParameterStrip() {
  const { parameters } = useReport();

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
      <div className="param-strip__chips">
        {parameters.map(p => (
          <ParamChip key={p.id} param={p} />
        ))}
      </div>
      <div className="param-strip__hint">Click a chip to change its default · Used by chat AI</div>
    </div>
  );
}

// Forge components: ForgeSelect, ForgeOption, ForgeTextField
import { ForgeSelect, ForgeOption, ForgeTextField } from '@tylertech/forge-react';
import { DATE_RANGE_PRESETS } from '../../data/parameterPresets.js';

/**
 * Type-aware editor for a single parameter value (either its default in the
 * authoring surface, or its runtime value in the parameter strip).
 *
 * Props:
 *   param: full parameter object
 *   value: current value (for the strip; for the authoring surface, pass param.defaultValue)
 *   onChange(newValue)
 *   compact?: render small/inline (for the parameter strip)
 */
export default function ParameterValueEditor({ param, value, onChange, compact = false }) {
  const density = compact ? 'small' : 'default';

  if (param.type === 'date_range') {
    return (
      <ForgeSelect
        density={density}
        value={value || 'last_90d'}
        on-change={(e) => onChange(e.detail)}
      >
        {DATE_RANGE_PRESETS.map(p => (
          <ForgeOption key={p.value} value={p.value}>{p.label}</ForgeOption>
        ))}
      </ForgeSelect>
    );
  }

  if (param.type === 'multi_select') {
    const options = param.options || [];
    const arr = Array.isArray(value) ? value : (value ? [value] : []);
    return (
      <div className="param-multi-edit">
        {options.length === 0 ? (
          <span className="param-multi-edit__hint">
            No options defined. {compact ? '' : 'Add options below.'}
          </span>
        ) : (
          options.map(opt => {
            const checked = arr.includes(opt.value) || arr.includes('all');
            return (
              <label key={opt.value} className={`param-multi-edit__chip ${checked ? 'is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    // 'all' toggle clears specific selections
                    if (opt.value === 'all') {
                      onChange(e.target.checked ? ['all'] : []);
                      return;
                    }
                    let next = arr.filter(v => v !== 'all');
                    next = e.target.checked
                      ? [...next, opt.value]
                      : next.filter(v => v !== opt.value);
                    if (next.length === 0) next = ['all'];
                    onChange(next);
                  }}
                />
                <span>{opt.label}</span>
              </label>
            );
          })
        )}
      </div>
    );
  }

  if (param.type === 'number') {
    return (
      <ForgeTextField density={density}>
        <input
          type="number"
          value={String(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </ForgeTextField>
    );
  }

  // string
  return (
    <ForgeTextField density={density}>
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
      />
    </ForgeTextField>
  );
}

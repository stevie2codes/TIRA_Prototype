// Forge components: ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption, ForgeSwitch
import { useState } from 'react';
import {
  ForgeIcon, ForgeIconButton, ForgeButton, ForgeTextField, ForgeSelect, ForgeOption, ForgeSwitch,
} from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { normalizeColumn, COLUMN_FORMATS, defaultAlign } from '../../utils/columnConfig.js';
import './EditColumnsModal.css';

const ALIGN_OPTIONS = [
  { value: 'left',   label: 'L', icon: 'format_align_left'   },
  { value: 'center', label: 'C', icon: 'format_align_center' },
  { value: 'right',  label: 'R', icon: 'format_align_right'  },
];

export default function EditColumnsModal({ widget, onClose }) {
  const { fieldLibrary, updateColumnConfig, reorderColumns, removeFieldFromWidgetBinding } = useReport();
  const [dragIndex, setDragIndex] = useState(null);

  const rawColumns = widget.bindings?.columns || [];
  const columns = rawColumns.map(normalizeColumn).filter(Boolean);

  const handleDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    if (dragIndex == null || dragIndex === toIdx) return;
    reorderColumns(widget.id, dragIndex, toIdx);
    setDragIndex(null);
  };

  return (
    <div className="edit-columns__backdrop" onClick={onClose}>
      <div className="edit-columns__modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-columns__head">
          <div>
            <h3 className="edit-columns__title">Edit columns</h3>
            <div className="edit-columns__subtitle">{widget.title}</div>
          </div>
          <ForgeIconButton on-click={onClose} aria-label="Close">
            <ForgeIcon name="close" />
          </ForgeIconButton>
        </div>

        {columns.length === 0 ? (
          <div className="edit-columns__empty">
            No columns yet. Drag fields onto the table or close this dialog and add fields from the left palette.
          </div>
        ) : (
          <div className="edit-columns__table">
            <div className="edit-columns__row edit-columns__row--head">
              <div className="edit-columns__cell-handle" />
              <div className="edit-columns__cell-name">Display name</div>
              <div className="edit-columns__cell-format">Format</div>
              <div className="edit-columns__cell-align">Align</div>
              <div className="edit-columns__cell-totals">Totals</div>
              <div className="edit-columns__cell-actions">Hide / Remove</div>
            </div>

            {columns.map((col, idx) => {
              const fieldMeta = fieldLibrary.find(f => f.id === col.fieldId);
              const currentAlign = col.align || defaultAlign(fieldMeta);
              const currentFormat = col.format || 'auto';

              return (
                <div
                  key={col.fieldId}
                  className={`edit-columns__row ${dragIndex === idx ? 'is-dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <div className="edit-columns__cell-handle">
                    <ForgeIcon name="drag_indicator" style={{ color: '#9ca3af' }} />
                  </div>

                  <div className="edit-columns__cell-name">
                    <ForgeTextField density="small">
                      <input
                        type="text"
                        value={col.displayName || fieldMeta?.displayName || col.fieldId}
                        onChange={(e) => updateColumnConfig(widget.id, col.fieldId, { displayName: e.target.value })}
                        placeholder={fieldMeta?.displayName || col.fieldId}
                      />
                    </ForgeTextField>
                    <div className="edit-columns__field-id">
                      <code>{col.fieldId}</code>
                    </div>
                  </div>

                  <div className="edit-columns__cell-format">
                    <ForgeSelect
                      density="small"
                      value={currentFormat}
                      on-change={(e) => updateColumnConfig(widget.id, col.fieldId, { format: e.detail })}
                    >
                      {COLUMN_FORMATS.map(f => (
                        <ForgeOption key={f.value} value={f.value}>{f.label}</ForgeOption>
                      ))}
                    </ForgeSelect>
                    {(currentFormat === 'number' || currentFormat === 'currency' || currentFormat === 'percentage') && (
                      <input
                        type="number"
                        min="0"
                        max="6"
                        value={col.formatOptions?.decimals ?? (currentFormat === 'percentage' ? 1 : 0)}
                        onChange={(e) => updateColumnConfig(widget.id, col.fieldId, {
                          formatOptions: { ...(col.formatOptions || {}), decimals: Number(e.target.value) },
                        })}
                        className="edit-columns__decimals"
                        title="Decimal places"
                      />
                    )}
                    {currentFormat === 'currency' && (
                      <input
                        type="text"
                        value={col.formatOptions?.symbol ?? '$'}
                        onChange={(e) => updateColumnConfig(widget.id, col.fieldId, {
                          formatOptions: { ...(col.formatOptions || {}), symbol: e.target.value },
                        })}
                        className="edit-columns__currency-symbol"
                        maxLength={3}
                        title="Currency symbol"
                      />
                    )}
                  </div>

                  <div className="edit-columns__cell-align">
                    <div className="edit-columns__align-group">
                      {ALIGN_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`edit-columns__align-btn ${currentAlign === opt.value ? 'is-active' : ''}`}
                          onClick={() => updateColumnConfig(widget.id, col.fieldId, { align: opt.value })}
                          title={opt.value}
                          aria-label={`Align ${opt.value}`}
                        >
                          <ForgeIcon name={opt.icon} style={{ fontSize: 14 }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="edit-columns__cell-totals">
                    <ForgeSwitch
                      selected={!!col.includeInTotals}
                      on-forge-switch-change={() => updateColumnConfig(widget.id, col.fieldId, { includeInTotals: !col.includeInTotals })}
                    />
                  </div>

                  <div className="edit-columns__cell-actions">
                    <ForgeIconButton
                      density="small"
                      on-click={() => updateColumnConfig(widget.id, col.fieldId, { hidden: !col.hidden })}
                      title={col.hidden ? 'Show column' : 'Hide column'}
                      aria-label={col.hidden ? 'Show column' : 'Hide column'}
                    >
                      <ForgeIcon name={col.hidden ? 'visibility_off' : 'visibility'} />
                    </ForgeIconButton>
                    <ForgeIconButton
                      density="small"
                      on-click={() => removeFieldFromWidgetBinding(widget.id, 'columns', col.fieldId)}
                      title="Remove column"
                      aria-label="Remove column"
                    >
                      <ForgeIcon name="delete_outline" />
                    </ForgeIconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="edit-columns__foot">
          <div className="edit-columns__hint">Tip: drag a row to reorder. Drag a field from the Fields palette onto the table to add a column.</div>
          <ForgeButton type="raised" on-click={onClose}>Done</ForgeButton>
        </div>
      </div>
    </div>
  );
}

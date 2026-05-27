// Forge components: ForgeExpansionPanel, ForgeIcon, ForgeTextField
import { useState, useMemo } from 'react';
import { ForgeExpansionPanel, ForgeIcon, ForgeTextField } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { sourceCatalog } from '../../data/sourceCatalog.js';
import './SourceCatalog.css';

const SYSTEM_ICONS = {
  EPL:    { icon: 'description',      color: '#2563eb' },
  ERP:    { icon: 'account_balance',  color: '#16a34a' },
  Courts: { icon: 'shield',           color: '#db2777' },
};

const TYPE_LABELS = {
  table:       'table',
  view:        'view',
  stored_proc: 'stored proc',
};

export default function SourceCatalog() {
  const { selectedSources, addSourceFromCatalog } = useReport();
  const [query, setQuery] = useState('');

  const onCanvas = useMemo(
    () => new Set(selectedSources.map(s => s.sourceId)),
    [selectedSources]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sourceCatalog;
    return sourceCatalog
      .map(group => ({
        ...group,
        sources: group.sources.filter(s =>
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        ),
      }))
      .filter(group => group.sources.length > 0);
  }, [query]);

  const onDragStart = (event, source) => {
    event.dataTransfer.setData('application/x-tira-source', JSON.stringify({ sourceId: source.id }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="source-catalog">
      <div className="source-catalog__header">
        <div className="source-catalog__label">SOURCE CATALOG</div>
        <ForgeTextField density="small">
          <input
            type="text"
            placeholder="Search sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </ForgeTextField>
      </div>

      <div className="source-catalog__list">
        {filtered.map(group => {
          const sys = SYSTEM_ICONS[group.system] || SYSTEM_ICONS.EPL;
          return (
            <ForgeExpansionPanel key={group.system} open>
              <div slot="header" className="source-catalog__group-header">
                <ForgeIcon name={sys.icon} style={{ color: sys.color, fontSize: 16 }} />
                <span>{group.system}</span>
                <span className="source-catalog__group-count">{group.sources.length}</span>
              </div>
              <div className="source-catalog__items">
                {group.sources.map(source => {
                  const added = onCanvas.has(source.id);
                  return (
                    <div
                      key={source.id}
                      className={`source-catalog__item ${added ? 'is-added' : ''}`}
                      draggable={!added}
                      onDragStart={(e) => onDragStart(e, source)}
                      onClick={() => !added && addSourceFromCatalog(source.id)}
                      title={source.description}
                    >
                      <div className="source-catalog__item-main">
                        <div className="source-catalog__item-name">{source.label}</div>
                        <div className="source-catalog__item-meta">
                          {group.system} · {TYPE_LABELS[source.type] || source.type} · {source.rowCount.toLocaleString()} rows
                        </div>
                      </div>
                      {added && (
                        <ForgeIcon name="check_circle" style={{ color: '#16a34a', fontSize: 16 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </ForgeExpansionPanel>
          );
        })}
      </div>
    </div>
  );
}

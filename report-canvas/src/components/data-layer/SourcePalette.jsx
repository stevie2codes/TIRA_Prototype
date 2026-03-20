// Forge components: ForgeExpansionPanel, ForgeIcon
import { ForgeExpansionPanel, ForgeIcon } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';

const CATEGORY_STYLES = {
  'People & Citizens':       { icon: 'people',          bg: '#eff6ff', fg: '#2563eb' },
  'Operations & Services':   { icon: 'engineering',     bg: '#f0fdf4', fg: '#16a34a' },
  'Financial & Accounting':  { icon: 'account_balance', bg: '#fefce8', fg: '#ca8a04' },
  'Compliance & Licensing':  { icon: 'verified',        bg: '#fdf2f8', fg: '#db2777' },
  'Assets & Inventory':      { icon: 'inventory_2',     bg: '#faf5ff', fg: '#9333ea' },
};

const transforms = [
  { type: 'transform', subtype: 'filter', icon: 'filter_alt', label: 'Filter', desc: 'Include / exclude rows' },
  { type: 'transform', subtype: 'aggregate', icon: 'functions', label: 'Aggregate', desc: 'Sum, avg, count…' },
  { type: 'transform', subtype: 'calculated', icon: 'calculate', label: 'Calculated Field', desc: 'Derive new columns' },
  { type: 'transform', subtype: 'sort', icon: 'sort', label: 'Sort', desc: 'Order by column' },
];

const ICON_COLORS = {
  transform: { bg: '#fffbeb', fg: '#d97706' },
};

export default function SourcePalette() {
  const { availableSources } = useReport();

  const onDragStart = (event, nodeConfig) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeConfig));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group available sources by category
  const groupedSources = availableSources.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const renderSourceItem = (item) => {
    const style = CATEGORY_STYLES[item.category] || { icon: 'dataset', bg: '#f3f4f6', fg: '#6b7280' };
    const dragData = { type: 'source', subtype: item.type, label: item.label };
    return (
      <div
        key={item.type}
        className="palette-item-rich source"
        draggable
        onDragStart={(e) => onDragStart(e, dragData)}
      >
        <div className="palette-icon-container" style={{ background: style.bg }}>
          <ForgeIcon name={style.icon} style={{ color: style.fg, fontSize: 18 }} />
        </div>
        <div className="palette-item-text">
          <span className="palette-item-label">{item.label}</span>
          <span className="palette-item-desc">{item.description}</span>
        </div>
        <ForgeIcon name="drag_indicator" className="palette-drag-hint" />
      </div>
    );
  };

  const renderTransformItem = (item) => (
    <div
      key={item.subtype}
      className={`palette-item-rich ${item.type}`}
      draggable
      onDragStart={(e) => onDragStart(e, item)}
    >
      <div className="palette-icon-container" style={{ background: ICON_COLORS.transform.bg }}>
        <ForgeIcon name={item.icon} style={{ color: ICON_COLORS.transform.fg, fontSize: 18 }} />
      </div>
      <div className="palette-item-text">
        <span className="palette-item-label">{item.label}</span>
        <span className="palette-item-desc">{item.desc}</span>
      </div>
      <ForgeIcon name="drag_indicator" className="palette-drag-hint" />
    </div>
  );

  return (
    <div className="palette">
      {availableSources.length === 0 ? (
        <div style={{ padding: '16px', color: '#6b7280', fontSize: 14 }}>Loading...</div>
      ) : (
        Object.entries(groupedSources).map(([category, items]) => (
          <ForgeExpansionPanel key={category} open>
            <span slot="header">{category}</span>
            <div className="palette-items">
              {items.map(renderSourceItem)}
            </div>
          </ForgeExpansionPanel>
        ))
      )}
      <ForgeExpansionPanel open>
        <span slot="header">Transforms</span>
        <div className="palette-items">
          {transforms.map(renderTransformItem)}
        </div>
      </ForgeExpansionPanel>
    </div>
  );
}

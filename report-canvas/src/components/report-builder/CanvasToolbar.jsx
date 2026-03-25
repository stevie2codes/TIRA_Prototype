import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { PAGE_SIZES } from '../../constants/pageSettings.js';

export default function CanvasToolbar() {
  const {
    viewMode, setViewMode,
    zoom, setZoom,
    pageSize, setPageSize,
    orientation, setOrientation,
    showRulers, setShowRulers,
  } = useReport();

  const isPrint = viewMode === 'print';

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-group">
        <button
          className={`toolbar-toggle-btn${viewMode === 'print' ? ' active' : ''}`}
          onClick={() => setViewMode('print')}
          title="Print Layout"
        >
          <ForgeIcon name="description" />
          <span>Print</span>
        </button>
        <button
          className={`toolbar-toggle-btn${viewMode === 'dashboard' ? ' active' : ''}`}
          onClick={() => setViewMode('dashboard')}
          title="Dashboard Layout"
        >
          <ForgeIcon name="dashboard" />
          <span>Dashboard</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <ForgeIconButton density="small" on-click={() => setZoom(z => Math.max(50, z - 10))}>
          <ForgeIcon name="remove" />
        </ForgeIconButton>
        <span className="toolbar-zoom-label">{zoom}%</span>
        <ForgeIconButton density="small" on-click={() => setZoom(z => Math.min(200, z + 10))}>
          <ForgeIcon name="add" />
        </ForgeIconButton>
        <input
          type="range"
          className="toolbar-zoom-slider"
          min={50}
          max={200}
          step={10}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>

      {isPrint && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <select
              className="toolbar-select"
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
            >
              {Object.entries(PAGE_SIZES).map(([key, size]) => (
                <option key={key} value={key}>{size.label}</option>
              ))}
            </select>
            <ForgeIconButton
              density="small"
              on-click={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
              title={orientation === 'portrait' ? 'Switch to Landscape' : 'Switch to Portrait'}
            >
              <ForgeIcon name={orientation === 'portrait' ? 'crop_portrait' : 'crop_landscape'} />
            </ForgeIconButton>
            <ForgeIconButton
              density="small"
              on-click={() => setShowRulers(r => !r)}
              title={showRulers ? 'Hide Rulers' : 'Show Rulers'}
            >
              <ForgeIcon name="straighten" style={showRulers ? {} : { opacity: 0.4 }} />
            </ForgeIconButton>
          </div>
        </>
      )}
    </div>
  );
}

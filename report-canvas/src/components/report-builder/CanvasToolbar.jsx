import { ForgeIcon, ForgeIconButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { PAGE_SIZES } from '../../constants/pageSettings.js';

export default function CanvasToolbar() {
  const {
    zoom, setZoom,
    pageSize, setPageSize,
    orientation, setOrientation,
    showRulers, setShowRulers,
  } = useReport();

  return (
    <div className="canvas-toolbar">
      <div className="toolbar-group">
        <ForgeIconButton density="small" on-click={() => setZoom(z => Math.max(20, z - 10))}>
          <ForgeIcon name="remove" />
        </ForgeIconButton>
        <span className="toolbar-zoom-label">{zoom}%</span>
        <ForgeIconButton density="small" on-click={() => setZoom(z => Math.min(200, z + 10))}>
          <ForgeIcon name="add" />
        </ForgeIconButton>
        <input
          type="range"
          className="toolbar-zoom-slider"
          min={20}
          max={200}
          step={5}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <ForgeIconButton
          density="small"
          on-click={() => setZoom(100)}
          aria-label="Reset zoom to 100%"
          title="Reset zoom to 100%"
        >
          <ForgeIcon name="center_focus_strong" />
        </ForgeIconButton>
        <ForgeIconButton
          density="small"
          on-click={() => setZoom(40)}
          aria-label="Fit pages"
          title="Fit all pages"
        >
          <ForgeIcon name="fit_screen" />
        </ForgeIconButton>
      </div>

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
    </div>
  );
}

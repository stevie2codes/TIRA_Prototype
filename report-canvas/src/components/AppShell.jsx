// Forge components: ForgeAppBar, ForgeButtonToggleGroup, ForgeButtonToggle, ForgeIcon, ForgeIconButton, ForgeButton, ForgeAvatar, ForgeToast
import { useRef, useCallback, useState } from 'react';
import {
  ForgeAppBar, ForgeIcon, ForgeIconButton, ForgeButton,
  ForgeAvatar, ForgeButtonToggleGroup, ForgeButtonToggle, ForgeToast,
} from '@tylertech/forge-react';
import { useReport } from '../context/ReportContext.jsx';
import DataLayerCanvas from './data-layer/DataLayerCanvas.jsx';
import SourcePalette from './data-layer/SourcePalette.jsx';
import PropertiesPanel from './PropertiesPanel.jsx';
import ReportCanvas from './report-builder/ReportCanvas.jsx';
import WidgetPalette from './report-builder/WidgetPalette.jsx';

function HandoffBanner({ context, onDismiss }) {
  if (!context) return null;

  return (
    <div className="handoff-banner">
      <div className="handoff-banner-icon">
        <ForgeIcon name="auto_awesome" />
      </div>
      <div className="handoff-banner-content">
        <strong>Context transferred from Report Assistant</strong>
        <span className="handoff-banner-detail">
          {context.reportTitle} — {context.dataSource}
          {context.columns && ` — ${context.columns.length} columns, ${context.data?.length || 0} rows`}
        </span>
        {context.handoffReason && (
          <span className="handoff-banner-reason">
            <ForgeIcon name="chat_bubble_outline" style={{ fontSize: 14 }} />
            "{context.handoffReason}"
          </span>
        )}
      </div>
      <ForgeIconButton on-click={onDismiss} density="small" aria-label="Dismiss">
        <ForgeIcon name="close" />
      </ForgeIconButton>
    </div>
  );
}

export default function AppShell() {
  const { activeTab, setActiveTab, handoffContext } = useReport();
  const saveToastRef = useRef(null);
  const settingsToastRef = useRef(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showBanner, setShowBanner] = useState(!!handoffContext);

  const handleToggleChange = (e) => {
    const val = e.detail;
    if (val === 'data-layer') setActiveTab(0);
    else if (val === 'report-builder') setActiveTab(1);
  };

  const handleSave = useCallback(() => {
    if (saveToastRef.current) {
      saveToastRef.current.open = true;
    }
  }, []);

  const handleSettings = useCallback(() => {
    if (settingsToastRef.current) {
      settingsToastRef.current.open = true;
    }
  }, []);

  return (
    <div className="app-layout">
      <ForgeAppBar title-text="Report Builder">
        <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ForgeIconButton on-click={handleSettings}>
            <ForgeIcon name="settings" />
          </ForgeIconButton>
          <ForgeAvatar text="SW" />
        </div>
      </ForgeAppBar>

      {showBanner && (
        <HandoffBanner
          context={handoffContext}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      <div className="mode-bar">
        <div className="mode-bar-meta">
          {activeTab === 0
            ? <span className="mode-hint">Model your data sources and relationships</span>
            : <span className="mode-hint">Design your report layout</span>}
        </div>
        <ForgeButtonToggleGroup
          value={activeTab === 0 ? 'data-layer' : 'report-builder'}
          mandatory
          dense
          on-forge-button-toggle-group-change={handleToggleChange}
        >
          <ForgeButtonToggle value="data-layer">
            <ForgeIcon name="account_tree" slot="leading" />
            Data Layer
          </ForgeButtonToggle>
          <ForgeButtonToggle value="report-builder">
            <ForgeIcon name="dashboard" slot="leading" />
            Report Builder
          </ForgeButtonToggle>
        </ForgeButtonToggleGroup>
        <div className="mode-bar-actions">
          <ForgeButton variant="raised" on-click={handleSave}>
            Publish
          </ForgeButton>
        </div>
      </div>

      <div className="canvas-area">
        <div className={`left-sidebar${leftOpen ? '' : ' collapsed'}`}>
          <div className="sidebar-toggle-header">
            {leftOpen && (
              <div className="sidebar-header-group">
                <span className="sidebar-title">
                  {activeTab === 0 ? 'Sources' : 'Widgets'}
                </span>
                <span className="sidebar-subtitle">
                  {activeTab === 0 ? 'Drag onto canvas' : 'Click or drag to add'}
                </span>
              </div>
            )}
            <ForgeIconButton on-click={() => setLeftOpen(o => !o)} density="small">
              <ForgeIcon name={leftOpen ? 'chevron_left' : 'chevron_right'} />
            </ForgeIconButton>
          </div>
          {leftOpen && (
            <div className="sidebar-body">
              {activeTab === 0 ? <SourcePalette /> : <WidgetPalette />}
            </div>
          )}
        </div>
        <div className="canvas-main">
          {activeTab === 0 ? <DataLayerCanvas /> : <ReportCanvas />}
        </div>
        <div className={`right-sidebar${rightOpen ? '' : ' collapsed'}`}>
          <div className="sidebar-toggle-header">
            <ForgeIconButton on-click={() => setRightOpen(o => !o)} density="small">
              <ForgeIcon name={rightOpen ? 'chevron_right' : 'chevron_left'} />
            </ForgeIconButton>
            {rightOpen && (
              <div className="sidebar-header-group" style={{ textAlign: 'right' }}>
                <span className="sidebar-title">Properties</span>
                <span className="sidebar-subtitle">
                  {activeTab === 0 ? 'Node settings' : 'Widget settings'}
                </span>
              </div>
            )}
          </div>
          {rightOpen && (
            <div className="sidebar-body">
              <PropertiesPanel />
            </div>
          )}
        </div>
      </div>

      <ForgeToast ref={saveToastRef} placement="bottom">
        Report saved successfully
      </ForgeToast>
      <ForgeToast ref={settingsToastRef} placement="bottom">
        Settings coming soon
      </ForgeToast>
    </div>
  );
}

// Forge components: ForgeAppBar, ForgeButtonToggleGroup, ForgeButtonToggle, ForgeIcon, ForgeIconButton, ForgeButton, ForgeAvatar, ForgeToast
import { useRef, useCallback, useState, useEffect } from 'react';
import {
  ForgeAppBar, ForgeIcon, ForgeIconButton, ForgeButton,
  ForgeAvatar, ForgeButtonToggleGroup, ForgeButtonToggle, ForgeToast,
} from '@tylertech/forge-react';
import { useReport } from '../context/ReportContext.jsx';
import { outputTemplates, getTemplateById } from '../../../src/output-templates.js';
import DataLayerCanvas from './data-layer/DataLayerCanvas.jsx';
import SourcePalette from './data-layer/SourcePalette.jsx';
import PropertiesPanel from './PropertiesPanel.jsx';
import ReportCanvas from './report-builder/ReportCanvas.jsx';
import WidgetPalette from './report-builder/WidgetPalette.jsx';
import CanvasToolbar from './report-builder/CanvasToolbar.jsx';
import AIChatPanel from './AIChatPanel.jsx';

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
  const { activeTab, setActiveTab, handoffContext, activeTemplateId, setActiveTemplateId, rightPanelTab, setRightPanelTab } = useReport();
  const saveToastRef = useRef(null);
  const settingsToastRef = useRef(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showBanner, setShowBanner] = useState(!!handoffContext);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);

  const activeTemplate = activeTemplateId ? getTemplateById(activeTemplateId) : null;

  const handleToggleChange = (e) => {
    const val = e.detail;
    if (val === 'data-layer') setActiveTab(0);
    else if (val === 'report-builder') setActiveTab(1);
  };

  // Close template dropdown on outside click
  const templatePickerRef = useRef(null);
  const handleDocClick = useCallback((e) => {
    if (templatePickerRef.current && !templatePickerRef.current.contains(e.target)) {
      setTemplateDropdownOpen(false);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, [handleDocClick]);

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
          <div className="designer-template-picker" ref={templatePickerRef} style={{ position: 'relative' }}>
            <button
              className={`designer-template-btn${activeTemplate ? ' has-template' : ''}`}
              onClick={(e) => { e.stopPropagation(); setTemplateDropdownOpen(o => !o); }}
              style={activeTemplate ? { borderColor: activeTemplate.theme.primary, color: activeTemplate.theme.primary } : {}}
            >
              <ForgeIcon name="palette" />
              <span>{activeTemplate ? `Template: ${activeTemplate.name}` : 'Template: None'}</span>
              <ForgeIcon name="arrow_drop_down" />
            </button>
            {templateDropdownOpen && (
              <div className="designer-template-dropdown" onClick={() => setTemplateDropdownOpen(false)}>
                <button
                  className="designer-template-option"
                  onClick={() => { setActiveTemplateId(null); setTemplateDropdownOpen(false); }}
                >
                  <span className="template-color-dot" style={{ background: '#9e9e9e' }} />
                  <span>None</span>
                </button>
                <div className="designer-template-divider" />
                {outputTemplates.map(t => (
                  <button
                    key={t.id}
                    className={`designer-template-option${activeTemplateId === t.id ? ' active' : ''}`}
                    onClick={() => { setActiveTemplateId(t.id); setTemplateDropdownOpen(false); }}
                  >
                    <span className="template-color-dot" style={{ background: t.theme.primary }} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <ForgeButton variant="outlined" on-click={() => window.print()}>
            <ForgeIcon name="print" slot="leading" />
            Print
          </ForgeButton>
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
          {activeTab === 1 && <CanvasToolbar />}
          {activeTab === 0 ? <DataLayerCanvas /> : <ReportCanvas />}
        </div>
        <div className={`right-sidebar${rightOpen ? '' : ' collapsed'}`}>
          <div className="sidebar-toggle-header">
            <ForgeIconButton on-click={() => setRightOpen(o => !o)} density="small">
              <ForgeIcon name={rightOpen ? 'chevron_right' : 'chevron_left'} />
            </ForgeIconButton>
            {rightOpen && (
              <div className="right-sidebar-tabs">
                <button
                  className={`sidebar-tab${rightPanelTab === 'properties' ? ' active' : ''}`}
                  onClick={() => setRightPanelTab('properties')}
                >
                  <ForgeIcon name="tune" />
                  <span>Properties</span>
                </button>
                <button
                  className={`sidebar-tab${rightPanelTab === 'ai-chat' ? ' active' : ''}`}
                  onClick={() => setRightPanelTab('ai-chat')}
                >
                  <ForgeIcon name="auto_awesome" />
                  <span>AI Chat</span>
                </button>
              </div>
            )}
          </div>
          {rightOpen && (
            <div className="sidebar-body">
              {rightPanelTab === 'properties' ? <PropertiesPanel /> : <AIChatPanel />}
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

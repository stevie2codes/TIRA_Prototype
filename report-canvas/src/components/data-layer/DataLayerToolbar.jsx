// Forge components: ForgeIcon, ForgeButton
import { ForgeIcon, ForgeButton } from '@tylertech/forge-react';
import { useReport } from '../../context/ReportContext.jsx';
import { buildSqlFromModel } from '../../utils/buildSqlFromModel.js';

export default function DataLayerToolbar() {
  const {
    dataLayerView, setDataLayerView,
    selectedSources, relationships, measures,
    setSqlDraft, sqlDraft,
  } = useReport();

  const regenerate = () => {
    setSqlDraft(buildSqlFromModel({ selectedSources, relationships, measures }));
  };

  // When the user switches TO sql view and the draft is empty, auto-generate.
  const switchTo = (view) => {
    if (view === 'sql' && (!sqlDraft || sqlDraft.trim() === '')) {
      setSqlDraft(buildSqlFromModel({ selectedSources, relationships, measures }));
    }
    setDataLayerView(view);
  };

  return (
    <div className="data-layer-toolbar">
      <div className="data-layer-toolbar__switcher">
        <button
          className={`data-layer-toolbar__btn ${dataLayerView === 'canvas' ? 'is-active' : ''}`}
          onClick={() => switchTo('canvas')}
        >
          <ForgeIcon name="account_tree" style={{ fontSize: 14 }} />
          <span>Canvas</span>
        </button>
        <button
          className={`data-layer-toolbar__btn ${dataLayerView === 'sql' ? 'is-active' : ''}`}
          onClick={() => switchTo('sql')}
        >
          <ForgeIcon name="code" style={{ fontSize: 14 }} />
          <span>SQL</span>
        </button>
      </div>

      <div className="data-layer-toolbar__actions">
        {dataLayerView === 'sql' && (
          <ForgeButton type="outlined" density="small" on-click={regenerate}>
            <ForgeIcon name="refresh" slot="leading" style={{ fontSize: 14 }} />
            Regenerate from model
          </ForgeButton>
        )}
      </div>
    </div>
  );
}

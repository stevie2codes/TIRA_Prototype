// Forge components: none (delegates to sub-panels)
import { useReport } from '../context/ReportContext.jsx';
import NodeConfigPanel from './data-layer/NodeConfigPanel.jsx';
import WidgetConfigPanel from './report-builder/WidgetConfigPanel.jsx';

export default function PropertiesPanel() {
  const { activeTab } = useReport();

  if (activeTab === 0) {
    return <NodeConfigPanel />;
  }

  return <WidgetConfigPanel />;
}

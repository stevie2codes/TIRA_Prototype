import { useReport } from '../../context/ReportContext.jsx';
import PrintCanvas from './PrintCanvas.jsx';
import DashboardCanvas from './DashboardCanvas.jsx';

export default function ReportCanvas() {
  const { viewMode } = useReport();
  return viewMode === 'print' ? <PrintCanvas /> : <DashboardCanvas />;
}

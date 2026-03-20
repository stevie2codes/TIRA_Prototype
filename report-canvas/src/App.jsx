import './App.css';
import { ReportProvider } from './context/ReportContext.jsx';
import AppShell from './components/AppShell.jsx';

export default function App() {
  return (
    <ReportProvider>
      <AppShell />
    </ReportProvider>
  );
}

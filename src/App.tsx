import { useEffect, useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Content from './components/Content';

type TabId = 'notes' | 'tasks' | 'calendar';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const [connectionStatus, setConnectionStatus] = useState(false);


  useEffect(() => {
    const unsubscribeStatus = window.electronAPI.onStatusUpdate((data: { isReady: boolean }) => {
      setConnectionStatus(data.isReady);
    });
    const unsubscribeOpenAppListener = window.electronAPI.openAppListener((data: { tab: TabId }) => {
      setActiveTab(data.tab)
    })
    const unsubscribeImport = window.electronAPI.onImportNotes(async () => {
      await window.electronAPI.openFile();
      setActiveTab('notes');
    });

    const unsubscribeExport = window.electronAPI.onExportNotes(async () => {
      await window.electronAPI.saveFile();
    });
    return () => {
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeOpenAppListener) unsubscribeOpenAppListener();
      if (unsubscribeImport) unsubscribeImport();
      if (unsubscribeExport) unsubscribeExport();
    };
  }, []);

  if (!window.electronAPI) return null;

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <div>
        <Header />
        {connectionStatus && <Tabs activeTab={activeTab} onTabChange={setActiveTab} />}
      </div>
      {
        connectionStatus
          ? <>
            <Content activeTab={activeTab} />
          </>
          : <div className='flex justify-center items-center h-[80vh]' >
            <p>Connecting...</p>
          </div>
      }

    </div>
  );
}

export default App;

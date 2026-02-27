import { useEffect, useState } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Content from './components/Content';
import './App.css';

type TabId = 'notes' | 'tasks' | 'calendar';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('notes');
  const [connectionStatus, setConnectionStatus] = useState(false);

  
  useEffect(() => {
    const unsubscribeStatus = window.electronAPI.onStatusUpdate((data: { isReady: boolean }) => {
      setConnectionStatus(data.isReady);
    });
    const unsubscribeOpenAppListener = window.electronAPI.openAppListener((data: {tab: TabId}) => {
      setActiveTab(data.tab)
    })
    return () => {
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeOpenAppListener) unsubscribeOpenAppListener();
    };
  }, []);

  if (!window.electronAPI) return null;

  return (
    <div className="app">
      <div>
        <Header />
      {connectionStatus && <Tabs activeTab={activeTab} onTabChange={setActiveTab} />}
      </div>
      {
        connectionStatus 
        ? <>
            <Content activeTab={activeTab} />
          </>
        : <div style={{display: 'flex', justifyContent:'center',alignItems:'center',height:'80vh'}}>
          <p>Connecting...</p>
        </div>
      }
      
    </div>
  );
}

export default App;

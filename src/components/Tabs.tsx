import React from 'react';

type TabId = 'notes' | 'tasks' | 'calendar';

interface Tab {
  id: TabId;
  label: string;
}

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const tabs: Tab[] = [
  { id: 'notes', label: 'Notes' },
  { id: 'tasks', label: 'Tasks' },
];

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;

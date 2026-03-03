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
    <nav className="bg-white flex gap-0 px-6 border-b border-gray-200 shadow-sm w-full flex-shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`px-6 py-3.5 border-none bg-transparent text-sm font-medium text-gray-500 cursor-pointer relative hover:text-indigo-500 hover:bg-gray-50 transition-colors ${activeTab === tab.id ? 'text-indigo-500' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t" />
          )}
        </button>
      ))
      }
    </nav >
  );
};

export default Tabs;

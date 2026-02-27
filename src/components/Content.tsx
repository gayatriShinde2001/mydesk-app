import React from 'react';
import NotesList from './NotesList';
import TasksList from './TasksList';

type TabId = 'notes' | 'tasks' | 'calendar';

interface ContentProps {
  activeTab: TabId;
}

const Content: React.FC<ContentProps> = ({ activeTab }) => {
  return (
    <main className="content">
      {activeTab === 'notes' && <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}><NotesList /></div>}
      {activeTab === 'tasks' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TasksList />
        </div>
      )}
      {activeTab === 'calendar' && (
        <div className="placeholder">
          <h2>Calendar</h2>
          <p>Calendar feature coming soon...</p>
        </div>
      )}
    </main>
  );
};

export default Content;

/// <reference types="react-scripts" />

interface Note {
  id: string;
  title: string;
  content: string;
}
interface NewNote extends Omit<Note, 'id'> { }

interface Task {
  id: string;
  name: string;
  description: string;
  remindAt: string;
  status: 'todo' | 'inprogress' | 'done';
  isOverdue: boolean;
}
interface NewTask {
  name: string;
  description: string;
  remindAt: string;
}

interface Window {
  electronAPI: {
    onExportNotes(arg0: () => Promise<void>): () => {};
    onImportNotes(arg0: () => Promise<void>): () => {};
    showTaskContextMenu(task: Task): unknown;
    reloadTasksListener(onTaskRefreshEvent: () => void): () => {};
    reloadNotesListener(onNotesRefreshEvent: () => void): () => {};
    onCloseRequest(handleClose: () => Promise<void>): () => {};
    showCustomDialog(arg0: { message: string; buttons: string[]; }): unknown;
    onAppClosing(callback: () => Promise<void>): void;
    onStatusUpdate(callback: (data: { isReady: boolean }) => void): () => {};
    ping: () => Promise<string>;
    addNote: (note: NewNote) => Promise<{ success: boolean; data?: Note[]; error?: string }>;
    loadNotes: () => Promise<{ success: boolean; data?: Note[]; error?: string }>;
    deleteNote: (id: string) => Promise<{ success: boolean; data?: Note[]; error?: string; cancelled?: boolean }>;
    deleteAllNotes: () => Promise<{ success: boolean; data?: Note[]; error?: string; cancelled?: boolean }>;
    requestCloseNotes: (title: string, content: string) => Promise<{ response: number }>;
    requestCloseTasks: (isModalOpen: boolean) => Promise<{ response: number }>;
    removeAllCloseListeners: () => void;
    openFile: () => Promise<{ success: boolean; data?: Note[]; cancelled?: boolean }>;
    saveFile: () => Promise<{ success: boolean; cancelled?: boolean }>;
    loadTasks: () => Promise<{ success: boolean; data?: Task[]; error?: string }>;
    addTask: (task: NewTask) => Promise<{ success: boolean; data?: Task[]; error?: string }>;
    deleteTask: (taskId: string) => Promise<{ success: boolean; data?: Task[]; error?: string; cancelled?: boolean }>;
    deleteAllTasks: () => Promise<{ success: boolean; data?: Task[]; error?: string; cancelled?: boolean }>;
    updateTaskStatus: (taskId: string, status: 'todo' | 'inprogress' | 'done') => Promise<{ success: boolean; data?: Task[]; error?: string }>;
    filterTasks: (searchTerm: string) => Promise<{ success: boolean; data?: Task[]; error?: string }>;
    openAppListener: (callback: (data: { tab: string }) => void) => () => void;
  }
}

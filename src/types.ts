export interface Note {
  id: string;
  title: string;
  content: string;
}
export interface NewNote extends Omit<Note,'id'>{}

export interface Task {
  id: string;
  name: string;
  description: string;
  expiryDate: string;
}
export interface NewTask extends Omit<Task,'id'>{}

export interface ElectronAPI {
  ping: () => Promise<string>;
  saveNotes: (notes: Note[]) => Promise<{ success: boolean; error?: string }>;
  loadNotes: () => Promise<{ success: boolean; data?: Note[]; error?: string }>;
  addNote: (note: NewNote) => Promise<{ success: boolean; data?: Note[]; error?: string }>;
  deleteNote: (noteId: string) => Promise<{ success: boolean; data?: Note[]; error?: string; cancelled?: boolean }>;
  deleteAllNotes: () => Promise<{ success: boolean; data?: Note[]; error?: string; cancelled?: boolean }>;
  requestCloseNotes: (title: string, content: string) => Promise<{ response: number }>;
  requestCloseTasks: (isModalOpen: boolean) => Promise<{ response: number }>;
  onCloseRequest: (callback: () => Promise<void>) => () => void;
  removeAllCloseListeners: () => void;
  openFile: () => Promise<{ success: boolean; data?: Note[]; cancelled?: boolean }>;
  saveFile: () => Promise<{ success: boolean; cancelled?: boolean }>;
  loadTasks: () => Promise<{ success: boolean; data?: Task[]; error?: string }>;
  addTask: (task: NewTask) => Promise<{ success: boolean; data?: Task[]; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; data?: Task[]; error?: string; cancelled?: boolean }>;
}
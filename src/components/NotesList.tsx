import { useEffect, useRef, useState } from "react";
import NoteCard from "./NoteCard";

interface Note {
  id: string;
  title: string;
  content: string;
}

const NotesList = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
    const handleClose = async () => {
      const title = titleRef.current?.value || "";
      const content = contentRef.current?.value || "";

      await window.electronAPI.requestCloseNotes(title, content);
    };

    const onNotesRefreshEvent = () => {
      console.log('Refreshing notes list');
      loadNotes();
    }

    const unsubscribeClose = window.electronAPI.onCloseRequest(handleClose);
    const unsubscribeNotesLoadEvent = window.electronAPI.reloadNotesListener(onNotesRefreshEvent);
    return () => {
      if (unsubscribeClose) unsubscribeClose();
      if (unsubscribeNotesLoadEvent) unsubscribeNotesLoadEvent();
    };
  }, []);


  const loadNotes = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.loadNotes();
        if (result.success && result.data) {
          setNotes(result.data);
        }
      } else {
        setError('electronAPI not available');
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = () => {
    const title = titleRef.current?.value || "";
    const content = contentRef.current?.value || "";

    if (!title.trim()) return;

    const newNoteObj = {
      title,
      content
    };

    window.electronAPI.addNote(newNoteObj);

    if (titleRef.current) titleRef.current.value = "";
    if (contentRef.current) contentRef.current.value = "";

    loadNotes();
  };


  const handleDeleteAllNotes = async () => {
    const result = await window.electronAPI.deleteAllNotes();
    if (result.success && result.data) {
      setNotes(result.data);
    }
  };


  if (isLoading) {
    return <div className="p-5">Loading notes...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {error && (
        <div className="text-red-600 p-2.5 bg-red-100">
          Error: {error}
        </div>
      )}

      <div className="sticky top-0 bg-gray-100 z-10 px-5 pb-4 flex-shrink-0">
        <div className="mt-5 flex justify-between">
          <div className="flex gap-2.5">
            <input
              ref={titleRef}
              type="text"
              placeholder="Note title"
              className="p-2 flex-1 max-w-[300px] bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              ref={contentRef}
              type="text"
              placeholder="Note content"
              className="p-2 flex-1 max-w-[300px] bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500"
            />
            <button onClick={handleAddNote} className="px-5 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5">
              Add Note
            </button>

          </div>
          <button onClick={handleDeleteAllNotes} className="px-5 py-2 rounded border border-red-500 bg-white text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={notes.length === 0}>
            Delete All
          </button>
        </div>

        <h3 className="mt-5">Your Notes ({notes.length})</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No notes yet. Add one above!</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesList;

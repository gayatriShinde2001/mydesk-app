import React, { useEffect, useRef, useState } from "react";
import NoteCard from "./NoteCard";
import "./NotesList.css";

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

    const unsubscribeClose = window.electronAPI.onCloseRequest(handleClose);
    return () => {
      if(unsubscribeClose) unsubscribeClose();
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

  const handleDeleteNote = async (noteId: string) => {
      const result = await window.electronAPI.deleteNote(noteId);
      if (result.success && result.data) {
        setNotes(result.data); 
      }
  };

  const handleDeleteAllNotes = async () => {
    const result = await window.electronAPI.deleteAllNotes();
    if (result.success && result.data) {
      setNotes(result.data);
    }
  };
  const handleImportNotes = async () => {
    const updatedNotes = await window.electronAPI.openFile();
    if(updatedNotes?.data) setNotes(updatedNotes.data);
  }

  const handleExportNotes = async () =>{
    await window.electronAPI.saveFile()
  }

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading notes...</div>;
  }

  return (
    <div className="notes-container">
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffeeee' }}>
          Error: {error}
        </div>
      )}
      
      <div className="notes-sticky-header">
        <div className="add-note-section">
          <h3>Add New Note</h3>
          <div className="add-note-inputs">
            <input
              ref={titleRef}
              type="text"
              placeholder="Note title"
            />
            <input
              ref={contentRef}
              type="text"
              placeholder="Note content"
            />
            <button onClick={handleAddNote}>
              Add Note
            </button>
            <button onClick={handleDeleteAllNotes} disabled={notes.length === 0}>
              Delete All
            </button>
          </div>
          <div>
            <button onClick={handleImportNotes}>Import</button>
            <button onClick={handleExportNotes}>Export</button>
          </div>
        </div>

        <h3 className="notes-list-header">Your Notes ({notes.length})</h3>
      </div>

      <div className="notes-list">
        {notes.length === 0 ? (
          <p>No notes yet. Add one above!</p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotesList;

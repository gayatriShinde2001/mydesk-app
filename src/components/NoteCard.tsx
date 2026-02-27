import React, { useEffect } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NoteCardProps {
  note: Note;
  onDelete: (noteId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note,onDelete }) => {
  const handleDeleteNote = async() => {
    const deleteRes = await window?.electronAPI.deleteNote(note.id);
    if(!deleteRes.cancelled)
      onDelete(note.id);
  };
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "12px",
        margin: "10px 0",
        borderRadius: "4px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "10px"
      }}
    >
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 5px 0" }}>{note.title}</h4>
        <p style={{ margin: 0, color: "#666" }}>{note.content}</p>
      </div>
      <button
        onClick={handleDeleteNote}
        style={{
          color: "red",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "5px 10px",
          fontSize: "14px",
          whiteSpace: "nowrap"
        }}
      >
        Delete
      </button>
    </div>
  );
};

export default NoteCard;

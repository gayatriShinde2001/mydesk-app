import React from "react";

interface Note {
  id: string;
  title: string;
  content: string;
}

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const handleDeleteNote = async (e) => {
    await window?.electronAPI.deleteNote(note.id);
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-fit">
      <div className="flex justify-between items-start gap-2">
        <h4 className="m-0 mb-2 text-base font-semibold text-gray-800">{note.title}</h4>
        <button type="button" className="fa-solid fa-trash text-red-500 cursor-pointer hover:text-red-700" onClick={handleDeleteNote}></button>
      </div>
      <p className="m-0 text-gray-600 text-sm line-clamp-3">{note.content}</p>
    </div>
  );
};

export default NoteCard;

const crypto = require('crypto');
const StorageService = require('../services/StorageService.cjs');

class NoteManager {
  constructor() {
    this.notes = [];
    this.isDialogOpen = false;
    this.sendRefreshEvent = null;
  }

  setRefreshCallback(callback) {
    this.sendRefreshEvent = callback;
  }

  load() {
    const filepath = StorageService.getFilePath('notes.json');
    const data = StorageService.read(filepath);
    this.notes = data || [];
    return { success: true, data: this.notes };
  }

  add(note) {
    const newNote = {
      id: crypto.randomUUID(),
      title: note.title,
      content: note.content
    };
    this.notes.push(newNote);
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.notes };
  }

  delete(noteId) {
    if (this.isDialogOpen) {
      return { success: false, cancelled: true };
    }

    this.isDialogOpen = true;
    return { isDialog: true, noteId };
  }

  confirmDelete(noteId) {
    this.notes = this.notes.filter(n => n.id !== noteId);
    this.save();
    this.sendRefreshEvent?.();
    this.isDialogOpen = false;
    return { success: true };
  }

  cancelDelete() {
    this.isDialogOpen = false;
    return { success: false, cancelled: true };
  }

  deleteAll() {
    this.notes = [];
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.notes };
  }

  import(notesData) {
    notesData.forEach(note => {
      const newNote = {
        id: crypto.randomUUID(),
        title: note.title,
        content: note.content
      };
      this.notes.push(newNote);
    });
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.notes };
  }

  export() {
    return this.notes;
  }

  save() {
    const filepath = StorageService.getFilePath('notes.json');
    StorageService.write(filepath, this.notes);
  }

  createBackup() {
    StorageService.createBackup('notes');
    StorageService.cleanupOldBackups('notes', 5);
  }
}

module.exports = new NoteManager();

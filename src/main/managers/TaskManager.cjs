const crypto = require('crypto');
const StorageService = require('../services/StorageService.cjs');

class TaskManager {
  tasks = [];
  sendRefreshEvent = null;

  get tasks() {
    return this.tasks;
  }

  setRefreshCallback(callback) {
    this.sendRefreshEvent = callback;
  }

  load() {
    const filepath = StorageService.getFilePath('tasks.json');
    const data = StorageService.read(filepath);
    this.tasks = data || [];
    return { success: true, data: this.tasks };
  }

  add(task) {
    const isOverdue = task.remindAt ? new Date(task.remindAt) < new Date() : false;
    const newTask = {
      id: crypto.randomUUID(),
      name: task.name,
      description: task.description,
      remindAt: task.remindAt,
      status: 'todo',
      isOverdue
    };
    this.tasks.push(newTask);
    this.save();
    return { success: true, data: this.tasks };
  }

  edit(updatedTask) {
    console.log('in edit task taskmanager', updatedTask)
    const taskIndex = this.tasks.findIndex(t => t.id === updatedTask.id);
    if (taskIndex === -1) {
      return { success: false, error: 'Task not found' };
    }
    const isOverdue = updatedTask.remindAt ? new Date(updatedTask.remindAt) < new Date() : false;
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      name: updatedTask.name,
      description: updatedTask.description,
      remindAt: updatedTask.remindAt,
      isOverdue
    };
    console.log("updated task", this.tasks[taskIndex])
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.tasks };
  }
  delete(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.tasks };
  }

  deleteAll() {
    this.tasks = [];
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.tasks };
  }

  updateStatus(taskId, newStatus) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      return { success: false, error: 'Task not found' };
    }
    this.tasks[taskIndex].status = newStatus;
    this.save();
    this.sendRefreshEvent?.();
    return { success: true, data: this.tasks };
  }

  filter(searchTerm) {
    const filtered = this.tasks.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { success: true, data: filtered };
  }

  checkOverdue() {
    const now = new Date();
    let overdueTasks = [];

    this.tasks.forEach(task => {
      if (task.remindAt && !task.isOverdue) {
        const remindTime = new Date(task.remindAt);
        if (remindTime <= now) {
          task.isOverdue = true;
          overdueTasks.push(task)
        }
      }
    });

    if (overdueTasks > 0) {
      this.save();
    }

    return overdueTasks;
  }

  getOverdueCount() {
    return this.tasks.filter(t => t.isOverdue && t.status !== 'done').length;
  }

  save() {
    const filepath = StorageService.getFilePath('tasks.json');
    StorageService.write(filepath, this.tasks);
  }

  createBackup() {
    StorageService.createBackup('tasks');
    StorageService.cleanupOldBackups('tasks', 5);
  }
}
module.exports = new TaskManager();
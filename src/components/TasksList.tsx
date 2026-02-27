import React, { useEffect, useState } from "react";
import TaskCard from "./TaskCard";
import AddTaskModal from "./AddTaskModal";
import "./TasksList.css";

interface Task {
  id: string;
  name: string;
  description: string;
  remindAt: string;
  status: 'todo' | 'inprogress' | 'done';
  isOverdue: boolean;
}

type TaskStatus = 'todo' | 'inprogress' | 'done';

const TasksList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);


  useEffect(() => {
    loadTasks();
    const handleClose = async () => {
      await window.electronAPI.requestCloseTasks(isModalOpen);
    };

    const unsubscribeClose = window.electronAPI.onCloseRequest(handleClose);
    return () => {
      if(unsubscribeClose) unsubscribeClose();
    };
  }, []);

  useEffect(() => {
    filterTasks(searchTerm);
  }, [searchTerm, tasks]);

  const loadTasks = async () => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.loadTasks();
        if (result.success && result.data) {
          setTasks(result.data);
          setFilteredTasks(result.data);
        }
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTasks = async (term: string) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.filterTasks(term);
        if (result.success && result.data) {
          setFilteredTasks(result.data);
        }
      }
    } catch (err) {
      console.error("Error filtering tasks:", err);
    }
  };

  const handleAddTask = async (task: { name: string; description: string; remindAt: string }) => {
    try {
      const result = await window.electronAPI.addTask(task);
      if (result.success && result.data) {
        setTasks(result.data);
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const result = await window.electronAPI.deleteTask(taskId);
    if (result.success && result.data) {
      setTasks(result.data);
    }
  };

  const handleDeleteAllTasks = async () => {
    const result = await window.electronAPI.deleteAllTasks();
    if (result.success && result.data) {
      setTasks(result.data);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    try {
      const result = await window.electronAPI.updateTaskStatus(draggedTaskId, status);
      if (result.success && result.data) {
        setTasks(result.data);
      }
    } catch (err) {
      console.error("Error updating task status:", err);
    }
    setDraggedTaskId(null);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const sectionConfig = [
    { status: 'todo' as TaskStatus, title: 'To Do', className: 'section-todo' },
    { status: 'inprogress' as TaskStatus, title: 'In Progress', className: 'section-inprogress' },
    { status: 'done' as TaskStatus, title: 'Done', className: 'section-done' }
  ];

  if (isLoading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="tasks-container">
      <div className="tasks-sticky-header">
        <div className="tasks-actions">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="tasks-actions-btn-group">
            <button
            onClick={() => setIsModalOpen(true)}
            className="add-task-btn"
          >
            + Add New Task
          </button>
          <button
            onClick={handleDeleteAllTasks}
            className="delete-all-btn"
            disabled={tasks.length === 0}
          >
            Delete All
          </button>
          </div>
        </div>
        <h3 className="tasks-list-header">Your Tasks ({filteredTasks.length})</h3>
      </div>

      <div className="tasks-sections">
        {sectionConfig.map(({ status, title, className }) => (
          <div
            key={status}
            className={`tasks-section ${className}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <h4 className="section-title">{title} ({getTasksByStatus(status).length})</h4>
            <div className="section-tasks">
              {getTasksByStatus(status).length === 0 ? (
                <p className="no-tasks-section">Drop tasks here</p>
              ) : (
                getTasksByStatus(status).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDelete={handleDeleteTask}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTask}
      />
    </div>
  );
};

export default TasksList;

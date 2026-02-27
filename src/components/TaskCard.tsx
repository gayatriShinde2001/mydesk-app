import React from "react";
import "./TaskCard.css";

interface Task {
  id: string;
  name: string;
  description: string;
  remindAt: string;
  status: 'todo' | 'inprogress' | 'done';
  isOverdue: boolean;
}

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString();
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onDragStart }) => {
  const handleDeleteTask = async () => {
    const deleteRes = await window?.electronAPI.deleteTask(task.id);
    if (!deleteRes?.cancelled) {
      onDelete(task.id);
    }
  };

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done'
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="task-card"
    >
      <div className="task-card-header">
        <div className="task-card-title-row">
          <h4 className="task-card-title">
            {task.name}
          </h4>
          {task.isOverdue && task.status !== 'done' && (
            <span
              title="Overdue"
              className="task-card-overdue"
            >
              !
            </span>
          )}
        </div>
        <button
          onClick={handleDeleteTask}
          className="task-card-delete-btn"
        >
          Delete
        </button>
      </div>
      <p className="task-card-description">
        {task.description}
      </p>
      <div className="task-card-footer">
        {task.remindAt && (
          <span className={`task-card-reminder ${task.isOverdue && task.status !== 'done' ? 'task-card-reminder--overdue' : ''}`}>
            <strong>Remind:</strong> {formatDate(task.remindAt)}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;

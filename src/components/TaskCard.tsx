import React from "react";

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
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEdit: (task: Task) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString();
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onEdit }) => {
  const handleDeleteTask = async (e: React.MouseEvent) => {
    e.preventDefault();
    await window?.electronAPI.deleteTask(task.id);
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    window.electronAPI.showTaskContextMenu(task);
  }

  const handleEditTask = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('task in handleEdit task task card', task)
    onEdit(task)
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onContextMenu={handleContextMenu}
      className="border border-gray-300 rounded-lg p-4 flex flex-col gap-2.5 bg-white shadow-sm cursor-grab"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-1">

          <h4 className="m-0 text-base font-semibold text-gray-800">
            {task.isOverdue && task.status !== 'done' && (
              <span
                title="Overdue"
                className="text-red-600 text-base font-bold"
              >
                !&nbsp;
              </span>
            )}
            {task.name}
          </h4>
        </div>
        <button
          onClick={handleEditTask}
          className="bg-transparent border-none cursor-pointer p-1"
        >
          <i className="fa-solid fa-edit"></i>
        </button>
        <button
          onClick={handleDeleteTask}
          className="text-red-500 bg-transparent border-none cursor-pointer p-1 hover:text-red-700"
        >
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
      <p className="m-0 text-gray-600 text-sm line-clamp-3">
        {task.description}
      </p>
      <div className="flex justify-between items-center mt-auto">
        {task.remindAt && (
          <span className={`text-xs ${task.isOverdue && task.status !== 'done' ? 'text-red-500' : 'text-gray-500'}`}>
            <strong>Remind:</strong> {formatDate(task.remindAt)}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;

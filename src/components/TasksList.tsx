import { useEffect, useState } from "react";
import TaskCard from "./TaskCard";
import AddTaskModal from "./AddTaskModal";

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
  const [taskForEdit, setTaskForEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);


  useEffect(() => {
    loadTasks();
    const handleClose = async () => {
      await window.electronAPI.requestCloseTasks(isModalOpen);
    };
    const onTaskRefreshEvent = () => {
      console.log('Refreshing tasks list')
      loadTasks();
    }

    const unsubscribeClose = window.electronAPI.onCloseRequest(handleClose);
    const unsubscribeTasksLoadEvent = window.electronAPI.reloadTasksListener(onTaskRefreshEvent)
    return () => {
      if (unsubscribeClose) unsubscribeClose();
      if (unsubscribeTasksLoadEvent) unsubscribeTasksLoadEvent();
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

  const handleOnEditTask = (task) => {
    setTaskForEdit(task)
  }

  const handleEditTask = async (task: Task) => {
    try {
      await window.electronAPI.editTask(task);
    } catch (err) {
      console.error("Error editing task:", err);
    }
  }


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
    { status: 'todo' as TaskStatus, title: 'To Do' },
    { status: 'inprogress' as TaskStatus, title: 'In Progress' },
    { status: 'done' as TaskStatus, title: 'Done' }
  ];

  if (isLoading) {
    return <div className="p-5">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 bg-gray-100 z-10 px-5 pb-4 flex-shrink-0">
        <div className="flex justify-between items-center mt-5 gap-4 flex-wrap">
          <div className="flex-1 max-w-[300px]">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white px-3.5 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-0.5"
            >
              + Add New Task
            </button>
            <button
              onClick={handleDeleteAllTasks}
              className="px-5 py-2.5 rounded border border-red-500 bg-white text-red-500 text-sm font-medium hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={tasks.length === 0}
            >
              Delete All
            </button>
          </div>
        </div>
        <h3 className="mt-5 mb-3">Your Tasks ({filteredTasks.length})</h3>
      </div>

      <div className="flex gap-4 px-5 pb-5 flex-1 overflow-x-auto overflow-y-hidden">
        {sectionConfig.map(({ status, title }) => (
          <div
            key={status}
            className={`flex-1 min-w-[280px] rounded-lg p-4 flex flex-col ${status === 'todo' ? 'bg-gray-200' : status === 'inprogress' ? 'bg-yellow-100' : 'bg-green-100'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <h4 className="m-0 mb-3 text-base font-semibold text-gray-800">{title} ({getTasksByStatus(status).length})</h4>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-[100px]">
              {getTasksByStatus(status).length === 0 ? (
                <p className="text-gray-500 text-sm text-center p-5 border-2 border-dashed border-gray-300 rounded-lg m-0">Drop tasks here</p>
              ) : (
                getTasksByStatus(status).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onEdit={handleOnEditTask}
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
      <AddTaskModal
        isOpen={taskForEdit != null}
        isEdit={true}
        taskForEdit={taskForEdit}
        onClose={() => setTaskForEdit(null)}
        onSubmit={handleEditTask}
      />



    </div>
  );
};

export default TasksList;

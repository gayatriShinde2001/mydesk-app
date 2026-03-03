import React, { useRef, useEffect, useState } from "react";
import { Task } from "../types";

interface AddTaskModalProps {
  isOpen: boolean;
  taskForEdit: Task;
  isEdit?: boolean;
  onClose: () => void;
  onSubmit: (task: { name: string; description: string; remindAt: string }) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, isEdit = false, taskForEdit, onClose, onSubmit }) => {
  const nameRef = useRef<HTMLInputElement>(taskForEdit ? taskForEdit.name : null);
  const descriptionRef = useRef<HTMLTextAreaElement>(taskForEdit ? taskForEdit.description : null);
  const customDateRef = useRef<HTMLInputElement>(taskForEdit ? taskForEdit.remindAt : null);

  const [remindOption, setRemindOption] = useState(taskForEdit ? taskForEdit.remindOption : "");

  useEffect(() => {
    if (isOpen && nameRef.current) {
      nameRef.current.focus();
    }
    if (!isOpen) {
      setRemindOption("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (taskForEdit == null) return;
    nameRef.current.value = taskForEdit.name;
    descriptionRef.current.value = taskForEdit.description;
    // customDateRef.current.value = new Date(taskForEdit.remindAt).getTime();
  }, [taskForEdit])

  if (!isOpen) return null;

  const getRemindAtTimestamp = (option: string): string => {
    const now = new Date();
    switch (option) {
      case "1min":
        return new Date(now.getTime() + 60 * 1000).toISOString();
      case "5min":
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      case "30min":
        return new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      case "tomorrow9am": {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow.toISOString();
      }
      default:
        return "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameRef.current?.value || "";
    const description = descriptionRef.current?.value || "";

    let remindAt = "";
    if (remindOption === "custom" && customDateRef.current?.value) {
      remindAt = new Date(customDateRef.current.value).toISOString();
    } else if (remindOption && remindOption !== "none") {
      remindAt = getRemindAtTimestamp(remindOption);
    }

    if (!name.trim()) return;
    const submitObj = { name, description, remindAt }
    submitObj.id = taskForEdit ? taskForEdit.id : undefined;
    if (!remindAt) submitObj.remindAt = taskForEdit.remindAt;
    onSubmit(submitObj);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-[500px] shadow-xl">

        {isEdit ?
          <h2 className="m-0 mb-5 text-xl text-gray-800">Edit Task</h2> :
          <h2 className="m-0 mb-5 text-xl text-gray-800">Add New Task</h2>
        }
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="task-name"
              className="block mb-1.5 font-medium text-gray-600"
            >
              Task Name *
            </label>
            <input
              disabled={isEdit}
              ref={nameRef}
              id="task-name"
              type="text"
              placeholder="Enter task name"
              className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="task-description"
              className="block mb-1.5 font-medium text-gray-600"
            >
              Task Description
            </label>
            <textarea
              ref={descriptionRef}
              id="task-description"
              placeholder="Enter task description"
              rows={4}
              className="w-full p-2.5 border border-gray-300 rounded text-sm resize-y focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="remind-option"
              className="block mb-1.5 font-medium text-gray-600"
            >
              Remind me
            </label>
            <select
              id="remind-option"
              value={remindOption}
              onChange={(e) => setRemindOption(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="none">Don't remind</option>
              <option value="1min">In 1 minutes</option>
              <option value="5min">In 5 minutes</option>
              <option value="30min">In 30 minutes</option>
              <option value="tomorrow9am">Tomorrow at 9.00</option>
              <option value="custom">Custom date and time</option>
            </select>
          </div>
          {remindOption === "custom" && (
            <div className="mb-4">
              <label
                htmlFor="custom-remind"
                className="block mb-1.5 font-medium text-gray-600"
              >
                Custom Date & Time
              </label>
              <input
                ref={customDateRef}
                id="custom-remind"
                type="datetime-local"
                className="w-full p-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}
          <div className="flex gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded bg-gray-100 cursor-pointer text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded bg-indigo-500 text-white text-sm border-none cursor-pointer hover:bg-indigo-600 transition-colors"
            >
              {isEdit ? "Edit task" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;

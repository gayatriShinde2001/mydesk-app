import React, { useRef, useEffect, useState } from "react";
import "./AddTaskModal.css";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { name: string; description: string; remindAt: string }) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const customDateRef = useRef<HTMLInputElement>(null);
  
  const [remindOption, setRemindOption] = useState("");

  useEffect(() => {
    if (isOpen && nameRef.current) {
      nameRef.current.focus();
    }
    if (!isOpen) {
      setRemindOption("");
    }
  }, [isOpen]);

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
    onSubmit({ name, description, remindAt });
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="modal-content">
        <h2 className="modal-title">Add New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label
              htmlFor="task-name"
              className="form-label"
            >
              Task Name *
            </label>
            <input
              ref={nameRef}
              id="task-name"
              type="text"
              placeholder="Enter task name"
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="task-description"
              className="form-label"
            >
              Task Description
            </label>
            <textarea
              ref={descriptionRef}
              id="task-description"
              placeholder="Enter task description"
              rows={4}
              className="form-textarea"
            />
          </div>
          <div className="form-group">
            <label
              htmlFor="remind-option"
              className="form-label"
            >
              Remind me
            </label>
            <select
              id="remind-option"
              value={remindOption}
              onChange={(e) => setRemindOption(e.target.value)}
              className="form-select"
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
            <div className="form-group">
              <label
                htmlFor="custom-remind"
                className="form-label"
              >
                Custom Date & Time
              </label>
              <input
                ref={customDateRef}
                id="custom-remind"
                type="datetime-local"
                className="form-input"
              />
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;

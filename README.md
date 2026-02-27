# MyDesk App

A desktop application built with Electron and React for managing notes and tasks.

## Features

### Notes
- Create, delete, and manage notes
- Import notes from JSON files
- Export notes to JSON files
- Confirmation dialog when closing with unsaved work

### Tasks
- Three task sections: To Do, In Progress, Done
- Drag and drop tasks between sections
- Search tasks by name
- Reminder options:
  - In 5 minutes
  - In 30 minutes
  - Tomorrow at 9.00 AM
  - Custom date and time
- Overdue task notifications (background)
- Delete individual tasks or all tasks at once
- Visual indicator for overdue tasks

### System Integration
- System tray support
- Background notifications for overdue tasks
- Minimize to tray on close

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Desktop:** Electron
- **Background Jobs:** node-cron
- **Build:** electron-builder

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Development

Run the app in development mode:

```bash
npm run electron-dev
```

This will:
1. Start the Vite dev server
2. Launch Electron with the app

### Build

Build the production app:

```bash
npm run electron-build
```

The built application will be in the `release` folder.

### Run Built App

```bash
npm run electron-start
```

## Data Storage

- Notes are stored in `notes.json`
- Tasks are stored in `tasks.json`
- Data is saved in the user's app data directory

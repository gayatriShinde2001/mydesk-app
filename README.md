### Lab 2.1: Setting Up React in Electron
**Duration:** 1.5 hours  
**Objective:** Integrate React into your Electron application with proper development setup.

**Steps:**
1. Set up Create React App in a subfolder or modify existing structure
2. Configure concurrent running of React dev server and Electron
3. Implement proper build scripts for development and production
4. Test hot reloading functionality

**Code Example (package.json scripts):**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "electron": "electron .",
    "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\""
  }
}
```
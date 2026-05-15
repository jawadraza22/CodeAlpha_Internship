# TaskFlow – Collaborative Project Management Tool

TaskFlow is a premium full-stack project management application built with Node.js, Express, SQLite, and Vanilla JavaScript. It features a modern glassmorphism UI and real-time collaboration capabilities.

## Features
- **Secure Authentication**: JWT-based login and registration.
- **Kanban Board**: Drag-and-drop tasks between columns (To Do, In Progress, Review, Completed).
- **Real-time Updates**: Live synchronization across team members using Socket.IO.
- **Project Management**: Create project boards, assign members, and track progress.
- **Responsive Design**: Optimized for both desktop and mobile views.
- **SQLite Database**: Lightweight and efficient data storage using `better-sqlite3`.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Real-time**: Socket.IO
- **Auth**: JSON Web Tokens (JWT), bcryptjs

## Getting Started

### Prerequisites
- Node.js installed on your machine.

### Installation
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

### Running the Frontend
1. Open `frontend/index.html` in your web browser.
2. (Optional) Use a local server like "Live Server" for the best experience.

## Project Structure
- `backend/`: Express server, SQLite configuration, and API routes.
- `frontend/`: Clean, modular frontend with glassmorphism styling.
- `taskflow.db`: SQLite database file (generated on first run).

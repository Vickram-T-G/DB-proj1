# Attendance Management System

A comprehensive, secure, and modern attendance management system migrated to **MEVN (MongoDB, Express, Vue 3, Node.js) + Firebase**. Features role-based access control, email notifications, and detailed charts for attendance tracking.

## 🌟 Architecture & Tech Stack

### Frontend
- **Vue 3** (Composition API) + **Vite**
- **Vue Router** for routing
- **Pinia** for state management
- **Tailwind CSS** for styling
- **Firebase Authentication** client SDK

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **Firebase Admin SDK** for secure token verification

## 🚀 Setup & Installation

### 1. Firebase Configuration
1. Create a Firebase project at console.firebase.google.com
2. Enable Email/Password authentication.
3. Add a web app to the project and copy the configuration keys to `frontend/.env`.
4. Generate a new Private Key from Project Settings > Service Accounts and add the credentials to `backend/.env`.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and Firebase Admin credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase client configuration
npm run dev
```

## 🔒 Authentication Flow
This application utilizes Firebase for handling user passwords, password resets, and session management. The frontend requests a Firebase ID token and passes it to the backend via an `Authorization: Bearer <token>` header. The Express backend verifies this token securely using the Firebase Admin SDK, maps the Firebase UID to the internal MongoDB user profile, and applies role-based access control (RBAC).

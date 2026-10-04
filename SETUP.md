# Attendance System Setup Guide

## 🔧 **Quick Setup**

### 1. **MongoDB Setup**

You have two options:

#### Option A: Local MongoDB (Recommended for Development)

1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/
2. Start MongoDB service
3. The app will automatically connect to `mongodb://localhost:27017/attendance-app`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free MongoDB Atlas account
2. Create a cluster and get your connection string
3. Update `backend/.env` with your Atlas connection string
4. Whitelist your IP address in Atlas

### 2. **Backend Setup**

```bash
cd backend
npm install
npm run setup  # Creates first admin user
npm run dev    # Start development server
```

### 3. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev    # Start development server
```

## 🔐 **Security Features**

### **Admin Registration Control**

- ✅ **Students**: Can register freely (no invitation needed)
- ✅ **Teachers**: Require invitation from admin
- ✅ **Admins**: Require invitation from existing admin
- ✅ **First Admin**: Created via setup script

### **Login Methods**

- ✅ **Students**: Can login with email OR student ID
- ✅ **Teachers/Admins**: Must login with email

### **Email Requirements**

- ✅ **Students**: Email is optional
- ✅ **Teachers**: Email is required
- ✅ **Admins**: Email is mandatory (for attendance reminders)

## 👤 **Default Admin Account**

After running `npm run setup` in the backend:

- **Email**: `admin@attendance.com`
- **Password**: `admin123`
- **⚠️ Important**: Change password after first login!

## 🚀 **Access the Application**

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5000

## 📧 **Email Configuration (Optional)**

For attendance reminders, update `backend/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

## 🔄 **Creating Additional Admins/Teachers**

1. Login as admin
2. Go to Admin Panel → Invitations
3. Create invitation for teacher/admin
4. Share the invitation link or token
5. User registers using the invitation

## 🛠 **Troubleshooting**

### MongoDB Connection Issues

- Check if MongoDB is running
- Verify connection string in `.env`
- For Atlas: Check IP whitelist

### Registration Issues

- Students need valid Student ID
- Teachers/Admins need invitation token
- Check browser console for errors

### Login Issues

- Students can use email OR student ID
- Teachers/Admins must use email
- Verify password is correct

## 📁 **Project Structure**

```
attendance/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite
├── SETUP.md         # This file
└── README.md        # Main documentation
```

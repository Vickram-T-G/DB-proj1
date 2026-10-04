import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CreateCourse from "./pages/CreateCourse";
import CourseDetail from "./pages/CourseDetail";
import Attendance from "./pages/Attendance";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import UserManagement from "./pages/UserManagement";
import AdminInvitations from "./pages/AdminInvitations";
import LoadingSpinner from "./components/LoadingSpinner";
import EmailSettings from "./pages/EmailSettings";
import Analytics from "./pages/Analytics";
import CalendarPage from "./pages/Calendar";
import ExcelImport from "./pages/ExcelImport";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      {/* Modern UI - Updated 2024 */}
      {/* Hidden for Tailwind JIT to pick up all badge colors */}
      <div className="hidden">
        bg-green-600 text-green-100 border-green-400 bg-red-600 text-red-100
        border-red-400 bg-yellow-500 text-yellow-900 border-yellow-300
        bg-blue-600 text-blue-100 border-blue-400 bg-gray-700 text-gray-300
        border-gray-500
      </div>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route
                  path="courses/new"
                  element={
                    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                      <CreateCourse />
                    </ProtectedRoute>
                  }
                />
                <Route path="courses/:id" element={<CourseDetail />} />
                <Route path="attendance/:courseId" element={<Attendance />} />
                <Route path="profile" element={<Profile />} />
                <Route
                  path="calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/invitations"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminInvitations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/email-settings"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <EmailSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/excel-import"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <ExcelImport />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#0d1117",
                  color: "#f0f6fc",
                  border: "1px solid #30363d",
                },
                success: {
                  iconTheme: {
                    primary: "#238636",
                    secondary: "#f0f6fc",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#da3633",
                    secondary: "#f0f6fc",
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;

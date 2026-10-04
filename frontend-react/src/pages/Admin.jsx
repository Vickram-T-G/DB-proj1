import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen, Mail, Settings, BarChart3 } from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

// Simple modal stub
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button
          className="absolute top-2 right-2 text-text-secondary hover:text-accent"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-text-primary">{title}</h2>
        {children}
      </div>
    </div>
  );
};

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showSendReminders, setShowSendReminders] = useState(false);
  const navigate = useNavigate();
  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
    role: "all",
  });
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setError(null);
      // Fetch users and courses data
      const [usersResponse, coursesResponse] = await Promise.all([
        api.get("/users"),
        api.get("/courses"),
      ]);

      // Handle the response format correctly
      const users = usersResponse.data.users || usersResponse.data || [];
      const courses = coursesResponse.data || [];

      setStats({
        totalUsers: users.length || 0,
        totalCourses: courses.length || 0,
        totalStudents: users.filter((u) => u.role === "student").length || 0,
        totalTeachers: users.filter((u) => u.role === "teacher").length || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setError("Failed to load admin statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-content">
            <h1 className="text-2xl font-bold text-text-primary">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary mt-2">
              Welcome to the admin panel. Manage users, courses, and system
              settings.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="text-center py-8">
              <div className="text-accent-error mb-4">
                <BarChart3 size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Error Loading Data
              </h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <button onClick={fetchAdminStats} className="btn btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = "accent" }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
        </div>
      </div>
    </div>
  );

  const AdminSection = ({ title, description, icon: Icon, children }) => (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Icon className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="card-title">{title}</h3>
            <p className="card-description">{description}</p>
          </div>
        </div>
      </div>
      <div className="card-content">{children}</div>
    </div>
  );

  // Send email handler
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailSending(true);
    try {
      await api.post("/email/send", emailForm);
      toast.success("Email sent successfully!");
      setShowSendReminders(false);
      setEmailForm({ subject: "", message: "", role: "all" });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  // Download report handler
  const handleDownloadReport = async () => {
    try {
      const res = await api.get("/users/report", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users_report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded!");
    } catch {
      toast.error("Failed to download report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <h1 className="text-2xl font-bold text-text-primary mt-2">
            Admin Dashboard
          </h1>
          <p className="text-text-secondary mt-2">
            Welcome to the admin panel. Manage users, courses, and system
            settings.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="accent"
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={BookOpen}
          color="accent-success"
        />
        <StatCard
          title="Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          color="accent-warning"
        />
        <StatCard
          title="Teachers"
          value={stats?.totalTeachers || 0}
          icon={Users}
          color="accent-secondary"
        />
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <AdminSection
          title="User Management"
          description="Manage system users and permissions"
          icon={Users}
        >
          <div className="space-y-3">
            <p className="text-text-secondary">
              Create, edit, and manage user accounts across the system.
            </p>
            <div className="flex space-x-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/admin/users")}
              >
                View All Users
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowBulkImport(true)}
              >
                Bulk Import
              </button>
            </div>
          </div>
        </AdminSection>

        {/* Course Management */}
        <AdminSection
          title="Course Management"
          description="Oversee all courses and enrollments"
          icon={BookOpen}
        >
          <div className="space-y-3">
            <p className="text-text-secondary">
              Monitor course creation, student enrollments, and course
              statistics.
            </p>
            <div className="flex space-x-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/courses")}
              >
                View All Courses
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/courses/analytics")}
              >
                Course Analytics
              </button>
            </div>
          </div>
        </AdminSection>

        {/* Email Notifications */}
        <AdminSection
          title="Email Notifications"
          description="Manage system-wide email communications"
          icon={Mail}
        >
          <div className="space-y-3">
            <p className="text-text-secondary">
              Send attendance reminders and notifications to teachers and
              students.
            </p>
            <div className="flex space-x-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowSendReminders(true)}
              >
                Send Reminders
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate("/admin/email-settings")}
              >
                Email Settings
              </button>
            </div>
          </div>
        </AdminSection>

        {/* System Analytics */}
        <AdminSection
          title="System Analytics"
          description="View comprehensive system statistics"
          icon={BarChart3}
        >
          <div className="space-y-3">
            <p className="text-text-secondary">
              Access detailed analytics and reports on system usage and
              attendance patterns.
            </p>
            <div className="flex space-x-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate("/admin/analytics")}
              >
                View Analytics
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadReport}
              >
                Generate Reports
              </button>
            </div>
          </div>
        </AdminSection>
      </div>

      {/* Quick Actions */}
      <AdminSection
        title="Quick Actions"
        description="Common administrative tasks"
        icon={Settings}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors text-left"
            onClick={() => setShowAddUser(true)}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-accent" />
              <span className="font-medium text-text-primary">
                Add New User
              </span>
            </div>
          </button>

          <button
            className="p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors text-left"
            onClick={() => navigate("/courses/new")}
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-accent-success" />
              <span className="font-medium text-text-primary">
                Create Course
              </span>
            </div>
          </button>

          <button
            className="p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors text-left"
            onClick={() => setShowSendReminders(true)}
          >
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-accent-warning" />
              <span className="font-medium text-text-primary">
                Send Notifications
              </span>
            </div>
          </button>
        </div>
      </AdminSection>

      {/* Modals */}
      <Modal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Bulk Import Users"
      >
        <div className="space-y-4">
          <input type="file" accept=".csv" className="input" />
          <button className="btn btn-primary btn-lg w-full" disabled>
            Import
          </button>
        </div>
      </Modal>
      <Modal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Add New User"
      >
        <div className="space-y-4">
          <button className="btn btn-primary btn-lg w-full" disabled>
            Add User
          </button>
        </div>
      </Modal>
      <Modal
        open={showSendReminders}
        onClose={() => setShowSendReminders(false)}
        title="Send Reminders / Notifications"
      >
        <form className="space-y-4" onSubmit={handleSendEmail}>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="input"
              value={emailForm.role}
              onChange={(e) =>
                setEmailForm((f) => ({ ...f, role: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              className="input"
              value={emailForm.subject}
              onChange={(e) =>
                setEmailForm((f) => ({ ...f, subject: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="input"
              rows={4}
              value={emailForm.message}
              onChange={(e) =>
                setEmailForm((f) => ({ ...f, message: e.target.value }))
              }
              required
            />
          </div>
          <button
            className="btn btn-primary btn-lg w-full mt-2"
            type="submit"
            disabled={emailSending}
          >
            {emailSending ? "Sending..." : "Send Email"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;

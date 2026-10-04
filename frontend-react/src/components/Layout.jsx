import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  BookOpen,
  Calendar,
  User,
  Settings,
  LogOut,
  BarChart3,
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Layout = () => {
  const getPageTitle = (pathname) => {
    switch (true) {
      case pathname === "/dashboard":
        return "Dashboard";
      case pathname === "/courses":
        return "Courses";
      case pathname === "/courses/new":
        return "Add Course";
      case pathname.startsWith("/courses/"):
        return "Course Details";
      case pathname === "/calendar":
        return "Calendar";
      case pathname === "/admin":
        return "Admin Panel";
      case pathname === "/admin/users":
        return "Manage Users";
      case pathname === "/admin/invitations":
        return "Invitations";
      case pathname === "/admin/excel-import":
        return "Excel Import";
      case pathname === "/profile":
        return "Profile";
      default:
        return "Dashboard";
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation links
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Courses", href: "/courses", icon: BookOpen },
    // Add Course link for admin/teacher
    ...(user?.role === "admin" || user?.role === "teacher"
      ? [{ name: "Add Course", href: "/courses/new", icon: Calendar }]
      : []),
    // Calendar link for all users
    { name: "Calendar", href: "/calendar", icon: Calendar },
    // Admin links
    ...(user?.role === "admin"
      ? [
          { name: "Admin Panel", href: "/admin", icon: Settings },
          { name: "Manage Users", href: "/admin/users", icon: Users },
          { name: "Invitations", href: "/admin/invitations", icon: Mail },
          {
            name: "Excel Import",
            href: "/admin/excel-import",
            icon: FileSpreadsheet,
          },
        ]
      : []),
    { name: "Profile", href: "/profile", icon: User },
  ];

  const isActive = (href) => {
    // Exact match for specific routes
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    // For courses, check if we're on the main courses page (not /courses/new or /courses/:id)
    if (href === "/courses") {
      return location.pathname === "/courses";
    }

    // For admin panel, check if we're on the main admin page (not /admin/users or /admin/invitations)
    if (href === "/admin") {
      return location.pathname === "/admin";
    }

    // For admin/users, exact match
    if (href === "/admin/users") {
      return location.pathname === "/admin/users";
    }

    // For profile, exact match
    if (href === "/profile") {
      return location.pathname === "/profile";
    }

    // For other routes, use startsWith but be more specific
    return (
      location.pathname === href ||
      (location.pathname.startsWith(href + "/") &&
        href !== "/courses" &&
        href !== "/admin")
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - collapsible on desktop, hidden on mobile */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-surface lg:border-r lg:border-border transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-text-primary">Attendance</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${
                  isActive(item.href) ? "nav-link-active" : ""
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? item.name : ""}
              >
                <Icon size={20} className={sidebarCollapsed ? "" : "mr-3"} />
                {!sidebarCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div
            className={`flex items-center ${
              sidebarCollapsed ? "justify-center" : "mb-4"
            }`}
          >
            <div
              className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold cursor-pointer"
              onClick={() => navigate("/profile")}
              aria-label="Go to profile"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-text-primary">
                  {user?.name}
                </p>
                <p className="text-xs text-text-secondary capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full nav-link text-left ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} className={sidebarCollapsed ? "" : "mr-3"} />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border">
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <h1 className="text-xl font-bold text-text-primary">Attendance</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${
                    isActive(item.href) ? "nav-link-active" : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} className="mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-text-primary">
                  {user?.name}
                </p>
                <p className="text-xs text-text-secondary capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full nav-link text-left"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        {/* Header */}
        <header className="bg-surface border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center space-x-4">
              {/* <h2 className="text-lg font-semibold text-text-primary">
                {navigation.find((item) => isActive(item.href))?.name ||
                  "Dashboard"}
              </h2> */}

              <h2 className="text-lg font-semibold text-text-primary">
                {getPageTitle(location.pathname)}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div
                  className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
                  onClick={() => navigate("/profile")}
                  aria-label="Go to profile"
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {user?.name}
                  </p>
                  <p className="text-xs text-text-secondary capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Logout"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

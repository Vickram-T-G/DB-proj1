import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Upload,
} from "lucide-react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";

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

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addUserForm, setAddUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    rollNo: "",
  });
  const [editUserForm, setEditUserForm] = useState({});
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      });
      const response = await api.get(`/users?${params}`);
      setUsers(response.data.users || []);
      setTotalPages(response.data.pagination?.total || 1);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/users/bulk-create", { users: [addUserForm] });
      toast.success("User added successfully");
      setShowAddUser(false);
      setAddUserForm({
        name: "",
        email: "",
        password: "",
        role: "student",
        rollNo: "",
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add user");
    } finally {
      setSaving(false);
    }
  };

  // Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${editUserForm._id}`, editUserForm);
      toast.success("User updated successfully");
      setShowEditUser(false);
      setEditUserForm({});
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  // Bulk Import
  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error("Please select a CSV file");
    setImporting(true);
    try {
      const text = await importFile.text();
      // Parse CSV: name,email,password,role,rollNo
      const lines = text.split(/\r?\n/).filter(Boolean);
      const users = lines.slice(1).map((line) => {
        const [name, email, password, role, rollNo] = line.split(",");
        return { name, email, password, role, rollNo };
      });
      await api.post("/users/bulk-create", { users });
      toast.success("Users imported successfully");
      setShowBulkImport(false);
      setImportFile(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to import users");
    } finally {
      setImporting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "badge-error";
      case "teacher":
        return "badge-warning";
      case "student":
        return "badge-success";
      default:
        return "badge-secondary";
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Active</span>
    ) : (
      <span className="badge badge-error">Inactive</span>
    );
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mt-2">
                User Management
              </h1>
              <p className="text-text-secondary mt-2">
                Manage system users, roles, and permissions
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setShowAddUser(true)}
              >
                <Plus size={16} className="mr-2" />
                Add User
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setShowBulkImport(true)}
              >
                <Upload size={16} className="mr-2" />
                Bulk Import
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search users by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
              <button
                type="submit"
                className="btn btn-primary btn-lg min-w-[120px]"
              >
                <Search size={16} className="mr-2" />
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">User</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Roll No</th>
                  <th className="table-header-cell">Last Login</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {users.map((user) => (
                  <tr key={user._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {user.name}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="table-cell">
                      <span className="text-text-secondary">
                        {user.rollNo || "—"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-text-secondary">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : "Never"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-text-secondary hover:text-accent"
                          title="View Details"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewUser(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="p-1 text-text-secondary hover:text-accent"
                          title="Edit User"
                          onClick={() => {
                            setEditUserForm(user);
                            setShowEditUser(true);
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="p-1 text-text-secondary hover:text-accent-error"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-text-secondary">
                Showing {users.length} users
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No users found
              </h3>
              <p className="text-text-secondary">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Add New User"
      >
        <form className="space-y-4" onSubmit={handleAddUser}>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="input"
              value={addUserForm.name}
              onChange={(e) =>
                setAddUserForm((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="input"
              type="email"
              value={addUserForm.email}
              onChange={(e) =>
                setAddUserForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="input"
              type="password"
              value={addUserForm.password}
              onChange={(e) =>
                setAddUserForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="input"
              value={addUserForm.role}
              onChange={(e) =>
                setAddUserForm((f) => ({ ...f, role: e.target.value }))
              }
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {addUserForm.role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Roll No
                </label>
                <input
                  className="input"
                  value={addUserForm.rollNo}
                  onChange={(e) =>
                    setAddUserForm((f) => ({ ...f, rollNo: e.target.value }))
                  }
                  required
                />
              </div>
            </>
          )}
          <button
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={saving}
          >
            {saving ? "Adding..." : "Add User"}
          </button>
        </form>
      </Modal>
      <Modal
        open={showEditUser}
        onClose={() => setShowEditUser(false)}
        title="Edit User"
      >
        <form className="space-y-4" onSubmit={handleEditUser}>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="input"
              value={editUserForm.name || ""}
              onChange={(e) =>
                setEditUserForm((f) => ({ ...f, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="input"
              type="email"
              value={editUserForm.email || ""}
              onChange={(e) =>
                setEditUserForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="input"
              value={editUserForm.role || "student"}
              onChange={(e) =>
                setEditUserForm((f) => ({ ...f, role: e.target.value }))
              }
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editUserForm.role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Roll No
                </label>
                <input
                  className="input"
                  value={editUserForm.rollNo || ""}
                  onChange={(e) =>
                    setEditUserForm((f) => ({ ...f, rollNo: e.target.value }))
                  }
                  required
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Active</label>
            <select
              className="input"
              value={editUserForm.isActive ? "true" : "false"}
              onChange={(e) =>
                setEditUserForm((f) => ({
                  ...f,
                  isActive: e.target.value === "true",
                }))
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Modal>
      <Modal
        open={showViewUser}
        onClose={() => setShowViewUser(false)}
        title="User Details"
      >
        {selectedUser && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-semibold">
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {selectedUser.name}
                </p>
                <p className="text-sm text-text-secondary">
                  {selectedUser.email}
                </p>
                <p className="text-xs text-text-secondary capitalize">
                  {selectedUser.role}
                </p>
                <p className="text-xs text-text-secondary">
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </p>
                {selectedUser.rollNo && (
                  <p className="text-xs text-text-secondary">
                    Roll No: {selectedUser.rollNo}
                  </p>
                )}
                <p className="text-xs text-text-secondary">
                  Last Login:{" "}
                  {selectedUser.lastLogin
                    ? new Date(selectedUser.lastLogin).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Bulk Import Users"
      >
        <form className="space-y-4" onSubmit={handleBulkImport}>
          <div>
            <label className="block text-sm font-medium mb-1">CSV File</label>
            <input
              className="input"
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              CSV columns: name,email,password,role,rollNo
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg w-full"
            type="submit"
            disabled={importing}
          >
            {importing ? "Importing..." : "Import Users"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;

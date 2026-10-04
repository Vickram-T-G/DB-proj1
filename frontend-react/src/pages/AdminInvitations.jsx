import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Mail, Copy, CheckCircle, XCircle, Search } from "lucide-react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await api.get("/auth/invitations");
      setInvitations(response.data);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsCreating(true);
    try {
      await api.post("/auth/invite", data);
      toast.success("Invitation created successfully!");
      reset();
      fetchInvitations();
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to create invitation";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (token) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      toast.success("Token copied to clipboard!");
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  };

  const getStatusBadge = (invitation) => {
    if (invitation.isUsed) {
      return (
        <span className="badge badge-success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Used
        </span>
      );
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return (
        <span className="badge badge-error">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </span>
      );
    }

    return <span className="badge badge-secondary">Pending</span>;
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Admin Invitations
        </h1>
        <p className="text-text-secondary">
          Manage invitations for teachers and administrators
        </p>
      </div>

      {/* Create Invitation Form */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Create New Invitation</h3>
          <p className="card-description">
            Send an invitation to join as a teacher or admin
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-primary"
                >
                  Email Address <span className="text-accent-error">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="input pl-10"
                    placeholder="Enter email address"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-accent-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-text-primary"
                >
                  Role <span className="text-accent-error">*</span>
                </label>
                <select
                  id="role"
                  className="input"
                  {...register("role", {
                    required: "Role is required",
                  })}
                >
                  <option value="">Select role</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-accent-error">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="btn btn-primary btn-lg min-w-[120px]"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Invitation"}
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="btn btn-secondary p-3"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Invitations List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invitation History</h3>
          <p className="card-description">
            View all sent invitations and their status
          </p>
        </div>
        <div className="card-content">
          {invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Role</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Invited By</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Expires</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {invitations.map((invitation) => (
                    <tr key={invitation._id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-text-muted mr-2" />
                          {invitation.email}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-secondary capitalize">
                          {invitation.role}
                        </span>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(invitation)}
                      </td>
                      <td className="table-cell">
                        {invitation.invitedBy?.name || "Unknown"}
                      </td>
                      <td className="table-cell">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {!invitation.isUsed &&
                          new Date(invitation.expiresAt) > new Date() && (
                            <button
                              className="btn btn-secondary btn-lg"
                              onClick={() => copyToClipboard(invitation.token)}
                              title="Copy invitation token"
                            >
                              <Copy size={16} className="mr-2" />
                              {copiedToken === invitation.token
                                ? "Copied!"
                                : "Copy Token"}
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No invitations yet
              </h3>
              <p className="text-text-secondary">
                Create your first invitation to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInvitations;

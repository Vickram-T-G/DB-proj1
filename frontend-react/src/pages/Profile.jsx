import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Hash, Bell, Lock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      emailNotifications: user?.emailNotifications ?? true,
      studentId: user?.studentId || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm();

  const onProfileSubmit = async (data) => {
    setIsLoading(true);
    const result = await updateProfile(data);
    setIsLoading(false);

    if (result.success) {
      setIsEditing(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);
    const result = await changePassword(data.currentPassword, data.newPassword);
    setIsLoading(false);

    if (result.success) {
      setIsChangingPassword(false);
      resetPasswordForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-white font-semibold text-xl">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {user?.name}
              </h1>
              <p className="text-text-secondary capitalize">{user?.role}</p>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Profile Information</h3>
            <p className="card-description">Update your personal information</p>
          </div>
          <div className="card-content">
            <form
              onSubmit={handleProfileSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-primary"
                >
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    className="input pl-10"
                    placeholder="Enter your full name"
                    disabled={!isEditing}
                    {...registerProfile("name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                  />
                </div>
                {profileErrors.name && (
                  <p className="mt-1 text-sm text-accent-error">
                    {profileErrors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-primary"
                >
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="input pl-10"
                    placeholder="Enter your email"
                    disabled={!isEditing}
                    {...registerProfile("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                </div>
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-accent-error">
                    {profileErrors.email.message}
                  </p>
                )}
              </div>

              {user?.role === "student" && (
                <div>
                  <label
                    htmlFor="studentId"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Student ID
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      id="studentId"
                      type="text"
                      className="input pl-10"
                      placeholder="Enter your student ID"
                      disabled={!isEditing}
                      {...registerProfile("studentId", {
                        required: "Student ID is required",
                        minLength: {
                          value: 2,
                          message: "Student ID must be at least 2 characters",
                        },
                      })}
                    />
                  </div>
                  {profileErrors.studentId && (
                    <p className="mt-1 text-sm text-accent-error">
                      {profileErrors.studentId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  id="emailNotifications"
                  type="checkbox"
                  className="rounded border-border text-accent focus:ring-accent"
                  disabled={!isEditing}
                  {...registerProfile("emailNotifications")}
                />
                <label
                  htmlFor="emailNotifications"
                  className="text-sm text-text-primary"
                >
                  Receive email notifications
                </label>
              </div>

              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg w-full"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </form>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-primary btn-lg min-w-[140px] mt-4"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Change Password</h3>
            <p className="card-description">Update your account password</p>
          </div>
          <div className="card-content">
            {isChangingPassword ? (
              <form
                onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-text-primary"
                  >
                    Current Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      id="currentPassword"
                      type="password"
                      className="input pl-10"
                      placeholder="Enter current password"
                      {...registerPassword("currentPassword", {
                        required: "Current password is required",
                      })}
                    />
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-accent-error">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-text-primary"
                  >
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      className="input pl-10"
                      placeholder="Enter new password"
                      {...registerPassword("newPassword", {
                        required: "New password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-accent-error">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-lg w-full"
                    onClick={() => {
                      setIsChangingPassword(false);
                      resetPasswordForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary">
                  Keep your account secure by using a strong password.
                </p>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="btn btn-primary btn-lg min-w-[140px]"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

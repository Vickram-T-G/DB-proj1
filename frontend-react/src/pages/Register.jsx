import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, User, Hash } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  console.log("[DEBUG] Register component rendered");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const password = watch("password");
  const selectedRole = watch("role");

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (token) {
      setValue("invitationToken", token);
    }

    if (role && ["teacher", "admin"].includes(role)) {
      setValue("role", role);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data) => {
    console.log("[DEBUG] onSubmit called", data);
    console.log("[DEBUG] Current URL:", window.location.href);
    console.log(
      "[DEBUG] searchParams.get('token'):",
      searchParams.get("token")
    );
    setIsLoading(true);
    // Always include the invitation token from the URL if present
    const token = searchParams.get("token");
    if (token) {
      data.invitationToken = token;
    }
    console.log("[DEBUG] Registration data sent:", data);
    const result = await registerUser(data);
    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard");
    }
  };

  // Check if user has invitation token
  const hasInvitation = searchParams.get("token");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            {hasInvitation
              ? "Complete Your Registration"
              : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {hasInvitation
              ? "You've been invited to join the system"
              : "Or sign in to your existing account"}
            {!hasInvitation && (
              <Link
                to="/login"
                className="font-medium text-accent hover:text-accent-secondary ml-1"
              >
                here
              </Link>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Hidden input for invitationToken if present */}
          {hasInvitation && (
            <input type="hidden" {...register("invitationToken")} />
          )}
          <div className="space-y-4">
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
                  autoComplete="name"
                  className="input pl-10"
                  placeholder="Enter your full name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-accent-error">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-text-primary"
              >
                Role
              </label>
              <select
                id="role"
                className="input"
                {...register("role", {
                  required: "Role is required",
                })}
                disabled={hasInvitation} // Disable if user has invitation
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                {hasInvitation && <option value="admin">Admin</option>}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-accent-error">
                  {errors.role.message}
                </p>
              )}
              {hasInvitation && (
                <p className="mt-1 text-sm text-accent-success">
                  ✓ You have a valid invitation
                </p>
              )}
            </div>

            {selectedRole === "student" && (
              <div>
                <label
                  htmlFor="rollNo"
                  className="block text-sm font-medium text-text-primary"
                >
                  Roll Number <span className="text-accent-error">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="rollNo"
                    type="text"
                    className="input pl-10"
                    placeholder="Enter your roll number"
                    {...register("rollNo", {
                      required: "Roll number is required for students",
                    })}
                  />
                </div>
                {errors.rollNo && (
                  <p className="mt-1 text-sm text-accent-error">
                    {errors.rollNo.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
                Email Address{" "}
                {selectedRole === "admin" && (
                  <span className="text-accent-error">*</span>
                )}
                {selectedRole === "student" && (
                  <span className="text-text-muted">(Optional)</span>
                )}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input pl-10"
                  placeholder="Enter your email"
                  {...register("email", {
                    required:
                      selectedRole === "admin"
                        ? "Email is required for admins"
                        : false,
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
              {selectedRole === "admin" && (
                <p className="mt-1 text-sm text-text-secondary">
                  Email is required for admins to receive attendance reminders
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-text-muted hover:text-text-secondary" />
                  ) : (
                    <Eye className="h-5 w-5 text-text-muted hover:text-text-secondary" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-accent-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-primary"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input pl-10"
                  placeholder="Confirm your password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-accent-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full"
              onClick={() => console.log("[DEBUG] Submit button clicked")}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

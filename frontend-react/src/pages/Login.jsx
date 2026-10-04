import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, Hash } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email"); // "email" or "rollNo"
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    // For students, we can use either email or rollNo
    const loginData = {
      password: data.password,
      [loginMethod]: data[loginMethod],
    };

    const result = await login(loginData);
    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{" "}
            <Link
              to="/register"
              className="font-medium text-accent hover:text-accent-secondary"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Login Method Toggle for Students */}
            <div className="flex space-x-2 p-1 bg-surface-secondary rounded-lg">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === "email"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("rollNo")}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === "rollNo"
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Roll Number
              </button>
            </div>

            <div>
              <label
                htmlFor={loginMethod}
                className="block text-sm font-medium text-text-primary"
              >
                {loginMethod === "email" ? "Email Address" : "Roll Number"}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginMethod === "email" ? (
                    <Mail className="h-5 w-5 text-text-muted" />
                  ) : (
                    <Hash className="h-5 w-5 text-text-muted" />
                  )}
                </div>
                <input
                  id={loginMethod}
                  type={loginMethod === "email" ? "email" : "text"}
                  autoComplete={loginMethod === "email" ? "email" : "off"}
                  className="input pl-10"
                  placeholder={
                    loginMethod === "email"
                      ? "Enter your email"
                      : "Enter your roll number"
                  }
                  {...register(loginMethod, {
                    required:
                      loginMethod === "email"
                        ? "Email is required"
                        : "Roll number is required",
                  })}
                />
              </div>
              {errors[loginMethod] && (
                <p className="mt-1 text-sm text-accent-error">
                  {errors[loginMethod].message}
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
                  autoComplete="current-password"
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

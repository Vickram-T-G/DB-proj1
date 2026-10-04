import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BookOpen, Calendar, Clock, MapPin, Users } from "lucide-react";
import api from "../utils/api";
import { toast } from "react-hot-toast";

const CreateCourse = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Ensure schedule.days is always an array
      let schedule = data.schedule || {};
      if (!Array.isArray(schedule.days)) {
        schedule.days = schedule.days ? [schedule.days] : [];
      }
      // Remove schedule if all fields are empty
      const isScheduleEmpty =
        (!schedule.days || schedule.days.length === 0) &&
        !schedule.startTime &&
        !schedule.endTime &&
        !schedule.room;
      const payload = {
        ...data,
        schedule: isScheduleEmpty ? undefined : schedule,
      };
      await api.post("/courses", payload);
      toast.success("Course created successfully!");
      navigate("/courses");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to create course";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[80vh] bg-background">
      <div className="px-4 md:px-12 pt-8 pb-12">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Create Course
        </h1>
        <p className="text-text-secondary mb-6">
          Add a new course to your teaching schedule
        </p>
        <div className="bg-surface border border-border rounded-lg shadow-sm p-6 md:p-8 w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-primary"
                >
                  Course Name <span className="text-accent-error">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    className="input pl-10"
                    placeholder="e.g., Introduction to Computer Science"
                    {...register("name", {
                      required: "Course name is required",
                    })}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-accent-error">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-text-primary"
                >
                  Course Code <span className="text-accent-error">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  className="input"
                  placeholder="e.g., CS101"
                  {...register("code", { required: "Course code is required" })}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-accent-error">
                    {errors.code.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-primary"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                className="input resize-none"
                placeholder="Brief description of the course..."
                maxLength={1000}
                {...register("description")}
              />
              <p className="mt-1 text-xs text-text-secondary">
                Maximum 1000 characters
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="academicYear"
                  className="block text-sm font-medium text-text-primary"
                >
                  Academic Year <span className="text-accent-error">*</span>
                </label>
                <input
                  id="academicYear"
                  type="text"
                  className="input"
                  placeholder="e.g., 2024-2025"
                  {...register("academicYear", {
                    required: "Academic year is required",
                  })}
                />
                {errors.academicYear && (
                  <p className="mt-1 text-xs text-accent-error">
                    {errors.academicYear.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="semester"
                  className="block text-sm font-medium text-text-primary"
                >
                  Semester <span className="text-accent-error">*</span>
                </label>
                <select
                  id="semester"
                  className="input"
                  {...register("semester", {
                    required: "Semester is required",
                  })}
                >
                  <option value="">Select semester</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
                {errors.semester && (
                  <p className="mt-1 text-xs text-accent-error">
                    {errors.semester.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="schedule.days"
                  className="block text-sm font-medium text-text-primary"
                >
                  Days
                </label>
                <div className="mt-1 space-y-1">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        value={day}
                        className="rounded border-border text-accent focus:ring-accent mr-2"
                        {...register("schedule.days")}
                      />
                      <span className="text-xs text-text-primary">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="schedule.startTime"
                  className="block text-sm font-medium text-text-primary"
                >
                  Start Time
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="schedule.startTime"
                    type="time"
                    className="input pl-10"
                    {...register("schedule.startTime")}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="schedule.endTime"
                  className="block text-sm font-medium text-text-primary"
                >
                  End Time
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    id="schedule.endTime"
                    type="time"
                    className="input pl-10"
                    {...register("schedule.endTime")}
                  />
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="schedule.room"
                className="block text-sm font-medium text-text-primary"
              >
                Room
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  id="schedule.room"
                  type="text"
                  className="input pl-10"
                  placeholder="e.g., Room 101, Building A"
                  {...register("schedule.room")}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0 mt-2">
              <button
                type="submit"
                className="btn btn-primary btn-lg flex-grow md:flex-grow-0 min-w-[140px]"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Course"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/courses")}
                className="btn btn-secondary btn-lg flex-grow md:flex-grow-0 min-w-[140px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;

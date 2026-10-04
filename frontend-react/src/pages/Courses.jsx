import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Users, Calendar, Clock, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      console.log("Fetched courses:", response.data);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Courses</h1>
          <p className="text-text-secondary">
            Manage your courses and attendance
          </p>
        </div>
        {user.role === "teacher" && (
          <Link to="/courses/new" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Link>
        )}
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="card hover:shadow-xl transition-all duration-300 hover:border-accent/30"
            >
              <div className="card-content">
                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-accent" />
                  </div>
                  <span className="badge badge-secondary font-mono">
                    {course.code}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {course.name}
                </h3>

                <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                  {course.description || "No description available"}
                </p>

                {/* Enhanced Course Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-text-secondary">
                      <Users className="h-4 w-4 mr-2" />
                      Students
                    </div>
                    <span className="font-semibold text-text-primary">
                      {course.studentCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-text-secondary">
                      <Calendar className="h-4 w-4 mr-2" />
                      Total Classes
                    </div>
                    <span className="font-semibold text-text-primary">
                      {course.totalClasses || 0}
                    </span>
                  </div>

                  {/* Schedule Information */}
                  {course.schedule && (
                    <>
                      {course.schedule.days &&
                        course.schedule.days.length > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-text-secondary">
                              <Calendar className="h-4 w-4 mr-2" />
                              Days
                            </div>
                            <span className="font-semibold text-text-primary">
                              {course.schedule.days.join(", ")}
                            </span>
                          </div>
                        )}

                      {course.schedule.startTime && course.schedule.endTime && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-text-secondary">
                            <Clock className="h-4 w-4 mr-2" />
                            Time
                          </div>
                          <span className="font-semibold text-text-primary">
                            {course.schedule.startTime} -{" "}
                            {course.schedule.endTime}
                          </span>
                        </div>
                      )}

                      {course.schedule.room && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-text-secondary">
                            <MapPin className="h-4 w-4 mr-2" />
                            Room
                          </div>
                          <span className="font-semibold text-text-primary">
                            {course.schedule.room}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/courses/${course._id}`}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    View Details
                  </Link>
                  {user.role === "teacher" && (
                    <Link
                      to={`/attendance/${course._id}`}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      Mark Attendance
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-content text-center py-12">
            <BookOpen className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No courses found
            </h3>
            <p className="text-text-secondary mb-6">
              {user.role === "student"
                ? "You haven't been enrolled in any courses yet."
                : "You haven't created any courses yet. Get started by creating your first course."}
            </p>
            {user.role === "teacher" && (
              <Link to="/courses/new" className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;

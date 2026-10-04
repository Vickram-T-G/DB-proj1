import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";

const CenterLabel = ({ viewBox, value }) => {
  const { cx, cy } = viewBox;
  return (
    <text
      x={cx}
      y={cy}
      dy={8}
      textAnchor="middle"
      fill="#fff"
      fontSize={32}
      fontWeight={900}
    >
      {value}
    </text>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentCourses, setRecentCourses] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]); // [{ course, stats }]
  const [loading, setLoading] = useState(true);
  // const [statsCache, setStatsCache] = useState(new Map()); // Cache for attendance stats

  // // Memoized function to fetch attendance stats with caching
  // const fetchAttendanceStats = useCallback(
  //   async (courses) => {
  //     if (user.role !== "student") return;

  //     const cacheKey = courses.map((c) => c._id).join(",");

  //     // Check if we have cached data
  //     if (statsCache.has(cacheKey)) {
  //       setAttendanceStats(statsCache.get(cacheKey));
  //       return;
  //     }

  //     const statsPromises = courses.map(async (course) => {
  //       try {
  //         const res = await api.get(`/attendance/${course._id}/stats`);
  //         return { course, stats: res.data.studentStats };
  //       } catch {
  //         return { course, stats: null };
  //       }
  //     });

  //     const results = await Promise.all(statsPromises);
  //     const validStats = results.filter((item) => item.stats);

  //     // Cache the results
  //     setStatsCache((prev) => new Map(prev.set(cacheKey, validStats)));
  //     console.log("attendance stats:", validStats);
  //     setAttendanceStats(validStats);
  //   },
  //   [user.role, statsCache]
  // );

  const fetchAttendanceStats = useCallback(
    async (courses) => {
      if (user.role !== "student") return;

      // NO CACHING - Always get fresh data for the dashboard
      const statsPromises = courses.map(async (course) => {
        try {
          const res = await api.get(`/attendance/${course._id}/stats`);
          return { course, stats: res.data.studentStats };
        } catch {
          return { course, stats: null };
        }
      });

      const results = await Promise.all(statsPromises);
      const validStats = results.filter((item) => item.stats);

      setAttendanceStats(validStats);
    },
    [user.role] // Remove statsCache from dependency array
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [coursesResponse] = await Promise.all([api.get("/courses")]);
      const courses = coursesResponse.data;
      setRecentCourses(courses.slice(0, 5));

      // Fetch attendance stats for each course if student
      if (user.role === "student") {
        await fetchAttendanceStats(courses);
      }

      // Calculate basic stats
      const totalCourses = courses.length;
      const totalStudents =
        user.role === "student"
          ? 0
          : courses.reduce(
              (acc, course) => acc + (course.studentCount || 0),
              0
            );
      setStats({
        totalCourses,
        totalStudents,
        recentActivity: courses.length > 0 ? courses.length : 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user.role, fetchAttendanceStats]);

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  const StatCard = ({ title, value }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="card-content">
          <h1 className="text-2xl font-bold text-text-primary mt-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-text-secondary mt-1">
            Here's what's happening with your attendance today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Courses" value={stats?.totalCourses || 0} />
        {user.role !== "student" && (
          <StatCard title="Total Students" value={stats?.totalStudents || 0} />
        )}
        <StatCard title="Recent Activity" value={stats?.recentActivity || 0} />
        <StatCard title="Today's Classes" value="0" />
      </div>

      {/* Course-specific attendance charts for students */}
      {user.role === "student" && attendanceStats.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary">
            My Course Attendance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendanceStats
              .filter((item) => item.stats) // Only show courses with stats
              .map((item) => (
                <Link
                  key={item.course._id}
                  to={`/courses/${item.course._id}`}
                  className="card hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                >
                  <div className="card-header">
                    <h3 className="card-title text-sm">{item.course.name}</h3>
                    <p className="text-xs text-text-secondary">
                      {item.course.code}
                    </p>
                  </div>
                  <div className="card-content">
                    {item.stats ? (
                      <div className="space-y-4">
                        {/* Attendance Chart */}
                        <div className="relative w-32 h-32 mx-auto">
                          <svg width="128" height="128" viewBox="0 0 128 128">
                            {/* Background circle */}
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke="#1f2937"
                              strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="8"
                              strokeDasharray={`${
                                (item.stats.attendancePercentage / 100) * 352
                              } 352`}
                              strokeDashoffset="88"
                              transform="rotate(-90 64 64)"
                            />
                            {/* Center text */}
                            <text
                              x="64"
                              y="64"
                              dy="4"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="16"
                              fontWeight="bold"
                            >
                              {Math.round(item.stats.attendancePercentage)}%
                            </text>
                          </svg>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">
                              Present:
                            </span>
                            <span className="text-green-400 font-semibold">
                              {item.stats.presentCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Absent:</span>
                            <span className="text-red-400 font-semibold">
                              {item.stats.absentCount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">
                              Total Classes:
                            </span>
                            <span className="text-blue-400 font-semibold">
                              {item.stats.totalClasses}
                            </span>
                          </div>
                          {item.stats.warning && (
                            <div className="text-red-400 text-xs font-semibold text-center">
                              ⚠️ {item.stats.warning}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-text-muted text-sm py-4">
                        No attendance data available
                      </div>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
      {/* Recent Courses */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Courses</h3>
          <p className="card-description">Your most recent course activities</p>
        </div>
        <div className="card-content">
          {recentCourses.length > 0 ? (
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <Link
                  key={course._id}
                  to={`/courses/${course._id}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">
                        {course.name}
                      </h4>
                      <p className="text-sm text-text-secondary">
                        {course.code}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No courses yet
              </h3>
              <p className="text-text-secondary">
                {user.role === "student"
                  ? "You haven't been enrolled in any courses yet."
                  : "You haven't created any courses yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
          <p className="card-description">Common tasks and shortcuts</p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/courses"
              className="p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-accent group-hover:text-accent-secondary" />
                <span className="font-medium text-text-primary">
                  View All Courses
                </span>
              </div>
            </Link>

            {user.role === "teacher" && (
              <Link
                to="/courses"
                className="p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-accent-success group-hover:text-accent-success/80" />
                  <span className="font-medium text-text-primary">
                    Mark Attendance
                  </span>
                </div>
              </Link>
            )}

            <Link
              to="/profile"
              className="p-4 border border-border rounded-lg hover:bg-surface-secondary transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-accent-warning group-hover:text-accent-warning/80" />
                <span className="font-medium text-text-primary">
                  Update Profile
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

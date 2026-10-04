import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Calendar,
  BookOpen,
  Edit2,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
// Import TakeAttendanceModal and helpers from Attendance.jsx
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
// Helper for status icon
const statusIcon = (status) => {
  switch (status) {
    case "present":
      return <CheckCircle className="inline mr-1 text-green-500" size={16} />;
    case "absent":
      return <XCircle className="inline mr-1 text-red-500" size={16} />;
    case "late":
      return <Clock className="inline mr-1 text-yellow-400" size={16} />;
    case "excused":
      return <Info className="inline mr-1 text-blue-400" size={16} />;
    default:
      return <MinusCircle className="inline mr-1 text-gray-500" size={16} />;
  }
};
const statusBadgeClass = (status) => {
  switch (status) {
    case "present":
      return "bg-green-600 bg-opacity-80 text-green-100 border-green-400";
    case "absent":
      return "bg-red-600 bg-opacity-80 text-red-100 border-red-400";
    case "late":
      return "bg-yellow-500 bg-opacity-80 text-yellow-900 border-yellow-300";
    case "excused":
      return "bg-blue-600 bg-opacity-80 text-blue-100 border-blue-400";
    default:
      return "bg-gray-700 bg-opacity-80 text-gray-300 border-gray-500";
  }
};

const TakeAttendanceModal = ({ open, onClose, students, onSubmit }) => {
  const [date, setDate] = useState(() => new Date());
  const [absentCodes, setAbsentCodes] = useState("");
  const [lateCodes, setLateCodes] = useState("");
  const [excusedCodes, setExcusedCodes] = useState("");
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const inputRef = useRef();
  const getCode = (student) => {
    if (!student.studentId) return "";
    return student.studentId.slice(-3);
  };
  useEffect(() => {
    if (!open) return;
    const abs = absentCodes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const late = lateCodes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const exc = excusedCodes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const used = new Set();
    const result = students.map((s) => {
      const code = getCode(s);
      let status = "present";
      if (abs.includes(code)) status = "absent";
      else if (late.includes(code)) status = "late";
      else if (exc.includes(code)) status = "excused";
      if (status !== "present") used.add(code);
      return { ...s, code, status };
    });
    const allCodes = [...abs, ...late, ...exc];
    const invalid = allCodes.filter(
      (c) => c && !result.some((s) => s.code === c)
    );
    setError(invalid.length ? `Invalid code(s): ${invalid.join(", ")}` : "");
    setPreview(result);
  }, [absentCodes, lateCodes, excusedCodes, students, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-lg relative border border-border">
        <button
          className="absolute top-2 right-2 text-text-secondary hover:text-accent"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-text-primary">
          Take Attendance
        </h2>
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-text-secondary text-sm font-semibold">
            Date
          </label>
          <DatePicker
            selected={date}
            onChange={setDate}
            className="input bg-surface text-text-primary border-border rounded"
            calendarClassName="bg-surface text-text-primary border border-border rounded shadow-lg"
            dayClassName={() => "bg-surface text-text-primary"}
            popperClassName="z-50"
            dateFormat="dd/MM/yyyy"
            todayButton="Today"
            showPopperArrow={false}
            wrapperClassName="w-full"
          />
        </div>
        <div className="mb-2 flex flex-col gap-2">
          <label className="text-text-secondary text-sm font-semibold">
            Absentees (codes, comma separated)
          </label>
          <input
            ref={inputRef}
            className="input"
            placeholder="e.g. 155,245,667"
            value={absentCodes}
            onChange={(e) => setAbsentCodes(e.target.value)}
          />
        </div>
        <div className="mb-2 flex flex-col gap-2">
          <label className="text-text-secondary text-sm font-semibold">
            Latecomers (codes, comma separated)
          </label>
          <input
            className="input"
            placeholder="e.g. 155,245,667"
            value={lateCodes}
            onChange={(e) => setLateCodes(e.target.value)}
          />
        </div>
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-text-secondary text-sm font-semibold">
            Excused (codes, comma separated)
          </label>
          <input
            className="input"
            placeholder="e.g. 155,245,667"
            value={excusedCodes}
            onChange={(e) => setExcusedCodes(e.target.value)}
          />
        </div>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <div className="mb-4">
          <div className="font-semibold text-text-primary mb-1">Preview:</div>
          <div className="flex flex-wrap gap-2">
            {preview.map((s) => (
              <span
                key={s._id}
                className={`px-2 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(
                  s.status
                )}`}
              >
                {statusIcon(s.status)} {s.name} ({s.code}) - {s.status}
              </span>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary w-full mt-2"
          disabled={!!error}
          onClick={() => {
            if (error) return;
            const records = preview.map((s) => ({
              student: s._id,
              status: s.status,
              markedBy: null,
            }));
            onSubmit(date.toISOString().slice(0, 10), records);
          }}
        >
          Submit Attendance
        </button>
      </div>
    </div>
  );
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0 ? (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={20}
      fontWeight={900}
      style={{ pointerEvents: "none", textShadow: "0 1px 4px #000a" }}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  ) : null;
};

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [attStats, setAttStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [takeModal, setTakeModal] = useState(false);
  const [editClassesModal, setEditClassesModal] = useState(false);
  const [newTotalClasses, setNewTotalClasses] = useState(0);
  const [updatingClasses, setUpdatingClasses] = useState(false);
  const [editScheduleModal, setEditScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    days: [],
    startTime: "",
    endTime: "",
    room: "",
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [statsCache, setStatsCache] = useState(new Map()); // Cache for stats

  // Memoized fetch functions with caching
  const fetchCourse = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data);
      setNewTotalClasses(response.data.totalClasses || 0);
      setNewSchedule({
        days: response.data.schedule?.days || [],
        startTime: response.data.schedule?.startTime || "",
        endTime: response.data.schedule?.endTime || "",
        room: response.data.schedule?.room || "",
      });
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStats = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = `${id}-${user.role}`;
      if (statsCache.has(cacheKey)) {
        setAttStats(statsCache.get(cacheKey));
        return;
      }

      const res = await api.get(`/attendance/${id}/stats`);
      let stats = null;

      if (user.role === "student") {
        stats = res.data.studentStats;
      } else if (user.role === "teacher" || user.role === "admin") {
        // For teachers/admins, we'll use the first student's stats for the chart
        // or create a summary from all students
        if (res.data.studentStats && res.data.studentStats.length > 0) {
          const totalStats = res.data.studentStats.reduce(
            (acc, student) => {
              acc.presentCount += student.presentCount;
              acc.absentCount += student.absentCount;
              acc.lateCount += student.lateCount;
              acc.excusedCount += student.excusedCount;
              return acc;
            },
            { presentCount: 0, absentCount: 0, lateCount: 0, excusedCount: 0 }
          );
          stats = totalStats;
        }
      }

      // Cache the results
      setStatsCache((prev) => new Map(prev.set(cacheKey, stats)));
      setAttStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setAttStats(null);
    }
  }, [id, user.role, statsCache]);

  useEffect(() => {
    fetchCourse();
    fetchStats();
  }, [fetchCourse, fetchStats]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${id}`);
      toast.success("Course deleted successfully");
      window.location.href = "/courses";
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  const handleTakeAttendance = async (date, records) => {
    try {
      await api.post(`/attendance/${id}`, { date, records });
      toast.success("Attendance submitted");
      setTakeModal(false);
      fetchCourse();
      fetchStats();
    } catch {
      toast.error("Failed to submit attendance");
    }
  };

  const handleUpdateTotalClasses = async () => {
    setUpdatingClasses(true);
    try {
      console.log(
        `[DEBUG] Updating total classes for course ${id} to ${newTotalClasses}`
      );
      const response = await api.put(`/courses/${id}/total-classes`, {
        totalClasses: parseInt(newTotalClasses),
      });
      console.log(`[DEBUG] Update response:`, response.data);
      toast.success("Total classes updated successfully");
      setEditClassesModal(false);
      fetchCourse();
    } catch (error) {
      console.error(`[DEBUG] Error updating total classes:`, error);
      console.error(`[DEBUG] Error response:`, error.response?.data);
      toast.error(
        error.response?.data?.error || "Failed to update total classes"
      );
    } finally {
      setUpdatingClasses(false);
    }
  };

  const handleUpdateSchedule = async () => {
    setUpdatingSchedule(true);
    try {
      console.log(`[DEBUG] Updating schedule for course ${id}:`, newSchedule);
      const response = await api.put(`/courses/${id}`, {
        schedule: newSchedule,
      });
      console.log(`[DEBUG] Schedule update response:`, response.data);
      toast.success("Schedule updated successfully");
      setEditScheduleModal(false);
      fetchCourse();
    } catch (error) {
      console.error(`[DEBUG] Error updating schedule:`, error);
      console.error(`[DEBUG] Error response:`, error.response?.data);
      toast.error(error.response?.data?.error || "Failed to update schedule");
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const toggleDay = (day) => {
    setNewSchedule((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-text-primary">
          Course not found
        </h2>
        <Link to="/courses" className="btn btn-primary mt-4">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header - Updated with modern styling */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-start justify-between mt-2">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {course.name}
                </h1>
                <p className="text-text-secondary p-2">{course.code}</p>
                <p className="text-sm text-text-muted mt-1">
                  {course.academicYear} • {course.semester}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {(user.role === "admin" || user.role === "teacher") && (
                <button
                  className="btn btn-primary p-2"
                  onClick={() => setTakeModal(true)}
                >
                  Take Attendance
                </button>
              )}
              <Link to="/courses" className="btn btn-secondary p-2">
                Back to Courses
              </Link>
              {user.role === "admin" && (
                <button
                  className="btn btn-destructive p-2"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Course"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-text-muted">Total Classes:</span>
            {user.role === "admin" ||
            (user.role === "teacher" && course.instructor?._id === user._id) ? (
              <button
                className="font-bold text-accent underline hover:text-accent-secondary focus:outline-none"
                onClick={() => setEditClassesModal(true)}
                title="Edit total classes"
              >
                {course.totalClasses}
              </button>
            ) : (
              <span className="font-bold text-text-primary">
                {course.totalClasses}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Warning and Stats for Students */}
      {user.role === "student" && attStats && (
        <div
          className="card border-2 p-4 mb-4"
          style={{
            borderColor:
              attStats.attendancePercentage < 75
                ? "#ef4444"
                : attStats.attendancePercentage < 80
                ? "#facc15"
                : "#22c55e",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-1">
                Attendance Status
              </h3>
              <div className="text-2xl font-bold">
                {attStats.attendancePercentage.toFixed(1)}%
              </div>
              {attStats.warning && (
                <div
                  className={`mt-2 text-base font-semibold ${
                    attStats.attendancePercentage < 75
                      ? "text-red-500"
                      : "text-yellow-500"
                  }`}
                >
                  {attStats.warning}
                </div>
              )}
              <div className="mt-2 text-sm text-text-secondary">
                Present: {attStats.presentCount} | Absent:{" "}
                {attStats.absentCount} | Late: {attStats.lateCount} | Excused:{" "}
                {attStats.excusedCount}
              </div>
            </div>
            <div className="flex flex-col items-center">
              {attStats && attStats.totalClasses > 0 ? (
                <div className="my-8 flex flex-col items-center justify-center">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #23243a 60%, #18192b 100%)",
                      borderRadius: "32px",
                      boxShadow: "0 8px 32px 0 rgba(60, 100, 220, 0.18)",
                      padding: "32px 0",
                      width: 320,
                      maxWidth: "90vw",
                      position: "relative",
                      margin: "0 auto",
                    }}
                  >
                    <svg
                      width="220"
                      height="220"
                      style={{ display: "block", margin: "0 auto" }}
                    >
                      <defs>
                        <linearGradient
                          id="attendGradBlueDetail"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <filter
                          id="glowBlueDetail"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feGaussianBlur
                            stdDeviation="3.5"
                            result="coloredBlur"
                          />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      {/* Background circle */}
                      <circle cx="110" cy="110" r="90" fill="#18192b" />
                      {/* Attendance arc */}
                      {(() => {
                        const total =
                          attStats.presentCount +
                          attStats.absentCount +
                          attStats.lateCount +
                          attStats.excusedCount;
                        const percent = total
                          ? attStats.presentCount / total
                          : 0;
                        const end = percent * 2 * Math.PI;
                        const r = 90;
                        const cx = 110,
                          cy = 110;
                        const x2 = cx + r * Math.sin(end);
                        const y2 = cy - r * Math.cos(end);
                        const largeArc = percent > 0.5 ? 1 : 0;
                        return (
                          <>
                            <path
                              d={`M${cx} ${
                                cy - r
                              } A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                              stroke="url(#attendGradBlueDetail)"
                              strokeWidth="26"
                              fill="none"
                              strokeLinecap="round"
                              filter="url(#glowBlueDetail)"
                            />
                            {/* Progress dot */}
                            <circle
                              cx={x2}
                              cy={y2}
                              r="9"
                              fill="#60a5fa"
                              filter="url(#glowBlueDetail)"
                              style={{ stroke: "#fff", strokeWidth: 2 }}
                            />
                          </>
                        );
                      })()}
                      {/* Center percent */}
                      <text
                        x="110"
                        y="120"
                        textAnchor="middle"
                        fontSize="48"
                        fontWeight="900"
                        fill="#fff"
                        style={{ filter: "drop-shadow(0 2px 8px #2563ebbb)" }}
                      >
                        {/* {Math.round(
                          (attStats.presentCount /
                            (attStats.presentCount +
                              attStats.absentCount +
                              attStats.lateCount +
                              attStats.excusedCount || 1)) *
                            100
                        )} %*/}
                        {Math.round(attStats.attendancePercentage)}%
                      </text>
                      {/* Center label */}
                      <text
                        x="110"
                        y="150"
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="500"
                        fill="#60a5fa"
                      >
                        Attendance
                      </text>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="my-8">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <defs>
                        <linearGradient
                          id="presentGradientDetail"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient
                          id="absentGradientDetail"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient
                          id="lateGradientDetail"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient
                          id="excusedGradientDetail"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={[
                          { name: "Present", value: attStats.presentCount },
                          { name: "Absent", value: attStats.absentCount },
                          { name: "Late", value: attStats.lateCount },
                          { name: "Excused", value: attStats.excusedCount },
                        ].filter((d) => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        innerRadius={40}
                        label={renderCustomizedLabel}
                        labelLine={false}
                        isAnimationActive={true}
                        animationDuration={1500}
                        style={{
                          filter: "drop-shadow(0 8px 25px rgba(0,0,0,0.4))",
                          borderRadius: "50%",
                          fontWeight: 900,
                          fontSize: 26,
                          cursor: "pointer",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        <Cell
                          key="present"
                          fill="url(#presentGradientDetail)"
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                        <Cell
                          key="absent"
                          fill="url(#absentGradientDetail)"
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                        <Cell
                          key="late"
                          fill="url(#lateGradientDetail)"
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                        <Cell
                          key="excused"
                          fill="url(#excusedGradientDetail)"
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(17, 24, 39, 0.95)",
                          color: "#f9fafb",
                          borderRadius: 16,
                          border: "2px solid rgba(59, 130, 246, 0.3)",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                          fontSize: 14,
                          fontWeight: 600,
                          backdropFilter: "blur(10px)",
                        }}
                        formatter={(value, name) => [value, name]}
                        labelFormatter={(label) => `Attendance: ${label}`}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{
                          color: "#f9fafb",
                          fontSize: 14,
                          fontWeight: 600,
                          paddingTop: 25,
                        }}
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-2 text-sm text-text-secondary">
                <span className="font-semibold">Leaves left:</span>{" "}
                {attStats.leavesLeft}
              </div>
              {attStats.attendancePercentage < 75 && (
                <div className="mt-1 text-sm text-red-500">
                  You need to attend <b>{attStats.classesTo75}</b> more class
                  {attStats.classesTo75 !== 1 ? "es" : ""} to reach 75%.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Course Description</h3>
            </div>
            <div className="card-content">
              <p className="text-text-primary">
                {course.description ||
                  "No description available for this course."}
              </p>
            </div>
          </div>

          {/* Schedule */}
          {course.schedule && (
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="card-title">Schedule</h3>
                  {user.role === "admin" && (
                    <button
                      onClick={() => setEditScheduleModal(true)}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit Schedule
                    </button>
                  )}
                </div>
              </div>
              <div className="card-content">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-text-muted" />
                    <span className="text-text-primary">
                      {course.schedule.days?.join(", ") || "No schedule set"}
                    </span>
                  </div>
                  {course.schedule.startTime && course.schedule.endTime && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-text-muted" />
                      <span className="text-text-primary">
                        {course.schedule.startTime} - {course.schedule.endTime}
                      </span>
                    </div>
                  )}
                  {course.schedule.room && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-text-muted" />
                      <span className="text-text-primary">
                        {course.schedule.room}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Course Statistics</h3>
            </div>
            <div className="card-content">
              {user.role === "student" && attStats ? (
                <div className="space-y-4">
                  {/* Course-specific attendance chart for student */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg width="192" height="192" viewBox="0 0 192 192">
                        {/* Background circle */}
                        <circle
                          cx="96"
                          cy="96"
                          r="84"
                          fill="none"
                          stroke="#1f2937"
                          strokeWidth="12"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="96"
                          cy="96"
                          r="84"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="12"
                          strokeDasharray={`${
                            (attStats.attendancePercentage / 100) * 528
                          } 528`}
                          strokeDashoffset="132"
                          transform="rotate(-90 96 96)"
                        />
                        {/* Center text */}
                        <text
                          x="96"
                          y="96"
                          dy="6"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="24"
                          fontWeight="bold"
                        >
                          {Math.round(attStats.attendancePercentage)}%
                        </text>
                        <text
                          x="96"
                          y="120"
                          textAnchor="middle"
                          fill="#60a5fa"
                          fontSize="14"
                          fontWeight="500"
                        >
                          Attendance
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-lg">
                        {attStats.presentCount}
                      </div>
                      <div className="text-text-secondary">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 font-bold text-lg">
                        {attStats.absentCount}
                      </div>
                      <div className="text-text-secondary">Absent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold text-lg">
                        {attStats.lateCount}
                      </div>
                      <div className="text-text-secondary">Late</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold text-lg">
                        {attStats.totalClasses}
                      </div>
                      <div className="text-text-secondary">Total Classes</div>
                    </div>
                  </div>

                  {attStats.warning && (
                    <div className="text-red-400 text-center font-semibold">
                      ⚠️ {attStats.warning}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {course?.totalClasses || 0}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Total Classes
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {course?.students?.length || 0}
                    </div>
                    <div className="text-sm text-text-secondary">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {course?.code || "N/A"}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Course Code
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">
                      {course?.instructor?.name || "N/A"}
                    </div>
                    <div className="text-sm text-text-secondary">
                      Instructor
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content space-y-2">
              <Link
                to={`/attendance/${course._id}`}
                className="btn btn-primary btn-sm w-full"
              >
                View Attendance
              </Link>
              {user.role === "teacher" && (
                <Link
                  to={`/courses/${course._id}/students`}
                  className="btn btn-secondary btn-sm w-full"
                >
                  Manage Students
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <TakeAttendanceModal
        open={takeModal}
        onClose={() => setTakeModal(false)}
        students={course.students?.map((s) => s.student) || []}
        onSubmit={handleTakeAttendance}
      />

      {/* Edit Total Classes Modal */}
      {editClassesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Edit Total Classes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Total Classes
                </label>
                <input
                  type="number"
                  min="0"
                  value={newTotalClasses}
                  onChange={(e) => setNewTotalClasses(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateTotalClasses}
                  disabled={updatingClasses}
                  className="btn btn-primary flex-1"
                >
                  {updatingClasses ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={() => setEditClassesModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Edit Schedule
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`p-2 rounded border text-sm ${
                        newSchedule.days.includes(day)
                          ? "bg-accent text-white border-accent"
                          : "bg-surface text-text-primary border-border hover:bg-accent/10"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Room
                </label>
                <input
                  type="text"
                  value={newSchedule.room}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      room: e.target.value,
                    }))
                  }
                  placeholder="e.g., Room 101"
                  className="input w-full"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateSchedule}
                  disabled={updatingSchedule}
                  className="btn btn-primary flex-1"
                >
                  {updatingSchedule ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={() => setEditScheduleModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;

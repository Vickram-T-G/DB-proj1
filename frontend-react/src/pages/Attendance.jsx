import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Users,
  BarChart3,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  MinusCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-hot-toast";
import "../styles/datepicker-dark.css";
import DatePicker from "react-datepicker";
import { formatIndianDate } from "../utils/dateUtils";

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "excused", label: "Excused" },
];

const EditAttendanceModal = ({
  open,
  onClose,
  student,
  date,
  status,
  onSave,
}) => {
  const [newStatus, setNewStatus] = useState(status || "");
  useEffect(() => {
    // console.log("date at attendance modal:", date);
    setNewStatus(status || "");
  }, [status, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-xs relative border border-border">
        <button
          className="absolute top-2 right-2 text-text-secondary hover:text-accent"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4 text-text-primary">
          Edit Attendance
        </h2>
        <div className="mb-2 text-text-primary font-semibold">
          {student.name}
        </div>
        <div className="mb-2 text-text-secondary text-sm">
          {date && new Date(date).toLocaleDateString
            ? new Date(date).toLocaleDateString()
            : "Invalid date"}
        </div>
        <select
          className="input w-full mb-4"
          value={newStatus ?? ""}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary w-full p-2"
          onClick={() => onSave(newStatus)}
        >
          Save
        </button>
      </div>
    </div>
  );
};

const StudentDetailModal = ({ open, onClose, student, courseId, user }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    if (open && student) {
      fetchStudentAttendance();
    }
    // eslint-disable-next-line
  }, [open, student]);

  const fetchStudentAttendance = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 9);
      const attRes = await api.get(
        `/attendance/${courseId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const attList = attRes.data.attendance || attRes.data || [];
      const allDates = [];
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        allDates.push(new Date(d).toISOString().slice(0, 10));
      }
      // Map date to status - only include dates where attendance was actually taken
      const recs = allDates
        .map((date) => {
          const att = attList.find(
            (a) => new Date(a.date).toISOString().slice(0, 10) === date
          );
          const record = att?.records?.find((r) => r.student === student._id);
          // Only include dates where attendance was actually taken
          if (att && record) {
            return {
              date,
              status: record.status,
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries
      setRecords(recs);
    } catch {
      toast.error("Failed to load student attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditStatus(
      records[idx].status === "-" ? "present" : records[idx].status
    );
  };

  const handleSave = async (idx) => {
    try {
      const date = records[idx].date;
      // Fetch the attendance record for this date
      const attRes = await api.get(`/attendance/${courseId}/${date}`);
      let attDoc = attRes.data;
      if (!attDoc || !attDoc.records)
        return toast.error("Attendance record not found");
      const recordIdx = attDoc.records.findIndex(
        (r) => r.student === student._id
      );
      if (recordIdx >= 0) {
        attDoc.records[recordIdx].status = editStatus;
      } else {
        attDoc.records.push({
          student: student._id,
          status: editStatus,
          markedBy: user._id,
        });
      }
      await api.put(`/attendance/${courseId}/${date}`, {
        records: attDoc.records,
      });
      toast.success("Attendance updated");
      setEditIdx(null);
      fetchStudentAttendance();
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  if (!open || !student) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-md relative border border-border">
        <button
          className="absolute top-2 right-2 text-text-secondary hover:text-accent"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-text-primary">
          {student.name}'s Attendance (Last 10 Days - Taken Only)
        </h2>
        {loading ? (
          <LoadingSpinner size="md" className="h-32" />
        ) : (
          <table className="table min-w-max">
            <thead>
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Status</th>
                {(user.role === "admin" || user.role === "teacher") && (
                  <th className="table-header-cell">Edit</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => (
                <tr key={rec.date} className="table-row">
                  <td className="px-3 py-2 text-sm text-text-secondary">
                    {rec.date && new Date(rec.date).toLocaleDateString
                      ? new Date(rec.date).toLocaleDateString()
                      : "Invalid date"}
                  </td>
                  <td className="table-cell">
                    {editIdx === idx ? (
                      <select
                        className="input"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge badge-${rec.status}`}>
                        {rec.status}
                      </span>
                    )}
                  </td>
                  {(user.role === "admin" || user.role === "teacher") && (
                    <td className="table-cell">
                      {editIdx === idx ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSave(idx)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="p-1 text-text-secondary hover:text-accent"
                          onClick={() => handleEdit(idx)}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const TakeAttendanceModal = ({ open, onClose, students, onSubmit }) => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [absentCodes, setAbsentCodes] = useState("");
  const [lateCodes, setLateCodes] = useState("");
  const [excusedCodes, setExcusedCodes] = useState("");
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const inputRef = useRef();

  // Helper: get last 3 digits of studentId
  const getCode = (student) => {
    if (!student.studentId) return "";
    return student.studentId.slice(-3);
  };

  // Build preview on input change
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
    // Check for invalid codes
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
      <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-border">
        <button
          className="absolute top-3 right-3 text-text-secondary hover:text-accent text-2xl"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-text-primary text-center">
          Take Attendance
        </h2>
        <div className="mb-6 flex flex-col gap-3">
          <label className="text-text-secondary text-base font-semibold mb-1">
            Date
          </label>
          <DatePicker
            selected={date}
            onChange={setDate}
            className="input bg-surface text-text-primary border-border rounded-lg text-lg py-3 px-4 w-full cursor-pointer"
            calendarClassName="bg-surface text-text-primary border border-border rounded shadow-lg"
            dayClassName={() => "bg-surface text-text-primary"}
            popperClassName="z-50"
            dateFormat="dd-MM-yyyy"
            todayButton="Today"
            showPopperArrow={false}
            wrapperClassName="w-full"
            customInput={
              <div className="flex items-center gap-2 cursor-pointer border border-border rounded-lg px-4 py-3 bg-surface text-text-primary text-lg w-full">
                <span>
                  {date && new Date(date).toLocaleDateString
                    ? new Date(date).toLocaleDateString()
                    : "Select date"}
                </span>
                <Calendar className="w-6 h-6 text-accent ml-auto" />
              </div>
            }
          />
        </div>
        <div className="mb-4 flex flex-col gap-3">
          <label className="text-text-secondary text-base font-semibold">
            Absentees (codes, comma separated)
          </label>
          <input
            ref={inputRef}
            className="input text-lg py-2"
            placeholder="e.g. 155,245,667"
            value={absentCodes}
            onChange={(e) => setAbsentCodes(e.target.value)}
          />
        </div>
        <div className="mb-4 flex flex-col gap-3">
          <label className="text-text-secondary text-base font-semibold">
            Latecomers (codes, comma separated)
          </label>
          <input
            className="input text-lg py-2"
            placeholder="e.g. 155,245,667"
            value={lateCodes}
            onChange={(e) => setLateCodes(e.target.value)}
          />
        </div>
        <div className="mb-4 flex flex-col gap-3">
          <label className="text-text-secondary text-base font-semibold">
            Excused (codes, comma separated)
          </label>
          <input
            className="input text-lg py-2"
            placeholder="e.g. 155,245,667"
            value={excusedCodes}
            onChange={(e) => setExcusedCodes(e.target.value)}
          />
        </div>
        {error && (
          <div className="text-red-400 mb-2 text-center text-base">{error}</div>
        )}
        <div className="mb-6">
          <div className="font-semibold text-text-primary mb-2 text-base">
            Preview:
          </div>
          <div className="flex flex-wrap gap-2">
            {preview.map((s) => (
              <span
                key={s._id}
                className={`px-3 py-2 rounded-full border text-base font-semibold ${statusBadgeClass(
                  s.status
                )}`}
              >
                {statusIcon(s.status)} {s.name} ({s.code}) - {s.status}
              </span>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary w-full mt-2 py-3 text-lg rounded-lg shadow-md hover:scale-[1.02] transition-transform"
          disabled={!!error}
          onClick={() => {
            if (error) return;
            const records = preview.map((s) => ({
              student: s._id,
              status: s.status,
              markedBy: null, // backend will fill
            }));
            onSubmit(date, records);
          }}
        >
          Submit Attendance
        </button>
      </div>
    </div>
  );
};

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
// Helper for status badge style
const statusBadgeClass = (status) => {
  switch (status) {
    case "present":
      // Force strong green for present, works in both dark and light mode
      return "bg-green-600 text-green-100 border-2 border-green-400 shadow-[0_0_0_2px_rgba(34,197,94,0.5)]";
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

const Attendance = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [dates, setDates] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // {date: {studentId: status}}
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({
    open: false,
    student: null,
    date: null,
    status: null,
  });
  const [studentModal, setStudentModal] = useState({
    open: false,
    student: null,
  });
  const [takeModal, setTakeModal] = useState(false);
  const [dataCache, setDataCache] = useState(new Map()); // Cache for attendance data

  // Memoized fetch function with caching
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `attendance-${courseId}`;
      if (dataCache.has(cacheKey)) {
        const cached = dataCache.get(cacheKey);
        setCourse(cached.course);
        setStudents(cached.students);
        setDates(cached.dates);
        setAttendanceMap(cached.attendanceMap);
        setLoading(false);
        return;
      }

      // 1. Fetch course and students
      const courseRes = await api.get(`/courses/${courseId}`);
      setCourse(courseRes.data);
      // Ensure all student._id are strings
      const studentsData = courseRes.data.students.map((s) => ({
        ...s.student,
        _id: String(s.student._id),
      }));
      setStudents(studentsData);

      // 2. Fetch attendance records for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29);
      const attRes = await api.get(
        `/attendance/${courseId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      // 3. Process attendance data
      const attendanceRecords = attRes.data.attendance || [];
      const attendanceMapData = {};
      const datesSet = new Set();

      attendanceRecords.forEach((att) => {
        const dateStr = new Date(att.date).toISOString().slice(0, 10);
        datesSet.add(dateStr);
        attendanceMapData[dateStr] = {};
        att.records.forEach((record) => {
          attendanceMapData[dateStr][record.student._id || record.student] =
            record.status;
        });
      });

      const datesArray = Array.from(datesSet).sort();

      // Cache the results
      const cacheData = {
        course: courseRes.data,
        students: studentsData,
        dates: datesArray,
        attendanceMap: attendanceMapData,
      };
      setDataCache((prev) => new Map(prev.set(cacheKey, cacheData)));

      setDates(datesArray);
      setAttendanceMap(attendanceMapData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [courseId, dataCache]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleEdit = (student, date, status) => {
    setEditModal({ open: true, student, date, status });
  };

  const handleSave = async (newStatus) => {
    try {
      // Update attendance for this student/date
      const { student, date } = editModal;
      let attDoc;
      try {
        // Try to fetch the attendance record for this date
        const attRes = await api.get(`/attendance/${courseId}/${date}`);
        attDoc = attRes.data;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // If not found, create a new attendance record for this date
          const validStatuses = ["present", "absent", "late", "excused"];
          const records = students
            .map((s) => ({
              student: s._id,
              status: s._id === student._id ? newStatus : "absent",
              markedBy: user._id,
            }))
            .filter((rec) => validStatuses.includes(rec.status));
          const newRecord = {
            date,
            records,
          };
          const createRes = await api.post(
            `/attendance/${courseId}`,
            newRecord
          );

          attDoc = createRes.data;
          toast.success("Attendance created");
          setEditModal({
            open: false,
            student: null,
            date: null,
            status: null,
          });
          fetchAttendanceData();
          return;
        } else {
          return toast.error("Failed to fetch attendance record");
        }
      }
      if (!attDoc || !attDoc.records)
        return toast.error("Attendance record not found");
      // Update the student's status
      const recordIdx = attDoc.records.findIndex(
        (r) => r.student === student._id
      );
      if (recordIdx >= 0) {
        attDoc.records[recordIdx].status = newStatus;
      } else {
        attDoc.records.push({
          student: student._id,
          status: newStatus,
          markedBy: user._id,
        });
      }
      // Save
      // Sanitize records: ensure student and markedBy are strings, and filter out invalid statuses
      const validStatuses = ["present", "absent", "late", "excused"];
      const sanitizedRecords = attDoc.records
        .map((rec) => ({
          ...rec,
          student:
            typeof rec.student === "object" && rec.student !== null
              ? rec.student._id
              : rec.student,
          markedBy:
            typeof rec.markedBy === "object" && rec.markedBy !== null
              ? rec.markedBy._id
              : rec.markedBy,
        }))
        .filter((rec) => validStatuses.includes(rec.status));
      console.log("PUT /attendance sanitized records:", sanitizedRecords);
      await api.put(`/attendance/${courseId}/${date}`, {
        records: sanitizedRecords,
      });
      toast.success("Attendance updated");
      setEditModal({ open: false, student: null, date: null, status: null });
      fetchAttendanceData();
    } catch (err) {
      if (err.response) {
        console.error("PUT /attendance error:", err.response.data);
        toast.error(
          "Failed to update attendance: " + JSON.stringify(err.response.data)
        );
      } else {
        toast.error("Failed to update attendance");
      }
    }
  };

  // Add this function to handle bulk attendance submission
  const handleTakeAttendance = async (date, records) => {
    try {
      console.log("Submitting attendance records:", records);
      await api.post(`/attendance/${courseId}`, { date, records });
      toast.success("Attendance submitted");
      setTakeModal(false);
      await fetchAttendanceData();
    } catch {
      toast.error("Failed to submit attendance");
    }
  };

  // Only show last 7 days in main table
  const last7Dates = dates.slice(-7);

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-text-primary">
          Course not found
        </h2>
        <Link to="/courses" className="btn btn-primary mt-4 p-2">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Attendance</h1>
          <p className="text-text-secondary">
            {course.name} ({course.code})
          </p>
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
          <Link to={`/courses/${courseId}`} className="btn btn-secondary">
            Back to Course
          </Link>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-x-auto">
        <div className="card-header">
          <h3 className="card-title">Student Attendance (Last 7 Days)</h3>
        </div>
        <div className="card-content p-0">
          <table className="table min-w-max">
            <thead>
              <tr>
                <th className="table-header-cell">Student</th>
                {last7Dates.map((date) => (
                  <th key={date} className="table-header-cell text-xs">
                    {formatIndianDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="table-row">
                  <td
                    className="table-cell font-medium text-text-primary cursor-pointer hover:underline"
                    onClick={() => setStudentModal({ open: true, student })}
                  >
                    {student.name}
                  </td>
                  {last7Dates.map((date) => {
                    const status = attendanceMap[date]?.[student._id];
                    // Only show attendance if it was actually taken
                    if (!status) {
                      return (
                        <td key={date} className="table-cell text-center">
                          <span className="text-text-muted text-xs">-</span>
                        </td>
                      );
                    }
                    return (
                      <td key={date} className="table-cell text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full border font-semibold text-xs gap-1 ${statusBadgeClass(
                            status
                          )}`}
                        >
                          {statusIcon(status)}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        {(user.role === "admin" || user.role === "teacher") && (
                          <button
                            className="ml-1 p-1 text-text-secondary hover:text-accent"
                            onClick={() => handleEdit(student, date, status)}
                            title="Edit Attendance"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditAttendanceModal
        open={editModal.open}
        onClose={() =>
          setEditModal({ open: false, student: null, date: null, status: null })
        }
        student={editModal.student}
        date={editModal.date}
        status={editModal.status}
        onSave={handleSave}
      />
      <StudentDetailModal
        open={studentModal.open}
        onClose={() => setStudentModal({ open: false, student: null })}
        student={studentModal.student}
        courseId={courseId}
        user={user}
      />
      <TakeAttendanceModal
        open={takeModal}
        onClose={() => setTakeModal(false)}
        students={students}
        onSubmit={handleTakeAttendance}
      />
    </div>
  );
};

export default Attendance;

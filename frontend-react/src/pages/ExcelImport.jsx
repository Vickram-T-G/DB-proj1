import { useState } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Calendar,
} from "lucide-react";
import api from "../utils/api";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const ExcelImport = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"
      ) {
        setFile(selectedFile);
      } else {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        e.target.value = null;
      }
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const response = await api.get("/import/template", {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "attendance_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download template");
      console.error("Download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/import/excel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Ensure results has the expected structure
      const results = response.data.results || {
        users: { created: 0, errors: [] },
        courses: { created: 0, errors: [] },
        courseAttendance: { updated: 0, errors: [] },
      };

      setResults(results);
      toast.success("Import completed successfully!");
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById("file-input");
      if (fileInput) fileInput.value = null;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to upload file");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="p-3 text-2xl font-bold text-text-primary">
            Excel Import
          </h1>
          <p className="text-text-secondary">
            Import users and attendance data from Excel files
          </p>
        </div>
      </div>

      {/* Template Download */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 p-2" />
            Download Template
          </h3>
        </div>
        <div className="card-content">
          <p className="text-text-secondary mb-4">
            Download the Excel template to see the required format for importing
            users and attendance data.
          </p>
          <button
            onClick={handleDownloadTemplate}
            disabled={downloading}
            className="btn btn-primary p-4"
          >
            {downloading ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? "Downloading..." : "Download Template"}
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Excel File
          </h3>
        </div>
        <div className="card-content">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Excel File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="input text-text-primary"
                required
              />
              <p className="text-xs text-text-secondary mt-1">
                Supported formats: .xlsx, .xls (Max 5MB)
              </p>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="btn btn-primary w-full"
            >
              {uploading ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Upload className="p-3 h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload and Import"}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Import Results</h3>
              <button
                onClick={() => setResults(null)}
                className="btn btn-secondary btn-sm"
              >
                Clear Results
              </button>
            </div>
          </div>
          <div className="card-content space-y-4">
            {/* Users Results */}
            {results.users && (
              <div>
                <h4 className="font-semibold text-text-primary flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Users Import
                </h4>
                <div className="bg-surface-secondary rounded-lg p-3">
                  <p className="text-text-primary">
                    Created:{" "}
                    <span className="font-semibold text-accent">
                      {results.users.created || 0}
                    </span>{" "}
                    users
                  </p>
                  {results.users.errors && results.users.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary mb-1">
                        Warnings (some rows could not be processed):
                      </p>
                      <ul className="text-sm text-accent-error space-y-1">
                        {results.users.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Courses Results */}
            {results.courses && (
              <div>
                <h4 className="font-semibold text-text-primary flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Courses Import
                </h4>
                <div className="bg-surface-secondary rounded-lg p-3">
                  <p className="text-text-primary">
                    Created:{" "}
                    <span className="font-semibold text-accent">
                      {results.courses.created || 0}
                    </span>{" "}
                    courses
                  </p>
                  {results.courses.errors &&
                    results.courses.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-text-secondary mb-1">
                          Warnings (some courses could not be created):
                        </p>
                        <ul className="text-sm text-accent-error space-y-1">
                          {results.courses.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Course Attendance Results */}
            {results.courseAttendance && (
              <div>
                <h4 className="font-semibold text-text-primary flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Course Attendance Import
                </h4>
                <div className="bg-surface-secondary rounded-lg p-3">
                  <p className="text-text-primary">
                    Updated:{" "}
                    <span className="font-semibold text-accent">
                      {results.courseAttendance.updated || 0}
                    </span>{" "}
                    attendance records
                  </p>
                  {results.courseAttendance.errors &&
                    results.courseAttendance.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-text-secondary mb-1">
                          Warnings (some courses/students not found):
                        </p>
                        <ul className="text-sm text-accent-error space-y-1">
                          {results.courseAttendance.errors.map(
                            (error, index) => (
                              <li key={index}>• {error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-4">
              <h5 className="font-semibold text-green-400 mb-2">
                Import Summary
              </h5>
              <p className="text-sm text-green-300">
                ✅ Import completed successfully! The system processed your file
                and imported all valid data. Any warnings above indicate rows
                that couldn't be processed (usually because the referenced
                students or courses don't exist yet).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Instructions</h3>
        </div>
        <div className="card-content space-y-4">
          {/* Import Order */}
          <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">
              ⚠️ Important: Import Order
            </h4>
            <div className="text-sm text-blue-200 space-y-1">
              <p>
                <strong>Step 1:</strong> Import Users (creates students and
                teachers)
              </p>
              <p>
                <strong>Step 2:</strong> Import Courses (creates courses and
                enrolls all students)
              </p>
              <p>
                <strong>Step 3:</strong> Import course-specific attendance data
              </p>
              <p className="text-xs mt-2">
                Note: All students will be automatically enrolled in imported
                courses.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-2">
              Excel File Format:
            </h4>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>
                <strong>Sheet 1 - "Users":</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <code>name</code> - Full name (required)
                </li>
                <li>
                  <code>email</code> - Email address (required for
                  teachers/admins, optional for students)
                </li>
                <li>
                  <code>password</code> - Password (required, min 6 chars)
                </li>
                <li>
                  <code>role</code> - "student" or "teacher" (required)
                </li>
                <li>
                  <code>rollNo</code> - Roll number (required for students)
                </li>
                <li>
                  <code>absentDays</code> - Number of absent days (optional,
                  default 0)
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-2">
              Courses Sheet:
            </h4>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>
                <strong>Sheet 2 - "Courses":</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <code>code</code> - Course code (required)
                </li>
                <li>
                  <code>name</code> - Course name (required)
                </li>
                <li>
                  <code>description</code> - Course description (optional)
                </li>
                <li>
                  <code>academicYear</code> - Academic year (optional, default:
                  2024-2025)
                </li>
                <li>
                  <code>semester</code> - Semester (optional, default: Fall)
                </li>
                <li>
                  <code>totalClasses</code> - Initial total classes (optional,
                  default: 0)
                </li>
              </ul>
              <p className="text-xs text-text-muted mt-2">
                Note: All active students will be automatically enrolled in
                imported courses.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-2">
              Course Attendance Sheet:
            </h4>
            <div className="space-y-2 text-sm text-text-secondary">
              <p>
                <strong>Sheet 3 - "CourseAttendance":</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <code>courseCode</code> - Course code (required)
                </li>
                <li>
                  <code>rollNo</code> - Roll number of student (required)
                </li>
                <li>
                  <code>absentDays</code> - Total number of absent days for this
                  student in this course (required)
                </li>
              </ul>
              <p className="text-xs text-text-muted mt-2">
                Note: CourseAttendance sheet updates students' course-specific
                attendance data.
              </p>
            </div>
          </div>

          {/* How Attendance Works */}
          <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded-lg p-4">
            <h4 className="font-semibold text-green-300 mb-2">
              📊 How Attendance Works
            </h4>
            <div className="text-sm text-green-200 space-y-2">
              <p>
                <strong>Course-Specific System:</strong> Attendance is always
                tracked per course
              </p>
              <p>
                <strong>Total Classes:</strong> Automatically incremented when
                attendance is marked for a course
              </p>
              <p>
                <strong>Attendance Percentage:</strong> Calculated using course
                total classes as denominator
              </p>
              <p>
                <strong>Sheet 3 "CourseAttendance":</strong> Updates
                course-specific attendance data for students
              </p>
              <p className="text-xs mt-2">
                Note: The system automatically manages total classes and
                attendance percentages per course.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelImport;

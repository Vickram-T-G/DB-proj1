import React, { useEffect, useState } from "react";
import api from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";

const Analytics = () => {
  const [stats, setStats] = useState({ users: 0, courses: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersRes = await api.get("/users?limit=1");
        const coursesRes = await api.get("/courses");
        setStats({
          users: usersRes.data.pagination?.total || usersRes.data.length || 0,
          courses: Array.isArray(coursesRes.data) ? coursesRes.data.length : 0,
        });
      } catch (err) {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner className="h-64" />;
  if (error)
    return (
      <div className="max-w-2xl mx-auto card p-8 mt-8 text-accent-error">
        {error}
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto card p-8 mt-8">
      <h1 className="text-2xl font-bold mb-4">System Analytics</h1>
      <div className="space-y-4">
        <div className="card p-4">
          Total Users: <span className="font-bold">{stats.users}</span>
        </div>
        <div className="card p-4">
          Total Courses: <span className="font-bold">{stats.courses}</span>
        </div>
        <div className="card p-4">
          Attendance Rate: <span className="font-bold">N/A</span>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

// src/pages/admin/AdminHomePage.tsx
import { useEffect, useState } from "react";
import api from "../../utils/api";

type DashboardCounts = {
  totalStudents: number;
  totalTeachers: number;
  totalSupportUsers: number;
  totalCourses: number;
};

export default function AdminHomePage() {
  const [counts, setCounts] = useState<DashboardCounts>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSupportUsers: 0,
    totalCourses: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const [stuRes, teaRes, supRes, courseRes] = await Promise.all([
          api.get("/admin/students"),
          api.get("/admin/teachers"),
          api.get("/admin/support/users"),
          api.get("/admin/courses"),
        ]);

        setCounts({
          totalStudents: Array.isArray(stuRes.data) ? stuRes.data.length : 0,
          totalTeachers: Array.isArray(teaRes.data) ? teaRes.data.length : 0,
          totalSupportUsers: Array.isArray(supRes.data)
            ? supRes.data.length
            : 0,
          totalCourses: Array.isArray(courseRes.data)
            ? courseRes.data.length
            : 0,
        });
      } catch (err: any) {
        console.error("❌ Lỗi load dashboard:", err);
        setError("Không tải được dữ liệu tổng quan");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan học viên, giáo viên, CSKH và khóa học.
          </p>
        </div>
      </div>

      {loading && (
        <div className="mb-4 rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2">
          Đang tải dữ liệu...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Tổng học viên
          </span>
          <span className="text-2xl font-bold text-slate-800">
            {counts.totalStudents}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Tổng giáo viên
          </span>
          <span className="text-2xl font-bold text-slate-800">
            {counts.totalTeachers}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Tổng CSKH
          </span>
          <span className="text-2xl font-bold text-slate-800">
            {counts.totalSupportUsers}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Tổng khóa học
          </span>
          <span className="text-2xl font-bold text-slate-800">
            {counts.totalCourses}
          </span>
        </div>
      </div>
    </div>
  );
}

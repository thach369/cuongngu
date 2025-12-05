// src/pages/admin/AdminSupportDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../utils/api";

type StudentOfSupport = {
  id: number;
  studentId: number;
  fullName: string | null;
  phone: string | null;
  status: string | null;
  remainingSessions: number | null;
  totalSessions: number | null;
  careRecordCount: number;
  lastCareTime: string | null;
};

type CareHistoryItem = {
  id: number;
  studentId: number | null;
  studentName: string | null;
  supportUserId: number | null;
  supportFullName: string | null;
  careTime: string | null;
  careType: string | null;
  channel: string | null;
  content: string | null;
  result: string | null;
  important: boolean | null;
  nextCareTime: string | null;
};

export default function AdminSupportDetailPage() {
  const { supportUserId } = useParams();
  const [students, setStudents] = useState<StudentOfSupport[]>([]);
  const [careHistory, setCareHistory] = useState<CareHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString("vi-VN");
    } catch {
      return value;
    }
  };

  useEffect(() => {
    if (!supportUserId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ 1) Danh sách học viên của support
        const stuRes = await api.get<StudentOfSupport[]>(
          `/admin/support/${supportUserId}/students`
        );

        // ✅ 2) Lịch sử CSKH của support
        const historyRes = await api.get<CareHistoryItem[]>(
          `/admin/support/${supportUserId}/care-history`
        );

        setStudents(stuRes.data || []);
        setCareHistory(historyRes.data || []);
      } catch (err: any) {
        console.error("❌ Lỗi load chi tiết support:", err);

        if (err.response && err.response.status === 403) {
          setError("Không có quyền truy cập dữ liệu này (403).");
        } else {
          setError("Không tải được dữ liệu chi tiết CSKH");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supportUserId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Chi tiết nhân viên CSKH
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem danh sách học viên & lịch sử CSKH của nhân viên này.
          </p>
        </div>

        <Link
          to="/admin/support-users"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại danh sách CSKH
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
      )}

      {/* Bảng học viên phụ trách */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Học viên đang phụ trách ({students.length})
        </h2>

        {students.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có học viên nào được gán cho CSKH này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border px-2 py-1 text-left">ID</th>
                  <th className="border px-2 py-1 text-left">Tên học viên</th>
                  <th className="border px-2 py-1 text-left">SĐT</th>
                  <th className="border px-2 py-1 text-left">Trạng thái</th>
                  <th className="border px-2 py-1 text-left">
                    Số buổi / còn lại
                  </th>
                  <th className="border px-2 py-1 text-left">Số log CSKH</th>
                  <th className="border px-2 py-1 text-left">
                    Lần CSKH gần nhất
                  </th>
                  <th className="border px-2 py-1 text-left">Xem log</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => (
                  <tr key={s.id ?? idx} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">{s.id}</td>
                    <td className="border px-2 py-1">{s.fullName || "-"}</td>
                    <td className="border px-2 py-1">{s.phone || "-"}</td>
                    <td className="border px-2 py-1">{s.status || "-"}</td>
                    <td className="border px-2 py-1">
                      {s.totalSessions ?? "-"} / {s.remainingSessions ?? "-"}
                    </td>
                    <td className="border px-2 py-1">{s.careRecordCount}</td>
                    <td className="border px-2 py-1">
                      {formatDateTime(s.lastCareTime)}
                    </td>
                    <td className="border px-2 py-1">
                      {s.id && (
                        <Link
                          to={`/admin/students/${s.id}/care-history`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Xem chi tiết
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bảng lịch sử CSKH của support */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Lịch sử CSKH ({careHistory.length})
        </h2>

        {careHistory.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có log CSKH nào cho nhân viên này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border px-2 py-1 text-left">Thời gian</th>
                  <th className="border px-2 py-1 text-left">Học viên</th>
                  <th className="border px-2 py-1 text-left">Loại</th>
                  <th className="border px-2 py-1 text-left">Kênh</th>
                  <th className="border px-2 py-1 text-left">Nội dung</th>
                  <th className="border px-2 py-1 text-left">Kết quả</th>
                  <th className="border px-2 py-1 text-left">Quan trọng</th>
                  <th className="border px-2 py-1 text-left">
                    Lịch CSKH tiếp theo
                  </th>
                </tr>
              </thead>
              <tbody>
                {careHistory.map((h, idx) => (
                  <tr key={h.id ?? idx} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">
                      {formatDateTime(h.careTime)}
                    </td>
                    <td className="border px-2 py-1">{h.studentName || "-"}</td>
                    <td className="border px-2 py-1">{h.careType || "-"}</td>
                    <td className="border px-2 py-1">{h.channel || "-"}</td>
                    <td className="border px-2 py-1 max-w-xs truncate">
                      {h.content || "-"}
                    </td>
                    <td className="border px-2 py-1 max-w-xs truncate">
                      {h.result || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {h.important ? "✅" : ""}
                    </td>
                    <td className="border px-2 py-1">
                      {formatDateTime(h.nextCareTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

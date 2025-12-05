import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../utils/api";

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

export default function AdminStudentCareHistoryPage() {
  const { studentId } = useParams();
  const [items, setItems] = useState<CareHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CareHistoryItem[]>(
        `/admin/support/care-history/student/${studentId}`
      );
      setItems(res.data || []);
    } catch (err: any) {
      console.error("❌ Lỗi load lịch sử CSKH:", err);
      setError("Không tải được lịch sử CSKH của học viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [studentId]);

  const studentName =
    items.length > 0 ? items[0].studentName || `#${studentId}` : `#${studentId}`;

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Lịch sử CSKH học viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Học viên: <span className="font-medium">{studentName}</span>
          </p>
        </div>

        <Link
          to="/admin/students"
          className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
        >
          ← Quay lại danh sách học viên
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Lịch sử chăm sóc ({items.length})
        </h2>

        {loading ? (
          <div className="text-sm text-slate-500">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có log CSKH nào cho học viên này.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((h) => (
              <div
                key={h.id}
                className={
                  "border rounded-xl px-4 py-3 text-sm bg-slate-50" +
                  (h.important ? " border-amber-400" : " border-slate-200")
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="font-medium text-slate-800">
                    {formatDateTime(h.careTime)}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {h.careType && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {h.careType}
                      </span>
                    )}
                    {h.channel && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {h.channel}
                      </span>
                    )}
                    {h.important && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Quan trọng
                      </span>
                    )}
                  </div>
                </div>

                {h.supportFullName && (
                  <div className="text-xs text-slate-500 mb-1">
                    CSKH: {h.supportFullName}
                  </div>
                )}

                {h.content && (
                  <div className="text-slate-800 mb-1 whitespace-pre-line">
                    {h.content}
                  </div>
                )}

                {h.result && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold">Kết quả:</span> {h.result}
                  </div>
                )}

                {h.nextCareTime && (
                  <div className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold">Lịch CSKH tiếp theo:</span>{" "}
                    {formatDateTime(h.nextCareTime)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

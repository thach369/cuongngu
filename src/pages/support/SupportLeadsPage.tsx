// src/pages/support/SupportLeadsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SupportSidebar from "../../components/support/SupportSidebar";
import api from "../../utils/api";

type LeadSummary = {
  id: number;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;

  studentName: string | null;
  studentAge: number | null;

  instrument: string | null;
  lessonType: string | null;
  level: string | null;
  preferredSchedule: string | null;

  source: string | null;
  status: string | null;

  createdAt: string | null;
  lastCareTime: string | null;
  nextCareTime: string | null;
};

export default function SupportLeadsPage() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      // BE: GET /support/leads => SupportLeadController.getMyLeads()
      const res = await api.get<LeadSummary[]>("/support/leads");
      setLeads(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load leads cho CSKH:", err);
      setError("Không tải được danh sách khách hàng tiềm năng của bạn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString(
        "vi-VN",
        { hour: "2-digit", minute: "2-digit" }
      )}`;
    } catch {
      return iso || "";
    }
  };

  const renderStatusBadge = (status?: string | null) => {
    const s = (status || "").toUpperCase();
    let cls = "bg-slate-100 text-slate-700";
    let label = status || "Chưa rõ";

    if (s === "NEW") {
      cls = "bg-sky-100 text-sky-700";
      label = "Mới";
    } else if (s === "CONTACTED") {
      cls = "bg-emerald-100 text-emerald-700";
      label = "Đã liên hệ";
    } else if (s === "TRIAL_BOOKED") {
      cls = "bg-amber-100 text-amber-700";
      label = "Đã hẹn học thử";
    } else if (s === "TRIAL_DONE") {
      cls = "bg-indigo-100 text-indigo-700";
      label = "Đã học thử";
    } else if (s === "ENROLLED") {
      cls = "bg-emerald-200 text-emerald-800";
      label = "Đã đăng ký";
    } else if (s === "LOST") {
      cls = "bg-rose-100 text-rose-700";
      label = "Mất";
    }

    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${cls}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <SupportSidebar />

      <main className="flex-1 p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Khách hàng tiềm năng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Danh sách khách hàng tiềm năng mà bạn được phân công phụ trách.
              Bạn có thể xem nhanh thông tin và mở timeline CSKH.
            </p>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2">
            Đang tải danh sách khách hàng...
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border px-2 py-2 text-left">Khách hàng</th>
                <th className="border px-2 py-2 text-left">Bé / Nhu cầu</th>
                <th className="border px-2 py-2 text-left">
                  Nguồn / Thời gian
                </th>
                <th className="border px-2 py-2 text-center">Trạng thái</th>
                <th className="border px-2 py-2 text-left">CSKH</th>
                <th className="border px-2 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border px-3 py-4 text-center text-slate-500"
                  >
                    Hiện chưa có khách hàng tiềm năng nào được gán cho bạn.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Khách hàng */}
                    <td className="border px-2 py-2 align-top">
                      <div className="font-medium text-slate-800">
                        {l.parentName || "(Chưa có tên phụ huynh)"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {l.parentPhone}
                      </div>
                      {l.parentEmail && (
                        <div className="text-[11px] text-slate-500">
                          {l.parentEmail}
                        </div>
                      )}
                    </td>

                    {/* Bé / nhu cầu */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">
                        {l.studentName || "(Chưa có tên bé)"}
                        {l.studentAge != null && ` • ${l.studentAge} tuổi`}
                      </div>
                      {l.instrument && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Nhạc cụ: {l.instrument}
                        </div>
                      )}
                      {l.lessonType && (
                        <div className="text-[11px] text-slate-500">
                          Hình thức: {l.lessonType}
                        </div>
                      )}
                      {l.preferredSchedule && (
                        <div className="text-[11px] text-slate-500">
                          Thời gian mong muốn: {l.preferredSchedule}
                        </div>
                      )}
                    </td>

                    {/* Nguồn / thời gian */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">{l.source || "-"}</div>
                      {l.createdAt && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tạo: {formatDateTime(l.createdAt)}
                        </div>
                      )}
                      {l.lastCareTime && (
                        <div className="text-[11px] text-slate-500">
                          CSKH gần nhất: {formatDateTime(l.lastCareTime)}
                        </div>
                      )}
                      {l.nextCareTime && (
                        <div className="text-[11px] text-emerald-700">
                          CSKH tiếp theo: {formatDateTime(l.nextCareTime)}
                        </div>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="border px-2 py-2 align-top text-center">
                      {renderStatusBadge(l.status)}
                    </td>

                    {/* CSKH (ở đây chính là tài khoản hiện tại, nên chỉ hiển thị text) */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">Bạn phụ trách</div>
                    </td>

                    {/* Thao tác */}
                    <td className="border px-2 py-2 align-top text-center">
                      <button
                        onClick={() =>
                          navigate(`/support/leads/${l.id}/history`)
                        }
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px]"
                      >
                        Lịch sử CSKH
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

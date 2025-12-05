// src/pages/support/SupportStudentsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SupportSidebar from "../../components/support/SupportSidebar";
import api from "../../utils/api";

type StudentCareSummary = {
  id: number;
  fullName: string | null;

  instrument: string | null;
  parentName: string | null;
  parentPhone: string | null;

  lessonType: string | null;
  scheduleText: string | null;

  status: string | null;
  totalSessions: number | null;
  completedSessions: number | null;
  remainingSessions: number | null;

  mainTeacherName: string | null;

  // ==== HỌC PHÍ / NHẮC HỌC PHÍ (optional – BE có thì FE xài) ====
  tuitionAmount: number | null;
  tuitionPaidDate: string | null;
  tuitionDueDate: string | null;
  tuitionStatus: string | null;           // NOT_PAID / PAID / OVERDUE...
  tuitionReminderStatus: string | null;   // NO_PACKAGE / PAID / DUE_SOON / OVERDUE...
  daysToDue: number | null;              // >0: còn bao nhiêu ngày, 0: hôm nay, <0: trễ
};

export default function SupportStudentsPage() {
  const [students, setStudents] = useState<StudentCareSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<StudentCareSummary[]>("/support/my-students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load học viên support:", err);
      setError("Không tải được danh sách học viên của bạn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const renderStatusBadge = (status?: string | null) => {
    const s = (status || "").toUpperCase();
    let cls = "bg-slate-100 text-slate-700";
    let label = status || "Không rõ";

    if (s === "LEARNING" || s === "ACTIVE") {
      cls = "bg-emerald-100 text-emerald-700";
      label = "Đang học";
    } else if (s === "STOPPED" || s === "PAUSED") {
      cls = "bg-rose-100 text-rose-700";
      label = s === "STOPPED" ? "Dừng" : "Tạm dừng";
    }

    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${cls}`}>
        {label}
      </span>
    );
  };

  const renderTuitionCell = (s: StudentCareSummary) => {
    const status = (s.tuitionReminderStatus || "").toUpperCase();
    const days = s.daysToDue ?? null;
    const amount =
      s.tuitionAmount != null
        ? `${s.tuitionAmount.toLocaleString("vi-VN")} đ`
        : null;

    let badgeText = "Đang cập nhật";
    let badgeCls = "bg-slate-100 text-slate-700";

    if (!status || status === "UNKNOWN") {
      badgeText = "Đang cập nhật";
    } else if (status === "NO_PACKAGE") {
      badgeText = "Chưa có gói học";
      badgeCls = "bg-slate-100 text-slate-700";
    } else if (status === "NO_TUITION") {
      badgeText = "Chưa cấu hình học phí";
      badgeCls = "bg-slate-100 text-slate-700";
    } else if (status === "PAID") {
      badgeText = "Đã đóng";
      badgeCls = "bg-emerald-100 text-emerald-700";
    } else if (status === "DUE_SOON" || status === "NOT_PAID") {
      badgeText = "Sắp tới hạn";
      badgeCls = "bg-amber-100 text-amber-700";
    } else if (status === "OVERDUE") {
      badgeText = "Quá hạn";
      badgeCls = "bg-rose-100 text-rose-700";
    }

    // text phụ: “Còn 3 ngày”, “Trễ 2 ngày”, …
    let subText = "";
    if (days != null) {
      if (days > 0) subText = `Còn ${days} ngày`;
      else if (days === 0) subText = "Hôm nay là hạn";
      else subText = `Trễ ${Math.abs(days)} ngày`;
    }

    return (
      <div className="text-xs text-left">
        <div className="flex flex-wrap items-center gap-1">
          <span className={`inline-flex px-2 py-0.5 rounded-full ${badgeCls}`}>
            {badgeText}
          </span>
          {amount && (
            <span className="text-[11px] text-slate-600">· {amount}</span>
          )}
        </div>
        {s.tuitionDueDate && (
          <div className="text-[11px] text-slate-500 mt-0.5">
            Hạn: {s.tuitionDueDate}
          </div>
        )}
        {subText && (
          <div className="text-[11px] text-slate-500">{subText}</div>
        )}
      </div>
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
              Học viên của tôi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Danh sách học viên do bạn phụ trách CSKH. Xem nhanh tình trạng buổi học
              và hạn đóng học phí để chủ động liên hệ.
            </p>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2">
            Đang tải danh sách học viên...
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
                <th className="border px-2 py-2 text-left">Học viên</th>
                <th className="border px-2 py-2 text-left">Phụ huynh</th>
                <th className="border px-2 py-2 text-left">Lớp / Lịch</th>
                <th className="border px-2 py-2 text-center">Buổi</th>
                <th className="border px-2 py-2 text-left">Học phí</th>
                <th className="border px-2 py-2 text-center">Trạng thái</th>
                <th className="border px-2 py-2 text-left">GV chính</th>
                <th className="border px-2 py-2 text-center">CSKH</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border px-3 py-4 text-center text-slate-500"
                  >
                    Chưa có học viên nào được gán cho bạn.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Học viên */}
                    <td className="border px-2 py-2 align-top">
                      <div className="font-medium text-slate-800">
                        {s.fullName || "(Chưa có tên)"}
                      </div>
                      {s.instrument && (
                        <div className="text-[11px] text-slate-500">
                          {s.instrument}
                        </div>
                      )}
                    </td>

                    {/* Phụ huynh */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">{s.parentName}</div>
                      <div className="text-slate-600">{s.parentPhone}</div>
                    </td>

                    {/* Lớp / lịch */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">{s.lessonType}</div>
                      {s.scheduleText && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          {s.scheduleText}
                        </div>
                      )}
                    </td>

                    {/* Buổi */}
                    <td className="border px-2 py-2 align-top text-center text-xs">
                      <div className="text-slate-800">
                        {s.totalSessions ?? "-"} buổi
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Đã học: {s.completedSessions ?? 0}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Còn lại: {s.remainingSessions ?? "-"}
                      </div>
                    </td>

                    {/* Học phí */}
                    <td className="border px-2 py-2 align-top">
                      {renderTuitionCell(s)}
                    </td>

                    {/* Trạng thái */}
                    <td className="border px-2 py-2 align-top text-center">
                      {renderStatusBadge(s.status)}
                    </td>

                    {/* GV chính */}
                    <td className="border px-2 py-2 align-top text-xs">
                      {s.mainTeacherName || "-"}
                    </td>

                    {/* Actions */}
                    <td className="border px-2 py-2 align-top text-center">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            navigate(`/support/students/${s.id}/history`)
                          }
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px]"
                        >
                          Lịch sử CSKH
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/support/students/${s.id}/chat`)
                          }
                          className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-[11px] text-white"
                        >
                          Chat
                        </button>
                      </div>
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

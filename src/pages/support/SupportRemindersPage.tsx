import { useEffect, useState } from "react";
import SupportSidebar from "../../components/support/SupportSidebar";
import api from "../../utils/api";

type CareReminder = {
  historyId: number;
  studentId: number;
  studentName: string;
  careType: string;
  channel: string;
  content: string;
  important: boolean;
  nextCareTime: string | null;
};

export default function SupportRemindersPage() {
  const [today, setToday] = useState<CareReminder[]>([]);
  const [upcoming, setUpcoming] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const [todayRes, upcomingRes] = await Promise.all([
        api.get<CareReminder[]>("/support/reminders/today"),
        api.get<CareReminder[]>("/support/reminders/upcoming", {
          params: { days: 7 },
        }),
      ]);

      setToday(todayRes.data || []);
      setUpcoming(upcomingRes.data || []);
    } catch (err) {
      console.error("❌ Lỗi load nhắc việc:", err);
      setError("Không tải được danh sách nhắc việc.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const formatTime = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString("vi-VN");
      const time = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${date} • ${time}`;
    } catch {
      return iso;
    }
  };

  const renderList = (list: CareReminder[]) => {
    if (!list.length) {
      return (
        <div className="text-sm text-slate-500">
          Không có nhắc việc nào trong khoảng này.
        </div>
      );
    }

    return (
      <ul className="space-y-2 text-sm">
        {list.map((r) => (
          <li
            key={r.historyId}
            className="border border-slate-200 rounded-xl px-3 py-2 flex gap-3 bg-white"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-slate-800">
                  {r.studentName}
                </div>
                {r.important && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-100 text-rose-700">
                    Quan trọng
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {r.careType} • {r.channel}
              </div>
              {r.content && (
                <div className="text-xs text-slate-700 mt-1 line-clamp-2">
                  {r.content}
                </div>
              )}
            </div>
            <div className="text-xs text-right text-slate-500 min-w-[120px]">
              {formatTime(r.nextCareTime)}
            </div>
          </li>
        ))}
      </ul>
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
              Nhắc việc CSKH
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Các việc cần làm hôm nay và trong 7 ngày tới.
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2">
            Đang tải nhắc việc...
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hôm nay */}
          <section className="bg-slate-50 rounded-2xl border border-slate-100 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>📌</span>
              <span>Hôm nay</span>
            </h2>
            <div className="mt-3">{renderList(today)}</div>
          </section>

          {/* 7 ngày tới */}
          <section className="bg-slate-50 rounded-2xl border border-slate-100 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>📆</span>
              <span>7 ngày tới</span>
            </h2>
            <div className="mt-3">{renderList(upcoming)}</div>
          </section>
        </div>
      </main>
    </div>
  );
}

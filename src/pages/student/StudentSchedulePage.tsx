// src/pages/student/StudentSchedulePage.tsx
import { useEffect, useState } from "react";
import api from "../../utils/api";

type TeachingAssignment = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  teacherName: string | null;
  status: string | null;
};

const DOW_LABEL: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

export default function StudentSchedulePage() {
  const [items, setItems] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get<TeachingAssignment[]>("/student/schedule");
        setItems(res.data || []);
      } catch (err) {
        console.error("❌ Lỗi load lịch học student:", err);
        setError("Không tải được lịch học. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Lịch học trong tuần</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lịch học được đồng bộ theo phân công từ hệ thống.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-slate-600">Đang tải lịch học...</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-slate-500">
          Hiện chưa có lịch học nào được phân công cho bạn.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((slot) => (
              <div
                key={slot.id}
                className="border border-slate-100 rounded-lg p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">
                    {DOW_LABEL[slot.dayOfWeek] || `Thứ ${slot.dayOfWeek}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    {slot.startTime?.substring(0, 5)} –{" "}
                    {slot.endTime?.substring(0, 5)}
                  </div>
                </div>
                <div className="text-xs text-slate-600">
                  Giáo viên:{" "}
                  <span className="font-medium">
                    {slot.teacherName || "Đang cập nhật"}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Phòng học:{" "}
                  <span className="font-medium">
                    {slot.room || "Sẽ thông báo sau"}
                  </span>
                </div>
                {slot.status && (
                  <div className="mt-1">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700">
                      {slot.status}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

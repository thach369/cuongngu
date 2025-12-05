import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SupportSidebar from "../../components/support/SupportSidebar";
import api from "../../utils/api";

type CareHistory = {
  id: number;
  studentId: number;
  studentName: string;
  supportUserId: number;
  supportFullName: string;
  careTime: string | null;
  careType: string | null;
  channel: string | null;
  content: string | null;
  result: string | null;
  important: boolean;
  nextCareTime: string | null;
};

type CareForm = {
  careType: string;
  channel: string;
  content: string;
  result: string;
  important: boolean;
  nextCareDate: string;
  nextCareTime: string;
};

const emptyForm: CareForm = {
  careType: "",
  channel: "",
  content: "",
  result: "",
  important: false,
  nextCareDate: "",
  nextCareTime: "",
};

export default function StudentCareHistoryPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState<CareHistory[]>([]);
  const [studentName, setStudentName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CareForm>(emptyForm);

  const loadHistory = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<CareHistory[]>(
        `/support/care-history/student/${studentId}`
      );
      const list = res.data || [];
      setHistory(list);
      if (list.length > 0) {
        setStudentName(list[0].studentName || "");
      }
    } catch (err) {
      console.error("❌ Lỗi load lịch sử CSKH:", err);
      setError("Không tải được lịch sử CSKH.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [studentId]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    if (!form.careType || !form.channel || !form.content) {
      alert("Vui lòng nhập loại CSKH, kênh và nội dung.");
      return;
    }

    let nextCareTime: string | undefined = undefined;
    if (form.nextCareDate) {
      const time = form.nextCareTime || "09:00";
      nextCareTime = `${form.nextCareDate}T${time}:00`;
    }

    const body = {
      studentId: Number(studentId),
      careType: form.careType,
      channel: form.channel,
      content: form.content,
      result: form.result || undefined,
      important: form.important,
      nextCareTime,
    };

    try {
      setSaving(true);
      await api.post("/support/care-history", body);
      setForm(emptyForm);
      await loadHistory();
    } catch (err) {
      console.error("❌ Lỗi tạo log CSKH:", err);
      alert("Tạo log CSKH thất bại. Kiểm tra lại dữ liệu hoặc log BE.");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString(
        "vi-VN",
        { hour: "2-digit", minute: "2-digit" }
      )}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <SupportSidebar />

      <main className="flex-1 p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <button
              onClick={() => navigate("/support")}
              className="text-xs text-slate-500 hover:text-slate-700 mb-1"
            >
              ← Quay lại danh sách học viên
            </button>
            <h1 className="text-2xl font-semibold text-slate-800">
              Lịch sử CSKH
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Học viên:{" "}
              <span className="font-medium text-slate-800">
                {studentName || `#${studentId}`}
              </span>
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2">
            Đang tải lịch sử CSKH...
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-4">
          {/* Timeline */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Timeline CSKH
            </h2>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Chưa có log CSKH nào cho học viên này.
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="relative pl-6 pb-3 border-l border-slate-200 last:pb-0"
                  >
                    <div className="absolute -left-[6px] top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow" />
                    <div className="flex justify-between gap-2">
                      <div className="text-xs text-slate-500">
                        {formatDateTime(h.careTime)}
                      </div>
                      {h.important && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700">
                          Quan trọng
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {h.careType} • {h.channel} • {h.supportFullName}
                    </div>
                    <div className="mt-1 text-sm text-slate-800 whitespace-pre-line">
                      {h.content}
                    </div>
                    {h.result && (
                      <div className="mt-1 text-xs text-emerald-700">
                        Kết quả: {h.result}
                      </div>
                    )}
                    {h.nextCareTime && (
                      <div className="mt-1 text-xs text-slate-500">
                        Lần CSKH tiếp: {formatDateTime(h.nextCareTime)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Form tạo log */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              Thêm log CSKH
            </h2>

            <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Loại CSKH
                  </label>
                  <input
                    type="text"
                    name="careType"
                    value={form.careType}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="VD: Gọi điện, Nhắn tin, Họp phụ huynh..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Kênh
                  </label>
                  <input
                    type="text"
                    name="channel"
                    value={form.channel}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Zalo / Facebook / Phone..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nội dung trao đổi
                </label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ghi rõ những gì đã trao đổi với phụ huynh/học viên..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Kết quả
                </label>
                <textarea
                  name="result"
                  value={form.result}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="VD: phụ huynh đồng ý đóng thêm 8 buổi, tạm hoãn 2 tuần..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="important"
                  type="checkbox"
                  name="important"
                  checked={form.important}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="important"
                  className="text-xs text-slate-700 select-none"
                >
                  Đánh dấu log này là quan trọng
                </label>
              </div>

              <div className="border-t pt-3 mt-2">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Lên lịch CSKH tiếp theo (nếu có)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Ngày
                    </label>
                    <input
                      type="date"
                      name="nextCareDate"
                      value={form.nextCareDate}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Giờ
                    </label>
                    <input
                      type="time"
                      name="nextCareTime"
                      value={form.nextCareTime}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nếu không chọn ngày, hệ thống sẽ không tạo nhắc việc cho lần
                  CSKH tiếp theo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/support")}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu log CSKH"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

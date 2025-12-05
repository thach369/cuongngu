import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";

type LeadCareHistoryItem = {
  id: number;
  leadId: number;
  leadName: string;
  supportUserId: number | null;
  supportFullName: string | null;
  careTime: string | null;
  careType: string | null;
  channel: string | null;
  content: string | null;
  result: string | null;
  important: boolean;
  nextCareTime: string | null;
};

export default function AdminLeadCareHistoryPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<LeadCareHistoryItem[]>([]);
  const [leadName, setLeadName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<LeadCareHistoryItem[]>(
        `/admin/leads/${leadId}/care-history`
      );
      const list = res.data || [];
      setItems(list);
      if (list.length > 0) {
        setLeadName(list[0].leadName || "");
      }
    } catch (err) {
      console.error("❌ Lỗi load lịch sử CSKH lead (admin):", err);
      setError("Không tải được lịch sử CSKH của khách hàng tiềm năng này.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [leadId]);

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

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="page-header-row">
        <div className="page-header-left">
          <button
            onClick={() => navigate("/admin/leads")}
            className="text-xs text-slate-500 hover:text-slate-700 mb-1"
          >
            ← Quay lại danh sách khách hàng tiềm năng
          </button>
          <h1 className="page-title">Lịch sử CSKH khách hàng tiềm năng</h1>
          <p className="page-subtitle">
            Xem toàn bộ log CSKH (gọi điện / nhắn tin / hẹn lịch...) mà nhân
            viên CSKH đã tạo cho khách hàng này.
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Khách hàng:{" "}
            <span className="font-semibold text-slate-800">
              {leadName || `Lead #${leadId}`}
            </span>
          </p>
        </div>
      </div>

      {/* LOADING / ERROR */}
      {loading && (
        <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2 mb-3">
          Đang tải lịch sử CSKH...
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 mb-3">
          {error}
        </div>
      )}

      {/* TIMELINE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">
          Timeline CSKH
        </h2>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có log CSKH nào cho khách hàng này.
            </div>
          ) : (
            items.map((h) => (
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
                  {h.supportFullName || "(Không rõ CSKH)"}
                  {h.channel && ` • ${h.channel}`}
                  {h.careType && ` • ${h.careType}`}
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
      </div>
    </div>
  );
}

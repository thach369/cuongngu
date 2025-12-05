import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SupportSidebar from "../../components/support/SupportSidebar";
import api from "../../utils/api";

type ChatMessage = {
  id: number;
  studentId: number;
  senderId: number;
  senderName: string;
  senderRole: string; // "SUPPORT" | "STUDENT"
  receiverId: number;
  receiverName: string;
  content: string;
  sentAt: string | null;
  mine: boolean;
  read: boolean;
};

export default function StudentChatPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<ChatMessage[]>(
        `/support/chat/student/${studentId}`
      );
      const list = res.data || [];
      setMessages(list);
      // Lấy tên từ tin đầu tiên nếu có
      if (list.length > 0) {
        const first = list[0];
        setStudentName(
          first.senderRole === "STUDENT" ? first.senderName : first.receiverName
        );
      }
      // cuộn xuống cuối
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("❌ Lỗi load hội thoại:", err);
      setError("Không tải được hội thoại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversation();
    // Poll mỗi 2s cho “gần realtime”
    const timer = setInterval(() => {
      loadConversation();
    }, 2000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const formatTime = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso || "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !input.trim()) return;

    try {
      setSending(true);
      const res = await api.post<ChatMessage>(
        `/support/chat/student/${studentId}`,
        { content: input.trim() }
      );
      setInput("");
      // Push luôn tin mới vào (khỏi chờ reload)
      setMessages((prev) => [...prev, res.data]);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
      alert("Gửi tin nhắn thất bại. Kiểm tra lại hoặc xem log BE.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <SupportSidebar />

      <main className="flex-1 p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              onClick={() => navigate("/support")}
              className="text-xs text-slate-500 hover:text-slate-700 mb-1"
            >
              ← Quay lại danh sách học viên
            </button>
            <h1 className="text-2xl font-semibold text-slate-800">
              Chat với học viên
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
            Đang tải hội thoại...
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}

        {/* Chat box */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          {/* messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-sm text-slate-500 text-center mt-10">
                Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên cho học viên.
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.mine
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {!m.mine && (
                      <div className="text-[11px] font-medium mb-0.5 text-slate-700">
                        {m.senderName}
                      </div>
                    )}
                    <div className="whitespace-pre-line">{m.content}</div>
                    <div
                      className={`mt-1 text-[10px] flex items-center gap-1 ${
                        m.mine ? "text-emerald-100" : "text-slate-500"
                      }`}
                    >
                      <span>{formatTime(m.sentAt)}</span>
                      {m.mine && (
                        <span>{m.read ? "✓✓ Đã đọc" : "✓ Đã gửi"}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          <form
            onSubmit={handleSend}
            className="border-t border-slate-200 p-3 flex items-center gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={1}
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="Nhập tin nhắn..."
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-60"
            >
              {sending ? "Đang gửi..." : "Gửi"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

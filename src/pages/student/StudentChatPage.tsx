// src/pages/student/StudentChatPage.tsx
import { useEffect, useState, useRef } from "react";
import api from "../../utils/api";

type StudentProfile = {
  id: number;
  fullName: string;
  careStaffName: string | null;
};

type ChatMessage = {
  id: number;
  studentId: number;
  senderId: number;
  senderName: string;
  senderRole: "STUDENT" | "SUPPORT";
  receiverId: number;
  receiverName: string;
  content: string;
  sentAt: string;
  mine: boolean;
  read: boolean;
};

export default function StudentChatPage() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll xuống cuối mỗi khi có tin mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Lấy studentId
        const stuRes = await api.get<StudentProfile>("/profile/student");
        const stu = stuRes.data;
        setStudent(stu);

        // 2) Lấy list chat
        const chatRes = await api.get<ChatMessage[]>(
          `/student/chat/${stu.id}`
        );
        setMessages(chatRes.data || []);
      } catch (err) {
        console.error("❌ Lỗi load student chat:", err);
        setError("Không tải được cuộc hội thoại.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSend = async () => {
    if (!student || !newMessage.trim()) return;
    try {
      setSending(true);
      const res = await api.post<ChatMessage>(
        `/student/chat/${student.id}`,
        { content: newMessage.trim() }
      );
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("❌ Lỗi gửi tin nhắn:", err);
      alert("Gửi tin nhắn thất bại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-h-[600px]">
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-slate-800">
          Chat với CSKH
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Trao đổi với nhân viên chăm sóc khách hàng về lịch học, học phí, tình
          hình học tập,...
        </p>
      </div>

      {loading && (
        <div className="text-sm text-slate-600">Đang tải cuộc hội thoại...</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Thông tin đối thoại */}
          {student && (
            <div className="mb-3 text-xs text-slate-600">
              Học viên:{" "}
              <span className="font-medium">{student.fullName}</span> · CSKH:{" "}
              <span className="font-medium">
                {student.careStaffName || "Chưa gán"}
              </span>
            </div>
          )}

          {/* Khung chat */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {messages.length === 0 && (
                <div className="text-xs text-slate-400 text-center mt-4">
                  Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên cho CSKH nhé.
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={
                      "max-w-[70%] rounded-2xl px-3 py-2 text-xs shadow-sm " +
                      (m.mine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm")
                    }
                  >
                    <div className="font-semibold mb-0.5">
                      {m.mine ? "Bạn" : m.senderName}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className="mt-1 text-[10px] opacity-70 text-right">
                      {m.sentAt?.replace("T", " ").substring(0, 16)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-2 pt-2 border-t border-slate-200 flex gap-2">
              <input
                className="flex-1 border border-slate-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="px-4 py-1.5 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                Gửi
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

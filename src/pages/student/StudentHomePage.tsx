// src/pages/student/StudentHomePage.tsx
import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

type UserProfile = {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
};

type StudentProfile = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;

  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;

  lessonType: string | null;
  scheduleText: string | null;
  currentTimeSlot: string | null;
  newTimeSlot?: string | null;

  // Học phí / tiến độ
  tuitionPaidDate: string | null;
  totalSessions: number | null;
  completedSessions: number | null;
  remainingSessions: number | null;

  status: string | null;
  note: string | null;

  mainTeacherName: string | null;
  careStaffName: string | null;

  // ====== MỚI: gói học & nhắc học phí ======
  activePackageId?: number | null;
  tuitionAmount?: number | null;        // VND
  tuitionDueDate?: string | null;       // yyyy-MM-dd
  tuitionStatus?: string | null;        // NOT_PAID / PARTIALLY_PAID / PAID / OVERDUE
  tuitionReminderStatus?: string | null; // NO_PACKAGE / NO_TUITION / PAID / NOT_PAID / DUE_SOON / OVERDUE
  daysToDue?: number | null;            // >0: còn X ngày, <0: trễ X ngày
};

// Giống StudentSchedulePage.tsx
type TeachingAssignment = {
  id: number;
  dayOfWeek: number; // 1=Mon ... 7=Sun
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

const formatCurrencyVND = (amount?: number | null): string => {
  if (amount == null) return "";
  return amount.toLocaleString("vi-VN") + " VND";
};

export default function StudentHomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [schedule, setSchedule] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // ===== Load user + student + schedule =====
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [userRes, stuRes, scheduleRes] = await Promise.all([
          api.get<UserProfile>("/profile/user"),
          api.get<StudentProfile>("/profile/student"),
          api.get<TeachingAssignment[]>("/student/schedule"),
        ]);

        // Check role
        if (!userRes.data.roles?.includes("ROLE_STUDENT")) {
          navigate("/login", { replace: true });
          return;
        }

        setUser(userRes.data);
        setStudent(stuRes.data);
        setSchedule(scheduleRes.data || []);
      } catch (err) {
        console.error("❌ Lỗi load profile student:", err);
        setError("Không tải được thông tin học viên.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  // ===== TÍNH NHẮC NHỞ LỊCH HỌC =====
  // JS getDay(): 0=CN, 1=Mon... -> convert về 1=Mon..7=Sun
  const now = new Date();
  const jsDow = now.getDay(); // 0..6
  const todayDow = ((jsDow + 6) % 7) + 1; // 1..7

  const todayLessons = schedule.filter((slot) => slot.dayOfWeek === todayDow);

  const nextLesson: TeachingAssignment | null = (() => {
    if (schedule.length === 0) return null;
    // nếu hôm nay đã có lịch, ưu tiên lấy 1 slot hôm nay (slot đầu)
    if (todayLessons.length > 0) {
      return todayLessons[0];
    }
    // còn lại thì tìm slot có dayOfWeek gần nhất (trong tuần) sau hôm nay
    let best: { slot: TeachingAssignment; diff: number } | null = null;
    for (const slot of schedule) {
      const diff = (slot.dayOfWeek - todayDow + 7) % 7; // 0..6
      if (!best || diff < best.diff) {
        best = { slot, diff };
      }
    }
    return best?.slot ?? null;
  })();

  // ===== TÍNH NHẮC NHỞ HỌC PHÍ =====
  let tuitionLabel = "HỌC PHÍ";
  let tuitionClass = "bg-slate-100 text-slate-700";
  let tuitionMessage = "Chưa có dữ liệu học phí.";

  if (student) {
    const reminderRaw = (student.tuitionReminderStatus || "").toUpperCase();
    const days = student.daysToDue ?? null;
    const amountText = formatCurrencyVND(student.tuitionAmount);
    const dueDate = student.tuitionDueDate || null;
    const remaining = student.remainingSessions ?? null;
    const paidDate = student.tuitionPaidDate;

    switch (reminderRaw) {
      case "NO_PACKAGE":
        tuitionLabel = "CHƯA CÓ GÓI HỌC";
        tuitionClass = "bg-slate-100 text-slate-700";
        tuitionMessage =
          "Hiện tại bạn chưa có gói học nào đang hoạt động trên hệ thống. Vui lòng liên hệ CSKH hoặc quản lý để được đăng ký gói học.";
        break;

      case "NO_TUITION":
        tuitionLabel = "CHƯA CẤU HÌNH HỌC PHÍ";
        tuitionClass = "bg-amber-50 text-amber-700";
        tuitionMessage =
          "Gói học hiện tại chưa được cấu hình thông tin học phí trên hệ thống. Vui lòng liên hệ CSKH để được hỗ trợ.";
        break;

      case "PAID":
        tuitionLabel = "ĐÃ ĐÓNG HỌC PHÍ";
        tuitionClass = "bg-emerald-50 text-emerald-700";
        tuitionMessage =
          `Bạn đã hoàn tất học phí` +
          (amountText ? ` (${amountText})` : "") +
          (paidDate ? ` vào ngày ${paidDate}.` : ".") +
          (remaining != null
            ? ` Còn ${remaining} buổi trong gói hiện tại.`
            : "");
        break;

      case "OVERDUE": {
        tuitionLabel = "ĐÃ QUÁ HẠN HỌC PHÍ";
        tuitionClass = "bg-rose-50 text-rose-700";
        const overdueDays =
          days != null && days < 0 ? Math.abs(days) : undefined;

        tuitionMessage =
          (amountText ? `Học phí gói: ${amountText}. ` : "") +
          (dueDate ? `Hạn đóng là ${dueDate}. ` : "") +
          (overdueDays
            ? `Bạn đã trễ ${overdueDays} ngày. `
            : "Bạn đang quá hạn đóng học phí. ") +
          "Vui lòng liên hệ CSKH hoặc nhà trường để được hỗ trợ sớm.";
        break;
      }

      case "DUE_SOON": {
        tuitionLabel = "SẮP TỚI HẠN HỌC PHÍ";
        tuitionClass = "bg-amber-50 text-amber-700";
        let extra = "";
        if (days === 0) {
          extra = "Hôm nay là hạn cuối đóng học phí.";
        } else if (days != null && days > 0) {
          extra = `Còn ${days} ngày nữa là tới hạn đóng học phí.`;
        }
        tuitionMessage =
          (amountText ? `Học phí gói: ${amountText}. ` : "") +
          (dueDate ? `Hạn đóng: ${dueDate}. ` : "") +
          extra +
          " Bạn nên sắp xếp đóng học phí sớm để tránh gián đoạn lịch học.";
        break;
      }

      case "NOT_PAID": {
        tuitionLabel = "CHƯA ĐÓNG HỌC PHÍ";
        tuitionClass = "bg-amber-50 text-amber-700";

        let extra = "";
        if (days != null && days > 7) {
          extra = `Còn khoảng ${days} ngày nữa tới hạn đóng học phí. `;
        } else if (days != null && days > 0) {
          extra = `Còn ${days} ngày nữa tới hạn đóng học phí. `;
        }

        tuitionMessage =
          (amountText ? `Học phí gói: ${amountText}. ` : "") +
          (dueDate ? `Hạn đóng: ${dueDate}. ` : "") +
          extra +
          "Vui lòng chuẩn bị để đóng đúng hạn.";
        break;
      }

      default:
        // Giữ default như ban đầu: chưa rõ trạng thái
        tuitionLabel = "HỌC PHÍ";
        tuitionClass = "bg-slate-100 text-slate-700";
        tuitionMessage =
          "Trạng thái học phí của bạn đang được cập nhật. Nếu cần, hãy liên hệ CSKH để được hỗ trợ.";
        break;
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-600">
        Đang tải thông tin học viên...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
        {error}
      </div>
    );
  }

  if (!user || !student) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Xin chào, {student.fullName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Đây là trang tổng quan thông tin học viên của bạn tại Solo Music
          Academy.
        </p>
      </div>

      {/* ====== NHẮC NHỞ: LỊCH HỌC + HỌC PHÍ ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nhắc lịch học */}
        <div className="bg-white rounded-xl shadow-sm border border-sky-100 p-4">
          <div className="text-xs font-semibold text-sky-700 mb-2">
            Nhắc lịch học
          </div>

          {todayLessons.length > 0 ? (
            <>
              <div className="text-sm text-slate-800 mb-1">
                Hôm nay bạn có {todayLessons.length} buổi học:
              </div>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                {todayLessons.map((slot) => (
                  <li key={slot.id}>
                    {DOW_LABEL[slot.dayOfWeek] || `Thứ ${slot.dayOfWeek}`}{" "}
                    {slot.startTime?.substring(0, 5)}–
                    {slot.endTime?.substring(0, 5)}
                    {slot.teacherName && (
                      <span className="ml-1">· GV {slot.teacherName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : nextLesson ? (
            <div className="text-xs text-slate-600">
              Buổi học tiếp theo của bạn:{" "}
              <span className="font-medium text-slate-800">
                {DOW_LABEL[nextLesson.dayOfWeek] ||
                  `Thứ ${nextLesson.dayOfWeek}`}{" "}
                {nextLesson.startTime?.substring(0, 5)}–
                {nextLesson.endTime?.substring(0, 5)}
              </span>
              {nextLesson.teacherName && (
                <span className="ml-1">· GV {nextLesson.teacherName}</span>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Hiện hệ thống chưa có lịch học nào cho bạn.
            </div>
          )}
        </div>

        {/* Nhắc học phí */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4">
          <div className="text-xs font-semibold text-amber-700 mb-2">
            Nhắc đóng học phí
          </div>

          <div
            className={
              "inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold mb-2 " +
              tuitionClass
            }
          >
            {tuitionLabel}
          </div>
          <div className="text-xs text-slate-600">{tuitionMessage}</div>
        </div>
      </div>

      {/* ===== Dòng cards tổng quan ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Số buổi */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Tiến độ khoá học
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-800">
              {student.completedSessions ?? 0}/{student.totalSessions ?? "?"}
            </div>
            <div className="text-xs text-slate-500">buổi đã học</div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Còn lại:{" "}
            <span className="font-medium">
              {student.remainingSessions ?? "-"}
            </span>{" "}
            buổi
          </div>
        </div>

        {/* Trạng thái */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Trạng thái học viên
          </div>
          <div className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            {student.status || "Đang cập nhật"}
          </div>
          {student.tuitionPaidDate && (
            <div className="text-xs text-slate-500 mt-2">
              Ngày đóng học phí gần nhất:{" "}
              <span className="font-medium">{student.tuitionPaidDate}</span>
            </div>
          )}
        </div>

        {/* Giáo viên & CSKH */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-xs font-semibold text-slate-500 mb-2">
            Giáo viên & CSKH
          </div>
          <div className="text-sm">
            <div className="text-slate-500">Giáo viên phụ trách</div>
            <div className="font-medium text-slate-800">
              {student.mainTeacherName || "Chưa cập nhật"}
            </div>
          </div>
          <div className="text-sm mt-2">
            <div className="text-slate-500">Nhân viên CSKH</div>
            <div className="font-medium text-slate-800">
              {student.careStaffName || "Chưa gán"}
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Thông tin cá nhân */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-700 mb-1">
            Thông tin cá nhân
          </div>
          <div className="text-xs text-slate-600">
            <div>
              <span className="font-medium">Họ tên: </span>
              {student.fullName}
            </div>
            <div>
              <span className="font-medium">Email: </span>
              {student.email || "Chưa cập nhật"}
            </div>
            <div>
              <span className="font-medium">Số điện thoại: </span>
              {student.phone || "Chưa cập nhật"}
            </div>
          </div>
        </div>

        {/* Phụ huynh */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-700 mb-1">
            Thông tin phụ huynh
          </div>
          <div className="text-xs text-slate-600">
            <div>
              <span className="font-medium">Tên phụ huynh: </span>
              {student.parentName || "Chưa cập nhật"}
            </div>
            <div>
              <span className="font-medium">SĐT phụ huynh: </span>
              {student.parentPhone || "Chưa cập nhật"}
            </div>
            <div>
              <span className="font-medium">Email phụ huynh: </span>
              {student.parentEmail || "Chưa cập nhật"}
            </div>
          </div>
        </div>

        {/* Lịch học mô tả */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-2 md:col-span-2">
          <div className="text-sm font-semibold text-slate-700 mb-1">
            Lịch & hình thức học
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>
              <span className="font-medium">Hình thức: </span>
              {student.lessonType || "Chưa cập nhật"}
            </div>
            <div>
              <span className="font-medium">Lịch học: </span>
              {student.scheduleText || student.currentTimeSlot || "Chưa cập nhật"}
            </div>
            {student.note && (
              <div>
                <span className="font-medium">Ghi chú: </span>
                {student.note}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

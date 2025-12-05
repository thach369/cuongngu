// src/pages/admin/AdminPackagesPage.tsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useSearchParams } from "react-router-dom";

// ====== Kiểu data trả về từ BE ======
type PackageSchedule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotNote?: string;
};

type StudentPackage = {
  id: number;

  // optional: để support prefill form khi BE có trả về
  studentId?: number;
  teacherId?: number;
  courseId?: number | null;

  studentName: string;
  teacherName: string;

  courseName?: string | null;
  lessonForm?: string | null;

  oldPeriodStart?: string | null;
  oldPeriodEnd?: string | null;

  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;

  tuitionAmount?: number | null;
  tuitionDueDate?: string | null; // hạn đóng
  tuitionPaidDate?: string | null; // đã đóng ngày nào
  tuitionStatus?: string | null; // NOT_PAID / PAID / OVERDUE...

  totalSessions?: number | null;
  sessionsCompleted?: number | null;
  sessionsRemaining?: number | null;

  status: string; // ACTIVE / COMPLETED...
  note?: string | null;

  schedules: PackageSchedule[];
};

// Học viên / giáo viên / khóa học cho dropdown
type StudentOption = {
  id: number;
  fullName: string;
};

type TeacherOption = {
  id: number;
  fullName: string;
  instrument?: string | null;
};

type CourseOption = {
  id: number;
  code: string;
  name: string;
  instrument?: string | null;
  level?: string | null;
  totalSessions?: number | null;
  tuitionFee?: number | null;
  status?: string | null;
};

// 1 dòng lịch học trong tuần trên form
type ScheduleRow = {
  dayOfWeek: string; // "1".."7"
  startTime: string;
  endTime: string;
  slotNote: string;
};

// Map thứ -> label
const DOW_LABEL: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

// ==== Form state type (khớp StudentPackageCreateRequest) ====
type PackageFormState = {
  studentId: string;
  teacherId: string;
  courseId: string;

  schedules: ScheduleRow[];

  lessonForm: string;

  oldPeriodStart: string;
  oldPeriodEnd: string;

  currentPeriodStart: string;
  currentPeriodEnd: string;

  // Hạn đóng & ngày đóng học phí
  tuitionDueDate: string;
  tuitionPaidDate: string;

  totalSessions: string;
  sessionsCompleted: string;

  note: string;
};

const emptySchedule: ScheduleRow = {
  dayOfWeek: "1",
  startTime: "",
  endTime: "",
  slotNote: "",
};

const emptyForm: PackageFormState = {
  studentId: "",
  teacherId: "",
  courseId: "",
  schedules: [emptySchedule],
  lessonForm: "One to one / 45 mins / Piano",
  oldPeriodStart: "",
  oldPeriodEnd: "",
  currentPeriodStart: "",
  currentPeriodEnd: "",
  tuitionDueDate: "",
  tuitionPaidDate: "",
  totalSessions: "",
  sessionsCompleted: "",
  note: "",
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PackageFormState>(emptyForm);

  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // NEW: chế độ đang sửa hay tạo mới
  const [editingId, setEditingId] = useState<number | null>(null);

  // NEW: tìm kiếm + lọc giáo viên
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeacherName, setFilterTeacherName] = useState("");

  // NEW: lấy studentId từ query param để lọc + prefill
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterStudentId, setFilterStudentId] = useState<string>(
    searchParams.get("studentId") || ""
  );

  useEffect(() => {
    const sid = searchParams.get("studentId") || "";
    setFilterStudentId(sid);
  }, [searchParams]);

  const STUDENT_SIMPLE_API = "/admin/students/simple";
  const TEACHER_SIMPLE_API = "/admin/teachers/simple";
  const COURSE_API = "/admin/courses";

  // ===== Load list packages =====
  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<StudentPackage[]>("/admin/packages");
      setPackages(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load packages:", err);
      setError("Không tải được danh sách gói học");
    } finally {
      setLoading(false);
    }
  };

  // ===== Load dropdown options =====
  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [stuRes, teaRes, courseRes] = await Promise.all([
        api.get<StudentOption[]>(STUDENT_SIMPLE_API),
        api.get<TeacherOption[]>(TEACHER_SIMPLE_API),
        api.get<CourseOption[]>(COURSE_API),
      ]);

      setStudentOptions(stuRes.data || []);
      setTeacherOptions(teaRes.data || []);

      const courses = (courseRes.data || []).filter(
        (c) => !c.status || c.status === "ACTIVE"
      );
      setCourseOptions(courses);
    } catch (err) {
      console.error(
        "❌ Lỗi load danh sách học viên / giáo viên / khóa học:",
        err
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadPackages();
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Helpers hiển thị =====
  const renderStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "";
    let cls = "bg-slate-100 text-slate-700";
    let label = s;

    if (s === "ACTIVE") {
      cls = "bg-emerald-100 text-emerald-700";
      label = "Đang học";
    } else if (s === "COMPLETED") {
      cls = "bg-blue-100 text-blue-700";
      label = "Hoàn tất";
    } else if (s === "PAUSED") {
      cls = "bg-amber-100 text-amber-700";
      label = "Tạm dừng";
    } else if (s === "STOPPED") {
      cls = "bg-rose-100 text-rose-700";
      label = "Dừng";
    }

    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
      >
        {label}
      </span>
    );
  };

  const renderTuitionStatusBadge = (status?: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
          Chưa cấu hình
        </span>
      );
    }

    const s = status.toUpperCase();
    let cls = "bg-slate-100 text-slate-700";
    let label = s;

    if (s === "NOT_PAID") {
      cls = "bg-rose-100 text-rose-700";
      label = "Chưa đóng";
    } else if (s === "PARTIALLY_PAID") {
      cls = "bg-amber-100 text-amber-700";
      label = "Đóng thiếu";
    } else if (s === "PAID") {
      cls = "bg-emerald-100 text-emerald-700";
      label = "Đã đóng";
    } else if (s === "OVERDUE") {
      cls = "bg-red-200 text-red-800";
      label = "Quá hạn";
    }

    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
      >
        {label}
      </span>
    );
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return d;
    }
  };

  // ===== NEW: áp dụng filter / search =====
  const filteredPackages = packages.filter((pkg) => {
    const keyword = searchTerm.trim().toLowerCase();

    if (keyword) {
      const student = pkg.studentName?.toLowerCase() ?? "";
      const teacher = pkg.teacherName?.toLowerCase() ?? "";
      const course = pkg.courseName?.toLowerCase() ?? "";
      const matched =
        student.includes(keyword) ||
        teacher.includes(keyword) ||
        course.includes(keyword);

      if (!matched) return false;
    }

    if (filterTeacherName) {
      if (pkg.teacherName !== filterTeacherName) return false;
    }

    // NEW: lọc theo học viên từ query param (nếu có)
    if (filterStudentId) {
      if (!pkg.studentId || String(pkg.studentId) !== filterStudentId) {
        return false;
      }
    }

    return true;
  });

  // ===== Handle form =====
  const openForm = () => {
    // NEW: nếu đang filter theo 1 HV thì prefill luôn combobox học viên
    setForm({
      ...emptyForm,
      studentId: filterStudentId || "",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (!saving) {
      setShowForm(false);
      setEditingId(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => {
      const next: PackageFormState = { ...prev, courseId: value };
      if (value) {
        const c = courseOptions.find((c) => c.id === Number(value));
        if (c) {
          if (!prev.totalSessions && c.totalSessions != null) {
            next.totalSessions = String(c.totalSessions);
          }
          if (!prev.lessonForm) {
            next.lessonForm = c.name;
          }
        }
      }
      return next;
    });
  };

  const handleScheduleChange = (
    index: number,
    field: keyof ScheduleRow,
    value: string
  ) => {
    setForm((prev) => {
      const updated = [...prev.schedules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedules: updated };
    });
  };

  const addScheduleRow = () => {
    setForm((prev) => ({
      ...prev,
      schedules: [...prev.schedules, { ...emptySchedule }],
    }));
  };

  const removeScheduleRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  // ====== mở form sửa gói học ======
  const openEditForm = (pkg: StudentPackage) => {
    const schedules: ScheduleRow[] =
      pkg.schedules && pkg.schedules.length > 0
        ? pkg.schedules.map((s) => ({
            dayOfWeek: String(s.dayOfWeek ?? 1),
            startTime: s.startTime || "",
            endTime: s.endTime || "",
            slotNote: s.slotNote || "",
          }))
        : [emptySchedule];

    setForm({
      studentId: pkg.studentId ? String(pkg.studentId) : "",
      teacherId: pkg.teacherId ? String(pkg.teacherId) : "",
      courseId: pkg.courseId ? String(pkg.courseId) : "",
      schedules,
      lessonForm: pkg.lessonForm || "One to one / 45 mins / Piano",

      oldPeriodStart: pkg.oldPeriodStart || "",
      oldPeriodEnd: pkg.oldPeriodEnd || "",
      currentPeriodStart: pkg.currentPeriodStart || "",
      currentPeriodEnd: pkg.currentPeriodEnd || "",

      tuitionDueDate: pkg.tuitionDueDate || "",
      tuitionPaidDate: pkg.tuitionPaidDate || "",

      totalSessions:
        pkg.totalSessions !== undefined && pkg.totalSessions !== null
          ? String(pkg.totalSessions)
          : "",
      sessionsCompleted:
        pkg.sessionsCompleted !== undefined && pkg.sessionsCompleted !== null
          ? String(pkg.sessionsCompleted)
          : "",

      note: pkg.note || "",
    });

    setEditingId(pkg.id);
    setShowForm(true);
  };

  // ====== xóa gói học ======
  const handleDelete = async (pkgId: number) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa gói học này?")) return;

    try {
      await api.delete(`/admin/packages/${pkgId}`);
      await loadPackages();
    } catch (err) {
      console.error("❌ Lỗi xóa gói học:", err);
      alert("Xóa gói học thất bại. Kiểm tra lại log BE.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.studentId || !form.teacherId) {
      alert("Vui lòng chọn học viên và giáo viên.");
      return;
    }
    if (!form.currentPeriodStart || !form.currentPeriodEnd) {
      alert("Vui lòng chọn thời gian học hiện tại (từ ngày - đến ngày).");
      return;
    }
    if (!form.totalSessions && !form.courseId) {
      alert("Vui lòng chọn khóa học hoặc nhập tổng số buổi.");
      return;
    }
    if (form.schedules.length === 0) {
      alert("Vui lòng thêm ít nhất 1 lịch học trong tuần.");
      return;
    }
    for (const sch of form.schedules) {
      if (!sch.startTime || !sch.endTime) {
        alert("Vui lòng nhập giờ bắt đầu / kết thúc cho tất cả lịch học.");
        return;
      }
    }

    // Chỉ gửi thời gian cũ nếu đủ cả 2 ngày
    let oldPeriodStart: string | undefined;
    let oldPeriodEnd: string | undefined;
    if (form.oldPeriodStart && form.oldPeriodEnd) {
      oldPeriodStart = form.oldPeriodStart;
      oldPeriodEnd = form.oldPeriodEnd;
    }

    const schedulesBody = form.schedules.map((sch) => ({
      dayOfWeek: Number(sch.dayOfWeek),
      startTime: sch.startTime,
      endTime: sch.endTime,
      slotNote: sch.slotNote || undefined,
    }));

    const body = {
      studentId: Number(form.studentId),
      teacherId: Number(form.teacherId),
      courseId: form.courseId ? Number(form.courseId) : undefined,

      schedules: schedulesBody,

      lessonForm: form.lessonForm || undefined,

      oldPeriodStart,
      oldPeriodEnd,

      currentPeriodStart: form.currentPeriodStart,
      currentPeriodEnd: form.currentPeriodEnd,

      tuitionDueDate: form.tuitionDueDate || undefined,
      tuitionPaidDate: form.tuitionPaidDate || undefined,

      totalSessions: form.totalSessions ? Number(form.totalSessions) : undefined,
      sessionsCompleted: form.sessionsCompleted
        ? Number(form.sessionsCompleted)
        : 0,

      note: form.note || undefined,
      // parentName / parentContact / tuitionAmount... nếu cần thì thêm sau
    };

    try {
      setSaving(true);

      if (editingId === null) {
        // Tạo mới
        await api.post("/admin/packages", body);
      } else {
        // Cập nhật
        await api.put(`/admin/packages/${editingId}`, body);
      }

      await loadPackages();
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      console.error("❌ Lỗi lưu gói học:", err);
      alert(
        editingId === null
          ? "Tạo gói học thất bại. Kiểm tra lại dữ liệu hoặc log BE."
          : "Cập nhật gói học thất bại. Kiểm tra lại dữ liệu hoặc log BE."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* MAIN */}
      <main className="flex-1 p-6 space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Gói học / Hợp đồng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý các gói học: khóa học, lịch học trong tuần, số buổi còn
              lại, học phí...
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
          >
            <span className="text-lg">＋</span>
            <span>Thêm gói học</span>
          </button>
        </div>

        {/* Thanh tìm kiếm + lọc giáo viên */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo học viên, giáo viên, khóa học..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filterTeacherName}
              onChange={(e) => setFilterTeacherName(e.target.value)}
              className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">Tất cả giáo viên</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.fullName}>
                  {t.fullName}
                  {t.instrument ? ` (${t.instrument})` : ""}
                </option>
              ))}
            </select>
            {(searchTerm || filterTeacherName) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterTeacherName("");
                }}
                className="text-xs px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* NEW: thông báo đang lọc theo học viên */}
        {filterStudentId && (
          <div className="text-xs text-slate-600">
            Đang xem gói học của học viên ID = {filterStudentId}.{" "}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  p.delete("studentId");
                  return p;
                });
                setFilterStudentId("");
              }}
            >
              Bỏ lọc
            </button>
          </div>
        )}

        {/* LOADING / ERROR */}
        {loading && (
          <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2">
            Đang tải danh sách gói học...
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}

        {/* BẢNG GÓI HỌC */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border px-2 py-2 text-left">Học viên</th>
                <th className="border px-2 py-2 text-left">Giáo viên</th>
                <th className="border px-2 py-2 text-left">Lịch học</th>
                <th className="border px-2 py-2 text-left">
                  Gói &amp; học phí
                </th>
                <th className="border px-2 py-2 text-center">Buổi</th>
                <th className="border px-2 py-2 text-center">
                  Trạng thái học phí
                </th>
                <th className="border px-2 py-2 text-center">Trạng thái gói</th>
                <th className="border px-2 py-2 text-left">Ghi chú</th>
                <th className="border px-2 py-2 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="border px-3 py-4 text-center text-slate-500"
                  >
                    {packages.length === 0
                      ? 'Chưa có gói học nào. Bấm "Thêm gói học" để tạo mới.'
                      : "Không tìm thấy gói học nào khớp với bộ lọc."}
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/60">
                    {/* Học viên */}
                    <td className="border px-2 py-2 align-top">
                      <div className="font-medium text-slate-800">
                        {pkg.studentName}
                      </div>
                    </td>

                    {/* Giáo viên */}
                    <td className="border px-2 py-2 align-top">
                      <div className="text-slate-800">{pkg.teacherName}</div>
                    </td>

                    {/* Lịch học: nhiều dòng trong 1 ô */}
                    <td className="border px-2 py-2 align-top text-xs">
                      {pkg.schedules.map((sc, idx) => (
                        <div key={idx} className="mb-1">
                          <div className="text-slate-800">
                            {DOW_LABEL[sc.dayOfWeek] ||
                              `Thứ ${sc.dayOfWeek}`}
                          </div>
                          <div className="text-slate-600">
                            {sc.startTime} - {sc.endTime}
                          </div>
                          {sc.slotNote && (
                            <div className="text-[11px] text-slate-500">
                              {sc.slotNote}
                            </div>
                          )}
                        </div>
                      ))}

                      {pkg.currentPeriodStart && (
                        <div className="mt-1 text-[11px] text-slate-500 border-t pt-1">
                          {formatDate(pkg.currentPeriodStart)} →{" "}
                          {formatDate(pkg.currentPeriodEnd)}
                        </div>
                      )}
                    </td>

                    {/* Gói & học phí */}
                    <td className="border px-2 py-2 align-top text-xs">
                      {pkg.courseName && (
                        <div className="font-medium text-slate-900">
                          {pkg.courseName}
                        </div>
                      )}
                      {pkg.lessonForm && (
                        <div className="text-slate-700">{pkg.lessonForm}</div>
                      )}

                      {pkg.tuitionAmount != null && (
                        <div className="text-slate-800 mt-1">
                          Học phí:{" "}
                          {pkg.tuitionAmount.toLocaleString("vi-VN")} đ
                        </div>
                      )}

                      {pkg.tuitionDueDate && (
                        <div className="text-[11px] text-amber-700">
                          Hạn đóng: {formatDate(pkg.tuitionDueDate)}
                        </div>
                      )}

                      {pkg.tuitionPaidDate && (
                        <div className="text-[11px] text-emerald-700">
                          Đã đóng: {formatDate(pkg.tuitionPaidDate)}
                        </div>
                      )}
                    </td>

                    {/* Buổi */}
                    <td className="border px-2 py-2 align-top text-center text-xs">
                      <div className="text-slate-800">
                        {pkg.totalSessions ?? "-"} buổi
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Đã học: {pkg.sessionsCompleted ?? 0}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Còn lại: {pkg.sessionsRemaining ?? "-"}
                      </div>
                    </td>

                    {/* Trạng thái học phí */}
                    <td className="border px-2 py-2 align-top text-center">
                      {renderTuitionStatusBadge(pkg.tuitionStatus)}
                    </td>

                    {/* Trạng thái gói */}
                    <td className="border px-2 py-2 align-top text-center">
                      {renderStatusBadge(pkg.status)}
                    </td>

                    {/* Ghi chú */}
                    <td className="border px-2 py-2 align-top text-xs text-slate-700">
                      {pkg.note}
                    </td>

                    {/* Thao tác */}
                    <td className="border px-2 py-2 align-top text-center text-xs">
                      <div className="flex flex-col sm:flex-row gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => openEditForm(pkg)}
                          className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pkg.id)}
                          className="px-2 py-1 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FORM SLIDE-OVER */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex">
            {/* overlay */}
            <div className="flex-1 bg-black/40" onClick={closeForm}></div>

            {/* panel */}
            <div className="w-full max-w-lg bg-white shadow-xl h-full overflow-y-auto">
              <div className="px-4 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId ? "Chỉnh sửa gói học" : "Thêm gói học mới"}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-slate-400 hover:text-slate-600 text-xl"
                  type="button"
                >
                  ×
                </button>
              </div>

              <form className="p-4 space-y-4 text-sm" onSubmit={handleSubmit}>
                {/* Học viên + Giáo viên */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Học viên
                    </label>
                    <select
                      name="studentId"
                      value={form.studentId}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">
                        {loadingOptions
                          ? "Đang tải danh sách..."
                          : "-- Chọn học viên --"}
                      </option>
                      {studentOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Giáo viên
                    </label>
                    <select
                      name="teacherId"
                      value={form.teacherId}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">
                        {loadingOptions
                          ? "Đang tải danh sách..."
                          : "-- Chọn giáo viên --"}
                      </option>
                      {teacherOptions.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                          {t.instrument ? ` (${t.instrument})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Khóa học */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Khóa học (Course)
                  </label>
                  <select
                    name="courseId"
                    value={form.courseId}
                    onChange={handleCourseChange}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">
                      {loadingOptions
                        ? "Đang tải danh sách..."
                        : "-- Chọn khóa học (hoặc bỏ trống) --"}
                    </option>
                    {courseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `${c.code} - ` : ""}
                        {c.name}
                        {c.totalSessions ? ` (${c.totalSessions} buổi)` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nếu chọn khóa học mà không nhập số buổi / hình thức, hệ
                    thống sẽ tự dùng số buổi &amp; tên từ khóa học.
                  </p>
                </div>

                {/* Lịch học hàng tuần (nhiều dòng) */}
                <div className="border rounded-xl p-3 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-700">
                      Lịch học hàng tuần
                    </div>
                    <button
                      type="button"
                      onClick={addScheduleRow}
                      className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      + Thêm ngày
                    </button>
                  </div>

                  {form.schedules.map((sch, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 items-end"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Thứ
                        </label>
                        <select
                          value={sch.dayOfWeek}
                          onChange={(e) =>
                            handleScheduleChange(
                              index,
                              "dayOfWeek",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="1">Thứ 2</option>
                          <option value="2">Thứ 3</option>
                          <option value="3">Thứ 4</option>
                          <option value="4">Thứ 5</option>
                          <option value="5">Thứ 6</option>
                          <option value="6">Thứ 7</option>
                          <option value="7">Chủ nhật</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Giờ bắt đầu
                        </label>
                        <input
                          type="time"
                          value={sch.startTime}
                          onChange={(e) =>
                            handleScheduleChange(
                              index,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Giờ kết thúc
                        </label>
                        <input
                          type="time"
                          value={sch.endTime}
                          onChange={(e) =>
                            handleScheduleChange(
                              index,
                              "endTime",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex gap-2 items-end">
                        <input
                          type="text"
                          value={sch.slotNote}
                          onChange={(e) =>
                            handleScheduleChange(
                              index,
                              "slotNote",
                              e.target.value
                            )
                          }
                          className="flex-1 border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ghi chú slot (VD: Hannah – Piano 1-1)"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeScheduleRow(index)}
                            className="px-2 py-1 text-xs rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hình thức & thời gian */}
                <div className="border rounded-xl p-3 bg-slate-50/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    Thời gian &amp; hình thức
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Hình thức tiết học
                    </label>
                    <input
                      type="text"
                      name="lessonForm"
                      value={form.lessonForm}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="One to one / 45 mins / Piano"
                    />
                  </div>

                  {/* Hạn đóng & ngày đã đóng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Hạn đóng học phí
                      </label>
                      <input
                        type="date"
                        name="tuitionDueDate"
                        value={form.tuitionDueDate}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Ngày đã đóng (nếu có)
                      </label>
                      <input
                        type="date"
                        name="tuitionPaidDate"
                        value={form.tuitionPaidDate}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Thời gian hiện tại */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian hiện tại (từ ngày)
                      </label>
                      <input
                        type="date"
                        name="currentPeriodStart"
                        value={form.currentPeriodStart}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian hiện tại (đến ngày)
                      </label>
                      <input
                        type="date"
                        name="currentPeriodEnd"
                        value={form.currentPeriodEnd}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Thời gian cũ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian cũ (từ)
                      </label>
                      <input
                        type="date"
                        name="oldPeriodStart"
                        value={form.oldPeriodStart}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Thời gian cũ (đến)
                      </label>
                      <input
                        type="date"
                        name="oldPeriodEnd"
                        value={form.oldPeriodEnd}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Có thể bỏ trống nếu không cần lưu thời gian cũ.
                  </p>
                </div>

                {/* Số buổi */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Tổng số buổi
                    </label>
                    <input
                      type="number"
                      name="totalSessions"
                      value={form.totalSessions}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="VD: 8"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Đã học (nếu có)
                    </label>
                    <input
                      type="number"
                      name="sessionsCompleted"
                      value={form.sessionsCompleted}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="VD: 0"
                    />
                  </div>
                  <div className="flex items-end text-[11px] text-slate-500">
                    Nếu chọn khóa học, có thể để trống — hệ thống sẽ dùng số
                    buổi mặc định của khóa.
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ví dụ: tạm nghỉ vài tuần, hoàn lại 3 buổi, liên lạc qua Zalo,..."
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {saving
                      ? editingId
                        ? "Đang cập nhật..."
                        : "Đang lưu..."
                      : editingId
                      ? "Cập nhật gói học"
                      : "Lưu gói học"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

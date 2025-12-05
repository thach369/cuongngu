// src/pages/admin/AdminAttendancePage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import api from "../../utils/api";

// ================== DTO ==================
export type AttendanceSlot = {
  slotId: number;
  attendanceId: number | null;
  dayOfWeek: number;
  date: string;       // "2025-12-04"
  startTime: string;  // "14:00"
  endTime: string;    // "14:45"
  teacherId: number;
  teacherName: string;
  studentName?: string | null;
  status: string | null;      // "PRESENT" / "ABSENT" / null
  hasImage: boolean;
  imageUrl?: string | null;   // URL ảnh từ BE (GitHub)
};

type TeacherOption = {
  id: number;
  fullName: string;
};

// ================== HELPER DATE & TIME ==================
const WEEKDAY_HEADER = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const pad2 = (n: number) => n.toString().padStart(2, "0");

const toDateString = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const formatViDateShort = (d: Date) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;

const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // nếu CN -> lùi 6 ngày
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(d.getDate() + n);
  return nd;
};

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Helper xác định buổi
const getPeriod = (timeStr: string) => {
  const [h] = timeStr.split(":").map(Number);
  if (h < 12) return "MORNING";
  if (h < 18) return "AFTERNOON";
  return "EVENING";
};

// ================== MAIN COMPONENT ==================
export default function AdminAttendancePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getMonday(new Date())
  );
  const [slots, setSlots] = useState<AttendanceSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  // Mặc định chọn ALL
  const [selectedTeacherId, setSelectedTeacherId] = useState<
    number | "ALL" | ""
  >("ALL");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "DONE" | "PENDING"
  >("ALL");

  // Modal Upload
  const [selectedSlot, setSelectedSlot] = useState<AttendanceSlot | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lightbox xem ảnh full + zoom
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(1);

  // ===== LOAD TEACHERS =====
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const res = await api.get<TeacherOption[]>("/admin/attendance/teachers");
        setTeachers(res.data || []);
      } catch (err) {
        console.error("Lỗi load GV:", err);
      }
    };
    loadTeachers();
  }, []);

  // ===== LOAD SLOTS BY WEEK + TEACHER =====
  const loadSlotsForWeek = useCallback(
    async (weekStart: Date, teacherId?: number | "ALL" | "") => {
      if (!teacherId) {
        setSlots([]);
        return;
      }
      setLoading(true);
      try {
        const params: any = { startDate: toDateString(weekStart) };
        if (teacherId !== "ALL") params.teacherId = teacherId;
        const res = await api.get<AttendanceSlot[]>("/admin/attendance/week", {
          params,
        });
        setSlots(res.data || []);
      } catch (err) {
        console.error("Lỗi load slots:", err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSlotsForWeek(currentWeekStart, selectedTeacherId);
  }, [currentWeekStart, selectedTeacherId, loadSlotsForWeek]);

  // Navigation
  const goPrevWeek = () => setCurrentWeekStart((p) => addDays(p, -7));
  const goNextWeek = () => setCurrentWeekStart((p) => addDays(p, 7));
  const goCurrentWeek = () => setCurrentWeekStart(getMonday(new Date()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );
  const isToday = (d: Date) => toDateString(d) === toDateString(new Date());

  // Stats
  const stats = useMemo(() => {
    const total = slots.length;
    const done = slots.filter(
      (s) => s.status === "PRESENT" || s.hasImage
    ).length;
    const pending = total - done;
    return { total, done, pending };
  }, [slots]);

  // Filter
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const isDone = s.status === "PRESENT" || s.hasImage;
      if (filterStatus === "DONE") return isDone;
      if (filterStatus === "PENDING") return !isDone;
      return true;
    });
  }, [slots, filterStatus]);

  // Helper lấy slot theo ngày và buổi
  const getSlotsForDateAndPeriod = (
    date: Date,
    period: "MORNING" | "AFTERNOON" | "EVENING"
  ) => {
    const dStr = toDateString(date);
    return filteredSlots
      .filter(
        (s) => s.date === dStr && getPeriod(s.startTime) === period
      )
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // ===== MODAL HANDLERS =====
  const handleOpenModal = (slot: AttendanceSlot) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
    setSelectedSlot(slot);
  };

  const handleCloseModal = () => {
    setSelectedSlot(null);
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !file) return;

    const formData = new FormData();
    formData.append("slotId", selectedSlot.slotId.toString());
    formData.append("date", selectedSlot.date);
    formData.append("status", "PRESENT");
    formData.append("image", file);

    try {
      setUploading(true);
      await api.post("/admin/attendance/mark", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadSlotsForWeek(currentWeekStart, selectedTeacherId);
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert("Lỗi upload ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!selectedSlot) return;
    if (!selectedSlot.imageUrl) return;

    const ok = window.confirm(
      "Bạn có chắc muốn xóa ảnh điểm danh này và reset lại chấm công không?"
    );
    if (!ok) return;

    try {
      setDeleting(true);
      await api.delete("/admin/attendance/image", {
        params: {
          slotId: selectedSlot.slotId,
          date: selectedSlot.date,
        },
      });

      // ✅ Update ngay trên UI: reset ảnh + trạng thái của slot hiện tại
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              hasImage: false,
              imageUrl: null,
              status: null,
            }
          : prev
      );

      setSlots((prev) =>
        prev.map((s) =>
          s.slotId === selectedSlot.slotId && s.date === selectedSlot.date
            ? { ...s, hasImage: false, imageUrl: null, status: null }
            : s
        )
      );

      // Nếu BE cũng reset status thì reload tuần sẽ đồng bộ theo DB
      await loadSlotsForWeek(currentWeekStart, selectedTeacherId);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setFile(null);
    } catch (err) {
      console.error("Lỗi xóa ảnh:", err);
      alert("Xóa ảnh thất bại, thử lại sau.");
    } finally {
      setDeleting(false);
    }
  };

  // Mở fullscreen (lightbox) với URL và reset zoom
  const openFullscreen = (url: string) => {
    setFullscreenUrl(url);
    setFullscreenZoom(1);
  };

  const zoomIn = () =>
    setFullscreenZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))));
  const zoomOut = () =>
    setFullscreenZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
  const resetZoom = () => setFullscreenZoom(1);

  // ✅ COMPONENT: 1 SECTION LỊCH CHO TỪNG BUỔI
  const PeriodScheduleSection = ({
    title,
    icon,
    period,
    bgColor,
    headerColor,
    iconColor,
  }: {
    title: string;
    icon: string;
    period: "MORNING" | "AFTERNOON" | "EVENING";
    bgColor: string;
    headerColor: string;
    iconColor: string;
  }) => {
    const hasSlotsInWeek = days.some(
      (d) => getSlotsForDateAndPeriod(d, period).length > 0
    );

    return (
      <div
        className={`mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${bgColor}`}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-2 border-b border-slate-100 px-6 py-4 ${headerColor}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ${iconColor}`}
          >
            <i className={icon}></i>
          </div>
          <h3
            className={`text-lg font-bold uppercase tracking-wide ${iconColor}`}
          >
            {title}
          </h3>
        </div>

        {/* Grid 7 ngày */}
        <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-7 sm:divide-x sm:divide-y-0">
          {days.map((d, idx) => {
            const today = isToday(d);
            const periodSlots = getSlotsForDateAndPeriod(d, period);

            return (
              <div
                key={idx}
                className={`flex min-h-[160px] flex-col p-3 transition-colors ${
                  today
                    ? "bg-white ring-2 ring-inset ring-blue-400/30"
                    : "hover:bg-white/60"
                }`}
              >
                {/* Ngày */}
                <div className="mb-3 text-center opacity-70">
                  <span className="block text-[10px] font-bold uppercase">
                    {WEEKDAY_HEADER[idx]}
                  </span>
                  <span
                    className={`block text-xs font-bold ${
                      today ? "text-blue-600" : ""
                    }`}
                  >
                    {formatViDateShort(d)}
                  </span>
                </div>

                {/* Slots */}
                <div className="flex flex-1 flex-col gap-2">
                  {periodSlots.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center">
                      {hasSlotsInWeek && (
                        <span className="text-slate-300 text-xl font-light">
                          -
                        </span>
                      )}
                    </div>
                  ) : (
                    periodSlots.map((s) => {
                      const isDone = s.status === "PRESENT" || s.hasImage;
                      return (
                        <div
                          key={s.slotId}
                          onClick={() => handleOpenModal(s)}
                          className={`group relative cursor-pointer rounded-lg border p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md
                            ${
                              isDone
                                ? "border-emerald-200 bg-white"
                                : "border-amber-200 bg-white"
                            }
                          `}
                        >
                          {/* Dòng 1: giờ học + icon */}
                          <div className="mb-1 flex items-center justify-between border-b border-dashed border-slate-100 pb-1">
                            <span
                              className={`text-[10px] font-extrabold ${
                                isDone ? "text-emerald-700" : "text-slate-600"
                              }`}
                            >
                              {s.startTime} - {s.endTime}
                            </span>
                            <div className="flex items-center gap-1">
                              {s.hasImage && (
                                <i className="fa-solid fa-camera text-[10px] text-sky-500" />
                              )}
                              {isDone && (
                                <i className="fa-solid fa-circle-check text-emerald-500 text-[10px]" />
                              )}
                            </div>
                          </div>

                          {/* Dòng 2: Học viên */}
                          <div
                            className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-1"
                            title={s.studentName || ""}
                          >
                            {s.studentName || "Học viên"}
                          </div>

                          {/* Dòng 3: Giáo viên (luôn hiện) */}
                          <div className="mt-1 text-[10px] font-medium text-indigo-500 truncate">
                            {s.teacherName}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* HEADER BAR */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <i className="fa-solid fa-layer-group"></i>
              </div>
              <div>
                <h1 className="leading-none text-lg font-bold text-slate-900">
                  Lịch dạy
                </h1>
                <span className="text-xs font-medium text-slate-500">
                  Quản lý lớp học
                </span>
              </div>
            </div>

            <div className="mx-2 h-8 w-px bg-slate-200"></div>

            <select
              value={selectedTeacherId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTeacherId(
                  val === "ALL" ? "ALL" : val ? Number(val) : ""
                );
              }}
              className="cursor-pointer rounded-lg bg-slate-100 py-2 pl-3 pr-8 text-sm font-bold text-slate-700 outline-none transition-all hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">📋 Toàn bộ trung tâm</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
            <button
              onClick={goPrevWeek}
              className="h-8 w-8 rounded-lg bg-white shadow-sm hover:text-blue-600"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <div className="min-w-[120px] px-3 text-center">
              <span className="block text-xs font-bold text-slate-700">
                {formatViDateShort(currentWeekStart)} -{" "}
                {formatViDateShort(addDays(currentWeekStart, 6))}
              </span>
            </div>
            <button
              onClick={goNextWeek}
              className="h-8 w-8 rounded-lg bg-white shadow-sm hover:text-blue-600"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
            <button
              onClick={goCurrentWeek}
              className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200"
            >
              Hiện tại
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="mx-auto max-w-[1800px] p-4 sm:p-6">
        {loading && (
          <div className="mb-6 text-center text-xs font-medium text-blue-500 animate-pulse">
            Đang đồng bộ dữ liệu...
          </div>
        )}

        {!selectedTeacherId ? (
          <div className="py-20 text-center opacity-60">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            {/* STATS & FILTER */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-4">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">
                    Tổng lớp
                  </span>
                  <span className="text-xl font-black text-slate-800">
                    {stats.total}
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-white px-4 py-2 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase text-emerald-600">
                    Đã xong
                  </span>
                  <span className="text-xl font-black text-emerald-600">
                    {stats.done}
                  </span>
                </div>
                <div className="rounded-xl border border-amber-200 bg-white px-4 py-2 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase text-amber-600">
                    Chưa chấm
                  </span>
                  <span className="text-xl font-black text-amber-600">
                    {stats.pending}
                  </span>
                </div>
              </div>

              <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {(["ALL", "PENDING", "DONE"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      filterStatus === st
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {st === "ALL"
                      ? "Tất cả"
                      : st === "PENDING"
                      ? "Chưa chấm"
                      : "Đã xong"}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 BLOCK LỊCH */}
            <PeriodScheduleSection
              title="Buổi Sáng"
              icon="fa-regular fa-sun"
              period="MORNING"
              bgColor="bg-sky-50/50"
              headerColor="bg-sky-100/50"
              iconColor="text-sky-600"
            />

            <PeriodScheduleSection
              title="Buổi Chiều"
              icon="fa-solid fa-cloud-sun"
              period="AFTERNOON"
              bgColor="bg-orange-50/50"
              headerColor="bg-orange-100/50"
              iconColor="text-orange-600"
            />

            <PeriodScheduleSection
              title="Buổi Tối"
              icon="fa-solid fa-moon"
              period="EVENING"
              bgColor="bg-indigo-50/50"
              headerColor="bg-indigo-100/50"
              iconColor="text-indigo-600"
            />
          </>
        )}
      </div>

      {/* MODAL */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="font-bold text-slate-800">Cập nhật điểm danh</h3>
              <button
                onClick={handleCloseModal}
                className="h-8 w-8 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Info box */}
              <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="mb-2 flex justify-between">
                  <span className="text-slate-500">Học viên</span>
                  <span className="font-bold">
                    {selectedSlot.studentName || "—"}
                  </span>
                </div>
                <div className="mb-2 flex justify-between">
                  <span className="text-slate-500">Giáo viên</span>
                  <span className="font-bold text-indigo-600">
                    {selectedSlot.teacherName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giờ học</span>
                  <span className="font-bold">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </span>
                </div>
              </div>

              <form onSubmit={handleUpload}>
                {/* Upload + Preview */}
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-700">
                    Ảnh minh chứng
                  </label>
                  <label
                    className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                      file || selectedSlot.imageUrl
                        ? "border-emerald-500 bg-emerald-50/20"
                        : "border-slate-300 hover:border-blue-500"
                    }`}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        className="h-full w-full object-contain p-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openFullscreen(previewUrl);
                        }}
                      />
                    ) : selectedSlot.imageUrl ? (
                      <img
                        src={selectedSlot.imageUrl}
                        className="h-full w-full object-contain p-2"
                        title="Ảnh đã upload (click để xem lớn)"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (selectedSlot.imageUrl) {
                            openFullscreen(selectedSlot.imageUrl);
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <i className="fa-solid fa-camera mb-2 text-2xl"></i>
                        <p className="text-xs">Tải ảnh lên</p>
                      </div>
                    )}

                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Nút xoá ảnh (chỉ khi có ảnh server & chưa chọn file mới) */}
                  {selectedSlot.imageUrl && !previewUrl && (
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        disabled={deleting}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <i className="fa-solid fa-trash-can text-[10px]" />
                        {deleting ? "Đang xóa..." : "Xóa ảnh & reset"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={uploading || deleting || !file}
                    className="rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {uploading ? "Đang lưu..." : "Xác nhận"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX XEM ẢNH FULL + ZOOM */}
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setFullscreenUrl(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thanh control zoom */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={zoomOut}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                -
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                {Math.round(fullscreenZoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setFullscreenUrl(null)}
                className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/40"
              >
                Đóng
              </button>
            </div>

            {/* Vùng ảnh: scroll để kéo ảnh, KHÔNG còn auto zoom khi cuộn */}
            <div className="max-h-[80vh] max-w-[90vw] overflow-auto rounded-xl bg-black/40">
              <div className="flex h-full w-full items-center justify-center">
                <img
                  src={fullscreenUrl}
                  className="object-contain"
                  style={{
                    transform: `scale(${fullscreenZoom})`,
                    transformOrigin: "center center",
                    transition: "transform 0.1s ease-out",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

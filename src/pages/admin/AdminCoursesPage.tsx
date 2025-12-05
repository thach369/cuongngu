// src/pages/admin/AdminCoursesPage.tsx
import { useEffect, useState } from "react";
import api from "../../utils/api";

// Khớp với CourseListResponse bên BE
type CourseItem = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  instrument?: string | null;
  level?: string | null;           // BEGINNER / INTERMEDIATE / ADVANCED
  tuitionFee?: number | null;      // học phí (BigDecimal -> number)
  totalSessions?: number | null;   // số buổi trong khoá
  status?: string | null;          // ACTIVE / INACTIVE
};

// Form tạo / sửa course
type CreateCourseForm = {
  code: string;
  name: string;
  description: string;
  instrument: string;
  level: string;
  tuitionFee: string;       // giữ string, khi gửi convert sang number
  totalSessions: string;    // string -> number
  status: string;
};

const emptyForm: CreateCourseForm = {
  code: "",
  name: "",
  description: "",
  instrument: "",
  level: "BEGINNER",
  tuitionFee: "",
  totalSessions: "",
  status: "ACTIVE",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // NEW: đang sửa khóa học nào (null = đang tạo mới)
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateCourseForm>(emptyForm);

  // ===== Load danh sách khoá học =====
  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CourseItem[]>("/admin/courses");
      setCourses(res.data || []);
    } catch (err: any) {
      console.error("❌ Lỗi load courses:", err);
      setError("Không tải được danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // ===== Helpers mở / đóng form =====
  const openCreateForm = () => {
    setEditingCourseId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCourseId(null);
    setForm(emptyForm);
  };

  // ===== Handle form =====
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Payload khớp CreateCourseRequest / UpdateCourseRequest bên BE
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || null,
      instrument: form.instrument || null,
      level: form.level || null,
      totalSessions: form.totalSessions ? Number(form.totalSessions) : null,
      tuitionFee: form.tuitionFee ? Number(form.tuitionFee) : null,
      status: form.status || "ACTIVE",
      note: null,
    };

    try {
      if (editingCourseId === null) {
        // Tạo mới
        await api.post("/admin/courses", payload);
      } else {
        // Cập nhật
        await api.put(`/admin/courses/${editingCourseId}`, payload);
      }

      await loadCourses();
      closeForm();
    } catch (err: any) {
      console.error("❌ Lỗi lưu course:", err);
      setError(
        editingCourseId === null
          ? "Không tạo được khóa học (check log BE / payload)."
          : "Không cập nhật được khóa học (check log BE / payload)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ===== NEW: mở form SỬA với dữ liệu có sẵn =====
  const handleEdit = (course: CourseItem) => {
    setEditingCourseId(course.id);
    setForm({
      code: course.code,
      name: course.name,
      description: course.description ?? "",
      instrument: course.instrument ?? "",
      level: course.level ?? "BEGINNER",
      tuitionFee:
        course.tuitionFee !== null && course.tuitionFee !== undefined
          ? String(course.tuitionFee)
          : "",
      totalSessions:
        course.totalSessions !== null && course.totalSessions !== undefined
          ? String(course.totalSessions)
          : "",
      status: course.status ?? "ACTIVE",
    });
    setShowForm(true);
  };

  // ===== NEW: XÓA khóa học =====
  const handleDelete = async (id: number) => {
    const ok = window.confirm(
      "Bạn có chắc chắn muốn xóa khóa học này?\nLưu ý: nếu đã có dữ liệu liên quan, BE có thể không cho xóa."
    );
    if (!ok) return;

    try {
      await api.delete(`/admin/courses/${id}`);
      await loadCourses();
    } catch (err: any) {
      console.error("❌ Lỗi xóa course:", err);
      setError("Không xóa được khóa học (kiểm tra log BE / ràng buộc dữ liệu).");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Quản lý khóa học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo và quản lý danh sách khóa học ở Solo Music Academy.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm && editingCourseId === null) {
              // đang mở form tạo mới → đóng
              closeForm();
            } else {
              // mở form tạo mới (reset khỏi chế độ sửa)
              openCreateForm();
            }
          }}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          {showForm && editingCourseId === null
            ? "Đóng form"
            : "Thêm khóa học"}
        </button>
      </div>

      {/* Lỗi chung */}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {/* Form tạo / sửa khóa học */}
      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            {editingCourseId ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}
          </h2>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mã khóa học
                </label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="VD: PIANO_BEGINNER_01"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tên khóa học
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Piano cơ bản cho thiếu nhi"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nhạc cụ
                </label>
                <input
                  name="instrument"
                  value={form.instrument}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Piano / Guitar / Vocal..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cấp độ
                </label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Học phí (VND)
                </label>
                <input
                  name="tuitionFee"
                  value={form.tuitionFee}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="VD: 3000000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tổng số buổi
                </label>
                <input
                  name="totalSessions"
                  value={form.totalSessions}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="VD: 16"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Mô tả ngắn về nội dung khóa học, đối tượng học viên, mục tiêu..."
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {submitting
                    ? editingCourseId
                      ? "Đang cập nhật..."
                      : "Đang lưu..."
                    : editingCourseId
                    ? "Cập nhật khóa học"
                    : "Lưu khóa học"}
                </button>
                {editingCourseId && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="px-3 py-2 rounded-lg text-xs bg-slate-100 hover:bg-slate-200"
                    disabled={submitting}
                  >
                    + Tạo khóa học mới
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Bảng danh sách khóa học */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Danh sách khóa học ({courses.length})
        </h2>

        {loading ? (
          <div className="text-sm text-slate-500">Đang tải...</div>
        ) : courses.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có khóa học nào. Hãy bấm &quot;Thêm khóa học&quot; để tạo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border px-2 py-1 text-left">ID</th>
                  <th className="border px-2 py-1 text-left">Mã khóa</th>
                  <th className="border px-2 py-1 text-left">Tên khóa học</th>
                  <th className="border px-2 py-1 text-left">Nhạc cụ</th>
                  <th className="border px-2 py-1 text-left">Cấp độ</th>
                  <th className="border px-2 py-1 text-left">Học phí</th>
                  <th className="border px-2 py-1 text-left">Tổng buổi</th>
                  <th className="border px-2 py-1 text-left">Trạng thái</th>
                  {/* NEW: cột thao tác */}
                  <th className="border px-2 py-1 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">{c.id}</td>
                    <td className="border px-2 py-1">{c.code}</td>
                    <td className="border px-2 py-1">{c.name}</td>
                    <td className="border px-2 py-1">
                      {c.instrument || "-"}
                    </td>
                    <td className="border px-2 py-1">{c.level || "-"}</td>
                    <td className="border px-2 py-1">
                      {c.tuitionFee != null
                        ? c.tuitionFee.toLocaleString("vi-VN")
                        : "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {c.totalSessions ?? "-"}
                    </td>
                    <td className="border px-2 py-1">{c.status || "-"}</td>
                    <td className="border px-2 py-1 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="px-2 py-1 text-xs rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="px-2 py-1 text-xs rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// src/pages/admin/AdminStudentsPage.tsx
import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

// Kiểu map với StudentListResponse bên BE
type Student = {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;

  parentName: string | null;
  parentPhone: string | null;

  lessonType: string | null;
  scheduleText: string | null;

  totalSessions: number | null;
  completedSessions: number | null;
  remainingSessions: number | null;

  status: string;
  mainTeacherName?: string | null;
  careStaffName?: string | null;
  courseId?: number | null;
  courseName?: string | null;
};

// Form tạo / sửa học viên – CHỈ giữ field thuộc về Student
type CreateStudentForm = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;

  parentName: string;
  parentPhone: string;
  parentEmail: string;

  status: string;
  note: string;
};

const emptyForm: CreateStudentForm = {
  username: "",
  password: "",
  fullName: "",
  email: "",
  phone: "",
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  status: "ACTIVE",
  note: "",
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateStudentForm>(emptyForm);

  // NEW: đang chỉnh sửa học viên nào (null = đang tạo mới)
  const [editingId, setEditingId] = useState<number | null>(null);

  // ===== Load danh sách học viên =====
  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Student[]>("/admin/students");
      setStudents(res.data || []);
    } catch (err: any) {
      console.error("❌ Lỗi load students:", err);
      setError("Không tải được danh sách học viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
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

  // Mở form tạo mới
  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  // Toggle nút trên header
  const handleToggleForm = () => {
    if (showForm) {
      setShowForm(false);
      resetForm();
    } else {
      openCreateForm();
    }
  };

  // Mở form sửa, prefill data từ row
  const openEditForm = (s: Student) => {
    setForm({
      username: s.username || "",
      password: "", // để trống, nếu muốn đổi sẽ nhập lại
      fullName: s.fullName || "",
      email: s.email || "",
      phone: s.phone || "",
      parentName: s.parentName || "",
      parentPhone: s.parentPhone || "",
      parentEmail: "", // StudentListResponse chưa trả parentEmail, nên để trống
      status: s.status || "ACTIVE",
      note: "", // StudentListResponse chưa trả note, có thể bổ sung sau nếu cần
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  // Xóa học viên
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa học viên này?")) return;

    try {
      await api.delete(`/admin/students/${id}`);
      await loadStudents();
    } catch (err) {
      console.error("❌ Lỗi xóa học viên:", err);
      alert("Xóa học viên thất bại. Kiểm tra lại log BE / endpoint DELETE /admin/students/{id}");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: any = {
      username: form.username,
      // Nếu đang sửa và password trống thì có thể để BE hiểu là "không đổi mật khẩu"
      password: form.password || undefined,
      fullName: form.fullName,
      email: form.email || null,
      phone: form.phone || null,

      mainTeacherId: null,
      careStaffUserId: null,
      courseId: null,

      parentName: form.parentName || null,
      parentPhone: form.parentPhone || null,
      parentEmail: form.parentEmail || null,

      lessonType: null,
      scheduleText: null,
      currentTimeSlot: null,
      newTimeSlot: null,

      tuitionAmount: null,
      tuitionDueDate: null,
      tuitionPaidDate: null,

      totalSessions: null,
      completedSessions: null,
      remainingSessions: null,

      status: form.status || "ACTIVE",
      note: form.note || null,
    };

    // Nếu đang sửa mà không nhập mật khẩu thì bỏ field này đi để khỏi override về chuỗi rỗng
    if (editingId !== null && !form.password) {
      delete payload.password;
    }

    try {
      if (editingId === null) {
        // Tạo mới
        await api.post("/admin/students", payload);
      } else {
        // Cập nhật
        await api.put(`/admin/students/${editingId}`, payload);
      }

      await loadStudents();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error("❌ Lỗi lưu student:", err);
      setError(
        editingId === null
          ? "Không tạo được học viên (kiểm tra log BE, hoặc cấu hình CreateStudentRequest)."
          : "Không cập nhật được học viên (kiểm tra log BE / endpoint update)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Quản lý học viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem danh sách và thêm / chỉnh sửa học viên. Thông tin khoá học / gói học
            sẽ gán sau.
          </p>
        </div>

        <button
          onClick={handleToggleForm}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          {showForm ? "Đóng form" : "Thêm học viên"}
        </button>
      </div>

      {/* Lỗi chung */}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {/* Form tạo / sửa học viên */}
      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            {editingId ? "Chỉnh sửa học viên" : "Thêm học viên mới"}
          </h2>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/* Cột 1 */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Username
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required
                  disabled={!!editingId} // không cho đổi username khi sửa
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Mật khẩu tạm
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required={!editingId}
                  placeholder={editingId ? "Để trống nếu không đổi mật khẩu" : ""}
                />
                {editingId && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Để trống nếu không muốn đổi mật khẩu.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Họ tên học viên
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email học viên
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  SĐT học viên
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
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
                  <option value="ACTIVE">Đang học</option>
                  <option value="PAUSED">Tạm dừng</option>
                  <option value="STOPPED">Ngưng</option>
                </select>
              </div>
            </div>

            {/* Cột 2 */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tên phụ huynh
                </label>
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  SĐT phụ huynh
                </label>
                <input
                  name="parentPhone"
                  value={form.parentPhone}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email phụ huynh
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  value={form.parentEmail}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {submitting
                  ? editingId
                    ? "Đang cập nhật..."
                    : "Đang lưu..."
                  : editingId
                  ? "Cập nhật học viên"
                  : "Lưu học viên"}
              </button>
              {showForm && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200"
                  disabled={submitting}
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Bảng danh sách học viên */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Danh sách học viên ({students.length})
        </h2>

        {loading ? (
          <div className="text-sm text-slate-500">Đang tải...</div>
        ) : students.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có học viên nào. Hãy bấm &quot;Thêm học viên&quot; để tạo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border px-2 py-1 text-left">ID</th>
                  <th className="border px-2 py-1 text-left">Username</th>
                  <th className="border px-2 py-1 text-left">Họ tên</th>
                  <th className="border px-2 py-1 text-left">Khóa học</th>
                  <th className="border px-2 py-1 text-left">GV chính</th>
                  <th className="border px-2 py-1 text-left">CSKH</th>
                  <th className="border px-2 py-1 text-left">Tổng buổi</th>
                  <th className="border px-2 py-1 text-left">Còn lại</th>
                  <th className="border px-2 py-1 text-left">Trạng thái</th>
                  {/* Lịch sử CSKH */}
                  <th className="border px-2 py-1 text-left">Lịch sử CSKH</th>
                  {/* Gói học / Hợp đồng */}
                  <th className="border px-2 py-1 text-left">
                    Gói học / Hợp đồng
                  </th>
                  {/* Thao tác */}
                  <th className="border px-2 py-1 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">{s.id}</td>
                    <td className="border px-2 py-1">{s.username}</td>
                    <td className="border px-2 py-1">{s.fullName}</td>
                    <td className="border px-2 py-1">
                      {s.courseName || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {s.mainTeacherName || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {s.careStaffName || "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {s.totalSessions ?? "-"}
                    </td>
                    <td className="border px-2 py-1">
                      {s.remainingSessions ?? "-"}
                    </td>
                    <td className="border px-2 py-1">{s.status}</td>

                    {/* Xem log CSKH */}
                    <td className="border px-2 py-1">
                      <Link
                        to={`/admin/students/${s.id}/care-history`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Xem log
                      </Link>
                    </td>

                    {/* Gói học / Hợp đồng */}
                    <td className="border px-2 py-1">
                      <Link
                        to={`/admin/packages?studentId=${s.id}`}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        Gói học / Hợp đồng
                      </Link>
                    </td>

                    {/* Thao tác: Sửa + Xóa */}
                    <td className="border px-2 py-1 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          type="button"
                          onClick={() => openEditForm(s)}
                          className="px-2 py-1 text-xs rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
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

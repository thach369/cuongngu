// src/pages/admin/AdminTeachersPage.tsx
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import api from "../../utils/api";

type Teacher = {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  instrument: string | null;
  gender: string | null;
  position: string | null;
  teachingType: string | null;
  status: string | null;
  note: string | null;
};

type CreateTeacherForm = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  instrument: string;
  gender: string;
  position: string;
  teachingType: string;
  status: string;
  note: string;
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateTeacherForm>({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    instrument: "",
    gender: "OTHER",
    position: "JUNIOR",
    teachingType: "PART_TIME",
    status: "ACTIVE",
    note: "",
  });

  // ===== Load danh sách giáo viên =====
  const loadTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Teacher[]>("/admin/teachers");
      setTeachers(res.data || []);
    } catch (err: any) {
      console.error("❌ Lỗi load teachers:", err);
      setError("Không tải được danh sách giáo viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // ===== Helpers hiển thị enum =====
  const renderGender = (g: string | null) => {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (!g) return "";
    return "Khác";
  };

  const renderPosition = (p: string | null) => {
    if (p === "JUNIOR") return "Junior";
    if (p === "SENIOR") return "Senior";
    if (p === "HEADTEACHER") return "Trưởng bộ môn";
    return p || "";
  };

  const renderTeachingType = (t: string | null) => {
    if (t === "FULL_TIME") return "Full-time";
    if (t === "PART_TIME") return "Part-time";
    return t || "";
  };

  const renderStatus = (s: string | null) => {
    if (s === "ACTIVE") return "Đang dạy";
    if (s === "TEMP_STOP") return "Tạm dừng";
    if (s === "QUIT") return "Nghỉ";
    return s || "";
  };

  // ===== Handle form =====
  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      instrument: "",
      gender: "OTHER",
      position: "JUNIOR",
      teachingType: "PART_TIME",
      status: "ACTIVE",
      note: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId === null) {
        // TẠO MỚI
        await api.post("/admin/teachers", form);
      } else {
        // CẬP NHẬT (không gửi username/password)
        const updatePayload = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          instrument: form.instrument,
          gender: form.gender,
          position: form.position,
          teachingType: form.teachingType,
          status: form.status,
          note: form.note,
        };
        await api.put(`/admin/teachers/${editingId}`, updatePayload);
      }

      await loadTeachers();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error("❌ Lỗi lưu teacher:", err);
      setError("Không lưu được giáo viên (kiểm tra lại dữ liệu hoặc log BE)");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (t: Teacher) => {
    setShowForm(true);
    setEditingId(t.id);
    setForm({
      username: t.username,
      password: "",
      fullName: t.fullName || "",
      email: t.email || "",
      phone: t.phone || "",
      instrument: t.instrument || "",
      gender: t.gender || "OTHER",
      position: t.position || "JUNIOR",
      teachingType: t.teachingType || "PART_TIME",
      status: t.status || "ACTIVE",
      note: t.note || "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa giáo viên này?")) return;
    setError(null);
    try {
      await api.delete(`/admin/teachers/${id}`);
      await loadTeachers();
    } catch (err: any) {
      console.error("❌ Lỗi xóa teacher:", err);
      setError("Không xóa được giáo viên");
    }
  };

  const toggleForm = () => {
    if (showForm && editingId !== null) {
      // đang sửa mà bấm Đóng form → reset luôn
      resetForm();
    }
    setShowForm((prev) => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Quản lý giáo viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem danh sách, thêm, sửa, xóa giáo viên.
          </p>
        </div>

        <button
          onClick={toggleForm}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          {showForm
            ? "Đóng form"
            : editingId === null
            ? "Thêm giáo viên"
            : "Sửa giáo viên"}
        </button>
      </div>

      {/* Thông báo lỗi chung */}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {/* Form tạo / sửa giáo viên */}
      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            {editingId === null
              ? "Thêm giáo viên mới"
              : `Sửa giáo viên #${editingId}`}
          </h2>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/* Cột 1 */}
            <div className="space-y-3">
              {/* Username chỉ cho nhập khi tạo mới */}
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
                  disabled={editingId !== null}
                />
              </div>

              {/* Password chỉ khi tạo mới */}
              {editingId === null && (
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
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Họ tên
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
                  Email
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
                  Số điện thoại
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Cột 2 */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nhạc cụ
                </label>
                <input
                  name="instrument"
                  value={form.instrument}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Piano, Guitar, Vocal..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Giới tính
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Vị trí
                </label>
                <select
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="JUNIOR">Junior</option>
                  <option value="SENIOR">Senior</option>
                  <option value="HEADTEACHER">Trưởng bộ môn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Hình thức dạy
                </label>
                <select
                  name="teachingType"
                  value={form.teachingType}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                </select>
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
                  <option value="ACTIVE">Đang dạy</option>
                  <option value="TEMP_STOP">Tạm dừng</option>
                  <option value="QUIT">Nghỉ</option>
                </select>
              </div>
            </div>

            {/* Ghi chú + nút submit (full width) */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {submitting
                  ? "Đang lưu..."
                  : editingId === null
                  ? "Lưu giáo viên"
                  : "Cập nhật giáo viên"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bảng danh sách giáo viên */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Danh sách giáo viên ({teachers.length})
        </h2>

        {loading ? (
          <div className="text-sm text-slate-500">Đang tải...</div>
        ) : teachers.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có giáo viên nào. Hãy bấm &quot;Thêm giáo viên&quot; để tạo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border px-2 py-1 text-left">ID</th>
                  <th className="border px-2 py-1 text-left">Username</th>
                  <th className="border px-2 py-1 text-left">Họ tên</th>
                  <th className="border px-2 py-1 text-left">Giới tính</th>
                  <th className="border px-2 py-1 text-left">Nhạc cụ</th>
                  <th className="border px-2 py-1 text-left">Vị trí</th>
                  <th className="border px-2 py-1 text-left">Hình thức</th>
                  <th className="border px-2 py-1 text-left">Email</th>
                  <th className="border px-2 py-1 text-left">SĐT</th>
                  <th className="border px-2 py-1 text-left">Trạng thái</th>
                  <th className="border px-2 py-1 text-left">Ghi chú</th>
                  <th className="border px-2 py-1 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">{t.id}</td>
                    <td className="border px-2 py-1">{t.username}</td>
                    <td className="border px-2 py-1">{t.fullName}</td>
                    <td className="border px-2 py-1">
                      {renderGender(t.gender)}
                    </td>
                    <td className="border px-2 py-1">{t.instrument}</td>
                    <td className="border px-2 py-1">
                      {renderPosition(t.position)}
                    </td>
                    <td className="border px-2 py-1">
                      {renderTeachingType(t.teachingType)}
                    </td>
                    <td className="border px-2 py-1">{t.email}</td>
                    <td className="border px-2 py-1">{t.phone}</td>
                    <td className="border px-2 py-1">
                      {renderStatus(t.status)}
                    </td>
                    <td className="border px-2 py-1">{t.note}</td>
                    <td className="border px-2 py-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(t)}
                          className="px-2 py-1 text-xs rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-700 hover:bg-red-200"
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

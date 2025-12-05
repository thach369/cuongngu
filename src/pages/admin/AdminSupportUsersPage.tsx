import { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

// Map với SupportUserSummaryResponse bên BE
type SupportUserSummary = {
  id: number;
  fullName: string;
  phone: string | null;
  email: string | null;
  totalStudents: number;
  totalCareRecords: number;
  lastCareTime: string | null;
};

// Map với CreateSupportUserRequest bên BE
type CreateSupportForm = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
};

export default function AdminSupportUsersPage() {
  const [items, setItems] = useState<SupportUserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateSupportForm>({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    status: "ACTIVE",
  });

  // ===== Load list support users =====
  const loadSupportUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SupportUserSummary[]>("/admin/support/users");
      setItems(res.data || []);
    } catch (err: any) {
      console.error("❌ Lỗi load support users:", err);
      setError("Không tải được danh sách tài khoản CSKH");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportUsers();
  }, []);

  // ===== Form =====
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

    const payload = {
      username: form.username,
      password: form.password,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      status: form.status || "ACTIVE",
    };

    try {
      await api.post("/admin/support-users", payload);
      await loadSupportUsers();
      setShowForm(false);
      setForm({
        username: "",
        password: "",
        fullName: "",
        email: "",
        phone: "",
        status: "ACTIVE",
      });
    } catch (err: any) {
      console.error("❌ Lỗi tạo support user:", err);
      setError("Không tạo được tài khoản CSKH (kiểm tra log BE)");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString("vi-VN");
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Tài khoản CSKH
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý user CSKH, xem số học viên đang phụ trách & số lần CSKH.
          </p>
        </div>

        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          {showForm ? "Đóng form" : "Tạo tài khoản CSKH"}
        </button>
      </div>

      {/* Lỗi chung */}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {/* Form tạo support user */}
      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Tạo tài khoản CSKH mới
          </h2>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
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
                  required
                />
              </div>

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
            </div>

            <div className="space-y-3">
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

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : "Lưu tài khoản CSKH"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bảng danh sách CSKH */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Danh sách tài khoản CSKH ({items.length})
        </h2>

        {loading ? (
          <div className="text-sm text-slate-500">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có tài khoản CSKH nào. Hãy bấm &quot;Tạo tài khoản CSKH&quot;
            để thêm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="border px-2 py-1 text-left">ID</th>
                  <th className="border px-2 py-1 text-left">Họ tên</th>
                  <th className="border px-2 py-1 text-left">Email</th>
                  <th className="border px-2 py-1 text-left">SĐT</th>
                  <th className="border px-2 py-1 text-left">Số học viên</th>
                  <th className="border px-2 py-1 text-left">Số log CSKH</th>
                  <th className="border px-2 py-1 text-left">CSKH gần nhất</th>
                  <th className="border px-2 py-1 text-left">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="border px-2 py-1">{u.id}</td>
                    <td className="border px-2 py-1">{u.fullName}</td>
                    <td className="border px-2 py-1">{u.email || "-"}</td>
                    <td className="border px-2 py-1">{u.phone || "-"}</td>
                    <td className="border px-2 py-1">{u.totalStudents}</td>
                    <td className="border px-2 py-1">{u.totalCareRecords}</td>
                    <td className="border px-2 py-1">
                      {formatDateTime(u.lastCareTime)}
                    </td>
                    <td className="border px-2 py-1">
                      <Link
                        to={`/admin/support/${u.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Xem chi tiết
                      </Link>
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

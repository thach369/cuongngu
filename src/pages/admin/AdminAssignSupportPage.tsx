import { useEffect, useState } from "react";
import api from "../../utils/api";

type StudentForAssign = {
  id: number;
  fullName: string;
  courseName?: string | null;
  remainingSessions?: number | null;
  status: string;
  careStaffName?: string | null;
};

type SupportUser = {
  id: number;
  fullName: string;
  email?: string | null;
};

export default function AdminAssignSupportPage() {
  const [students, setStudents] = useState<StudentForAssign[]>([]);
  const [supports, setSupports] = useState<SupportUser[]>([]);
  const [selectedSupportMap, setSelectedSupportMap] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, supRes] = await Promise.all([
        api.get("/admin/students"),
        api.get("/admin/support/users"),
      ]);

      const stuList: StudentForAssign[] = (stuRes.data || []).map((s: any) => ({
        id: s.id,
        fullName: s.fullName,
        courseName: s.courseName,
        remainingSessions: s.remainingSessions,
        status: s.status,
        careStaffName: s.careStaffName,
      }));

      const supList: SupportUser[] = (supRes.data || []).map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
      }));

      setStudents(stuList);
      setSupports(supList);
    } catch (err: any) {
      console.error("❌ Lỗi load dữ liệu phân công CSKH:", err);
      setError("Không tải được dữ liệu phân công CSKH");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectChange = (studentId: number, value: string) => {
    setSelectedSupportMap((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleAssign = async (studentId: number) => {
    const supportIdStr = selectedSupportMap[studentId];
    if (!supportIdStr) {
      alert("Hãy chọn 1 nhân viên CSKH trước khi gán");
      return;
    }

    const supportUserId = Number(supportIdStr);
    if (!supportUserId) return;

    setAssigningId(studentId);
    setError(null);
    try {
      await api.put("/admin/students/assign-support", {
        studentId,
        supportUserId,
      });
      await loadData();
    } catch (err: any) {
      console.error("❌ Lỗi gán CSKH:", err);
      setError("Không gán được CSKH, kiểm tra log BE");
    } finally {
      setAssigningId(null);
    }
  };

  const studentsWithoutSupport = students.filter((s) => !s.careStaffName);
  const studentsWithSupport = students.filter((s) => !!s.careStaffName);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Phân công CSKH
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gán / thay đổi nhân viên CSKH phụ trách từng học viên.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Học viên chưa có CSKH */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Học viên chưa có CSKH ({studentsWithoutSupport.length})
            </h2>

            {studentsWithoutSupport.length === 0 ? (
              <div className="text-sm text-slate-500">
                Tất cả học viên đều đã được gán CSKH.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="border px-2 py-1 text-left">ID</th>
                      <th className="border px-2 py-1 text-left">Họ tên</th>
                      <th className="border px-2 py-1 text-left">Khóa học</th>
                      <th className="border px-2 py-1 text-left">Buổi còn lại</th>
                      <th className="border px-2 py-1 text-left">Chọn CSKH</th>
                      <th className="border px-2 py-1 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsWithoutSupport.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="border px-2 py-1">{s.id}</td>
                        <td className="border px-2 py-1">{s.fullName}</td>
                        <td className="border px-2 py-1">{s.courseName || "-"}</td>
                        <td className="border px-2 py-1">
                          {s.remainingSessions ?? "-"}
                        </td>
                        <td className="border px-2 py-1">
                          <select
                            className="border rounded-md px-2 py-1 text-xs"
                            value={selectedSupportMap[s.id] || ""}
                            onChange={(e) =>
                              handleSelectChange(s.id, e.target.value)
                            }
                          >
                            <option value="">-- Chọn CSKH --</option>
                            {supports.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName}
                                {u.email ? ` - ${u.email}` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border px-2 py-1">
                          <button
                            onClick={() => handleAssign(s.id)}
                            disabled={assigningId === s.id}
                            className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-500 disabled:opacity-60"
                          >
                            {assigningId === s.id ? "Đang gán..." : "Gán CSKH"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Học viên đã có CSKH */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Học viên đã có CSKH ({studentsWithSupport.length})
            </h2>

            {studentsWithSupport.length === 0 ? (
              <div className="text-sm text-slate-500">
                Chưa có học viên nào được gán CSKH.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="border px-2 py-1 text-left">ID</th>
                      <th className="border px-2 py-1 text-left">Họ tên</th>
                      <th className="border px-2 py-1 text-left">Khóa học</th>
                      <th className="border px-2 py-1 text-left">Buổi còn lại</th>
                      <th className="border px-2 py-1 text-left">CSKH hiện tại</th>
                      <th className="border px-2 py-1 text-left">Đổi sang</th>
                      <th className="border px-2 py-1 text-left">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsWithSupport.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="border px-2 py-1">{s.id}</td>
                        <td className="border px-2 py-1">{s.fullName}</td>
                        <td className="border px-2 py-1">{s.courseName || "-"}</td>
                        <td className="border px-2 py-1">
                          {s.remainingSessions ?? "-"}
                        </td>
                        <td className="border px-2 py-1">
                          {s.careStaffName || "-"}
                        </td>
                        <td className="border px-2 py-1">
                          <select
                            className="border rounded-md px-2 py-1 text-xs"
                            value={selectedSupportMap[s.id] || ""}
                            onChange={(e) =>
                              handleSelectChange(s.id, e.target.value)
                            }
                          >
                            <option value="">-- Giữ nguyên --</option>
                            {supports.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName}
                                {u.email ? ` - ${u.email}` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border px-2 py-1">
                          <button
                            onClick={() => handleAssign(s.id)}
                            disabled={assigningId === s.id}
                            className="px-3 py-1 rounded-md bg-slate-800 text-white text-xs hover:bg-slate-700 disabled:opacity-60"
                          >
                            {assigningId === s.id ? "Đang gán..." : "Cập nhật CSKH"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

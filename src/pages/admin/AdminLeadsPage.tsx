// src/pages/admin/AdminLeadsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

type LeadAdminItem = {
  id: number;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;

  studentName: string | null;
  studentAge: number | null;

  instrument: string | null;
  lessonType: string | null;
  level: string | null;
  preferredSchedule: string | null;

  source: string | null;
  status: string | null;

  createdAt: string | null;
  lastCareTime: string | null;
  nextCareTime: string | null;

  supportUserId: number | null;
  supportFullName: string | null;
};

type SupportUserOption = {
  id: number;
  fullName: string;
};

type LeadForm = {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  studentName: string;
  studentAge: string;
  instrument: string;
  lessonType: string;
  level: string;
  preferredSchedule: string;
  source: string;
  status: string;
};

const emptyForm: LeadForm = {
  parentName: "",
  parentPhone: "",
  parentEmail: "",
  studentName: "",
  studentAge: "",
  instrument: "",
  lessonType: "",
  level: "",
  preferredSchedule: "",
  source: "",
  status: "",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadAdminItem[]>([]);
  const [supportUsers, setSupportUsers] = useState<SupportUserOption[]>([]);
  const [selectedSupportId, setSelectedSupportId] = useState<number | null>(
    null
  );
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<LeadForm>(emptyForm);

  const [editingLead, setEditingLead] = useState<LeadAdminItem | null>(null);
  const [editForm, setEditForm] = useState<LeadForm>(emptyForm);

  const navigate = useNavigate();

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<LeadAdminItem[]>("/admin/leads");
      setLeads(res.data || []);
    } catch (err) {
      console.error("❌ Lỗi load leads (admin):", err);
      setError("Không tải được danh sách khách hàng tiềm năng.");
    } finally {
      setLoading(false);
    }
  };

  const loadSupportUsers = async () => {
    try {
      // Dùng chung endpoint với trang phân công CSKH
      const res = await api.get("/admin/support/users");
      const data = res.data || [];

      const list: SupportUserOption[] = (data as any[]).map((u: any) => ({
        id: u.id,
        fullName: u.fullName || u.username || `#${u.id}`,
      }));

      setSupportUsers(list);
    } catch (err) {
      console.error("❌ Lỗi load danh sách CSKH (leads):", err);
    }
  };

  useEffect(() => {
    loadLeads();
    loadSupportUsers();
  }, []);

  const toggleSelectLead = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    leads.length > 0 && selectedLeadIds.length === leads.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString(
        "vi-VN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
    } catch {
      return iso || "";
    }
  };

  const renderStatusBadge = (status?: string | null) => {
    const s = (status || "").toUpperCase();
    let cls = "bg-slate-100 text-slate-700";
    let label = status || "Chưa rõ";

    if (s === "NEW") {
      cls = "bg-sky-100 text-sky-700";
      label = "Mới";
    } else if (s === "CONTACTED") {
      cls = "bg-emerald-100 text-emerald-700";
      label = "Đã liên hệ";
    } else if (s === "TRIAL_BOOKED") {
      cls = "bg-amber-100 text-amber-700";
      label = "Đã hẹn học thử";
    } else if (s === "TRIAL_DONE") {
      cls = "bg-indigo-100 text-indigo-700";
      label = "Đã học thử";
    } else if (s === "ENROLLED") {
      cls = "bg-emerald-200 text-emerald-800";
      label = "Đã đăng ký";
    } else if (s === "LOST") {
      cls = "bg-rose-100 text-rose-700";
      label = "Mất";
    }

    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${cls}`}>
        {label}
      </span>
    );
  };

  const buildPayloadFromForm = (form: LeadForm) => ({
    parentName: form.parentName || null,
    parentPhone: form.parentPhone || null,
    parentEmail: form.parentEmail || null,
    studentName: form.studentName || null,
    studentAge: form.studentAge ? Number(form.studentAge) : null,
    instrument: form.instrument || null,
    lessonType: form.lessonType || null,
    level: form.level || null,
    preferredSchedule: form.preferredSchedule || null,
    source: form.source || null,
    status: form.status || undefined,
  });

  // ===== CREATE =====
  const handleCreateChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = buildPayloadFromForm(createForm);
      await api.post("/admin/leads", body);
      setCreateForm(emptyForm);
      setShowCreateForm(false);
      await loadLeads();
    } catch (err) {
      console.error("❌ Lỗi tạo lead:", err);
      alert(
        "Tạo khách hàng tiềm năng thất bại. Kiểm tra lại dữ liệu hoặc log BE."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== EDIT =====
  const startEdit = (lead: LeadAdminItem) => {
    setEditingLead(lead);
    setEditForm({
      parentName: lead.parentName || "",
      parentPhone: lead.parentPhone || "",
      parentEmail: lead.parentEmail || "",
      studentName: lead.studentName || "",
      studentAge: lead.studentAge != null ? String(lead.studentAge) : "",
      instrument: lead.instrument || "",
      lessonType: lead.lessonType || "",
      level: lead.level || "",
      preferredSchedule: lead.preferredSchedule || "",
      source: lead.source || "",
      status: lead.status || "",
    });
  };

  const cancelEdit = () => {
    setEditingLead(null);
    setEditForm(emptyForm);
  };

  const handleEditChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      setSaving(true);
      const body = buildPayloadFromForm(editForm);
      await api.put(`/admin/leads/${editingLead.id}`, body);
      cancelEdit();
      await loadLeads();
    } catch (err) {
      console.error("❌ Lỗi cập nhật lead:", err);
      alert("Cập nhật khách hàng tiềm năng thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // ===== DELETE =====
  const handleDelete = async (leadId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá khách hàng tiềm năng này?"))
      return;
    try {
      await api.delete(`/admin/leads/${leadId}`);
      await loadLeads();
    } catch (err) {
      console.error("❌ Lỗi xoá lead:", err);
      alert("Xoá khách hàng tiềm năng thất bại. Kiểm tra lại log BE.");
    }
  };

  // ===== ASSIGN SUPPORT =====
  const handleAssign = async () => {
    if (!selectedSupportId) {
      alert("Vui lòng chọn tài khoản CSKH.");
      return;
    }
    if (selectedLeadIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 khách hàng tiềm năng.");
      return;
    }

    try {
      setAssigning(true);
      await api.post("/admin/leads/assign-support", {
        supportUserId: selectedSupportId,
        leadIds: selectedLeadIds,
      });
      await loadLeads();
      setSelectedLeadIds([]);
      alert("Gán CSKH cho khách hàng tiềm năng thành công.");
    } catch (err) {
      console.error("❌ Lỗi gán CSKH cho leads:", err);
      alert("Gán CSKH thất bại. Kiểm tra lại dữ liệu hoặc log BE.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-left">
          <h1 className="page-title">Khách hàng tiềm năng</h1>
          <p className="page-subtitle">
            Admin xem toàn bộ khách hàng tiềm năng, tạo/sửa/xoá và gán cho nhân
            viên CSKH phụ trách.
          </p>
        </div>

        <div className="page-header-right flex items-center gap-2">
          <select
            className="border rounded-lg px-2 py-1 text-sm min-w-[200px]"
            value={selectedSupportId ?? ""}
            onChange={(e) =>
              setSelectedSupportId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">Chọn nhân viên CSKH...</option>
            {supportUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={assigning}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 disabled:opacity-60"
          >
            {assigning ? "Đang gán..." : "Gán cho CSKH"}
          </button>

          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-500"
          >
            {showCreateForm ? "Đóng form tạo" : "Tạo khách hàng mới"}
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-lg bg-blue-50 text-blue-800 text-sm px-4 py-2 mb-3">
          Đang tải danh sách khách hàng tiềm năng...
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2 mb-3">
          {error}
        </div>
      )}

      {/* FORM TẠO LEAD */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Tạo khách hàng tiềm năng mới
          </h2>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
            onSubmit={handleCreateSubmit}
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tên phụ huynh
              </label>
              <input
                name="parentName"
                value={createForm.parentName}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Số điện thoại
              </label>
              <input
                name="parentPhone"
                value={createForm.parentPhone}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email phụ huynh
              </label>
              <input
                name="parentEmail"
                value={createForm.parentEmail}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tên bé
              </label>
              <input
                name="studentName"
                value={createForm.studentName}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tuổi bé
              </label>
              <input
                name="studentAge"
                value={createForm.studentAge}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nhạc cụ
              </label>
              <input
                name="instrument"
                value={createForm.instrument}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Hình thức học (1-1 / nhóm...)
              </label>
              <input
                name="lessonType"
                value={createForm.lessonType}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Level (Beginner / ...)
              </label>
              <input
                name="level"
                value={createForm.level}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Thời gian mong muốn
              </label>
              <input
                name="preferredSchedule"
                value={createForm.preferredSchedule}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
                placeholder="VD: T2/4/6 chiều, sau 18h..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nguồn (Facebook / Zalo / giới thiệu...)
              </label>
              <input
                name="source"
                value={createForm.source}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Trạng thái
              </label>
              <input
                name="status"
                value={createForm.status}
                onChange={handleCreateChange}
                className="w-full border rounded-lg px-2 py-1.5"
                placeholder="NEW / CONTACTED / ..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm(emptyForm);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Tạo lead"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORM SỬA LEAD */}
      {editingLead && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Sửa khách hàng tiềm năng #{editingLead.id}
          </h2>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
            onSubmit={handleEditSubmit}
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tên phụ huynh
              </label>
              <input
                name="parentName"
                value={editForm.parentName}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Số điện thoại
              </label>
              <input
                name="parentPhone"
                value={editForm.parentPhone}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email phụ huynh
              </label>
              <input
                name="parentEmail"
                value={editForm.parentEmail}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tên bé
              </label>
              <input
                name="studentName"
                value={editForm.studentName}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tuổi bé
              </label>
              <input
                name="studentAge"
                value={editForm.studentAge}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nhạc cụ
              </label>
              <input
                name="instrument"
                value={editForm.instrument}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Hình thức học
              </label>
              <input
                name="lessonType"
                value={editForm.lessonType}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Level
              </label>
              <input
                name="level"
                value={editForm.level}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Thời gian mong muốn
              </label>
              <input
                name="preferredSchedule"
                value={editForm.preferredSchedule}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nguồn
              </label>
              <input
                name="source"
                value={editForm.source}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Trạng thái
              </label>
              <input
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                className="w-full border rounded-lg px-2 py-1.5"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-500 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="border px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="border px-2 py-2 text-left">Khách hàng</th>
              <th className="border px-2 py-2 text-left">Bé / Nhu cầu</th>
              <th className="border px-2 py-2 text-left">
                Nguồn / Thời gian tạo
              </th>
              <th className="border px-2 py-2 text-center">Trạng thái</th>
              <th className="border px-2 py-2 text-left">CSKH phụ trách</th>
              <th className="border px-2 py-2 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="border px-3 py-4 text-center text-slate-500"
                >
                  Chưa có khách hàng tiềm năng nào.
                </td>
              </tr>
            ) : (
              leads.map((l) => {
                const checked = selectedLeadIds.includes(l.id);
                const assigned = !!l.supportUserId;

                return (
                  <tr
                    key={l.id}
                    className={
                      "transition-colors " +
                      (checked ? "bg-emerald-50" : "hover:bg-slate-50/60")
                    }
                  >
                    <td className="border px-2 py-2 text-center align-top">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectLead(l.id)}
                      />
                    </td>

                    {/* Khách hàng */}
                    <td className="border px-2 py-2 align-top">
                      <div className="font-medium text-slate-800">
                        {l.parentName || "(Chưa có tên phụ huynh)"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {l.parentPhone}
                      </div>
                      {l.parentEmail && (
                        <div className="text-[11px] text-slate-500">
                          {l.parentEmail}
                        </div>
                      )}
                    </td>

                    {/* Bé / nhu cầu */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">
                        {l.studentName || "(Chưa có tên bé)"}
                        {l.studentAge != null && ` • ${l.studentAge} tuổi`}
                      </div>
                      {l.instrument && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Nhạc cụ: {l.instrument}
                        </div>
                      )}
                      {l.lessonType && (
                        <div className="text-[11px] text-slate-500">
                          Hình thức: {l.lessonType}
                        </div>
                      )}
                      {l.preferredSchedule && (
                        <div className="text-[11px] text-slate-500">
                          Thời gian mong muốn: {l.preferredSchedule}
                        </div>
                      )}
                    </td>

                    {/* Nguồn / thời gian */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">{l.source || "-"}</div>
                      {l.createdAt && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Tạo: {formatDateTime(l.createdAt)}
                        </div>
                      )}
                      {l.lastCareTime && (
                        <div className="text-[11px] text-slate-500">
                          CSKH gần nhất: {formatDateTime(l.lastCareTime)}
                        </div>
                      )}
                      {l.nextCareTime && (
                        <div className="text-[11px] text-emerald-700">
                          CSKH tiếp theo: {formatDateTime(l.nextCareTime)}
                        </div>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="border px-2 py-2 align-top text-center">
                      {renderStatusBadge(l.status)}
                    </td>

                    {/* CSKH phụ trách */}
                    <td className="border px-2 py-2 align-top text-xs">
                      <div className="text-slate-800">
                        {assigned
                          ? l.supportFullName || `(ID ${l.supportUserId})`
                          : "Chưa gán"}
                      </div>
                      {assigned && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ID: {l.supportUserId}
                        </div>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="border px-2 py-2 align-top text-center">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() =>
                            navigate(`/admin/leads/${l.id}/care-history`)
                          }
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px]"
                        >
                          Lịch sử CSKH
                        </button>
                        <button
                          onClick={() => startEdit(l)}
                          className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-[11px] text-amber-800"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-[11px] text-rose-700"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

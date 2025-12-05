import { NavLink, useNavigate } from "react-router-dom";

export default function SupportSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xoá hết token / profile trong localStorage
    localStorage.clear();
    // Đẩy về trang login
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-50 min-h-screen flex flex-col">
      {/* HEADER */}
      <div className="px-4 py-4 border-b border-slate-800 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-lg font-bold">
          SP
        </div>
        <div>
          <div className="text-sm font-semibold">Chăm sóc khách hàng</div>
          <div className="text-xs text-slate-400">Support dashboard</div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
        <NavLink
          to="/support"
          end
          className={({ isActive }) =>
            "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-emerald-300" : "text-slate-200")
          }
        >
          <span>📚</span>
          <span>Học viên của tôi</span>
        </NavLink>

        <NavLink
          to="/support/leads"
          className={({ isActive }) =>
            "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-emerald-300" : "text-slate-200")
          }
        >
          <span>🌱</span>
          <span>Khách hàng tiềm năng</span>
        </NavLink>

        <NavLink
          to="/support/reminders"
          className={({ isActive }) =>
            "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-emerald-300" : "text-slate-200")
          }
        >
          <span>⏰</span>
          <span>Nhắc việc</span>
        </NavLink>
      </nav>

      {/* FOOTER + LOGOUT */}
      <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-400">Solo Music Academy • Support</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-100"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

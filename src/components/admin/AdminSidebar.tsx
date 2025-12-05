// src/components/admin/AdminSidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkBase =
    "block px-3 py-2 rounded-md mb-1 text-sm transition-colors";

  return (
    <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      {/* HEADER SIDEBAR */}
      <div className="px-4 py-4 border-b border-slate-700 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
          SM
        </div>
        <div>
          <div className="text-sm font-semibold">Solo Music</div>
          <div className="text-xs text-slate-400">Admin Panel</div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 py-3 text-sm">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Tổng quan
        </NavLink>

        <NavLink
          to="/admin/teachers"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Quản lý giáo viên
        </NavLink>

        <NavLink
          to="/admin/students"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Quản lý học viên
        </NavLink>

        <NavLink
          to="/admin/support-users"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Tài khoản CSKH
        </NavLink>

        {/* KHÁCH HÀNG TIỀM NĂNG */}
        <NavLink
          to="/admin/leads"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Khách hàng tiềm năng
        </NavLink>

        <NavLink
          to="/admin/courses"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Khóa học
        </NavLink>

        <NavLink
          to="/admin/assign-support"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Phân công CSKH
        </NavLink>

        <NavLink
          to="/admin/attendance"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Chấm công giáo viên
        </NavLink>

        <NavLink
          to="/admin/packages"
          className={({ isActive }) =>
            `${linkBase} ${
              isActive ? "bg-slate-700" : "hover:bg-slate-800 text-slate-200"
            }`
          }
        >
          Gói học / Hợp đồng
        </NavLink>
      </nav>

      {/* FOOTER / LOGOUT */}
      <button
        onClick={handleLogout}
        className="m-3 px-3 py-2 rounded-md text-xs bg-slate-800 hover:bg-slate-700"
      >
        Đăng xuất
      </button>
    </aside>
  );
}

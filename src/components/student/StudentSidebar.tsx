// src/components/student/StudentSidebar.tsx
import { NavLink } from "react-router-dom";

export default function StudentSidebar() {
  return (
    <aside className="w-56 sm:w-64 bg-slate-900 text-slate-100 flex flex-col">
      {/* HEADER */}
      <div className="px-4 py-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
          ST
        </div>
        <div>
          <div className="text-sm font-semibold">Student</div>
          <div className="text-xs text-slate-400">Solo Music Academy</div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 py-3 space-y-1 text-sm">
        <NavLink
          to="/student"
          end
          className={({ isActive }) =>
            "flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-white" : "text-slate-200")
          }
        >
          <span className="mr-2">🏠</span> Trang chủ
        </NavLink>

        <NavLink
          to="/student/schedule"
          className={({ isActive }) =>
            "flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-white" : "text-slate-200")
          }
        >
          <span className="mr-2">📅</span> Lịch học
        </NavLink>

        <NavLink
          to="/student/packages"
          className={({ isActive }) =>
            "flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-white" : "text-slate-200")
          }
        >
          <span className="mr-2">🎫</span> Gói học
        </NavLink>

        <NavLink
          to="/student/chat"
          className={({ isActive }) =>
            "flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 " +
            (isActive ? "bg-slate-800 text-white" : "text-slate-200")
          }
        >
          <span className="mr-2">💬</span> Chat CSKH
        </NavLink>
      </nav>
    </aside>
  );
}

// src/components/student/StudentLayout.tsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../utils/api";

type UserProfile = {
  fullName: string;
  roles: string[];
};

export default function StudentLayout() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<UserProfile>("/profile/user");
        setUser(res.data);

        // Nếu user không có ROLE_STUDENT thì đá về login
        if (!res.data.roles?.includes("ROLE_STUDENT")) {
          navigate("/login", { replace: true });
        }
      } catch (e) {
        console.error("❌ Lỗi load user profile student:", e);
        navigate("/login", { replace: true });
      }
    };
    load();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-slate-800">
          Solo Music Academy – Học viên
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user && (
            <span className="text-slate-600">
              Xin chào, <span className="font-medium">{user.fullName}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav className="bg-white border-b border-slate-200 px-4 flex gap-3 text-sm">
        <NavLink
          to="/student"
          end
          className={({ isActive }) =>
            "px-3 py-2 border-b-2 -mb-px" +
            (isActive
              ? " border-blue-600 text-blue-600 font-medium"
              : " border-transparent text-slate-600 hover:text-slate-800")
          }
        >
          Tổng quan
        </NavLink>
        <NavLink
          to="/student/schedule"
          className={({ isActive }) =>
            "px-3 py-2 border-b-2 -mb-px" +
            (isActive
              ? " border-blue-600 text-blue-600 font-medium"
              : " border-transparent text-slate-600 hover:text-slate-800")
          }
        >
          Lịch học
        </NavLink>
        <NavLink
          to="/student/chat"
          className={({ isActive }) =>
            "px-3 py-2 border-b-2 -mb-px" +
            (isActive
              ? " border-blue-600 text-blue-600 font-medium"
              : " border-transparent text-slate-600 hover:text-slate-800")
          }
        >
          Chat với CSKH
        </NavLink>
      </nav>

      {/* CONTENT */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}

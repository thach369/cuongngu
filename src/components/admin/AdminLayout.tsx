// src/components/admin/AdminLayout.tsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* SIDEBAR DÙNG CHUNG */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

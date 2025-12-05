// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

// ===== ADMIN =====
import AdminLayout from "./components/admin/AdminLayout";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminTeachersPage from "./pages/admin/AdminTeachersPage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminSupportUsersPage from "./pages/admin/AdminSupportUsersPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminAssignSupportPage from "./pages/admin/AdminAssignSupportPage";
import AdminStudentCareHistoryPage from "./pages/admin/AdminStudentCareHistoryPage";
import AdminSupportDetailPage from "./pages/admin/AdminSupportDetailPage";
import AdminAttendancePage from "./pages/admin/AdminAttendancePage";
import AdminPackagesPage from "./pages/admin/AdminPackagesPage";
import AdminLeadsPage from "./pages/admin/AdminLeadsPage";
import AdminLeadCareHistoryPage from "./pages/admin/AdminLeadCareHistoryPage";

// ===== STUDENT =====
import StudentLayout from "./components/student/StudentLayout";
import StudentHomePage from "./pages/student/StudentHomePage";
import StudentSchedulePage from "./pages/student/StudentSchedulePage";
import StudentChatPageStudent from "./pages/student/StudentChatPage";

// ===== SUPPORT (CSKH) =====
import SupportStudentsPage from "./pages/support/SupportStudentsPage";
import SupportRemindersPage from "./pages/support/SupportRemindersPage";
import StudentCareHistoryPage from "./pages/support/StudentCareHistoryPage";
import SupportStudentChatPage from "./pages/support/StudentChatPage";
import SupportLeadsPage from "./pages/support/SupportLeadsPage";
import LeadCareHistoryPage from "./pages/support/LeadCareHistoryPage";

export default function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* ================= ADMIN ================= */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* /admin */}
        <Route index element={<AdminHomePage />} />

        {/* /admin/teachers */}
        <Route path="teachers" element={<AdminTeachersPage />} />

        {/* /admin/students */}
        <Route path="students" element={<AdminStudentsPage />} />

        {/* /admin/students/:studentId/care-history */}
        <Route
          path="students/:studentId/care-history"
          element={<AdminStudentCareHistoryPage />}
        />

        {/* /admin/support-users */}
        <Route path="support-users" element={<AdminSupportUsersPage />} />

        {/* /admin/support/:supportUserId */}
        <Route
          path="support/:supportUserId"
          element={<AdminSupportDetailPage />}
        />

        {/* /admin/courses */}
        <Route path="courses" element={<AdminCoursesPage />} />

        {/* /admin/assign-support */}
        <Route path="assign-support" element={<AdminAssignSupportPage />} />

        {/* /admin/attendance */}
        <Route path="attendance" element={<AdminAttendancePage />} />

        {/* /admin/packages */}
        <Route path="packages" element={<AdminPackagesPage />} />

        {/* /admin/leads -> danh sách khách hàng tiềm năng */}
        <Route path="leads" element={<AdminLeadsPage />} />

        {/* /admin/leads/:leadId/care-history -> lịch sử CSKH lead */}
        <Route
          path="leads/:leadId/care-history"
          element={<AdminLeadCareHistoryPage />}
        />
      </Route>

      {/* ================= STUDENT ================= */}
      <Route path="/student" element={<StudentLayout />}>
        {/* /student */}
        <Route index element={<StudentHomePage />} />

        {/* /student/schedule */}
        <Route path="schedule" element={<StudentSchedulePage />} />

        {/* /student/chat */}
        <Route path="chat" element={<StudentChatPageStudent />} />

        {/* /student/packages (nếu cần xem gói học) */}
      </Route>

      {/* ================= SUPPORT (CSKH) ================= */}
      {/* /support -> danh sách học viên của CSKH */}
      <Route path="/support" element={<SupportStudentsPage />} />

      {/* /support/reminders -> nhắc việc CSKH */}
      <Route path="/support/reminders" element={<SupportRemindersPage />} />

      {/* /support/students/:studentId/history -> lịch sử CSKH học viên */}
      <Route
        path="/support/students/:studentId/history"
        element={<StudentCareHistoryPage />}
      />

      {/* /support/students/:studentId/chat -> chat với học viên */}
      <Route
        path="/support/students/:studentId/chat"
        element={<SupportStudentChatPage />}
      />

      {/* /support/leads -> danh sách khách hàng tiềm năng */}
      <Route path="/support/leads" element={<SupportLeadsPage />} />

      {/* /support/leads/:leadId/history -> timeline CSKH lead */}
      <Route
        path="/support/leads/:leadId/history"
        element={<LeadCareHistoryPage />}
      />

      {/* ROOT -> /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* PATH LẠ -> /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

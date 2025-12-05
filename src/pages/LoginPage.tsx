import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "../styles/auth.css";

type LoginResponse = {
  token: string;
  username: string;
  fullName: string;
  roles: string[];
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("▶ Gửi request login:", { username, password });

      const res = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
      });

      console.log("✅ Login success, response:", res.data);

      const data = res.data;

      // lưu token
      localStorage.setItem("token", data.token);

      const roles = data.roles || [];

      // ⭐ ƯU TIÊN SUPER_ADMIN → ADMIN → role đầu tiên
      let pickedRole = "";
      if (roles.includes("ROLE_SUPER_ADMIN")) {
        pickedRole = "ROLE_SUPER_ADMIN";
      } else if (roles.includes("ROLE_ADMIN")) {
        pickedRole = "ROLE_ADMIN";
      } else if (roles.length > 0) {
        pickedRole = roles[0];
      }

      localStorage.setItem("role", pickedRole);

      // ⭐ Map role → path, coi SUPER_ADMIN = admin
      const rolePathMap: Record<string, string> = {
        ROLE_SUPER_ADMIN: "/admin",
        ROLE_ADMIN: "/admin",
        ROLE_SUPPORT: "/support",
        ROLE_TEACHER: "/teacher",
        ROLE_STUDENT: "/student",
      };

      const redirectTo = rolePathMap[pickedRole] || "/login";

      console.log("➡ Redirect with role =", pickedRole, "to", redirectTo);

      navigate(redirectTo);
    } catch (err: any) {
      console.error("❌ LOGIN ERROR (axios):", err);

      if (err.response) {
        if (err.response.status === 401) {
          const msg =
            typeof err.response.data === "string"
              ? err.response.data
              : "Sai tên đăng nhập hoặc mật khẩu";
          setError(msg);
        } else {
          setError("Lỗi server: " + err.response.status);
        }
      } else {
        setError("Không kết nối được server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo-circle">SM</div>
          <div>
            <div className="auth-title">Solo Music Academy</div>
            <div className="auth-subtitle">Đăng nhập hệ thống</div>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Tên đăng nhập
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username..."
              required
            />
          </label>

          <label className="auth-label">
            Mật khẩu
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

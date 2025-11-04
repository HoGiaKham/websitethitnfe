import React, { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const userInfo = {
          _id: data.user._id,
          username: data.user.username,
          role: data.user.role,
          name: data.user.name,
          subjects: data.user.subjects || [], // 🔥 thêm subjects nếu giảng viên
        };

        // Lưu vào localStorage để các page khác dùng
        // localStorage.setItem("currentUser", JSON.stringify(userInfo));
localStorage.setItem("app_user", JSON.stringify(userInfo));

        onLogin(userInfo);
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Lỗi server");
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={{ marginBottom: 12 }}>Đăng nhập</h2>

        <label style={styles.label}>Tài khoản</label>
        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="gv001 hoặc sv001"
        />

        <label style={styles.label}>Mật khẩu</label>
        <input
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="123456"
        />

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" style={styles.btn}>
          Đăng nhập
        </button>

        <div style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
          Test bằng acc này:
          <div>giảng viên: gv001 / 123456</div>
          <div>sv: sv001 / 123456</div>
          <div>admin: admin / 123456</div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100%",
    background: "#f4f6fb",
  },
  form: {
    width: 360,
    padding: 24,
    borderRadius: 8,
    boxShadow: "0 6px 18px rgba(20,20,50,0.08)",
    background: "#fff",
  },
  label: { fontSize: 13, marginTop: 8 },
  input: {
    width: "100%",
    padding: "8px 10px",
    marginTop: 6,
    borderRadius: 6,
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  btn: {
    marginTop: 16,
    width: "100%",
    padding: "10px 12px",
    background: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    marginTop: 10,
    color: "crimson",
    fontSize: 14,
  },
};

export default Login;

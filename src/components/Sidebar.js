import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Sidebar.css";

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
const currentUser = user || JSON.parse(localStorage.getItem("app_user") || "{}");


  return (
    <div className="sidebar">
      <h2>
        {currentUser?.role === "teacher"
          ? "Dashboard giảng viên"
          : currentUser?.role === "student"
          ? "Dashboard sinh viên"
          : currentUser?.role === "admin"
          ? "Dashboard quản trị viên"
          : "Dashboard"}
        {currentUser?.name ? ` - ${currentUser.name}` : ""}
      </h2>

      <div className="menu-container">
        <ul>
          {currentUser?.role === "teacher" && (
            <>
              <li onClick={() => navigate("/categories")}>Tạo danh mục</li>
              <li onClick={() => navigate("/practice-exam")}>Tạo đề luyện tập</li>
              <li onClick={() => navigate("/test-exam")}>Tạo đề kiểm tra</li>
              <li onClick={() => navigate("/statistics")}>Thống kê & báo cáo</li>
              <li onClick={() => navigate("/profile")}>Hồ sơ cá nhân</li>
            </>
          )}
          {currentUser?.role === "student" && (
            <>
              <li onClick={() => navigate("/student")}>Trang học viên</li>
              <li onClick={() => navigate("/myExams")}>Bài luyện tập</li>
              <li onClick={() => navigate("/myTest")}>Bài kiểm tra</li>
            </>
          )}
          {currentUser?.role === "admin" && (
            <>
              <li onClick={() => navigate("/admin/classes")}>Quản lý lớp học</li>
              <li onClick={() => navigate("/admin/teachers")}>Quản lý giảng viên</li>
              <li onClick={() => navigate("/admin/students")}>Quản lý sinh viên</li>
              <li onClick={() => navigate("/admin/subjects")}>Quản lý môn học</li>
            </>
          )}
        </ul>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("currentUser"); // 🔥 logout xóa localStorage
          onLogout();
          navigate("/login");
        }}
        className="logout-btn"
        style={{
          marginTop: "auto",
          background: "#c0392b",
          color: "white",
          border: "none",
          padding: "8px 12px",
          cursor: "pointer",
          borderRadius: "6px",
        }}
      >
        Đăng xuất
      </button>
    </div>
  );
}

export default Sidebar;

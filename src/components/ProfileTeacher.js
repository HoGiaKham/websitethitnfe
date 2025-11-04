import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTeachingAssignments } from "../api";
import "../styles/ProfileTeacher.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("app_user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    let userInfo;
    try {
      userInfo = JSON.parse(storedUser);
      setUser(userInfo);
    } catch {
      localStorage.removeItem("app_user");
      navigate("/login");
      return;
    }

    if (userInfo.role === "teacher") {
      const loadAssignments = async () => {
        try {
          setLoading(true);
          const data = await fetchTeachingAssignments(userInfo._id);
          setAssignments(data);
        } catch (err) {
          setError("Không thể tải phân công giảng dạy");
        } finally {
          setLoading(false);
        }
      };
      loadAssignments();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="teacher-profile-page">
      <div className="page-header">
        <h2>Hồ sơ giảng viên</h2>
        <p>Thông tin cá nhân & phân công giảng dạy</p>
      </div>

      {/* Thông tin giảng viên */}
      <div className="profile-card">
        <div className="avatar-block">
          <div className="avatar-circle">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>

        <div className="profile-info">
          <h3>{user?.name}</h3>
          <p><strong>Tài khoản:</strong> {user?.username}</p>
          <p><strong>Vai trò:</strong> Giảng viên</p>
        </div>
      </div>

      {/* Danh sách phân công */}
      <div className="assignments-section">
        <h3>Phân công giảng dạy</h3>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <p>Bạn chưa được phân công lớp học.</p>
          </div>
        ) : (
          <div className="assignment-grid single">
            {assignments.map((item, index) => (
              <div key={index} className="assignment-card single">
                <h4>
                  {item.subject?.name || "Chưa có môn"} -{" "}
                  {item.class?.className || "Chưa có lớp"}
                </h4>
                <p className="student-count">
                  👥 Sĩ số: {item.class?.students?.length || 0} sinh viên
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

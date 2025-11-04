import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/AdminManagerSubjects.css";

const API_BASE = "http://localhost:5000/api";

const AdminManagerSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Lấy danh sách môn học
  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subjects`);
      setSubjects(res.data);
    } catch (error) {
      console.error("Lỗi lấy môn học:", error);
      alert("Không thể tải danh sách môn học!");
    }
  };

  // Thêm môn học mới
  const handleAddSubject = async () => {
    const name = newSubjectName.trim();
    if (!name) return alert("Vui lòng nhập tên môn học!");

    try {
      const res = await axios.post(`${API_BASE}/subjects`, { name });
      setSubjects(prev => [...prev, res.data]);
      setNewSubjectName("");
      setModalVisible(false);
      alert("Thêm môn học thành công!");
    } catch (error) {
      console.error("Lỗi thêm môn học:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  // Xóa môn học + XÓA TẤT CẢ PHÂN CÔNG LIÊN QUAN
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa môn học?\nTất cả phân công liên quan sẽ bị xóa!")) return;

    try {
      // Xóa môn
      await axios.delete(`${API_BASE}/subjects/${id}`);
      
      // Xóa phân công liên quan
      await axios.delete(`${API_BASE}/teaching-assignments/subject/${id}`);

      // Cập nhật UI
      setSubjects(prev => prev.filter(s => s._id !== id));
      alert("Xóa môn học thành công!");
    } catch (err) {
      console.error("Lỗi xóa môn học:", err);
      alert("Không thể xóa môn học!");
    }
  };

  return (
    <div className="admin-subjects-container">
      <h2>Quản lý môn học</h2>

      <div className="add-class-section">
        <button className="add-btn" onClick={() => setModalVisible(true)}>
          Thêm môn học
        </button>
      </div>

      {/* Bảng môn học */}
      <table className="subjects-table">
        <thead>
          <tr>
            <th>Tên môn học</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {subjects.length === 0 ? (
            <tr>
              <td colSpan="2" style={{ textAlign: "center", color: "#999", fontStyle: "italic" }}>
                Chưa có môn học nào
              </td>
            </tr>
          ) : (
            subjects.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(s._id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal thêm môn học */}
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>Thêm môn học mới</h3>
            <input
              type="text"
              placeholder="Nhập tên môn học"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSubject()}
            />
            <div className="modal-actions">
              <button onClick={handleAddSubject}>Xác nhận</button>
              <button onClick={() => {
                setModalVisible(false);
                setNewSubjectName("");
              }}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagerSubjects;
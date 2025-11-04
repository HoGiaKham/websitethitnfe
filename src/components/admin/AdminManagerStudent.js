import React, { useEffect, useState } from "react";
import "../../styles/AdminManagerStudent.css";
import axios from "axios";

const AdminManagerStudent = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "username",
    direction: "asc",
  });

  const [newStudent, setNewStudent] = useState({
    username: "",
    name: "",
    password: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_BASE_URL}/api/users");
      const studentData = res.data.filter((u) => u.role === "student");
      const sorted = studentData.sort((a, b) =>
        a.username.localeCompare(b.username)
      );
      setStudents(sorted);
    } catch (error) {
      console.error("❌ Lỗi lấy danh sách sinh viên:", error);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa sinh viên "${name}" không?`)) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/users/${id}`);
        setStudents((prev) => prev.filter((s) => s._id !== id));
        alert("✅ Xóa sinh viên thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa sinh viên:", error);
        alert("❌ Không thể xóa sinh viên!");
      }
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("${import.meta.env.VITE_API_BASE_URL}/api/users", {
        ...newStudent,
        role: "student",
      });
      const updated = [...students, res.data].sort((a, b) =>
        a.username.localeCompare(b.username)
      );
      setStudents(updated);
      setShowAddModal(false);
      setNewStudent({ username: "", name: "", password: "" });
      alert("🎉 Thêm sinh viên thành công!");
    } catch (error) {
      console.error("Lỗi thêm sinh viên:", error);
      alert("❌ Không thể thêm sinh viên!");
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "⬆" : "⬇";
  };

  const splitName = (fullName) => {
    if (!fullName) return { firstName: "", lastName: "" };
    const parts = fullName.trim().split(" ");
    const firstName = parts.pop(); // lấy phần cuối (Tên)
    const lastName = parts.join(" "); // phần đầu (Họ + đệm)
    return { firstName, lastName };
  };

  const filteredStudents = students
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const { firstName: aFirst, lastName: aLast } = splitName(a.name);
      const { firstName: bFirst, lastName: bLast } = splitName(b.name);

      let aValue = "";
      let bValue = "";

      // 🔽 Chọn giá trị cần so sánh dựa trên cột đang sắp
      if (sortConfig.key === "firstName") {
        aValue = aFirst.toLowerCase();
        bValue = bFirst.toLowerCase();
      } else if (sortConfig.key === "lastName") {
        aValue = aLast.toLowerCase();
        bValue = bLast.toLowerCase();
      } else {
        aValue = a[sortConfig.key]?.toLowerCase() || "";
        bValue = b[sortConfig.key]?.toLowerCase() || "";
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="admin-student-container">
      <div className="admin-student-header">
        <h2>👨‍🎓 Quản lý sinh viên</h2>
        <div className="student-actions">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            ➕ Thêm sinh viên
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort("username")}>
              Mã sinh viên {getSortArrow("username")}
            </th>
            <th onClick={() => handleSort("lastName")}>
              Họ {getSortArrow("lastName")}
            </th>
            <th onClick={() => handleSort("firstName")}>
              Tên {getSortArrow("firstName")}
            </th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((s) => {
              const { firstName, lastName } = splitName(s.name);
              return (
                <tr key={s._id}>
                  <td>{s.username}</td>
                  <td>{lastName}</td>
                  <td>{firstName}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(s._id, s.name)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", color: "#999" }}>
                Không tìm thấy sinh viên nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>➕ Thêm sinh viên mới</h3>
            <form onSubmit={handleAddStudent}>
              <input
                type="text"
                placeholder="Mã sinh viên"
                value={newStudent.username}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, username: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Họ và tên (VD: Nguyễn Văn A)"
                value={newStudent.name}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, name: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={newStudent.password}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, password: e.target.value })
                }
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="save-btn">
                  Lưu
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagerStudent;

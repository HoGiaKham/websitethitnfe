import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/AdminManagerTeacher.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

const AdminManagerTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    username: "",
    password: "123456",
    subjectIds: [],
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchAssignments();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`);
      setTeachers(res.data.filter(u => u.role === "teacher"));
    } catch (err) {
      console.error("Lỗi khi tải giảng viên:", err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subjects`);
      setSubjects(res.data);
    } catch (err) {
      console.error("Lỗi khi tải môn học:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teaching-assignments`);
      const populated = res.data.map(a => ({
        _id: a._id,
        teacherId: a.teacher?._id || null,
        teacherName: a.teacher?.name || "",
        subjectId: a.subject?._id || null,
        subjectName: a.subject?.name || "",
        classId: a.class?._id || null,
      }));
      setAssignments(populated);
    } catch (err) {
      console.error("Lỗi khi tải phân công:", err);
    }
  };

  const getTeacherSubjects = teacherId => [
    ...new Set(
      assignments.filter(a => a.teacherId === teacherId).map(a => a.subjectName)
    ),
  ];

  const getTeacherSubjectIds = teacherId =>
    assignments.filter(a => a.teacherId === teacherId).map(a => a.subjectId);

  const handleEditClick = teacher => {
    setSelectedTeacher(teacher);
    setSelectedSubjectIds(getTeacherSubjectIds(teacher._id));
    setEditModal(true);
  };

const handleSaveEdit = async () => {
  if (selectedSubjectIds.length === 0) {
    alert("Vui lòng chọn ít nhất 1 môn!");
    return;
  }

  try {
    // Xóa cũ
    const oldAssignments = assignments.filter(a => a.teacherId === selectedTeacher._id);
    await Promise.all(oldAssignments.map(a => axios.delete(`${API_BASE}/teaching-assignments/${a._id}`)));

    // Tạo mới → KHÔNG GỬI class
    await Promise.all(
      selectedSubjectIds.map(subjectId =>
        axios.post(`${API_BASE}/teaching-assignments`, {
          teacher: selectedTeacher._id,
          subject: subjectId,
          // ← Không gửi class
        })
      )
    );

    alert("Cập nhật phân công thành công!");
    setEditModal(false);
    fetchAssignments();
  } catch (err) {
    console.error("Lỗi khi cập nhật:", err);
    alert(err.response?.data?.message || "Có lỗi xảy ra!");
  }
};

const handleSaveNewTeacher = async () => {
  if (!newTeacher.name || !newTeacher.username) {
    alert("Vui lòng nhập đầy đủ thông tin!");
    return;
  }
  if (!newTeacher.subjectIds || newTeacher.subjectIds.length === 0) {
    alert("Vui lòng chọn ít nhất 1 môn!");
    return;
  }

  try {
    // 1. Tạo user
    const res = await axios.post(`${API_BASE}/users`, {
      name: newTeacher.name,
      username: newTeacher.username,
      password: newTeacher.password,
      role: "teacher",
    });

    const teacherId = res.data._id;

    // 2. Tạo phân công → KHÔNG GỬI class
    await Promise.all(
      newTeacher.subjectIds.map(subjectId =>
        axios.post(`${API_BASE}/teaching-assignments`, {
          teacher: teacherId,
          subject: subjectId,
          // ← KHÔNG GỬI class → BE sẽ tự để null
        })
      )
    );

    alert("Thêm giảng viên và phân công môn thành công!");
    setAddModal(false);
    setNewTeacher({ name: "", username: "", password: "123456", subjectIds: [] });
    fetchTeachers();
    fetchAssignments();
  } catch (err) {
    console.error("Lỗi khi thêm giảng viên:", err);
    alert(err.response?.data?.message || "Không thể thêm giảng viên!");
  }
};

const handleDeleteTeacher = async (id, name) => {
  if (window.confirm(`Xóa giảng viên "${name}"?`)) {
    try {
      // Xóa assignments trước
      const teacherAssignments = assignments.filter(a => a.teacherId === id);
      await Promise.all(teacherAssignments.map(a => axios.delete(`${API_BASE}/teaching-assignments/${a._id}`)));

      // Xóa user
      await axios.delete(`${API_BASE}/users/${id}`);

      setTeachers(prev => prev.filter(t => t._id !== id));
      fetchAssignments(); // Cập nhật lại
      alert("Xóa thành công!");
    } catch (err) {
      alert("Không thể xóa!");
    }
  }
};

  const filteredTeachers = teachers.filter(t => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const subjects = getTeacherSubjects(t._id).join(" ").toLowerCase();
    if (filterBy === "name") return t.name.toLowerCase().includes(term);
    if (filterBy === "subject") return subjects.includes(term);
    return t.name.toLowerCase().includes(term) || t.username.toLowerCase().includes(term) || subjects.includes(term);
  });

  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const getValue = t => {
      if (sortConfig.key === "username") return t.username?.toLowerCase() || "";
      if (sortConfig.key === "name") return t.name?.toLowerCase() || "";
      if (sortConfig.key === "subjects") return getTeacherSubjects(t._id).join(", ").toLowerCase();
      return "";
    };
    const aVal = getValue(a), bVal = getValue(b);
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortArrow = key => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "Up" : "Down";
  };

  return (
    <div className="admin-teacher-container">
      <h2>Quản lý giảng viên</h2>
      <button className="add-btn" onClick={() => setAddModal(true)}>+ Thêm giảng viên</button>

      <div className="search-filter">
        <input placeholder="Tìm kiếm..." type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select value={filterBy} onChange={e => setFilterBy(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="name">Tên giảng viên</option>
          <option value="subject">Môn học</option>
        </select>
      </div>

      <table className="teachers-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("username")}>Mã GV {getSortArrow("username")}</th>
            <th onClick={() => handleSort("name")}>Tên giảng viên {getSortArrow("name")}</th>
            <th onClick={() => handleSort("subjects")}>Môn dạy {getSortArrow("subjects")}</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeachers.map(t => (
            <tr key={t._id}>
              <td>{t.username}</td>
              <td>{t.name}</td>
              <td>
                {getTeacherSubjects(t._id).length > 0 ? getTeacherSubjects(t._id).map((sub, idx) => <span key={idx} className="badge badge-subject">{sub}</span>) : <em>Chưa phân công</em>}
              </td>
              <td className="action-btns">
                <button className="edit-btn" onClick={() => handleEditClick(t)}>Sửa</button>
                <button className="delete-btn" onClick={() => handleDeleteTeacher(t._id, t.name)}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal thêm mới */}
      {addModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Thêm giảng viên mới</h3>
            <label>Tên giảng viên:</label>
            <input value={newTeacher.name} onChange={e => setNewTeacher(prev => ({ ...prev, name: e.target.value }))} />
            <label>Mã giảng viên:</label>
            <input value={newTeacher.username} onChange={e => setNewTeacher(prev => ({ ...prev, username: e.target.value }))} />
            <label>Chọn môn dạy:</label>
            <div className="subject-list">
              {subjects.map(s => (
                <label key={s._id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newTeacher.subjectIds.includes(s._id)}
                    onChange={() => {
                      setNewTeacher(prev => ({
                        ...prev,
                        subjectIds: prev.subjectIds.includes(s._id)
                          ? prev.subjectIds.filter(id => id !== s._id)
                          : [...prev.subjectIds, s._id]
                      }));
                    }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveNewTeacher}>Lưu</button>
              <button onClick={() => setAddModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal phân công môn */}
      {editModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Phân công môn dạy</h3>
            <p><strong>Giảng viên:</strong> {selectedTeacher?.name}</p>
            <div className="subject-list">
              {subjects.map(s => (
                <label key={s._id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(s._id)}
                    onChange={() => {
                      setSelectedSubjectIds(prev =>
                        prev.includes(s._id)
                          ? prev.filter(id => id !== s._id)
                          : [...prev, s._id]
                      );
                    }}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleSaveEdit}>Lưu</button>
              <button onClick={() => setEditModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagerTeacher;

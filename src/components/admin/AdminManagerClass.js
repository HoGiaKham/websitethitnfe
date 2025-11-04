import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/AdminManagerClass.css";

const API_BASE = "${import.meta.env.VITE_API_BASE_URL}/api";

function AdminManagerClass() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [newClassName, setNewClassName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [searchTerm, setSearchTerm] = useState(""); // FIX: Đổi tên
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  // Lấy GV dạy môn (dùng assignments đã populate)
  const getTeachersForSubject = (subjectId) => {
    if (!subjectId) return [];
    return assignments
      .filter(a => a.subject?._id === subjectId && a.teacher?._id)
      .map(a => ({
        _id: a.teacher._id,
        name: a.teacher.name,
      }));
  };

  const fetchAllData = async () => {
    try {
      const [classRes, userRes, subjectRes, assignRes] = await Promise.all([
        axios.get(`${API_BASE}/classes`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/subjects`),
        axios.get(`${API_BASE}/teaching-assignments`),
      ]);

      // Ưu tiên lấy từ Class, fallback từ assignment
      const classesWithInfo = classRes.data.map(cls => {
        const assign = assignRes.data.find(a => a.class?._id === cls._id);
        return {
          ...cls,
          subject: cls.subject || assign?.subject || null,
          teacher: cls.teacher || assign?.teacher || null,
        };
      });

      setClasses(classesWithInfo);
      setUsers(userRes.data);
      setSubjects(subjectRes.data);
      setAssignments(assignRes.data);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu:", err);
      alert("Không thể tải dữ liệu!");
    }
  };

  const teachers = users.filter(u => u.role === "teacher");
  const students = users.filter(u => u.role === "student");

  const handleAddClass = async () => {
    if (!newClassName.trim()) return alert("Nhập tên lớp!");
    if (!selectedSubject) return alert("Chọn môn học!");
    if (!selectedTeacher) return alert("Chọn giảng viên!");
    if (!maxStudents || maxStudents <= 0) return alert("Nhập số lượng SV hợp lệ!");

    try {
      await axios.post(`${API_BASE}/classes`, {
        className: newClassName.trim(),
        subject: selectedSubject,
        teacher: selectedTeacher,
        maxStudents: Number(maxStudents),
      });

      fetchAllData();
      setNewClassName("");
      setSelectedSubject("");
      setSelectedTeacher("");
      setMaxStudents("");
      setShowAddClassModal(false);
      alert("Tạo lớp thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo lớp!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa lớp?")) return;
    try {
      await axios.delete(`${API_BASE}/classes/${id}`);
      await axios.delete(`${API_BASE}/teaching-assignments/class/${id}`);
      fetchAllData();
      alert("Xóa lớp thành công!");
    } catch (err) {
      alert("Không thể xóa lớp!");
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher) return alert("Chọn giảng viên!");
    try {
      await axios.put(`${API_BASE}/classes/${selectedClass._id}`, {
        teacher: selectedTeacher,
        subject: selectedClass.subject?._id || selectedClass.subject, // FIX: Dùng _id hoặc string
      });
      alert("Phân công thành công!");
      setShowTeacherModal(false);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi!");
    }
  };

  const handleAssignStudents = async () => {
    try {
      await axios.put(`${API_BASE}/classes/${selectedClass._id}`, {
        students: selectedStudents,
      });
      alert("Phân công SV thành công!");
      setShowStudentModal(false);
      fetchAllData();
    } catch (err) {
      alert("Không thể phân công!");
    }
  };

  const openTeacherModal = (cls) => {
    setSelectedClass(cls);
    setSelectedTeacher(cls.teacher?._id || "");
    setShowTeacherModal(true);
  };

  const openStudentModal = (cls) => {
    setSelectedClass(cls);
    setSelectedStudents(cls.students?.map(s => s._id) || []);
    setShowStudentModal(true);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return "up-down";
    return sortConfig.direction === "asc" ? "up" : "down";
  };

  // LỌC + TÌM KIẾM
  const filteredClasses = classes
    .filter((cls) => {
      const term = searchTerm.toLowerCase();
      const subjectName = subjects.find(s => s._id === (cls.subject?._id || cls.subject))?.name || "";
      const teacherName = users.find(u => u._id === (cls.teacher?._id || cls.teacher))?.name || "";
      const classDisplay = `${cls.className} (${subjectName})`.toLowerCase();

      if (filterBy === "className") return cls.className.toLowerCase().includes(term);
      if (filterBy === "subject") return subjectName.toLowerCase().includes(term);
      if (filterBy === "teacher") return teacherName.toLowerCase().includes(term);
      return classDisplay.includes(term) || teacherName.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aVal = "", bVal = "";

      if (sortConfig.key === "className") {
        aVal = a.className;
        bVal = b.className;
      } else if (sortConfig.key === "subject") {
        aVal = subjects.find(s => s._id === (a.subject?._id || a.subject))?.name || "";
        bVal = subjects.find(s => s._id === (b.subject?._id || b.subject))?.name || "";
      } else if (sortConfig.key === "teacher") {
        aVal = users.find(u => u._id === (a.teacher?._id || a.teacher))?.name || "";
        bVal = users.find(u => u._id === (b.teacher?._id || b.teacher))?.name || "";
      } else if (sortConfig.key === "students") {
        aVal = a.students?.length || 0;
        bVal = b.students?.length || 0;
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="admin-classes-container">
      <h2>Quản lý lớp học</h2>

      <div className="add-class-section">
        <button className="add-btn" onClick={() => setShowAddClassModal(true)}>
          Thêm lớp mới
        </button>
      </div>

      <div className="search-filter">
        <input
          placeholder="Tìm kiếm lớp, môn, GV..."
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // FIX: Dùng đúng state
        />
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="className">Tên lớp</option>
          <option value="subject">Môn học</option>
          <option value="teacher">Giảng viên</option>
        </select>
      </div>

      <table className="classes-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("subject")}>Môn học {getSortArrow("subject")}</th>
            <th onClick={() => handleSort("className")}>Tên lớp {getSortArrow("className")}</th>
            <th onClick={() => handleSort("teacher")}>Giảng viên {getSortArrow("teacher")}</th>
            <th onClick={() => handleSort("students")}>Số SV {getSortArrow("students")}</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredClasses.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: "#999" }}>
                Chưa có lớp nào
              </td>
            </tr>
          ) : (
            filteredClasses.map((cls) => {
              const subjectName = subjects.find(s => s._id === (cls.subject?._id || cls.subject))?.name || "Chưa gắn";
              const teacherName = users.find(u => u._id === (cls.teacher?._id || cls.teacher))?.name || "Chưa gắn";

              return (
                <tr key={cls._id}>
                  <td>{subjectName}</td>
                  <td>
                    <strong>{cls.className}</strong>
                    <small style={{ color: "#666", marginLeft: 8 }}>({subjectName})</small>
                  </td>
                  <td>{teacherName}</td>
                  <td>{cls.students?.length || 0}/{cls.maxStudents || 0}</td>
                  <td className="action-buttons">
                    <button onClick={() => openTeacherModal(cls)}>Phân GV</button>
                    <button onClick={() => openStudentModal(cls)}>Phân SV</button>
                    <button className="delete" onClick={() => handleDelete(cls._id)}>Xóa</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Modal thêm lớp */}
      {showAddClassModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Thêm lớp mới</h3>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="VD: Lớp KTPM17A"
            />
            <select value={selectedSubject} onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTeacher(""); // Reset GV khi đổi môn
            }}>
              <option value="">-- Chọn môn --</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={!selectedSubject}
            >
              <option value="">-- Chọn giảng viên --</option>
              {getTeachersForSubject(selectedSubject).length > 0 ? (
                getTeachersForSubject(selectedSubject).map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))
              ) : (
                <option disabled>Không có GV dạy môn này</option>
              )}
            </select>
            <input
              type="number"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              placeholder="Số lượng SV tối đa"
            />
            <div className="modal-actions">
              <button onClick={handleAddClass}>Xác nhận</button>
              <button onClick={() => setShowAddClassModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal phân GV & SV giữ nguyên */}
      {showTeacherModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Phân công giảng viên cho {selectedClass?.className}</h3>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
              <option value="">-- Chọn giảng viên --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={handleAssignTeacher}>Xác nhận</button>
              <button onClick={() => setShowTeacherModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="modal">
          <div className="modal-content modal-large">
            <h3>Phân công sinh viên cho {selectedClass?.className}</h3>
            <input
              type="text"
              placeholder="Tìm sinh viên..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            <div className="students-list">
              {students
                .filter((s) =>
                  s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.username.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map((s) => (
                  <label key={s._id}>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s._id)}
                      onChange={(e) => {
                        setSelectedStudents(prev =>
                          e.target.checked
                            ? [...prev, s._id]
                            : prev.filter(id => id !== s._id)
                        );
                      }}
                    />
                    {s.name} ({s.username})
                  </label>
                ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleAssignStudents}>Xác nhận</button>
              <button onClick={() => setShowStudentModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagerClass;
// src/pages/teacher/PracticeExamPage.js
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { fetchCategories } from "../api";
import "../styles/PracticeExamPage.css";
import { useNavigate } from "react-router-dom";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

function PracticeExamPage() {
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [examName, setExamName] = useState("");
  // const [duration, setDuration] = useState(60);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  // const [attempts, setAttempts] = useState(1);
  // const [scorePerQuestion, setScorePerQuestion] = useState(1);

  const currentUser = JSON.parse(localStorage.getItem("app_user") || "{}");

  // Load đề
  useEffect(() => {
    loadExams();
  }, []);

  // Load môn học từ teaching-assignments
  useEffect(() => {
    const loadAssignedSubjects = async () => {
      if (!currentUser?._id) return;

      try {
        const res = await fetch(`${API_BASE}/teaching-assignments/teacher/${currentUser._id}`);
        if (!res.ok) throw new Error("Lỗi lấy phân công");

        const assigns = await res.json();
        const uniqueSubjects = [];
        const seen = new Set();

        assigns.forEach(a => {
          if (a.subject && a.subject._id && !seen.has(a.subject._id)) {
            seen.add(a.subject._id);
            uniqueSubjects.push({ _id: a.subject._id, name: a.subject.name });
          }
        });

        setSubjects(uniqueSubjects);
      } catch (err) {
        console.error("Lỗi load môn phân công:", err);
        setSubjects([]);
      }
    };

    loadAssignedSubjects();
  }, [currentUser?._id]);

  // Khi chọn môn → load categories + lớp
  useEffect(() => {
    const loadCategoriesAndClasses = async () => {
      if (!selectedSubject) {
        setCategories([]);
        setSelectedCategories([]);
        setClasses([]);
        setSelectedClass("");
        return;
      }

      // 1. Load categories
      try {
        const catData = await fetchCategories(selectedSubject);
        const sorted = [...catData].sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0]) || 0;
          const numB = parseInt(b.name.match(/\d+/)?.[0]) || 0;
          return numA - numB;
        });
        setCategories(sorted);
      } catch (err) {
        console.error("Lỗi load categories:", err);
        setCategories([]);
      }

      // 2. Load lớp từ teaching-assignments
      try {
        const res = await fetch(`${API_BASE}/teaching-assignments/teacher/${currentUser._id}`);
        if (!res.ok) throw new Error("Lỗi lấy phân công");

        const assigns = await res.json();
        const matched = assigns
          .filter(a => 
            a.subject && 
            String(a.subject._id) === String(selectedSubject) && 
            a.class && 
            a.class._id
          )
          .map(a => a.class);

        const unique = [];
        const seen = new Set();
        matched.forEach(cls => {
          if (!seen.has(cls._id)) {
            seen.add(cls._id);
            unique.push(cls);
          }
        });

        setClasses(unique);
        setSelectedClass(unique[0]?._id || ""); // Tự động chọn lớp đầu tiên nếu có
      } catch (err) {
        console.error("Lỗi load lớp:", err);
        setClasses([]);
      }
    };

    loadCategoriesAndClasses();
  }, [selectedSubject, currentUser?._id]);

  const loadExams = async () => {
    if (!currentUser?._id) {
      setExams([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/practice-exams/teacher/${currentUser._id}`);
      if (!res.ok) throw new Error("Lỗi tải đề của bạn");
      const data = await res.json();
      setExams(data);
    } catch (err) {
      console.error("Lỗi load exams:", err);
      setExams([]);
    }
  };

  const resetForm = () => {
    setExamName("");
    setSelectedSubject("");
    setSelectedCategories([]);
    // setDuration(60);
    setOpenTime("");
    setCloseTime("");
    // setAttempts(1);
    // setScorePerQuestion(1);
    setIsEditMode(false);
    setEditingExamId(null);
    setClasses([]);
    setSelectedClass("");
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const open = exam.openTime ? new Date(exam.openTime) : null;
    const close = exam.closeTime ? new Date(exam.closeTime) : null;

    if (!open) return { status: "Chưa đặt lịch", className: "status-pending" };
    if (now < open) return { status: "Chưa mở", className: "status-upcoming" };
    if (close && now > close) return { status: "Đã đóng", className: "status-closed" };
    return { status: "Đang mở", className: "status-open" };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa đặt";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // SỬA: handleSaveExam → thêm classId
  const handleSaveExam = async () => {
    if (!examName || !selectedSubject || selectedCategories.length === 0) {
      Swal.fire("Thiếu thông tin", "Vui lòng nhập đầy đủ", "warning");
      return;
    }

    if (!isEditMode && !selectedClass) {
      Swal.fire("Lỗi", "Vui lòng chọn lớp học", "warning");
      return;
    }

    const examData = {
      title: examName,
      subject: selectedSubject,
      categories: selectedCategories,
      // duration,
      openTime: openTime || null,
      closeTime: closeTime || null,
      // attempts,
      // scorePerQuestion,
    };

    try {
      let url = `${API_BASE}/practice-exams`;
      let method = "POST";

      if (isEditMode) {
        url = `${API_BASE}/practice-exams/${editingExamId}`;
        method = "PUT";
      } else {
        examData.teacherId = currentUser._id;
        examData.classId = selectedClass; // ĐÃ GỬI classId
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Lỗi server");
      }

      const savedExam = await res.json();

      if (isEditMode) {
        setExams(prev => prev.map(e => e._id === editingExamId ? savedExam : e));
        Swal.fire("Thành công", "Cập nhật đề thành công!", "success");
      } else {
        setExams(prev => [...prev, savedExam]);
        Swal.fire("Thành công", "Tạo đề thành công!", "success");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      Swal.fire("Lỗi", error.message, "error");
      console.error(error);
    }
  };

  const handleEditExam = async (e, exam) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/practice-exams/${exam._id}`);
      if (!res.ok) throw new Error("Không thể tải đề");

      const data = await res.json();

      setIsEditMode(true);
      setEditingExamId(exam._id);
      setExamName(data.title);
      setSelectedSubject(data.subject._id);
      setSelectedCategories(data.categories.map(c => c._id));
      // setDuration(data.duration);
      // setAttempts(data.attempts);
      // setScorePerQuestion(data.scorePerQuestion);
      setOpenTime(data.openTime ? new Date(data.openTime).toISOString().slice(0, 16) : "");
      setCloseTime(data.closeTime ? new Date(data.closeTime).toISOString().slice(0, 16) : "");

      setIsModalOpen(true);
    } catch (error) {
      Swal.fire("Lỗi", "Không thể tải đề", "error");
    }
  };

  const handleDeleteExam = async (e, exam) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      html: `Xóa đề <strong>"${exam.title}"</strong>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/practice-exams/${exam._id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa");
        setExams(prev => prev.filter(e => e._id !== exam._id));
        Swal.fire("Đã xóa!", "", "success");
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa", "error");
      }
    }
  };

  return (
    <div className="practice-exam-page">
      <div className="header">
        <h3 className="title">Danh sách đề luyện tập</h3>
        <button className="action-btn" onClick={() => { setIsModalOpen(true); resetForm(); }}>
          + Tạo đề luyện tập
        </button>
      </div>

      <ul>
        {exams.length === 0 ? (
          <p>Chưa có đề luyện tập nào.</p>
        ) : (
          exams.map((exam) => (
            <li
              key={exam._id}
              className="exam-item"
              onClick={() => navigate(`/practice-exam-detail/${exam._id}`)}
            >
              <div className="exam-item-header">
                <div className="exam-info-left">
                  <span className="exam-title">
                    {exam.title} -{" "}
                    <span style={{ color: "#528fd1ff", fontWeight: "500", fontStyle: "italic" }}>
                      môn: {exam.subject?.name}
                      {exam.class ? ` - lớp: ${exam.class.className}` : ""}
                    </span>
                  </span>
                  <div className="exam-metadata">
                    <span className={`exam-status ${getExamStatus(exam).className}`}>
                      {getExamStatus(exam).status}
                    </span>
                    <span className="exam-time">Mở: {formatDateTime(exam.openTime)}</span>
                    <span className="exam-time">Đóng: {formatDateTime(exam.closeTime)}</span>
                  </div>
                </div>
                <div className="exam-actions">
                  <button className="exam-btn edit-btn" onClick={(e) => handleEditExam(e, exam)}>
                    Sửa
                  </button>
                  <button className="exam-btn delete-btn" onClick={(e) => handleDeleteExam(e, exam)}>
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{isEditMode ? "Chỉnh sửa đề" : "Tạo đề luyện tập"}</h4>
              <button className="modal-close-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                ×
              </button>
            </div>

            {!isEditMode && (
              <>
                <div className="form-group">
                  <label>Môn học</label>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                    <option value="">-- Chọn môn --</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Lớp học</label>
                  {!selectedSubject ? (
                    <p style={{ color: "#666" }}>Chọn môn trước</p>
                  ) : classes.length === 0 ? (
                    <p style={{ color: "#999", fontStyle: "italic" }}>Chưa được phân công lớp</p>
                  ) : (
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                      <option value="">-- Chọn lớp --</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>{cls.className}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Chủ đề</label>
                  {!selectedSubject ? (
                    <p style={{ color: "#666" }}>Chọn môn trước</p>
                  ) : categories.length === 0 ? (
                    <p style={{ color: "#999", fontStyle: "italic" }}>Chưa có chương</p>
                  ) : (
                    <div className="category-option-container">
                      {categories.map((c) => (
                        <div
                          key={c._id}
                          className="category-option"
                          onClick={() => {
                            setSelectedCategories(prev =>
                              prev.includes(c._id)
                                ? prev.filter(id => id !== c._id)
                                : [...prev, c._id]
                            );
                          }}
                        >
                          <input type="checkbox" checked={selectedCategories.includes(c._id)} readOnly />
                          <span>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="form-group">
              <label>Tên đề</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Nhập tên đề..."
              />
            </div>

            {/* <div className="form-group">
              <label>Thời gian (phút)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
              />
            </div> */}

            <div className="form-group">
              <label>Thời gian mở</label>
              <input type="datetime-local" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </div>

            {!isEditMode && (
              <div className="form-group">
                <label>Thời gian đóng</label>
                <input type="datetime-local" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            )}

            {/* <div className="form-group">
              <label>Số lần làm</label>
              <input
                type="number"
                value={attempts}
                onChange={(e) => setAttempts(e.target.value)}
                min="1"
              />
            </div> */}

            {/* <div className="form-group">
              <label>Điểm mỗi câu</label>
              <input
                type="number"
                value={scorePerQuestion}
                onChange={(e) => setScorePerQuestion(e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div> */}

            <button onClick={handleSaveExam} className="save-btn">
              {isEditMode ? "Cập nhật" : "Tạo đề"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeExamPage;
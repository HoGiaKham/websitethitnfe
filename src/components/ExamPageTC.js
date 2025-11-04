// src/components/ExamPageTC.js - ✅ UI FIXED: Gọn gàng, buttons nhỏ, layout đẹp
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { fetchCategories } from "../api";
import axios from "axios";
import "../styles/ExamPageTC.css";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function ExamPageTC() {
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const navigate = useNavigate();

  // Form tạo/sửa đề
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // ✅ Lớp: allClasses (tất cả) + classes (của môn được chọn)
  const [allClasses, setAllClasses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const [examName, setExamName] = useState("");
  const [duration, setDuration] = useState(60);
  const [openTime, setOpenTime] = useState("");
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("app_user") || "{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateCloseTime = (open, dur) => {
    if (!open || !dur) return null;
    const close = new Date(open);
    close.setMinutes(close.getMinutes() + parseInt(dur));
    return close;
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

  const canEdit = (exam) => {
    if (exam.status === 'published') return false;
    if (exam.openTime) {
      const now = new Date();
      return now < new Date(exam.openTime);
    }
    return true;
  };

  // ✅ Có thể xóa? (draft hoặc published + chưa tới giờ)
  const canDelete = (exam) => {
    if (exam.status === 'draft') return true;
    if (exam.openTime) {
      const now = new Date();
      return now < new Date(exam.openTime);
    }
    return false;
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    const loadAssignedSubjectsAndClasses = async () => {
      if (!currentUser?._id) return;

      try {
        const res = await fetch(`${API_URL}/teaching-assignments/teacher/${currentUser._id}`);
        if (!res.ok) throw new Error("Lỗi lấy phân công");

        const assigns = await res.json();
        
        const uniqueSubjects = [];
        const seenSubjects = new Set();
        assigns.forEach(a => {
          if (a.subject && a.subject._id && !seenSubjects.has(a.subject._id)) {
            seenSubjects.add(a.subject._id);
            uniqueSubjects.push({ _id: a.subject._id, name: a.subject.name });
          }
        });
        setSubjects(uniqueSubjects);

        const allClassesArray = [];
        const seenClasses = new Set();
        assigns.forEach(a => {
          if (a.class && a.class._id && !seenClasses.has(a.class._id)) {
            seenClasses.add(a.class._id);
            allClassesArray.push(a.class);
          }
        });
        setAllClasses(allClassesArray);

      } catch (err) {
        console.error("❌ Lỗi load môn + lớp:", err);
        setSubjects([]);
        setAllClasses([]);
      }
    };

    loadAssignedSubjectsAndClasses();
  }, [currentUser?._id]);

  useEffect(() => {
    const loadCategoriesAndClasses = async () => {
      if (!selectedSubject) {
        setCategories([]);
        setSelectedCategories([]);
        setClasses([]);
        setSelectedClass("");
        return;
      }

      try {
        const catData = await fetchCategories(selectedSubject, currentUser._id);
        const sorted = [...catData].sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0]) || 0;
          const numB = parseInt(b.name.match(/\d+/)?.[0]) || 0;
          return numA - numB;
        });
        setCategories(sorted);
      } catch (err) {
        console.error("❌ Lỗi load categories:", err);
        setCategories([]);
      }

      try {
        const res = await fetch(`${API_URL}/teaching-assignments/teacher/${currentUser._id}`);
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
        setSelectedClass(unique[0]?._id || "");
      } catch (err) {
        console.error("❌ Lỗi load lớp:", err);
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
    const res = await fetch(`${API_URL}/test-exams?teacherId=${currentUser._id}`);
    if (!res.ok) throw new Error("Lỗi tải đề");
    const data = await res.json();
    setExams(data);
  } catch (err) {
    console.error("❌ Lỗi load exams:", err);
    setExams([]);
  }
};

  const resetForm = () => {
    setExamName("");
    setSelectedSubject("");
    setSelectedCategories([]);
    setSelectedClass("");
    setDuration(60);
    setOpenTime("");
    setShowResultImmediately(true);
    setShowCorrectAnswers(false);
    setIsEditMode(false);
    setEditingExamId(null);
  };

  const getExamStatus = (exam) => {
    if (exam.status === 'draft') {
      return { status: "Bản nháp", className: "status-draft" };
    }
    const now = new Date();
    const openTimeDate = exam.openTime ? new Date(exam.openTime) : null;
    const closeTimeDate = exam.closeTime ? new Date(exam.closeTime) : null;

    if (!openTimeDate) {
      return { status: "Chưa đặt lịch", className: "status-pending" };
    }
    if (now < openTimeDate) {
      return { status: "Chưa mở", className: "status-upcoming" };
    }
    if (closeTimeDate && now > closeTimeDate) {
      return { status: "Đã đóng", className: "status-closed" };
    }
    return { status: "Đang thi", className: "status-active" };
  };

  const handleSaveExam = async () => {
    if (!examName.trim() || !selectedSubject || selectedCategories.length === 0) {
      Swal.fire("Lỗi!", "Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    if (!isEditMode && !selectedClass) {
      Swal.fire("Lỗi!", "Vui lòng chọn lớp học", "error");
      return;
    }

    const examData = {
      title: examName,
      subject: selectedSubject,
      categories: selectedCategories,
      class: selectedClass,
      duration,
      openTime: openTime || null,
      showResultImmediately,
      showCorrectAnswers,
      passingScore: 50,
      createdBy: currentUser._id // ✅ THÊM: Gửi ID giáo viên tạo đề
    };

    try {
      if (isEditMode) {
        const exam = exams.find(e => e._id === editingExamId);
        if (!canEdit(exam)) {
          Swal.fire("Lỗi!", "Không thể chỉnh sửa đề thi này", "error");
          return;
        }
        await axios.put(`${API_URL}/test-exams/${editingExamId}`, examData);
        Swal.fire("Thành công!", "Cập nhật đề thi.", "success");
      } else {
        await axios.post(`${API_URL}/test-exams`, examData);
        Swal.fire("Thành công!", "Tạo đề thi mới (draft).", "success");
      }
      loadExams();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("❌ Lỗi save đề thi:", err);
      Swal.fire("Lỗi!", err.response?.data?.message || err.message, "error");
    }
  };

  const handlePublishExam = async (examId) => {
    const result = await Swal.fire({
      title: "Xuất đề thi?",
      text: "Sau khi xuất đề, bạn không thể chỉnh sửa nữa. Bạn có chắc chắn không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Xuất đề",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await axios.patch(`${API_URL}/test-exams/${examId}/publish`);
        loadExams();
        Swal.fire("Thành công!", "Đề thi đã được xuất. Sinh viên có thể làm bài.", "success");
      } catch (err) {
        Swal.fire("Lỗi!", err.response?.data?.message || err.message, "error");
      }
    }
  };

  const handleDeleteExam = async (examId) => {
    const exam = exams.find(e => e._id === examId);
    if (!canDelete(exam)) {
      Swal.fire("Lỗi!", "Không thể xóa đề thi này", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Xóa đề thi?",
      text: "Bạn có chắc chắn muốn xóa đề thi này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/test-exams/${examId}`);
        loadExams();
        Swal.fire("Đã xóa!", "Đề thi đã được xóa.", "success");
      } catch (err) {
        Swal.fire("Lỗi!", err.message, "error");
      }
    }
  };

  const handleEditExam = (exam) => {
    if (!canEdit(exam)) {
      Swal.fire("Lỗi!", "Không thể chỉnh sửa đề thi này", "error");
      return;
    }

    setExamName(exam.title);
    setSelectedSubject(exam.subject._id);
    setSelectedCategories(exam.categories.map(c => c._id));
    setSelectedClass(exam.class?._id || "");
    setDuration(exam.duration);
    setOpenTime(exam.openTime ? exam.openTime.substring(0, 16) : "");
    setShowResultImmediately(exam.showResultImmediately);
    setShowCorrectAnswers(exam.showCorrectAnswers);
    setIsEditMode(true);
    setEditingExamId(exam._id);
    setIsModalOpen(true);
  };

  const getClassName = (classId) => {
    const cls = allClasses.find(c => c._id === classId);
    return cls?.className || "Không xác định";
  };

  return (
    <div className="exam-page">
      <div className="header">
        <h3 className="title">Danh sách đề kiểm tra</h3>
        <button className="action-btn" onClick={() => { setIsModalOpen(true); resetForm(); }}>
          + Tạo đề kiểm tra
        </button>
      </div>

      <div className="exam-list">
        {exams.length > 0 ? (
          exams.map(exam => {
            const { status, className } = getExamStatus(exam);
            const isEditable = canEdit(exam);
            const isDeletable = canDelete(exam);
            const isDraft = exam.status === 'draft';
            return (
              <div key={exam._id} className="exam-card">
                <div className="exam-header">
                  <div className="exam-title-row">
                    <h4 className="exam-title">{exam.title}</h4>
                    {/* ✅ Icon xuất đề cạnh bản nháp */}
                    {isDraft && (
                      <button 
                        onClick={() => handlePublishExam(exam._id)}
                        className="btn-publish-icon"
                        title="Xuất đề cho sinh viên"
                      >
                        📤
                      </button>
                    )}
                  </div>
                  <span className={`status-badge ${className}`}>{status}</span>
                </div>

                <div className="exam-info">
                  <span className="info-text">📚 Môn: {exam.subject?.name}</span>
                  <span className="info-text">🏫 Lớp: {getClassName(exam.class?._id)}</span>
                  <span className="info-text">⏱️ Thời lượng: {exam.duration} phút</span>
                  {/* ✅ Thời gian mở/đóng nằm dưới */}
                  {exam.openTime && (
                    <div className="exam-time-info">
                      <span className="time-item">🕐 Mở: {formatDateTime(exam.openTime)}</span>
                      <span className="time-item">🔒 Đóng: {formatDateTime(exam.closeTime)}</span>
                    </div>
                  )}
                  {!isEditable && exam.openTime && (
                    <p style={{ fontSize: "0.85em", color: "#dc3545", marginTop: "5px", fontWeight: "bold" }}>
                      ⛔ Đã khóa - Không thể chỉnh sửa
                    </p>
                  )}
                </div>

                {/* ✅ Actions: Compact buttons */}
                <div className="exam-actions">
                  {isDraft && (
                    <button 
                      onClick={() => navigate(`/test-exam-detail/${exam._id}`)} 
                      className="btn-small btn-blue"
                      title="Thêm câu hỏi"
                    >
                      ➕
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(`/test-exam-detail/${exam._id}`)} 
                    className="btn-small btn-blue"
                    title="Chi tiết"
                  >
                    📋
                  </button>
                  {/* ✅ Sửa: Button nhỏ */}
                  <button 
                    onClick={() => handleEditExam(exam)} 
                    className="btn-small btn-green"
                    disabled={!isEditable}
                    title={isEditable ? "Sửa thông tin" : "Không thể sửa"}
                  >
                    ✏️
                  </button>
                  {/* ✅ Xóa: Button nhỏ */}
                  <button 
                    onClick={() => handleDeleteExam(exam._id)} 
                    className="btn-small btn-red"
                    disabled={!isDeletable}
                    title={isDeletable ? "Xóa" : "Không thể xóa"}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-exams-message">
            Chưa có đề thi nào. Tạo đề thi mới bằng nút "Tạo đề kiểm tra"
          </p>
        )}
      </div>

      {/* Modal tạo/sửa đề thi */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditMode ? "✏️ Sửa đề thi" : "➕ Tạo đề kiểm tra"}</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="error-message">❌ {error}</div>}

              <div className="form-section">
                <h4 className="section-title">📄 Thông tin đề thi</h4>
                
                <div className="form-group">
                  <label>Tên đề thi *</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="Nhập tên đề kiểm tra"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Môn học *</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="form-input"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!isEditMode && (
                  <div className="form-group">
                    <label>Lớp học *</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="form-input"
                    >
                      <option value="">-- Chọn lớp học --</option>
                      {classes.length > 0 ? (
                        classes.map(cls => (
                          <option key={cls._id} value={cls._id}>
                            {cls.className}
                          </option>
                        ))
                      ) : (
                        <option disabled>
                          {selectedSubject 
                            ? "❌ Không có lớp nào cho môn này"
                            : "⏳ Vui lòng chọn môn học trước"}
                        </option>
                      )}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Danh mục câu hỏi *</label>
                  <div className="checkbox-list">
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <label key={category._id} className="checkbox-item">
                          <input
                            type="checkbox"
                            value={category._id}
                            checked={selectedCategories.includes(category._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category._id]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(id => id !== category._id));
                              }
                            }}
                          />
                          <span>{category.name}</span>
                        </label>
                      ))
                    ) : (
                      <p className="helper-text">
                        {selectedSubject 
                          ? "❌ Môn học này không có danh mục câu hỏi"
                          : "⏳ Vui lòng chọn môn học trước"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4 className="section-title">⏱️ Thời gian thi</h4>
                
                <div className="form-group">
                  <label>Thời lượng (phút)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian mở đề</label>
                  <input
                    type="datetime-local"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="form-input"
                  />
                </div>

                {openTime && (
                  <div className="form-group">
                    <label>Thời gian đóng đề (tự động tính)</label>
                    <div className="form-input" style={{
                      background: "#e3f2fd",
                      color: "#1565c0",
                      padding: "10px",
                      borderRadius: "4px",
                      border: "1px solid #90caf9",
                      cursor: "default"
                    }}>
                      {formatDateTime(calculateCloseTime(openTime, duration))}
                    </div>
                  </div>
                )}

                <p className="helper-text">
                  ℹ️ Thời gian đóng = Thời gian mở + Thời lượng
                </p>
              </div>

              <div className="form-section">
                <h4 className="section-title">⚙️ Cài đặt nâng cao</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showResultImmediately}
                      onChange={(e) => setShowResultImmediately(e.target.checked)}
                    />
                    <span>Hiển thị kết quả ngay sau khi nộp bài</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showCorrectAnswers}
                      onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                    />
                    <span>Hiển thị đáp án đúng cho sinh viên</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                    />
                    <span>Xáo trộn thứ tự câu hỏi - Mặc định</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                    />
                    <span>Xáo trộn thứ tự đáp án - Mặc định</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                    />
                    <span>Số lần làm: 1 - Mặc định</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleSaveExam} className="btn-primary">
                {isEditMode ? "💾 Cập nhật" : "➕ Tạo đề kiểm tra"}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamPageTC;
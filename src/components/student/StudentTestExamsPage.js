// src/components/student/StudentTestExamsPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/StudentExamsPage.css";

function StudentTestExamsPage({ studentUsername }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestExams = async () => {
      if (!studentUsername) {
        setLoading(false);
        return;
      }

      try {
        // 1. Lấy tất cả lớp
        const classesRes = await axios.get("${import.meta.env.VITE_API_BASE_URL}/api/classes");
        const allClasses = classesRes.data;

        // 2. Lọc lớp của sinh viên
        const myClasses = allClasses.filter(cls =>
          cls.students?.some(s => s.username === studentUsername)
        );

        // 3. Lấy các bài kiểm tra (test exams) cho từng lớp
        const examPromises = myClasses.map(async (cls) => {
          try {
            const res = await axios.get(
              "${import.meta.env.VITE_API_BASE_URL}/api/test-exams/student/published",
              { params: { studentClassId: cls._id } }
            );
            return res.data.map(exam => ({
              ...exam,
              className: cls.className,
              subjectName: cls.subject?.name
            }));
          } catch (err) {
            console.warn(`Lỗi load đề kiểm tra lớp ${cls.className}:`, err);
            return [];
          }
        });

        const examArrays = await Promise.all(examPromises);
        const allTestExams = examArrays.flat();
        setExams(allTestExams);
      } catch (err) {
        console.error("Lỗi khi tải danh sách đề kiểm tra:", err);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestExams();
  }, [studentUsername]);

  const getExamStatus = (exam) => {
    const now = new Date();
    const open = exam.openTime ? new Date(exam.openTime) : null;
    const close = exam.closeTime ? new Date(exam.closeTime) : null;

    if (!open) return { text: "Chưa đặt lịch", color: "#94a3b8", type: "unset" };
    if (now < open) return { text: "Chưa mở", color: "#f59e0b", type: "not-open" };
    if (close && now > close) return { text: "Đã đóng", color: "#dc2626", type: "closed" };
    return { text: "Đang mở", color: "#16a34a", type: "open" };
  };

  const formatDateTime = (str) => {
    if (!str) return "Chưa đặt";
    const d = new Date(str);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartExam = (exam) => {
    const status = getExamStatus(exam);
    if (status.type === "open") {
      navigate(`/take-test/${exam._id}`);
    } else {
      alert("Đề này chưa mở hoặc đã đóng!");
    }
  };

  return (
    <div className="student-exams-container">
      <div className="student-exams-header">
        <h2>📝 Bài kiểm tra của tôi</h2>
        <p>Danh sách tất cả đề kiểm tra mà bạn được tham gia.</p>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Đang tải danh sách đề...</p>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có bài kiểm tra nào được giao.</p>
          <small>Hãy liên hệ giáo viên để được thêm vào lớp học.</small>
        </div>
      ) : (
        <div className="exam-list">
          {exams
            .filter((exam) => {
              const now = new Date();
              const close = exam.closeTime ? new Date(exam.closeTime) : null;
              return !close || now <= close;
            })
            .map((exam) => {
              const status = getExamStatus(exam);
              const isOpen = status.type === "open";

              return (
                <div key={exam._id} className="exam-item">
                  <div className="exam-left">
                    <div className={`status-tag ${status.type}`}>
                      {status.text}
                    </div>
                    <h3>{exam.title}</h3>
                    <p className="exam-meta">
                      <strong>{exam.subjectName}</strong> • {exam.className}
                    </p>
                    <p className="exam-time">
                      ⏱️ {exam.duration} phút | Mở: {formatDateTime(exam.openTime)} | Đóng: {formatDateTime(exam.closeTime)}
                    </p>
                    {exam.description && (
                      <p className="exam-attempts">
                        Ghi chú: <strong>{exam.description}</strong>
                      </p>
                    )}
                  </div>

                  <div className="exam-right">
                    <button
                      className={`start-btn ${isOpen ? "active" : "disabled"}`}
                      disabled={!isOpen}
                      onClick={() => handleStartExam(exam)}
                    >
                      {isOpen ? "Làm bài" : "Chưa thể làm"}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default StudentTestExamsPage;
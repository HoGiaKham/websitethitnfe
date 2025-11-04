import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/StudentExamsPage.css";

function StudentExamsPage({ studentUsername }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyExams = async () => {
      if (!studentUsername) {
        setLoading(false);
        return;
      }

      try {
        const classesRes = await axios.get("http://localhost:5000/api/classes");
        const allClasses = classesRes.data;

        const myClasses = allClasses.filter(cls =>
          cls.students?.some(s => s.username === studentUsername)
        );

        const examPromises = myClasses.map(async (cls) => {
          const subjectId = cls.subject?._id;
          if (!subjectId) return [];

          try {
            const res = await axios.get(
              "http://localhost:5000/api/practice-exams/by-class-subject",
              { params: { classId: cls._id, subjectId } }
            );
            return res.data.map(exam => ({
              ...exam,
              className: cls.className,
              subjectName: cls.subject?.name
            }));
          } catch {
            return [];
          }
        });

        const examArrays = await Promise.all(examPromises);
        const allMyExams = examArrays.flat();
        setExams(allMyExams);
      } catch (err) {
        console.error("Lỗi khi tải danh sách đề:", err);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyExams();
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
    if (status.type === "open") navigate(`/exam/${exam._id}`);
    else alert("Đề này chưa mở hoặc đã đóng!");
  };

  const handleViewReview = (examId) => navigate(`/exam-review/${examId}`);

  const getAttemptCount = (examId) => {
    const history = JSON.parse(localStorage.getItem(`exam-${examId}-history`)) || [];
    return history.length;
  };

  const hasHistory = (examId) => {
    const history = JSON.parse(localStorage.getItem(`exam-${examId}-history`)) || [];
    return history.length > 0;
  };

  return (
    <div className="student-exams-container">
      <div className="student-exams-header">
        <h2>🎯 Bài luyện tập của tôi</h2>
        <p>Danh sách tất cả đề mà bạn được tham gia.</p>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Đang tải danh sách đề...</p>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có đề luyện tập nào được giao.</p>
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
                      Mở: {formatDateTime(exam.openTime)} | Đóng:{" "}
                      {formatDateTime(exam.closeTime)}
                    </p>
                    <p className="exam-attempts">
                      Đã làm <strong>{getAttemptCount(exam._id)}</strong> lần
                    </p>
                  </div>

                  <div className="exam-right">
                    <button
                      className={`start-btn ${isOpen ? "active" : "disabled"}`}
                      disabled={!isOpen}
                      onClick={() => handleStartExam(exam)}
                    >
                      Làm bài
                    </button>
                    {hasHistory(exam._id) && (
                      <button
                        className="review-btn"
                        onClick={() => handleViewReview(exam._id)}
                      >
                        Xem kết quả
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default StudentExamsPage;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/TakeExamPage.css";
import { useLocation } from "react-router-dom";

function TakeTestExamPage() {
  const { examId } = useParams();
  const location = useLocation();
  const initialAnswers = location.state?.answers || {};
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState(initialAnswers);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const QUESTIONS_PER_PAGE = 3;

  useEffect(() => {
    fetchExamForStudent();
  }, [examId]);

  useEffect(() => {
    if (!exam) return;
    let endTime = localStorage.getItem(`test-exam-${examId}-endTime`);
    if (!endTime) {
      endTime = Date.now() + (exam.duration || 60) * 60 * 1000;
      localStorage.setItem(`test-exam-${examId}-endTime`, endTime);
    } else {
      endTime = parseInt(endTime);
    }

    const updateTime = () => {
      const now = Date.now();
      const diff = Math.ceil((endTime - now) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        handleFinalSubmit(true);
      } else {
        setTimeLeft(diff);
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [exam, examId]);

  const fetchExamForStudent = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/test-exams/student/${examId}/take`);

      if (!res.ok) {
        let errorMessage = "Không thể tải đề thi";
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error response");
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (!data || !data._id) {
        throw new Error("Dữ liệu đề thi không hợp lệ");
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error("Đề thi không có câu hỏi nào");
      }

      setExam(data);
      setTimeLeft(data.duration * 60);
    } catch (err) {
      const errorMessage = err.message || "Đã xảy ra lỗi khi tải đề thi";

      Swal.fire({
        icon: "error",
        title: "Không thể tải đề thi",
        text: errorMessage,
        confirmButtonText: "Quay lại",
        allowOutsideClick: false
      }).then(() => {
        navigate("/myTest");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    const newAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(newAnswers);
    localStorage.setItem(`test-exam-${examId}-answers`, JSON.stringify(newAnswers));
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    exam.questions.forEach((q) => {
      const question = q.questionId;
      const userAnswer = answers[question._id];
      const correctAnswer =
        question.originalCorrectAnswer !== undefined
          ? question.originalCorrectAnswer
          : question.correctAnswer;

      totalPoints += q.points || 0;

      if (userAnswer === correctAnswer) {
        correctCount++;
        earnedPoints += q.points || 0;
      }
    });

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return {
      correctCount,
      totalQuestions: exam.questions.length,
      earnedPoints: earnedPoints.toFixed(2),
      totalPoints: totalPoints.toFixed(2),
      percentage: percentage.toFixed(2)
    };
  };

  const handleSubmit = () => {
    setShowSummaryModal(true);
  };

  const handleGoBack = () => {
    setShowSummaryModal(false);
  };

  const handleConfirmSubmit = () => {
    setShowSummaryModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmitted) return;

    setIsSubmitted(true);
    const score = calculateScore();

    await Swal.fire({
      title: isAutoSubmit ? "Hết giờ! Đã tự động nộp bài" : "Kết quả",
      html: `
        <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <p style="margin: 10px 0; font-size: 16px;"><strong>Số câu đúng:</strong> <span style="color: #28a745; font-weight: bold;">${score.correctCount}/${score.totalQuestions}</span></p>
          <p style="margin: 10px 0; font-size: 16px;"><strong>Điểm:</strong> <span style="color: #007bff; font-weight: bold;">${score.earnedPoints}/${score.totalPoints}</span></p>
          <p style="margin: 10px 0; font-size: 16px;"><strong>Tỷ lệ:</strong> <span style="color: #6c757d; font-weight: bold;">${score.percentage}%</span></p>
        </div>
      `,
      icon: score.percentage >= exam.passingScore ? "success" : "error",
      confirmButtonText: "Quay lại danh sách",
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      localStorage.removeItem(`test-exam-${examId}-answers`);
      localStorage.removeItem(`test-exam-${examId}-endTime`);
      navigate("/myTest");
    });
  };

  const handleQuestionClick = (index) => {
    const targetPage = Math.floor(index / QUESTIONS_PER_PAGE);
    setCurrentPage(targetPage);
    document.getElementById(`question-${index}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextPage = () => {
    if ((currentPage + 1) * QUESTIONS_PER_PAGE < exam.questions.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) return <p>Đang tải đề thi...</p>;
  if (!exam) return <p>Không tìm thấy đề thi!</p>;

  const currentQuestions = exam.questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  return (
    <div className="exam-container">
      {/* SIDEBAR - Danh sách câu hỏi */}
      <div className="sidebar">
        <h3>Danh sách câu hỏi</h3>
        <div className="question-list">
          {exam.questions.map((q, i) => {
            const isAnswered = answers[q.questionId._id] !== undefined;
            const isFlagged = flaggedQuestions.includes(q.questionId._id);

            const startIndex = currentPage * QUESTIONS_PER_PAGE;
            const endIndex = startIndex + QUESTIONS_PER_PAGE;
            const isCurrentPage = i >= startIndex && i < endIndex;

            return (
              <div
                key={q._id}
                className={`question-number ${isAnswered ? "answered" : ""} ${isFlagged ? "flagged" : ""} ${isCurrentPage ? "current-page" : ""}`}
                onClick={() => handleQuestionClick(i)}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="header">
          <div onClick={() => navigate(-1)} style={{ cursor: "pointer", color: "blue" }}>
            ← Quay lại
          </div>
          <h2>{exam.title}</h2>
          <div className="timer">⏰ {formatTime(timeLeft)}</div>
        </div>

        {currentQuestions.map((currentQuestion, index) => {
          const question = currentQuestion.questionId;
          const globalIndex = currentPage * QUESTIONS_PER_PAGE + index;

          return (
            <div
              key={question._id}
              className="question-item"
              id={`question-${globalIndex}`}
            >
              <div className="question-item-header">
                <h3>
                  {globalIndex + 1}. {question.title}
                </h3>
                <button
                  className={`flag-btn ${flaggedQuestions.includes(question._id) ? "flagged" : ""}`}
                  onClick={() => toggleFlag(question._id)}
                >
                  🚩
                </button>
              </div>

              {question.imageUrl && (
                <div className="question-image">
                  <img src={`${import.meta.env.VITE_API_BASE_URL}${question.imageUrl}`} alt="question" />
                </div>
              )}

              {question.options.map((option, optIndex) => (
                <div key={optIndex} className="option">
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    checked={answers[question._id] === optIndex}
                    onChange={() => handleAnswerChange(question._id, optIndex)}
                  />
                  <label>{String.fromCharCode(65 + optIndex)}. {option}</label>
                </div>
              ))}
            </div>
          );
        })}

        <div className="bottom-buttons">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            style={{ marginTop: "20px" }}
          >
            ← Trang trước
          </button>
          <button
            onClick={handleNextPage}
            disabled={(currentPage + 1) * QUESTIONS_PER_PAGE >= exam.questions.length}
            style={{ marginTop: "20px" }}
          >
            Trang kế →
          </button>
          <button className="submit-btn" onClick={handleSubmit} style={{ marginTop: "20px" }}>
            Nộp bài
          </button>
        </div>
      </div>

      {/* SUMMARY MODAL */}
      {showSummaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Danh sách câu trả lời đã lưu:</h3>
            {exam.questions.map((q, i) => (
              <p key={q._id}>
                Câu {i + 1} — {answers[q.questionId._id] !== undefined ? "đã trả lời" : "chưa trả lời"}
              </p>
            ))}
            <div className="modal-buttons">
              <button onClick={handleGoBack}>Quay lại trang trước</button>
              <button onClick={handleConfirmSubmit}>Nộp bài</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Bạn xác nhận nộp bài?</h3>
            <div className="modal-buttons">
              <button onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button onClick={() => handleFinalSubmit(false)}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TakeTestExamPage;
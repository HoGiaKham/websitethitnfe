import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/PracticeReview.css";

const ExamReview = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // Lấy thông tin đề thi
        const examRes = await axios.get(`http://localhost:5000/api/practice-exams/${examId}`);
        setExamInfo(examRes.data);

        // Lấy câu hỏi
        const questionsRes = await axios.get(
          `http://localhost:5000/api/practice-exams/${examId}/questions`
        );
        setQuestions(questionsRes.data || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    // Lấy lịch sử làm bài từ localStorage
    const storedHistory = JSON.parse(localStorage.getItem(`exam-${examId}-history`) || "[]");
    setHistory(storedHistory);
    if (storedHistory.length > 0) {
      setSelectedAttempt(storedHistory[storedHistory.length - 1]);
    } else {
      setSelectedAttempt(null);
    }

    fetchExamData();
  }, [examId]);

  const handleAttemptChange = (e) => {
    const index = Number(e.target.value);
    setSelectedAttempt(history[index]);
  };

  const onClickBack = () => {
    navigate(-1);
  };

  if (loading) return <p className="loading-text">Đang tải kết quả...</p>;
  if (!examInfo) return <p>Không tìm thấy đề thi!</p>;
  if (!selectedAttempt) return <p className="no-result">Chưa có kết quả</p>;

  const { score, total, answers, date } = selectedAttempt;

  // Lấy index của selectedAttempt dựa trên date
  const selectedIndex = history.findIndex((attempt) => attempt.date === selectedAttempt.date);

  return (
    <div className="review-container">
      <div className="header">
        <div onClick={onClickBack} style={{ cursor: "pointer", color: "blue" }}>
          ← Quay lại
        </div>
        <h2>{examInfo.title}</h2>
      </div>

      {history.length > 1 && (
        <div className="history-selector">
          <label>Chọn lần làm:</label>
          <select value={selectedIndex} onChange={handleAttemptChange}>
            {history.map((attempt, index) => (
              <option key={index} value={index}>
                Lần {index + 1} - {new Date(attempt.date).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="score-box">
        <div className="score-row">
          <p>
            <strong>Số câu làm đúng:</strong> {score}/{total}
          </p>
          <p>
            <strong>Ngày làm:</strong> {date}
          </p>
        </div>
      </div>

      <div className="questions-list">
        {questions.map((q, i) => {
          const userAnswer = answers[q._id];
          const isCorrect = userAnswer === q.correctAnswer;
          const isAnswered = userAnswer !== undefined;

          return (
            <div key={q._id} className="question-box">
<div 
  className="question-title"
  dangerouslySetInnerHTML={{ 
    __html: `Câu ${i + 1}: ${q.title}` 
  }} 
/>
              <div className="options">
                {q.options.map((option, optIndex) => {
                  let optionClass = "option";
                  if (optIndex === q.correctAnswer) optionClass += " correct";
                  if (optIndex === userAnswer && !isCorrect) optionClass += " incorrect";
                  if (optIndex === userAnswer && isCorrect) optionClass += " correct";
                  return (
                    <div key={optIndex} className={optionClass}>
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </div>
                  );
                })}
              </div>
              <div
                className={`status-text ${
                  !isAnswered ? "not-answered" : isCorrect ? "correct" : "incorrect"
                }`}
              >
                {!isAnswered
                  ? `Chưa trả lời - Đáp án đúng: ${String.fromCharCode(65 + q.correctAnswer)}`
                  : isCorrect
                  ? "✔ Đúng"
                  : `✖ Sai — Đáp án đúng: ${String.fromCharCode(65 + q.correctAnswer)}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="review-buttons">
        <button onClick={() => navigate("/myExams")}>Quay lại danh sách đề</button>
      </div>
    </div>
  );
};

export default ExamReview;

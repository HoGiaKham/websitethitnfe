import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PracticeExamDetailPage.css";

const BASE_URL = "http://localhost:5000/api";

function PracticeExamDetailPage({ setPage }) {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const addMenuRef = useRef(null);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRandomAddModal, setShowRandomAddModal] = useState(false);
  const [randomCount, setRandomCount] = useState(1);
  const [selectedRandomCategory, setSelectedRandomCategory] = useState("all");
  const titleEditorRef = useRef(null);
const imageInputRef = useRef(null);
const [boldActive, setBoldActive] = useState(false);
const [italicActive, setItalicActive] = useState(false);
const [underlineActive, setUnderlineActive] = useState(false);
const [imageFile, setImageFile] = useState(null);
const [showOverLimitModal, setShowOverLimitModal] = useState(false);
const [overLimitInfo, setOverLimitInfo] = useState({
  categoryName: "",
  available: 0,
  requested: 0
});
  const handleRandomAdd = async () => {
    setShowAddMenu(false);
    await fetchBankQuestions();
    setShowRandomAddModal(true);
  };

  const resetManualForm = () => {
  setTitle("");
  if (titleEditorRef.current) titleEditorRef.current.innerHTML = "";
  setOptions(["", "", "", ""]);
  setCorrectAnswer(0);
  setDifficulty("Trung bình");
  setImageFile(null);
  setBoldActive(false);
  setItalicActive(false);
  setUnderlineActive(false);
};

const applyFormat = (command, value = null) => {
  document.execCommand(command, false, value);
  titleEditorRef.current?.focus();
  updateButtonStates();
};

const updateButtonStates = () => {
  setBoldActive(document.queryCommandState('bold'));
  setItalicActive(document.queryCommandState('italic'));
  setUnderlineActive(document.queryCommandState('underline'));
};

const handleEditorInput = (e) => {
  setTitle(e.currentTarget.innerHTML);
};

const insertImageIntoEditor = () => {
  imageInputRef.current?.click();
};

const handleImageSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setImageFile(file);
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = `<img src="${ev.target.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
    document.execCommand('insertHTML', false, img);
  };
  reader.readAsDataURL(file);
};

const clearEditor = () => {
  if (titleEditorRef.current) {
    titleEditorRef.current.innerHTML = "";
    setTitle("");
  }
};
const proceedRandomAdd = async (count) => {
  let filteredQuestions = bankQuestions;

  if (selectedRandomCategory !== "all") {
    filteredQuestions = filteredQuestions.filter(
      q => q.categoryId === selectedRandomCategory || q.categoryId?._id === selectedRandomCategory
    );
  }

  if (filteredQuestions.length === 0) {
    alert("Không có câu hỏi nào trong chương đã chọn.");
    return;
  }

  const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  try {
    const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: selected.map(q => q._id) }),
    });

    if (!res.ok) throw new Error("Không thể thêm câu hỏi ngẫu nhiên");

    await fetchQuestions();
    setShowRandomAddModal(false);
    setRandomCount(1); // reset
    alert(`Đã thêm ngẫu nhiên ${selected.length} câu hỏi vào đề luyện tập`);
  } catch (err) {
    console.error(err);
    alert("Lỗi khi thêm câu hỏi ngẫu nhiên");
  }
};
const handleConfirmRandomAdd = async () => {
  const available = getQuestionCountByCategory(selectedRandomCategory);
  
  if (randomCount > available) {
    const categoryName = selectedRandomCategory === "all" 
      ? "Tất cả các chương" 
      : examData.categories.find(cat => (cat._id || cat) === selectedRandomCategory)?.name || "Chương";

    setOverLimitInfo({
      categoryName,
      available,
      requested: randomCount
    });
    setShowOverLimitModal(true);
    return;
  }

  // Nếu hợp lệ → tiếp tục thêm
  await proceedRandomAdd(randomCount);
};

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions`);
      if (!res.ok) throw new Error("Không thể load questions");
      const data = await res.json();
      setQuestions(data || []);
    } catch (err) {
      console.error("Lỗi khi load questions:", err);
      setQuestions([]);
    }
  };

  useEffect(() => {
    if (!examId) {
      console.error("examId không hợp lệ");
      navigate("/practice-exam");
      return;
    }

    const fetchExam = async () => {
      try {
        const res = await fetch(`${BASE_URL}/practice-exams/${examId}`);
        if (!res.ok) throw new Error("Không thể load exam");
        const data = await res.json();
        setExamData(data);
      } catch (err) {
        console.error("Lỗi khi load exam:", err);
        setExamData(null);
        navigate("/practice-exam");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
    fetchQuestions();
  }, [examId, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const fetchBankQuestions = async () => {
    if (!examData || !examData.categories || examData.categories.length === 0) return;

    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/all-questions`);
      if (!res.ok) throw new Error("Không thể load ngân hàng câu hỏi");
      const data = await res.json();
      const currentQuestionIds = questions.map(q => q._id);
      const availableQuestions = data.filter(q => !currentQuestionIds.includes(q._id));
      setBankQuestions(availableQuestions);
    } catch (err) {
      console.error("Lỗi khi load ngân hàng câu hỏi:", err);
      alert("Lỗi: Không thể tải ngân hàng câu hỏi");
    }
  };



  const handleAddMenuClick = (e) => {
    e.stopPropagation();
    setShowAddMenu(true);
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 200;
    const menuHeight = 100;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
    setAddMenuPosition({ x, y });
  };

  const handleManualAdd = () => {
    setShowAddMenu(false);
    setIsAddQuestionModalOpen(true);
  };

  const handleBankAdd = async () => {
    setShowAddMenu(false);
    await fetchBankQuestions();
    setShowQuestionBankModal(true);
  };

  const removeVietnameseTones = (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
const getQuestionCountByCategory = (categoryId) => {
  if (!bankQuestions || bankQuestions.length === 0) return 0;

  if (categoryId === "all") {
    return bankQuestions.length;
  }

  return bankQuestions.filter(q => 
    q.categoryId === categoryId || 
    (q.categoryId && q.categoryId._id === categoryId)
  ).length;
};
  const toggleSelectBankQuestion = (questionId) => {
    setSelectedBankQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddFromBank = async () => {
    if (selectedBankQuestions.length === 0) {
      alert("Vui lòng chọn ít nhất một câu hỏi");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: selectedBankQuestions }),
      });

      if (!res.ok) throw new Error("Không thể thêm câu hỏi");

      await fetchQuestions();
      setShowQuestionBankModal(false);
      setSelectedBankQuestions([]);
      alert(`Thành công! Đã thêm ${selectedBankQuestions.length} câu hỏi`);
    } catch (error) {
      alert("Lỗi: Không thể thêm câu hỏi từ ngân hàng");
      console.error(error);
    }
  };

const handleAddQuestion = async () => {
  const titleHTML = titleEditorRef.current?.innerHTML || "";
  if (!titleHTML.trim()) {
    alert("Vui lòng nhập câu hỏi");
    return;
  }
  if (options.some(opt => !opt.trim())) {
    alert("Vui lòng nhập đầy đủ 4 đáp án");
    return;
  }

const formData = new FormData();
formData.append("title", titleHTML);
formData.append("options", JSON.stringify(options));
formData.append("correctAnswer", correctAnswer);
formData.append("difficulty", difficulty);

formData.append("categoryId", examData.categories[0]._id);

if (imageFile) {
  formData.append("image", imageFile);
}

  try {
    const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Lỗi server");
    }

    await fetchQuestions();
    alert("Đã thêm câu hỏi thành công!");
    setIsAddQuestionModalOpen(false);
    resetManualForm();
  } catch (error) {
    alert("Lỗi: " + error.message);
    console.error(error);
  }
};

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi?");

    if (confirmed) {
      try {
        const res = await fetch(`${BASE_URL}/practice-exams/${examId}/questions/${questionId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Không thể xóa câu hỏi");

        await fetchQuestions();
        alert("Đã xóa! Câu hỏi đã được xóa khỏi đề thi");
      } catch (error) {
        alert("Lỗi: Không thể xóa câu hỏi");
        console.error(error);
      }
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (loading) {
    return (
      <div className="practice-exam-detail-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="practice-exam-detail-page">
        <div className="error">Không tìm thấy đề thi</div>
      </div>
    );
  }

  return (
    <div className="practice-exam-detail-page">
      <div className="header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate("/practice-exam")}>
            ← Quay lại
          </button>
          <h3 className="exam-title">{examData.title}</h3>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Tìm kiếm câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button className="add-question-btn" onClick={handleAddMenuClick}>
            + Thêm câu hỏi
          </button>
        </div>
      </div>

      {showAddMenu && (
        <div
          ref={addMenuRef}
          className="context-menu"
          style={{
            top: addMenuPosition.y,
            left: addMenuPosition.x,
            pointerEvents: "auto",
            position: "fixed",
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: "180px",
          }}
        >
          <div
            className="context-menu-item"
            onClick={handleManualAdd}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            Thêm thủ công
          </div>
          <div
            className="context-menu-item"
            onClick={handleBankAdd}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Chọn từ ngân hàng câu hỏi
          </div>
          <div
            className="context-menu-item"
            onClick={handleRandomAdd}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
            }}
          >
            Thêm ngẫu nhiên từ ngân hàng câu hỏi
          </div>
        </div>
      )}

<div className="exam-info">
  <div className="info-item">
    <span className="info-label">Số câu hỏi:</span>
    <span className="info-value">{questions.length} câu</span>
  </div>
  <div className="info-item">
    <span className="info-label">Môn học:</span>
    <span className="info-value">{examData.subject?.name}</span>
  </div>
  <div className="info-item">
    <span className="info-label">Phân bố độ khó:</span>
    <span className="info-value">
      {(() => {
        const counts = { "Dễ": 0, "Trung bình": 0, "Khó": 0, "Rất khó": 0 };
        questions.forEach(q => counts[q.difficulty] = (counts[q.difficulty] || 0) + 1);
        return Object.entries(counts)
          .filter(([_, c]) => c > 0)
          .map(([level, c]) => `${c} ${level.toLowerCase()}`)
          .join(", ");
      })()}
    </span>
  </div>
</div>


      <div className="questions-section">
        <h4>Danh sách câu hỏi</h4>
        {questions.length === 0 ? (
          <p className="no-questions">Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
        ) : (
          <div className="questions-list">
            {questions
              .filter(q => {
                if (!searchTerm.trim()) return true;
                const normalizedTitle = removeVietnameseTones(q.title);
                const normalizedSearch = removeVietnameseTones(searchTerm);
                return normalizedTitle.includes(normalizedSearch);
              })
              .map((question, index) => (
                <div key={question._id} className="question-item">
                  <div className="question-header">
                    <span className="question-number">Câu {index + 1}</span>
                    <button className="delete-btn" onClick={() => handleDeleteQuestion(question._id)}>
                      Xóa
                    </button>
                  </div>
<div 
  className="question-text"
  dangerouslySetInnerHTML={{ __html: question.title }}
/>                  {question.imageUrl && (
                    <div
                      style={{
                        marginTop: "12px",
                        marginBottom: "12px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={`http://localhost:5000${question.imageUrl}`}
                        alt="question"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          objectFit: "contain",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          window.open(`http://localhost:5000${question.imageUrl}`, "_blank");
                        }}
                      />
                    </div>
                  )}
                  <div className="options-list">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`option ${optIndex === question.correctAnswer ? "correct" : ""}`}
                      >
                        <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                  <div className="difficulty">
                    <strong>Độ khó:</strong> {question.difficulty}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

{isAddQuestionModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content" style={{ maxWidth: "800px" }}>
      <div className="modal-header">
        <h4>Thêm câu hỏi mới</h4>
        <button
          className="modal-close-btn"
          onClick={() => {
            setIsAddQuestionModalOpen(false);
            resetManualForm();
          }}
        >
          ×
        </button>
      </div>

      {/* Toolbar */}
      <div className="editor-toolbar" style={{
        display: "flex",
        gap: "8px",
        padding: "10px",
        backgroundColor: "#f5f5f5",
        border: "1px solid #ddd",
        borderRadius: "6px",
        flexWrap: "wrap",
        marginBottom: "15px"
      }}>
        <button type="button" onClick={() => applyFormat('bold')} className={`toolbar-btn ${boldActive ? 'active' : ''}`}>
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => applyFormat('italic')} className={`toolbar-btn ${italicActive ? 'active' : ''}`}>
          <em>I</em>
        </button>
        <button type="button" onClick={() => applyFormat('underline')} className={`toolbar-btn ${underlineActive ? 'active' : ''}`}>
          <u>U</u>
        </button>
        <select onChange={(e) => applyFormat('fontName', e.target.value)} defaultValue="">
          <option value="" disabled>Kiểu chữ</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
        <select onChange={(e) => applyFormat('fontSize', e.target.value)} defaultValue="">
          <option value="" disabled>Cỡ chữ</option>
          <option value="3">Bình thường</option>
          <option value="5">Lớn</option>
          <option value="7">Rất lớn</option>
        </select>
        <button type="button" onClick={insertImageIntoEditor} className="toolbar-btn">
          Ảnh
        </button>
        <button type="button" onClick={clearEditor} className="toolbar-btn" style={{ marginLeft: "auto", background: "#e74c3c", color: "white" }}>
          Xóa nội dung
        </button>
      </div>

      {/* Rich Text Editor */}
      <div
        ref={titleEditorRef}
        contentEditable
        className="rich-text-editor"
        placeholder="Nhập nội dung câu hỏi... (hỗ trợ in đậm, nghiêng, chèn ảnh)"
        style={{
          minHeight: "120px",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          marginBottom: "15px",
          outline: "none",
          fontSize: "16px",
          lineHeight: "1.6"
        }}
        onInput={handleEditorInput}
        onMouseUp={updateButtonStates}
        onKeyUp={updateButtonStates}
      />

      {/* Upload ảnh ẩn */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: "none" }}
      />

      {/* Độ khó */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px" }}>
          Độ khó:
        </label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            fontSize: "15px"
          }}
        >
          <option value="Dễ">Dễ</option>
          <option value="Trung bình">Trung bình</option>
          <option value="Khó">Khó</option>
          <option value="Rất khó">Rất khó</option>
        </select>
      </div>

      {/* Đáp án */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontWeight: "bold", display: "block", marginBottom: "10px" }}>
          Đáp án:
        </label>
        {options.map((opt, idx) => (
          <div key={idx} style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "6px",
            border: "1px solid #eee"
          }}>
            <span style={{ fontWeight: "bold", width: "30px", color: "#2c3e50" }}>
              {String.fromCharCode(65 + idx)}.
            </span>
            <input
              type="text"
              placeholder={`Nhập đáp án ${String.fromCharCode(65 + idx)}`}
              value={opt}
              onChange={(e) => {
                const newOpts = [...options];
                newOpts[idx] = e.target.value;
                setOptions(newOpts);
              }}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "15px"
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input
                type="radio"
                name="correct"
                checked={correctAnswer === idx}
                onChange={() => setCorrectAnswer(idx)}
              />
              <span>Đúng</span>
            </label>
          </div>
        ))}
      </div>

      {/* Hành động */}
      <div className="modal-actions" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button
          onClick={handleAddQuestion}
          style={{
            padding: "12px 24px",
            backgroundColor: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            cursor: "pointer"
          }}
        >
          Thêm câu hỏi
        </button>
        <button
          onClick={() => {
            setIsAddQuestionModalOpen(false);
            resetManualForm();
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            cursor: "pointer"
          }}
        >
          Hủy
        </button>
      </div>
    </div>
  </div>
)}

      {showQuestionBankModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "900px", maxHeight: "85vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h4>Chọn câu hỏi từ ngân hàng</h4>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowQuestionBankModal(false);
                  setSelectedBankQuestions([]);
                  setExpandedCategories([]);
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Đã chọn: {selectedBankQuestions.length} câu hỏi</strong>
              {bankQuestions.length > 0 && (
                <button
                  onClick={() => {
                    if (expandedCategories.length === examData.categories.length) {
                      setExpandedCategories([]);
                    } else {
                      setExpandedCategories(examData.categories.map(cat => cat._id || cat));
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: "13px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {expandedCategories.length === examData.categories.length ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                </button>
              )}
            </div>

            {bankQuestions.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666", padding: "40px 20px" }}>
                Không có câu hỏi nào trong ngân hàng hoặc tất cả đã được thêm vào đề thi.
              </p>
            ) : (
              <div className="bank-questions-by-category">
                {examData.categories.map((category) => {
                  const categoryId = category._id || category;
                  const categoryName = category.name || "Chương";
                  const categoryQuestions = bankQuestions.filter(q =>
                    (q.categoryId === categoryId || q.categoryId?._id === categoryId) &&
                    removeVietnameseTones(q.title || "").includes(removeVietnameseTones(searchTerm))
                  );

                  if (categoryQuestions.length === 0) return null;

                  const isExpanded = expandedCategories.includes(categoryId);
                  const selectedInCategory = categoryQuestions.filter(q =>
                    selectedBankQuestions.includes(q._id)
                  ).length;

                  return (
                    <div key={categoryId} style={{ marginBottom: "20px", border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
                      <div
                        onClick={() => toggleCategoryExpand(categoryId)}
                        style={{
                          padding: "15px 20px",
                          backgroundColor: "#f5f5f5",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          userSelect: "none",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ececec")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          <span style={{ fontSize: "16px", fontWeight: "600" }}>
                            {categoryName}
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#666",
                              backgroundColor: "#fff",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {categoryQuestions.length} câu
                          </span>
                        </div>
                        {selectedInCategory > 0 && (
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#2196F3",
                              fontWeight: "600",
                              backgroundColor: "#E3F2FD",
                              padding: "4px 10px",
                              borderRadius: "12px",
                            }}
                          >
                            Đã chọn: {selectedInCategory}
                          </span>
                        )}
                      </div>
{/* <input
  type="number"
  min="1"
  max={getQuestionCountByCategory(selectedRandomCategory)}
  value={randomCount}
  onChange={(e) => {
    const val = parseInt(e.target.value) || 1;
    const max = getQuestionCountByCategory(selectedRandomCategory);
    setRandomCount(val > max ? max : val);
  }}
  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
/> */}
                      {isExpanded && (
                        <div style={{ padding: "15px" }}>
                          {categoryQuestions.map((question, index) => (
                            <div
                              key={question._id}
                              style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "15px",
                                marginBottom: "12px",
                                backgroundColor: selectedBankQuestions.includes(question._id) ? "#e3f2fd" : "white",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onClick={() => toggleSelectBankQuestion(question._id)}
                            >
                              <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedBankQuestions.includes(question._id)}
                                  onChange={() => toggleSelectBankQuestion(question._id)}
                                  style={{ marginTop: "5px", width: "18px", height: "18px", cursor: "pointer" }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "15px" }}
                                    dangerouslySetInnerHTML={{ 
    __html: `Câu ${index + 1}: ${question.title}` 
  }}
                                  />
                                  {question.imageUrl && (
                                    <div style={{ marginBottom: "12px", marginLeft: "10px" }}>
                                      <img
                                        src={`http://localhost:5000${question.imageUrl}`}
                                        alt="question image"
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "250px",
                                          borderRadius: "6px",
                                          border: "1px solid #ddd",
                                          objectFit: "contain",
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div style={{ fontSize: "14px", color: "#666", marginLeft: "10px" }}>
                                    {question.options.map((opt, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          marginBottom: "6px",
                                          padding: "6px 10px",
                                          borderRadius: "4px",
                                          backgroundColor: idx === question.correctAnswer ? "#e8f5e9" : "#fafafa",
                                          color: idx === question.correctAnswer ? "#2e7d32" : "#666",
                                          fontWeight: idx === question.correctAnswer ? "600" : "normal",
                                          border: idx === question.correctAnswer ? "1px solid #81c784" : "1px solid #eee",
                                        }}
                                      >
                                        {String.fromCharCode(65 + idx)}. {opt}
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#999", display: "flex", gap: "15px" }}>
                                    <span>
                                      <strong>Độ khó:</strong> {question.difficulty || "Trung bình"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "20px", position: "sticky", bottom: 0, backgroundColor: "white", padding: "15px 0", borderTop: "1px solid #eee" }}>
              <button
                onClick={handleAddFromBank}
                className="confirm-btn"
                disabled={selectedBankQuestions.length === 0}
                style={{
                  opacity: selectedBankQuestions.length === 0 ? 0.5 : 1,
                  cursor: selectedBankQuestions.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Thêm {selectedBankQuestions.length > 0 ? `${selectedBankQuestions.length} câu hỏi` : "câu hỏi"}
              </button>
              <button
                onClick={() => {
                  setShowQuestionBankModal(false);
                  setSelectedBankQuestions([]);
                  setExpandedCategories([]);
                }}
                className="cancel-btn"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Thêm ngẫu nhiên - nằm dưới */}
      {showRandomAddModal && (
        <div className="modal-overlay" style={{ zIndex: 5000 }}>
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            {/* ... nội dung như cũ ... */}
            <div className="modal-header">
              <h4>Thêm ngẫu nhiên câu hỏi</h4>
              <button
                className="modal-close-btn"
                onClick={() => setShowRandomAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Chọn chương:</label>
              <select
                value={selectedRandomCategory}
                onChange={(e) => setSelectedRandomCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              >
                <option value="all">
                  Tất cả các chương ({getQuestionCountByCategory("all")} câu hỏi)
                </option>
                {examData.categories.map((cat) => {
                  const catId = cat._id || cat;
                  const count = getQuestionCountByCategory(catId);
                  return (
                    <option key={catId} value={catId}>
                      {cat.name || "Chương"} ({count} câu hỏi)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>Số lượng câu hỏi ngẫu nhiên:</label>
              <input
                type="number"
                min="1"
                max={getQuestionCountByCategory(selectedRandomCategory)}
                value={randomCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const max = getQuestionCountByCategory(selectedRandomCategory);
                  setRandomCount(val > max ? max : val);
                }}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleConfirmRandomAdd} className="confirm-btn">
                Xác nhận
              </button>
              <button onClick={() => setShowRandomAddModal(false)} className="cancel-btn">
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cảnh báo - nằm trên, z-index cao hơn */}
      {showOverLimitModal && (
        <div className="modal-overlay" style={{ zIndex: 5100 }}>
          <div className="modal-content" style={{ maxWidth: "420px", textAlign: "center" }}>
            <div className="modal-header">
              <h4 style={{ color: "#e67e22" }}>Cảnh báo số lượng</h4>
              <button
                className="modal-close-btn"
                onClick={() => setShowOverLimitModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px", fontSize: "15px", lineHeight: "1.6" }}>
              <p>
                <strong>{overLimitInfo.categoryName}</strong> chỉ có{" "}
                <strong style={{ color: "#e74c3c" }}>{overLimitInfo.available} câu hỏi</strong>
                <br />
                nhưng bạn yêu cầu thêm <strong>{overLimitInfo.requested} câu</strong>.
              </p>
              <p style={{ margin: "16px 0", color: "#27ae60", fontWeight: "600" }}>
                → Bạn có muốn thêm <strong>{overLimitInfo.available} câu</strong> (tối đa có thể)?
              </p>
            </div>

            <div className="modal-actions" style={{ gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => {
                  setShowOverLimitModal(false);
                  proceedRandomAdd(overLimitInfo.available);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#27ae60",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "15px",
                  cursor: "pointer"
                }}
              >
                Xác nhận thêm {overLimitInfo.available} câu
              </button>
              <button
                onClick={() => setShowOverLimitModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#95a5a6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "15px",
                  cursor: "pointer"
                }}
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

export default PracticeExamDetailPage;
import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { fetchQuestions, addQuestion, updateQuestion, deleteQuestion, importQuestions } from "../api";
import "../styles/QuestionPage.css";
// import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

function QuestionPage({ categoryId, categoryName, subjectName, subjectId, onGoBack }) {
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(null);
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const addMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState([]);
  const [expandedLevels, setExpandedLevels] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("Tất cả");
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const titleEditorRef = useRef(null);

  const difficultyLevels = ["Dễ", "Trung bình", "Khó", "Rất khó"];

  useEffect(() => {
    fetchQuestions(categoryId).then(setQuestions).catch(err => console.error("Fetch questions error:", err));
  }, [categoryId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu]);

  const toggleExpand = (id) => {
    setExpandedQuestionId(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };
  
  const toggleLevelExpand = (level) => {
    setExpandedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const insertImageIntoEditor = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = `<img src="${event.target.result}" style="max-width: 100%; height: auto;" />`;
          document.execCommand('insertHTML', false, img);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
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

  const handleEditorMouseUp = () => {
    updateButtonStates();
  };

  const handleEditorKeyUp = (e) => {
    setTitle(e.currentTarget.innerHTML);
    updateButtonStates();
  };

  const handleAddQuestion = async () => {
    const titleContent = titleEditorRef.current?.innerHTML || title;
    if (!titleContent || correct === null) return;

    const formData = new FormData();
    formData.append("title", titleContent);
    formData.append("options", JSON.stringify(options));
    formData.append("correctAnswer", correct);
    formData.append("difficulty", difficulty);
    if (image) {
      formData.append("image", image);
    }

    try {
      await addQuestion(categoryId, formData);
      resetForm();
      fetchQuestions(categoryId).then(setQuestions);
      Swal.fire("Thành công!", "Đã thêm câu hỏi mới.", "success");
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể thêm câu hỏi: " + err.message, "error");
    }
  };

  const handleUpdateQuestion = async (questionId) => {
    const titleContent = titleEditorRef.current?.innerHTML || title;
    if (!titleContent || correct === null) return;

    const formData = new FormData();
    formData.append("title", titleContent);
    formData.append("options", JSON.stringify(options));
    formData.append("correctAnswer", correct);
    formData.append("difficulty", difficulty);
    if (image) {
      formData.append("image", image);
    }

    try {
      await updateQuestion(questionId, formData);
      resetForm();
      fetchQuestions(categoryId).then(setQuestions);
      Swal.fire("Thành công!", "Đã cập nhật câu hỏi.", "success");
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể cập nhật câu hỏi: " + err.message, "error");
    }
  };

  const resetForm = () => {
    setEditingQuestionId(null);
    setTitle("");
    if (titleEditorRef.current) {
      titleEditorRef.current.innerHTML = "";
    }
    setOptions(["", "", "", ""]);
    setCorrect(null);
    setDifficulty("Trung bình");
    setImage(null);
    setShowAddForm(false);
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: "Bạn có chắc?",
      text: "Bạn có muốn xóa câu hỏi này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await deleteQuestion(questionId);
        fetchQuestions(categoryId).then(setQuestions);
        Swal.fire("Đã xóa!", "Câu hỏi đã được xóa.", "success");
      } catch (error) {
        Swal.fire("Lỗi!", error.response?.data?.message || "Không thể xóa câu hỏi.", "error");
      }
    }
  };

  const handleImportQuestions = async () => {
    if (!importFile) {
      Swal.fire("Lỗi!", "Vui lòng chọn file Excel.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await importQuestions(categoryId, formData);
      
      if (response.errors && response.errors.length > 0) {
        let errorMsg = `✅ Import thành công ${response.imported} câu hỏi.\n\n⚠️ Lỗi:\n`;
        response.errors.forEach(err => {
          errorMsg += err + "\n";
        });
        Swal.fire("Kết quả import", errorMsg, "warning");
      } else {
        Swal.fire("Thành công!", `${response.message}`, "success");
      }
      
      setShowImportForm(false);
      setImportFile(null);
      fileInputRef.current.value = "";
      fetchQuestions(categoryId).then(setQuestions);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Không thể import.";
      Swal.fire("Lỗi!", errorMsg, "error");
      fetchQuestions(categoryId).then(setQuestions);
    }
  };

  const handleImportClick = () => {
    setShowAddMenu(false);
    setShowImportForm(true);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const wsData = [
      ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Đáp án đúng (0-3)", "Độ khó"],
      ["Thủ đô của Việt Nam là gì?", "Hà Nội", "TP HCM", "Đà Nẵng", "Huế", "0", "Dễ"],
      ["Một năm có bao nhiêu tháng?", "11", "12", "13", "10", "1", "Dễ"],
      ["2 + 2 = ?", "3", "4", "5", "6", "1", "Trung bình"]
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(wsData);
    ws1['!cols'] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 }
    ];
    
    for (let i = 0; i < 7; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws1[cellRef]) {
        ws1[cellRef].fill = { fgColor: { rgb: "FF4472C4" } };
        ws1[cellRef].font = { bold: true, color: { rgb: "FFFFFFFF" } };
        ws1[cellRef].alignment = { horizontal: "center", vertical: "center", wrapText: true };
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws1, "Câu hỏi");
    
    const guideData = [
      ["HƯỚNG DẪN NHẬP CÂU HỎI"],
      [],
      ["CÁCH ĐIỀN:"],
      [],
      ["1. CỘT 'CÂU HỎI' (Bắt buộc)"],
      ["   - Nhập nội dung câu hỏi"],
      [],
      ["2. CỘT 'ĐÁP ÁN A, B, C, D'"],
      ["   - Nhập nội dung của từng đáp án"],
      [],
      ["3. CỘT 'ĐÁP ÁN ĐÚNG' (Bắt buộc - phải là 0, 1, 2 hoặc 3)"],
      ["   - 0 = Đáp án A là đúng"],
      ["   - 1 = Đáp án B là đúng"],
      ["   - 2 = Đáp án C là đúng"],
      ["   - 3 = Đáp án D là đúng"],
      [],
      ["4. CỘT 'ĐỘ KHÓ' (Tùy chọn)"],
      ["   - Nhập một trong 4 mức: Dễ, Trung bình, Khó, Rất khó"],
    ];
    
    const ws2 = XLSX.utils.aoa_to_sheet(guideData);
    ws2['!cols'] = [{ wch: 60 }];
    
    XLSX.utils.book_append_sheet(wb, ws2, "Hướng dẫn");
    XLSX.writeFile(wb, "Mau_Nhap_CauHoi.xlsx");
  };

  const handleExportQuestions = (exportType) => {
    let dataToExport = [];
    let fileName = "";

    if (exportType === "all") {
      dataToExport = questions;
      fileName = `${subjectName}_CacCauHoi.xlsx`;
    } else if (exportType === "category") {
      dataToExport = questions;
      fileName = `${categoryName}_CauHoi.xlsx`;
    }

    if (dataToExport.length === 0) {
      Swal.fire("Thông báo", "Không có câu hỏi nào để export.", "info");
      return;
    }

    const wb = XLSX.utils.book_new();

    const exportData = [
      ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Đáp án đúng", "Độ khó"]
    ];

    dataToExport.forEach(q => {
      const row = [
        q.title.replace(/<[^>]*>/g, ""),
        q.options[0] || "",
        q.options[1] || "",
        q.options[2] || "",
        q.options[3] || "",
        q.correctAnswer,
        q.difficulty || "Trung bình"
      ];
      exportData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 }
    ];

    for (let i = 0; i < 7; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cellRef]) {
        ws[cellRef].fill = { fgColor: { rgb: "FF92D050" } };
        ws[cellRef].font = { bold: true, color: { rgb: "FF000000" } };
        ws[cellRef].alignment = { horizontal: "center", vertical: "center", wrapText: true };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Câu hỏi");
    XLSX.writeFile(wb, fileName);

    Swal.fire("Thành công!", `Đã export ${dataToExport.length} câu hỏi.`, "success");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportFile(file);
    } else {
      Swal.fire("Lỗi!", "Chỉ hỗ trợ file .xlsx hoặc .xls.", "error");
      e.target.value = "";
    }
  };

  const handleAddMenuClick = (e) => {
    e.stopPropagation();
    setShowAddMenu(true);
    let x = e.clientX;
    let y = e.clientY;
    const menuWidth = 150;
    const menuHeight = 100;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;
    setAddMenuPosition({ x, y });
  };

  const startEditingQuestion = (question) => {
    setEditingQuestionId(question._id);
    setTitle(question.title);
    setTimeout(() => {
      if (titleEditorRef.current) {
        titleEditorRef.current.innerHTML = question.title;
      }
    }, 0);
    setOptions(question.options);
    setCorrect(question.correctAnswer);
    setDifficulty(question.difficulty || "Trung bình");
    setImage(null);
    setShowAddForm(true);
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === "Tất cả" || (q.difficulty || "Trung bình") === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const groupedQuestions = difficultyLevels.reduce((acc, level) => {
    acc[level] = filteredQuestions.filter(q => (q.difficulty || "Trung bình") === level);
    return acc;
  }, {});

  useEffect(() => {
    if (!categoryId) return;
    const savedState = localStorage.getItem(`questionPageState_${categoryId}`);
    if (savedState) {
      try {
        const { expandedLevels: savedLevels, expandedQuestionId: savedQuestions } = JSON.parse(savedState);
        if (savedLevels !== undefined) setExpandedLevels(savedLevels);
        if (savedQuestions !== undefined) setExpandedQuestionId(savedQuestions);
      } catch (err) {
        console.error("error", err);
      }
    } else {
      setExpandedLevels([]);
      setExpandedQuestionId([]);
    }
  }, [categoryId, questions]);

  useEffect(() => {
    if (!categoryId) return;
    localStorage.setItem(
      `questionPageState_${categoryId}`,
      JSON.stringify({
        expandedLevels,
        expandedQuestionId,
      })
    );
  }, [expandedLevels, expandedQuestionId, categoryId]);

  // ✅ FIX: Handler quay lại Categories - sử dụng onGoBack callback từ App.js
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    }
  };

  return (
    <div className="question-page">
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={handleGoBack}
          style={{
            marginBottom: "15px",
            padding: "8px 12px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ← Quay lại
        </button>
        
        <div className="header">
          <div>
            <h3 style={{ margin: "0 0 5px 0", fontSize: "20px", color: "#2c3e50" }}>
              {subjectName} - {categoryName}
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#7f8c8d" }}>
              Danh sách câu hỏi ({questions.length})
            </p>
          </div>
          
          <button className="add-question-btn" onClick={handleAddMenuClick} title="Thêm câu hỏi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Thêm câu hỏi
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "15px", marginBottom: "15px" }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px"
            }}
          />
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              minWidth: "150px"
            }}
          >
            <option value="Tất cả">Tất cả độ khó</option>
            {difficultyLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {showAddMenu && (
        <div
          ref={addMenuRef}
          className="context-menu"
          style={{ top: addMenuPosition.y, left: addMenuPosition.x, pointerEvents: "auto" }}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              setShowAddForm(true);
              setEditingQuestionId(null);
              setTitle("");
              if (titleEditorRef.current) {
                titleEditorRef.current.innerHTML = "";
              }
              setOptions(["", "", "", ""]);
              setCorrect(null);
              setDifficulty("Trung bình");
              setShowAddMenu(false);
            }}
          >
            Thêm thủ công
          </div>
          <div className="context-menu-item" onClick={handleImportClick}>
            📥 Import từ file
          </div>
        </div>
      )}

      {showImportForm && (
        <div className="import-form" style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          zIndex: 1000,
          minWidth: "400px"
        }}>
          <h4 style={{ marginTop: 0 }}>Import câu hỏi từ Excel</h4>
          
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />

          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <button 
              onClick={handleImportQuestions} 
              disabled={!importFile}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: importFile ? "pointer" : "not-allowed",
                opacity: importFile ? 1 : 0.5
              }}
            >
              📤 Import
            </button>
            <button 
              onClick={() => { setShowImportForm(false); setImportFile(null); fileInputRef.current.value = ""; }}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Hủy
            </button>
          </div>

          <button 
            onClick={downloadTemplate}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#0d6efd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            📥 Tải file mẫu
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        padding: "10px",
        backgroundColor: "#f8f9fa",
        borderRadius: "6px"
      }}>
        <button 
          onClick={() => handleExportQuestions("category")}
          style={{
            padding: "8px 15px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          📥 Export danh mục này
        </button>
        <button 
          onClick={() => handleExportQuestions("all")}
          style={{
            padding: "8px 15px",
            backgroundColor: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          📥 Export tất cả {subjectName}
        </button>
      </div>

      {difficultyLevels.map(level => {
        const levelQuestions = groupedQuestions[level];
        if (levelQuestions.length === 0) return null;

        return (
          <div key={level} style={{ marginBottom: "30px" }}>
            <h4 
              style={{ 
                borderBottom: "2px solid #ccc",
                paddingBottom: "8px",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer"
              }}
              onClick={() => toggleLevelExpand(level)}
            >
              <span style={{ marginRight: "8px" }}>
                {expandedLevels.includes(level) ? "▼" : "▶"}
              </span>
              {level} ({levelQuestions.length} câu)
            </h4>
            {expandedLevels.includes(level) && (
              <ul>
                {levelQuestions.map((q, index) => (
                  <li key={q._id} className="question-item">
                    <div className="question-content">
                      <div 
                        className="question-header"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}
                      >
                        <div 
                          onClick={() => toggleExpand(q._id)} 
                          style={{ flex: 1, cursor: "pointer" }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: `<strong>Câu ${index + 1}:</strong> ${q.title}` }} />
                        </div>

                        <div className="question-actions" style={{ display: "flex", gap: "5px", marginLeft: "10px" }}>
                          <button
                            className="edit-btn"
                            onClick={() => startEditingQuestion(q)}
                            title="Sửa"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteQuestion(q._id)}
                            title="Xóa"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>

                      {expandedQuestionId.includes(q._id) && q.imageUrl && (
                        <div style={{ marginBottom: "12px", marginTop: "10px" }}>
                          <img 
                            src={`http://localhost:5000${q.imageUrl}`} 
                            alt="question" 
                            style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", cursor: "pointer" }}
                            onClick={() => {
                              setSelectedImage(`http://localhost:5000${q.imageUrl}`);
                              setShowImageModal(true);
                            }}
                          />
                        </div>
                      )}
                      {expandedQuestionId.includes(q._id) && (
                        <ol type="A" className="answer-list">
                          {q.options.map((opt, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontWeight: idx === q.correctAnswer ? "bold" : "normal",
                                color: idx === q.correctAnswer ? "green" : "black",
                                marginBottom: "8px"
                              }}
                            >
                              {opt}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {showImageModal && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowImageModal(false)}
        >
          <img 
            src={selectedImage} 
            alt="full" 
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }} 
          />
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editingQuestionId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h4>
              <button className="modal-close-btn" onClick={resetForm}>×</button>
            </div>

            <div className="editor-toolbar">
              <button 
                type="button" 
                onClick={() => applyFormat('bold')} 
                title="Đậm (Ctrl+B)"
                className={`toolbar-btn ${boldActive ? 'active' : ''}`}
              >
                <strong>B</strong>
              </button>
              <button 
                type="button" 
                onClick={() => applyFormat('italic')} 
                title="Nghiêng (Ctrl+I)"
                className={`toolbar-btn ${italicActive ? 'active' : ''}`}
              >
                <em>I</em>
              </button>
              <button 
                type="button" 
                onClick={() => applyFormat('underline')} 
                title="Gạch chân (Ctrl+U)"
                className={`toolbar-btn ${underlineActive ? 'active' : ''}`}
              >
                <u>U</u>
              </button>
              <select onChange={(e) => applyFormat('fontName', e.target.value)} defaultValue="">
                <option value="" disabled>Kiểu chữ</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
              <select onChange={(e) => applyFormat('fontSize', e.target.value)} defaultValue="">
                <option value="" disabled>Cỡ chữ</option>
                <option value="1">Nhỏ</option>
                <option value="3">Trung bình</option>
                <option value="5">Lớn</option>
                <option value="7">Rất lớn</option>
              </select>
              <button type="button" onClick={insertImageIntoEditor} title="Thêm ảnh" className="toolbar-btn">
                🖼️ Ảnh
              </button>
            </div>

            <div
              ref={titleEditorRef}
              contentEditable
              className="rich-text-editor"
              placeholder="Nhập nội dung câu hỏi..."
              onInput={(e) => setTitle(e.currentTarget.innerHTML)}
              onMouseUp={handleEditorMouseUp}
              onKeyUp={handleEditorKeyUp}
            />

            <div style={{ marginTop: "10px" }}>
              <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>
                Độ khó:
              </label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {options.map((opt, idx) => (
              <div key={idx} className="option">
                <input
                  type="text"
                  placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[idx] = e.target.value;
                    setOptions(newOptions);
                  }}
                />
                <input
                  type="radio"
                  name="correct"
                  checked={correct === idx}
                  onChange={() => setCorrect(idx)}
                />{" "}
                Đúng
              </div>
            ))}

            <div style={{ marginTop: "15px" }}>
              {editingQuestionId ? (
                <button onClick={() => handleUpdateQuestion(editingQuestionId)}>Cập nhật</button>
              ) : (
                <button onClick={handleAddQuestion}>Lưu câu hỏi</button>
              )}
              <button onClick={resetForm} style={{ marginLeft: "10px", background: "#6c757d" }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionPage;
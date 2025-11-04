import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CategoryPage from "./components/CategoryPage";
import QuestionPage from "./components/QuestionPage";
import PracticeExamPage from "./components/PracticeExamPage";
import PracticeExamDetailPage from "./components/PracticeExamDetailPage";
import ExamPageTC from "./components/ExamPageTC";
import ExamDetailPage from "./components/ExamDetailPage";
import Login from "./components/Login";
import StudentPage from "./components/student/StudentPage.js";
import StudentExamsPage from "./components/student/StudentExamsPage.js";
import StudentTestExamsPage from "./components/student/StudentTestExamsPage.js";
import StudentExamPage from "./components/student/ExamPage.js";
import TakeTestExamPage from "./components/student/TakeTestExamPage.js";
import PracticePage from "./components/student/PracticePage.js";
import PractiecSummary from "./components/student/PractiecSummary.js";
import PracticeReview from "./components/student/PracticeReview.js";
import AdminManagerClass from "./components/admin/AdminManagerClass.js";
import AdminmanagerTeacher from "./components/admin/AdminManagerTeacher.js";
import AdminmanagerStudent from "./components/admin/AdminManagerStudent.js";
import AdminManagerSubjects from "./components/admin/AdminManagerSubjects.js";
import Profile from "./components/ProfileTeacher.js";
function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedCategoryInfo, setSelectedCategoryInfo] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("app_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing user:", err);
        localStorage.removeItem("app_user");
      }
    }
  }, []);

  const handleLogin = (userObj) => {
    setUser(userObj);
    localStorage.setItem("app_user", JSON.stringify(userObj));
    if (userObj.role === "teacher") navigate("/dashboard");
    else if (userObj.role === "admin") navigate("/admin/classes");
    else navigate("/student");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("app_user");
    navigate("/login");
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (user.role === "admin") {
    return (
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar user={user} onLogout={handleLogout} />
        <div
          className="main-content"
          style={{ flex: 1, padding: "20px", marginLeft: "240px" }}
        >
          <Routes>
            <Route path="/admin/classes" element={<AdminManagerClass />} />
            <Route path="/admin/teachers" element={<AdminmanagerTeacher />} />
            <Route path="/admin/students" element={<AdminmanagerStudent />} />
            <Route path="/admin/subjects" element={<AdminManagerSubjects/>} />
            <Route path="*" element={<Navigate to="/admin/classes" />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <div
        className="main-content"
        style={{ flex: 1, padding: "20px", marginLeft: "240px" }}
      >
        <Routes>
          {/* TEACHER  */}
          <Route
            path="/dashboard"
            element={
              user.role === "teacher" ? (
                <Dashboard />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/categories"
            element={
              user.role === "teacher" ? (
                <CategoryPage
                  selectedSubjectId={selectedSubjectId}
                  onSelectCategory={(categoryInfo) => {
                    setSelectedCategoryInfo(categoryInfo);
                    setSelectedSubjectId(categoryInfo.subjectId);
                    navigate("/questions");
                  }}
                  onSelectSubject={(subjectId) => {
                    setSelectedSubjectId(subjectId);
                  }}
                />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/questions"
            element={
              selectedCategoryInfo ? (
                <QuestionPage
                  categoryId={selectedCategoryInfo.categoryId}
                  categoryName={selectedCategoryInfo.categoryName}
                  subjectName={selectedCategoryInfo.subjectName}
                  onGoBack={() => {
                    navigate("/categories");
                  }}
                />
              ) : (
                <Navigate to="/categories" />
              )
            }
          />
          <Route
            path="/practice-exam"
            element={
              user.role === "teacher" ? (
                <PracticeExamPage />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/practice-exam-detail/:examId"
            element={
              user.role === "teacher" ? (
                <PracticeExamDetailPage />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/test-exam"
            element={
              user.role === "teacher" ? (
                <ExamPageTC />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
          <Route
            path="/test-exam-detail/:examId"
            element={
              user.role === "teacher" ? (
                <ExamDetailPage />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
<Route path="/profile" element={<Profile />} />
          {/* STUDENT  */}
          <Route
            path="/student"
            element={<StudentPage studentUsername={user.username} />}
          />
          <Route
            path="/myExams"
            element={<StudentExamsPage studentUsername={user.username} />}
          />
          <Route
            path="/myTest"
            element={<StudentTestExamsPage studentUsername={user.username} />}
          />
          <Route path="/take-test/:examId" element={<TakeTestExamPage />} />
          <Route path="/exam/:examId" element={<PracticePage />} />
          <Route path="/exam-summary" element={<PractiecSummary />} />
          <Route path="/exam-review/:examId" element={<PracticeReview />} />

          {/* DEFAULT */}
          <Route
            path="*"
            element={
              user.role === "teacher" ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/student" />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
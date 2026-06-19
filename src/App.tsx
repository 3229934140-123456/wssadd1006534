import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import PracticePage from '@/pages/PracticePage';
import RecordTrainingPage from '@/pages/RecordTrainingPage';
import ReviewPage from '@/pages/ReviewPage';
import TeacherDashboard from '@/pages/TeacherDashboard';
import Header from '@/components/layout/Header';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice/:caseId" element={<PracticePage />} />
          <Route path="/record/:caseId" element={<RecordTrainingPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

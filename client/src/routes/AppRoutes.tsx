import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.js';
import { HomePage } from '../pages/HomePage.js';
import { AuthPage } from '../pages/AuthPage.js';
import { QuestionsPage } from '../pages/QuestionsPage.js';
import { QuestionPage } from '../pages/QuestionPage.js';
import { MatchPage } from '../pages/MatchPage.js';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/questions/:slug" element={<QuestionPage />} />
        <Route path="/match" element={<MatchPage />} />
      </Route>
    </Routes>
  );
}

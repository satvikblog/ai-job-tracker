import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Applications } from './pages/Applications';
import { JobOpportunities } from './pages/JobOpportunities';
import { ResumeGenerator } from './pages/ResumeGenerator';
import { CoverLetters } from './pages/CoverLetters';
import { Documents } from './pages/Documents';
import { FollowUps } from './pages/FollowUps';
import { Settings } from './pages/Settings';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 font-inter">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="job-opportunities" element={<JobOpportunities />} />
            <Route path="resume" element={<ResumeGenerator />} />
            <Route path="cover-letters" element={<CoverLetters />} />
            <Route path="documents" element={<Documents />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
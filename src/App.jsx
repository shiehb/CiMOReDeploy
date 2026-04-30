import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import MarketingRequests from './components/MarketingRequests';
import RequestDetail from './components/RequestDetail';
import SchoolIntelligence from './components/SchoolIntelligence';
import DocumentsReports from './components/DocumentsReports';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserDashboard from './components/UserDashboard';
import ProfilePage from './components/ProfilePage';
import ChangePasswordPage from './components/ChangePasswordPage';
import { motion, AnimatePresence } from 'motion/react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function App() {
  const [view, setView] = useState(() => {
    // If URL contains a reset token, go straight to reset-password
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) return 'reset-password';
    const token = localStorage.getItem('authToken');
    const session = localStorage.getItem('cimore_auth');
    return token && session ? 'app' : 'login';
  });

  const resetToken = new URLSearchParams(window.location.search).get('token') || '';
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [activeTab, setActiveTab]             = useState('dashboard');
  const [previousTab, setPreviousTab]         = useState('dashboard');
  const [detailRequestId, setDetailRequestId] = useState(null);
  const [settingsPanel, setSettingsPanel]     = useState('profile');
  const [settingsNavKey, setSettingsNavKey]   = useState(0);

  const handleViewDetail = (id) => {
    setDetailRequestId(id);
    navigateTo('request-detail');
  };

  const navigateTo = (tab) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  const navigateToSettings = (panel) => {
    setSettingsPanel(panel);
    setSettingsNavKey(k => k + 1);
    setPreviousTab(activeTab);
    setActiveTab('settings');
  };

  const handleLogout = useCallback(() => {
    setView('login');
    setUserRole('');
    setMustChangePassword(false);
    setActiveTab('dashboard');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userAvatarUrl');
    localStorage.removeItem('cimore_auth');
  }, []);

  const handleLogin = (data) => {
    setUserRole(data.role);
    setMustChangePassword(data.must_change_password || false);
    setView('app');
  };

  // 30-minute idle session expiry
  useEffect(() => {
    if (view !== 'app') return;
    let timer = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    };
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, reset));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [view, handleLogout]);

  if (view === 'reset-password') {
    return <ResetPassword token={resetToken} onBack={() => setView('login')} />;
  }

  if (view === 'forgot-password') {
    return <ForgotPassword onBack={() => setView('login')} />;
  }

  if (view === 'register') {
    return <Register onBack={() => setView('login')} />;
  }

  if (view === 'login') {
    return <Login onLogin={handleLogin} onRegister={() => setView('register')} onForgotPassword={() => setView('forgot-password')} />;
  }

  // Collaborators get a restricted dashboard with only their own pages
  if (userRole === 'Collaborator') {
    return (
      <UserDashboard
        onLogout={handleLogout}
        mustChangePassword={mustChangePassword}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

  // Admin / Staff — full dashboard
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':        return <Dashboard onNavigate={setActiveTab} />;
      case 'users':            return <UserManagement />;
      case 'marketing':        return <MarketingRequests onViewDetail={handleViewDetail} />;
      case 'request-detail':   return (
        <RequestDetail
          requestId={detailRequestId}
          onBack={() => setActiveTab(previousTab)}
          canManage={true}
        />
      );
      case 'intelligence':     return <SchoolIntelligence />;
      case 'documents':        return <DocumentsReports />;
      case 'settings':         return <Settings key={settingsNavKey} initialPanel={settingsPanel} />;
      case 'profile':          return <ProfilePage onBack={() => setActiveTab(previousTab)} />;
      case 'change-password':  return <ChangePasswordPage onBack={() => setActiveTab(previousTab)} />;
      default:                 return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-gray-900 selection:bg-primary/10 selection:text-primary">
      <Header onLogout={handleLogout} onNavigate={navigateTo} onNavigateToSettings={navigateToSettings} />
      <div className="flex pt-15">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          userRole={userRole}
        />
        <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)] flex flex-col">
          <div className="flex-1 px-4">
            <div className="max-w-8xl mx-auto py-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

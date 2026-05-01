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

// SLC Corporate Theme Mapping
const THEME = {
  primary: '#1072b3',   // SLC Corporate Blue
  secondary: '#03396c', // SLC Deep Navy
  light: '#bdd4e5',     // Soft Sky Blue
  accent: '#f6ce11',    // SLC Gold
  bg: '#F5F7FA',
};

export default function App() {
  const [view, setView] = useState(() => {
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
  const [isOpen, setIsOpen] = useState(false); 

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
    localStorage.clear(); // Comprehensive clear
  }, []);

  const handleLogin = (data) => {
    setUserRole(data.role);
    setMustChangePassword(data.must_change_password || false);
    setView('app');
  };

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

  if (userRole === 'Collaborator') {
    return (
      <UserDashboard
        onLogout={handleLogout}
        mustChangePassword={mustChangePassword}
        onPasswordChanged={() => setMustChangePassword(false)}
      />
    );
  }

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
    <div 
      className="min-h-screen font-sans text-slate-900 selection:bg-[#1072b3]/10 selection:text-[#1072b3]"
      style={{ backgroundColor: THEME.bg }}
    >
      <Header 
        onLogout={handleLogout} 
        onNavigate={navigateTo} 
        onNavigateToSettings={navigateToSettings} 
        setIsOpen={setIsOpen} 
      />
      
      <div className="flex pt-15">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" 
              onClick={() => setIsOpen(false)} 
            />
          )}
        </AnimatePresence>

        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          userRole={userRole}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />

        <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
          <div className="flex-1 px-4 lg:px-8">
            <div className="py-6 w-full max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
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
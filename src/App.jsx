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
import { getTokenExpiry, API } from './config/api';
import RoleChangedModal from './components/RoleChangedModal';
import ChatSheet from './components/ChatSheet';
import AuditTrail from './components/AuditTrail';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const VALID_TABS = new Set([
  'dashboard',
  'users',
  'marketing',
  'request-detail',
  'intelligence',
  'documents',
  'audit-trail',
  'settings',
  'profile',
  'change-password',
]);

const parseAppRoute = (rawPath) => {
  if (!rawPath || rawPath === 'dashboard') return { tab: 'dashboard', requestId: null, requestType: null };
  if (rawPath.startsWith('request-detail')) {
    const [, id] = rawPath.split('/');
    return { tab: 'request-detail', requestId: id || null, requestType: null };
  }
  if (rawPath.startsWith('new-request')) {
    const [, requestType] = rawPath.split('/');
    return { tab: 'new-request', requestId: null, requestType: requestType ? decodeURIComponent(requestType) : null };
  }
  if (VALID_TABS.has(rawPath)) return { tab: rawPath, requestId: null, requestType: null };
  return { tab: 'dashboard', requestId: null, requestType: null };
};

const getInitialRoute = () => {
  const rawPath = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const authToken = localStorage.getItem('authToken');
  const session = localStorage.getItem('cimore_auth');
  const authenticated = Boolean(authToken && session);

  if (token || rawPath === 'reset-password') {
    return {
      view: 'reset-password',
      tab: 'dashboard',
      requestId: null,
      requestType: null,
      resetToken: token || '',
    };
  }

  if (rawPath === 'register') {
    return { view: 'register', tab: 'dashboard', requestId: null, requestType: null, resetToken: '' };
  }

  if (rawPath === 'forgot-password') {
    return { view: 'forgot-password', tab: 'dashboard', requestId: null, requestType: null, resetToken: '' };
  }

  if (!authenticated) {
    return { view: 'login', tab: 'dashboard', requestId: null, requestType: null, resetToken: '' };
  }

  return { view: 'app', ...parseAppRoute(rawPath), resetToken: '' };
};

// SLC Corporate Theme Mapping
const THEME = {
  primary: '#1072b3',   // SLC Corporate Blue
  secondary: '#03396c', // SLC Deep Navy
  light: '#bdd4e5',     // Soft Sky Blue
  accent: '#f6ce11',    // SLC Gold
  bg: '#F5F7FA',
};

export default function App() {
  const initialRoute = getInitialRoute();
  const [view, setView] = useState(initialRoute.view);
  const [resetToken, setResetToken] = useState(initialRoute.resetToken || '');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || '');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [activeTab, setActiveTab]             = useState(initialRoute.tab);
  const [previousTab, setPreviousTab]         = useState(initialRoute.tab);
  const [detailRequestId, setDetailRequestId] = useState(initialRoute.requestId);
  const [settingsPanel, setSettingsPanel]     = useState('profile');
  const [settingsNavKey, setSettingsNavKey]   = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [roleChangedTo, setRoleChangedTo] = useState(null);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [chatRequestTitle, setChatRequestTitle] = useState('');
  const [chatRequests, setChatRequests] = useState([]);
  const openChat = useCallback((requestId, title = '', requests = []) => {
    setChatRequestId(requestId);
    setChatRequestTitle(title);
    setChatRequests(requests);
    setChatOpen(true);
  }, []);

  const handleViewDetail = (id) => {
    setDetailRequestId(id);
    navigateTo('request-detail');
  };

  const navigateTo = (tab, routeOptions = {}) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
    if (routeOptions.requestId) {
      setDetailRequestId(routeOptions.requestId);
    }
  };

  const navigateToSettings = (panel) => {
    setSettingsPanel(panel);
    setSettingsNavKey((k) => k + 1);
    setPreviousTab(activeTab);
    setActiveTab('settings');
  };

  const getUrlForTab = () => {
    if (activeTab === 'dashboard') return '/dashboard';
    if (activeTab === 'request-detail') {
      return detailRequestId ? `/request-detail/${detailRequestId}` : '/request-detail';
    }
    return `/${activeTab}`;
  };

  const getUrlForRoute = () => {
    if (view === 'login') return '/login';
    if (view === 'register') return '/register';
    if (view === 'forgot-password') return '/forgot-password';
    if (view === 'reset-password') {
      return resetToken ? `/reset-password?token=${encodeURIComponent(resetToken)}` : '/reset-password';
    }
    if (view === 'app') return getUrlForTab();
    return '/login';
  };

  useEffect(() => {
    const targetUrl = getUrlForRoute();
    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== targetUrl) {
      if (window.location.pathname === '/' && (view === 'login' || (view === 'app' && activeTab === 'dashboard'))) {
        window.history.replaceState({ view, tab: activeTab }, document.title, targetUrl);
      } else {
        window.history.pushState({ view, tab: activeTab }, document.title, targetUrl);
      }
    } else {
      window.history.replaceState({ view, tab: activeTab }, document.title, targetUrl);
    }
  }, [view, activeTab, detailRequestId, resetToken]);

  useEffect(() => {
    const handlePopState = () => {
      const rawPath = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '');
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const authToken = localStorage.getItem('authToken');
      const session = localStorage.getItem('cimore_auth');
      const authenticated = Boolean(authToken && session);

      if (token || rawPath === 'reset-password') {
        setView('reset-password');
        setResetToken(token || '');
        return;
      }
      if (rawPath === 'register') {
        setView('register');
        return;
      }
      if (rawPath === 'forgot-password') {
        setView('forgot-password');
        return;
      }
      if (!authenticated) {
        setView('login');
        return;
      }

      setView('app');
      if (!rawPath || rawPath === 'dashboard') {
        setPreviousTab(activeTab);
        setActiveTab('dashboard');
        setDetailRequestId(null);
        return;
      }
      if (rawPath.startsWith('request-detail')) {
        const [, id] = rawPath.split('/');
        setPreviousTab(activeTab);
        setActiveTab('request-detail');
        setDetailRequestId(id || null);
        return;
      }
      if (rawPath.startsWith('new-request')) {
        setPreviousTab(activeTab);
        setActiveTab('marketing');
        setDetailRequestId(null);
        return;
      }
      if (VALID_TABS.has(rawPath)) {
        setPreviousTab(activeTab);
        setActiveTab(rawPath);
        setDetailRequestId(null);
      } else {
        setPreviousTab(activeTab);
        setActiveTab('dashboard');
        setDetailRequestId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

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

  // Listen for 401 responses fired by apiFetch() in any component.
  useEffect(() => {
    const onAuthExpired = () => handleLogout();
    window.addEventListener('cimore:auth-expired', onAuthExpired);
    return () => window.removeEventListener('cimore:auth-expired', onAuthExpired);
  }, [handleLogout]);

  // Schedule logout at the exact millisecond the JWT token expires.
  useEffect(() => {
    if (view !== 'app') return;
    const expiry = getTokenExpiry();
    if (!expiry) return; // Opaque token — skip, rely on 401 interceptor instead
    const ms = expiry.getTime() - Date.now();
    if (ms <= 0) { handleLogout(); return; }
    const t = setTimeout(handleLogout, ms);
    return () => clearTimeout(t);
  }, [view, handleLogout]);

  // Poll /api/profile/ every 30s and show RoleChangedModal if the server role differs.
  useEffect(() => {
    if (view !== 'app') return;
    const check = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        const res = await fetch(`${API}/api/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverRole = data.role;
        const localRole  = localStorage.getItem('userRole');
        if (serverRole && localRole && serverRole !== localRole) {
          setRoleChangedTo(serverRole);
        }
      } catch { /* silent — network errors shouldn't interrupt the session */ }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [view]);

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

  if (mustChangePassword && (userRole === 'Admin' || userRole === 'Staff')) {
    return <ChangePasswordPage onBack={() => setMustChangePassword(false)} />;
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
      case 'dashboard':        return <Dashboard onNavigate={navigateTo} />;
      case 'users':            return <UserManagement />;
      case 'marketing':        return <MarketingRequests onViewDetail={handleViewDetail} onOpenChat={openChat} />;
      case 'request-detail':   return (
        <RequestDetail
          requestId={detailRequestId}
          onBack={() => navigateTo(previousTab)}
          canManage={true}
          onOpenChat={openChat}
        />
      );
      case 'intelligence':     return <SchoolIntelligence />;
      case 'documents':        return <DocumentsReports />;
      case 'audit-trail':      return <AuditTrail />;
      case 'settings':         return <Settings key={settingsNavKey} initialPanel={settingsPanel} />;
      case 'profile':          return <ProfilePage onBack={() => navigateTo(previousTab)} />;
      case 'change-password':  return <ChangePasswordPage onBack={() => navigateTo(previousTab)} />;
      default:                 return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div 
      className="min-h-[calc(100vh-200px)] font-sans text-slate-900 selection:bg-[#1072b3]/10 selection:text-[#1072b3]"
      style={{ backgroundColor: THEME.bg }}
    >
      <Header
        onLogout={handleLogout}
        onNavigate={navigateTo}
        onNavigateToSettings={navigateToSettings}
        setIsOpen={setIsOpen}
        onOpenChat={openChat}
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
          onNavigate={navigateTo}
          onLogout={handleLogout}
          userRole={userRole}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />

        <main className="flex-1 md:ml-70 min-h-[calc(100vh-300px)] flex flex-col">
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

      <ChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        requestId={chatRequestId}
        requestTitle={chatRequestTitle}
        requests={chatRequests}
      />

      {/* Role-change security modal — rendered above everything else */}
      <AnimatePresence>
        {roleChangedTo && (
          <RoleChangedModal
            newRole={roleChangedTo}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
import { createContext, useContext, useMemo, useState } from 'react';
import { notificationsSeed, userProfileSeed } from '../data/dashboardData';
import { alertsSeed } from '../data/alertData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('fednutri_auth') === 'true'
  );
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('fednutri_profile');
    return saved ? JSON.parse(saved) : userProfileSeed;
  });
  const [notifications, setNotifications] = useState(notificationsSeed);
  const [alerts, setAlerts] = useState(alertsSeed);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const login = (username, role) => {
    const next = {
      ...profile,
      name: profile.name || username || 'Dr. Nimal Perera',
      role: role || profile.role,
    };
    setProfile(next);
    localStorage.setItem('fednutri_profile', JSON.stringify(next));
    localStorage.setItem('fednutri_auth', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('fednutri_auth');
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    const next = { ...profile, ...updates };
    setProfile(next);
    localStorage.setItem('fednutri_profile', JSON.stringify(next));
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAlertRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Read' } : a))
    );
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, status: 'Read' })));
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      profile,
      updateProfile,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      selectedNotification,
      setSelectedNotification,
      alerts,
      markAlertRead,
      markAllAlertsRead,
      assistantOpen,
      setAssistantOpen,
    }),
    [
      isAuthenticated,
      profile,
      notifications,
      unreadCount,
      selectedNotification,
      alerts,
      assistantOpen,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

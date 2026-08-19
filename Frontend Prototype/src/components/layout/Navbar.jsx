import { useEffect, useRef, useState } from 'react';
import { Bell, Camera, CheckCheck, LogOut, Menu, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useSidebar } from './sidebarContext';

export default function Navbar({ title = 'Dashboard', subtitle }) {
  const { setSidebarOpen } = useSidebar();
  const {
    profile,
    updateProfile,
    logout,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedNotification,
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(profile);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => setForm(profile), [profile]);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
        setEditMode(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    updateProfile(form);
    setEditMode(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary md:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-primary md:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 md:text-sm">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[340px] animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="font-semibold text-primary">Notifications</p>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                >
                  <CheckCheck size={14} /> Mark all as read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      setSelectedNotification(n);
                      setNotifOpen(false);
                    }}
                    className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      !n.read ? 'bg-secondary/5' : ''
                    }`}
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        n.type === 'critical'
                          ? 'bg-danger'
                          : n.type === 'success'
                            ? 'bg-success'
                            : 'bg-secondary'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-primary">{n.title}</p>
                        {!n.read && (
                          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                            New
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">{n.preview}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-white">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-primary">{profile.name}</p>
              <p className="text-[10px] text-slate-500">{profile.role}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-80 animate-fade-in rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary text-white">
                    {(editMode ? form.avatar : profile.avatar) ? (
                      <img
                        src={editMode ? form.avatar : profile.avatar}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute -bottom-1 -right-1 rounded-full bg-secondary p-1.5 text-white shadow"
                    >
                      <Camera size={12} />
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                </div>
                <div>
                  <p className="font-semibold text-primary">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.role}</p>
                  <p className="text-xs text-slate-400">{profile.email}</p>
                </div>
              </div>

              {editMode ? (
                <div className="space-y-2">
                  {['name', 'role', 'email', 'organization'].map((field) => (
                    <div key={field}>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {field}
                      </label>
                      <input
                        value={form[field] || ''}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm outline-none focus:border-secondary"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={saveProfile}
                      className="flex-1 rounded-full bg-secondary px-3 py-2 text-sm font-semibold text-white"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(profile);
                        setEditMode(false);
                      }}
                      className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="rounded-xl bg-surface px-3 py-2 text-xs text-slate-600">
                    {profile.organization}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-primary hover:bg-slate-50"
                  >
                    Edit details
                  </button>
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block w-full rounded-full border border-slate-200 px-3 py-2 text-center text-sm font-medium text-primary hover:bg-slate-50"
                  >
                    Open profile page
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

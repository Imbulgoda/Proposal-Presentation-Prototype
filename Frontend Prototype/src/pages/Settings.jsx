import { useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { profile, updateProfile } = useApp();
  const [userForm, setUserForm] = useState(profile);
  const [notifications, setNotifications] = useState({
    criticalEmail: true,
    weeklyDigest: true,
    smsAlerts: false,
    autoForecast: true,
  });
  const [prefs, setPrefs] = useState({
    defaultModel: 'XGBoost',
    alertThreshold: 500,
    supplyUnit: 'Packs',
    language: 'English',
  });

  return (
    <div className="min-h-screen">
      <Navbar title="Settings" subtitle="Account, notifications and system preferences" />
      <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-3 md:p-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-primary">User Settings</h3>
          <p className="mb-5 text-xs text-slate-500">Account identity used across reports</p>
          {['name', 'role', 'email', 'organization'].map((field) => (
            <div key={field} className="mb-3">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {field === 'name' ? 'Full Name' : field}
              </label>
              <input
                value={userForm[field] || ''}
                onChange={(e) => setUserForm({ ...userForm, [field]: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              updateProfile(userForm);
              toast.success('User settings saved');
            }}
            className="mt-2 w-full rounded-full bg-gradient-to-r from-secondary to-[#4C6EF5] py-2.5 text-sm font-semibold text-white"
          >
            Save changes
          </button>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-primary">Notification Settings</h3>
            <p className="mb-5 text-xs text-slate-500">Choose how alerts reach you</p>
            {[
              ['criticalEmail', 'Email me critical alerts'],
              ['weeklyDigest', 'Weekly nutrition digest'],
              ['smsAlerts', 'SMS alerts to field officers'],
              ['autoForecast', 'Auto-run monthly forecast'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
                <span className="text-sm text-primary">{label}</span>
                <button
                  type="button"
                  onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                  className={`relative h-6 w-11 rounded-full transition ${
                    notifications[key] ? 'bg-success' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      notifications[key] ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-primary">System Preferences</h3>
            <p className="mb-5 text-xs text-slate-500">Defaults applied to models and reports</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Default Model
                </label>
                <select
                  value={prefs.defaultModel}
                  onChange={(e) => setPrefs({ ...prefs, defaultModel: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm"
                >
                  <option>XGBoost</option>
                  <option>Random Forest</option>
                  <option>LSTM</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Alert Threshold (Cases)
                </label>
                <input
                  type="number"
                  value={prefs.alertThreshold}
                  onChange={(e) => setPrefs({ ...prefs, alertThreshold: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Supply Unit
                </label>
                <select
                  value={prefs.supplyUnit}
                  onChange={(e) => setPrefs({ ...prefs, supplyUnit: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm"
                >
                  <option>Packs</option>
                  <option>Cartons</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Language
                </label>
                <select
                  value={prefs.language}
                  onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm"
                >
                  <option>English</option>
                  <option>Sinhala</option>
                  <option>Tamil</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast.success('System preferences saved')}
              className="mt-5 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-slate-50"
            >
              Save system preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

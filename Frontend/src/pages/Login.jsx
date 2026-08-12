import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

const roles = ['MOH Officer', 'Nutrition Officer', 'Administrator'];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MOH Officer');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() && !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }
    login(username.trim(), role);
    toast.success('Welcome to FedNutri-XAI');
    navigate('/research-home');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(108,92,231,0.18),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(11,31,77,0.12),_transparent_40%)]" />
      <div className="relative w-full max-w-md animate-fade-in rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
            <Bot size={28} />
          </div>
          <h1 className="text-2xl font-bold text-primary">FedNutri-XAI</h1>
          <p className="mt-1 text-sm text-slate-500">
            AI-Powered Childhood Nutrition Intelligence System
          </p>
          <p className="mt-3 inline-block rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-semibold text-secondary">
            Research Prototype • Demo Login
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Username / Email
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-secondary"
                placeholder="Enter any username or email"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-surface py-2.5 pl-10 pr-3 text-sm outline-none focus:border-secondary"
                placeholder="Enter any password"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-gradient-to-r from-secondary to-[#4C6EF5] py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-secondary/25 transition hover:opacity-95"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  Clock,
  CalendarDays,
  FileSpreadsheet,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Wifi
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('hr@tamkeenits.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('https://tamkeen-hrms.onrender.com/api/auth/login', { email, password });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'CEO') {
        navigate('/ceo');
      } else if (user.role === 'HR') {
        navigate('/hr');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Premium Branding & Feature Showcase */}
      <div className="md:w-1/2 bg-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Tamkeen IT Logo Container */}
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <img 
                src="/tamkeen-logo.png" 
                alt="Tamkeen IT Services Logo" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Tamkeen IT Services
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  HRMS v2.6
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Human Resources & Attendance Portal</p>
            </div>
          </div>

          <div className="mt-12 space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Enterprise Attendance & Leave Engine</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Modern workforce control with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">static IP security</span> & automated accruals.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Seamlessly record daily check-in/out, manage multi-tier leave balances, automate monthly allocations via scheduled cron jobs, and generate executive reports in Excel & PDF.
            </p>
          </div>
        </div>

        {/* Feature badges list */}
        <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 shrink-0 shadow-sm">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Static Office IP Check-In</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Enforced office WiFi static modem check-in</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 shrink-0 shadow-sm">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Fri & Sat Official Off-Days</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Auto-configured non-absent weekend rules</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 shrink-0 shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Automated Leave Accrual</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Node-cron monthly allocation on the 1st</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-600 shrink-0 shadow-sm">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Excel (.xlsx) & PDF Reports</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Paginated monthly logs & instant exports</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-4 font-medium">
          <span>© 2026 Tamkeen IT Services. All rights reserved.</span>
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> System Active
          </span>
        </div>
      </div>

      {/* Right Column: Sleek Auth Box */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-14 bg-slate-50 relative">
        <div className="w-full max-w-md">
          {/* Card Wrapper */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to Portal</h3>
              <p className="text-sm text-slate-500 mt-1">
                Enter your credentials or choose a quick demo role below
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@tamkeenits.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer font-bold">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Quick One-Click Demo Credentials:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('ceo@tamkeenits.com', 'ceo123')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-left transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600">👑 CEO</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600">Fill</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">ceo@tamkeenits.com</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('hr@tamkeenits.com', 'admin123')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-400 text-left transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600">👨‍💼 HR</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600">Fill</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">hr@tamkeenits.com</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('ahmed@tamkeenits.com', 'employee123')}
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 text-left transition-all group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600">👤 Staff</span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600">Fill</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">ahmed@tamkeenits</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
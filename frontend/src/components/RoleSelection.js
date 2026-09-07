import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Users,
  UserCheck,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  LogIn,
  Bot,
  Zap,
  GraduationCap
} from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleAction = (role, mode = 'login') => {
    localStorage.setItem('selectedRole', role);
    localStorage.setItem('authMode', mode);
    navigate(`/login?role=${role}&mode=${mode}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8 md:p-12 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Subtle Glows */}
      <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[130px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />

      {/* Header Section */}
      <div className="max-w-4xl mx-auto text-center space-y-5 pt-4 sm:pt-6 z-10 flex flex-col items-center">
        {/* Prominent Tamkeen Brand Logo */}
        <div className="p-3.5 rounded-2xl bg-white shadow-sm border border-slate-200 inline-flex items-center justify-center transition-transform hover:scale-105">
          <img
            src="/tamkeen-logo.png"
            alt="Tamkeen IT Services Logo"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
          <span>Tamkeen IT Services • Enterprise HRMS & Smart Attendance Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-500">Portal Access</span>
        </h1>

        <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Unified, dynamic gateway with static IP verified check-in, real-time analytics, automated monthly leave accruals, and role-based access.
        </p>
      </div>

      {/* The 3 Dynamic & Stylish Action Cards */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 my-8 sm:my-12 z-10">

        {/* BUTTON 1: CEO EXECUTIVE */}
        <div className="group relative rounded-3xl bg-white border border-slate-200 hover:border-amber-300 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1.5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Crown className="w-7 h-7 font-bold" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                1st • CEO Executive
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                CEO Portal
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enterprise-wide governance, departmental KPIs, productivity metrics, monthly audit logs & company-wide supervision.
              </p>
            </div>

            {/* Quick feature list */}
            <div className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Executive Live Briefing & KPIs</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <FileSpreadsheet className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Monthly Excel & PDF Exports</span>
              </div>
            </div>
          </div>

          {/* Single Action Button (Login) */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => handleRoleAction('CEO', 'login')}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>CEO Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        </div>

        {/* BUTTON 2: HR MANAGER */}
        <div className="group relative rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1.5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 font-bold" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                2nd • HR Management
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                HR Manager Portal
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Staff administration, 1-click leave approvals with automated email notifications, monthly reports & staff directory.
              </p>
            </div>

            {/* Quick feature list */}
            <div className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Leave Approvals & Automated Email</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Attendance Logs & Cron Accrual</span>
              </div>
            </div>
          </div>

          {/* Single Action Button (Login) */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => handleRoleAction('HR', 'login')}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>HR Manager Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        </div>

        {/* BUTTON 3: EMPLOYEE */}
        <div className="group relative rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1.5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <UserCheck className="w-7 h-7 font-bold" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                3rd • Team Member
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                Employee Portal
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Daily check-in / check-out with static IP security, live hours counter, leave applications & balances.
              </p>
            </div>

            {/* 3 Special Options Pill Badge Preview */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Available Designations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <GraduationCap className="w-3 h-3" /> Internee
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                  <Bot className="w-3 h-3" /> RPA Developer
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <Zap className="w-3 h-3" /> Power Apps
                </span>
              </div>
            </div>
          </div>

          {/* Single Action Button (Login) */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => handleRoleAction('Employee', 'login')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Employee Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </button>
          </div>
        </div>

      </div>

      {/* Footer Section */}
      <footer className="text-center text-xs text-slate-500 z-10 pt-4 border-t border-slate-200 max-w-5xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Verified Static Office IP Network • SQLite Database Connected</span>
        </div>
        <span className="font-medium">© 2026 Tamkeen IT Services. All rights reserved.</span>
      </footer>
    </div>
  );
}
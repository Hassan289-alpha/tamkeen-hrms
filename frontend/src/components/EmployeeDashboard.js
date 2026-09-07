import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  LogOut,
  Wifi,
  Sparkles,
  Send,
  Briefcase,
  HeartPulse,
  Palmtree,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Plus,
  FileText,
  Megaphone // Added for announcements
} from 'lucide-react';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const storedUser = JSON.parse(localStorage.getItem('user')) || { name: 'Employee', email: 'employee@tamkeenits.com', role: 'Employee' };

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'attendance', 'leaves', 'payslips'
  const [userProfile, setUserProfile] = useState(storedUser);
  const [networkInfo, setNetworkInfo] = useState({ clientIp: '127.0.0.1', isOfficeNetwork: true, isWeekendOffDay: false });
  const [todayAttendance, setTodayAttendance] = useState({ isCheckedIn: false, isCheckedOut: false, attendance: null, isWeekend: false });
  const [myHistory, setMyHistory] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  const [holidays, setHolidays] = useState([]); // NEW: State for company announcements

  // Real-time live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check-in / out loading states
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveProof, setLeaveProof] = useState(null);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Alert State
  const [alert, setAlert] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate days between start and end date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setCalculatedDays(diffDays > 0 ? diffDays : 1);
    }
  }, [startDate, endDate]);

  // Fetch all employee portal data
  const fetchAllData = async () => {
    try {
      const [profileRes, networkRes, todayRes, historyRes, leavesRes, payslipsRes, holidaysRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/me', authHeaders),
        axios.get('http://localhost:5000/api/attendance/network-status', authHeaders),
        axios.get('http://localhost:5000/api/attendance/today', authHeaders),
        axios.get('http://localhost:5000/api/attendance/my-history', authHeaders),
        axios.get('http://localhost:5000/api/leaves/my-leaves', authHeaders),
        axios.get('http://localhost:5000/api/payroll/my-payslips', authHeaders),
        axios.get('http://localhost:5000/api/holidays', authHeaders) // NEW: Fetch holidays
      ]);

      if (profileRes.data?.user) {
        setUserProfile(profileRes.data.user);
        localStorage.setItem('user', JSON.stringify(profileRes.data.user));
      }
      setNetworkInfo(networkRes.data);
      setTodayAttendance(todayRes.data);
      setMyHistory(historyRes.data);
      setMyLeaves(leavesRes.data);
      setMyPayslips(payslipsRes.data);
      setHolidays(holidaysRes.data || []); // NEW: Set holidays state
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Check In Handler
  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/check-in', {}, authHeaders);
      showAlert(res.data.message || 'Checked in successfully!', 'success');
      fetchAllData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Check-in failed. Please verify office WiFi connection.', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  // Check Out Handler
  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/check-out', {}, authHeaders);
      showAlert(res.data.message || 'Checked out successfully!', 'success');
      fetchAllData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Check-out failed.', 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  // Leave Submit Handler
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      const formData = new FormData();
      formData.append('leave_type', leaveType);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('days', calculatedDays);
      formData.append('reason', leaveReason);
      if (leaveProof) formData.append('proof', leaveProof);

      const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };
      const res = await axios.post('http://localhost:5000/api/leaves/apply', formData, config);

      showAlert(res.data.message || 'Leave application submitted for HR review!', 'success');
      setShowLeaveModal(false);
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      setLeaveProof(null);
      fetchAllData();
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to submit leave application', 'error');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src="/tamkeen-logo.png"
                alt="Tamkeen Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">Tamkeen IT</h2>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider">
                EMPLOYEE PORTAL
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Clock & Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'leaves'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4" />
                <span>Leave Center</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'leaves' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {userProfile.casual_leave_balance + userProfile.sick_leave_balance + userProfile.annual_leave_balance}d
              </span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Attendance History</span>
            </button>

            <button
              onClick={() => setActiveTab('payslips')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'payslips'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Payslips (PKR)</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
                {userProfile.name?.charAt(0) || 'E'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{userProfile.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{userProfile.department || 'Engineering'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/50">
        {/* Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 capitalize">
              {activeTab === 'overview' && `Welcome Back, ${userProfile.name.split(' ')[0]} 👋`}
              {activeTab === 'leaves' && 'Leave Balances & Applications'}
              {activeTab === 'attendance' && 'Monthly Work Records'}
              {activeTab === 'payslips' && 'Salary & Payslip History (PKR)'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Apply Leave</span>
            </button>
            <button
              onClick={fetchAllData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {alert && (
          <div className={`mx-6 mt-4 p-4 rounded-xl flex items-center justify-between text-xs font-semibold border backdrop-blur-md z-30 shadow-sm ${
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
            alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
            'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}>
            <div className="flex items-center gap-2">
              <span>{alert.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{alert.message}</span>
            </div>
            <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Top Leave Balance Counter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Casual Leave */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Casual Leave</span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-extrabold text-slate-900">{userProfile.casual_leave_balance}</span>
                <span className="text-xs text-slate-500 font-semibold">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Accrues +1.0 day monthly</p>
            </div>

            {/* Sick Leave */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sick Leave</span>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <HeartPulse className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-extrabold text-slate-900">{userProfile.sick_leave_balance}</span>
                <span className="text-xs text-slate-500 font-semibold">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">For medical & health recovery</p>
            </div>

            {/* Annual Leave */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Leave</span>
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                  <Palmtree className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-extrabold text-slate-900">{userProfile.annual_leave_balance}</span>
                <span className="text-xs text-slate-500 font-semibold">Days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Accrues +1.5 days monthly</p>
            </div>
          </div>

          {/* TAB 1: OVERVIEW WITH INTERACTIVE CHECK-IN/OUT WIDGET */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* COMPANY ANNOUNCEMENTS BANNER */}
              {holidays.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                    Company Announcements & Holidays
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {holidays.map(h => (
                      <div key={h.id} className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 shadow-sm relative overflow-hidden">
                        <div className="w-1.5 h-full bg-indigo-500 absolute left-0 top-0"></div>
                        <div className="flex-1 pl-2">
                          <h4 className="text-sm font-bold text-indigo-900">{h.title}</h4>
                          <p className="text-[10px] font-mono font-bold text-indigo-600 mt-1">
                            {h.start_date} to {h.end_date}
                          </p>
                          {h.description && (
                            <p className="text-xs text-indigo-700 italic mt-2">"{h.description}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Check-In/Check-Out Interactive Widget */}
                <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                        Live Attendance Station
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">Daily Check-In / Check-Out Widget</h3>
                    </div>

                    {/* Network Verification Tag */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <Wifi className={`w-4 h-4 ${networkInfo.isOfficeNetwork ? 'text-emerald-500' : 'text-amber-500'}`} />
                      <span className="text-slate-600">
                        IP: <strong className="text-slate-900 font-mono">{networkInfo.clientIp}</strong>
                      </span>
                      {networkInfo.isOfficeNetwork && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-700 font-bold">
                          Office WiFi ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Digital Clock & Status Display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-6">
                    <div className="text-center md:text-left space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-mono">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start gap-1.5 pt-1 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Static IP verification enabled
                      </p>
                    </div>

                    {/* Current Status Box */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 font-bold">Today's Shift Status</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          todayAttendance.isWeekend
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : todayAttendance.isCheckedOut
                            ? 'bg-slate-200 text-slate-700 border-slate-300'
                            : todayAttendance.isCheckedIn
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {todayAttendance.isWeekend
                            ? '🌙 Official Weekend Off'
                            : todayAttendance.isCheckedOut
                            ? '✓ Shift Completed'
                            : todayAttendance.isCheckedIn
                            ? '● Active (Checked In)'
                            : '○ Not Checked In'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-0.5 uppercase tracking-wider">Check-In</span>
                          <span className="font-mono font-bold text-slate-900">
                            {todayAttendance.attendance?.check_in_time || '--:--:--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block mb-0.5 uppercase tracking-wider">Check-Out</span>
                          <span className="font-mono font-bold text-slate-900">
                            {todayAttendance.attendance?.check_out_time || (todayAttendance.isCheckedIn ? 'In Progress' : '--:--:--')}
                          </span>
                        </div>
                      </div>

                      {todayAttendance.attendance?.total_hours_formatted && (
                        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-center text-xs">
                          <span className="text-slate-600">Total Hours Recorded: </span>
                          <strong className="text-indigo-700 font-bold">{todayAttendance.attendance.total_hours_formatted}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-6">
                    {todayAttendance.isWeekend ? (
                      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 shrink-0" />
                        <div>
                          <p className="font-bold">Official Off-Day (Friday & Saturday)</p>
                          <p className="text-[11px] text-sky-700 mt-0.5">
                            Attendance check-in is not required today and will not be counted as absent.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={handleCheckIn}
                          disabled={todayAttendance.isCheckedIn || checkingIn}
                          className="py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{checkingIn ? 'Verifying IP...' : todayAttendance.isCheckedIn ? 'Already Checked In ✓' : 'Check In Now'}</span>
                        </button>

                        <button
                          onClick={handleCheckOut}
                          disabled={!todayAttendance.isCheckedIn || todayAttendance.isCheckedOut || checkingOut}
                          className="py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>{checkingOut ? 'Calculating...' : todayAttendance.isCheckedOut ? 'Checked Out ✓' : 'Check Out'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Policy & System Info Card */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-indigo-600" />
                      Tamkeen Attendance Policy
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Corporate working guidelines</p>

                    <div className="mt-4 space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-800 font-bold block">📶 Static Office IP Requirement:</span>
                        <p className="text-slate-500 mt-0.5 text-[11px]">
                          Check-in is strictly verified against the office WiFi modem static IP.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-800 font-bold block">📅 Official Off-Days:</span>
                        <p className="text-slate-500 mt-0.5 text-[11px]">
                          Friday & Saturday are recognized official weekend days (never counted as absent).
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-800 font-bold block">🔄 Monthly Accrual Schedule:</span>
                        <p className="text-slate-500 mt-0.5 text-[11px]">
                          Leave balances automatically replenish on the 1st of every month via scheduled node-cron.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer border border-slate-200"
                  >
                    📝 Request Time Off / Leave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEAVE CENTER */}
          {activeTab === 'leaves' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Leave Management & History</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track the status of your leave requests. Approvals automatically decrement your balance.
                  </p>
                </div>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit New Leave Application</span>
                </button>
              </div>

              {myLeaves.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-200">
                  <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-900">No Leave Applications Found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">You haven't submitted any leave requests yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myLeaves.map((l) => (
                    <div key={l.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          l.leave_type === 'Sick'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : l.leave_type === 'Casual'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {l.leave_type} Leave
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          l.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.status === 'Approved' ? '✓ Approved' : l.status === 'Rejected' ? '✗ Rejected' : '⏳ Pending HR'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Duration:</span>
                          <span className="font-semibold text-slate-900">{l.start_date} → {l.end_date}</span>
                        </div>
                        <div className="flex justify-between mt-1 border-t border-slate-200 pt-1">
                          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Days:</span>
                          <span className="font-bold text-indigo-600">{l.days} Day(s)</span>
                        </div>
                      </div>
                      
                      {l.reason && (
                        <div className="text-[11px] text-slate-500 italic px-1">
                          "{l.reason}"
                        </div>
                      )}
                      
                      {l.proof_document && (
                        <div className="pt-1.5 border-t border-slate-100">
                          <a href={`http://localhost:5000${l.proof_document}`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 font-bold">
                            <FileText className="w-3 h-3"/> View Attached Proof
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY LOG */}
          {activeTab === 'attendance' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Personal Attendance History</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified check-in and check-out logs recorded via office network.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Total Worked</th>
                      <th className="py-3 px-4">Network IP</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {myHistory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-slate-500 font-medium">
                          No attendance logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      myHistory.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{h.date}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{getDayName(h.date)}</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">{h.check_in_time || '-'}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{h.check_out_time || <span className="text-amber-500 font-bold">In Progress</span>}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {h.total_hours_formatted || (h.total_hours ? `${h.total_hours} hrs` : '-')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">{h.client_ip || 'Office WiFi'}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {h.status || 'Present'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MY PAYSLIPS (PKR) */}
          {activeTab === 'payslips' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Monthly Payslips & Salary History (PKR)</h3>
                <p className="text-xs text-slate-500 mt-0.5">View your base salary, attendance deductions, and net payouts in Pakistani Rupees.</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Month</th>
                      <th className="py-3 px-4">Base Salary</th>
                      <th className="py-3 px-4">Unpaid Leaves</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4">Bonus</th>
                      <th className="py-3 px-4">Net Payable</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {myPayslips.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-slate-500 font-medium">
                          No payslip records found for your account yet.
                        </td>
                      </tr>
                    ) : (
                      myPayslips.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{p.month}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">Rs. {p.base_salary.toLocaleString()}</td>
                          <td className="py-3.5 px-4 font-bold text-rose-600">{p.unpaid_leaves} days</td>
                          <td className="py-3.5 px-4 font-mono text-rose-600">-Rs. {p.deductions.toLocaleString()}</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-600">+Rs. {p.bonus.toLocaleString()}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">Rs. {p.net_payable.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.status === 'Approved & Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              p.status === 'Pending CEO Approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* LEAVE REQUEST SLIDE-OUT / MODAL */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowLeaveModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  📝 Leave Application Form
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Submit request for Sick, Casual, or Annual Leave</p>
              </div>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Leave Category
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLeaveType('Casual')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      leaveType === 'Casual'
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200'
                    }`}
                  >
                    <span className="text-sm block">🎉</span>
                    <span className="text-xs mt-1 block font-bold">Casual</span>
                    <span className="text-[10px] font-medium">({userProfile.casual_leave_balance}d)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeaveType('Sick')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      leaveType === 'Sick'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200'
                    }`}
                  >
                    <span className="text-sm block">👨‍⚕️</span>
                    <span className="text-xs mt-1 block font-bold">Sick</span>
                    <span className="text-[10px] font-medium">({userProfile.sick_leave_balance}d)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeaveType('Annual')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      leaveType === 'Annual'
                        ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-sky-200'
                    }`}
                  >
                    <span className="text-sm block">✈️</span>
                    <span className="text-xs mt-1 block font-bold">Annual</span>
                    <span className="text-[10px] font-medium">({userProfile.annual_leave_balance}d)</span>
                  </button>
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Auto Calculated Days badge */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-bold">Calculated Duration:</span>
                <span className="font-bold text-indigo-600">{calculatedDays} Day(s)</span>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Reason / Comments
                </label>
                <textarea
                  rows="3"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="State reason for absence..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 resize-none"
                />
              </div>

              {/* File Upload (Optional Proof) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Attach Proof (Optional PDF/PNG)
                </label>
                <input
                  id="emp-proof-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setLeaveProof(e.target.files[0])}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingLeave ? 'Submitting...' : 'Submit to HR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
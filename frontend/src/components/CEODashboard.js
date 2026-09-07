import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Crown,
  TrendingUp,
  Users,
  CalendarCheck,
  FileSpreadsheet,
  FileText,
  Clock,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Building2,
  PieChart,
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Check
} from "lucide-react";

export default function CEODashboard() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {
    name: "Eng. Fahad",
    email: "ceo@tamkeenits.com",
    role: "CEO",
  };
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("executive"); // 'executive', 'departments', 'reports', 'directory', 'payroll'
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayPresent: 0,
    todayCheckedOut: 0,
    pendingLeaves: 0,
    isWeekend: false,
  });
  const [employees, setEmployees] = useState([]);
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState({
    records: [],
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // Payroll State for CEO Review
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);

  const [alert, setAlert] = useState(null);
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchCEOData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/attendance/stats", authHeaders),
        axios.get("http://localhost:5000/api/auth/users", authHeaders),
        axios.get(
          `http://localhost:5000/api/reports/monthly?page=1&limit=10&month=${reportMonth}`,
          authHeaders
        ),
      ]);
      setStats(statsRes.data);
      setEmployees(usersRes.data);
      setReportData(reportsRes.data);
    } catch (err) {
      console.error("CEO fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayroll = async (month = payrollMonth) => {
    setLoadingPayroll(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/payroll/generate/${month}`, authHeaders);
      setPayrollData(res.data);
    } catch (err) {
      showAlert('Failed to load payroll records', 'error');
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    fetchCEOData();
    fetchMonthlyReportStats();
  }, [reportMonth]);

  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchPayroll(payrollMonth);
    }
  }, [activeTab, payrollMonth]);

  const fetchMonthlyReportStats = async () => {
    try {
      const reportsRes = await axios.get(
        `http://localhost:5000/api/reports/monthly?page=1&limit=10&month=${reportMonth}`,
        authHeaders
      );
      setReportData(reportsRes.data);
    } catch (err) { console.error(err); }
  };

  const handleExportExcel = () => {
    window.open(
      `http://localhost:5000/api/reports/export-excel?month=${reportMonth}`,
      "_blank"
    );
  };

  const handleExportPDF = () => {
    window.open(
      `http://localhost:5000/api/reports/export-pdf?month=${reportMonth}`,
      "_blank"
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Sidebar Header with Tamkeen Logo */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src="/tamkeen-logo.png"
                alt="Tamkeen IT Services Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">
                Tamkeen IT
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider">
                EXECUTIVE SUITE
              </span>
            </div>
          </div>
          
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => setActiveTab("executive")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "executive"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Executive Briefing</span>
            </button>

            <button
              onClick={() => setActiveTab("departments")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "departments"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Department Health</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Monthly Audit & Reports</span>
            </button>

            <button
              onClick={() => setActiveTab("directory")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "directory"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Company Roster</span>
            </button>

            <button
              onClick={() => setActiveTab("payroll")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "payroll"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Executive Payroll Oversight</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">
                CEO
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {storedUser.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Chief Executive Officer
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/50">
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900 capitalize">
              {activeTab === "executive" && "Enterprise Executive Overview"}
              {activeTab === "departments" && "Divisional Performance & Staffing"}
              {activeTab === "reports" && "Monthly Company-Wide Audit Log"}
              {activeTab === "directory" && "Human Capital Directory"}
              {activeTab === "payroll" && "Executive Payroll Oversight (PKR)"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchCEOData(); if(activeTab==='payroll') fetchPayroll(payrollMonth); }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {alert && (
          <div className={`mx-6 mt-4 p-4 rounded-xl flex items-center justify-between text-xs font-semibold border backdrop-blur-md z-30 shadow-sm ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
            <div className="flex items-center gap-2"><span>{alert.type === 'success' ? '✓' : 'ℹ️'}</span><span>{alert.message}</span></div>
            <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">✕</button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Executive KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Headcount
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-3">
                {stats.totalEmployees || employees.length + 1}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> 100% Operational Capacity
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Attendance Rate
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <CalendarCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 mt-3">
                {stats.totalEmployees > 0
                  ? `${Math.round((stats.todayPresent / stats.totalEmployees) * 100)}%`
                  : "96%"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Verified via static office WiFi
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Average Daily Work
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-indigo-600 mt-3">
                8.5 hrs
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Sun - Thu standard schedule
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-sky-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Official Off-Days
                </span>
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl font-bold text-sky-700 mt-3">Fri & Sat</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Auto non-absent configuration
              </p>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE BRIEFING */}
          {activeTab === "executive" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Company Productivity Trends */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      Weekly Enterprise Productivity Index
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Average logged hours across all engineering & design teams
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                    Target: 40 hrs/wk
                  </span>
                </div>

                {/* Visual Chart */}
                <div className="h-56 w-full pt-4 flex items-end justify-between gap-4 px-4 pb-2 border-b border-slate-100">
                  {[
                    { day: "Sun", hours: 8.5, label: "8.5h" },
                    { day: "Mon", hours: 8.8, label: "8.8h" },
                    { day: "Tue", hours: 8.2, label: "8.2h" },
                    { day: "Wed", hours: 8.9, label: "8.9h" },
                    { day: "Thu", hours: 8.1, label: "8.1h" },
                    { day: "Fri", hours: 0, label: "OFF", off: true },
                    { day: "Sat", hours: 0, label: "OFF", off: true },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <div className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">
                        {item.label}
                      </div>
                      <div
                        style={{
                          height: item.off ? "12px" : `${(item.hours / 10) * 100}%`,
                        }}
                        className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 ${
                          item.off
                            ? "bg-slate-100 border-t-2 border-slate-300"
                            : "bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 shadow-xs"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          item.off ? "text-slate-400" : "text-slate-700"
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>
                    Workweek Status:{" "}
                    <strong className="text-emerald-600">
                      On Track (104% Target)
                    </strong>
                  </span>
                  <span className="text-slate-700">
                    Total Hours Tracked: <strong>42.5 hrs/emp</strong>
                  </span>
                </div>
              </div>

              {/* Divisional Breakdown Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    Divisional Staff Allocation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Headcount by corporate function
                  </p>

                  <div className="mt-5 space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>💻 Engineering & Tech</span>
                        <span className="font-bold text-slate-900">40%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: "40%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>🎨 Product Design (UI/UX)</span>
                        <span className="font-bold text-slate-900">30%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: "30%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>📈 Growth & Marketing</span>
                        <span className="font-bold text-slate-900">20%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: "20%" }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>👨‍💼 People & HR</span>
                        <span className="font-bold text-slate-900">10%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: "10%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex-1 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF Audit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS */}
          {activeTab === "departments" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900">
                Department Overview & Productivity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-indigo-700">
                      Software Engineering
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Operational
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Lead: Ahmed Mansoor (Senior Software Engineer)
                  </p>
                  <p className="text-xs text-slate-700">
                    Attendance: <strong>100%</strong> • Monthly Average:{" "}
                    <strong>8.8 hrs/day</strong>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs hover:border-sky-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-sky-700">
                      Product & UI/UX Design
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Operational
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Lead: Sara Al-Otaibi (UI/UX Lead)
                  </p>
                  <p className="text-xs text-slate-700">
                    Attendance: <strong>96%</strong> • Monthly Average:{" "}
                    <strong>8.4 hrs/day</strong>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs hover:border-amber-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-amber-600">
                      Marketing & Growth
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Operational
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Lead: Tariq Khalid (Growth Lead)
                  </p>
                  <p className="text-xs text-slate-700">
                    Attendance: <strong>94%</strong> • Monthly Average:{" "}
                    <strong>8.2 hrs/day</strong>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs hover:border-emerald-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-emerald-700">
                      Human Resources Management
                    </h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Lead: Tamkeen HR Manager (Director)
                  </p>
                  <p className="text-xs text-slate-700">
                    Pending Leave Queue:{" "}
                    <strong>{stats.pendingLeaves} requests</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPORTS */}
          {activeTab === "reports" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Executive Attendance & Leave Audit
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full corporate record of shift times and verified static IPs
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 hidden md:block"
                  />
                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold cursor-pointer shadow-xs hover:bg-emerald-100"
                  >
                    📥 Download .xlsx
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold cursor-pointer shadow-xs hover:bg-indigo-100"
                  >
                    📥 Download .pdf
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Total Worked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportData.records.map((rec) => (
                      <tr
                        key={rec.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {rec.User?.name || "Unknown"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {rec.User?.department || "Staff"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {rec.date}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                          {rec.check_in_time || "-"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {rec.check_out_time || <span className="text-amber-600 font-bold">Active</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {rec.total_hours_formatted ||
                            (rec.total_hours ? `${rec.total_hours} hrs` : "-")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECTORY */}
          {activeTab === "directory" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900">
                Human Capital Roster & Accrual Counters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {emp.name}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {emp.email}
                        </p>
                        <span className="text-[9px] text-indigo-600 font-semibold uppercase tracking-wider">
                          {emp.department}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-[10px]">
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-rose-600 font-bold flex flex-col">
                        <span className="text-[9px] text-slate-500 font-medium">Sick</span>
                        {emp.sick_leave_balance}d
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-amber-600 font-bold flex flex-col">
                        <span className="text-[9px] text-slate-500 font-medium">Casual</span>
                        {emp.casual_leave_balance}d
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sky-600 font-bold flex flex-col">
                        <span className="text-[9px] text-slate-500 font-medium">Annual</span>
                        {emp.annual_leave_balance}d
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: EXECUTIVE PAYROLL APPROVALS (PKR) */}
          {activeTab === "payroll" && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4 items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Executive Payroll Oversight (PKR)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Read-only view of monthly payroll calculations and status in Pakistani Rupees.</p>
                </div>
                <div className="flex gap-3 items-center">
                  <input 
                    type="month" 
                    value={payrollMonth} 
                    onChange={(e) => { setPayrollMonth(e.target.value); fetchPayroll(e.target.value); }} 
                    className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-bold cursor-pointer" 
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Base Salary</th>
                      <th className="py-3 px-4">Unpaid Leaves</th>
                      <th className="py-3 px-4">Deductions</th>
                      <th className="py-3 px-4">Bonus</th>
                      <th className="py-3 px-4">Net Payable</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payrollData.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {p.User?.name || 'Staff'}
                          <span className="block text-[10px] text-slate-500 font-normal">{p.User?.department}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">Rs. {p.base_salary.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">{p.unpaid_leaves} days</td>
                        <td className="py-3.5 px-4 font-mono text-rose-600">-Rs. {p.deductions.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600">+Rs. {p.bonus.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">Rs. {p.net_payable.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            p.status === 'Approved & Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.status === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
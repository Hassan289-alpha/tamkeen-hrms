import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, CalendarCheck, Clock, FileSpreadsheet, FileText, CheckCircle, XCircle, LogOut,
  Sparkles, TrendingUp, Search, ChevronLeft, ChevronRight, RefreshCw, Briefcase,
  PieChart, UserCheck, Play, Trash2, UserPlus, Edit3, X, Activity, Check, ShieldCheck, ArrowUpRight, Megaphone, Flag, Download
} from 'lucide-react';

export default function HRDashboard() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user')) || { name: 'HR Manager', email: 'hr@tamkeenits.com', role: 'HR' };
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ totalEmployees: 0, todayPresent: 0, todayCheckedOut: 0, pendingLeaves: 0, isWeekend: false });
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const [newEmp, setNewEmp] = useState({ name: '', email: '', password: 'employee123', department: 'Engineering', base_salary: 75000, document: null });
  const [addingUser, setAddingUser] = useState(false);

  const [newHoliday, setNewHoliday] = useState({ title: '', start_date: '', end_date: '', description: '' });
  const [announcingHoliday, setAnnouncingHoliday] = useState(false);
  const [editHolidayModal, setEditHolidayModal] = useState(null);
  const [editEmployeeModal, setEditEmployeeModal] = useState(null);

  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [reportData, setReportData] = useState({ records: [], totalCount: 0, totalPages: 1, currentPage: 1 });
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportPage, setReportPage] = useState(1);

  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollData, setPayrollData] = useState([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [editPayrollModal, setEditPayrollModal] = useState(null);

  const [editRecord, setEditRecord] = useState(null);
  const [alert, setAlert] = useState(null);
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, leavesRes, allLeavesRes, holidaysRes] = await Promise.all([
        axios.get('http://localhost:5000/api/attendance/stats', authHeaders),
        axios.get('http://localhost:5000/api/leaves/pending', authHeaders),
        axios.get('http://localhost:5000/api/leaves/all', authHeaders),
        axios.get('http://localhost:5000/api/holidays', authHeaders)
      ]);
      setStats(statsRes.data);
      setPendingLeaves(leavesRes.data || []);
      setAllLeaves(allLeavesRes.data || []);
      setHolidays(holidaysRes.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/users', authHeaders);
      setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMonthlyReport = async (page = 1, month = reportMonth, search = searchQuery) => {
    setLoadingReports(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/reports/monthly?page=${page}&limit=1000&month=${month}&search=${encodeURIComponent(search)}`, authHeaders);
      setReportData(res.data);
      setReportPage(page);
    } catch (err) { showAlert('Failed to load reports', 'error'); } finally { setLoadingReports(false); }
  };

  const fetchPayroll = async (month = payrollMonth) => {
    setLoadingPayroll(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/payroll/generate/${month}`, authHeaders);
      setPayrollData(res.data);
    } catch (err) { showAlert('Failed to load payroll', 'error'); } finally { setLoadingPayroll(false); }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchEmployees();
    fetchMonthlyReport(1, reportMonth, searchQuery);
  }, []);

  useEffect(() => {
    if (activeTab === 'payroll') fetchPayroll(payrollMonth);
  }, [activeTab, payrollMonth]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      const formData = new FormData();
      formData.append('name', newEmp.name);
      formData.append('email', newEmp.email);
      formData.append('password', newEmp.password);
      formData.append('department', newEmp.department);
      formData.append('base_salary', newEmp.base_salary);
      if (newEmp.document) formData.append('document', newEmp.document);

      await axios.post('http://localhost:5000/api/auth/register', formData, { headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' } });
      showAlert('✓ Employee account saved successfully!', 'success');
      setNewEmp({ name: '', email: '', password: 'employee123', department: 'Engineering', base_salary: 75000, document: null });
      if(document.getElementById('hr-file-upload')) document.getElementById('hr-file-upload').value = '';
      fetchEmployees();
      fetchDashboardData();
    } catch (err) { showAlert(err.response?.data?.error || 'Failed to create employee', 'error'); } finally { setAddingUser(false); }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/auth/users/${editEmployeeModal.id}`, editEmployeeModal, authHeaders);
      showAlert('✓ Employee updated successfully!', 'success');
      setEditEmployeeModal(null);
      fetchEmployees();
    } catch (err) { showAlert('Failed to update employee', 'error'); }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to completely remove ${name}?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/auth/users/${id}`, authHeaders);
      showAlert(`✓ Employee ${name} removed.`, 'success');
      fetchEmployees();
      fetchDashboardData();
    } catch (err) { showAlert('Failed to remove employee', 'error'); }
  };

  // ==========================================
  // INDIVIDUAL EMPLOYEE EXPORTS
  // ==========================================
  const handleDownloadIndividualExcel = async (id, name) => {
    try {
      showAlert(`Generating Excel for ${name}...`, "info");
      const response = await fetch(`http://localhost:5000/api/reports/export-employee/${id}/excel`, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_Attendance_History.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert("✓ Excel generated!", "success");
    } catch (error) { showAlert("Failed to generate Excel.", "error"); }
  };

  const handleDownloadIndividualPDF = async (id, name) => {
    try {
      showAlert(`Generating PDF for ${name}...`, "info");
      const response = await fetch(`http://localhost:5000/api/reports/export-employee/${id}/pdf`, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert("✓ PDF generated!", "success");
    } catch (error) { showAlert("Failed to generate PDF.", "error"); }
  };

  const handleAnnounceHoliday = async (e) => {
    e.preventDefault();
    setAnnouncingHoliday(true);
    try {
      await axios.post('http://localhost:5000/api/holidays/announce', newHoliday, authHeaders);
      showAlert('✓ Holiday announced! Deductions successfully blocked.', 'success');
      setNewHoliday({ title: '', start_date: '', end_date: '', description: '' });
      fetchDashboardData();
    } catch (err) { showAlert('Failed to announce holiday', 'error'); } finally { setAnnouncingHoliday(false); }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/holidays/${editHolidayModal.id}`, editHolidayModal, authHeaders);
      showAlert('✓ Holiday updated successfully!', 'success');
      setEditHolidayModal(null);
      fetchDashboardData();
    } catch (err) { showAlert('Failed to update holiday', 'error'); }
  };

  const handleDeleteHoliday = async (id) => {
    if(!window.confirm("Remove this holiday?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/holidays/${id}`, authHeaders);
      showAlert('Holiday removed', 'success');
      fetchDashboardData();
    } catch(err) { showAlert('Failed to delete holiday', 'error'); }
  };

  const handleSavePayrollEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/payroll/update/${editPayrollModal.id}`, editPayrollModal, authHeaders);
      showAlert("✓ Payroll record updated successfully!", "success");
      setEditPayrollModal(null);
      fetchPayroll(payrollMonth);
    } catch (err) { showAlert("Failed to update payroll", "error"); }
  };

  // HR Direct Approval Logic
  const handleApprovePayroll = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/payroll/update/${id}`, { status: 'Approved & Paid' }, authHeaders);
      showAlert("✓ Payroll Approved & Finalized!", "success");
      fetchPayroll(payrollMonth);
    } catch (err) { showAlert("Failed to approve payroll", "error"); }
  };

  const handleApproveAllDrafts = async () => {
    if(!window.confirm("Are you sure you want to approve all drafts for this month? This will allow employees to download their payslips.")) return;
    try {
      await axios.put('http://localhost:5000/api/payroll/approve-all', { month: payrollMonth }, authHeaders);
      showAlert("✓ All drafts approved & finalized!", "success");
      fetchPayroll(payrollMonth);
    } catch (err) { showAlert("Failed to approve drafts", "error"); }
  };

  const handleDownloadPayslip = async (id, employeeName, month) => {
    try {
      showAlert("Generating PDF payslip...", "info");
      const response = await axios.get(`http://localhost:5000/api/payroll/payslip/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tamkeen_Payslip_${month}_${employeeName || 'Staff'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showAlert("✓ Official payslip downloaded successfully!", "success");
    } catch (error) { showAlert("Failed to download payslip PDF", "error"); }
  };

  const handleApproveLeave = async (leaveId, employeeName, leaveType) => {
    setApprovingId(leaveId);
    try {
      await axios.put(`http://localhost:5000/api/leaves/${leaveId}/status`, { status: 'Approved' }, authHeaders);
      showAlert(`✓ Approved ${leaveType} leave for ${employeeName}.`, 'success');
      setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
      fetchDashboardData();
      fetchEmployees();
    } catch (err) { showAlert('Failed to approve leave', 'error'); } finally { setApprovingId(null); }
  };

  const handleRejectLeave = async (leaveId) => {
    setRejectingId(leaveId);
    try {
      await axios.put(`http://localhost:5000/api/leaves/${leaveId}/status`, { status: 'Rejected' }, authHeaders);
      showAlert('Leave marked as rejected.', 'info');
      setPendingLeaves(prev => prev.filter(l => l.id !== leaveId));
      fetchDashboardData();
    } catch (err) { showAlert('Failed to reject leave', 'error'); } finally { setRejectingId(null); }
  };

  const submitEditAttendance = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/attendance/update/${editRecord.id}`, { check_in_time: editRecord.check_in_time, check_out_time: editRecord.check_out_time, status: editRecord.status }, authHeaders);
      showAlert('✓ Attendance record updated!', 'success');
      setEditRecord(null);
      fetchMonthlyReport(reportPage, reportMonth, searchQuery);
    } catch (err) { showAlert('Failed to update attendance', 'error'); }
  };

  const handleTriggerCron = async () => {
    try {
      await axios.post('http://localhost:5000/api/cron/trigger-accrual', {}, authHeaders);
      showAlert(`✓ Monthly Leave Accrual Executed!`, 'success');
      fetchEmployees();
    } catch (err) { showAlert('Failed to run accrual', 'error'); }
  };

  const handleDownloadExcel = async () => {
    try {
      showAlert("Generating multi-sheet Excel report...", "info");
      const response = await fetch("http://localhost:5000/api/reports/export-excel", { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Tamkeen_HR_Report.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert("✓ Excel report downloaded successfully!", "success");
    } catch (error) { showAlert("Failed to download Excel report.", "error"); }
  };

  const handleDownloadPDF = async () => {
    try {
      showAlert("Generating PDF report...", "info");
      const response = await fetch(`http://localhost:5000/api/reports/export-pdf?month=${reportMonth}`, { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tamkeen_Attendance_Report_${reportMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showAlert("✓ PDF report downloaded successfully!", "success");
    } catch (error) { showAlert("Failed to download PDF report.", "error"); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans relative selection:bg-indigo-500 selection:text-white">

      {/* EDIT HOLIDAY MODAL */}
      {editHolidayModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900">
            <button onClick={() => setEditHolidayModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Holiday Announcement</h3>
            <form onSubmit={handleUpdateHoliday} className="space-y-4 mt-4">
              <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Holiday Title</label><input type="text" required value={editHolidayModal.title} onChange={e => setEditHolidayModal({...editHolidayModal, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Start Date</label><input type="date" required value={editHolidayModal.start_date} onChange={e => setEditHolidayModal({...editHolidayModal, start_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">End Date</label><input type="date" required value={editHolidayModal.end_date} onChange={e => setEditHolidayModal({...editHolidayModal, end_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Description</label><textarea rows="2" value={editHolidayModal.description || ''} onChange={e => setEditHolidayModal({...editHolidayModal, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600 resize-none" /></div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors mt-2 cursor-pointer shadow-sm">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ATTENDANCE MODAL */}
      {editRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900">
            <button onClick={() => setEditRecord(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Attendance Record</h3>
            <form onSubmit={submitEditAttendance} className="space-y-4 mt-4">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Check-In Time</label><input type="text" value={editRecord.check_in_time || ''} onChange={e => setEditRecord({...editRecord, check_in_time: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Check-Out Time</label><input type="text" value={editRecord.check_out_time || ''} onChange={e => setEditRecord({...editRecord, check_out_time: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" /></div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={editRecord.status} onChange={e => setEditRecord({...editRecord, status: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600">
                  <option value="Present">Present</option><option value="Late">Late</option><option value="Absent">Absent</option><option value="Half-Day">Half-Day</option><option value="Holiday">Holiday</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors mt-2 cursor-pointer shadow-sm">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900">
            <button onClick={() => setEditEmployeeModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Employee Profile</h3>
            <form onSubmit={handleUpdateEmployee} className="space-y-4 mt-4">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label><input type="text" value={editEmployeeModal.name} onChange={e => setEditEmployeeModal({...editEmployeeModal, name: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input type="email" value={editEmployeeModal.email} onChange={e => setEditEmployeeModal({...editEmployeeModal, email: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Department</label><input type="text" value={editEmployeeModal.department} onChange={e => setEditEmployeeModal({...editEmployeeModal, department: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Base Salary (Rs.)</label><input type="number" value={editEmployeeModal.base_salary} onChange={e => setEditEmployeeModal({...editEmployeeModal, base_salary: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors mt-2 cursor-pointer shadow-sm">Update Employee</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PAYROLL MODAL */}
      {editPayrollModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900">
            <button onClick={() => setEditPayrollModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Monthly Payroll (PKR)</h3>
            <form onSubmit={handleSavePayrollEdit} className="space-y-4 mt-4">
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Base Salary (Rs.)</label><input type="number" value={editPayrollModal.base_salary} onChange={e => setEditPayrollModal({...editPayrollModal, base_salary: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Unpaid Leave Days</label><input type="number" value={editPayrollModal.unpaid_leaves} onChange={e => { const days = Number(e.target.value); const daily = editPayrollModal.base_salary / 30; const deductions = Math.round(days * daily); setEditPayrollModal({...editPayrollModal, unpaid_leaves: days, deductions}); }} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Calculated Deductions (Rs.)</label><input type="number" value={editPayrollModal.deductions} onChange={e => setEditPayrollModal({...editPayrollModal, deductions: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1">Bonus (Rs.)</label><input type="number" value={editPayrollModal.bonus} onChange={e => setEditPayrollModal({...editPayrollModal, bonus: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" required /></div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs flex justify-between font-bold text-indigo-900"><span>Net Payable:</span><span>Rs. {(Number(editPayrollModal.base_salary) - Number(editPayrollModal.deductions) + Number(editPayrollModal.bonus)).toLocaleString()}</span></div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors mt-2 cursor-pointer shadow-sm">Save Payroll Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img src="/tamkeen-logo.png" alt="Tamkeen IT Services Logo" className="w-full h-full object-contain rounded-md" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 tracking-tight leading-tight">Tamkeen IT</h2>
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider">SERVICES HRMS</span>
            </div>
          </div>
          <nav className="p-4 space-y-1.5">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><TrendingUp className="w-4 h-4" /><span>Overview & Analytics</span></button>
            <button onClick={() => setActiveTab('pending')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
              <div className="flex items-center gap-3"><Clock className="w-4 h-4" /><span>Pending Leaves</span></div>
              {pendingLeaves.length > 0 && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full animate-pulse">{pendingLeaves.length}</span>}
            </button>
            <button onClick={() => setActiveTab('holidays')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'holidays' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Megaphone className="w-4 h-4" /><span>Public Holidays</span></button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><FileSpreadsheet className="w-4 h-4" /><span>Monthly Reports & Audit</span></button>
            <button onClick={() => setActiveTab('employees')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Users className="w-4 h-4" /><span>Employee Directory</span></button>
            <button onClick={() => setActiveTab('payroll')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><FileText className="w-4 h-4" /><span>Payroll Management</span></button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs">HR</div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">{storedUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{storedUser.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/50">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <h1 className="text-base font-bold text-slate-900 capitalize">
            {activeTab === 'overview' && 'Executive HR Dashboard'}
            {activeTab === 'pending' && 'Leave Applications'}
            {activeTab === 'holidays' && 'Company Announcements & Holidays'}
            {activeTab === 'reports' && 'Attendance Editor & Reports'}
            {activeTab === 'employees' && 'Staff Directory & Documents'}
            {activeTab === 'payroll' && 'Payroll Management & Salary Deductions (PKR)'}
          </h1>
          <div className="flex gap-3">
            <button onClick={handleTriggerCron} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"><Play className="w-3.5 h-3.5" /><span>Test Accrual Cron</span></button>
            <button onClick={() => { fetchDashboardData(); fetchEmployees(); fetchMonthlyReport(reportPage); if(activeTab==='payroll') fetchPayroll(payrollMonth); }} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </header>

        {alert && (
          <div className={`mx-6 mt-4 p-4 rounded-xl flex items-center justify-between text-xs font-semibold border backdrop-blur-md z-30 shadow-sm ${alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
            <div className="flex items-center gap-2"><span>{alert.type === 'success' ? '✓' : 'ℹ️'}</span><span>{alert.message}</span></div>
            <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">✕</button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Staff</span><div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Users className="w-5 h-5" /></div></div><p className="text-2xl font-extrabold text-slate-900 mt-3">{stats.totalEmployees || employees.length}</p></div>
             <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden"><div className="flex justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</span><UserCheck className="w-5 h-5 text-emerald-600" /></div><p className="text-2xl font-extrabold text-emerald-600 mt-3">{stats.todayPresent}</p></div>
             <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden"><div className="flex justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span><Clock className="w-5 h-5 text-amber-600" /></div><p className="text-2xl font-extrabold text-amber-600 mt-3">{pendingLeaves.length}</p></div>
             <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden"><div className="flex justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Off-Day Rule</span><CalendarCheck className="w-5 h-5 text-sky-600" /></div><p className="text-lg font-bold text-sky-700 mt-3">Fri & Sat</p></div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-600" />Weekly Attendance & Work Hours Analytics</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Average tracked hours per staff member across operating days</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">Standard: 8.5 hrs/day</span>
                  </div>

                  <div className="h-56 w-full pt-4 flex items-end justify-between gap-4 px-4 pb-2 border-b border-slate-100">
                    {[{ day: 'Sun', hours: 8.5, label: '8.5h' }, { day: 'Mon', hours: 8.8, label: '8.8h' }, { day: 'Tue', hours: 8.2, label: '8.2h' }, { day: 'Wed', hours: 8.9, label: '8.9h' }, { day: 'Thu', hours: 8.4, label: '8.4h' }, { day: 'Fri', hours: 0, label: 'OFF', off: true }, { day: 'Sat', hours: 0, label: 'OFF', off: true }].map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">{item.label}</div>
                        <div style={{ height: item.off ? '12px' : `${(item.hours / 10) * 100}%` }} className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 ${item.off ? 'bg-slate-100 border-t-2 border-slate-300' : 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 shadow-xs'}`} />
                        <span className={`text-[11px] font-semibold ${item.off ? 'text-slate-400' : 'text-slate-700'}`}>{item.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 gap-2"><span>Attendance Status: <strong className="text-emerald-600 font-bold">96% Present Rate</strong></span><span className="text-slate-700">Total Operational Staff: <strong>{stats.totalEmployees || employees.length} Active</strong></span></div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><PieChart className="w-4 h-4 text-indigo-600" />Department Distribution</h3>
                    <div className="mt-5 space-y-3 text-xs">
                      <div><div className="flex justify-between text-slate-700 mb-1"><span>💻 Engineering & Tech</span><span className="font-bold text-slate-900">45%</span></div><div className="w-full h-2 rounded-full bg-slate-100"><div className="h-full bg-indigo-600 rounded-full" style={{ width: '45%' }} /></div></div>
                      <div><div className="flex justify-between text-slate-700 mb-1"><span>🎨 UI/UX & Design</span><span className="font-bold text-slate-900">25%</span></div><div className="w-full h-2 rounded-full bg-slate-100"><div className="h-full bg-sky-500 rounded-full" style={{ width: '25%' }} /></div></div>
                      <div><div className="flex justify-between text-slate-700 mb-1"><span>📈 Growth & Marketing</span><span className="font-bold text-slate-900">20%</span></div><div className="w-full h-2 rounded-full bg-slate-100"><div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} /></div></div>
                      <div><div className="flex justify-between text-slate-700 mb-1"><span>👨‍💼 HR & Operations</span><span className="font-bold text-slate-900">10%</span></div><div className="w-full h-2 rounded-full bg-slate-100"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '10%' }} /></div></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-2"><button onClick={() => setActiveTab('pending')} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-200"><Clock className="w-4 h-4" /><span>Review Pending Leaves ({pendingLeaves.length})</span></button></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HOLIDAYS */}
          {activeTab === 'holidays' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-600" /> Announce Public Holiday</h3>
                  <p className="text-xs text-slate-500 mt-1">Announced holidays automatically block payroll deductions by applying the "Holiday" status to all staff attendance.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleAnnounceHoliday} className="lg:col-span-1 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-4">
                  <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Holiday Title</label><input type="text" required value={newHoliday.title} onChange={e => setNewHoliday({...newHoliday, title: e.target.value})} placeholder="e.g., Eid-ul-Fitr" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Start Date</label><input type="date" required value={newHoliday.start_date} onChange={e => setNewHoliday({...newHoliday, start_date: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">End Date</label><input type="date" required value={newHoliday.end_date} onChange={e => setNewHoliday({...newHoliday, end_date: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                  <div><label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Description (Optional)</label><textarea rows="2" value={newHoliday.description} onChange={e => setNewHoliday({...newHoliday, description: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600 resize-none" /></div>
                  <button type="submit" disabled={announcingHoliday} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"><Megaphone className="w-4 h-4" />{announcingHoliday ? 'Announcing...' : 'Announce & Block Deductions'}</button>
                </form>

                <div className="lg:col-span-2 space-y-4">
                  {holidays.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><Flag className="w-10 h-10 text-slate-300 mx-auto mb-2"/><p className="text-sm font-bold text-slate-900">No Upcoming Holidays</p></div>
                  ) : (
                    holidays.map(h => (
                      <div key={h.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative group flex items-start gap-4 hover:border-indigo-200 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Flag className="w-6 h-6" /></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-900">{h.title}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{h.start_date} to {h.end_date}</p>
                          {h.description && <p className="text-xs text-slate-600 italic mt-2">"{h.description}"</p>}
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditHolidayModal(h)} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteHoliday(h.id)} className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PENDING LEAVES */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-600" />Leave Applications & Pending Queue</h3>
                  <p className="text-xs text-slate-500 mt-1">Review incoming leave requests, check reason and supporting proof document, then approve or reject.</p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 self-start"><Clock className="w-3.5 h-3.5" /> {pendingLeaves.length} Pending Actions</span>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle className="w-6 h-6" /></div>
                  <h4 className="text-sm font-bold text-slate-900">All Caught Up!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">All submitted employee leave requests have been reviewed and decided.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingLeaves.map((leave) => (
                    <div key={leave.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-4 relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">{leave.User?.name ? leave.User.name.charAt(0) : 'E'}</div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{leave.User?.name || 'Employee'}</h4>
                            <p className="text-xs text-slate-500">{leave.User?.email || 'N/A'}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${leave.leave_type === 'Sick' ? 'bg-rose-50 text-rose-700 border-rose-200' : leave.leave_type === 'Casual' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>{leave.leave_type} Leave</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-700"><span>Requested Duration:</span><span className="font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">{leave.start_date} → {leave.end_date} ({leave.days} day)</span></div>
                        <div className="text-slate-700 pt-1 border-t border-slate-200"><span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Reason / Justification</span><p className="text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200">"{leave.reason}"</p></div>
                        {leave.proof_document && (<div className="pt-1"><a href={`http://localhost:5000${leave.proof_document}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200"><FileText className="w-3.5 h-3.5" /> View Proof</a></div>)}
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button onClick={() => handleApproveLeave(leave.id, leave.User?.name, leave.leave_type)} disabled={approvingId === leave.id} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"><Check className="w-4 h-4" /> <span>Approve</span></button>
                        <button onClick={() => handleRejectLeave(leave.id)} disabled={rejectingId === leave.id} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"><X className="w-4 h-4" /> <span>Reject</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === 'reports' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Monthly Attendance & Historical Date Audit</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter by specific month or check past months' attendance logs with full date precision.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button onClick={handleDownloadExcel} className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"><FileSpreadsheet className="w-4 h-4"/> Export Excel</button>
                  <button onClick={handleDownloadPDF} className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"><FileText className="w-4 h-4"/> Export PDF</button>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Calendar Month:</span>
                    <input type="month" value={reportMonth} onChange={(e) => { setReportMonth(e.target.value); fetchMonthlyReport(1, e.target.value, searchQuery); }} className="bg-transparent text-xs text-slate-900 outline-none font-bold cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input type="text" placeholder="Search by name, ID, or department..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); fetchMonthlyReport(1, reportMonth, e.target.value); }} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" />
              </div>
              <div className="overflow-auto max-h-[600px] rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs relative">
                  <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr><th className="py-3 px-4">Employee</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Check-In</th><th className="py-3 px-4">Check-Out</th><th className="py-3 px-4">Total Hrs</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportData.records.length === 0 ? (
                      <tr><td colSpan="7" className="py-8 text-center text-slate-400">No attendance records found.</td></tr>
                    ) : (
                      reportData.records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4"><p className="font-bold text-slate-900">{rec.User?.name}</p><p className="text-[10px] text-slate-500">{rec.User?.department}</p></td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{rec.date}</td>
                          <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">{rec.check_in_time || '-'}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">{rec.check_out_time || <span className="text-amber-600 font-bold">Active</span>}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{rec.total_hours_formatted || '-'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rec.status === 'Holiday' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>{rec.status}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button onClick={() => setEditRecord(rec)} className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white transition-colors cursor-pointer" title="Edit Record"><Edit3 className="w-4 h-4"/></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: EMPLOYEES DIRECTORY & EXPORTS */}
          {activeTab === 'employees' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900">Staff Directory, Base Salaries (PKR) & Document Vault</h3>

              <form onSubmit={handleAddEmployee} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
                <div className="lg:col-span-1"><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Full Name</label><input type="text" required value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                <div className="lg:col-span-1"><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Email</label><input type="email" required value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                <div className="lg:col-span-1"><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Password</label><input type="text" required value={newEmp.password} onChange={e => setNewEmp({...newEmp, password: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                <div className="lg:col-span-1"><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Department</label><input type="text" required value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                <div className="lg:col-span-1"><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Base Salary (Rs.)</label><input type="number" required value={newEmp.base_salary} onChange={e => setNewEmp({...newEmp, base_salary: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
                <div className="lg:col-span-1"><label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Upload ID/Doc</label><input id="hr-file-upload" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setNewEmp({...newEmp, document: e.target.files[0]})} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 cursor-pointer" /></div>
                <button type="submit" disabled={addingUser} className="w-full py-2 h-[34px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50"><UserPlus className="w-4 h-4 inline mr-1" />{addingUser ? '...' : 'Add Staff'}</button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative group hover:border-indigo-300 transition-all space-y-3">
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditEmployeeModal(emp)} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold">{emp.name.charAt(0)}</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                        <p className="text-[10px] text-slate-500">{emp.email}</p>
                        <span className="text-[10px] font-bold text-indigo-600">Rs. {(emp.base_salary || 75000).toLocaleString()} /mo</span>
                      </div>
                    </div>
                    {emp.document_url && (
                      <div><a href={`http://localhost:5000${emp.document_url}`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 font-semibold"><FileText className="w-3 h-3"/> View Attached ID</a></div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200"><span className="text-[10px] text-slate-500 block font-medium">Sick</span><span className="text-sm font-extrabold text-rose-600">{emp.sick_leave_balance}d</span></div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200"><span className="text-[10px] text-slate-500 block font-medium">Casual</span><span className="text-sm font-extrabold text-amber-600">{emp.casual_leave_balance}d</span></div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200"><span className="text-[10px] text-slate-500 block font-medium">Annual</span><span className="text-sm font-extrabold text-sky-600">{emp.annual_leave_balance}d</span></div>
                    </div>

                    {/* NEW INDIVIDUAL EXPORT BUTTONS */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleDownloadIndividualExcel(emp.id, emp.name)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold cursor-pointer transition-colors border border-emerald-200"><FileSpreadsheet className="w-3 h-3" /> Excel Logs</button>
                      <button onClick={() => handleDownloadIndividualPDF(emp.id, emp.name)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold cursor-pointer transition-colors border border-indigo-200"><FileText className="w-3 h-3" /> PDF Report</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PAYROLL MANAGEMENT */}
          {activeTab === 'payroll' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4 items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Automated Attendance-Driven Payroll & Manual Edits (PKR)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Calculates monthly salaries based on base pay minus unpaid leaves, with full edit flexibility.</p>
                </div>
                <div className="flex gap-3">
                  <input type="month" value={payrollMonth} onChange={(e) => { setPayrollMonth(e.target.value); fetchPayroll(e.target.value); }} className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer outline-none" />
                  <button onClick={() => fetchPayroll(payrollMonth)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200">
                    Recalculate Month
                  </button>
                  <button onClick={handleApproveAllDrafts} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm">
                    Approve All Drafts
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr><th className="py-3 px-4">Employee</th><th className="py-3 px-4">Base Salary</th><th className="py-3 px-4">Unpaid Leaves</th><th className="py-3 px-4">Deductions</th><th className="py-3 px-4">Bonus</th><th className="py-3 px-4">Net Payable</th><th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payrollData.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{p.User?.name || 'Staff'}<span className="block text-[10px] text-slate-500 font-normal">{p.User?.department}</span></td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">Rs. {p.base_salary.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">{p.unpaid_leaves} days</td>
                        <td className="py-3.5 px-4 font-mono text-rose-600">-Rs. {p.deductions.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600">+Rs. {p.bonus.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">Rs. {p.net_payable.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.status === 'Approved & Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button onClick={() => setEditPayrollModal(p)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold cursor-pointer">Edit</button>
                          {p.status === 'Draft' && (<button onClick={() => handleApprovePayroll(p.id)} className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs">Approve & Finalize</button>)}
                          {p.status === 'Approved & Paid' && (<button onClick={() => handleDownloadPayslip(p.id, p.User?.name, p.month)} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer border border-emerald-200 inline-flex items-center gap-1" title="Download Official Payslip PDF"><Download className="w-3.5 h-3.5" /> PDF</button>)}
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
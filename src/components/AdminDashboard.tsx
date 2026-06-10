/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Users, CalendarPlus, CheckSquare, Trash, BarChart3, TrendingUp, Sparkles, Building, Layers, Landmark, Calendar, Plus, X, FileSpreadsheet } from 'lucide-react';
import { Patient, LabTest, MedicationDispense, DutyAllocation, LeaveRequest, WhitelistUser, UserRole, Expense, PharmacyItem } from '../types';
import { GoogleSheetsView } from './GoogleSheetsView';

interface AdminDashboardProps {
  patients: Patient[];
  labTests: LabTest[];
  dispenses: MedicationDispense[];
  stock: PharmacyItem[];
  duties: DutyAllocation[];
  leaves: LeaveRequest[];
  whitelist: WhitelistUser[];
  expenses: Expense[];
  onAddWhitelist: (user: WhitelistUser) => void;
  onRemoveWhitelist: (email: string) => void;
  onAddDuty: (duty: DutyAllocation) => void;
  onRemoveDuty: (dutyId: string) => void;
  onUpdateLeaveStatus: (leaveId: string, status: 'Approved' | 'Rejected') => void;
  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (expenseId: string) => void;
  currentUserEmail: string;
  onClearTestDataToGoLive?: () => void;
}

export function AdminDashboard({
  patients,
  labTests,
  dispenses,
  stock = [],
  duties,
  leaves,
  whitelist,
  expenses = [],
  onAddWhitelist,
  onRemoveWhitelist,
  onAddDuty,
  onRemoveDuty,
  onUpdateLeaveStatus,
  onAddExpense,
  onRemoveExpense,
  currentUserEmail,
  onClearTestDataToGoLive,
}: AdminDashboardProps) {
  const [activeAdminSub, setActiveAdminSub] = useState<'rosters' | 'whitelist' | 'leaves' | 'finances' | 'sheets'>('finances');

  // New Whitelist state
  const [wlEmail, setWlEmail] = useState<string>('');
  const [wlName, setWlName] = useState<string>('');
  const [wlRole, setWlRole] = useState<UserRole>('Doctor');

  // New Duty state
  const [dutyEmail, setDutyEmail] = useState<string>('');
  const [dutyShift, setDutyShift] = useState<'Day Shift' | 'Night Shift' | 'On Call'>('Day Shift');
  const [dutyDept, setDutyDept] = useState<'Reception' | 'Lab' | 'Pharmacy' | 'Clinical' | 'Admin'>('Clinical');
  const [dutyDate, setDutyDate] = useState<string>('2026-06-05');

  // New Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('Electricity');
  const [expenseCustomCategory, setExpenseCustomCategory] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('2026-06-05');
  const [expenseDescription, setExpenseDescription] = useState<string>('');

  // Compute departmental financial statistics
  const patientRevenue = patients.length * 300; // Registration basic consultancy deposit
  const labRevenue = labTests.reduce((sum, item) => sum + (item.fee || 0), 0);
  
  // Distinguish Pharma vs Non-Pharma
  const pharmaDispenses = dispenses.filter(d => {
    const matched = stock?.find(s => s.name === d.medicationName);
    return matched ? matched.category !== 'Non-Pharmaceutical' : true;
  });
  const nonPharmaDispenses = dispenses.filter(d => {
    const matched = stock?.find(s => s.name === d.medicationName);
    return matched ? matched.category === 'Non-Pharmaceutical' : false;
  });

  const pharmaRevenue = pharmaDispenses.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const nonPharmaRevenue = nonPharmaDispenses.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  const pharmacyRevenue = pharmaRevenue + nonPharmaRevenue;
  const totalCombinedRevenue = patientRevenue + labRevenue + pharmacyRevenue;

  // General patient split
  const generalPatCount = patients.filter((p) => p.category === 'General Consultation').length;
  const specialistPatCount = patients.filter((p) => p.category === 'Consultant Clinic').length;

  const surgicalCount = patients.filter((p) => p.consultantSubCategory === 'Surgical').length;
  const pediatricsCount = patients.filter((p) => p.consultantSubCategory === 'Pediatrics').length;
  const mopcCount = patients.filter((p) => p.consultantSubCategory === 'MOPC').length;
  const obsGynCount = patients.filter((p) => p.consultantSubCategory === 'Obs/Gyn').length;

  const handleAddWhitelistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlEmail.trim() || !wlName.trim()) return;

    if (whitelist.some((w) => w.email.toLowerCase() === wlEmail.toLowerCase())) {
      alert('Email already logged in the whitelist ledger.');
      return;
    }

    onAddWhitelist({
      email: wlEmail.trim().toLowerCase(),
      name: wlName.trim(),
      role: wlRole,
    });

    setWlEmail('');
    setWlName('');
    alert(`Whitelisted secure login approved for: ${wlName}`);
  };

  const handleAddDutySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dutyEmail) return;

    const staffMember = whitelist.find((w) => w.email === dutyEmail);
    if (!staffMember) return;

    const newDuty: DutyAllocation = {
      id: `DUTY-${Math.floor(Math.random() * 100000)}`,
      staffEmail: dutyEmail,
      staffName: staffMember.name,
      role: staffMember.role,
      shift: dutyShift,
      department: dutyDept,
      date: dutyDate,
    };

    onAddDuty(newDuty);
    alert(`Shift assigned safely to ${staffMember.name}.`);
  };

  return (
    <div id="admin-module" className="space-y-6">
      {/* Central Admin Navigation */}
      <div className="bg-white border border-stone-200 rounded-xl p-1 flex gap-1 flex-wrap shrink-0">
        <button
          id="btn-admin-finances"
          onClick={() => setActiveAdminSub('finances')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'finances' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Finance & Performance Reports
        </button>
        <button
          id="btn-admin-rosters"
          onClick={() => setActiveAdminSub('rosters')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'rosters' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Shift Duty Allocator
        </button>
        <button
          id="btn-admin-leaves"
          onClick={() => setActiveAdminSub('leaves')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'leaves' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Leaves Process Center ({leaves.filter((l) => l.status === 'Pending').length})
        </button>
        <button
          id="btn-admin-whitelist"
          onClick={() => setActiveAdminSub('whitelist')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'whitelist' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Secure Email Whitelist
        </button>
        <button
          id="btn-admin-sheets"
          onClick={() => setActiveAdminSub('sheets')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeAdminSub === 'sheets' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Google Sheets Sync
        </button>
      </div>

      {/* A. CFO FINANCIAL CONTROL & SATELLITE OPERATIONS DESK */}
      {activeAdminSub === 'finances' && (() => {
        // Compute expenses statistics
        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const electricityExpenses = expenses.filter(e => e.category === 'Electricity').reduce((sum, e) => sum + e.amount, 0);
        const waterExpenses = expenses.filter(e => e.category === 'Water').reduce((sum, e) => sum + e.amount, 0);
        const securityExpenses = expenses.filter(e => e.category === 'Security').reduce((sum, e) => sum + e.amount, 0);
        const otherExpenses = expenses.filter(e => !['Electricity', 'Water', 'Security'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0);

        const netBalance = totalCombinedRevenue - totalExpenses;
        const profitMargin = totalCombinedRevenue > 0 ? (netBalance / totalCombinedRevenue) * 100 : 0;

        // Daily trend data aggregation for June 1st to June 8th
        const trendDates = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07', '2026-06-08'];
        const dailyMetrics = trendDates.map(date => {
          // Patient consulting registration revenue (300 Ksh deposit)
          const patTodayCount = patients.filter(p => p.registeredAt && p.registeredAt.startsWith(date)).length;
          const patRev = patTodayCount * 300;

          // Lab tests today revenue
          const labTodayRev = labTests.filter(t => t.testDate === date).reduce((sum, t) => sum + (t.fee || 0), 0);

          // Pharmacy dispenses today revenue
          const pharTodayRev = dispenses.filter(d => d.dispenseDate === date).reduce((sum, d) => sum + (d.totalCost || 0), 0);

          const revenue = patRev + labTodayRev + pharTodayRev;
          const expense = expenses.filter(e => e.date === date).reduce((sum, e) => sum + (e.amount || 0), 0);
          const profit = revenue - expense;

          return { date, revenue, expense, profit };
        });

        // Compute SVG graph points
        // Width: 500, Height: 150 bounds
        const maxVal = Math.max(...dailyMetrics.map(m => Math.max(m.revenue, m.expense, Math.abs(m.profit))), 10000);
        const getX = (index: number) => 40 + (index * 420) / (trendDates.length - 1);
        const getY = (val: number) => 130 - (val / maxVal) * 110; // Reserve padding top and bottom

        const revenuePoints = dailyMetrics.map((m, i) => `${getX(i)},${getY(m.revenue)}`).join(' ');
        const expensePoints = dailyMetrics.map((m, i) => `${getX(i)},${getY(m.expense)}`).join(' ');
        const profitPoints = dailyMetrics.map((m, i) => `${getX(i)},${getY(m.profit)}`).join(' ');

        const handleAddExpenseSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const amountNum = parseFloat(expenseAmount);
          if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid expense amount (> 0).');
            return;
          }

          const finalCategory = expenseCategory === 'Other' ? (expenseCustomCategory.trim() || 'Other') : expenseCategory;

          const newExpense: Expense = {
            id: `EXP-${Math.floor(Math.random() * 100000)}`,
            category: finalCategory,
            amount: amountNum,
            date: expenseDate,
            description: expenseDescription.trim() || `Branch ${finalCategory} Expense disbursement`,
            recordedBy: currentUserEmail || 'admin@tumutumu.org',
            recordedAt: new Date().toISOString()
          };

          onAddExpense(newExpense);
          setShowExpenseModal(false);
          setExpenseAmount('');
          setExpenseDescription('');
          setExpenseCustomCategory('');
        };

        return (
          <div id="admin-finances-submodule" className="space-y-6">
            {/* System Cleanse & Live Production Transition Panel */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-amber-700 font-bold" />
                  Transition Hospital System to Live Production Mode
                </h3>
                <p className="text-amber-800 text-xs max-w-2xl leading-relaxed">
                  This action permanently removes all default test patients, fabricated clinical visits/notes, testing lab results, mock appointments, financial mock expenses, and local messages. 
                  <strong className="text-amber-950 block mt-1"> The whitelisted staff accounts and your actual pharmacy stock list (with its complete medications catalogue) will be safely preserved.</strong>
                </p>
              </div>
              <button
                id="btn-admin-clear-data-go-live"
                onClick={() => {
                  if (confirm("CRITICAL WARNING: Are you sure you want to delete all test patients and transaction ledger data? Whitelisted logins and the pharmacy stock will be preserved. This action is irreversible.")) {
                    onClearTestDataToGoLive?.();
                  }
                }}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-98"
              >
                Clear Test Data & Go Live
              </button>
            </div>

            {/* Top Tier Financial Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] text-emerald-600 font-bold font-mono block uppercase">Gross Invoiced Revenue</span>
                <span className="text-2xl font-black text-emerald-950">Ksh {totalCombinedRevenue.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Clinical + Lab + Drugs Receipts</span>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] text-rose-600 font-bold font-mono block uppercase">Total Branch Expenses</span>
                <span className="text-2xl font-black text-rose-950">Ksh {totalExpenses.toLocaleString()}</span>
                <span className="text-[10px] text-rose-700 block mt-0.5">Recurrent + Other Outflows</span>
              </div>

              <div className={`p-4 rounded-xl border shadow-xs ${netBalance >= 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'}`}>
                <span className="text-[10px] text-amber-700 font-bold font-mono block uppercase">Net Cash Balance</span>
                <span className="text-2xl font-black text-amber-950">Ksh {netBalance.toLocaleString()}</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Retained Treasury Earnings</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl shadow-xs">
                <span className="text-[10px] text-stone-400 font-mono block uppercase">Branch Net Performance</span>
                <span className="text-2xl font-black text-stone-800">{profitMargin.toFixed(1)}%</span>
                <span className="text-[10px] text-stone-500 block mt-0.5">Operational Profit Margin</span>
              </div>
            </div>

            {/* Departmental Revenue Breakdown Panel */}
            <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-xs">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Treasury Revenue Streams Breakdown (Including Non-Pharmaceuticals)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Channel 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Clinical Intake Consults</span>
                    <span>Ksh {patientRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (patientRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((patientRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>

                {/* Channel 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Laboratory Diagnostics</span>
                    <span>Ksh {labRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (labRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((labRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>

                {/* Channel 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Pharmaceutical Prescriptions</span>
                    <span>Ksh {pharmaRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (pharmaRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((pharmaRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>

                {/* Channel 4 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-stone-700">
                    <span>Non-Pharmaceutical Supplies</span>
                    <span>Ksh {nonPharmaRevenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-350" 
                      style={{ width: `${totalCombinedRevenue > 0 ? (nonPharmaRevenue / totalCombinedRevenue) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    {totalCombinedRevenue > 0 ? ((nonPharmaRevenue / totalCombinedRevenue) * 100).toFixed(1) : '0.0'}% of Treasury inflows
                  </span>
                </div>
              </div>
            </div>

            {/* Dashboard Graphs & Pie Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart & Cashflow Breakdown Component */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 lg:col-span-1 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  Branch Outflows Ledger Spends
                </h3>

                {totalExpenses === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl bg-stone-50/60 p-4 text-center">
                    <span className="text-stone-400 text-xs">No active expenses recorded on ledger.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Ring Chart Simulation using Circular SVGs */}
                    <div className="flex justify-center py-2">
                      <svg width="120" height="120" viewBox="0 0 100 100" className="transform -rotate-90">
                        {/* Base Circle */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f5f5f4" strokeWidth="12" />
                        {(() => {
                          const r = 40;
                          const c = 2 * Math.PI * r; // 251.3
                          let currentOffset = 0;

                          const spendCategories = [
                            { name: 'Electricity', amount: electricityExpenses, color: '#f59e0b' },
                            { name: 'Water', amount: waterExpenses, color: '#0ea5e9' },
                            { name: 'Security', amount: securityExpenses, color: '#6366f1' },
                            { name: 'Other', amount: otherExpenses, color: '#10b981' }
                          ].filter(cat => cat.amount > 0);

                          return spendCategories.map((cat, i) => {
                            const pct = cat.amount / totalExpenses;
                            const dashArray = `${pct * c} ${c}`;
                            const strokeOffset = -currentOffset;
                            currentOffset += pct * c;

                            return (
                              <circle
                                key={cat.name}
                                cx="50"
                                cy="50"
                                r={r}
                                fill="none"
                                stroke={cat.color}
                                strokeWidth="12"
                                strokeDasharray={dashArray}
                                strokeDashoffset={strokeOffset}
                                className="transition-all duration-300"
                              />
                            );
                          });
                        })()}
                      </svg>
                    </div>

                    {/* Spend Category Progress Meters */}
                    <div className="space-y-2.5 text-xs text-stone-600">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                            🔌 Electricity Power Tokens
                          </span>
                          <span className="font-bold text-stone-900">Ksh {electricityExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${(electricityExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shrink-0" />
                            💧 Water & Utility Mains
                          </span>
                          <span className="font-bold text-stone-900">Ksh {waterExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full" style={{ width: `${(waterExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shrink-0" />
                            🛡️ Guard Patrol & Security
                          </span>
                          <span className="font-bold text-stone-900">Ksh {securityExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${(securityExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                            📦 Other Unscheduled Outflows
                          </span>
                          <span className="font-bold text-stone-900">Ksh {otherExpenses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(otherExpenses / (totalExpenses || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced SVG Daily Growth trend chart */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 lg:col-span-2 space-y-4 shadow-xs">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Karatina HQ Revenue/Expense Balance Growth Trend
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Expenses</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Profit Curve</span>
                  </div>
                </div>

                {/* SVG Visual Graph rendering */}
                <div className="relative border border-stone-100 rounded-xl bg-stone-50/50 p-2">
                  <svg viewBox="0 0 500 150" className="w-full h-auto overflow-visible">
                    {/* Horizontal Guidelines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f3f5" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="40" y1="75" x2="480" y2="75" stroke="#f1f3f5" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="40" y1="130" x2="480" y2="130" stroke="#e5e5e0" strokeWidth="1" />

                    {/* Grid labels */}
                    <text x="10" y="24" className="fill-stone-400 font-mono" style={{ fontSize: '7px' }}>{Math.floor(maxVal).toLocaleString()}</text>
                    <text x="10" y="79" className="fill-stone-400 font-mono" style={{ fontSize: '7px' }}>{Math.floor(maxVal/2).toLocaleString()}</text>
                    <text x="15" y="133" className="fill-stone-400 font-mono" style={{ fontSize: '7px' }}>0</text>

                    {/* Revenue Line */}
                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={revenuePoints} />
                    {dailyMetrics.map((m, i) => (
                      <circle key={`rev-dot-${i}`} cx={getX(i)} cy={getY(m.revenue)} r="3" fill="#10b981" />
                    ))}

                    {/* Expense Line */}
                    <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={expensePoints} />
                    {dailyMetrics.map((m, i) => (
                      <circle key={`exp-dot-${i}`} cx={getX(i)} cy={getY(m.expense)} r="3" fill="#f43f5e" />
                    ))}

                    {/* Net Profit Line */}
                    <polyline fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3,1" strokeLinecap="round" strokeLinejoin="round" points={profitPoints} />
                    {dailyMetrics.map((m, i) => (
                      <circle key={`prof-dot-${i}`} cx={getX(i)} cy={getY(m.profit)} r="3" fill="#4f46e5" />
                    ))}

                    {/* X-Axis Date Strings */}
                    {dailyMetrics.map((m, i) => (
                      <text
                        key={`x-label-${i}`}
                        x={getX(i)}
                        y="145"
                        textAnchor="middle"
                        className="fill-stone-400 font-mono font-medium"
                        style={{ fontSize: '6px' }}
                      >
                        {m.date.substring(5)}
                      </text>
                    ))}
                  </svg>
                </div>

                {/* Growth Analysis Summary list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">Average Daily Sales</span>
                    <span className="font-bold text-stone-800">
                      Ksh {Math.floor((totalCombinedRevenue || 1) / trendDates.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">Max Growth Node</span>
                    <span className="font-bold text-emerald-700">
                      Ksh {Math.max(...dailyMetrics.map(m => m.profit)).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">Expense Index Variance</span>
                    <span className="font-bold text-rose-600">
                      Ksh {Math.floor((totalExpenses || 1) / trendDates.length).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="text-[9px] text-stone-400 uppercase font-mono block">EBITDA Indicator</span>
                    <span className="font-bold text-indigo-700">Excellent (Stable)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Ledger Registry Control Desk */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Satellite Branch Operations Outlay Audit Ledger</h3>
                  <p className="text-stone-500 text-xs">
                    Authorize branch operational costs, utility payments, electricity recharges, security service allocations, and view historical transaction receipts.
                  </p>
                </div>
                <button
                  id="btn-admin-record-expense"
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Record Expense
                </button>
              </div>

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 uppercase font-mono tracking-wider text-[10px]">
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Disbursement Date</th>
                      <th className="py-2.5">Transaction Remarks / Description</th>
                      <th className="py-2.5">Recorded By</th>
                      <th className="py-2.5 text-right">Amount (Ksh)</th>
                      <th className="py-2.5 text-right">Revoke / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {expenses.map((exp) => (
                      <tr id={`expense-row-${exp.id}`} key={exp.id} className="hover:bg-stone-50/50">
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            exp.category === 'Electricity'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : exp.category === 'Water'
                              ? 'bg-sky-50 text-sky-700 border-sky-100'
                              : exp.category === 'Security'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono">{exp.date}</td>
                        <td className="py-3.5 max-w-[320px] truncate" title={exp.description}>{exp.description}</td>
                        <td className="py-3.5 text-stone-500 font-mono text-[10px]">{exp.recordedBy}</td>
                        <td className="py-3.5 text-right font-bold text-stone-800">Ksh {exp.amount.toLocaleString()}</td>
                        <td className="py-3.5 text-right">
                          <button
                            id={`btn-remove-expense-${exp.id}`}
                            onClick={() => {
                              if (confirm(`Do you wish to delete and purge this KSh ${exp.amount.toLocaleString()} expense row?`)) {
                                onRemoveExpense(exp.id);
                                alert('Expense record permanently purged.');
                              }
                            }}
                            className="text-rose-600 hover:text-rose-900 font-mono text-[10px] font-bold transition-colors inline-flex items-center gap-0.5"
                          >
                            <Trash className="w-3 h-3" /> Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400 bg-stone-50/30 rounded-lg">
                          No registered expenses on ledger sheet data. Click "Record Expense" to authorize operational outflows.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>



            {/* Floating Expenses Record Ledger Modal overlay dialog */}
            {showExpenseModal && (
              <div id="expense-modal" className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <div className="bg-white border border-stone-200 shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in fade-in duration-250">
                  <div className="bg-amber-600 text-white px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-5 h-5" />
                      <h3 className="font-bold text-sm">Record Branch Ledger Outflow</h3>
                    </div>
                    <button
                      id="btn-close-expense-modal"
                      onClick={() => setShowExpenseModal(false)}
                      className="hover:bg-amber-700 p-1 rounded-md transition-all text-white/80 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddExpenseSubmit} className="p-5 space-y-4 text-xs leading-relaxed">
                    <div>
                      <label id="lbl-exp-category" className="block text-stone-600 font-bold mb-1">Expense Stream Category</label>
                      <select
                        id="select-exp-category"
                        required
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500 font-medium"
                      >
                        <option value="Electricity">Electricity power token recharge</option>
                        <option value="Water">Water & San utilities payment</option>
                        <option value="Security">Guards & security patrols</option>
                        <option value="Other">Other Operational expenses</option>
                      </select>
                    </div>

                    {expenseCategory === 'Other' && (
                      <div>
                        <label id="lbl-exp-custom" className="block text-stone-600 font-bold mb-1">Specify Custom spend Category</label>
                        <input
                          id="inp-exp-custom"
                          type="text"
                          required
                          placeholder="e.g. Pharmaceutical storage fridge repairs"
                          value={expenseCustomCategory}
                          onChange={(e) => setExpenseCustomCategory(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    <div>
                      <label id="lbl-exp-amount" className="block text-stone-600 font-bold mb-1">Actual Spends Cost (Ksh)</label>
                      <input
                        id="inp-exp-amount"
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 15000"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500 font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label id="lbl-exp-date" className="block text-stone-600 font-bold mb-1">Payment / Disbursement Date</label>
                      <input
                        id="inp-exp-date"
                        type="date"
                        required
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 font-mono"
                      />
                    </div>

                    <div>
                      <label id="lbl-exp-notes" className="block text-stone-600 font-bold mb-1">Service description & details</label>
                      <textarea
                        id="inp-exp-notes"
                        required
                        rows={3}
                        placeholder="e.g. KPLC token for branch emergency diagnostic main building backup grid"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                      <button
                        id="btn-cancel-expense"
                        type="button"
                        onClick={() => setShowExpenseModal(false)}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold px-4 py-2 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        id="btn-submit-expense"
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
                      >
                        Authorize Spend
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* B. STAFF SHIFT DUTY ALLOCATOR SCREEN */}
      {activeAdminSub === 'rosters' && (
        <div id="admin-rosters-submodule" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed h-fit">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <CalendarPlus className="w-4.5 h-4.5 text-emerald-600" />
              Commit Shift Duty Roster
            </h3>

            <form onSubmit={handleAddDutySubmit} className="space-y-4 text-xs">
              <div>
                <label id="lbl-duty-staff" className="block font-medium text-stone-500 mb-1">Select Whitelisted Staff</label>
                <select
                  id="select-duty-staff"
                  required
                  value={dutyEmail}
                  onChange={(e) => setDutyEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Member --</option>
                  {whitelist.map((w) => (
                    <option key={w.email} value={w.email}>
                      🧑‍⚕️ {w.name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label id="lbl-duty-shift" className="block font-medium text-stone-500 mb-1">Shift Type</label>
                <select
                  id="select-duty-shift"
                  value={dutyShift}
                  onChange={(e) => setDutyShift(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Day Shift">Day Shift (08:00 - 17:00)</option>
                  <option value="Night Shift">Night Shift (17:00 - 08:00)</option>
                  <option value="On Call">On Call (Specialist Backup)</option>
                </select>
              </div>

              <div>
                <label id="lbl-duty-dept" className="block font-medium text-stone-500 mb-1">Roster Department</label>
                <select
                  id="select-duty-dept"
                  value={dutyDept}
                  onChange={(e) => setDutyDept(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Clinical">Clinical/Consultations</option>
                  <option value="Reception">Reception & Records Desk</option>
                  <option value="Lab">Lab Diagnostic Center</option>
                  <option value="Pharmacy">Pharmacy Dispensary</option>
                  <option value="Admin">Management Office</option>
                </select>
              </div>

              <div>
                <label id="lbl-duty-date" className="block font-medium text-stone-500 mb-1">Duty Date</label>
                <input
                  id="inp-duty-date"
                  type="date"
                  required
                  value={dutyDate}
                  onChange={(e) => setDutyDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2"
                />
              </div>

              <button
                id="btn-add-duty-submit"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all"
              >
                Approve & Register Duty Row
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800">Master Rotating Shift Rota Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2">Staff Member</th>
                    <th className="py-2">Date Allocated</th>
                    <th className="py-2">Shift Program</th>
                    <th className="py-2">Active Dept</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {duties.map((d) => (
                    <tr id={`duty-row-${d.id}`} key={d.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-medium">{d.staffName}</td>
                      <td className="py-2.5 font-mono">{d.date}</td>
                      <td className="py-2.5">{d.shift}</td>
                      <td className="py-2.5">
                        <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {d.department}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <button
                          id={`btn-remove-duty-${d.id}`}
                          onClick={() => {
                            onRemoveDuty(d.id);
                            alert('Shift record deleted successfully.');
                          }}
                          className="text-rose-600 hover:text-rose-900 flex items-center gap-1 font-mono text-[10px]"
                        >
                          <Trash className="w-3 h-3" /> Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* C. LEAVE PROCESS CENTER SCREEN */}
      {activeAdminSub === 'leaves' && (
        <div id="admin-leaves-submodule" className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed space-y-4">
          <h3 className="text-sm font-semibold text-stone-800">Pending & Historical Staff Leave Requests</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-medium">
                  <th className="py-2">Employee Details</th>
                  <th className="py-2">Duration requested</th>
                  <th className="py-2">Asserted Reason</th>
                  <th className="py-2">Request Status</th>
                  <th className="py-2 text-right">Approve/Deny Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {leaves.map((l) => (
                  <tr id={`leave-row-${l.id}`} key={l.id} className="hover:bg-stone-50/50">
                    <td className="py-3">
                      <span className="font-bold block text-stone-800">{l.staffName}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{l.staffEmail}</span>
                    </td>
                    <td className="py-3">
                      <span className="font-semibold">{l.startDate} to {l.endDate}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5 font-mono">Filed: {new Date(l.requestedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3 max-w-[200px] truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                        l.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : l.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            id={`btn-approve-leave-${l.id}`}
                            onClick={() => {
                              onUpdateLeaveStatus(l.id, 'Approved');
                              alert('Leave request Approved successfully.');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium px-2 py-1 rounded"
                          >
                            Approve
                          </button>
                          <button
                            id={`btn-reject-leave-${l.id}`}
                            onClick={() => {
                              onUpdateLeaveStatus(l.id, 'Rejected');
                              alert('Leave request Rejected.');
                            }}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-medium px-2 py-1 rounded"
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">No leave requests registered in system files.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* D. SECURE EMAIL WHITELIST MANAGER SCREEN */}
      {activeAdminSub === 'whitelist' && (
        <div id="admin-whitelist-submodule" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed h-fit">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-emerald-600" />
              Whitelist New Account Email
            </h3>

            <form onSubmit={handleAddWhitelistSubmit} className="space-y-4 text-xs">
              <div>
                <label id="lbl-wl-email" className="block font-medium text-stone-500 mb-1">Staff Google Email Address</label>
                <input
                  id="inp-wl-email"
                  type="email"
                  required
                  placeholder="e.g. nurse@tumutumu.org"
                  value={wlEmail}
                  onChange={(e) => setWlEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label id="lbl-wl-name" className="block font-medium text-stone-500 mb-1">Staff Member Name</label>
                <input
                  id="inp-wl-name"
                  type="text"
                  required
                  placeholder="e.g. Sister Mercy Wambugu"
                  value={wlName}
                  onChange={(e) => setWlName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label id="lbl-wl-role" className="block font-medium text-stone-500 mb-1">Roster Role Category</label>
                <select
                  id="select-wl-role"
                  value={wlRole}
                  onChange={(e) => setWlRole(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Doctor">Doctor (Clinical Officer / consultant)</option>
                  <option value="Reception">Reception & Records coordinator</option>
                  <option value="Lab">Lab Technologist</option>
                  <option value="Pharmacy">Pharmacist / Dispatcher</option>
                  <option value="Admin">Administrator (Roster Coordinator / CFO)</option>
                </select>
              </div>

              <button
                id="btn-add-whitelist-submit"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all"
              >
                Whitelist Account Email
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800">Tumutumu Secure Google Whitelisted Accounts List</h3>
            <p className="text-stone-500 text-xs">
              Personnel holding verified emails listed here can bypass security gates and access their respective role-based patient files, lab diagnostics and stocking rosters.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="py-2">Staff Member Name</th>
                    <th className="py-2">Whitelisted Email</th>
                    <th className="py-2">Roster Role</th>
                    <th className="py-2 text-right">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {whitelist.map((item) => (
                    <tr id={`wl-row-${item.email}`} key={item.email} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-bold text-stone-800">{item.name}</td>
                      <td className="py-2.5 font-mono text-stone-500">{item.email}</td>
                      <td className="py-2.5">
                        <span className="bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-800">
                          {item.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {item.email === 'gmaurice101@gmail.com' ? (
                          <span className="text-[10px] text-stone-400 font-mono italic">Primary Creator</span>
                        ) : (
                          <button
                            id={`btn-remove-wl-${item.email}`}
                            onClick={() => {
                              onRemoveWhitelist(item.email);
                              alert('Whitelisted email revoked.');
                            }}
                            className="text-stone-500 hover:text-rose-600 p-1"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* E. GOOGLE SHEETS CONNECTOR SCREEN */}
      {activeAdminSub === 'sheets' && (
        <GoogleSheetsView
          patients={patients}
          labTests={labTests}
          stock={stock}
          expenses={expenses}
          userEmail={currentUserEmail}
        />
      )}
    </div>
  );
}

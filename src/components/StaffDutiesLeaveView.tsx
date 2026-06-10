/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, User, Clock, PlaneTakeoff, Heart, Save, CheckCircle, Shield } from 'lucide-react';
import { DutyAllocation, LeaveRequest, UserRole } from '../types';

interface StaffDutiesLeaveViewProps {
  duties: DutyAllocation[];
  leaves: LeaveRequest[];
  userEmail: string;
  userName: string;
  userRole: UserRole;
  onRequestLeave: (req: LeaveRequest) => void;
}

export function StaffDutiesLeaveView({
  duties,
  leaves,
  userEmail,
  userName,
  userRole,
  onRequestLeave,
}: StaffDutiesLeaveViewProps) {
  const [startDate, setStartDate] = useState<string>('2026-06-15');
  const [endDate, setEndDate] = useState<string>('2026-06-25');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Filter duties allocated to the active logged-in user
  const myDuties = duties
    .filter((d) => d.staffEmail === userEmail)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter leaves requested by the active logged-in user
  const myLeaves = leaves
    .filter((l) => l.staffEmail === userEmail)
    .sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  const handleRequestLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    const request: LeaveRequest = {
      id: `LEAVE-${Date.now()}`,
      staffEmail: userEmail,
      staffName: userName,
      startDate,
      endDate,
      reason: leaveReason.trim(),
      status: 'Pending',
      requestedAt: new Date().toISOString(),
    };

    onRequestLeave(request);
    setLeaveReason('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    alert('Annual leave application compiled and sent to Tumutumu Admin for approval.');
  };

  return (
    <div id="staff-duties-module" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Shift Duties Calendar Grid */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed lg:col-span-2 space-y-4">
        <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-3">
          <Clock className="w-4.5 h-4.5 text-emerald-600" />
          My Scheduled Shift Rotations & On-Call Duties ({myDuties.length})
        </h3>

        {myDuties.length === 0 ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center text-stone-400">
            <Calendar className="w-10 h-10 text-stone-200 mx-auto mb-2" />
            <p className="text-xs">You have no active shifts allocated under the current rotation. Consult the Chief Administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myDuties.map((duty) => (
              <div
                id={`duty-card-${duty.id}`}
                key={duty.id}
                className="bg-stone-50 border border-stone-200 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden hover:border-emerald-600 transition-all"
              >
                {/* Visual marker */}
                <div className={`w-1.5 h-full absolute left-0 top-0 ${
                  duty.shift === 'On Call' ? 'bg-amber-500' : 'bg-emerald-600'
                }`} />

                <div className="space-y-1 my-1 ml-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">{duty.shift}</span>
                    <span className="bg-stone-200 text-stone-700 text-[9px] px-1.5 py-0.5 rounded font-mono">
                      {duty.department}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 flex items-center gap-1 leading-none mt-1">
                    <Calendar className="w-3 h-3 text-stone-400" /> Date Scheduled: {duty.date}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1 block">
                    Karatina Satellite Roster Row ID: <span className="font-mono text-[10px]">{duty.id}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-stone-600 text-xs flex items-start gap-2.5 leading-normal">
          <Shield className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-900 block mb-0.5">Note on Hospital Rota Compliance</span>
            Duties are allocated on a rolling monthly basis by the Karatina Administrative Council. Please coordinates any physical shift swaps with matching whitelisted practitioners at least 48 hours prior to shift commencement.
          </div>
        </div>
      </div>

      {/* Leave Application & Review Panel */}
      <div className="space-y-6">
        {/* Leave application form */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed">
          <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <PlaneTakeoff className="w-4.5 h-4.5 text-emerald-600" />
            Apply For Personal Leave
          </h3>

          <form onSubmit={handleRequestLeaveSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label id="lbl-start-date" className="block font-medium text-stone-500 mb-1">Start Date</label>
                <input
                  id="inp-start-date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>
              <div>
                <label id="lbl-end-date" className="block font-medium text-stone-500 mb-1">End Date</label>
                <input
                  id="inp-end-date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label id="lbl-leave-reason" className="block font-medium text-stone-500 mb-1">Reason for Leave Request</label>
              <textarea
                id="inp-leave-reason"
                required
                rows={3}
                placeholder="Annual vacation, medical reasons, personal emergencies..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none"
              ></textarea>
            </div>

            {success && (
              <div id="leave-success-alert" className="bg-emerald-50 border border-emerald-100 text-emerald-800 font-medium p-2 rounded flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Submitted compiled dossier.
              </div>
            )}

            <button
              id="btn-submit-leave"
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Transmit Leave Request File
            </button>
          </form>
        </div>

        {/* User's Leaves list */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed max-h-[300px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
            My Requested Leave Applications ({myLeaves.length})
          </h3>

          <div className="space-y-3">
            {myLeaves.map((l) => (
              <div id={`leave-dossier-${l.id}`} key={l.id} className="border border-stone-100 p-3 rounded-lg text-xs space-y-1 relative bg-stone-50/50">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900">
                    {l.startDate} to {l.endDate}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase shrink-0 ${
                    l.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : l.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <p className="text-stone-500 text-[11px] leading-tight mt-1">{l.reason}</p>
                <p className="text-[9px] text-stone-400 font-mono mt-1 pt-1 border-t border-stone-100 text-right">
                  Filed: {new Date(l.requestedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {myLeaves.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-4">No leave applications filed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

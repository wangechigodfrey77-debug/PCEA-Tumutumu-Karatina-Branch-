/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Send, User, ShieldCheck, Megaphone, Bell, Check } from 'lucide-react';
import { Message, WhitelistUser, Patient } from '../types';

interface CommunicationCenterProps {
  messages: Message[];
  whitelist: WhitelistUser[];
  patients: Patient[];
  currentUserEmail: string;
  currentUserName: string;
  currentUserRole: string;
  onSendMessage: (msg: Message) => void;
}

export function CommunicationCenter({
  messages,
  whitelist,
  patients,
  currentUserEmail,
  currentUserName,
  currentUserRole,
  onSendMessage,
}: CommunicationCenterProps) {
  const [recipient, setRecipient] = useState<string>('all-staff');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Filter messages that belong to the user (sent by or addressed to them, or addressed to 'all-staff')
  const myMessages = messages.filter(
    (m) =>
      m.senderEmail === currentUserEmail ||
      m.recipientEmail === currentUserEmail ||
      m.recipientEmail === 'all-staff' ||
      (currentUserRole === 'Admin' && m.recipientEmail.includes('@'))
  ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    const newMessage: Message = {
      id: `MSG-${Date.now()}`,
      senderEmail: currentUserEmail,
      senderName: currentUserName,
      senderRole: currentUserRole,
      recipientEmail: recipient,
      subject: subject.trim(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    onSendMessage(newMessage);
    setSubject('');
    setContent('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div id="communication-center-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: New Message Form */}
      <div className="bg-white p-6 rounded-xl border border-stone-200">
        <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-emerald-600" />
          Secure Clinical Message Form
        </h3>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label id="lbl-recipient" className="block text-xs font-medium text-stone-500 mb-1">To (Recipient)</label>
            <select
              id="select-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
            >
              <optgroup label="General Broadcasts">
                <option value="all-staff">📢 All Tumutumu Staff (Broadcast)</option>
              </optgroup>
              <optgroup label="Whitelisted Staff Accounts">
                {whitelist
                  .filter((w) => w.email !== currentUserEmail)
                  .map((w) => (
                    <option key={w.email} value={w.email}>
                      🧑‍⚕️ {w.name} ({w.role})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Registered Clinic Patients (Doctor-Patient Portal)">
                {patients.map((p) => (
                  <option key={p.id} value={p.phone}>
                    👤 Patient: {p.name} (Cell: {p.phone})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label id="lbl-subject" className="block text-xs font-medium text-stone-500 mb-1">Subject</label>
            <input
              id="txt-subject"
              type="text"
              required
              placeholder="clinical case summary, status alert, etc."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label id="lbl-message-body" className="block text-xs font-medium text-stone-500 mb-1">Message Body</label>
            <textarea
              id="txt-message-body"
              required
              rows={4}
              placeholder="Enter secure clinical message details, prescriptions discussions or duty requests..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden resize-none"
            ></textarea>
          </div>

          {success && (
            <div id="msg-send-success" className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] p-2 rounded-lg flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Message secured, signed, and dispatched successfully.
            </div>
          )}

          <button
            id="btn-send-message"
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch Secure Message
          </button>
        </form>

        <div className="bg-stone-50 border border-stone-100 rounded-lg p-3.5 mt-4 text-[10px] text-stone-400 flex items-start gap-2 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Role-Based Cryptographic Encryption:</strong> This communication terminal is secured client-to-server. Patient diagnostic messages are strictly isolated and visible only to authorized clinicians and coordinators.
          </span>
        </div>
      </div>

      {/* Right 2/3 Column: Inbox & Alerts list */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            Secure Messaging Logs ({myMessages.length})
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            Signed as: {currentUserEmail}
          </span>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {myMessages.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl p-12 text-center text-stone-400">
              <Mail className="w-12 h-12 text-stone-200 mx-auto mb-3" />
              <p className="text-xs">No active secure letters or patient communications found.</p>
            </div>
          ) : (
            myMessages.map((msg) => {
              const isBroadcast = msg.recipientEmail === 'all-staff';
              const isFromMe = msg.senderEmail === currentUserEmail;

              return (
                <div
                  id={`msg-card-${msg.id}`}
                  key={msg.id}
                  className={`border p-4 rounded-xl transition-all bg-white hover:border-stone-300 ${
                    isBroadcast
                      ? 'border-amber-200 shadow-xs'
                      : isFromMe
                      ? 'border-emerald-100 border-l-4 border-l-emerald-600'
                      : 'border-stone-200 border-l-4 border-l-stone-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-stone-900">{msg.subject}</span>
                        {isBroadcast && (
                          <span className="bg-amber-100 text-amber-900 text-[9px] font-semibold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                            <Megaphone className="w-2.5 h-2.5" />
                            BROADCAST
                          </span>
                        )}
                        {!isBroadcast && isFromMe && (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] px-1.5 rounded-sm">
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-500 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-700">{msg.senderName} ({msg.senderRole})</span>
                        <span>•</span>
                        <span>To: {msg.recipientEmail === 'all-staff' ? 'All Satellite Personnel' : msg.recipientEmail}</span>
                      </p>
                    </div>

                    <span className="text-[10px] text-stone-400 font-mono shrink-0">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-2.5 whitespace-pre-line leading-relaxed bg-stone-50/50 p-2.5 rounded border border-stone-100/50">
                    {msg.content}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

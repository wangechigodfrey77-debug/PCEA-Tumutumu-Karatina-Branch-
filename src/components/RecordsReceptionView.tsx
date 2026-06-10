/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Stethoscope, FileText, Calendar, DollarSign, History, ShieldAlert } from 'lucide-react';
import { Patient, MedicalRecord, Appointment, UserRole } from '../types';

interface RecordsReceptionViewProps {
  patients: Patient[];
  appointments: Appointment[];
  userRole: UserRole;
  userEmail: string;
  userName: string;
  onAddPatient: (patient: Patient) => void;
  onAddMedicalRecord: (patientId: string, record: MedicalRecord) => void;
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointmentBilling: (apptId: string, status: 'Paid' | 'Unpaid') => void;
}

export function RecordsReceptionView({
  patients,
  appointments,
  userRole,
  userEmail,
  userName,
  onAddPatient,
  onAddMedicalRecord,
  onAddAppointment,
  onUpdateAppointmentBilling,
}: RecordsReceptionViewProps) {
  // Tabs: Register Patient, Manage Records, Appointments & Billing
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'history' | 'appointments'>('register');

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ehrSearchQuery, setEhrSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [curSelectedPatient, setCurSelectedPatient] = useState<Patient | null>(null);

  // New Patient Form State
  const [newName, setNewName] = useState<string>('');
  const [newAge, setNewAge] = useState<number>(30);
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'General Consultation' | 'Consultant Clinic'>('General Consultation');
  const [newSubCategory, setNewSubCategory] = useState<'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn'>('Surgical');
  const [customRegDate, setCustomRegDate] = useState<string>('2026-06-05');
  const [newOpNumber, setNewOpNumber] = useState<string>('');

  // Auto-generate OP Number when customRegDate changes
  useEffect(() => {
    const yearMonth = customRegDate ? customRegDate.substring(0, 7) : '2026-06';
    const rand = Math.floor(Math.random() * 9000 + 1000);
    setNewOpNumber(`OP-${yearMonth}-${rand}`);
  }, [customRegDate]);

  // New Medical Record Form State (for Doctors / Admins)
  const [symptoms, setSymptoms] = useState<string>('');
  const [diagnoses, setDiagnoses] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<string>('');

  // New Appointment Form State
  const [apptPatientId, setApptPatientId] = useState<string>('');
  const [apptDate, setApptDate] = useState<string>('2026-06-05');
  const [apptTime, setApptTime] = useState<string>('09:00');
  const [apptCategory, setApptCategory] = useState<'General Consultation' | 'Consultant Clinic'>('General Consultation');
  const [apptSub, setApptSub] = useState<'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn'>('Surgical');
  const [apptFee, setApptFee] = useState<number>(300);

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const patientId = `PT-${Math.floor(Math.random() * 9000 + 1000)}`;
    const regDateTime = customRegDate ? `${customRegDate}T12:00:00Z` : new Date().toISOString();
    const newPatient: Patient = {
      id: patientId,
      opNumber: newOpNumber.trim() || `OP-${regDateTime.substring(0, 7)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: newName.trim(),
      age: Number(newAge),
      gender: newGender,
      phone: newPhone.trim(),
      category: newCategory,
      consultantSubCategory: newCategory === 'Consultant Clinic' ? newSubCategory : undefined,
      registeredAt: regDateTime,
      registeredBy: userEmail,
      medicalHistory: [],
    };

    onAddPatient(newPatient);

    // Auto seed an appointment for registered billing
    const apptId = `APT-${Math.floor(Math.random() * 9000 + 1000)}`;
    const newAppt: Appointment = {
      id: apptId,
      patientId,
      patientName: newName.trim(),
      patientPhone: newPhone.trim(),
      date: customRegDate || new Date().toISOString().split('T')[0],
      time: '12:00',
      category: newCategory,
      consultantSubCategory: newCategory === 'Consultant Clinic' ? newSubCategory : undefined,
      doctorEmail: 'doctor@tumutumu.org',
      status: 'Scheduled',
      billingStatus: 'Unpaid',
      billingAmount: newCategory === 'General Consultation' ? 300 : 1500,
    };
    onAddAppointment(newAppt);

    setNewName('');
    setNewAge(30);
    setNewPhone('');
    alert(`Patient ${newPatient.name} standard registration compiled! Assigned Patient ID: ${patientId} & OP-Number: ${newPatient.opNumber}. A triage billing invoice has been generated under Appointments.`);
  };

  const handleAddMedicalHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!curSelectedPatient) return;
    if (!symptoms.trim() || !diagnoses.trim()) return;

    // Strict Role-Based Check
    if (userRole !== 'Doctor' && userRole !== 'Admin') {
      alert('Security Protocol Alert: Record/Reception staff cannot write medical history diagnosis. Only doctors or administrators are whitelisted.');
      return;
    }

    const clinicalRecord: MedicalRecord = {
      id: `MR-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString().split('T')[0],
      symptoms: symptoms.trim(),
      diagnoses: diagnoses.trim(),
      notes: notes.trim(),
      prescriptions: prescriptions.trim(),
      doctorName: userName,
      doctorEmail: userEmail,
    };

    onAddMedicalRecord(curSelectedPatient.id, clinicalRecord);

    // Refresh display
    const updatedParts = patients.find((p) => p.id === curSelectedPatient.id);
    if (updatedParts) {
      setCurSelectedPatient({
        ...updatedParts,
        medicalHistory: [...updatedParts.medicalHistory, clinicalRecord],
      });
    }

    setSymptoms('');
    setDiagnoses('');
    setNotes('');
    setPrescriptions('');
    alert('Medical record added successfully to safe EHR file.');
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptPatientId) return;

    const matchedPat = patients.find((p) => p.id === apptPatientId);
    if (!matchedPat) return;

    const newAppt: Appointment = {
      id: `APT-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientId: apptPatientId,
      patientName: matchedPat.name,
      patientPhone: matchedPat.phone,
      date: apptDate,
      time: apptTime,
      category: apptCategory,
      consultantSubCategory: apptCategory === 'Consultant Clinic' ? apptSub : undefined,
      doctorEmail: 'doctor@tumutumu.org',
      status: 'Scheduled',
      billingStatus: 'Unpaid',
      billingAmount: apptFee,
    };

    onAddAppointment(newAppt);
    alert('Appointment booked successfully!');
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery) || p.phone.includes(searchQuery);
    if (filterCategory === 'all') return matchesSearch;
    if (filterCategory === 'general') return matchesSearch && p.category === 'General Consultation';
    return matchesSearch && p.consultantSubCategory === filterCategory;
  });

  const filteredEhrPatients = patients.filter((p) => {
    const query = ehrSearchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           p.id.toLowerCase().includes(query) || 
           (p.opNumber && p.opNumber.toLowerCase().includes(query)) ||
           p.phone.includes(query);
  });

  return (
    <div id="reception-module" className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-white border border-stone-200 rounded-xl p-1 flex gap-1">
        <button
          id="subtab-register"
          onClick={() => setActiveSubTab('register')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'register' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Intake & Patient Registration
        </button>
        <button
          id="subtab-history"
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'history' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Electronic Health Records (EHR)
        </button>
        <button
          id="subtab-appointments"
          onClick={() => setActiveSubTab('appointments')}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'appointments' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Appointments & Billing Desk
        </button>
      </div>

      {/* 1. INTAKE & REGISTRATION FORM */}
      {activeSubTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed lg:col-span-1">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
              Patient Registration Form
            </h3>

            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div>
                <label id="input-patient-name" className="block text-xs font-medium text-stone-500 mb-1">Full Patient Name</label>
                <input
                  id="reg-patient-name"
                  type="text"
                  required
                  placeholder="e.g. Grace Nyambura"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label id="input-patient-age" className="block text-xs font-medium text-stone-500 mb-1">Age</label>
                  <input
                    id="reg-patient-age"
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label id="input-patient-gender" className="block text-xs font-medium text-stone-500 mb-1">Gender</label>
                  <select
                    id="reg-patient-gender"
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label id="input-patient-phone" className="block text-xs font-medium text-stone-500 mb-1">Mobile Contact Phone</label>
                <input
                  id="reg-patient-phone"
                  type="text"
                  required
                  placeholder="e.g. 0722000000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label id="input-patient-regdate" className="block text-xs font-medium text-stone-500 mb-1">Registration Date (Backdate Support)</label>
                <input
                  id="reg-patient-date"
                  type="date"
                  required
                  value={customRegDate}
                  onChange={(e) => setCustomRegDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label id="input-patient-opnumber" className="block text-xs font-medium text-stone-500 mb-1">Outpatient Clinic Number (OP Number)</label>
                <input
                  id="reg-patient-opnumber"
                  type="text"
                  required
                  placeholder="e.g. OP-2026-06-3841"
                  value={newOpNumber}
                  onChange={(e) => setNewOpNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">Auto-suggested based on selected registration date. Feel free to override.</span>
              </div>

              <div>
                <label id="input-patient-category" className="block text-xs font-medium text-stone-500 mb-1">Consultation Category</label>
                <select
                  id="reg-patient-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="General Consultation">General Consultation (Ksh 300)</option>
                  <option value="Consultant Clinic">Consultant Clinic Focus (Ksh 1500)</option>
                </select>
              </div>

              {newCategory === 'Consultant Clinic' && (
                <div id="sub-clinic-container">
                  <label id="input-patient-subcat" className="block text-xs font-medium text-stone-500 mb-1">Clinic Department Specialist</label>
                  <select
                    id="reg-patient-subcat"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="w-full bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="Surgical">Surgical Clinic</option>
                    <option value="Pediatrics">Pediatrics Clinic</option>
                    <option value="MOPC">MOPC (Medical Outpatient Clinic)</option>
                    <option value="Obs/Gyn">Obs/Gyn Clinic</option>
                  </select>
                </div>
              )}

              <button
                id="btn-register-patient"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded-lg transition-all"
              >
                Intake & Register Patient Record
              </button>
            </form>
          </div>

          {/* Roster of registered patients */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-stone-800">Branch Electronic Registers</h3>
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded px-2 py-1">
                <Search className="w-3.5 h-3.5 text-stone-400" />
                <input
                  id="search-patient-input"
                  type="text"
                  placeholder="ID, name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs outline-none border-none py-0.5 max-w-[150px]"
                />
              </div>
            </div>

            <div className="flex gap-1.5 border-b border-stone-100 pb-3 mb-3 shrink-0 flex-wrap">
              <button
                id="filter-clinic-all"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                All Patients
              </button>
              <button
                id="filter-clinic-general"
                onClick={() => setFilterCategory('general')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                  filterCategory === 'general' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                General Consultation
              </button>
              <option value="Surgical" disabled className="hidden"></option>
              {['Surgical', 'Pediatrics', 'MOPC', 'Obs/Gyn'].map((item) => (
                <button
                  id={`filter-clinic-${item}`}
                  key={item}
                  onClick={() => setFilterCategory(item)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${
                    filterCategory === item ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  Clinic: {item}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-medium">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">OP Number</th>
                    <th className="py-2.5">Patient Name</th>
                    <th className="py-2.5">Age/Sex</th>
                    <th className="py-2.5">Phone Contact</th>
                    <th className="py-2.5">Inpatient Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredPatients.map((p) => (
                    <tr id={`p-row-${p.id}`} key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-mono text-stone-500">{p.id}</td>
                      <td className="py-2.5 font-mono font-semibold text-emerald-700">{p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`}</td>
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5">{p.age} Yrs / {p.gender}</td>
                      <td className="py-2.5">{p.phone}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          p.category === 'General Consultation' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-teal-50 text-teal-700 border border-teal-100'
                        }`}>
                          {p.category} {p.consultantSubCategory ? `(${p.consultantSubCategory})` : ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">No patients recorded in filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ELECTRONIC HEALTH RECORDS (EHR) ACCESS/DETAILS */}
      {activeSubTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Selector List */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed max-h-[500px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4.5 h-4.5 text-emerald-600" />
              Patient Roster (Select Patient)
            </h3>

            {/* Real-time search filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 mb-4 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <input
                id="search-ehr-input"
                type="text"
                placeholder="ID, OPD number, or name..."
                value={ehrSearchQuery}
                onChange={(e) => setEhrSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-hidden w-full text-stone-700"
              />
            </div>

            <div className="space-y-2">
              {filteredEhrPatients.map((p) => (
                <button
                  id={`btn-select-p-${p.id}`}
                  key={p.id}
                  onClick={() => setCurSelectedPatient(p)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all relative ${
                    curSelectedPatient?.id === p.id ? 'border-emerald-600 bg-emerald-50/50' : 'border-stone-200 hover:bg-stone-50 bg-white'
                  }`}
                >
                  <p className="font-bold text-stone-900">{p.name}</p>
                  <div className="flex justify-between items-center text-stone-400 text-[10px] mt-1 pr-6">
                    <span>{p.id} • {p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`} • {p.gender} • {p.age} yrs</span>
                    <span className="font-semibold text-stone-600">{p.consultantSubCategory || 'General'}</span>
                  </div>
                </button>
              ))}
              {filteredEhrPatients.length === 0 && (
                <p className="text-xs text-stone-400 text-center py-6">No matching patients cataloged.</p>
              )}
            </div>
          </div>

          {/* Active Patient EHR Dossier File */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2">
            {!curSelectedPatient ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center py-24">
                <FileText className="w-12 h-12 text-stone-200 mb-3" />
                <p className="text-xs">Select a patient from the left column to securely access, review, or append clinical diagnostic files.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header card with Role based alert notices */}
                <div className="border-b border-stone-100 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-bold text-slate-800">{curSelectedPatient.name} EHR Dossier</h3>
                    <p className="text-[10px] text-stone-500 font-mono mt-1">
                      ID: {curSelectedPatient.id} • OP-Number: {curSelectedPatient.opNumber || `OP-${(curSelectedPatient.registeredAt ? curSelectedPatient.registeredAt.substring(0, 7) : '2026-06')}-${curSelectedPatient.id.split('-')[1]}`} • Registered By: {curSelectedPatient.registeredBy} • Registered: {new Date(curSelectedPatient.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full block ${
                      curSelectedPatient.category === 'General Consultation' ? 'bg-blue-100 text-blue-900' : 'bg-teal-100 text-teal-950'
                    }`}>
                      {curSelectedPatient.category === 'General Consultation' ? 'General OPD' : `Consult: ${curSelectedPatient.consultantSubCategory}`}
                    </span>
                  </div>
                </div>

                {/* Secure Medical History Log */}
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-stone-400" />
                    Secure History Clinical Records ({curSelectedPatient.medicalHistory.length})
                  </h4>

                  {curSelectedPatient.medicalHistory.length === 0 ? (
                    <p className="text-xs text-stone-400 bg-stone-50 p-4 rounded-lg border border-stone-100">No medical consultations or health records logged for this patient yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {curSelectedPatient.medicalHistory.map((rec) => (
                        <div id={`medical-rec-card-${rec.id}`} key={rec.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-b border-stone-100 pb-1.5">
                            <span>Diagnostic Date: {rec.date}</span>
                            <span>Recorded By: {rec.doctorName} ({rec.doctorEmail})</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 leading-normal">
                            <div>
                              <p className="font-semibold text-stone-900">Symptoms</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1">{rec.symptoms}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900">Diagnosis</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1 text-red-800 font-medium">{rec.diagnoses}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-stone-700 leading-normal">
                            <div>
                              <p className="font-semibold text-stone-900">Prescriptions Provided</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1 font-semibold text-emerald-800">{rec.prescriptions || 'Nil presc.'}</p>
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900">Clinical Consultation Notes</p>
                              <p className="bg-white p-1.5 rounded border border-stone-100 mt-1">{rec.notes || 'No extra notes.'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Append Medical History Form (ROLE-BASED: DOCTORS/ADMIN ONLY) */}
                <div className="bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    Append Clinical Consultation Report

                    {userRole !== 'Doctor' && userRole !== 'Admin' && (
                      <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.2 rounded-sm lowercase font-normal">
                        locked for role: {userRole}
                      </span>
                    )}
                  </h4>

                  {userRole !== 'Doctor' && userRole !== 'Admin' ? (
                    <div id="unauthorized-message-history" className="bg-amber-50 border border-amber-200 text-stone-600 rounded-lg p-3 text-xs leading-normal">
                      Security Protocol: Records, Lab, or Pharmacy accounts do not hold clinical consultation privileges. Please consult a whitelisted Medical Officer or Administrator to enter patient diagnoses in Karatina's EMR.
                    </div>
                  ) : (
                    <form onSubmit={handleAddMedicalHistory} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label id="lbl-symptoms" className="block text-[11px] font-medium text-stone-500 mb-1">Presented Symptoms</label>
                          <textarea
                            id="inp-symptoms"
                            required
                            rows={2}
                            placeholder="e.g. fever spikes, dry chest cough"
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          ></textarea>
                        </div>
                        <div>
                          <label id="lbl-diagnosis" className="block text-[11px] font-medium text-stone-500 mb-1">Clinical Diagnosis</label>
                          <textarea
                            id="inp-diagnosis"
                            required
                            rows={2}
                            placeholder="e.g. Lobar Pneumonia"
                            value={diagnoses}
                            onChange={(e) => setDiagnoses(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          ></textarea>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label id="lbl-prescriptions" className="block text-[11px] font-medium text-stone-500 mb-1">Prescriptions & Dispatches</label>
                          <textarea
                            id="inp-prescriptions"
                            required
                            rows={2}
                            placeholder="e.g. Amox 500mg TDS, Panadol 1g TDS"
                            value={prescriptions}
                            onChange={(e) => setPrescriptions(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                          ></textarea>
                        </div>
                        <div>
                          <label id="lbl-notes" className="block text-[11px] font-medium text-stone-500 mb-1">Management & Advice Notes</label>
                          <textarea
                            id="inp-notes"
                            rows={2}
                            placeholder="Check blood sugar, bed rest 3 days"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          ></textarea>
                        </div>
                      </div>

                      <button
                        id="btn-add-medical-rec"
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all"
                      >
                        Append Consult to EHR Record
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. APPOINTMENTS & BILLING SCREEN */}
      {activeSubTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Appointment Booking Desk */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed">
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
              Book Appointment Invoice
            </h3>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label id="lbl-appt-patient" className="block font-medium text-stone-500 mb-1">Select Patient</label>
                <select
                  id="select-appt-patient"
                  required
                  value={apptPatientId}
                  onChange={(e) => setApptPatientId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.name} ({pat.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label id="lbl-appt-date" className="block font-medium text-stone-500 mb-1">Consultation Date</label>
                  <input
                    id="inp-appt-date"
                    type="date"
                    required
                    value={apptDate}
                    onChange={(e) => setApptDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label id="lbl-appt-time" className="block font-medium text-stone-500 mb-1">Consultation Time</label>
                  <input
                    id="inp-appt-time"
                    type="time"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label id="lbl-appt-category" className="block font-medium text-stone-500 mb-1">Category</label>
                  <select
                    id="select-appt-category"
                    value={apptCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setApptCategory(cat);
                      setApptFee(cat === 'General Consultation' ? 300 : 1500);
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="General Consultation">General Consult</option>
                    <option value="Consultant Clinic">Consultant Clinic</option>
                  </select>
                </div>

                <div>
                  <label id="lbl-appt-fee" className="block font-medium text-stone-500 mb-1">Invoice Fee (Ksh)</label>
                  <input
                    id="inp-appt-fee"
                    type="number"
                    required
                    value={apptFee}
                    onChange={(e) => setApptFee(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {apptCategory === 'Consultant Clinic' && (
                <div>
                  <label id="lbl-appt-sub" className="block font-medium text-stone-500 mb-1">Sub Clinic</label>
                  <select
                    id="select-appt-sub"
                    value={apptSub}
                    onChange={(e) => setApptSub(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Surgical">Surgical</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="MOPC">MOPC</option>
                    <option value="Obs/Gyn">Obs/Gyn</option>
                  </select>
                </div>
              )}

              <button
                id="btn-book-appt"
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded-lg transition-all"
              >
                Assemble & Commit Appointment Book
              </button>
            </form>
          </div>

          {/* Appointment list & Invoice billing receipt desk */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-stone-800">Hospital Billing Registers</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-medium">
                    <th className="py-2.5">Date/Time</th>
                    <th className="py-2.5">Patient Details</th>
                    <th className="py-2.5">Clinic Focus</th>
                    <th className="py-2.5">Cost Code</th>
                    <th className="py-2.5">Invoicing Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {appointments.map((appt) => (
                    <tr id={`appt-tr-${appt.id}`} key={appt.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 font-mono">
                        {appt.date} <span className="text-[10px] text-stone-400">@{appt.time}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold block">{appt.patientName}</span>
                        {(() => {
                          const patient = patients.find((p) => p.id === appt.patientId);
                          const op = patient?.opNumber || (patient ? `OP-${(patient.registeredAt ? patient.registeredAt.substring(0, 7) : '2026-06')}-${patient.id.split('-')[1]}` : '');
                          return (
                            <span className="text-[10px] text-stone-400 font-mono block">
                              Patient Ref: {appt.patientId} {op && `• OP-No: ${op}`}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2.5">
                        <span className="bg-stone-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium border border-stone-200">
                          {appt.category} {appt.consultantSubCategory ? `(${appt.consultantSubCategory})` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-neutral-900">
                        Ksh {appt.billingAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        {appt.billingStatus === 'Paid' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100 inline-flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" /> Checked Out (Paid)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 rounded-full border border-rose-100 shrink-0">Unpaid</span>
                            <button
                              id={`btn-collect-pay-${appt.id}`}
                              onClick={() => {
                                onUpdateAppointmentBilling(appt.id, 'Paid');
                                alert('Billing transaction reported safely. Revenue generation logged under Department Reports.');
                              }}
                              className="bg-stone-800 hover:bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded border border-stone-700"
                            >
                              Collect Cash
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">No invoice items compiled under billing registers.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

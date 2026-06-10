/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  Microscope,
  Pill,
  Calendar,
  Mail,
  LogOut,
  LogIn,
  ShieldCheck,
  Lock,
  Building,
  RotateCcw,
  Sparkles,
  Layers,
  Heart,
  Briefcase,
  Layers2
} from 'lucide-react';

import { 
  seedDatabaseIfEmpty, 
  forceResetToPristineSeeds,
  clearAllTestDataToGoLive,
  listenWhitelist, 
  listenPatients, 
  listenLabTests, 
  listenLabCatalog,
  listenDispenses, 
  listenStock, 
  listenDuties, 
  listenLeaves, 
  listenMessages, 
  listenAppointments,
  listenExpenses,
  saveWhitelistUser,
  removeWhitelistUser,
  savePatient,
  saveAppointment,
  saveLabTest,
  saveLabCatalogItem,
  saveMedicationDispense,
  savePharmacyItem,
  saveDutyAllocation,
  removeDutyAllocation,
  saveLeaveRequest,
  saveMessage,
  saveExpense,
  deleteExpense
} from './dbService';
import { auth, googleProvider, setOAuthAccessToken, getOAuthAccessToken } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';
import { WhitelistUser, Patient, LabTest, LabCatalogItem, MedicationDispense, PharmacyItem, DutyAllocation, LeaveRequest, Message, Appointment, MedicalRecord, Expense } from './types';
import { HospitalDB } from './mockData';

// Importing child modular workspaces
import { AdminDashboard } from './components/AdminDashboard';
import { RecordsReceptionView } from './components/RecordsReceptionView';
import { LabView } from './components/LabView';
import { PharmacyView } from './components/PharmacyView';
import { StaffDutiesLeaveView } from './components/StaffDutiesLeaveView';
import { CommunicationCenter } from './components/CommunicationCenter';
import { BoardReportView } from './components/BoardReportView';

export default function App() {
  // Database States
  const [whitelist, setWhitelist] = useState<WhitelistUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [labCatalog, setLabCatalog] = useState<LabCatalogItem[]>([]);
  const [dispenses, setDispenses] = useState<MedicationDispense[]>([]);
  const [stock, setStock] = useState<PharmacyItem[]>([]);
  const [duties, setDuties] = useState<DutyAllocation[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Authenticated states
  const [currentUser, setCurrentUser] = useState<WhitelistUser | null>(null);
  const [inputEmail, setInputEmail] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [sessionEmail, setSessionEmail] = useState<string>('');
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Primary Workspace tab
  const [activeTab, setActiveTab] = useState<string>('records');

  const handleClearAllTestDataToGoLive = async () => {
    if (firebaseUser) {
      try {
        await clearAllTestDataToGoLive();
        // Since listeners are active, system gets updated cleanly!
        alert('Firestore collections successfully cleared! The system is now in live production mode.');
        window.location.reload();
      } catch (err: any) {
        alert(`Failed to transition to production mode: ${err?.message || err}`);
      }
    } else {
      // Offline Simulation Mode
      HospitalDB.clearAllTestDataToGoLive();
      setPatients([]);
      setAppointments([]);
      setLabTests([]);
      setDispenses([]);
      setStock(HospitalDB.getPharmacyStock());
      setDuties([]);
      setLeaves([]);
      setMessages([]);
      setExpenses([]);
      alert('Local storage collections successfully cleared! The system is now in offline live production mode.');
      window.location.reload();
    }
  };

  // 1. Force a clean session sign-out on first tab load/link click to ensure they always see the login page first
  useEffect(() => {
    const initSession = async () => {
      const initiated = sessionStorage.getItem('hosp_session_initiated');
      if (initiated !== 'active') {
        try {
          await signOut(auth);
        } catch (e) {
          console.warn("Initial clean sign-out completed or skipped: ", e);
        }
        setCurrentUser(null);
        setSessionEmail('');
        sessionStorage.setItem('hosp_session_initiated', 'active');
      }
    };
    initSession();
  }, []);

  // 2. Setup core Firebase Auth observer
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        // Only auto-restore user if we are in an already active session
        const initiated = sessionStorage.getItem('hosp_session_initiated');
        if (initiated === 'active') {
          setSessionEmail(user.email);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Setup dynamic storage and listeners based on auth state
  useEffect(() => {
    if (firebaseUser) {
      console.log("Firebase Auth detected. Connecting real-time Firestore listeners...");
      // Initial Firestore setup & seeding if collections are vacant
      seedDatabaseIfEmpty();

      // Setup real-time sync listeners for all collections
      const unsubWhitelist = listenWhitelist(setWhitelist, (err) => console.error("Whitelist sync error: ", err));
      const unsubPatients = listenPatients(setPatients, (err) => console.error("Patients sync error: ", err));
      const unsubLabTests = listenLabTests(setLabTests, (err) => console.error("LabTests sync error: ", err));
      const unsubLabCatalog = listenLabCatalog(setLabCatalog, (err) => console.error("LabCatalog sync error: ", err));
      const unsubDispenses = listenDispenses(setDispenses, (err) => console.error("Dispenses sync error: ", err));
      const unsubStock = listenStock(setStock, (err) => console.error("Stock sync error: ", err));
      const unsubDuties = listenDuties(setDuties, (err) => console.error("Duties sync error: ", err));
      const unsubLeaves = listenLeaves(setLeaves, (err) => console.error("Leaves sync error: ", err));
      const unsubMessages = listenMessages(setMessages, (err) => console.error("Messages sync error: ", err));
      const unsubAppointments = listenAppointments(setAppointments, (err) => console.error("Appointments sync error: ", err));
      const unsubExpenses = listenExpenses(setExpenses, (err) => console.error("Expenses sync error: ", err));

      return () => {
        unsubWhitelist();
        unsubPatients();
        unsubLabTests();
        unsubLabCatalog();
        unsubDispenses();
        unsubStock();
        unsubDuties();
        unsubLeaves();
        unsubMessages();
        unsubAppointments();
        unsubExpenses();
      };
    } else {
      console.log("No Firebase Auth detected. Working in local-only / simulation mode.");
      setWhitelist(HospitalDB.getWhitelist());
      setPatients(HospitalDB.getPatients());
      setLabTests(HospitalDB.getLabTests());
      setLabCatalog(HospitalDB.getLabCatalog());
      setDispenses(HospitalDB.getDispenses());
      setStock(HospitalDB.getPharmacyStock());
      setDuties(HospitalDB.getDutyAllocations());
      setLeaves(HospitalDB.getLeaveRequests());
      setMessages(HospitalDB.getMessages());
      setAppointments(HospitalDB.getAppointments());
      setExpenses(HospitalDB.getExpenses());
    }
  }, [firebaseUser]);

  // Reactive role mapper triggered when session email or whitelist changes
  useEffect(() => {
    if (sessionEmail) {
      handleSignOn(sessionEmail);
    }
  }, [sessionEmail, whitelist]);

  // Login handler carrying secure role resolution
  const handleSignOn = (emailAddress: string) => {
    setLoginError('');
    const normalized = emailAddress.trim().toLowerCase();
    const foundUser = whitelist.find((w) => w.email.toLowerCase() === normalized);

    if (foundUser) {
      setCurrentUser(foundUser);
      setSessionEmail(normalized);
      // Auto routing according to role
      if (foundUser.role === 'Reception') setActiveTab('records');
      else if (foundUser.role === 'Doctor') setActiveTab('records');
      else if (foundUser.role === 'Lab') setActiveTab('lab');
      else if (foundUser.role === 'Pharmacy') setActiveTab('pharmacy');
      else setActiveTab('admin');
    } else {
      // Direct pass for bootstrapped development emails
      if (
        normalized === 'gmaurice101@gmail.com' ||
        normalized === 'admin@tumutumu.org' ||
        normalized === 'wangechigodfrey77@gmail.com'
      ) {
        const adminUser: WhitelistUser = {
          email: normalized,
          name: normalized === 'admin@tumutumu.org' ? 'Dr. Beatrice Wanjiku' : 
                normalized === 'wangechigodfrey77@gmail.com' ? 'Dr. Godfrey W. (Admin)' :
                'Dr. Maurice G. (Admin)',
          role: 'Admin'
        };
        setCurrentUser(adminUser);
        setSessionEmail(normalized);
        setActiveTab('admin');
      } else {
        setLoginError(
          `Access Denied: Google account "${emailAddress}" is not whitelisted by the Hospital Admin.`
        );
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoginError('');
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setOAuthAccessToken(credential.accessToken);
      }
      const email = result.user.email;
      if (email) {
        setSessionEmail(email);
      }
    } catch (err: any) {
      console.error("Google SSO SSO Error:", err);
      setLoginError(`Google Sign-In failed: ${err?.message || String(err)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Auth signout failed", e);
    }
    setCurrentUser(null);
    setSessionEmail('');
    setInputEmail('');
    setLoginError('');
  };

  // Master Mutations persisting in real-time straight to Firestore (when logged in) or LocalStorage (when simulating)
  const handleAddPatient = async (pat: Patient) => {
    try {
      if (firebaseUser) {
        await savePatient(pat);
      } else {
        const updated = [...patients, pat];
        setPatients(updated);
        HospitalDB.savePatients(updated);
      }
    } catch (error) {
      console.error("Add patient failed", error);
      alert("Permission denied or error saving patient. Registration Desk role required.");
    }
  };

  const handleAddMedicalRecord = async (patientId: string, record: MedicalRecord) => {
    try {
      if (firebaseUser) {
        const patient = patients.find((p) => p.id === patientId);
        if (patient) {
          const updatedHistory = [...(patient.medicalHistory || []), record];
          await savePatient({ ...patient, medicalHistory: updatedHistory });
        }
      } else {
        const updated = patients.map((p) => {
          if (p.id === patientId) {
            return { ...p, medicalHistory: [...(p.medicalHistory || []), record] };
          }
          return p;
        });
        setPatients(updated);
        HospitalDB.savePatients(updated);
      }
    } catch (error) {
      console.error("Add medical record failed", error);
      alert("Permission denied. Doctor credentials are required.");
    }
  };

  const handleAddAppointment = async (appt: Appointment) => {
    try {
      if (firebaseUser) {
        await saveAppointment(appt);
      } else {
        const updated = [...appointments, appt];
        setAppointments(updated);
        HospitalDB.saveAppointments(updated);
      }
    } catch (error) {
      console.error("Add appointment failed", error);
      alert("Permission denied. Front desk role authorization is required.");
    }
  };

  const handleUpdateApptBilling = async (apptId: string, status: 'Paid' | 'Unpaid') => {
    try {
      if (firebaseUser) {
        const appt = appointments.find((a) => a.id === apptId);
        if (appt) {
          await saveAppointment({ ...appt, billingStatus: status });
        }
      } else {
        const updated = appointments.map((a) => (a.id === apptId ? { ...a, billingStatus: status } : a));
        setAppointments(updated);
        HospitalDB.saveAppointments(updated);
      }
    } catch (error) {
      console.error("Billing update failed", error);
      alert("Permission denied. Admin or FrontDesk credentials required.");
    }
  };

  const handleAddLabTest = async (test: LabTest) => {
    try {
      if (firebaseUser) {
        await saveLabTest(test);
      } else {
        const updated = [...labTests, test];
        setLabTests(updated);
        HospitalDB.saveLabTests(updated);
      }
    } catch (error) {
      console.error("Lab test save failed", error);
      alert("Permission denied. Laboratory diagnostic technologist credentials required.");
    }
  };

  const handleAddLabCatalogItem = async (item: LabCatalogItem) => {
    try {
      if (firebaseUser) {
        await saveLabCatalogItem(item);
      } else {
        const updated = [...labCatalog, item];
        setLabCatalog(updated);
        HospitalDB.saveLabCatalog(updated);
      }
    } catch (error) {
      console.error("Add lab catalog panel failed", error);
      alert("Permission denied saving test panel. Laboratory technician permissions required.");
    }
  };

  const handleDispenseMedicine = async (disp: MedicationDispense) => {
    try {
      if (firebaseUser) {
        await saveMedicationDispense(disp);
        const item = stock.find((s) => s.name === disp.medicationName);
        if (item) {
          const newQty = Math.max(0, item.stockQuantity - disp.quantity);
          await savePharmacyItem({ ...item, stockQuantity: newQty });
        }
      } else {
        const updatedStock = stock.map((s) => {
          if (s.name === disp.medicationName) {
            return { ...s, stockQuantity: Math.max(0, s.stockQuantity - disp.quantity) };
          }
          return s;
        });
        const updatedDispenses = [...dispenses, disp];
        
        setStock(updatedStock);
        setDispenses(updatedDispenses);
        
        HospitalDB.savePharmacyStock(updatedStock);
        HospitalDB.saveDispenses(updatedDispenses);
      }
    } catch (error) {
      console.error("Dispensation failed", error);
      alert("Permission denied. Pharmacist credentials required.");
    }
  };

  const handleRestockItem = async (itemId: string, qty: number) => {
    try {
      if (firebaseUser) {
        const item = stock.find((s) => s.id === itemId);
        if (item) {
          await savePharmacyItem({ ...item, stockQuantity: item.stockQuantity + qty });
        }
      } else {
        const updated = stock.map((item) => (item.id === itemId ? { ...item, stockQuantity: item.stockQuantity + qty } : item));
        setStock(updated);
        HospitalDB.savePharmacyStock(updated);
      }
    } catch (error) {
      console.error("Restock failed", error);
      alert("Permission denied. Pharmacy store manager clearance required.");
    }
  };

  const handleAddNewStockItem = async (item: PharmacyItem) => {
    try {
      if (firebaseUser) {
        await savePharmacyItem(item);
      } else {
        const updated = [...stock, item];
        setStock(updated);
        HospitalDB.savePharmacyStock(updated);
      }
    } catch (error) {
      console.error("Add inventory item failed", error);
      alert("Permission denied. Pharmacy executive role required.");
    }
  };

  const handleUpdateThreshold = async (itemId: string, threshold: number) => {
    try {
      if (firebaseUser) {
        const item = stock.find((s) => s.id === itemId);
        if (item) {
          await savePharmacyItem({ ...item, minThreshold: threshold });
        }
      } else {
        const updated = stock.map((item) => (item.id === itemId ? { ...item, minThreshold: threshold } : item));
        setStock(updated);
        HospitalDB.savePharmacyStock(updated);
      }
    } catch (error) {
      console.error("Updating threshold failed", error);
      alert("Permission denied. Pharmacy store manager clearance required.");
    }
  };

  const handleAddWhitelist = async (user: WhitelistUser) => {
    try {
      if (firebaseUser) {
        await saveWhitelistUser(user);
      } else {
        const updated = [...whitelist, user];
        setWhitelist(updated);
        HospitalDB.saveWhitelist(updated);
      }
    } catch (error) {
      console.error("Add whitelist failed", error);
      alert("Permission denied. Hospital Superintendent credentials required.");
    }
  };

  const handleRemoveWhitelist = async (email: string) => {
    try {
      if (firebaseUser) {
        await removeWhitelistUser(email);
      } else {
        const updated = whitelist.filter((w) => w.email !== email);
        setWhitelist(updated);
        HospitalDB.saveWhitelist(updated);
      }
    } catch (error) {
      console.error("Remove whitelist failed", error);
      alert("Permission denied. Superintendent authorization required.");
    }
  };

  const handleAddDuty = async (duty: DutyAllocation) => {
    try {
      if (firebaseUser) {
        await saveDutyAllocation(duty);
      } else {
        const updated = [...duties, duty];
        setDuties(updated);
        HospitalDB.saveDutyAllocations(updated);
      }
    } catch (error) {
      console.error("Rota assign failed", error);
      alert("Permission denied. Scheduling access is locked for admins.");
    }
  };

  const handleRemoveDuty = async (dutyId: string) => {
    try {
      if (firebaseUser) {
        await removeDutyAllocation(dutyId);
      } else {
        const updated = duties.filter((d) => d.id !== dutyId);
        setDuties(updated);
        HospitalDB.saveDutyAllocations(updated);
      }
    } catch (error) {
      console.error("Duty delete failed", error);
      alert("Permission denied. Administrative roster management required.");
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      if (firebaseUser) {
        const leave = leaves.find((l) => l.id === leaveId);
        if (leave) {
          await saveLeaveRequest({ ...leave, status });
        }
      } else {
        const updated = leaves.map((l) => (l.id === leaveId ? { ...l, status } : l));
        setLeaves(updated);
        HospitalDB.saveLeaveRequests(updated);
      }
    } catch (error) {
      console.error("Leave approval failed", error);
      alert("Permission denied. Admin or clinical director credentials required.");
    }
  };

  const handleAddExpense = async (expense: Expense) => {
    try {
      if (firebaseUser) {
        await saveExpense(expense);
      } else {
        const updated = [...expenses, expense];
        setExpenses(updated);
        HospitalDB.saveExpenses(updated);
      }
    } catch (error) {
      console.error("Expense save failed", error);
      alert("Permission denied. Admin dashboard credentials required.");
    }
  };

  const handleRemoveExpense = async (expenseId: string) => {
    try {
      if (firebaseUser) {
        await deleteExpense(expenseId);
      } else {
        const updated = expenses.filter((e) => e.id !== expenseId);
        setExpenses(updated);
        HospitalDB.saveExpenses(updated);
      }
    } catch (error) {
      console.error("Expense delete failed", error);
      alert("Permission denied. Admin authorization is required.");
    }
  };

  const handleRequestLeave = async (req: LeaveRequest) => {
    try {
      if (firebaseUser) {
        await saveLeaveRequest(req);
      } else {
        const updated = [...leaves, req];
        setLeaves(updated);
        HospitalDB.saveLeaveRequests(updated);
      }
    } catch (error) {
      console.error("Leave submission failed", error);
      alert("Unable to submit leave request. Verification failed.");
    }
  };

  const handleSendMessage = async (msg: Message) => {
    try {
      if (firebaseUser) {
        await saveMessage(msg);
      } else {
        const updated = [...messages, msg];
        setMessages(updated);
        HospitalDB.saveMessages(updated);
      }
    } catch (error) {
      console.error("Message send failed", error);
      alert("Failed to deliver broadcast message.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-sans flex flex-col">
      {/* 1. TOP HEADER BRAND BAR */}
      <header className="bg-white border-b border-stone-200 py-3.5 px-6 shrink-0 flex items-center justify-between shadow-xs sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-stone-900 uppercase">
              PCEA Tumutumu Hospital Karatina Portal
            </h1>
            <p className="text-[10px] text-emerald-700 tracking-wider uppercase font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping inline-block"></span>
              Karatina Satellite Branch • Digitized Clinical EMR
            </p>
          </div>
        </div>

        {/* LOGGED IN USER PROFILE */}
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-stone-900 block">{currentUser.name}</span>
            </div>
            <button
              id="btn-signout"
              onClick={handleSignOut}
              className="text-stone-500 hover:text-stone-800 border border-stone-200 rounded-lg p-2 hover:bg-stone-50 transition-all"
              title="Log Out Security Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* 2. SECURITY WHITELIST GATE (IF LOGGED OUT) */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-100">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-stone-900">Secure Medical Sign-In Gate</h2>
              <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
                PCEA Tumutumu EMR incorporates Google Account Whitelist gates to protect confidential clinical files.
              </p>
            </div>

            {/* Custom Whitelist security logs */}
            {loginError && (
              <div id="login-blacklist-warning" className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg leading-normal">
                {loginError}
              </div>
            )}

            {/* Primary Google Auth Pop-up Button */}
            <button
              id="google-sso-popup-btn"
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full bg-stone-900 text-white hover:bg-stone-800 border border-stone-700 py-3 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold cursor-pointer shadow-xs transition-transform transform active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ea4335"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#4285f4"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
               </svg>
               Sign In with Google Account
            </button>

            <div className="relative flex py-1.5 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-4 text-stone-400 text-[9px] uppercase font-bold tracking-wider">or direct sign-in</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputEmail.trim()) {
                  setSessionEmail(inputEmail.trim());
                } else {
                  setLoginError('Please enter a valid whitelisted email address.');
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">Whitelisted Staff Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@tumutumu.org"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Access Secure Portal
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 3. VERIFIED MASTER WORKSPACE */
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-stone-100">
          {/* Core Sidebar/Drawer Navigation (Role-Based available options) */}
          <aside className="w-full md:w-64 bg-slate-900 text-stone-300 flex flex-col shrink-0 border-r border-slate-800 pt-6">
            <nav className="flex-1 p-4 space-y-1 text-xs font-medium">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider px-3 block mb-2">
                Hospital Workspaces
              </span>

              {/* Records & Registration Workspace */}
              {(currentUser.role === 'Reception' || currentUser.role === 'Doctor' || currentUser.role === 'Admin') && (
                <button
                  id="tab-records"
                  onClick={() => setActiveTab('records')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                    activeTab === 'records' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Patients & Records Desk
                  </span>
                </button>
              )}

              {/* Lab Workspace */}
              {(currentUser.role === 'Lab' || currentUser.role === 'Admin') && (
                <button
                  id="tab-lab"
                  onClick={() => setActiveTab('lab')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                    activeTab === 'lab' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Microscope className="w-4 h-4" /> Diagnostics Laboratory
                  </span>
                </button>
              )}

              {/* Pharmacy Workspace */}
              {(currentUser.role === 'Pharmacy' || currentUser.role === 'Admin') && (
                <button
                  id="tab-pharmacy"
                  onClick={() => setActiveTab('pharmacy')}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                    activeTab === 'pharmacy' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Pill className="w-4 h-4" /> Pharmacy & Dispatches
                  </span>
                </button>
              )}

              {/* Staff shifts & Duty details */}
              <button
                id="tab-staff"
                onClick={() => setActiveTab('staff')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                  activeTab === 'staff' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Duty Rotas & Leaves
                </span>
              </button>

              {/* Secure Chat & notice board */}
              <button
                id="tab-chat"
                onClick={() => setActiveTab('chat')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                  activeTab === 'chat' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Safe Communication
                </span>
              </button>

              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider px-3 block pt-4 pb-2">
                Executive Desk
              </span>

              {/* Admin Panel */}
              {currentUser.role === 'Admin' ? (
                <>
                  <button
                    id="tab-admin"
                    onClick={() => setActiveTab('admin')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                      activeTab === 'admin' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Administrator Dashboard
                    </span>
                  </button>

                  <button
                    id="tab-reports"
                    onClick={() => setActiveTab('reports')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                      activeTab === 'reports' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> AI Board Quality Reports
                    </span>
                  </button>
                </>
              ) : (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-500 italic leading-snug">
                  📌 Admin executive menus are locked securely for your account email level. Consult Superintendent if you require role upgrades.
                </div>
              )}
            </nav>

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex flex-col gap-2 font-mono">
              <span>Cloud Server Status: Online</span>
              <span>Local: Nyeri County, KE</span>
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto pt-[115px] md:pt-[110px]">
            {/* Navigational Routing Panels */}
            {activeTab === 'records' && (currentUser.role === 'Reception' || currentUser.role === 'Doctor' || currentUser.role === 'Admin') && (
              <RecordsReceptionView
                patients={patients}
                appointments={appointments}
                userRole={currentUser.role === 'Admin' ? 'Doctor' : currentUser.role}
                userEmail={currentUser.email}
                userName={currentUser.name}
                onAddPatient={handleAddPatient}
                onAddMedicalRecord={handleAddMedicalRecord}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointmentBilling={handleUpdateApptBilling}
              />
            )}

            {activeTab === 'lab' && (currentUser.role === 'Lab' || currentUser.role === 'Admin') && (
              <LabView
                labTests={labTests}
                patients={patients}
                labCatalog={labCatalog}
                userEmail={currentUser.email}
                userName={currentUser.name}
                onAddLabTest={handleAddLabTest}
                onAddLabCatalogItem={handleAddLabCatalogItem}
              />
            )}

            {activeTab === 'pharmacy' && (currentUser.role === 'Pharmacy' || currentUser.role === 'Admin') && (
              <PharmacyView
                stock={stock}
                dispenses={dispenses}
                patients={patients}
                userEmail={currentUser.email}
                userName={currentUser.name}
                onDispenseMedication={handleDispenseMedicine}
                onRestockItem={handleRestockItem}
                onAddNewStockItem={handleAddNewStockItem}
                onUpdateThreshold={handleUpdateThreshold}
              />
            )}

            {activeTab === 'staff' && (
              <StaffDutiesLeaveView
                duties={duties}
                leaves={leaves}
                userEmail={currentUser.email}
                userName={currentUser.name}
                userRole={currentUser.role}
                onRequestLeave={handleRequestLeave}
              />
            )}

            {activeTab === 'chat' && (
              <CommunicationCenter
                messages={messages}
                whitelist={whitelist}
                patients={patients}
                currentUserEmail={currentUser.email}
                currentUserName={currentUser.name}
                currentUserRole={currentUser.role}
                onSendMessage={handleSendMessage}
              />
            )}

            {activeTab === 'admin' && currentUser.role === 'Admin' && (
              <AdminDashboard
                patients={patients}
                labTests={labTests}
                dispenses={dispenses}
                stock={stock}
                duties={duties}
                leaves={leaves}
                whitelist={whitelist}
                expenses={expenses}
                onAddWhitelist={handleAddWhitelist}
                onRemoveWhitelist={handleRemoveWhitelist}
                onAddDuty={handleAddDuty}
                onRemoveDuty={handleRemoveDuty}
                onUpdateLeaveStatus={handleUpdateLeaveStatus}
                onAddExpense={handleAddExpense}
                onRemoveExpense={handleRemoveExpense}
                currentUserEmail={currentUser.email}
                onClearTestDataToGoLive={handleClearAllTestDataToGoLive}
              />
            )}

            {activeTab === 'reports' && currentUser.role === 'Admin' && (
              <BoardReportView
                patients={patients}
                labTests={labTests}
                dispenses={dispenses}
                duties={duties}
                leaves={leaves}
                appointments={appointments}
                expenses={expenses}
                stock={stock}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

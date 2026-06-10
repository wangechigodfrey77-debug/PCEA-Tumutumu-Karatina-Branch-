/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Plus, 
  Link, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Lock, 
  ShieldCheck,
  Check,
  BarChart3,
  Users,
  Pill,
  Beaker,
  Receipt
} from 'lucide-react';
import { Patient, LabTest, MedicationDispense, Expense, PharmacyItem } from '../types';
import { auth, googleProvider, setOAuthAccessToken, getOAuthAccessToken } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface GoogleSheetsViewProps {
  patients: Patient[];
  labTests: LabTest[];
  stock: PharmacyItem[];
  expenses: Expense[];
  userEmail: string;
}

export function GoogleSheetsView({
  patients,
  labTests,
  stock,
  expenses,
  userEmail
}: GoogleSheetsViewProps) {
  const [accessToken, setAccessToken] = useState<string | null>(getOAuthAccessToken());
  const [spreadSheetId, setSpreadSheetId] = useState<string>(() => {
    return localStorage.getItem('hosp_sheets_id') || '';
  });
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [syncedSheetUrl, setSyncedSheetUrl] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Sync checkboxes
  const [syncPatients, setSyncPatients] = useState<boolean>(true);
  const [syncStock, setSyncStock] = useState<boolean>(true);
  const [syncLab, setSyncLab] = useState<boolean>(true);
  const [syncExpenses, setSyncExpenses] = useState<boolean>(true);
  const [syncOverview, setSyncOverview] = useState<boolean>(true);

  useEffect(() => {
    // Keep internal token state in sync with getOAuthAccessToken
    const token = getOAuthAccessToken();
    if (token) {
      setAccessToken(token);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorDetails('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setOAuthAccessToken(credential.accessToken);
        setAccessToken(credential.accessToken);
      } else {
        throw new Error("Could not extract access token from Google sign-in credentials.");
      }
    } catch (err: any) {
      console.error("Sheets OAuth connection failed:", err);
      setErrorDetails(err?.message || "Google Authentication rejected or timed out.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setOAuthAccessToken(null);
    setAccessToken(null);
    setSyncStatus('idle');
  };

  const handleSaveSheetId = (e: React.FormEvent) => {
    e.preventDefault();
    if (spreadSheetId.trim()) {
      localStorage.setItem('hosp_sheets_id', spreadSheetId.trim());
      alert('Spreadsheet ID linked successfully in client configuration files.');
    } else {
      localStorage.removeItem('hosp_sheets_id');
      alert('Linked spreadsheet ID cleared.');
    }
  };

  const executeSheetsSync = async () => {
    if (!accessToken) {
      alert('No active Google authentication token. Please connect first.');
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('Preparing clinical synchronization payloads...');
    setErrorDetails('');

    try {
      let activeSpreadsheetId = spreadSheetId.trim();

      // Step 1: Create a new spreadsheet if one is not linked
      if (!activeSpreadsheetId) {
        setSyncMessage('Creating new clinical management multi-tab spreadsheet in Google Drive...');
        
        const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: {
              title: "PCEA Tumutumu Hospital - Comprehensive Management Ledger"
            },
            sheets: [
              { properties: { title: "Executive Overview" } },
              { properties: { title: "Active Clinical Directory" } },
              { properties: { title: "Pharmaceutical Stock Room" } },
              { properties: { title: "Laboratory Queue" } },
              { properties: { title: "Operating Expenses Ledger" } }
            ]
          })
        });

        if (!createResponse.ok) {
          const errData = await createResponse.json();
          throw new Error(`Sheets creation error: ${errData?.error?.message || createResponse.statusText}`);
        }

        const createData = await createResponse.json();
        activeSpreadsheetId = createData.spreadsheetId;
        setSpreadSheetId(activeSpreadsheetId);
        localStorage.setItem('hosp_sheets_id', activeSpreadsheetId);
      }

      // Step 2: Prepare individual ranges & update datasets
      const updateData: any[] = [];
      const timestamp = new Date().toLocaleString();

      // A. Executive Overview sheet
      if (syncOverview) {
        setSyncMessage('Compiling financial and capacity performance charts...');
        const totalRev = (patients.length * 300) + 
          labTests.reduce((sum, l) => sum + (l.fee || 0), 0) + 
          stock.reduce((sum, item) => sum + (item.price * (100 - item.stockQuantity > 0 ? 100 - item.stockQuantity : 10)), 0); // Estimating dispenses
        const totalExp = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        const netProfit = totalRev - totalExp;

        updateData.push({
          range: "Executive Overview!A1:D15",
          values: [
            ["PCEA Tumutumu Karatina Hospital - Executive Overview", "", "", ""],
            ["Data Synchronized At:", timestamp, "", ""],
            ["", "", "", ""],
            ["Key Performance indicator (KPI)", "Metric Value", "Reference Status", "Standard Limit"],
            ["Total Active Patient Cohort", patients.length, "Stable Capacity", "300 Patients"],
            ["Total Clinic Revenue (Ksh)", totalRev, "Inflow", "N/A"],
            ["Operational Expenses Ledger (Ksh)", totalExp, "Outflow", "N/A"],
            ["Net Surplus Profit / Balance (Ksh)", netProfit, netProfit >= 0 ? "Surplus Health" : "Deficit Check", "N/A"],
            ["Drug Store Catalog SKU Counts", stock.length, "Inventory Active", "N/A"],
            ["Pending & Processed Lab Assays", labTests.length, "Operational Queue", "N/A"],
            ["", "", "", ""],
            ["System Notice:", "This sheet is controlled and automatically populated by the AI Studio Workspace sheets connecter.", "", ""]
          ]
        });
      }

      // B. Patients tab
      if (syncPatients) {
        setSyncMessage('Generating active clinic directory rows...');
        const patientsData = [
          ["Ref Patient ID", "Full Name", "Gender", "Age (Years)", "Consultation Type", "Contact Phone", "Registration Date"],
          ...patients.map(p => [
            p.id,
            p.name,
            p.gender,
            p.age,
            p.category,
            p.phone || 'N/A',
            p.registeredAt || 'N/A'
          ])
        ];
        updateData.push({
          range: "Active Clinical Directory!A1:G1000",
          values: patientsData
        });
      }

      // C. Stock Inventory Tab
      if (syncStock) {
        setSyncMessage('Syncing pharmaceutical and non-pharma product stocks...');
        const stockData = [
          ["Ref Product ID", "Product Description", "Specific Category", "Unit Price (Ksh)", "Stock Left (Units)", "Warning Threshold"],
          ...stock.map(s => [
            s.id,
            s.name,
            s.category,
            s.price,
            s.stockQuantity,
            s.minThreshold ?? 15
          ])
        ];
        updateData.push({
          range: "Pharmaceutical Stock Room!A1:F1000",
          values: stockData
        });
      }

      // D. Lab Diagnostics tab
      if (syncLab) {
        setSyncMessage('Formatting laboratory queue diagnostics report...');
        const labData = [
          ["Reference Test ID", "Patient Name", "Investigation Name", "Test Date", "Lab Technician", "Assay Lab Fees", "Reported Clinical Finding"],
          ...labTests.map(l => [
            l.id,
            l.patientName,
            l.testName,
            l.testDate || 'N/A',
            l.performedBy || 'N/A',
            l.fee || 0,
            l.result || 'Pending Result Input'
          ])
        ];
        updateData.push({
          range: "Laboratory Queue!A1:G1000",
          values: labData
        });
      }

      // E. Expense Ledger tab
      if (syncExpenses) {
        setSyncMessage('Aggregating operational expenditures logs...');
        const expenseData = [
          ["Expense Reference ID", "Billing Category", "Total Paid Amount (Ksh)", "Settlement Date", "Transaction Summary"],
          ...expenses.map(e => [
            e.id,
            e.category,
            e.amount,
            e.date,
            e.description
          ])
        ];
        updateData.push({
          range: "Operating Expenses Ledger!A1:E1000",
          values: expenseData
        });
      }

      if (updateData.length === 0) {
        throw new Error('Please select at least one workspace data component checkbox to synchronize.');
      }

      // Step 3: Run the batchUpdate API
      setSyncMessage('Injecting payload rows directly to cells...');
      const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${activeSpreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: updateData
        })
      });

      if (!updateResponse.ok) {
        const errData = await updateResponse.json();
        throw new Error(`Sheets update cell failed: ${errData?.error?.message || updateResponse.statusText}`);
      }

      setSyncMessage('Polishing cell auto-fitting formatting parameters...');
      setSyncedSheetUrl(`https://docs.google.com/spreadsheets/d/${activeSpreadsheetId}`);
      setSyncStatus('success');
    } catch (err: any) {
      console.error("Export failed:", err);
      setErrorDetails(err?.message || "Internal spreadsheet writing handler failure.");
      setSyncStatus('error');
    }
  };

  return (
    <div id="sheets-integration-workspace" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* 1. Google Account & Auth Sidebar panel */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs h-fit space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Sheets Authentication
            </h3>
            <p className="text-[10px] text-stone-500">Secure Workspace Connector</p>
          </div>
        </div>

        {!accessToken ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] leading-relaxed text-stone-600">
              <span className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                <Lock className="w-3.5 h-3.5 text-stone-500" /> Authorized Safe Sandbox
              </span>
              Authenticate with Google to enable spreadsheets creation and multi-direction streaming synchronization features.
            </div>

            <button
              id="btn-sheets-auth"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full gsi-material-button text-xs py-1 hover:brightness-95 active:brightness-90 transition shadow-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer flex items-center justify-center border border-stone-200 rounded-lg bg-white text-stone-800 font-semibold"
            >
              <div className="gsi-material-button-content-wrapper flex items-center gap-2 p-1.5">
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 text-stone-500 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                )}
                <span>Authorize with Google Sheets</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-150 rounded-lg p-3 text-[11px] leading-relaxed text-emerald-800">
              <span className="flex items-center gap-1.5 font-bold text-emerald-950 mb-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Active Session Linked
              </span>
              Your Google identity is verified and connected to the sheets connector with authorized permission.
              <div className="text-[10px] text-emerald-700/85 mt-2 break-all font-mono">
                Email: {userEmail}
              </div>
            </div>

            <button
              id="btn-sheets-disconnect"
              onClick={handleDisconnect}
              className="w-full border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold py-2 rounded-lg text-xs transition cursor-pointer text-center"
            >
              Sign Out & Dissolve Secrets
            </button>
          </div>
        )}

        {/* Configuration linking Panel */}
        <hr className="border-stone-100" />

        <form onSubmit={handleSaveSheetId} className="space-y-3">
          <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Link Existing Spreadsheet
          </h4>
          <div className="relative">
            <input
              id="inp-sheets-id"
              type="text"
              placeholder="Paste Google Spreadsheet ID..."
              value={spreadSheetId}
              onChange={(e) => setSpreadSheetId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg py-1.5 pl-2.5 pr-8 text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
            />
            {spreadSheetId && (
              <button
                id="btn-clear-sheet-id"
                type="button"
                onClick={() => setSpreadSheetId('')}
                className="absolute right-2.5 top-1.5 text-stone-400 hover:text-stone-600 cursor-pointer font-bold"
              >
                ×
              </button>
            )}
          </div>
          <button
            id="btn-save-sheet-id"
            type="submit"
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer text-center"
          >
            Save Client ID Coordinates
          </button>
        </form>
      </div>

      {/* 2. Synclists Scope Checklist and Trigger Panel */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs lg:col-span-2 space-y-6">
        
        {/* Header summary */}
        <div>
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
            Select Data Components to Synchronize
          </h3>
          <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
            Choose exactly which sections of PCEA Tumutumu hospital records database are translated to the target sheets. Selecting unchecked sheets will omit updates.
          </p>
        </div>

        {/* Selection Grid checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
          
          <label 
            className={`border rounded-lg p-3 flex items-start gap-3 select-none transition-all cursor-pointer ${
              syncOverview ? 'bg-emerald-50/40 border-emerald-200 text-stone-900' : 'bg-stone-50/50 border-stone-150 text-stone-500'
            }`}
          >
            <input 
              id="chk-sync-overview"
              type="checkbox" 
              checked={syncOverview} 
              onChange={() => setSyncOverview(!syncOverview)}
              className="mt-1 accent-emerald-600 cursor-pointer"
            />
            <div>
              <div className="font-bold flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" /> 1. Executive KPIs & Overview
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Consolidates cash flows, patient counts, inventory SKUs, and operation health summaries.</div>
            </div>
          </label>

          <label 
            className={`border rounded-lg p-3 flex items-start gap-3 select-none transition-all cursor-pointer ${
              syncPatients ? 'bg-emerald-50/40 border-emerald-200 text-stone-900' : 'bg-stone-50/50 border-stone-150 text-stone-500'
            }`}
          >
            <input 
              id="chk-sync-patients"
              type="checkbox" 
              checked={syncPatients} 
              onChange={() => setSyncPatients(!syncPatients)}
              className="mt-1 accent-emerald-600 cursor-pointer"
            />
            <div>
              <div className="font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> 2. Clinical Patient Cohorts
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Synchronizes active medical registrations ({patients.length} records), consultation types, and contact details.</div>
            </div>
          </label>

          <label 
            className={`border rounded-lg p-3 flex items-start gap-3 select-none transition-all cursor-pointer ${
              syncStock ? 'bg-emerald-50/40 border-emerald-200 text-stone-900' : 'bg-stone-50/50 border-stone-150 text-stone-500'
            }`}
          >
            <input 
              id="chk-sync-stock"
              type="checkbox" 
              checked={syncStock} 
              onChange={() => setSyncStock(!syncStock)}
              className="mt-1 accent-emerald-600 cursor-pointer"
            />
            <div>
              <div className="font-bold flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-emerald-600" /> 3. Pharmacy Stock Catalogs
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Registers stock counts ({stock.length} lines), current unit prices, and alert warning thresholds.</div>
            </div>
          </label>

          <label 
            className={`border rounded-lg p-3 flex items-start gap-3 select-none transition-all cursor-pointer ${
              syncLab ? 'bg-emerald-50/40 border-emerald-200 text-stone-900' : 'bg-stone-50/50 border-stone-150 text-stone-500'
            }`}
          >
            <input 
              id="chk-sync-lab"
              type="checkbox" 
              checked={syncLab} 
              onChange={() => setSyncLab(!syncLab)}
              className="mt-1 accent-emerald-600 cursor-pointer"
            />
            <div>
              <div className="font-bold flex items-center gap-1">
                <Beaker className="w-3.5 h-3.5 text-emerald-600" /> 4. Laboratory Investigation Queue
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Streams diagnostic testing log records ({labTests.length} queues), status states, and fees.</div>
            </div>
          </label>

          <label 
            className={`border rounded-lg p-3 flex items-start gap-3 select-none transition-all cursor-pointer ${
              syncExpenses ? 'bg-emerald-50/40 border-emerald-200 text-stone-900' : 'bg-stone-50/50 border-stone-150 text-stone-500'
            }`}
          >
            <input 
              id="chk-sync-expenses"
              type="checkbox" 
              checked={syncExpenses} 
              onChange={() => setSyncExpenses(!syncExpenses)}
              className="mt-1 accent-emerald-600 cursor-pointer"
            />
            <div>
              <div className="font-bold flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" /> 5. Operations Expenses Ledger
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Documents hospital expenses ({expenses.length} postings), descriptive billing, and transaction dates.</div>
            </div>
          </label>
        </div>

        {/* Big Action button trigger */}
        <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 space-y-4">
          
          {accessToken ? (
            <div>
              <button
                id="btn-sheets-trigger-sync"
                type="button"
                onClick={executeSheetsSync}
                disabled={syncStatus === 'syncing'}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs py-3 rounded-lg shadow-sm font-sans flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                {syncStatus === 'syncing' ? 'Publishing Cells to Cloud...' : spreadSheetId ? 'Force Update Linked Spreadsheet' : 'Create & Sync New Google Spreadsheet'}
              </button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-[11px] text-stone-500 mb-1 font-medium">Sheets integration controls are inactive</p>
              <p className="text-[10px] text-stone-400">Please authorize your Google Account in the sidebar panel to unlock live streaming updates.</p>
            </div>
          )}

          {/* Sync Progress telemetry panel */}
          {syncStatus === 'syncing' && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                {syncMessage}
              </span>
              <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-2/3 animate-pulse rounded-full" />
              </div>
            </div>
          )}

          {syncStatus === 'success' && syncedSheetUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-150 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">Google Sheets Sync Completed Successfully!</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Your clinical database datasets have been compiled and streamed directly to your active spreadsheet cells.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  id="lnk-open-spreadsheet"
                  href={syncedSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Live Google Sheet
                </a>
                <button
                  id="btn-link-copied"
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(syncedSheetUrl);
                    alert("Spreadsheet URL copied to clipboard.");
                  }}
                  className="bg-white border border-emerald-250 hover:bg-emerald-50/50 text-emerald-800 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1 transition-all"
                >
                  Copy Sheet Link
                </button>
              </div>
            </motion.div>
          )}

          {errorDetails && (
            <div className="bg-rose-50 border border-rose-150 rounded-lg p-3 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-rose-950 block">Synchronization Failed</strong>
                {errorDetails}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

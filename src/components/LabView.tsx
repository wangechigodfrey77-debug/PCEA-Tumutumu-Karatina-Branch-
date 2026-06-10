/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Microscope, 
  HelpCircle, 
  Save, 
  TrendingUp, 
  Upload, 
  Plus, 
  FileSpreadsheet, 
  FileText, 
  Check, 
  Loader2, 
  Sparkles, 
  SlidersHorizontal 
} from 'lucide-react';
import { LabTest, Patient, LabCatalogItem } from '../types';

interface LabViewProps {
  labTests: LabTest[];
  patients: Patient[];
  labCatalog?: LabCatalogItem[];
  userEmail: string;
  userName: string;
  onAddLabTest: (test: LabTest) => void;
  onAddLabCatalogItem?: (item: LabCatalogItem) => void;
}

// Simple and strong quotation-aware CSV parser
function parseCSVData(rawText: string): Record<string, string>[] {
  const lines = rawText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols: string[] = [];
    let insideQuote = false;
    let currentRaw = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cols.push(currentRaw.trim().replace(/^["']|["']$/g, ''));
        currentRaw = '';
      } else {
        currentRaw += char;
      }
    }
    cols.push(currentRaw.trim().replace(/^["']|["']$/g, ''));

    if (cols.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = cols[index] || '';
      });
      results.push(row);
    }
  }
  return results;
}

export function LabView({ 
  labTests, 
  patients, 
  labCatalog = [], 
  userEmail, 
  userName, 
  onAddLabTest, 
  onAddLabCatalogItem 
}: LabViewProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [testType, setTestType] = useState<string>('');
  const [customTestName, setCustomTestName] = useState<string>('');
  const [testFee, setTestFee] = useState<number>(350);
  const [testResult, setTestResult] = useState<string>('');
  const [technicianName, setTechnicianName] = useState<string>(userName || 'Peter Kagiri');
  const [labTestDate, setLabTestDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Tab state: 'history' (Ledger) vs 'catalog' (Manage/Import catalog)
  const [activePanelTab, setActivePanelTab] = useState<'history' | 'catalog'>('history');

  // Manual catalog addition form state
  const [newCatalogName, setNewCatalogName] = useState<string>('');
  const [newCatalogFee, setNewCatalogFee] = useState<number>(500);

  // File Upload states
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default hardcoded catalog menu in case Firestore list is empty and still loading
  const defaultFallbackMenu = [
    { name: 'Malaria Slide/RDT test', fee: 350 },
    { name: 'Complete Blood Count (CBC)', fee: 1200 },
    { name: 'Urinalysis Dipstick', fee: 400 },
    { name: 'Blood Sugar (FBG/RBS)', fee: 300 },
    { name: 'Typhoid Widal test', fee: 600 },
    { name: 'Stool O&P Microscopy', fee: 450 },
    { name: 'COVID-19 Antigen Rapid', fee: 1500 },
    { name: 'Liver Function Tests (LFT)', fee: 2500 }
  ];

  // Resolve active catalog menu (dynamic Firestore items first, with fallback to hardcoded menu)
  const activeCatalog = labCatalog.length > 0 
    ? labCatalog.map(item => ({ name: item.name, fee: item.fee })) 
    : defaultFallbackMenu;

  // Sync test fee when default first option changes or option selected
  React.useEffect(() => {
    if (activeCatalog.length > 0 && !testType) {
      setTestType(activeCatalog[0].name);
      setTestFee(activeCatalog[0].fee);
    }
  }, [activeCatalog, testType]);

  // Daily Stats Computed locally
  const todayString = new Date().toISOString().split('T')[0];
  const todaysTests = labTests.filter((t) => t.testDate === todayString);
  const todaysRevenue = todaysTests.reduce((sum, t) => sum + t.fee, 0);

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a valid target patient.');
      return;
    }
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    const finalTestName = testType === 'Custom' ? customTestName : testType;
    if (!finalTestName) {
      alert('Please enter a custom name for the clinical diagnostic test.');
      return;
    }

    const testItem: LabTest = {
      id: `LB-${Math.floor(100000 + Math.random() * 900000)}`,
      testName: finalTestName,
      patientName: patient.name,
      patientId: patient.id,
      testDate: labTestDate,
      performedBy: technicianName,
      performedByEmail: userEmail || 'lab_tech@tumutumu.org',
      result: testResult || 'Pending official reading/Interpretation.',
      fee: testFee
    };

    onAddLabTest(testItem);

    // Reset fields
    setTestResult('');
    setCustomTestName('');
    alert(`Diagnostics lab report committed successfully for ${patient.name}.`);
  };

  const handleTestTypeChange = (val: string) => {
    setTestType(val);
    if (val === 'Custom') {
      setTestFee(1000);
    } else {
      const match = activeCatalog.find((t) => t.name === val);
      if (match) {
        setTestFee(match.fee);
      }
    }
  };

  // Manual catalog item registration
  const handleAddSingleCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatalogName.trim()) {
      alert('Please specify a valid test panel name.');
      return;
    }
    if (onAddLabCatalogItem) {
      const isDuplicate = labCatalog.some(item => item.name.toLowerCase() === newCatalogName.trim().toLowerCase());
      if (isDuplicate) {
        alert('This medical test panel is already present in your registered catalog.');
        return;
      }

      onAddLabCatalogItem({
        id: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
        name: newCatalogName.trim(),
        fee: Number(newCatalogFee)
      });
      setNewCatalogName('');
      alert(`Test panel catalog updated: "${newCatalogName}" is now live for diagnostic assignments.`);
    } else {
      alert('Catalog additions are blocked: Setup is working in local offline read-only fallback mode.');
    }
  };

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  // Universal File Processor
  const processUploadedFile = async (file: File) => {
    setUploadFeedback(null);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      setIsParsing(true);
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          const parsedRows = parseCSVData(rawText);

          if (parsedRows.length === 0) {
            setUploadFeedback({ success: false, message: 'Vacant or incorrectly formatted CSV. Header row with columns is required.' });
            setIsParsing(false);
            return;
          }

          let addedCount = 0;
          parsedRows.forEach((row) => {
            // Flexible, case-insensitive mapping
            const nameKey = Object.keys(row).find(k => k.includes('name') || k.includes('test') || k.includes('panel') || k.includes('diagnostic'));
            const feeKey = Object.keys(row).find(k => k.includes('fee') || k.includes('price') || k.includes('charge') || k.includes('cost') || k.includes('ksh'));

            const foundName = nameKey ? row[nameKey] : undefined;
            const foundFee = feeKey ? parseFloat(row[feeKey].replace(/[^0-9.]/g, '')) : 500;

            if (foundName && foundName.trim()) {
              if (onAddLabCatalogItem) {
                onAddLabCatalogItem({
                  id: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
                  name: foundName.trim(),
                  fee: isNaN(foundFee) ? 500 : foundFee
                });
                addedCount++;
              }
            }
          });

          setUploadFeedback({ 
            success: true, 
            message: `Extracted ${addedCount} test panel profiles from CSV list successfully.` 
          });
        } catch (err: any) {
          setUploadFeedback({ success: false, message: `CSV upload crash: ${err?.message || err}` });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsText(file);

    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setIsParsing(true);
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

          const parsedRows: Record<string, string>[] = rawRows.map(row => {
            const newRow: Record<string, string> = {};
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              const val = row[key];
              newRow[cleanKey] = val !== undefined && val !== null ? String(val) : '';
            }
            return newRow;
          });

          if (parsedRows.length === 0) {
            setUploadFeedback({ success: false, message: 'Vacant or empty Excel sheet.' });
            setIsParsing(false);
            return;
          }

          let addedCount = 0;
          parsedRows.forEach((row) => {
            const nameKey = Object.keys(row).find(k => k.includes('name') || k.includes('test') || k.includes('panel') || k.includes('diagnostic'));
            const feeKey = Object.keys(row).find(k => k.includes('fee') || k.includes('price') || k.includes('charge') || k.includes('cost') || k.includes('ksh'));

            const foundName = nameKey ? row[nameKey] : undefined;
            const foundFee = feeKey ? parseFloat(row[feeKey].replace(/[^0-9.]/g, '')) : 500;

            if (foundName && foundName.trim()) {
              if (onAddLabCatalogItem) {
                onAddLabCatalogItem({
                  id: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
                  name: foundName.trim(),
                  fee: isNaN(foundFee) ? 500 : foundFee
                });
                addedCount++;
              }
            }
          });

          setUploadFeedback({ 
            success: true, 
            message: `Extracted ${addedCount} test panel profiles from Excel sheet successfully.` 
          });
        } catch (err: any) {
          setUploadFeedback({ success: false, message: `Excel upload error: ${err.message}` });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);

    } else if (file.name.endsWith('.pdf')) {
      setIsParsing(true);
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;
          const base64Content = dataUrl.split(',')[1];

          const response = await fetch('/api/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64Content,
              mimeType: 'application/pdf',
              dataType: 'labTestsCatalog'
            })
          });

          const result = await response.json();
          if (response.ok && result.success && Array.isArray(result.items)) {
            let addCount = 0;
            result.items.forEach((item: any) => {
              if (item.name && onAddLabCatalogItem) {
                onAddLabCatalogItem({
                  id: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
                  name: item.name,
                  fee: Number(item.fee) || 500
                });
                addCount++;
              }
            });
            setUploadFeedback({ 
              success: true, 
              message: `AI scanned pricing documents: extracted ${addCount} clinical tests flawlessly.` 
            });
          } else {
            setUploadFeedback({ 
              success: false, 
              message: result.message || 'AI document reading stalled. Confirm your GEMINI_API_KEY in settings or use .csv instead.' 
            });
          }
        } catch (err: any) {
          setUploadFeedback({ success: false, message: `PDF parsing failed: ${err.message}` });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setUploadFeedback({ success: false, message: 'Invalid file extension. Please select a spreadsheet (.csv/.xlsx/.xls) or an official pricing sheet (.pdf).' });
    }
  };

  return (
    <div id="laboratory-module" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Test Entry Panel */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs leading-relaxed h-fit">
        <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Microscope className="w-4.5 h-4.5 text-emerald-600" />
          Record Lab Diagnostics Report
        </h3>

        <form onSubmit={handleAddTest} className="space-y-4 text-xs">
          <div>
            <label id="lbl-lab-patient" className="block font-medium text-stone-500 mb-1">Target Patient</label>
            <select
              id="select-lab-patient"
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
            >
              <option value="">-- Choose Patient of record --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.gender}, {p.age} yrs) - {p.category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label id="lbl-lab-testtype" className="block font-medium text-stone-500 mb-1">Diagnostic Panel</label>
              <select
                id="select-lab-testtype"
                value={testType}
                onChange={(e) => handleTestTypeChange(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden font-medium"
              >
                {activeCatalog.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
                <option value="Custom">-- Custom Test Panel --</option>
              </select>
            </div>

            <div>
              <label id="lbl-lab-date" className="block font-medium text-stone-500 mb-1">Diagnosis Date</label>
              <input
                id="input-lab-date"
                type="date"
                required
                value={labTestDate}
                onChange={(e) => setLabTestDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {testType === 'Custom' && (
            <div className="animate-fade-in">
              <label id="lbl-lab-customname" className="block font-medium text-stone-500 mb-1">Custom Diagnostics Title</label>
              <input
                id="input-lab-customname"
                type="text"
                placeholder="E.g., Complete Urinalysis Screen"
                required
                value={customTestName}
                onChange={(e) => setCustomTestName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label id="lbl-lab-fee" className="block font-medium text-stone-500 mb-1">Charging Fee (Ksh)</label>
              <input
                id="input-lab-fee"
                type="number"
                required
                min={0}
                value={testFee}
                onChange={(e) => setTestFee(Number(e.target.value))}
                disabled={testType !== 'Custom'}
                className="w-full bg-stone-100 disabled:opacity-75 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden font-bold font-mono text-emerald-800"
              />
            </div>

            <div>
              <label id="lbl-lab-officer" className="block font-medium text-stone-500 mb-1">Laboratory Officer</label>
              <input
                id="input-lab-officer"
                type="text"
                required
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label id="lbl-lab-result" className="block font-medium text-stone-500 mb-1">Detailed Findings & Diagnostic Results</label>
            <textarea
              id="txt-lab-result"
              placeholder="E.g., Blood smear positive (++) for Plasmodium Falciparum ring form trophozoites. Standard antimalarials suggested."
              required
              rows={4}
              value={testResult}
              onChange={(e) => setTestResult(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono text-xs"
            />
          </div>

          <button
            id="btn-lab-submit"
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99] transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Finalize & Commit Lab Test
          </button>
        </form>
      </div>

      {/* Dynamic Tab Segment (Ledger vs Catalog & Bulk Import) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Lab Revenue Stats Topbar */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest block">Tests Administered Today</span>
              <span className="text-xl font-bold text-stone-900">{todaysTests.length}</span>
            </div>
            <Microscope className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest block">Daily Lab Revenue</span>
              <span className="text-xl font-bold text-emerald-700">Ksh {todaysRevenue.toLocaleString()}</span>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        {/* Tab Switch Control Header */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs leading-relaxed">
          <div className="flex border-b border-stone-100 pb-3 mb-5 items-center justify-between">
            <div className="flex gap-4">
              <button
                id="subtab-lab-ledger"
                type="button"
                onClick={() => setActivePanelTab('history')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePanelTab === 'history'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Clinical Diagnostics Ledger ({labTests.length})
              </button>
              <button
                id="subtab-lab-catalog"
                type="button"
                onClick={() => setActivePanelTab('catalog')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePanelTab === 'catalog'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/70'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Manage Test Menu Catalog ({activeCatalog.length})
              </button>
            </div>
            <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Labs Control Plane
            </div>
          </div>

          {/* Render Active View Tab */}
          {activePanelTab === 'history' ? (
            <div className="overflow-x-auto animate-fade-in">
              <table className="w-full text-left text-xs">
                <thead className="text-stone-500 font-medium border-b border-stone-100 uppercase font-mono text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5">Test ID</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Patient Name</th>
                    <th className="py-2.5">Diagnostic Panel</th>
                    <th className="py-2.5">Authorized Officer</th>
                    <th className="py-2.5">Lab Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {labTests.map((t) => {
                    const patient = patients.find((p) => p.id === t.patientId);
                    const op = patient?.opNumber || (patient ? `OP-${(patient.registeredAt ? patient.registeredAt.substring(0, 7) : '2026-06')}-${patient.id.split('-')[1]}` : '');
                    return (
                      <React.Fragment key={t.id}>
                        <tr id={`lab-tr-main-${t.id}`} className="hover:bg-stone-50/40 font-sans transition-colors">
                          <td className="py-3.5 font-mono text-stone-500 font-medium">{t.id}</td>
                          <td className="py-3.5 font-mono">{t.testDate}</td>
                          <td className="py-3.5 font-semibold text-stone-800">
                            <div>{t.patientName}</div>
                            {op && <div className="text-[9px] text-emerald-700 font-mono font-bold">{op}</div>}
                          </td>
                          <td className="py-3.5 text-stone-600 font-semibold">{t.testName}</td>
                          <td className="py-3.5 text-stone-500">{t.performedBy}</td>
                          <td className="py-3.5 font-bold text-stone-900 font-mono">Ksh {t.fee.toLocaleString()}</td>
                        </tr>
                        <tr id={`lab-tr-sub-${t.id}`} className="bg-emerald-50/20 border-b border-stone-100">
                          <td colSpan={6} className="px-4 py-2.5 text-[11px] text-stone-600 leading-normal">
                            <span className="font-bold text-stone-500 mr-2 uppercase tracking-wider font-mono text-[9px]">Lab Findings:</span> 
                            <code className="bg-white border border-stone-200/60 p-1.5 rounded-md inline-block font-mono text-emerald-800 shadow-2xs mt-0.5">
                              {t.result}
                            </code>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {labTests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 font-medium">No laboratory panel reports recorded yet. Use the record form on the left.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* CSV/PDF bulk Drag zone */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Bulk Upload Clinical Diagnostic Panels & Prices
                </h4>
                <p className="text-[11px] text-stone-500 mb-3">
                  Upload high-volume lab tests, diagnostic directories, or laboratory pricing booklets. Accepts <strong>Excel/CSV spreadsheets</strong> or <strong>PDF documents</strong>. AI handles PDF conversion automatically.
                </p>

                <div
                  id="dropzone-lab-catalog"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <input
                    id="input-file-lab-catalog"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv, .pdf, .xlsx, .xls"
                    className="hidden"
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center text-center p-3 animate-pulse">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                      <span className="text-xs font-semibold text-emerald-800">Reading documents & extracting testing parameters...</span>
                      <span className="text-[10px] text-stone-400 font-mono mt-1">Calling Gemini deep-scanning extraction pipeline</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-white rounded-full shadow-2xs border border-stone-100 flex gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                        <FileText className="w-6 h-6 text-indigo-600" />
                      </div>
                      <span className="text-xs font-semibold text-stone-700 mt-2">
                        Drag and drop file here, or <span className="text-emerald-600 underline">browse computer</span>
                      </span>
                      <span className="text-[10px] text-stone-400 mt-1">Accepts raw CSV (Name, Pricing columns) or official PDF directories</span>
                    </div>
                  )}
                </div>

                {uploadFeedback && (
                  <div className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                    uploadFeedback.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-red-50 text-red-800 border-red-100'
                  }`}>
                    {uploadFeedback.success ? <Check className="w-4 h-4 text-emerald-700 shrink-0" /> : <HelpCircle className="w-4 h-4 text-red-700 shrink-0" />}
                    <span>{uploadFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Single Catalog Panel Addition */}
              <div className="border-t border-stone-100 pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">Register Single Diagnostic Panel</h4>
                  <p className="text-[11px] text-stone-400 mt-1">Directly add a new lab specialty directory profile manually.</p>
                </div>
                <form onSubmit={handleAddSingleCatalog} className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label id="lbl-catalog-name" className="block text-[11px] font-medium text-stone-500 mb-1">Diagnostic Test Name</label>
                    <input
                      id="input-catalog-name"
                      type="text"
                      placeholder="E.g., Semen Analysis / Microscopy"
                      required
                      value={newCatalogName}
                      onChange={(e) => setNewCatalogName(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label id="lbl-catalog-fee" className="block text-[11px] font-medium text-stone-500 mb-1">Fee (Ksh)</label>
                    <div className="flex gap-2">
                      <input
                        id="input-catalog-fee"
                        type="number"
                        min={0}
                        required
                        value={newCatalogFee}
                        onChange={(e) => setNewCatalogFee(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden text-emerald-800"
                      />
                      <button
                        id="btn-catalog-add"
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
                        title="Add to catalog list"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Current test panels list card */}
              <div className="border-t border-stone-100 pt-5">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-3">Active Laboratory diagnostic price sheet directory</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeCatalog.map((item, idx) => (
                    <div key={idx} className="bg-stone-50 border border-stone-200/50 p-2.5 rounded-lg flex justify-between items-center text-xs shadow-2xs font-sans">
                      <span className="font-semibold text-stone-800 line-clamp-1">{item.name}</span>
                      <span className="font-extrabold text-emerald-800 font-mono bg-white border border-stone-200/30 px-1.5 py-0.5 rounded shadow-3xs shrink-0 ml-2">Ksh {item.fee}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

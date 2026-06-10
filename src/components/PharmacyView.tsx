/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Pill, RotateCcw, Plus, ShoppingBag, PackageOpen, AlertTriangle, TrendingUp, CalendarDays, Upload, FileSpreadsheet, FileText, Check, Loader2 } from 'lucide-react';
import { MedicationDispense, PharmacyItem, Patient } from '../types';

interface PharmacyViewProps {
  stock: PharmacyItem[];
  dispenses: MedicationDispense[];
  patients: Patient[];
  userEmail: string;
  userName: string;
  onDispenseMedication: (dispense: MedicationDispense) => void;
  onRestockItem: (itemId: string, qty: number) => void;
  onAddNewStockItem: (item: PharmacyItem) => void;
  onUpdateThreshold?: (itemId: string, threshold: number) => void;
}

export function PharmacyView({
  stock,
  dispenses,
  patients,
  userEmail,
  userName,
  onDispenseMedication,
  onRestockItem,
  onAddNewStockItem,
  onUpdateThreshold,
}: PharmacyViewProps) {
  const [dispensePatientId, setDispensePatientId] = useState<string>('');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [dispenseQuantity, setDispenseQuantity] = useState<number>(1);
  const [dispensingOfficer, setDispensingOfficer] = useState<string>(userName || 'Susan Muthoni');

  // Sub-tabs state
  const [activeSubTab, setActiveSubTab] = useState<'pharma' | 'non-pharma'>('pharma');

  // Non-Pharmaceutical dispense states
  const [nonPharmaPatientId, setNonPharmaPatientId] = useState<string>('');
  const [selectedNonPharmaId, setSelectedNonPharmaId] = useState<string>('');
  const [nonPharmaQuantity, setNonPharmaQuantity] = useState<number>(1);

  // New stock item creation states
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<number>(50);
  const [newItemQty, setNewItemQty] = useState<number>(100);
  const [newItemCat, setNewItemCat] = useState<string>('Antibiotics');
  const [newItemThreshold, setNewItemThreshold] = useState<number>(15);

  // Bulk File Upload and Parsing States
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stock selection state for quick restock & threshold alerts
  const [restockStockId, setRestockStockId] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(0);
  const [thresholdVal, setThresholdVal] = useState<number>(15);

  // Filter views states
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    if (restockStockId) {
      const selectedItem = stock.find((item) => item.id === restockStockId);
      if (selectedItem) {
        setThresholdVal(selectedItem.minThreshold ?? 15);
      }
    }
  }, [restockStockId]);

  const activeStockItem = stock.find((item) => item.id === selectedStockId);
  const computedTotalCost = activeStockItem ? activeStockItem.price * dispenseQuantity : 0;

  const activeNonPharmaItem = stock.find((item) => item.id === selectedNonPharmaId);
  const computedNonPharmaCost = activeNonPharmaItem ? activeNonPharmaItem.price * nonPharmaQuantity : 0;

  // Filter items with search input and optional minimum threshold filter logic
  const pharmaItems = stock.filter((item) => {
    if (item.category === 'Non-Pharmaceutical') return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const belowThreshold = item.stockQuantity <= (item.minThreshold ?? 15);
    return matchesSearch && (!showLowStockOnly || belowThreshold);
  });

  const nonPharmaItems = stock.filter((item) => {
    if (item.category !== 'Non-Pharmaceutical') return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const belowThreshold = item.stockQuantity <= (item.minThreshold ?? 15);
    return matchesSearch && (!showLowStockOnly || belowThreshold);
  });

  // Compute Revenue over different intervals (Daily, Weekly, Monthly)
  const today = new Date();
  
  const getDaysDiff = (dateStr: string) => {
    const diffTime = Math.abs(today.getTime() - new Date(dateStr).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const todayStr = today.toISOString().split('T')[0];
  const [pharmaDispenseDate, setPharmaDispenseDate] = useState<string>('2026-06-05');
  const [nonPharmaDispenseDate, setNonPharmaDispenseDate] = useState<string>('2026-06-05');
  
  const dailyDispenses = dispenses.filter((d) => d.dispenseDate === todayStr);
  const dailyRev = dailyDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  const weeklyDispenses = dispenses.filter((d) => getDaysDiff(d.dispenseDate) <= 7);
  const weeklyRev = weeklyDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  const monthlyDispenses = dispenses.filter((d) => getDaysDiff(d.dispenseDate) <= 30);
  const monthlyRev = monthlyDispenses.reduce((sum, d) => sum + d.totalCost, 0);

  const totalLowStockCount = stock.filter((item) => item.stockQuantity <= (item.minThreshold ?? 15)).length;
  const criticalOutOfStockCount = stock.filter((item) => item.stockQuantity === 0).length;

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensePatientId || !selectedStockId) {
      alert('Please select both a registered patient and a cataloged medication.');
      return;
    }

    const patient = patients.find((p) => p.id === dispensePatientId);
    const item = stock.find((i) => i.id === selectedStockId);

    if (!patient || !item) return;

    if (item.stockQuantity < dispenseQuantity) {
      alert(`Critical stock warnings: Insufficient inventory count for ${item.name}. Current stock is only ${item.stockQuantity} units.`);
      return;
    }

    const newDispense: MedicationDispense = {
      id: `DSP-${Date.now()}`,
      medicationName: item.name,
      patientId: dispensePatientId,
      patientName: patient.name,
      dispenseDate: pharmaDispenseDate,
      dispensedBy: dispensingOfficer,
      quantity: dispenseQuantity,
      pricePerUnit: item.price,
      totalCost: computedTotalCost,
    };

    onDispenseMedication(newDispense);
    setDispensePatientId('');
    setSelectedStockId('');
    setDispenseQuantity(1);
    alert(`Medication dispensed safely. Dispatched ${dispenseQuantity} units of ${item.name} to patient ${patient.name}.`);
  };

  const handleNonPharmaDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonPharmaPatientId || !selectedNonPharmaId) {
      alert('Please select both a registered patient and a cataloged supplies product.');
      return;
    }

    const patient = patients.find((p) => p.id === nonPharmaPatientId);
    const item = stock.find((i) => i.id === selectedNonPharmaId);

    if (!patient || !item) return;

    if (item.stockQuantity < nonPharmaQuantity) {
      alert(`Critical stock warnings: Insufficient inventory count for ${item.name}. Current stock is only ${item.stockQuantity} units.`);
      return;
    }

    const newDispense: MedicationDispense = {
      id: `DSP-${Date.now()}`,
      medicationName: item.name,
      patientId: nonPharmaPatientId,
      patientName: patient.name,
      dispenseDate: nonPharmaDispenseDate,
      dispensedBy: dispensingOfficer,
      quantity: nonPharmaQuantity,
      pricePerUnit: item.price,
      totalCost: computedNonPharmaCost,
    };

    onDispenseMedication(newDispense);
    setNonPharmaPatientId('');
    setSelectedNonPharmaId('');
    setNonPharmaQuantity(1);
    alert(`Non-pharmaceutical supplies dispensed safely. Dispatched ${nonPharmaQuantity} units of ${item.name} to patient ${patient.name}.`);
  };

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockStockId) return;

    if (restockQty > 0) {
      onRestockItem(restockStockId, restockQty);
    }
    if (onUpdateThreshold) {
      onUpdateThreshold(restockStockId, thresholdVal);
    }
    setRestockStockId('');
    setRestockQty(0);
    alert('Stock inventory replenishment and minimum warning threshold updated successfully.');
  };

  // Simple quotation-aware CSV parser
  const parseCSVData = (rawText: string): Record<string, string>[] => {
    const lines = rawText.split(/\r?\n/);
    if (lines.length < 2) return [];

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
      await processStockFileUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processStockFileUpload(files[0]);
    }
  };

  const processStockFileUpload = async (file: File) => {
    setUploadFeedback(null);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      setIsParsing(true);
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          const parsedRows = parseCSVData(rawText);

          if (parsedRows.length === 0) {
            setUploadFeedback({ success: false, message: 'Vacant or incorrectly formatted CSV.' });
            setIsParsing(false);
            return;
          }

          let addedCount = 0;
          parsedRows.forEach((row) => {
            const nameKey = Object.keys(row).find(k => k.includes('name') || k.includes('medication') || k.includes('product') || k.includes('item'));
            const priceKey = Object.keys(row).find(k => k.includes('price') || k.includes('cost') || k.includes('rate') || k.includes('ksh'));
            const qtyKey = Object.keys(row).find(k => k.includes('qty') || k.includes('quantity') || k.includes('stock') || k.includes('intake') || k.includes('amount'));
            const catKey = Object.keys(row).find(k => k.includes('category') || k.includes('type') || k.includes('class'));
            const threshKey = Object.keys(row).find(k => k.includes('threshold') || k.includes('min') || k.includes('warning'));

            const foundName = nameKey ? row[nameKey] : undefined;
            const foundPrice = priceKey ? parseFloat(row[priceKey].replace(/[^0-9.]/g, '')) : 50;
            const foundQty = qtyKey ? parseInt(row[qtyKey].replace(/[^0-9]/g, '')) : 100;
            const foundCat = catKey ? row[catKey] : undefined;
            const foundThresh = threshKey ? parseInt(row[threshKey].replace(/[^0-9]/g, '')) : 15;

            let finalCat = 'Antibiotics';
            if (foundCat && ['Antibiotics', 'Analgesics', 'Anti-malarials', 'Anti-histamines', 'Supplements', 'Non-Pharmaceutical'].includes(foundCat.trim())) {
              finalCat = foundCat.trim();
            } else {
              const lowerName = (foundName || '').toLowerCase();
              if (lowerName.includes('bandage') || lowerName.includes('syringe') || lowerName.includes('glove') || lowerName.includes('cotton') || lowerName.includes('needle') || lowerName.includes('swab') || lowerName.includes('tape') || lowerName.includes('infusion')) {
                finalCat = 'Non-Pharmaceutical';
              }
            }

            if (foundName && foundName.trim()) {
              const newItem: PharmacyItem = {
                id: finalCat === 'Non-Pharmaceutical' ? `NP-${Math.floor(Math.random() * 900 + 100)}` : `RX-${Math.floor(Math.random() * 900 + 100)}`,
                name: foundName.trim(),
                price: isNaN(foundPrice) ? 50 : foundPrice,
                stockQuantity: isNaN(foundQty) ? 100 : foundQty,
                category: finalCat,
                minThreshold: isNaN(foundThresh) ? 15 : foundThresh,
              };

              onAddNewStockItem(newItem);
              addedCount++;
            }
          });

          setUploadFeedback({ 
            success: true, 
            message: `Extracted ${addedCount} products/supplies from CSV catalog successfully.` 
          });
        } catch (err: any) {
          setUploadFeedback({ success: false, message: `CSV upload error: ${err.message}` });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsText(file);

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
              dataType: 'pharmacyStock'
            })
          });

          const result = await response.json();
          if (response.ok && result.success && Array.isArray(result.items)) {
            let addCount = 0;
            result.items.forEach((item: any) => {
              if (item.name) {
                const newItem: PharmacyItem = {
                  id: item.category === 'Non-Pharmaceutical' ? `NP-${Math.floor(Math.random() * 900 + 100)}` : `RX-${Math.floor(Math.random() * 900 + 100)}`,
                  name: item.name,
                  price: Number(item.price) || 50,
                  stockQuantity: Number(item.stockQuantity) || 100,
                  category: item.category || 'Antibiotics',
                  minThreshold: Number(item.minThreshold) || 15,
                };
                onAddNewStockItem(newItem);
                addCount++;
              }
            });
            setUploadFeedback({ 
              success: true, 
              message: `AI scanned pricing sheets: cataloged ${addCount} inventory products successfully.` 
            });
          } else {
            setUploadFeedback({ 
              success: false, 
              message: result.message || 'AI scanning paused. Please configure GEMINI_API_KEY inside secrets, or use .csv files.' 
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
      setUploadFeedback({ success: false, message: 'Invalid file format. Select a .csv spreadsheet or a .pdf price sheet.' });
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0 || newItemQty < 0 || newItemThreshold < 0) return;

    const newItem: PharmacyItem = {
      id: newItemCat === 'Non-Pharmaceutical' ? `NP-${Math.floor(Math.random() * 900 + 100)}` : `RX-${Math.floor(Math.random() * 900 + 100)}`,
      name: newItemName.trim(),
      price: newItemPrice,
      stockQuantity: newItemQty,
      category: newItemCat,
      minThreshold: newItemThreshold,
    };

    onAddNewStockItem(newItem);
    setNewItemName('');
    setNewItemPrice(50);
    setNewItemQty(100);
    setNewItemThreshold(15);
    alert(`Successfully registered new item: ${newItem.name} (Threshold: ${newItemThreshold} units)`);
  };

  return (
    <div id="pharmacy-module" className="space-y-6">
      {/* Dynamic Revenue Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Daily Pharmacy Dispenses</span>
            <span className="text-xl font-bold text-stone-900">{dailyDispenses.length} Dispatched</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Ksh {dailyRev.toLocaleString()} generated</span>
          </div>
          <ShoppingBag className="w-8 h-8 text-indigo-500" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Weekly Pharmacy Ledger</span>
            <span className="text-xl font-bold text-stone-900">{weeklyDispenses.length} Dispatched</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Ksh {weeklyRev.toLocaleString()} generated</span>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Monthly Pharmacy Volume</span>
            <span className="text-xl font-bold text-stone-900">{monthlyDispenses.length} Dispatched</span>
            <span className="text-xs text-emerald-600 font-semibold block mt-1">Ksh {monthlyRev.toLocaleString()} generated</span>
          </div>
          <CalendarDays className="w-8 h-8 text-teal-600" />
        </div>
      </div>

      {/* Tab select control */}
      <div className="flex border-b border-stone-200">
        <button
          id="btn-subtab-pharma"
          type="button"
          onClick={() => setActiveSubTab('pharma')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold transition-all border-b-2 mr-4 ${
            activeSubTab === 'pharma'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <Pill className="w-4 h-4 text-emerald-600" />
          Pharmaceutical Medications ({pharmaItems.length} items)
        </button>
        <button
          id="btn-subtab-nonpharma"
          type="button"
          onClick={() => setActiveSubTab('non-pharma')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold transition-all border-b-2 ${
            activeSubTab === 'non-pharma'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          <PackageOpen className="w-4 h-4 text-indigo-600" />
          Non-Pharmaceutical Supplies ({nonPharmaItems.length} items)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispense Panel */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed h-fit">
          {activeSubTab === 'pharma' ? (
            <>
              <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Pill className="w-4.5 h-4.5 text-emerald-600" />
                Dispense Medication Form
              </h3>

              <form onSubmit={handleDispense} className="space-y-4 text-xs">
                <div>
                  <label id="lbl-dispense-patient" className="block font-medium text-stone-500 mb-1">Target Patient</label>
                  <select
                    id="select-dispense-patient"
                    required
                    value={dispensePatientId}
                    onChange={(e) => setDispensePatientId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => {
                      const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id} | {op})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label id="lbl-dispense-med" className="block font-medium text-stone-500 mb-1">Medication Selection</label>
                  <select
                    id="select-dispense-med"
                    required
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="">-- Choose Medicine --</option>
                    {pharmaItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stockQuantity <= 0}>
                        {item.name} ({item.stockQuantity} Left) - Ksh {item.price}/unit
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label id="lbl-dispense-qty" className="block font-medium text-stone-500 mb-1">Dispensation Qty</label>
                    <input
                      id="inp-dispense-qty"
                      type="number"
                      required
                      min={1}
                      max={activeStockItem ? activeStockItem.stockQuantity : 100}
                      value={dispenseQuantity}
                      onChange={(e) => setDispenseQuantity(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="block font-medium text-stone-500 mb-1">Total Pricing</span>
                    <span className="block text-md font-bold text-emerald-800 p-2 bg-stone-50 border border-stone-100 rounded-lg">
                      Ksh {computedTotalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label id="lbl-pharma-dispense-date" className="block font-medium text-stone-500 mb-1">Dispended Date (Backdate Support)</label>
                  <input
                    id="inp-pharma-dispense-date"
                    type="date"
                    required
                    value={pharmaDispenseDate}
                    onChange={(e) => setPharmaDispenseDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label id="lbl-dispensing-officer" className="block font-medium text-stone-500 mb-1">Dispensed By (Whitelisted Pharmacist)</label>
                  <input
                    id="inp-dispensing-officer"
                    type="text"
                    required
                    value={dispensingOfficer}
                    onChange={(e) => setDispensingOfficer(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-hidden text-stone-500"
                  />
                </div>

                <button
                  id="btn-dispense-med"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Complete Dispensation Dispatch
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <PackageOpen className="w-4.5 h-4.5 text-indigo-600" />
                Dispense Supply Form (Non-Pharma)
              </h3>

              <form onSubmit={handleNonPharmaDispense} className="space-y-4 text-xs">
                <div>
                  <label id="lbl-dispense-nonpharma-patient" className="block font-medium text-stone-500 mb-1">Target Patient</label>
                  <select
                    id="select-dispense-nonpharma-patient"
                    required
                    value={nonPharmaPatientId}
                    onChange={(e) => setNonPharmaPatientId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => {
                      const op = p.opNumber || `OP-${(p.registeredAt ? p.registeredAt.substring(0, 7) : '2026-06')}-${p.id.split('-')[1]}`;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id} | {op})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label id="lbl-dispense-nonpharma-item" className="block font-medium text-stone-500 mb-1">Supply Product Selection</label>
                  <select
                    id="select-dispense-nonpharma-item"
                    required
                    value={selectedNonPharmaId}
                    onChange={(e) => setSelectedNonPharmaId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="">-- Choose Supplies Product --</option>
                    {nonPharmaItems.map((item) => (
                      <option key={item.id} value={item.id} disabled={item.stockQuantity <= 0}>
                        {item.name} ({item.stockQuantity} Left) - Ksh {item.price}/unit
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label id="lbl-dispense-nonpharma-qty" className="block font-medium text-stone-500 mb-1">Dispensation Qty</label>
                    <input
                      id="inp-dispense-nonpharma-qty"
                      type="number"
                      required
                      min={1}
                      max={activeNonPharmaItem ? activeNonPharmaItem.stockQuantity : 100}
                      value={nonPharmaQuantity}
                      onChange={(e) => setNonPharmaQuantity(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="block font-medium text-stone-500 mb-1">Total Pricing</span>
                    <span className="block text-md font-bold text-indigo-800 p-2 bg-stone-50 border border-stone-100 rounded-lg">
                      Ksh {computedNonPharmaCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label id="lbl-nonpharma-dispense-date" className="block font-medium text-stone-500 mb-1">Dispended Date (Backdate Support)</label>
                  <input
                    id="inp-nonpharma-dispense-date"
                    type="date"
                    required
                    value={nonPharmaDispenseDate}
                    onChange={(e) => setNonPharmaDispenseDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label id="lbl-dispense-nonpharma-officer" className="block font-medium text-stone-500 mb-1">Dispensed By (Whitelisted Officer)</label>
                  <input
                    id="inp-dispense-nonpharma-officer"
                    type="text"
                    required
                    value={dispensingOfficer}
                    onChange={(e) => setDispensingOfficer(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-hidden text-stone-500"
                  />
                </div>

                <button
                  id="btn-dispense-nonpharma"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Complete Supply Dispatch
                </button>
              </form>
            </>
          )}
        </div>

        {/* Catalog & Inventory Lists */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm leading-relaxed lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <PackageOpen className="w-4.5 h-4.5 text-emerald-600" />
              PCEA Tumutumu Karatina - {activeSubTab === 'pharma' ? 'Pharmaceutical Stock Formulas' : 'Non-Pharmaceutical supplies'}
            </h3>

            {/* Visual Stock Alert Center Banner */}
            {totalLowStockCount > 0 && (
              <div id="stock-warning-banner" className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3 text-xs leading-relaxed text-amber-900 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 font-sans">
                  <span className="font-bold text-amber-950 uppercase tracking-wider block mb-1">
                    Attention Required: Low Stock Warning ({totalLowStockCount} items affected)
                  </span>
                  <div className="text-stone-700">
                    There are currently <strong className="text-amber-900">{totalLowStockCount}</strong> inventory items near or below their custom critical minimum thresholds.
                    {criticalOutOfStockCount > 0 && (
                      <span> Of these, <strong className="text-rose-700">{criticalOutOfStockCount}</strong> are completely depleted.</span>
                    )}
                    {" "}Immediate replenishment action is recommended to guarantee clinical continuity.
                  </div>
                </div>
              </div>
            )}

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 text-xs font-sans">
              <div className="relative flex-1">
                <input
                  id="inp-inventory-search"
                  type="text"
                  placeholder="Search catalog by name or item reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 pl-3 pr-8 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
                {searchQuery && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 transition cursor-pointer font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              <button
                id="btn-toggle-low-stock-filter"
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`py-2 px-4 rounded-lg font-semibold border flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                  showLowStockOnly
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {showLowStockOnly ? 'Showing Low Stock Only' : 'Show All Stock Items'}
                {totalLowStockCount > 0 && (
                  <span className={`inline-block ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${showLowStockOnly ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {totalLowStockCount}
                  </span>
                )}
              </button>
            </div>

            <div className="overflow-y-auto max-h-[300px] border border-stone-100 rounded-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-stone-50 text-stone-500 font-medium sticky top-0 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Ref ID</th>
                    <th className="p-2.5">Item / Product Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Min Threshold</th>
                    <th className="p-2.5">Unit Price</th>
                    <th className="p-2.5">Stock Status</th>
                    <th className="p-2.5 text-right font-semibold text-slate-800">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {(activeSubTab === 'pharma' ? pharmaItems : nonPharmaItems).map((item) => {
                    const thresh = item.minThreshold ?? 15;
                    const isLowStock = item.stockQuantity <= thresh;
                    const isOutOfStock = item.stockQuantity === 0;

                    let rowClass = "hover:bg-stone-50/50 transition-colors";
                    if (isOutOfStock) {
                      rowClass = "bg-rose-50/60 text-stone-900 border-l-4 border-l-rose-500 hover:bg-rose-100/60 transition-colors";
                    } else if (isLowStock) {
                      rowClass = "bg-amber-50/70 text-stone-900 border-l-4 border-l-amber-500 hover:bg-amber-100/70 transition-colors";
                    }

                    return (
                      <tr id={`rx-row-${item.id}`} key={item.id} className={rowClass}>
                        <td className="p-2.5 font-mono text-stone-500">{item.id}</td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          <span className="flex items-center gap-1.5">
                            {item.name}
                            {isOutOfStock && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Depleted</span>}
                          </span>
                        </td>
                        <td className="p-2.5">{item.category}</td>
                        <td className="p-2.5 font-mono text-stone-600">{thresh} units</td>
                        <td className="p-2.5">Ksh {item.price}</td>
                        <td className="p-2.5">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" /> 0 units
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> {item.stockQuantity} units
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Pill className="w-3 h-3 text-emerald-600" /> {item.stockQuantity} units
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            id={`btn-row-restock-${item.id}`}
                            type="button"
                            onClick={() => {
                              onRestockItem(item.id, 50);
                              alert(`Successfully replenished +50 units of ${item.name}.`);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-900 text-[10px] px-2 py-0.5 rounded transition cursor-pointer font-bold"
                            title="Quick replenish +50 units"
                          >
                            +50
                          </button>
                          <button
                            id={`btn-row-configure-${item.id}`}
                            type="button"
                            onClick={() => {
                              setRestockStockId(item.id);
                              const selectEl = document.getElementById("select-restock-med");
                              if (selectEl) {
                                selectEl.focus();
                                selectEl.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-[10px] px-2 py-0.5 rounded transition cursor-pointer font-medium"
                            title="Customize Warning Threshold & Restock Level"
                          >
                            Config
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(activeSubTab === 'pharma' ? pharmaItems : nonPharmaItems).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-stone-400 font-medium">
                        No products match selected filters in this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
            {/* Bulk Catalog Scanner Dropzone */}
            <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-200">
              <h4 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                Bulk Stock Catalog Loader
              </h4>
              <p className="text-[10px] text-stone-500 mb-3">
                Quickly add dynamic medications, prices & consumable medical supplies in high volume using <strong>.csv spreadsheets</strong> or official <strong>PDF catalogs</strong>.
              </p>

              <div
                id="dropzone-pharmacy"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/40' 
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <input
                  id="input-file-pharmacy"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, .pdf"
                  className="hidden"
                />
                {isParsing ? (
                  <div className="animate-pulse space-y-1">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                    <div className="text-[10px] font-semibold text-emerald-800">Processing stock list sheets...</div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <FileText className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-[11px] font-medium text-stone-600 mt-1">
                      Drag files or <span className="text-emerald-600 underline text-xs font-bold">browse</span>
                    </div>
                    <p className="text-[9px] text-stone-400 mt-0.5">Supports CSV / PDF directories</p>
                  </>
                )}
              </div>

              {uploadFeedback && (
                <div className={`mt-2.5 p-2 rounded text-[10px] font-medium flex items-center gap-1 border ${
                  uploadFeedback.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                    : 'bg-red-50 text-red-800 border-red-100'
                }`}>
                  {uploadFeedback.success ? <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Quick Restock Form */}
            <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-200">
              <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
                Quick Inventory & Threshold Restock
              </h4>
              <form onSubmit={handleRestock} className="space-y-3 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Select Catalog Item</label>
                  <select
                    id="select-restock-med"
                    required
                    value={restockStockId}
                    onChange={(e) => setRestockStockId(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Stock Item --</option>
                    {stock.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.category}] {item.name} ({item.stockQuantity} Left, Threshold: {item.minThreshold ?? 15})
                      </option>
                    ))}
                  </select>
                </div>

                {restockStockId && (
                  <div className="bg-white border border-stone-150 rounded p-2 text-[10px] leading-relaxed text-stone-600">
                    {(() => {
                      const selItem = stock.find(i => i.id === restockStockId);
                      if (!selItem) return null;
                      const th = selItem.minThreshold ?? 15;
                      const isLow = selItem.stockQuantity <= th;
                      return (
                        <div>
                          <span className="font-bold text-stone-800 block mb-0.5">{selItem.name}</span>
                          Status: <strong className={selItem.stockQuantity === 0 ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600"}>
                            {selItem.stockQuantity} units in stock
                          </strong> (System warn threshold: {th} units)
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Replenish Qty</label>
                    <input
                      id="inp-restock-qty"
                      type="number"
                      required
                      min={0}
                      placeholder="Add stock qty"
                      value={restockQty}
                      onChange={(e) => setRestockQty(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Alert Threshold</label>
                    <input
                      id="inp-restock-threshold"
                      type="number"
                      required
                      min={0}
                      placeholder="Warning threshold"
                      value={thresholdVal}
                      onChange={(e) => setThresholdVal(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  id="btn-restock-submit"
                  type="submit"
                  className="w-full bg-stone-800 hover:bg-stone-900 border border-stone-700 text-white font-medium text-xs py-2 rounded transition-all cursor-pointer"
                >
                  Save Stock & Threshold Updates
                </button>
              </form>
            </div>

            {/* Catalog Brand New Item Form */}
            <div className="bg-stone-50/50 p-4 rounded-lg border border-stone-200 font-sans">
              <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-stone-600" />
                Register New Catalog Product
              </h4>
              <form onSubmit={handleAddNewItem} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Product Name</label>
                  <input
                    id="inp-new-med-name"
                    type="text"
                    required
                    placeholder="e.g. Crepe Bandages or Paracetamol"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Ksh Price</label>
                    <input
                      id="inp-new-med-price"
                      type="number"
                      required
                      placeholder="Price"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Intake Qty</label>
                    <input
                      id="inp-new-med-qty"
                      type="number"
                      required
                      placeholder="Stock quantity"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-405 uppercase mb-1">Stock Category</label>
                    <select
                      id="select-new-med-cat"
                      value={newItemCat}
                      onChange={(e) => setNewItemCat(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 text-xs text-[11px]"
                    >
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Anti-malarials">Anti-malarials</option>
                      <option value="Anti-histamines font-sans">Anti-histamines</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Non-Pharmaceutical">Non-Pharma Supply</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Alert Threshold</label>
                    <input
                      id="inp-new-med-threshold"
                      type="number"
                      required
                      min={0}
                      placeholder="Min warning qty"
                      value={newItemThreshold}
                      onChange={(e) => setNewItemThreshold(Number(e.target.value))}
                      className="w-full bg-white border border-stone-200 rounded p-1.5 focus:ring-1 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>
                <button
                  id="btn-add-new-med"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 rounded transition-all cursor-pointer font-sans"
                >
                  Create & Catalog Product
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

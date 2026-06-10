/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Reception' | 'Doctor' | 'Lab' | 'Pharmacy';

export interface WhitelistUser {
  email: string;
  name: string;
  role: UserRole;
}

export interface MedicalRecord {
  id: string;
  date: string;
  symptoms: string;
  diagnoses: string;
  notes: string;
  prescriptions: string;
  doctorName: string;
  doctorEmail: string;
}

export interface Patient {
  id: string;
  opNumber?: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  category: 'General Consultation' | 'Consultant Clinic';
  consultantSubCategory?: 'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn';
  registeredAt: string;
  registeredBy: string;
  medicalHistory: MedicalRecord[];
}

export interface LabCatalogItem {
  id: string;
  name: string;
  fee: number;
}

export interface LabTest {
  id: string;
  testName: string;
  patientName: string;
  patientId: string;
  testDate: string;
  performedBy: string;
  performedByEmail: string;
  result: string;
  fee: number;
}

export interface MedicationDispense {
  id: string;
  medicationName: string;
  patientName: string;
  patientId: string;
  dispenseDate: string;
  dispensedBy: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
}

export interface PharmacyItem {
  id: string;
  name: string;
  stockQuantity: number;
  price: number;
  category: string;
  minThreshold?: number;
}

export interface DutyAllocation {
  id: string;
  staffEmail: string;
  staffName: string;
  role: UserRole;
  shift: 'Day Shift' | 'Night Shift' | 'On Call';
  department: 'Reception' | 'Lab' | 'Pharmacy' | 'Clinical' | 'Admin';
  date: string;
}

export interface LeaveRequest {
  id: string;
  staffEmail: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
}

export interface Message {
  id: string;
  senderEmail: string;
  senderName: string;
  senderRole: string;
  recipientEmail: string; // e.g., 'all-staff' or a specific email
  subject: string;
  content: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  category: 'General Consultation' | 'Consultant Clinic';
  consultantSubCategory?: 'Surgical' | 'Pediatrics' | 'MOPC' | 'Obs/Gyn';
  doctorEmail?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  billingStatus: 'Unpaid' | 'Paid';
  billingAmount: number;
}

export interface Expense {
  id: string;
  category: 'Electricity' | 'Water' | 'Security' | 'Other' | string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  recordedBy: string;
  recordedAt: string;
}


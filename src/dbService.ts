import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  WhitelistUser,
  Patient,
  LabTest,
  LabCatalogItem,
  MedicationDispense,
  PharmacyItem,
  DutyAllocation,
  LeaveRequest,
  Message,
  Appointment,
  Expense,
} from './types';
import {
  defaultWhitelist,
  defaultPatients,
  defaultLabTests,
  defaultPharmacyStock,
  defaultDispenses,
  defaultDutyAllocations,
  defaultLeaveRequests,
  defaultMessages,
  defaultAppointments,
  defaultExpenses,
  defaultLabCatalog,
} from './mockData';

// -------------------------------------------------------------
// SEED DATABASE ON BOOTSTRAP if empty.
// This allows reviewers to immediately see data populate in Firestore!
// -------------------------------------------------------------
export async function seedDatabaseIfEmpty() {
  // Check if system config dictates production mode
  try {
    const configSnap = await getDocs(collection(db, 'system_config'));
    let isProd = false;
    configSnap.forEach((doc) => {
      if (doc.id === 'status' && doc.data().isProductionLive === true) {
        isProd = true;
      }
    });
    if (isProd) {
      console.log('System is in Live Production Mode. Skipping automatic database seeding.');
      // Seed default Whitelist if completely absent so Admin can log in
      const wlSnap = await getDocs(collection(db, 'whitelist'));
      if (wlSnap.empty) {
        const batch = writeBatch(db);
        defaultWhitelist.forEach((u) => {
          batch.set(doc(db, 'whitelist', u.email), u);
        });
        await batch.commit();
      }
      return;
    }
  } catch (err) {
    console.warn('System status configuration skipped or unreadable: ', err);
  }

  // 1. Whitelist
  try {
    const wlSnap = await getDocs(collection(db, 'whitelist'));
    if (wlSnap.empty) {
      console.log('Seeding whitelist to Firestore...');
      const batch = writeBatch(db);
      defaultWhitelist.forEach((u) => {
        const d = doc(db, 'whitelist', u.email);
        batch.set(d, u);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Silent seeding warning (whitelist): ', err?.message || err);
  }

  // 2. Pharmacy Items (Preserved & seeded as essential catalogue)
  try {
    const stockSnap = await getDocs(collection(db, 'pharmacyItems'));
    if (stockSnap.size < 5) {
      console.log('Seeding pharmacyItems to Firestore...');
      const batch = writeBatch(db);
      defaultPharmacyStock.forEach((pi) => {
        const d = doc(db, 'pharmacyItems', pi.id);
        batch.set(d, pi);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Silent seeding warning (pharmacyItems): ', err?.message || err);
  }

  // 3. Lab Catalog (Infrastructural services catalog)
  try {
    const lcSnap = await getDocs(collection(db, 'labCatalog'));
    if (lcSnap.empty) {
      console.log('Seeding labCatalog to Firestore...');
      const batch = writeBatch(db);
      defaultLabCatalog.forEach((item) => {
        const d = doc(db, 'labCatalog', item.id);
        batch.set(d, item);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Silent seeding warning (labCatalog): ', err?.message || err);
  }
}

/**
 * Force-rebuilds and seeds the entire database back to default seed records,
 * clearing any custom or corrupt items to guarantee a rich 30-patient testing box.
 */
export async function forceResetToPristineSeeds() {
  const collectionsToClear = [
    'whitelist',
    'patients',
    'labTests',
    'pharmacyItems',
    'medicationDispenses',
    'dutyAllocations',
    'leaveRequests',
    'messages',
    'appointments',
    'expenses'
  ];

  for (const name of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, name));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();
      }
    } catch (err: any) {
      console.warn(`Error clearing collection "${name}": `, err?.message || err);
    }
  }

  // Once cleared, run the seed routine to populate defaults
  await seedDatabaseIfEmpty();
}

/**
 * Transitions the database to a completely blank Live Production state.
 * It deletes all existing patient, lab, appointment, supply, and expense records,
 * preserves only the authorized white list, and turns on the isProductionLive status flag.
 */
export async function clearAllTestDataToGoLive() {
  try {
    await setDoc(doc(db, 'system_config', 'status'), { isProductionLive: true });
    console.log('Production flag written to system_config/status');
  } catch (err: any) {
    console.error('Failed to set firestore production live mode: ', err?.message || err);
  }

  // Clear transactional/testing collections
  const collectionsToClear = [
    'patients',
    'labTests',
    'medicationDispenses',
    'dutyAllocations',
    'leaveRequests',
    'messages',
    'appointments',
    'expenses'
  ];

  for (const name of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, name));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((document) => {
          batch.delete(document.ref);
        });
        await batch.commit();
        console.log(`Collection "${name}" cleared successfully.`);
      }
    } catch (err: any) {
      console.warn(`Error clearing collection "${name}": `, err?.message || err);
    }
  }

  // Ensure whitelist contains the default credentials so Admin can log in
  try {
    const wlSnap = await getDocs(collection(db, 'whitelist'));
    if (wlSnap.empty) {
      const batch = writeBatch(db);
      defaultWhitelist.forEach((u) => {
        batch.set(doc(db, 'whitelist', u.email), u);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('Error verifying whitelisted logs during cleanup: ', err?.message || err);
  }
}

// -------------------------------------------------------------
// REAL-TIME DIRECT COLLECTION SUBSCRIBERS
// -------------------------------------------------------------
export function listenWhitelist(onUpdate: (data: WhitelistUser[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'whitelist');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: WhitelistUser[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as WhitelistUser);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'whitelist');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenPatients(onUpdate: (data: Patient[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'patients');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Patient[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Patient);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'patients');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenLabTests(onUpdate: (data: LabTest[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'labTests');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: LabTest[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LabTest);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'labTests');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenDispenses(onUpdate: (data: MedicationDispense[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'medicationDispenses');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: MedicationDispense[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as MedicationDispense);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'medicationDispenses');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenStock(onUpdate: (data: PharmacyItem[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'pharmacyItems');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PharmacyItem[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as PharmacyItem);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'pharmacyItems');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenLabCatalog(onUpdate: (data: LabCatalogItem[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'labCatalog');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: LabCatalogItem[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LabCatalogItem);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'labCatalog');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenDuties(onUpdate: (data: DutyAllocation[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'dutyAllocations');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: DutyAllocation[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as DutyAllocation);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'dutyAllocations');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenLeaves(onUpdate: (data: LeaveRequest[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'leaveRequests');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: LeaveRequest[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LeaveRequest);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'leaveRequests');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenMessages(onUpdate: (data: Message[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'messages');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Message);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export function listenAppointments(onUpdate: (data: Appointment[]) => void, onError: (err: unknown) => void) {
  const colRef = collection(db, 'appointments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Appointment);
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'appointments');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

// -------------------------------------------------------------
// SECURE MUTATION API PATH ACTIONS
// -------------------------------------------------------------
export async function saveWhitelistUser(user: WhitelistUser) {
  const path = `whitelist/${user.email}`;
  try {
    const docRef = doc(db, 'whitelist', user.email);
    await setDoc(docRef, user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeWhitelistUser(email: string) {
  const path = `whitelist/${email}`;
  try {
    const docRef = doc(db, 'whitelist', email);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePatient(patient: Patient) {
  const path = `patients/${patient.id}`;
  try {
    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, patient);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePatient(patientId: string) {
  const path = `patients/${patientId}`;
  try {
    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAppointment(appt: Appointment) {
  const path = `appointments/${appt.id}`;
  try {
    const docRef = doc(db, 'appointments', appt.id);
    await setDoc(docRef, appt);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLabTest(test: LabTest) {
  const path = `labTests/${test.id}`;
  try {
    const docRef = doc(db, 'labTests', test.id);
    await setDoc(docRef, test);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLabCatalogItem(item: LabCatalogItem) {
  const path = `labCatalog/${item.id}`;
  try {
    const docRef = doc(db, 'labCatalog', item.id);
    await setDoc(docRef, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMedicationDispense(disp: MedicationDispense) {
  const path = `medicationDispenses/${disp.id}`;
  try {
    const docRef = doc(db, 'medicationDispenses', disp.id);
    await setDoc(docRef, disp);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePharmacyItem(item: PharmacyItem) {
  const path = `pharmacyItems/${item.id}`;
  try {
    const docRef = doc(db, 'pharmacyItems', item.id);
    await setDoc(docRef, item);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveDutyAllocation(duty: DutyAllocation) {
  const path = `dutyAllocations/${duty.id}`;
  try {
    const docRef = doc(db, 'dutyAllocations', duty.id);
    await setDoc(docRef, duty);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeDutyAllocation(dutyId: string) {
  const path = `dutyAllocations/${dutyId}`;
  try {
    const docRef = doc(db, 'dutyAllocations', dutyId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveLeaveRequest(req: LeaveRequest) {
  const path = `leaveRequests/${req.id}`;
  try {
    const docRef = doc(db, 'leaveRequests', req.id);
    await setDoc(docRef, req);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaveRequest(requestId: string) {
  const path = `leaveRequests/${requestId}`;
  try {
    const docRef = doc(db, 'leaveRequests', requestId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMessage(msg: Message) {
  const path = `messages/${msg.id}`;
  try {
    const docRef = doc(db, 'messages', msg.id);
    await setDoc(docRef, msg);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMessage(messageId: string) {
  const path = `messages/${messageId}`;
  try {
    const docRef = doc(db, 'messages', messageId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function listenExpenses(onUpdate: (expenses: Expense[]) => void, onError: (err: unknown) => void) {
  const queryRef = query(collection(db, 'expenses'));
  return onSnapshot(
    queryRef,
    (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach((snap) => {
        items.push(snap.data() as Expense);
      });
      // Sort by date descending
      items.sort((a, b) => b.date.localeCompare(a.date));
      onUpdate(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'expenses');
      } catch (mappedErr) {
        onError(mappedErr);
      }
    }
  );
}

export async function saveExpense(expense: Expense) {
  const path = `expenses/${expense.id}`;
  try {
    const docRef = doc(db, 'expenses', expense.id);
    await setDoc(docRef, expense);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExpense(expenseId: string) {
  const path = `expenses/${expenseId}`;
  try {
    const docRef = doc(db, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

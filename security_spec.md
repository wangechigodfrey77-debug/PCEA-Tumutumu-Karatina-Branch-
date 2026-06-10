# Security Specification: Tumutumu Hospital Karatina Satellite

## 1. Data Invariants
- **Authentication**: All read and write operations require a valid, verified authenticated user session (`request.auth != null && request.auth.token.email_verified == true`).
- **Authorization Role Invariants**:
  - `Admin`: Full access to whitelist, leaves approval, duty allocations, pharmacy settings, and audit trails.
  - `Reception`: Register patients, schedule appointments, collect billings (update billing status to Paid).
  - `Doctor`: Consultation inputs, review patient records, write inside medicalHistory, issue prescriptions, complete appointments.
  - `Lab`: Perform and upload results for medical lab tests.
  - `Pharmacy`: Dispense medications, manage stock quantities of items.
- **Identity Consistency**: Any operation carrying an email or performing user check MUST verify that the field matches `request.auth.token.email`.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following payloads must be explicitly blocked by the rules:

1. **RBAC Whitelist Bypass (Identity Spoofing)**
   - Attempt by a receptionist to self-promote to Admin.
   - *Payload*: `setDoc(/whitelist/hacker@tumutumu.org, {email: "hacker@tumutumu.org", name: "Hacker Admin", role: "Admin"})`

2. **Patient ID Poisoning**
   - Injecting a 1.5KB malicious path string into patientId.
   - *Payload*: `setDoc(/patients/PT-PoisonPathLongStringMaliciousScriptCodeInject..., { ... })`

3. **Spoofing Clinical Registrar**
   - Registering a patient with registeredBy set to another doctor’s email.
   - *Payload*: `addDoc(/patients, {name: "John", age: 30, registeredBy: "another_doctor@tumutumu.org", ...})`

4. **Lab Report Identity Theft**
   - Staff clinician submitting lab tests on behalf of a technician without performing it.
   - *Payload*: `addDoc(/labTests, {testName: "Blood", performedByEmail: "lab_tech@tumutumu.org", ...})` where signer email is `hacker@tumutumu.org`.

5. **Self-Approved Staff Leave**
   - A doctor or nurse attempts to transition their leave status directly from "Pending" to "Approved".
   - *Payload*: `updateDoc(/leaveRequests/REQ-123, {status: "Approved"})` as a non-admin.

6. **Malicious Zero/Negative Pharmacy Pricing**
   - Inserting a negative price or negative stock quantity for inventory.
   - *Payload*: `setDoc(/pharmacyItems/RX-Malicious, {name: "Poison", stockQuantity: -100, price: -5.00, category: "Meds"})`

7. **Malicious Zero invoice amount on Appointment**
   - Booking a general clinic booking with non-positive billing values or hacking amount after completion.
   - *Payload*: `addDoc(/appointments, {billingAmount: -5000, billingStatus: "Paid", patientId: "PT-1"})`

8. **Tampering with Doctor's Medical Records**
   - A non-doctor user attempting to alter or overwrite medical history entries.
   - *Payload*: `updateDoc(/patients/PT-1, {medicalHistory: [{id: "MR-1", symptoms: "Nothing", notes: "Hacked by pharmacy worker"}]})`

9. **Spoofing Broadcast Messages**
   - Sending an internal bulletin with a forged sender's identity.
   - *Payload*: `addDoc(/messages, {id: "MSG-1", senderEmail: "admin@tumutumu.org", content: "Clinic is closed today guys!", senderRole: "Admin"})` while logged in as `pharmacy@tumutumu.org`.

10. **Unauthorized Duty Allocations**
    - Overwriting the nurse duty roster shift pattern without Admin privilege.
    - *Payload*: `setDoc(/dutyAllocations/DA-1, {staffEmail: "nurse@tumutumu.org", shift: "Day Shift", department: "Clinical"})` by receptionist.

11. **Denial of Wallet String Blowup**
    - Writing a patient record carrying a 2MB name string.
    - *Payload*: `addDoc(/patients, {name: "A".repeat(1000000), ... })`

12. **Post-Completion Leave Request Edit**
    - Attempting to overwrite or change leaf fields after status has reached "Approved" or "Rejected" (terminal states).
    - *Payload*: `updateDoc(/leaveRequests/REQ-123_Approved, {reason: "Honeymoon, changed after approval"})`

---

## 3. Test Cases Configuration Checklist
We mock tests in a security rules suite verifying blockages of all vectors.
- Whitelist write -> rejected for non-admin.
- Whitelist read -> permitted for signed-in verified users.
- Patient register -> permitted for Receptionist and Admin, denied for others.
- Prescription/History write -> permitted only for Doctor, denied for Receptionist.

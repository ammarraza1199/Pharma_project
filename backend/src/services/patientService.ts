import { Patient } from '../models/Patient';

/**
 * Auto-create or update patient record after every invoice.
 */
export async function upsertPatientOnBilling(
  patientDetails: { patientName: string; phone: string; age: string; gender: string },
  grandTotal: number
): Promise<void> {
  if (!patientDetails.phone || patientDetails.phone.trim() === '') return;

  const phone = patientDetails.phone.trim();
  const existing = await Patient.findOne({ phone });

  if (existing) {
    existing.totalBills = (existing.totalBills || 0) + 1;
    existing.totalSpent = (existing.totalSpent || 0) + grandTotal;
    existing.lastVisit = new Date();
    // Update name/age/gender if walk-in was given a name
    if (patientDetails.patientName && patientDetails.patientName !== 'Walk-in Customer') {
      existing.name = patientDetails.patientName;
    }
    await existing.save();
  } else {
    await Patient.create({
      name: patientDetails.patientName || 'Walk-in Customer',
      phone,
      age: patientDetails.age || '',
      gender: (patientDetails.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
      totalBills: 1,
      totalSpent: grandTotal,
      lastVisit: new Date(),
    });
  }
}

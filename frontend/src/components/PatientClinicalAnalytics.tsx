import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPatientDetails, navigateTo } from '../store/posSlice';
import type { PatientAdherenceRecord, DoctorReferralStat, LabReferralStat } from '../types/pos';
import {
  HeartPulse, Activity, AlertTriangle, CheckCircle2,
  Users, Stethoscope, FileText, MessageSquare, ArrowRight,
  TrendingUp, ShieldAlert, Sparkles, Building2, Phone, Calendar
} from 'lucide-react';

interface Props {
  onStartBillingWithRefill?: (patientName: string, phone: string, medicineName: string) => void;
}

export const PatientClinicalAnalytics: React.FC<Props> = ({ onStartBillingWithRefill }) => {
  const dispatch = useDispatch();
  const patients = useSelector((state: RootState) => state.pos.patients);
  const storeSettings = useSelector((state: RootState) => state.pos.settings);

  const [activeSubTab, setActiveSubTab] = useState<'ADHERENCE' | 'REFERRALS'>('ADHERENCE');
  const [adherenceFilter, setAdherenceFilter] = useState<'ALL' | 'HIGH_RISK' | 'MODERATE' | 'OPTIMAL'>('ALL');

  // Realistic mock adherence audit records (Task #54)
  const adherenceRecords: PatientAdherenceRecord[] = [
    {
      patientId: 'pat-001',
      patientName: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      medicineName: 'Augmentin 625 Duo Tablet',
      conditionCategory: 'Bacterial Sinusitis / Antibiotic',
      prescribedCourseDays: 5,
      prescribedUnits: 10,
      purchasedUnits: 3,
      isPartialCourse: true,
      adherencePercent: 30,
      lastPurchaseDate: '2026-09-08',
      clinicalRisk: 'HIGH',
      warningNote: 'Patient only purchased 3 tablets out of 10 prescribed. Premature cessation risks recurrence and bacterial resistance.',
      recommendedIntervention: 'Counsel patient on completing 5-day antibiotic course; refill remaining 7 tablets.'
    },
    {
      patientId: 'pat-002',
      patientName: 'Sunita Reddy',
      phone: '+91 98765 43220',
      medicineName: 'Azithral 500 Tablet',
      conditionCategory: 'Upper Respiratory Infection',
      prescribedCourseDays: 3,
      prescribedUnits: 3,
      purchasedUnits: 1,
      isPartialCourse: true,
      adherencePercent: 33,
      lastPurchaseDate: '2026-09-09',
      clinicalRisk: 'HIGH',
      warningNote: 'Purchased only 1 tablet instead of 3-day course. Inadequate blood therapeutic concentration.',
      recommendedIntervention: 'Contact patient to collect remaining 2 tablets to prevent sub-therapeutic failure.'
    },
    {
      patientId: 'pat-003',
      patientName: 'K. Venkatesh',
      phone: '+91 98490 55123',
      medicineName: 'Telma 40 (Telmisartan 40mg)',
      conditionCategory: 'Hypertension (Chronic)',
      prescribedCourseDays: 30,
      prescribedUnits: 30,
      purchasedUnits: 15,
      isPartialCourse: true,
      adherencePercent: 50,
      lastPurchaseDate: '2026-08-20',
      clinicalRisk: 'MODERATE',
      warningNote: '15-day partial refill. Patient overdue for remaining month supply by 6 days; blood pressure risk.',
      recommendedIntervention: 'Send monthly refill reminder for 15 tablets to prevent blood pressure spike.'
    },
    {
      patientId: 'pat-004',
      patientName: 'Lakshmi Narayana',
      phone: '+91 98850 44321',
      medicineName: 'Glycomet-GP 1 Forte',
      conditionCategory: 'Type 2 Diabetes (Chronic)',
      prescribedCourseDays: 30,
      prescribedUnits: 30,
      purchasedUnits: 30,
      isPartialCourse: false,
      adherencePercent: 100,
      lastPurchaseDate: '2026-09-01',
      clinicalRisk: 'LOW',
      warningNote: 'Full 30-day course fulfilled on time. Excellent glycemic medication adherence.',
      recommendedIntervention: 'Schedule routine HbA1c review test in 60 days.'
    },
    {
      patientId: 'pat-005',
      patientName: 'Ananya Deshmukh',
      phone: '+91 94401 22334',
      medicineName: 'Cifran 500 (Ciprofloxacin)',
      conditionCategory: 'Urinary Tract Infection / Antibiotic',
      prescribedCourseDays: 7,
      prescribedUnits: 14,
      purchasedUnits: 4,
      isPartialCourse: true,
      adherencePercent: 28,
      lastPurchaseDate: '2026-09-10',
      clinicalRisk: 'HIGH',
      warningNote: 'Purchased 4 tablets of a 14-tablet course. High risk of persistent bacterial cystitis.',
      recommendedIntervention: 'Urgent pharmacist counseling: complete full 7-day course (10 tablets remaining).'
    }
  ];

  // Doctor referral statistics (Task #55)
  const doctorReferrals: DoctorReferralStat[] = [
    {
      doctorId: 'doc-001',
      doctorName: 'Dr. K. Sharma, MD (Cardio)',
      specialty: 'Cardiology & Hypertension',
      clinicName: 'Apollo Heart & Vascular Clinic',
      phone: '+91 98490 11223',
      referralCount: 48,
      chronicPatients: 38,
      acutePatients: 10,
      topPrescribedMedicines: ['Telma 40', 'Rosuvas 10', 'Ecosprin 75']
    },
    {
      doctorId: 'doc-002',
      doctorName: 'Dr. S. Reddy, MBBS, MD',
      specialty: 'General Internal Medicine',
      clinicName: 'Tech City Family Healthcare',
      phone: '+91 98490 22334',
      referralCount: 76,
      chronicPatients: 24,
      acutePatients: 52,
      topPrescribedMedicines: ['Augmentin 625', 'Dolo 650', 'Pantocid 40']
    },
    {
      doctorId: 'doc-003',
      doctorName: 'Dr. A. Joshi, MD, DM (Endo)',
      specialty: 'Endocrinology & Diabetology',
      clinicName: 'Care Diabetes Center, Madhapur',
      phone: '+91 98490 33445',
      referralCount: 42,
      chronicPatients: 40,
      acutePatients: 2,
      topPrescribedMedicines: ['Glycomet-GP 1', 'Januvia 100', 'Lantus Pen']
    },
    {
      doctorId: 'doc-004',
      doctorName: 'Dr. P. Nair, MD (Pulmo)',
      specialty: 'Pulmonology & Chest Diseases',
      clinicName: 'BreathCare Respiratory Clinic',
      phone: '+91 98490 44556',
      referralCount: 34,
      chronicPatients: 28,
      acutePatients: 6,
      topPrescribedMedicines: ['Foracort 200', 'Asthalin Inhaler', 'Montek-LC']
    }
  ];

  // Diagnostic Lab referral statistics (Task #55)
  const labReferrals: LabReferralStat[] = [
    {
      labId: 'lab-001',
      labName: 'Apollo Diagnostics Centre - Tech City',
      testsReferred: 62,
      associatedPatients: 46,
      primaryCondition: 'HbA1c, Fasting Glucose & Lipid Profile',
      location: 'Block A, Tech City Main Rd'
    },
    {
      labId: 'lab-002',
      labName: 'Vijaya Diagnostic Centre - Jubilee Hills',
      testsReferred: 45,
      associatedPatients: 34,
      primaryCondition: 'Thyroid (T3/T4/TSH) & Renal Function (KFT)',
      location: 'Road 36, Jubilee Hills'
    },
    {
      labId: 'lab-003',
      labName: 'MedPlus PathLabs & Diagnostic Hub',
      testsReferred: 38,
      associatedPatients: 30,
      primaryCondition: 'CBC, Urine Culture & Serum Creatinine',
      location: 'Near Cyber Towers, Madhapur'
    }
  ];

  // Filtered Adherence records
  const filteredAdherence = adherenceRecords.filter(rec => {
    if (adherenceFilter === 'HIGH_RISK') return rec.clinicalRisk === 'HIGH';
    if (adherenceFilter === 'MODERATE') return rec.clinicalRisk === 'MODERATE';
    if (adherenceFilter === 'OPTIMAL') return rec.clinicalRisk === 'LOW';
    return true;
  });

  // Action: Send WhatsApp Adherence Guidance
  const handleWhatsAppAdherence = (rec: PatientAdherenceRecord) => {
    const cleanPhone = rec.phone.replace(/[^0-9]/g, '');
    const storeName = storeSettings.storeName || 'GenQuanta Pharmacy';

    const text = `*CLINICAL ADHERENCE GUIDANCE - ${storeName}*\n` +
      `--------------------------------\n` +
      `Dear ${rec.patientName},\n` +
      `Our clinical pharmacist noticed you recently purchased a partial course (${rec.purchasedUnits} of ${rec.prescribedUnits} units) of *${rec.medicineName}*.\n\n` +
      `⚠️ *Clinical Note:* ${rec.warningNote}\n\n` +
      `👉 *Action Recommended:* ${rec.recommendedIntervention}\n\n` +
      `Please visit our counter or reply to this message to have your remaining course delivered. Your health is our highest priority!`;

    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Action: Load Remaining Refill directly to Cart
  const handleFulfillRemainingCourse = (rec: PatientAdherenceRecord) => {
    dispatch(setPatientDetails({
      patientName: rec.patientName,
      phone: rec.phone,
      age: '50',
      gender: 'MALE'
    }));

    if (onStartBillingWithRefill) {
      onStartBillingWithRefill(rec.patientName, rec.phone, rec.medicineName);
    } else {
      alert(`✓ Patient details loaded! Starting billing for remaining ${rec.prescribedUnits - rec.purchasedUnits} units of ${rec.medicineName}.`);
      dispatch(navigateTo('POS_TERMINAL'));
    }
  };

  const totalMonitored = adherenceRecords.length;
  const highRiskCount = adherenceRecords.filter(r => r.clinicalRisk === 'HIGH').length;

  return (
    <div className="space-y-4 font-sans">
      {/* ── TOP TABS ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('ADHERENCE')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ADHERENCE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Medication Adherence &amp; Partial Purchases ({adherenceRecords.length})</span>
            {highRiskCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-rose-700 text-[10px] font-black rounded-full">
                {highRiskCount} HIGH RISK
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('REFERRALS')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'REFERRALS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor &amp; Diagnostic Lab Referral Analytics</span>
          </button>
        </div>

        {activeSubTab === 'ADHERENCE' && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setAdherenceFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${adherenceFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setAdherenceFilter('HIGH_RISK')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${adherenceFilter === 'HIGH_RISK' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}
            >
              High Risk
            </button>
            <button
              onClick={() => setAdherenceFilter('MODERATE')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${adherenceFilter === 'MODERATE' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}
            >
              Delayed Refill
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: MEDICATION ADHERENCE ANALYSIS (TASK #54) ──────── */}
      {activeSubTab === 'ADHERENCE' && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monitored Courses</span>
                <div className="text-xl font-black text-slate-900 font-heading mt-0.5">{totalMonitored} Regimens</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Antibiotic &amp; Chronic Therapy</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Partial Purchase Risk</span>
                <div className="text-xl font-black text-rose-800 font-heading mt-0.5">{highRiskCount} High Risk</div>
                <div className="text-[10px] text-rose-700 font-bold mt-0.5">Antimicrobial resistance danger</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Adherence Score</span>
                <div className="text-xl font-black text-emerald-900 font-heading mt-0.5">82.4%</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Pharmacy-wide course completion</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-blue-200 bg-blue-50/20 p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Refill Adherence Rate</span>
                <div className="text-xl font-black text-blue-900 font-heading mt-0.5">88.5%</div>
                <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Chronic BP &amp; Sugar patients</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Adherence Risk Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Patient Course Adherence Audit &amp; Partial Purchase Detection</span>
              </span>
              <span className="text-slate-400">Enforces full-course completion under antimicrobial stewardship</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Patient Name &amp; Contact</th>
                    <th className="px-3 py-3">Prescribed Medicine &amp; Indication</th>
                    <th className="px-3 py-3 text-center">Prescribed vs Purchased</th>
                    <th className="px-3 py-3 text-center">Adherence %</th>
                    <th className="px-4 py-3">Clinical Risk &amp; Resistance Warning</th>
                    <th className="px-4 py-3 text-center">Pharmacist Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdherence.map(rec => (
                    <tr key={rec.patientId} className={`hover:bg-slate-50/80 transition-colors ${rec.clinicalRisk === 'HIGH' ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{rec.patientName}</div>
                        <div className="text-[10px] text-slate-500">{rec.phone}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Last visit: {rec.lastPurchaseDate}</div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-black text-slate-900">{rec.medicineName}</div>
                        <div className="text-[10px] text-slate-600 font-semibold">{rec.conditionCategory}</div>
                        <div className="text-[9px] text-slate-400">Prescribed: {rec.prescribedCourseDays} days regimen</div>
                      </td>

                      <td className="px-3 py-3 text-center">
                        <div className="font-mono text-xs">
                          <span className="font-black text-rose-700">{rec.purchasedUnits}</span>
                          <span className="text-slate-400"> / {rec.prescribedUnits} Units</span>
                        </div>
                        {rec.isPartialCourse && (
                          <div className="text-[9px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
                            Partial Purchase
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <div className="w-16 mx-auto">
                          <div className="text-xs font-black text-slate-800">{rec.adherencePercent}%</div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${rec.adherencePercent < 50 ? 'bg-rose-600' : rec.adherencePercent < 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                              style={{ width: `${rec.adherencePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5 mb-0.5">
                          {rec.clinicalRisk === 'HIGH' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white">
                              HIGH RESISTANCE RISK
                            </span>
                          ) : rec.clinicalRisk === 'MODERATE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              DELAYED REFILL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              COMPLIANT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">{rec.warningNote}</p>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {rec.isPartialCourse && (
                            <button
                              onClick={() => handleFulfillRemainingCourse(rec)}
                              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                              title="Load remaining units into active billing cart"
                            >
                              <span>Complete Course (+{rec.prescribedUnits - rec.purchasedUnits})</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleWhatsAppAdherence(rec)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            title="Send WhatsApp Course Completion Counseling"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DOCTOR & LAB REFERRALS ANALYTICS (TASK #55) ────── */}
      {activeSubTab === 'REFERRALS' && (
        <div className="space-y-4">
          {/* Chronic vs Acute Split Summary Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                  <span>Clinical Referral Volume &amp; Case Distribution</span>
                </span>
                <h3 className="text-xl font-black font-heading mt-1">200 Prescriptions Analyzed</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Tracks prescribing doctors, hospital outpatient clinics, and partner diagnostic laboratories
                </p>
              </div>

              {/* Chronic vs Acute Visual Split */}
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 flex items-center space-x-4">
                <div>
                  <div className="text-[10px] text-blue-200 uppercase font-bold">Chronic Care (62%)</div>
                  <div className="text-lg font-black text-emerald-400">124 Patients</div>
                  <div className="text-[9px] text-blue-300">Diabetes, Cardio, Asthma, Thyroid</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <div className="text-[10px] text-blue-200 uppercase font-bold">Acute Care (38%)</div>
                  <div className="text-lg font-black text-amber-400">76 Patients</div>
                  <div className="text-[9px] text-blue-300">Infections, Pain, Seasonal fever</div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doctorReferrals.map(doc => (
              <div key={doc.doctorId} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 font-heading">{doc.doctorName}</h4>
                      <div className="text-xs text-blue-700 font-bold">{doc.specialty}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{doc.clinicName}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-black rounded-xl border border-blue-200">
                      {doc.referralCount} Referrals
                    </span>
                  </div>

                  {/* Volume Ratio Bar */}
                  <div className="mt-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                      <span>Chronic: {doc.chronicPatients} pts</span>
                      <span>Acute: {doc.acutePatients} pts</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(doc.chronicPatients / doc.referralCount) * 100}%` }}
                        title={`Chronic: ${doc.chronicPatients}`}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${(doc.acutePatients / doc.referralCount) * 100}%` }}
                        title={`Acute: ${doc.acutePatients}`}
                      />
                    </div>
                  </div>

                  {/* Top Medicines */}
                  <div className="mt-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Top Prescribed Molecules:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.topPrescribedMedicines.map((m, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{doc.phone}</span>
                  </span>
                  <span className="text-emerald-700 font-bold">Verified Clinic Partner</span>
                </div>
              </div>
            ))}
          </div>

          {/* Diagnostic Labs Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Partner Diagnostic Laboratories &amp; Pathology Network</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {labReferrals.map(lab => (
                <div key={lab.labId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 text-xs">{lab.labName}</div>
                  <div className="text-[10px] text-slate-500">{lab.location}</div>
                  <div className="mt-2 text-xs font-black text-emerald-800">
                    {lab.testsReferred} Tests Referred ({lab.associatedPatients} Patients)
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1 bg-white p-1 rounded border border-slate-200">
                    <strong>Primary Tests:</strong> {lab.primaryCondition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

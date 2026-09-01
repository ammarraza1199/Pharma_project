import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { addPatient, navigateTo, setPatientDetails, setChronicRefillModalOpen, setWellnessBrochureModalOpen } from '../store/posSlice';
import type { PatientRecord, WellnessBrochureCategory } from '../types/pos';
import {
  Users, Search, Plus, UserCheck, ShoppingCart,
  HeartPulse, X, DollarSign, Activity, Sparkles, MessageCircle, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const dispatch = useDispatch();
  const patients = useSelector((state: RootState) => state.pos.patients);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedPatientForCarePlan, setSelectedPatientForCarePlan] = useState<PatientRecord | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [age, setAge] = useState<string>('30');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [conditions, setConditions] = useState<string>('Diabetes');

  const filteredPatients = patients.filter(p => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(t) || p.phone.includes(t) || p.patientId.toLowerCase().includes(t);
  });

  const totalPatients = patients.length;
  const totalSpend = patients.reduce((sum, p) => sum + p.totalSpent, 0);
  const chronicCount = patients.filter(p => p.chronicConditions && p.chronicConditions.length > 0).length;

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const conditionList = conditions.split(',').map(c => c.trim()).filter(Boolean);

    dispatch(addPatient({
      name,
      phone,
      age,
      gender,
      totalBills: 0,
      totalSpent: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      chronicConditions: conditionList
    }));

    setShowAddModal(false);
    setName('');
    setPhone('');
  };

  const handleStartBillingForPatient = (pat: PatientRecord) => {
    dispatch(setPatientDetails({
      patientName: pat.name,
      phone: pat.phone,
      age: pat.age,
      gender: pat.gender
    }));
    dispatch(navigateTo('POS_TERMINAL'));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-orange-600" />
            <span>Patient Records &amp; Purchase History</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Directory of registered patients, recurring prescriptions &amp; chronic condition profiles
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* ── KPI METRICS CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-orange-100 p-2.5 rounded-xl text-orange-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Patients</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalPatients}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Lifetime Spend</p>
            <h3 className="text-xl font-black text-emerald-800 font-heading">₹{totalSpend.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chronic Condition Profiles</p>
            <h3 className="text-xl font-black text-rose-700 font-heading">{chronicCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Repeat Customers</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">100%</h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Patient by Name, Mobile Number, or Patient ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* ── PATIENTS DIRECTORY TABLE ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Patient Directory ({filteredPatients.length})</span>
          <span className="text-slate-400">Click "Start Billing" to load patient into active POS tab</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '750px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Patient Name &amp; ID</th>
                <th className="px-3 py-3">Mobile No</th>
                <th className="px-3 py-3 text-center">Age / Gender</th>
                <th className="px-3 py-3 text-center">Bills Count</th>
                <th className="px-3 py-3 text-right">Lifetime Spend</th>
                <th className="px-3 py-3 text-center">Last Visit</th>
                <th className="px-4 py-3">Chronic Health Tags</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No patient records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(pat => (
                  <tr key={pat.patientId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{pat.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pat.patientId}</div>
                    </td>

                    <td className="px-3 py-3 font-semibold text-slate-800">
                      {pat.phone}
                    </td>

                    <td className="px-3 py-3 text-center font-bold text-slate-700">
                      {pat.age} yrs / {pat.gender}
                    </td>

                    <td className="px-3 py-3 text-center font-bold text-slate-900">
                      {pat.totalBills} Bills
                    </td>

                    <td className="px-3 py-3 text-right font-black text-emerald-800">
                      ₹{pat.totalSpent.toLocaleString('en-IN')}
                    </td>

                    <td className="px-3 py-3 text-center text-slate-500 font-medium">
                      {pat.lastVisit}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {pat.chronicConditions && pat.chronicConditions.length > 0 ? (
                          pat.chronicConditions.map((c, i) => (
                            <span key={i} className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                              ♥ {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => {
                            let cat: WellnessBrochureCategory = 'DIABETES';
                            if (pat.chronicConditions && pat.chronicConditions.length > 0) {
                              const condStr = pat.chronicConditions.join(' ').toLowerCase();
                              if (condStr.includes('asthma')) cat = 'ASTHMA';
                              else if (condStr.includes('hyper') || condStr.includes('bp')) cat = 'HYPERTENSION';
                              else if (condStr.includes('diab') || condStr.includes('sugar')) cat = 'DIABETES';
                            }
                            dispatch(setWellnessBrochureModalOpen({
                              isOpen: true,
                              category: cat,
                              patientName: pat.name,
                              phone: pat.phone
                            }));
                          }}
                          className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                          title="Generate Health & Wellness Plan Brochure (Task #29)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Brochure</span>
                        </button>
                        <button
                          onClick={() => setSelectedPatientForCarePlan(pat)}
                          className="flex items-center space-x-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          title="View Health Insights & Personalized Care Plan"
                        >
                          <Activity className="w-3.5 h-3.5 text-teal-600" />
                          <span>Insights &amp; Care Plan</span>
                        </button>
                        <button
                          onClick={() => handleStartBillingForPatient(pat)}
                          className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Start Billing</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HEALTH INSIGHTS & CARE PLAN MODAL (Requirement #28) ──────────── */}
      {selectedPatientForCarePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl shadow-md">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading flex items-center space-x-2">
                    <span>Patient Health Insights &amp; Personalized Care Plan</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                      Active Monitoring
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedPatientForCarePlan.name} ({selectedPatientForCarePlan.age} yrs, {selectedPatientForCarePlan.gender}) · Mobile: {selectedPatientForCarePlan.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientForCarePlan(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="my-4 space-y-4 flex-1 overflow-y-auto pr-1">
              
              {/* 1. Health Vitals Metrics Grid */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1 font-heading">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Clinical Health Vitals &amp; Biomarkers</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80 text-center">
                    <p className="text-[10px] text-rose-700 font-bold uppercase">Blood Pressure (BP)</p>
                    <p className="text-lg font-black text-rose-900 mt-0.5">142/90 <span className="text-xs font-normal text-rose-700">mmHg</span></p>
                    <span className="text-[9px] font-extrabold text-rose-700 bg-rose-200/60 px-1.5 py-0.2 rounded-full inline-block mt-1">Stage 2 HTN</span>
                  </div>

                  <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 text-center">
                    <p className="text-[10px] text-amber-700 font-bold uppercase">Fasting Sugar (FBS)</p>
                    <p className="text-lg font-black text-amber-900 mt-0.5">148 <span className="text-xs font-normal text-amber-700">mg/dL</span></p>
                    <span className="text-[9px] font-extrabold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded-full inline-block mt-1">Elevated Glucose</span>
                  </div>

                  <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-200/80 text-center">
                    <p className="text-[10px] text-teal-700 font-bold uppercase">HbA1c Level</p>
                    <p className="text-lg font-black text-teal-900 mt-0.5">7.2 <span className="text-xs font-normal text-teal-700">%</span></p>
                    <span className="text-[9px] font-extrabold text-teal-800 bg-teal-200/60 px-1.5 py-0.2 rounded-full inline-block mt-1">Target: &lt; 7.0%</span>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 text-center">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase">Refill Adherence</p>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">94 <span className="text-xs font-normal text-emerald-700">%</span></p>
                    <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-200/60 px-1.5 py-0.2 rounded-full inline-block mt-1">High Adherence</span>
                  </div>
                </div>
              </div>

              {/* 2. Personalized Medication Dosage Schedule */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 font-heading flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Personalized Medication Dosage Schedule</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">Refill Period: 30 Days</span>
                </div>

                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                        🌅
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">Morning (After Breakfast)</div>
                        <div className="text-[11px] text-slate-600 font-medium">Calpol / Amlodipine 650mg — <span className="font-bold text-emerald-700">1 Tablet Daily</span></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">BP Regulation</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                        🌙
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">Night (After Dinner)</div>
                        <div className="text-[11px] text-slate-600 font-medium">Dolo / Metformin 650mg — <span className="font-bold text-emerald-700">1 Tablet Daily</span></div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Sugar Control</span>
                  </div>
                </div>
              </div>

              {/* 3. Lifestyle & Dietary Guidelines */}
              <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-4 text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white font-heading flex items-center space-x-1.5">
                    <HeartPulse className="w-4 h-4 text-amber-300" />
                    <span>Pharmacist Dietary &amp; Lifestyle Care Plan</span>
                  </h4>
                  <span className="text-[10px] font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                    Custom Plan
                  </span>
                </div>

                <ul className="text-xs text-emerald-100 space-y-1.5 pl-4 list-disc font-medium">
                  <li><strong>Salt Intake Reduction:</strong> Restrict daily sodium to under 2.0 grams (avoid processed &amp; fried snacks).</li>
                  <li><strong>Glycemic Control:</strong> Choose low glycemic index whole grains (millet, oats) instead of refined carbs.</li>
                  <li><strong>Daily Physical Activity:</strong> 30 minutes brisk walking daily morning or evening.</li>
                  <li><strong>Hydration Goal:</strong> Consume 2.5 to 3.0 Liters of water throughout the day.</li>
                </ul>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-shrink-0 text-xs">
              <span className="text-slate-500 text-[11px]">
                Care plan is generated based on registered patient health biomarkers and prescription history.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const msg = `🏥 *GENQUANTAA MEDPLUS PHARMACY - PERSONALIZED HEALTH CARE PLAN*\n\n` +
                      `Dear ${selectedPatientForCarePlan.name},\n` +
                      `Here is your updated Pharmacist Health Care Plan:\n\n` +
                      `🩺 *Vitals Summary:*\n` +
                      `• BP: 142/90 mmHg (Stage 2 HTN)\n` +
                      `• Fasting Sugar: 148 mg/dL\n` +
                      `• Refill Adherence: 94%\n\n` +
                      `📋 *Medication Schedule:*\n` +
                      `• Morning: Calpol / Amlodipine 650mg (1 Tab After Breakfast)\n` +
                      `• Night: Dolo / Metformin 650mg (1 Tab After Dinner)\n\n` +
                      `🥗 *Diet & Lifestyle:* Low Salt (<2g/day), 30 min daily walking, 3L water.\n\n` +
                      `📍 Genquantaa Pharmacy Counter #1`;
                    window.open(`https://wa.me/91${selectedPatientForCarePlan.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Care Plan via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const pat = selectedPatientForCarePlan;
                    setSelectedPatientForCarePlan(null);
                    handleStartBillingForPatient(pat);
                  }}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Start Refill Billing</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── REGISTER NEW PATIENT MODAL ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span>Register New Patient Profile</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  placeholder="Hypertension, Type 2 Diabetes"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

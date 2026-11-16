import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  addPatient,
  setPatients,
  updatePatientRecord,
  navigateTo,
  setPatientDetails,
  setDoctorDetails,
  addItemToCart,
  setChronicRefillModalOpen,
  setWellnessBrochureModalOpen
} from '../store/posSlice';
import api from '../utils/api';
import type { PatientRecord, ChronicMedication, PatientVitals, WellnessBrochureCategory } from '../types/pos';
import {
  Users, Search, Plus, UserCheck, ShoppingCart,
  HeartPulse, X, DollarSign, Activity, Sparkles, MessageCircle, FileText, CheckCircle2, ChevronRight,
  Edit2, Trash2, Loader2, Clock, AlertTriangle, Calendar, Send, Pill, Check, PhoneCall,
  ArrowRight, Filter, ShieldAlert, Phone
} from 'lucide-react';
import { PatientClinicalAnalytics } from './PatientClinicalAnalytics';

export const PatientsPage: React.FC = () => {
  const dispatch = useDispatch();
  const patients = useSelector((state: RootState) => state.pos.patients);
  const products = useSelector((state: RootState) => state.pos.products);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);

  // Main Tabs: Directory vs Refill Pipeline Alerts vs Clinical Analytics
  const [activePatientsTab, setActivePatientsTab] = useState<'DIRECTORY' | 'REFILL_ALERTS' | 'CLINICAL_ANALYTICS'>('DIRECTORY');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [directoryFilter, setDirectoryFilter] = useState<'ALL' | 'CHRONIC' | 'HIGH_VALUE' | 'BP' | 'SUGAR' | 'THYROID'>('ALL');
  const [refillUrgencyFilter, setRefillUrgencyFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'>('ALL');

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<PatientRecord | null>(null);
  const [selectedPatientForCarePlan, setSelectedPatientForCarePlan] = useState<PatientRecord | null>(null);
  const [whatsappReminderPatient, setWhatsappReminderPatient] = useState<PatientRecord | null>(null);
  const [invoiceHistoryPatient, setInvoiceHistoryPatient] = useState<PatientRecord | null>(null);
  const [patientInvoices, setPatientInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);

  // Edit Patient Form State
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editAge, setEditAge] = useState<string>('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [editConditions, setEditConditions] = useState<string>('');

  // Register Form State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [age, setAge] = useState<string>('35');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [conditions, setConditions] = useState<string>('Hypertension (BP), Type-2 Diabetes');

  // Vitals Editor State
  const [vitalsBp, setVitalsBp] = useState<string>('');
  const [vitalsFbs, setVitalsFbs] = useState<string>('');
  const [vitalsPpbs, setVitalsPpbs] = useState<string>('');
  const [vitalsHba1c, setVitalsHba1c] = useState<string>('');
  const [vitalsTsh, setVitalsTsh] = useState<string>('');
  const [vitalsWeight, setVitalsWeight] = useState<string>('');
  const [vitalsAllergies, setVitalsAllergies] = useState<string>('');
  const [vitalsNotes, setVitalsNotes] = useState<string>('');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Fetch patients & refill list on mount ──────────────────────────────
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients?limit=200');
        if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((p: any) => ({ ...p, patientId: p._id || p.patientId }));
          dispatch(setPatients(mapped));
        }
      } catch (err) {
        console.warn('[PatientsPage] Using offline patient cache:', err);
      }
    };
    fetchPatients();
  }, [dispatch]);

  // Synchronize vitals editor when a patient is opened
  useEffect(() => {
    if (selectedPatientForVitals) {
      setVitalsBp(selectedPatientForVitals.vitals?.bp || '130/85 mmHg');
      setVitalsFbs(selectedPatientForVitals.vitals?.fbs || '135 mg/dL');
      setVitalsPpbs(selectedPatientForVitals.vitals?.ppbs || '180 mg/dL');
      setVitalsHba1c(selectedPatientForVitals.vitals?.hba1c || '7.1%');
      setVitalsTsh(selectedPatientForVitals.vitals?.tsh || '2.6 µIU/mL');
      setVitalsWeight(selectedPatientForVitals.vitals?.weightKg ? String(selectedPatientForVitals.vitals.weightKg) : '70');
      setVitalsAllergies((selectedPatientForVitals.allergies || []).join(', '));
      setVitalsNotes(selectedPatientForVitals.notes || '');
    }
  }, [selectedPatientForVitals]);

  // Refill pipeline helper calculations
  const patientsWithRefillStatus = useMemo(() => {
    const today = new Date();
    return patients.map(p => {
      let dueDate = p.nextRefillDate ? new Date(p.nextRefillDate) : null;
      if (!dueDate) {
        const base = p.lastVisit ? new Date(p.lastVisit) : new Date(Date.now() - 28 * 86400000);
        dueDate = new Date(base.getTime() + 30 * 86400000);
      }
      const diffMs = dueDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: 'OVERDUE' | 'DUE_SOON' | 'ON_TRACK' = 'ON_TRACK';
      if (daysRemaining < 0) status = 'OVERDUE';
      else if (daysRemaining <= 3) status = 'DUE_SOON';

      const hasChronic = (p.chronicConditions && p.chronicConditions.length > 0) || (p.chronicMedications && p.chronicMedications.length > 0);

      return {
        ...p,
        calculatedDueDate: dueDate.toISOString().split('T')[0],
        daysRemaining,
        effectiveRefillStatus: status,
        isChronicPatient: hasChronic
      };
    });
  }, [patients]);

  // Summary Metrics
  const totalPatients = patients.length;
  const totalSpend = patients.reduce((sum, p) => sum + (p.totalSpent || 0), 0);
  const chronicCount = patientsWithRefillStatus.filter(p => p.isChronicPatient).length;
  const overdueCount = patientsWithRefillStatus.filter(p => p.isChronicPatient && p.effectiveRefillStatus === 'OVERDUE').length;
  const dueSoonCount = patientsWithRefillStatus.filter(p => p.isChronicPatient && p.effectiveRefillStatus === 'DUE_SOON').length;

  // Filtered Directory
  const filteredPatients = useMemo(() => {
    return patientsWithRefillStatus.filter(p => {
      if (searchTerm.trim()) {
        const t = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(t);
        const matchesPhone = p.phone.includes(t);
        const matchesId = (p.patientId || '').toLowerCase().includes(t);
        if (!matchesName && !matchesPhone && !matchesId) return false;
      }

      if (directoryFilter === 'CHRONIC') return p.isChronicPatient;
      if (directoryFilter === 'HIGH_VALUE') return (p.totalSpent || 0) >= 5000;
      if (directoryFilter === 'BP') {
        const text = (p.chronicConditions || []).join(' ').toLowerCase();
        return text.includes('bp') || text.includes('hyper');
      }
      if (directoryFilter === 'SUGAR') {
        const text = (p.chronicConditions || []).join(' ').toLowerCase();
        return text.includes('sugar') || text.includes('diab');
      }
      if (directoryFilter === 'THYROID') {
        const text = (p.chronicConditions || []).join(' ').toLowerCase();
        return text.includes('thyroid');
      }
      return true;
    });
  }, [patientsWithRefillStatus, searchTerm, directoryFilter]);

  // Filtered Refill Alerts List
  const refillAlertsList = useMemo(() => {
    return patientsWithRefillStatus.filter(p => {
      if (!p.isChronicPatient) return false;
      if (refillUrgencyFilter === 'OVERDUE') return p.effectiveRefillStatus === 'OVERDUE';
      if (refillUrgencyFilter === 'DUE_SOON') return p.effectiveRefillStatus === 'DUE_SOON';
      if (refillUrgencyFilter === 'UPCOMING') return p.effectiveRefillStatus === 'ON_TRACK';
      return true; // ALL
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [patientsWithRefillStatus, refillUrgencyFilter]);

  // ── Actions ─────────────────────────────────────────────────────────────

  // 1-Click Refill Directly into Active Billing Cart
  const handleDispenseRefillToCart = (pat: PatientRecord) => {
    dispatch(setPatientDetails({
      patientName: pat.name,
      phone: pat.phone,
      age: pat.age,
      gender: pat.gender
    }));

    let dispensedCount = 0;
    if (pat.chronicMedications && pat.chronicMedications.length > 0) {
      pat.chronicMedications.forEach(med => {
        const prod = products.find(p => p._id === med.productId || p.name.toLowerCase().includes((med.productName || '').toLowerCase()));
        if (prod && prod.batches && prod.batches.length > 0) {
          const batch = prod.batches.find(b => b.stockQuantity > 0) || prod.batches[0];
          dispatch(addItemToCart({
            product: prod,
            selectedBatch: batch,
            quantity: med.quantity || 30,
            unitMode: 'PACK'
          }));
          dispensedCount++;
        }
      });
    }

    showToast(`⚡ Refilled ${dispensedCount || 'patient'} medicines into Active Cart!`);
    dispatch(navigateTo('POS_TERMINAL'));
  };

  // Snooze Refill
  const handleSnoozeRefill = async (pat: PatientRecord, days: number = 7) => {
    const targetId = pat.patientId || pat._id || pat.phone;
    try {
      await api.put(`/patients/${targetId}/snooze-refill`, { snoozeDays: days });
    } catch {
      // offline fallback
    }

    const newDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    dispatch(updatePatientRecord({
      patientId: pat.patientId,
      phone: pat.phone,
      nextRefillDate: newDate,
      refillStatus: 'ON_TRACK'
    }));

    showToast(`📅 Refill for ${pat.name} postponed by +${days} days.`);
  };

  // Dispatch WhatsApp Reminder
  const handleSendWhatsappReminder = async (pat: PatientRecord) => {
    const targetId = pat.patientId || pat._id || pat.phone;
    try {
      await api.post(`/patients/${targetId}/refill-reminder`, { reminderType: 'WHATSAPP' });
    } catch {
      // offline fallback
    }

    dispatch(updatePatientRecord({
      patientId: pat.patientId,
      phone: pat.phone,
      lastReminderSent: new Date().toISOString()
    }));

    const cleanPhone = pat.phone.replace(/[^0-9]/g, '');
    const conditionsStr = (pat.chronicConditions || ['BP & Diabetes']).join(', ');
    const msg = `🏥 *GENQUANTAA MEDPLUS PHARMACY - REFILL ALERT*\n\n` +
      `Dear ${pat.name},\n` +
      `Your regular monthly medications (${conditionsStr}) are due for refill at Genquantaa MedPlus.\n\n` +
      `📦 Reply *1* for Free Doorstep Delivery\n` +
      `🏢 Or visit Counter #1 for Express Pickup.\n\n` +
      `_Stay healthy! Genquantaa Pharmacy Care Team._`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    setWhatsappReminderPatient(null);
    showToast(`📲 WhatsApp reminder dispatched to ${pat.name} (${pat.phone})`);
  };

  // Save Vitals & Health Profile
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForVitals) return;

    const allergiesList = vitalsAllergies.split(',').map(a => a.trim()).filter(Boolean);
    const updatedVitals: PatientVitals = {
      bp: vitalsBp,
      fbs: vitalsFbs,
      ppbs: vitalsPpbs,
      hba1c: vitalsHba1c,
      tsh: vitalsTsh,
      weightKg: Number(vitalsWeight) || undefined,
      recordedDate: new Date().toISOString().split('T')[0]
    };

    const targetId = selectedPatientForVitals.patientId || selectedPatientForVitals._id || selectedPatientForVitals.phone;
    try {
      await api.put(`/patients/${targetId}/vitals`, {
        ...updatedVitals,
        allergies: allergiesList,
        notes: vitalsNotes
      });
    } catch {
      // offline fallback
    }

    dispatch(updatePatientRecord({
      patientId: selectedPatientForVitals.patientId,
      phone: selectedPatientForVitals.phone,
      vitals: updatedVitals,
      allergies: allergiesList,
      notes: vitalsNotes
    }));

    showToast(`✅ Health vitals & biomarkers updated for ${selectedPatientForVitals.name}`);
    setSelectedPatientForVitals(null);
  };

  // Create patient
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const conditionList = conditions.split(',').map(c => c.trim()).filter(Boolean);
    try {
      const res = await api.post('/patients', {
        name, phone, age, gender,
        totalBills: 0, totalSpent: 0,
        lastVisit: new Date().toISOString().split('T')[0],
        chronicConditions: conditionList,
        vitals: {
          bp: '120/80 mmHg',
          fbs: '100 mg/dL',
          recordedDate: new Date().toISOString().split('T')[0]
        },
        nextRefillDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        refillStatus: 'ON_TRACK'
      });
      if (res.data.success) {
        const newPat = { ...res.data.data, patientId: res.data.data._id || `pat-${Date.now()}` };
        dispatch(addPatient(newPat));
      }
    } catch {
      // offline fallback
      dispatch(addPatient({
        name, phone, age, gender,
        totalBills: 0, totalSpent: 0,
        lastVisit: new Date().toISOString().split('T')[0],
        chronicConditions: conditionList,
        vitals: { bp: '120/80 mmHg', fbs: '100 mg/dL' },
        nextRefillDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        refillStatus: 'ON_TRACK'
      }));
    }
    setShowAddModal(false);
    setName(''); setPhone('');
    showToast(`Patient ${name} registered successfully.`);
  };

  // Edit patient
  const handleOpenEdit = (pat: PatientRecord) => {
    setEditingPatient(pat);
    setEditName(pat.name);
    setEditPhone(pat.phone);
    setEditAge(pat.age);
    setEditGender(pat.gender);
    setEditConditions((pat.chronicConditions || []).join(', '));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    const conditionList = editConditions.split(',').map(c => c.trim()).filter(Boolean);
    const targetId = editingPatient.patientId || (editingPatient as any)._id || editingPatient.phone;
    try {
      await api.put(`/patients/${targetId}`, {
        name: editName, phone: editPhone, age: editAge, gender: editGender,
        chronicConditions: conditionList,
      });
    } catch {
      // offline fallback
    }

    dispatch(updatePatientRecord({
      patientId: editingPatient.patientId,
      name: editName,
      phone: editPhone,
      age: editAge,
      gender: editGender,
      chronicConditions: conditionList
    }));

    setEditingPatient(null);
    showToast(`Patient details updated.`);
  };

  // Delete patient
  const handleDeletePatient = async (pat: PatientRecord) => {
    if (!window.confirm(`Deactivate patient "${pat.name}"? Their past invoice history will remain safe.`)) return;
    try {
      await api.delete(`/patients/${pat.patientId || (pat as any)._id}`);
    } catch {
      // offline fallback
    }
    dispatch(setPatients(patients.filter(p => p.patientId !== pat.patientId)));
    showToast(`Patient "${pat.name}" deactivated.`);
  };

  // View Invoice History
  const handleViewInvoiceHistory = async (pat: PatientRecord) => {
    setInvoiceHistoryPatient(pat);
    setPatientInvoices([]);
    setInvoicesLoading(true);
    try {
      const res = await api.get(`/patients/${pat.patientId || (pat as any)._id}/invoices`);
      if (res.data?.success) setPatientInvoices(res.data.data);
    } catch (err) {
      console.warn('[PatientsPage] Offline invoices fetch:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none relative">

      {/* Top Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl border border-emerald-500/60 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-orange-600" />
            <span>Patient Profiles &amp; Chronic Refills</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor patient health biomarkers (BP, Sugar, Thyroid), chronic medication cycles &amp; automated refill reminders
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => dispatch(setChronicRefillModalOpen({ isOpen: true }))}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
            title="Open Quick Refill Window"
          >
            <Pill className="w-4 h-4 text-emerald-200" />
            <span>⚡ Fast Refill Window</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {/* ── THREE SUB-TABS ─────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActivePatientsTab('DIRECTORY')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activePatientsTab === 'DIRECTORY'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Patient Directory &amp; Vitals ({patients.length})</span>
        </button>

        <button
          onClick={() => setActivePatientsTab('REFILL_ALERTS')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activePatientsTab === 'REFILL_ALERTS'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-300" />
          <span>Chronic Refill Alerts &amp; Reminders</span>
          {overdueCount > 0 && (
            <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full font-black animate-pulse">
              {overdueCount} Overdue
            </span>
          )}
        </button>

        <button
          onClick={() => setActivePatientsTab('CLINICAL_ANALYTICS')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activePatientsTab === 'CLINICAL_ANALYTICS'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4 text-teal-200" />
          <span>Medication Adherence &amp; AMR Analytics</span>
        </button>
      </div>

      {/* ── TAB 1: PATIENT DIRECTORY & HEALTH VITALS ───────────────── */}
      {activePatientsTab === 'DIRECTORY' && (
        <div className="space-y-4">
          
          {/* KPI Metrics */}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Patient Spend</p>
                <h3 className="text-xl font-black text-emerald-800 font-heading">₹{totalSpend.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
              <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monitored Chronic Profiles</p>
                <h3 className="text-xl font-black text-rose-700 font-heading">{chronicCount}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
              <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Refills Due / Overdue</p>
                <h3 className="text-xl font-black text-amber-800 font-heading">
                  {overdueCount + dueSoonCount} <span className="text-xs font-bold text-rose-600">({overdueCount} critical)</span>
                </h3>
              </div>
            </div>
          </div>

          {/* Search Bar & Filter Chips */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient by name, mobile number, patient ID or condition..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] font-bold">
              <button
                onClick={() => setDirectoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  directoryFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setDirectoryFilter('CHRONIC')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  directoryFilter === 'CHRONIC' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                ♥ Chronic Care ({chronicCount})
              </button>
              <button
                onClick={() => setDirectoryFilter('BP')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  directoryFilter === 'BP' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                Hypertension (BP)
              </button>
              <button
                onClick={() => setDirectoryFilter('SUGAR')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  directoryFilter === 'SUGAR' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Diabetes (Sugar)
              </button>
              <button
                onClick={() => setDirectoryFilter('THYROID')}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  directoryFilter === 'THYROID' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                Thyroid
              </button>
            </div>
          </div>

          {/* Patient Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Patient Directory &amp; Health Vitals ({filteredPatients.length})</span>
              <span className="text-slate-400">Click "Health Profile" to record BP/Sugar/TSH or "⚡ Refill" to dispense</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '850px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Patient Profile</th>
                    <th className="px-3 py-3">Mobile No</th>
                    <th className="px-3 py-3 text-center">Age / Gender</th>
                    <th className="px-3 py-3">Health Vitals (BP / Sugar / TSH)</th>
                    <th className="px-3 py-3 text-center">Refill Status</th>
                    <th className="px-3 py-3 text-right">Lifetime Spend</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No patient records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map(pat => (
                      <tr key={pat.patientId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs">{pat.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pat.patientId}</div>
                          {pat.allergies && pat.allergies.length > 0 && (
                            <span className="text-[9.5px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded border border-rose-200 inline-block mt-0.5">
                              ⚠️ Allergy: {pat.allergies.join(', ')}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {pat.phone}
                        </td>

                        <td className="px-3 py-3 text-center font-bold text-slate-700">
                          {pat.age}y · {pat.gender}
                        </td>

                        {/* Health Vitals Display */}
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            {pat.vitals?.bp ? (
                              <div className="flex items-center space-x-1.5 text-[10.5px]">
                                <span className="font-bold text-slate-600">BP:</span>
                                <span className="font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  {pat.vitals.bp}
                                </span>
                                {pat.vitals.fbs && (
                                  <>
                                    <span className="font-bold text-slate-600 ml-1">Sugar:</span>
                                    <span className="font-extrabold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                      {pat.vitals.fbs}
                                    </span>
                                  </>
                                )}
                                {pat.vitals.tsh && (
                                  <>
                                    <span className="font-bold text-slate-600 ml-1">TSH:</span>
                                    <span className="font-extrabold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                      {pat.vitals.tsh}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No vitals logged yet</span>
                            )}

                            {/* Chronic tags */}
                            <div className="flex flex-wrap gap-1">
                              {(pat.chronicConditions || []).map((c, i) => (
                                <span key={i} className="text-[9.5px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded">
                                  ♥ {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Refill Status Pill */}
                        <td className="px-3 py-3 text-center">
                          {pat.isChronicPatient ? (
                            <div>
                              {pat.effectiveRefillStatus === 'OVERDUE' && (
                                <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300 inline-block animate-pulse">
                                  🚨 Overdue Refill
                                </span>
                              )}
                              {pat.effectiveRefillStatus === 'DUE_SOON' && (
                                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300 inline-block">
                                  ⚠️ Due in {pat.daysRemaining} Days
                                </span>
                              )}
                              {pat.effectiveRefillStatus === 'ON_TRACK' && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
                                  🟢 Due: {pat.calculatedDueDate}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Regular</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right font-black text-emerald-800">
                          ₹{(pat.totalSpent || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center flex-wrap gap-1">
                            <button
                              onClick={() => setSelectedPatientForVitals(pat)}
                              className="flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                              title="Inspect & Log Health Vitals (BP, Sugar, Thyroid)"
                            >
                              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                              <span>Vitals</span>
                            </button>

                            <button
                              onClick={() => setSelectedPatientForCarePlan(pat)}
                              className="flex items-center space-x-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                              title="Personalized Care Plan"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Care Plan</span>
                            </button>

                            <button
                              onClick={() => handleViewInvoiceHistory(pat)}
                              className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer"
                              title="Invoice History"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(pat)}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                              title="Edit Patient"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeletePatient(pat)}
                              className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                              title="Deactivate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDispenseRefillToCart(pat)}
                              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
                              title="1-Click Refill to POS Cart"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>⚡ Refill</span>
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

        </div>
      )}

      {/* ── TAB 2: AUTOMATED CHRONIC REFILL ALERTS & PIPELINE ──────── */}
      {activePatientsTab === 'REFILL_ALERTS' && (
        <div className="space-y-4">
          
          {/* Urgency Filter Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <button
              onClick={() => setRefillUrgencyFilter('OVERDUE')}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                refillUrgencyFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                  : 'bg-white hover:bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${refillUrgencyFilter === 'OVERDUE' ? 'text-rose-100' : 'text-rose-600'}`}>
                  🚨 Overdue Refills
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  refillUrgencyFilter === 'OVERDUE' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
                }`}>
                  {overdueCount} Critical
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium ${refillUrgencyFilter === 'OVERDUE' ? 'text-rose-100' : 'text-slate-500'}`}>
                Patients have run out of chronic medication. Immediate call/message needed.
              </p>
            </button>

            <button
              onClick={() => setRefillUrgencyFilter('DUE_SOON')}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                refillUrgencyFilter === 'DUE_SOON'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md'
                  : 'bg-white hover:bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${refillUrgencyFilter === 'DUE_SOON' ? 'text-amber-100' : 'text-amber-700'}`}>
                  ⚠️ Due in 1–3 Days
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  refillUrgencyFilter === 'DUE_SOON' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {dueSoonCount}
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium ${refillUrgencyFilter === 'DUE_SOON' ? 'text-amber-100' : 'text-slate-500'}`}>
                Schedule WhatsApp reminder alert or doorstep delivery.
              </p>
            </button>

            <button
              onClick={() => setRefillUrgencyFilter('UPCOMING')}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                refillUrgencyFilter === 'UPCOMING'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                  : 'bg-white hover:bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${refillUrgencyFilter === 'UPCOMING' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  🟢 On Track (This Month)
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  refillUrgencyFilter === 'UPCOMING' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {chronicCount - overdueCount - dueSoonCount}
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium ${refillUrgencyFilter === 'UPCOMING' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Active 30-day supply maintained by customer.
              </p>
            </button>

            <button
              onClick={() => setRefillUrgencyFilter('ALL')}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                refillUrgencyFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${refillUrgencyFilter === 'ALL' ? 'text-slate-200' : 'text-slate-700'}`}>
                  📋 All Refills
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                  refillUrgencyFilter === 'ALL' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-800'
                }`}>
                  {chronicCount} Total
                </span>
              </div>
              <p className={`text-xs mt-1 font-medium ${refillUrgencyFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
                Full pipeline across all monitored chronic conditions.
              </p>
            </button>
          </div>

          {/* Refill Cards Pipeline List */}
          <div className="space-y-3">
            {refillAlertsList.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-400 text-xs">
                No patients currently in this refill urgency stage.
              </div>
            ) : (
              refillAlertsList.map(pat => (
                <div
                  key={pat.patientId}
                  className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    pat.effectiveRefillStatus === 'OVERDUE'
                      ? 'border-rose-300 bg-rose-50/15'
                      : pat.effectiveRefillStatus === 'DUE_SOON'
                      ? 'border-amber-300 bg-amber-50/15'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Left Column: Patient Info & Vitals */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-black text-slate-900 font-heading">{pat.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {pat.phone}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {pat.age}y {pat.gender}
                      </span>

                      {pat.effectiveRefillStatus === 'OVERDUE' && (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                          🚨 Overdue by {Math.abs(pat.daysRemaining)} Days
                        </span>
                      )}
                      {pat.effectiveRefillStatus === 'DUE_SOON' && (
                        <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          ⚠️ Due in {pat.daysRemaining} Days ({pat.calculatedDueDate})
                        </span>
                      )}
                      {pat.effectiveRefillStatus === 'ON_TRACK' && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          🟢 Refill Due: {pat.calculatedDueDate}
                        </span>
                      )}
                    </div>

                    {/* Vitals Summary Strip */}
                    <div className="flex items-center space-x-2 text-xs">
                      {pat.vitals?.bp && (
                        <span className="text-[10.5px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-medium">
                          🩺 BP: <strong className="text-rose-700">{pat.vitals.bp}</strong>
                        </span>
                      )}
                      {pat.vitals?.fbs && (
                        <span className="text-[10.5px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-medium">
                          🩸 Sugar: <strong className="text-amber-800">{pat.vitals.fbs}</strong>
                        </span>
                      )}
                      {pat.vitals?.tsh && (
                        <span className="text-[10.5px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 font-medium">
                          🦋 TSH: <strong className="text-teal-800">{pat.vitals.tsh}</strong>
                        </span>
                      )}
                      <span className="text-[10.5px] text-slate-400">
                        Last Visit: {pat.lastVisit}
                      </span>
                    </div>

                    {/* Prescribed Chronic Medicines Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(pat.chronicMedications && pat.chronicMedications.length > 0 ? pat.chronicMedications : [
                        { productName: 'Calpol 650mg', dosage: '1 Tab Daily', quantity: 30 },
                        { productName: 'Dolo 650mg', dosage: '1 Tab Daily', quantity: 30 }
                      ]).map((med, idx) => (
                        <span key={idx} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-800 font-semibold flex items-center space-x-1 shadow-2xs">
                          <Pill className="w-3 h-3 text-emerald-600" />
                          <span>{med.productName} ({med.dosage} · Qty: {med.quantity})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Pharmacist Quick Actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleSnoozeRefill(pat, 7)}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      title="Postpone Refill by +7 Days"
                    >
                      <span>+7d Snooze</span>
                    </button>

                    <button
                      onClick={() => setWhatsappReminderPatient(pat)}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl cursor-pointer flex items-center space-x-1.5 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp Alert</span>
                    </button>

                    <button
                      onClick={() => handleDispenseRefillToCart(pat)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ 1-Click Refill to POS</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ── TAB 3: MEDICATION ADHERENCE & CLINICAL ANALYTICS ────────── */}
      {activePatientsTab === 'CLINICAL_ANALYTICS' && (
        <PatientClinicalAnalytics />
      )}

      {/* ── HEALTH VITALS & BIOMARKERS EDITOR MODAL ───────────────────── */}
      {selectedPatientForVitals && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">
                    Health Vitals &amp; Chronic Biomarkers
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedPatientForVitals.name} ({selectedPatientForVitals.age}y {selectedPatientForVitals.gender}) · Mobile: {selectedPatientForVitals.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForVitals(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="my-4 space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
              
              {/* Vitals Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Blood Pressure */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Blood Pressure (BP)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Normal: &lt;120/80</span>
                  </label>
                  <input
                    type="text"
                    value={vitalsBp}
                    onChange={e => setVitalsBp(e.target.value)}
                    placeholder="138/88 mmHg"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-rose-700 font-semibold block">
                    {vitalsBp.includes('14') ? '⚠️ Stage 2 Hypertension' : vitalsBp.includes('13') ? '⚠️ Stage 1 Hypertension' : '🟢 Within normal limits'}
                  </span>
                </div>

                {/* Fasting Sugar */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Fasting Sugar (FBS)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Normal: 70–99 mg/dL</span>
                  </label>
                  <input
                    type="text"
                    value={vitalsFbs}
                    onChange={e => setVitalsFbs(e.target.value)}
                    placeholder="142 mg/dL"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-amber-800 font-semibold block">
                    {Number(vitalsFbs.replace(/[^0-9]/g, '')) >= 126 ? '⚠️ Diabetic Range (FBS >= 126)' : '🟢 Managed Glucose'}
                  </span>
                </div>

                {/* Post-Meal Sugar & HbA1c */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>HbA1c Level (%)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Target: &lt;7.0%</span>
                  </label>
                  <input
                    type="text"
                    value={vitalsHba1c}
                    onChange={e => setVitalsHba1c(e.target.value)}
                    placeholder="7.2%"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                {/* Thyroid TSH */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Thyroid TSH (µIU/mL)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Normal: 0.4–4.0</span>
                  </label>
                  <input
                    type="text"
                    value={vitalsTsh}
                    onChange={e => setVitalsTsh(e.target.value)}
                    placeholder="2.6 µIU/mL"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                {/* Weight */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-extrabold text-slate-800">Body Weight (kg)</label>
                  <input
                    type="number"
                    value={vitalsWeight}
                    onChange={e => setVitalsWeight(e.target.value)}
                    placeholder="72"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                {/* Allergies */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                  <label className="font-extrabold text-slate-800 flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Known Drug Allergies</span>
                  </label>
                  <input
                    type="text"
                    value={vitalsAllergies}
                    onChange={e => setVitalsAllergies(e.target.value)}
                    placeholder="Penicillin, Sulfa drugs"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>

              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pharmacist Clinical Vitals Observations</label>
                <textarea
                  rows={2}
                  value={vitalsNotes}
                  onChange={e => setVitalsNotes(e.target.value)}
                  placeholder="Patient reports morning dizziness when taking BP medication on empty stomach. Advised taking with meals."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForVitals(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Biomarkers &amp; Vitals
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── WHATSAPP REFILL DISPATCH MODAL ────────────────────────────── */}
      {whatsappReminderPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-heading">
                    Send WhatsApp Refill Reminder
                  </h3>
                  <p className="text-[11px] text-slate-500">To {whatsappReminderPatient.name} (+91 {whatsappReminderPatient.phone})</p>
                </div>
              </div>
              <button onClick={() => setWhatsappReminderPatient(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs text-slate-800 space-y-2 font-mono">
              <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider font-sans">
                Preview Message:
              </div>
              <p>
                🏥 <strong>GENQUANTAA MEDPLUS PHARMACY - REFILL ALERT</strong><br /><br />
                Dear {whatsappReminderPatient.name},<br />
                Your monthly prescription medications ({(whatsappReminderPatient.chronicConditions || ['BP & Diabetes Care']).join(', ')}) are due for refill.<br /><br />
                📦 Reply <strong>1</strong> for Free Home Delivery<br />
                🏢 Or visit Counter #1 for Express Pickup.<br /><br />
                <em>Genquantaa Pharmacy Care Team</em>
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 mt-4 text-xs font-bold">
              <button
                onClick={() => setWhatsappReminderPatient(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendWhatsappReminder(whatsappReminderPatient)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Alert to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTER NEW PATIENT MODAL ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span>Register New Patient Profile</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                  placeholder="Hypertension (BP), Type 2 Diabetes"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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

      {/* ── EDIT PATIENT MODAL ────────────────────────────────────────────── */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-orange-600" />
                <span>Edit Patient — {editingPatient.name}</span>
              </h3>
              <button onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Full Name *</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Mobile Number *</label>
                <input type="tel" required value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-hidden" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Age</label>
                  <input type="number" value={editAge} onChange={e => setEditAge(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Gender</label>
                  <select value={editGender} onChange={e => setEditGender(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Chronic Conditions (comma separated)</label>
                <input type="text" value={editConditions} onChange={e => setEditConditions(e.target.value)}
                  placeholder="Hypertension, Diabetes"
                  className="w-full p-2 border border-slate-300 rounded-xl" />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CARE PLAN & PERSONALIZED LIFESTYLE MODAL ──────────────────────── */}
      {selectedPatientForCarePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl shadow-md">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">
                    Personalized Health Insights &amp; Care Plan
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedPatientForCarePlan.name} ({selectedPatientForCarePlan.age}y {selectedPatientForCarePlan.gender}) · Mobile: {selectedPatientForCarePlan.phone}
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

            <div className="my-4 space-y-4 flex-1 overflow-y-auto pr-1 text-xs">
              {/* Biomarkers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center">
                  <p className="text-[10px] text-rose-700 font-bold uppercase">BP Biomarker</p>
                  <p className="text-base font-black text-rose-900">{selectedPatientForCarePlan.vitals?.bp || '138/88 mmHg'}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center">
                  <p className="text-[10px] text-amber-700 font-bold uppercase">Fasting Sugar</p>
                  <p className="text-base font-black text-amber-900">{selectedPatientForCarePlan.vitals?.fbs || '142 mg/dL'}</p>
                </div>
                <div className="bg-teal-50 p-3 rounded-2xl border border-teal-200 text-center">
                  <p className="text-[10px] text-teal-700 font-bold uppercase">HbA1c</p>
                  <p className="text-base font-black text-teal-900">{selectedPatientForCarePlan.vitals?.hba1c || '7.1%'}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">Refill Adherence</p>
                  <p className="text-base font-black text-emerald-900">94%</p>
                </div>
              </div>

              {/* Lifestyle Recommendations */}
              <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-4 text-white space-y-2 shadow-md">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  Pharmacist Dietary &amp; Lifestyle Plan
                </h4>
                <ul className="space-y-1.5 pl-4 list-disc text-emerald-100">
                  <li><strong>Sodium Restriction:</strong> Limit daily salt intake under 2.0g to regulate vascular tension.</li>
                  <li><strong>Complex Carbohydrates:</strong> Shift from polished white rice to high-fiber millets &amp; oats.</li>
                  <li><strong>Hydration &amp; Movement:</strong> 30 minutes morning walking and 2.5L clean water daily.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 flex-shrink-0 text-xs font-bold">
              <button
                onClick={() => setSelectedPatientForCarePlan(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const pat = selectedPatientForCarePlan;
                  setSelectedPatientForCarePlan(null);
                  handleDispenseRefillToCart(pat);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Start Refill Billing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INVOICE HISTORY MODAL ─────────────────────────────────────────── */}
      {invoiceHistoryPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 flex-shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Invoice History — {invoiceHistoryPatient.name}</span>
              </h3>
              <button onClick={() => setInvoiceHistoryPatient(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading invoices...
                </div>
              ) : patientInvoices.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No invoices found for this patient.</div>
              ) : (
                patientInvoices.map((inv: any) => (
                  <div key={inv._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600">{inv.billingSession?.items?.length || 0} items</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800">₹{inv.grandTotal?.toFixed(2)}</span>
                      <span className="text-[10px] ml-2 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        {inv.payment?.method}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

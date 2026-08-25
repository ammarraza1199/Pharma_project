import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setChronicRefillModalOpen,
  refillChronicMedicationsToCart,
  setPatientDetails,
  setDoctorDetails
} from '../store/posSlice';
import type { PatientRecord, ChronicMedication } from '../types/pos';
import {
  Repeat, UserCheck, HeartPulse, Activity, Sparkles, CheckSquare,
  Square, Plus, MessageCircle, CheckCircle2, X, Clock, Pill,
  AlertTriangle, ShieldCheck, Search, ChevronRight
} from 'lucide-react';

export const ChronicRefillModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.chronicRefillModal);
  const patients = useSelector((state: RootState) => state.pos.patients);
  const products = useSelector((state: RootState) => state.pos.products);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const currentSession = useSelector((state: RootState) => state.pos.sessions.find(s => s.id === activeSessionId));

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    modal.patientId || patients[0]?.patientId || ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);
  const [refillDurationDays, setRefillDurationDays] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync selected patient
  const selectedPatient = useMemo(() => {
    return patients.find(p => p.patientId === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Default select all medications when switching patient
  React.useEffect(() => {
    if (selectedPatient && selectedPatient.chronicMedications) {
      setSelectedMedIds(selectedPatient.chronicMedications.map(m => m.productId));
    } else {
      setSelectedMedIds([]);
    }
  }, [selectedPatient]);

  // Group medications by condition category (Hooks must run unconditionally)
  const categorizedMeds = useMemo(() => {
    const list = selectedPatient?.chronicMedications || [];
    const groups: Record<string, ChronicMedication[]> = {
      HYPERTENSION: [],
      DIABETES: [],
      THYROID: [],
      CARDIAC: [],
      GENERAL: []
    };

    list.forEach(m => {
      if (groups[m.conditionCategory]) {
        groups[m.conditionCategory].push(m);
      } else {
        groups.GENERAL.push(m);
      }
    });

    return groups;
  }, [selectedPatient]);

  if (!modal.isOpen) return null;

  const toggleSelectMed = (prodId: string) => {
    setSelectedMedIds(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const toggleSelectAll = () => {
    if (!selectedPatient?.chronicMedications) return;
    if (selectedMedIds.length === selectedPatient.chronicMedications.length) {
      setSelectedMedIds([]);
    } else {
      setSelectedMedIds(selectedPatient.chronicMedications.map(m => m.productId));
    }
  };

  const handleRefillToCart = () => {
    if (!selectedPatient?.chronicMedications || selectedMedIds.length === 0) {
      alert('Please select at least one chronic medication to refill.');
      return;
    }

    const itemsToRefill = selectedPatient.chronicMedications
      .filter(m => selectedMedIds.includes(m.productId))
      .map(m => {
        // Scale quantity based on refillDurationDays (default 30 days = 30 qty)
        const qty = Math.max(1, Math.round((m.quantity / 30) * refillDurationDays));
        return {
          productId: m.productId,
          quantity: qty
        };
      });

    // Populate active session patient & doctor details
    dispatch(setPatientDetails({
      patientName: selectedPatient.name,
      phone: selectedPatient.phone,
      age: selectedPatient.age,
      gender: selectedPatient.gender
    }));

    const primaryDoc = selectedPatient.chronicMedications[0]?.doctorName;
    if (primaryDoc) {
      dispatch(setDoctorDetails({
        doctorName: primaryDoc,
        regNo: 'MCI-REG-VERIFIED'
      }));
    }

    dispatch(refillChronicMedicationsToCart({
      sessionId: activeSessionId,
      items: itemsToRefill
    }));

    dispatch(setChronicRefillModalOpen({ isOpen: false }));
  };

  const handleSendWhatsAppRefill = (med: ChronicMedication) => {
    const message = `🏥 *GENQUANTAA MEDPLUS PHARMACY - REPEAT REFILL REMINDER*\n\n` +
      `Dear ${selectedPatient.name},\n` +
      `Your regular chronic prescription for *${med.productName}* (${med.dosage}) is due for monthly refill.\n\n` +
      `📍 Store: Genquantaa Pharmacy Counter #1\n` +
      `📞 Refill Line: +91 98765 00112\n` +
      `⚡ Reply *REFILL* to reserve your pack for counter pickup or fast home delivery!`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = selectedPatient.phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-heading flex items-center space-x-2">
                <span>1-Click Repeat Chronic Refill &amp; Order History</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  BP · Diabetes · Thyroid
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Instantly refill recurring monthly medications for chronic patients with live FEFO batch allocation
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setChronicRefillModalOpen({ isOpen: false }))}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Patient Selector & Slabs */}
        <div className="my-3 space-y-3 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Patient Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Chronic Care Patient *
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {patients.map(p => (
                  <option key={p.patientId} value={p.patientId}>
                    {p.name} ({p.phone}) — {p.chronicConditions?.join(', ') || 'Regular Patient'}
                  </option>
                ))}
              </select>
            </div>

            {/* Refill Duration Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Refill Duration / Supply Period
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[15, 30, 60, 90].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRefillDurationDays(days)}
                    className={`py-2 rounded-xl transition-all cursor-pointer ${
                      refillDurationDays === days
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Chronic Profile Banner */}
          {selectedPatient && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">
                    {selectedPatient.name} <span className="text-slate-500 font-normal">({selectedPatient.age} yrs, {selectedPatient.gender})</span>
                  </div>
                  <div className="text-[10.5px] text-slate-600">
                    Phone: <strong>{selectedPatient.phone}</strong> · Last Refill: <strong>{selectedPatient.lastVisit}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 flex-wrap">
                {selectedPatient.chronicConditions?.map((cond, i) => (
                  <span key={i} className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                    🩺 {cond}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chronic Medications List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1">
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Recurring Prescribed Medications ({selectedPatient?.chronicMedications?.length || 0})</span>
            </span>

            <button
              onClick={toggleSelectAll}
              className="text-emerald-700 hover:text-emerald-900 text-[11px] font-extrabold cursor-pointer"
            >
              {selectedMedIds.length === (selectedPatient?.chronicMedications?.length || 0)
                ? 'Deselect All'
                : 'Select All (1-Click)'}
            </button>
          </div>

          {!selectedPatient?.chronicMedications || selectedPatient.chronicMedications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              No chronic repeat medications recorded yet for this patient profile.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedPatient.chronicMedications.map(med => {
                const prod = products.find(p => p._id === med.productId);
                const isSelected = selectedMedIds.includes(med.productId);
                const currentStock = prod?.totalStock || 0;
                const isLowStock = currentStock < 20;

                const calculatedQty = Math.max(1, Math.round((med.quantity / 30) * refillDurationDays));
                const price = prod ? (prod.sellingPrice * calculatedQty).toFixed(2) : '0.00';

                return (
                  <div
                    key={med.productId}
                    onClick={() => toggleSelectMed(med.productId)}
                    className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-emerald-600">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center space-x-1.5">
                          <span>{med.productName}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            med.conditionCategory === 'HYPERTENSION'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : med.conditionCategory === 'DIABETES'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}>
                            {med.conditionCategory}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Dosage: <strong>{med.dosage}</strong> · Refill: <strong>{calculatedQty} Units ({refillDurationDays}d Supply)</strong>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Prescribed by: {med.doctorName || 'Consultant Physician'} · Last Refill: {med.lastRefilledDate}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ₹{price}
                        </div>
                        <div className={`text-[9.5px] font-semibold ${isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {currentStock}u in stock
                        </div>
                      </div>

                      {/* WhatsApp Alert Button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleSendWhatsAppRefill(med);
                        }}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-300"
                        title="Send WhatsApp Refill Reminder"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 flex-shrink-0 text-xs">
          <div className="text-slate-600 font-semibold">
            Selected: <strong className="text-emerald-700">{selectedMedIds.length} Medicines</strong> for {refillDurationDays} Days supply
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => dispatch(setChronicRefillModalOpen({ isOpen: false }))}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRefillToCart}
              disabled={selectedMedIds.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5 ${
                selectedMedIds.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>⚡ 1-Click Refill All to Cart</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

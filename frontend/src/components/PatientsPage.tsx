import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { addPatient, setPatients, navigateTo, setPatientDetails } from '../store/posSlice';
import type { PatientRecord } from '../types/pos';
import api from '../utils/api';
import {
  Users, Search, Plus, UserCheck, ShoppingCart,
  HeartPulse, X, DollarSign
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const dispatch = useDispatch();
  const patients = useSelector((state: RootState) => state.pos.patients);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        if (res.data.success) {
          dispatch(setPatients(res.data.data.map((p: any) => ({ ...p, patientId: p._id }))));
        }
      } catch (err) {
        console.error('Failed to fetch patients', err);
      }
    };
    fetchPatients();
  }, [dispatch]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const conditionList = conditions.split(',').map(c => c.trim()).filter(Boolean);

    try {
      const res = await api.post('/patients', {
        name,
        phone,
        age,
        gender,
        chronicConditions: conditionList
      });
      const newPatient = { ...res.data.data, patientId: res.data.data._id };
      dispatch(addPatient(newPatient));
      setShowAddModal(false);
      setName('');
      setPhone('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create patient');
    }
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
                      <button
                        onClick={() => handleStartBillingForPatient(pat)}
                        className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all mx-auto cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Start Billing</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

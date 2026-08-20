import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Zap, Phone, Clock, CheckCircle2, ChevronRight,
  User, MapPin, PackageCheck, Printer, RotateCcw, HeartPulse,
  Bug, Siren, Wind, Flame, Pill, Activity, ShieldAlert, Sparkles
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmergencyDrug {
  name: string;
  genericName: string;
  dose: string;
  route: string;
  qty: number;
  unit: string;
  critical: boolean;
  notes: string;
}

interface EmergencyKit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  activeBg: string;
  description: string;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  firstAidSteps: string[];
  drugs: EmergencyDrug[];
}

// ─── Emergency Kit Data (Light Theme Palette) ─────────────────────────────────

const EMERGENCY_KITS: EmergencyKit[] = [
  {
    id: 'snake_bite',
    name: 'Snake Bite',
    emoji: '🐍',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-50',
    activeBg: 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200',
    borderColor: 'border-emerald-300',
    description: 'Anti-venom & supportive therapy',
    urgencyLevel: 'CRITICAL',
    firstAidSteps: [
      'Keep patient calm & still — immobilize bitten limb below heart level',
      'Remove rings / jewellery / tight clothing near bite site immediately',
      'DO NOT cut, suck, or apply tight tourniquet — causes tissue necrosis',
      'Call ambulance immediately — 108',
      'Note snake type, color, head shape if safely observed',
    ],
    drugs: [
      { name: 'Polyvalent Anti-Snake Venom Serum', genericName: 'Anti-Venom Injection', dose: '10 vials IV over 1 hr', route: 'IV', qty: 10, unit: 'Vials', critical: true, notes: 'Dilute in NS 100ml per vial; pre-load Adrenaline first' },
      { name: 'Adrenaline (Epinephrine) 1mg/1ml', genericName: 'Epinephrine', dose: '0.5 ml SC', route: 'SC', qty: 2, unit: 'Amp', critical: true, notes: 'Pre-load before anti-venom to prevent anaphylaxis' },
      { name: 'Hydrocortisone Sodium Succinate 100mg', genericName: 'Hydrocortisone', dose: '100mg IV stat', route: 'IV', qty: 4, unit: 'Vials', critical: true, notes: '' },
      { name: 'Promethazine 25mg/1ml', genericName: 'Promethazine HCl', dose: '25mg IM', route: 'IM', qty: 2, unit: 'Amp', critical: false, notes: 'Anti-histamine pre-medication' },
      { name: 'Normal Saline 500ml', genericName: 'Sodium Chloride 0.9%', dose: '500ml IV drip', route: 'IV', qty: 4, unit: 'Bottles', critical: true, notes: '' },
      { name: 'Tetanus Toxoid 0.5ml', genericName: 'Tetanus Vaccine', dose: '0.5ml IM', route: 'IM', qty: 1, unit: 'Amp', critical: false, notes: '' },
    ],
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis / Allergic Shock',
    emoji: '🚨',
    color: 'text-rose-800',
    bgColor: 'bg-rose-50',
    activeBg: 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-200',
    borderColor: 'border-rose-300',
    description: 'Severe allergic reaction — immediate epinephrine',
    urgencyLevel: 'CRITICAL',
    firstAidSteps: [
      'Inject Epinephrine 0.5mg IM into outer thigh IMMEDIATELY',
      'Lay patient flat — raise legs unless breathing is difficult',
      'Call ambulance 108 — do not leave patient unattended',
      'Repeat Epi dose after 5 minutes if no improvement',
      'Start IV line — infuse fluids rapidly if BP drops',
    ],
    drugs: [
      { name: 'Adrenaline (Epinephrine) 1mg/1ml', genericName: 'Epinephrine', dose: '0.5mg IM outer thigh', route: 'IM', qty: 3, unit: 'Amp', critical: true, notes: 'First-line treatment — administer immediately' },
      { name: 'Chlorpheniramine 10mg/1ml', genericName: 'Chlorpheniramine Maleate', dose: '10mg IM', route: 'IM', qty: 2, unit: 'Amp', critical: true, notes: '' },
      { name: 'Hydrocortisone Sodium Succinate 100mg', genericName: 'Hydrocortisone', dose: '200mg IV', route: 'IV', qty: 4, unit: 'Vials', critical: true, notes: '' },
      { name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol', dose: '4 puffs via spacer', route: 'Inhalation', qty: 1, unit: 'Inhaler', critical: false, notes: 'For bronchospasm / wheezing' },
      { name: 'Ringer Lactate 500ml', genericName: "Ringer's Lactate", dose: '1L IV rapid bolus', route: 'IV', qty: 2, unit: 'Bottles', critical: true, notes: '' },
    ],
  },
  {
    id: 'cardiac',
    name: 'Cardiac Emergency / Heart Attack',
    emoji: '❤️',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    activeBg: 'bg-red-50/80 border-red-500 ring-2 ring-red-200',
    borderColor: 'border-red-300',
    description: 'STEMI / ACS — rapid aspirin and nitrate therapy',
    urgencyLevel: 'CRITICAL',
    firstAidSteps: [
      'Make patient sit up / semi-reclined — loosen all tight clothing',
      'Give Aspirin 325mg to chew immediately (if not allergic)',
      'Give Sorbitrate 5mg sub-lingual if BP is above 90 systolic',
      'Call ambulance 108 — be ready to perform CPR if needed',
      'Start IV access — do not give large fluid bolus unless hypotensive',
    ],
    drugs: [
      { name: 'Aspirin 325mg', genericName: 'Acetylsalicylic Acid', dose: '325mg chew stat', route: 'Oral', qty: 4, unit: 'Tabs', critical: true, notes: 'Patient must CHEW — not swallow whole' },
      { name: 'Isosorbide Dinitrate (Sorbitrate) 5mg', genericName: 'Isosorbide Dinitrate', dose: '5mg sub-lingual', route: 'Sub-lingual', qty: 3, unit: 'Tabs', critical: true, notes: 'Repeat every 5 min up to 3 doses' },
      { name: 'Clopidogrel 300mg', genericName: 'Clopidogrel', dose: '300mg loading dose', route: 'Oral', qty: 2, unit: 'Tabs', critical: true, notes: '' },
      { name: 'Atropine Sulphate 0.6mg/1ml', genericName: 'Atropine', dose: '0.6mg IV', route: 'IV', qty: 3, unit: 'Amp', critical: false, notes: 'For bradycardia only' },
      { name: 'Normal Saline 100ml', genericName: 'Sodium Chloride 0.9%', dose: 'For drug dilution', route: 'IV', qty: 2, unit: 'Bottles', critical: false, notes: '' },
    ],
  },
  {
    id: 'seizure',
    name: 'Seizure / Epilepsy Attack',
    emoji: '⚡',
    color: 'text-purple-800',
    bgColor: 'bg-purple-50',
    activeBg: 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-200',
    borderColor: 'border-purple-300',
    description: 'Status epilepticus — benzodiazepine protocol',
    urgencyLevel: 'CRITICAL',
    firstAidSteps: [
      'Do NOT restrain patient — clear the area of sharp or hard hazards',
      'Time the seizure duration — if more than 5 min, administer Diazepam',
      'Turn patient to side recovery position once convulsions stop',
      'Loosen tight clothing especially around the neck',
      'Do NOT force anything into patient mouth during seizure',
    ],
    drugs: [
      { name: 'Diazepam 10mg/2ml', genericName: 'Diazepam', dose: '10mg IV slow or PR', route: 'IV / PR', qty: 3, unit: 'Amp', critical: true, notes: 'Max rate 2mg/min IV; can give rectally if no IV access' },
      { name: 'Phenytoin Sodium 250mg/5ml', genericName: 'Phenytoin', dose: '15-20 mg/kg IV', route: 'IV', qty: 4, unit: 'Amp', critical: true, notes: 'Slow infusion over 30 min — monitor ECG' },
      { name: 'Dextrose 25% 50ml', genericName: 'Dextrose', dose: '50ml IV push', route: 'IV', qty: 2, unit: 'Vials', critical: false, notes: 'Rule out hypoglycemia as cause' },
      { name: 'Oxygen Cylinder Portable', genericName: 'Medical Oxygen', dose: '4-6 L/min via mask', route: 'Mask', qty: 1, unit: 'Cylinder', critical: true, notes: '' },
    ],
  },
  {
    id: 'asthma',
    name: 'Severe Asthma / Breathing Crisis',
    emoji: '🫁',
    color: 'text-sky-800',
    bgColor: 'bg-sky-50',
    activeBg: 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-200',
    borderColor: 'border-sky-300',
    description: 'Acute bronchospasm — bronchodilator protocol',
    urgencyLevel: 'HIGH',
    firstAidSteps: [
      'Sit patient upright — lean forward supported on arms',
      'Give Salbutamol inhaler 4 puffs via spacer immediately',
      'If no improvement in 5 minutes — repeat the dose',
      'If peak flow below 50% predicted — treat as life-threatening',
      'Call ambulance if no response after 3 rounds of bronchodilator',
    ],
    drugs: [
      { name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol Sulphate', dose: '4-8 puffs every 20 min', route: 'Inhalation', qty: 2, unit: 'Inhalers', critical: true, notes: '' },
      { name: 'Ipratropium Bromide Inhaler 20mcg', genericName: 'Ipratropium', dose: '4 puffs every 20 min', route: 'Inhalation', qty: 1, unit: 'Inhaler', critical: true, notes: 'Combine with Salbutamol for synergy' },
      { name: 'Prednisolone 40mg', genericName: 'Prednisolone', dose: '40mg oral stat', route: 'Oral', qty: 2, unit: 'Tabs', critical: true, notes: '' },
      { name: 'Aminophylline 250mg/10ml', genericName: 'Aminophylline', dose: '250mg IV over 30 min', route: 'IV', qty: 2, unit: 'Amp', critical: false, notes: 'Only if no response to inhaler therapy' },
    ],
  },
  {
    id: 'burn',
    name: 'Chemical / Thermal Burn',
    emoji: '🔥',
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    activeBg: 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-200',
    borderColor: 'border-amber-300',
    description: 'Pain management and wound care for burns',
    urgencyLevel: 'HIGH',
    firstAidSteps: [
      'Cool burn under running tap water for at least 20 minutes',
      'Do NOT use ice, butter, toothpaste, or home remedies',
      'Cover burn loosely with clean sterile cloth — no tight bandaging',
      'Remove rings and watches near burned area before swelling starts',
      'For chemical burn — brush off dry chemicals first, then flush with water',
    ],
    drugs: [
      { name: 'Silver Sulfadiazine Cream 1%', genericName: 'Silver Sulfadiazine', dose: 'Apply generously to wound', route: 'Topical', qty: 2, unit: 'Tubes', critical: true, notes: '' },
      { name: 'Tramadol 50mg/1ml', genericName: 'Tramadol HCl', dose: '100mg IM', route: 'IM', qty: 2, unit: 'Amp', critical: true, notes: 'Pain management — first line' },
      { name: 'Tetanus Toxoid 0.5ml', genericName: 'Tetanus Vaccine', dose: '0.5ml IM', route: 'IM', qty: 1, unit: 'Amp', critical: true, notes: '' },
      { name: 'Ringer Lactate 500ml', genericName: "Ringer's Lactate", dose: 'Per Parkland formula IV', route: 'IV', qty: 4, unit: 'Bottles', critical: true, notes: '4ml/kg/% burn area in first 24hrs' },
      { name: 'Cefazolin 1g', genericName: 'Cefazolin Sodium', dose: '1g IV every 8 hours', route: 'IV', qty: 6, unit: 'Vials', critical: false, notes: 'Prophylactic antibiotic cover' },
    ],
  },
  {
    id: 'poisoning',
    name: 'Overdose / Poisoning',
    emoji: '☠️',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-50',
    activeBg: 'bg-yellow-50/80 border-yellow-500 ring-2 ring-yellow-200',
    borderColor: 'border-yellow-300',
    description: 'Organophosphate / drug overdose antidotes',
    urgencyLevel: 'CRITICAL',
    firstAidSteps: [
      'Identify the poison — check containers, bottles, or vomit samples',
      'Do NOT induce vomiting for corrosive or petroleum-based poisoning',
      'Give activated charcoal if within 1 hour of ingestion and patient is conscious',
      'Call Poison Control immediately: 1800-116-117 (India Toll-Free)',
      'Monitor breathing closely — be ready to perform CPR',
    ],
    drugs: [
      { name: 'Activated Charcoal 50g', genericName: 'Activated Charcoal', dose: '50g in 200ml water oral', route: 'Oral', qty: 2, unit: 'Sachets', critical: true, notes: 'Only within 1 hour of ingestion; patient must be conscious' },
      { name: 'Atropine Sulphate 0.6mg/1ml', genericName: 'Atropine', dose: '2-4mg IV repeat every 10 min', route: 'IV', qty: 10, unit: 'Amp', critical: true, notes: 'For organophosphate / nerve agent poisoning' },
      { name: 'Pralidoxime Chloride 1g', genericName: 'Pralidoxime', dose: '1-2g IV slow infusion', route: 'IV', qty: 4, unit: 'Vials', critical: true, notes: 'Organophosphate antidote — always with Atropine' },
      { name: 'Naloxone 0.4mg/1ml', genericName: 'Naloxone HCl', dose: '0.4-2mg IV or IM', route: 'IV / IM', qty: 4, unit: 'Amp', critical: true, notes: 'Opioid overdose reversal — may repeat every 2-3 min' },
      { name: 'N-Acetylcysteine 600mg', genericName: 'Acetylcysteine', dose: '150mg/kg IV over 15min', route: 'IV', qty: 10, unit: 'Amp', critical: false, notes: 'Paracetamol/Tylenol overdose antidote' },
    ],
  },
];

// ─── Main Component (Light Theme) ─────────────────────────────────────────────

export const EmergencyDeliveryPage: React.FC = () => {
  const [selectedKit, setSelectedKit] = useState<EmergencyKit | null>(null);
  const [checkedSet, setCheckedSet] = useState<Set<string>>(new Set());
  const [dispatchedDrugs, setDispatchedDrugs] = useState<EmergencyDrug[]>([]);
  const [patientName, setPatientName] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [billGenerated, setBillGenerated] = useState(false);
  const [showFirstAid, setShowFirstAid] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive) interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleSelectKit = (kit: EmergencyKit) => {
    setSelectedKit(kit);
    setCheckedSet(new Set());
    setDispatchedDrugs([]);
    setBillGenerated(false);
    setElapsedSeconds(0);
    setTimerActive(true);
    setShowFirstAid(true);
  };

  const handleToggleDrug = (drug: EmergencyDrug) => {
    if (!selectedKit) return;
    const key = `${selectedKit.id}_${drug.name}`;
    const newSet = new Set(checkedSet);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setCheckedSet(newSet);
  };

  const handleSelectAll = () => {
    if (!selectedKit) return;
    const allKeys = new Set(selectedKit.drugs.map(d => `${selectedKit.id}_${d.name}`));
    if (checkedSet.size === allKeys.size) setCheckedSet(new Set());
    else setCheckedSet(allKeys);
  };

  const handleDispatch = () => {
    if (!selectedKit) return;
    const dispatched = selectedKit.drugs.filter(d => checkedSet.has(`${selectedKit.id}_${d.name}`));
    setDispatchedDrugs(dispatched);
    setBillGenerated(true);
    setTimerActive(false);
  };

  const handleReset = () => {
    setSelectedKit(null);
    setCheckedSet(new Set());
    setDispatchedDrugs([]);
    setBillGenerated(false);
    setPatientName('');
    setLocation('');
    setContact('');
    setElapsedSeconds(0);
    setTimerActive(false);
  };

  const urgencyColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border border-red-200',
    HIGH: 'bg-amber-100 text-amber-800 border border-amber-200',
    MODERATE: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 min-h-screen p-4 space-y-4">

      {/* ── Top Emergency Header Banner (Clean Light-Accented) ── */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-red-50/60 via-white to-rose-50/60">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-sm ring-2 ring-red-100 animate-pulse flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight font-heading uppercase">
                🚨 Emergency Fast Dispensing
              </h1>
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200">
                LIFE CRITICAL
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Rapid life-saving drug dispatch protocols for snake bites, cardiac emergencies, anaphylaxis &amp; poisoning
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {timerActive && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="text-red-900 font-black text-base font-mono tracking-wider">
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-red-700 text-[9.5px] font-bold uppercase">Response Time</span>
            </div>
          )}

          <a
            href="tel:108"
            className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>108 Ambulance</span>
          </a>

          {selectedKit && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Main 3-Column Light Layout ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── LEFT: Emergency Selector ── */}
        <div className="col-span-12 lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Select Emergency Protocol</span>
              <span className="text-slate-400 font-medium">({EMERGENCY_KITS.length} Kits)</span>
            </h2>
            <div className="space-y-1.5">
              {EMERGENCY_KITS.map(kit => {
                const isSelected = selectedKit?.id === kit.id;
                return (
                  <button
                    key={kit.id}
                    onClick={() => handleSelectKit(kit)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? kit.activeBg + ' shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl flex-shrink-0">{kit.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? kit.color : 'text-slate-800'}`}>
                          {kit.name}
                        </div>
                        <div className="text-[9.5px] text-slate-500 truncate">{kit.description}</div>
                      </div>
                      <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 ${urgencyColors[kit.urgencyLevel]}`}>
                        {kit.urgencyLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Helplines Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Phone className="w-3 h-3 text-red-600" />
              <span>National Emergency Helplines</span>
            </h3>
            <div className="space-y-1">
              {[
                { label: 'Emergency / Ambulance', num: '108', color: 'text-red-700 bg-red-50' },
                { label: 'Poison Information Centre', num: '1800-116-117', color: 'text-amber-800 bg-amber-50' },
                { label: 'Police Control Room', num: '100', color: 'text-blue-800 bg-blue-50' },
                { label: 'Fire & Rescue', num: '101', color: 'text-orange-800 bg-orange-50' },
                { label: 'Disaster Helpline', num: '1070', color: 'text-purple-800 bg-purple-50' },
              ].map(e => (
                <a
                  key={e.num}
                  href={`tel:${e.num.replace(/-/g, '')}`}
                  className="flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors cursor-pointer group"
                >
                  <span className="text-[10.5px] text-slate-600 group-hover:text-slate-900 font-medium">{e.label}</span>
                  <span className={`text-[10.5px] font-black px-1.5 py-0.5 rounded font-mono ${e.color}`}>{e.num}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: Protocol + Drug Checklist ── */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          {!selectedKit ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs min-h-[480px] flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 animate-bounce">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 font-heading">
                  Select an Emergency Type
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Choose an emergency scenario from the left panel to load immediate first-aid protocols and drug dispensing checklists.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-xs w-full pt-2">
                {['🐍 Snake Bite', '❤️ Heart Attack', '🚨 Anaphylaxis', '☠️ Poisoning'].map(e => (
                  <div key={e} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-xs font-semibold text-slate-700">
                    {e}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected Kit Header Card */}
              <div className={`bg-white border-2 ${selectedKit.borderColor} rounded-2xl p-4 shadow-2xs`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{selectedKit.emoji}</span>
                    <div>
                      <h2 className={`text-base font-black ${selectedKit.color} font-heading`}>
                        {selectedKit.name}
                      </h2>
                      <p className="text-slate-600 text-xs mt-0.5">{selectedKit.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${urgencyColors[selectedKit.urgencyLevel]}`}>
                    ⚡ {selectedKit.urgencyLevel}
                  </span>
                </div>
              </div>

              {/* Immediate First Aid Steps (Collapsible) */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl overflow-hidden shadow-2xs">
                <button
                  onClick={() => setShowFirstAid(!showFirstAid)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-900 font-extrabold text-xs uppercase tracking-wide">
                      Immediate First Aid Action Steps
                    </span>
                  </div>
                  <span className="text-amber-700 text-[10px] font-bold">
                    {showFirstAid ? 'Hide ▲' : 'Show ▼'}
                  </span>
                </button>

                {showFirstAid && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-amber-200/60">
                    {selectedKit.firstAidSteps.map((step, i) => (
                      <div key={i} className="flex items-start space-x-2.5">
                        <span className="flex-shrink-0 w-5 h-5 bg-amber-600 text-white text-[10px] font-black rounded-full flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-amber-950 text-xs font-medium leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drug Protocol Checklist Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span>Emergency Drug Protocol ({selectedKit.drugs.length} Medicines)</span>
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-extrabold cursor-pointer hover:underline"
                  >
                    {checkedSet.size === selectedKit.drugs.length ? 'Uncheck All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedKit.drugs.map(drug => {
                    const key = `${selectedKit.id}_${drug.name}`;
                    const isChecked = checkedSet.has(key);
                    return (
                      <div
                        key={drug.name}
                        onClick={() => handleToggleDrug(drug)}
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all select-none active:scale-[0.99] ${
                          isChecked
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs'
                            : drug.critical
                            ? 'bg-red-50/40 border-red-200 hover:border-red-400'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {drug.critical && (
                          <span className="absolute top-2.5 right-2.5 text-[8.5px] font-black text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-md">
                            ⚡ CRITICAL
                          </span>
                        )}
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0 pr-12">
                            <div className={`text-xs font-bold leading-tight ${isChecked ? 'text-emerald-950' : 'text-slate-900'}`}>
                              {drug.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{drug.genericName}</div>
                            <div className="flex items-center flex-wrap gap-1 mt-1.5 text-[10px]">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono border border-slate-200">
                                💊 {drug.dose}
                              </span>
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                🩺 {drug.route}
                              </span>
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                                Qty: {drug.qty} {drug.unit}
                              </span>
                            </div>
                            {drug.notes && (
                              <div className="text-[9.5px] text-amber-800 mt-1.5 flex items-start space-x-1 font-medium">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{drug.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Patient Details + Dispatch Action ── */}
        <div className="col-span-12 lg:col-span-4 space-y-3">

          {/* Patient Details Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Patient &amp; Location Details</span>
            </h3>
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Patient Name</label>
                <input
                  type="text"
                  placeholder="Enter patient name..."
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block flex items-center space-x-1">
                  <MapPin className="w-3 h-3 inline" /> Location / Ward / Address
                </label>
                <input
                  type="text"
                  placeholder="Room no, ward, or full delivery address..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Emergency Contact Phone</label>
                <input
                  type="tel"
                  placeholder="Attendant / emergency contact number..."
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Dispatch Summary Panel */}
          {selectedKit && !billGenerated && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>Dispatch Summary</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Emergency Scenario</span>
                  <span className="font-bold text-slate-900">{selectedKit.emoji} {selectedKit.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Drugs Selected</span>
                  <span className={`font-black ${checkedSet.size > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {checkedSet.size} of {selectedKit.drugs.length}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Critical Life-Saving Items</span>
                  <span className="text-red-700 font-bold">
                    {selectedKit.drugs.filter(d => d.critical && checkedSet.has(`${selectedKit.id}_${d.name}`)).length} selected
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-100">
                  <span>Response Timer</span>
                  <span className="text-red-600 font-mono font-black">{formatTime(elapsedSeconds)}</span>
                </div>
              </div>

              <button
                onClick={handleDispatch}
                disabled={checkedSet.size === 0}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center justify-center space-x-2 transition-all ${
                  checkedSet.size > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>🚨 Dispatch Emergency Drugs Now</span>
              </button>
            </div>
          )}

          {/* ── Generated Dispatch Bill Card (Clean Light Style) ── */}
          {billGenerated && dispatchedDrugs.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-red-300 shadow-xl overflow-hidden">
              {/* Bill Header */}
              <div className="bg-gradient-to-r from-red-600 to-rose-700 p-4 text-white">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-black text-sm uppercase tracking-wide">Emergency Dispatch Bill</h3>
                </div>
                <div className="text-red-100 text-[10px] space-y-0.5 mt-1.5">
                  <div>Emergency: <strong className="text-white">{selectedKit?.emoji} {selectedKit?.name}</strong></div>
                  <div>Dispatched: <strong className="text-white">{new Date().toLocaleString('en-IN')}</strong></div>
                  <div>Response Time: <strong className="text-white font-mono">{formatTime(elapsedSeconds)}</strong></div>
                </div>
              </div>

              {/* Patient Info */}
              {(patientName || location || contact) && (
                <div className="px-4 py-2.5 bg-red-50/70 border-b border-red-100 text-xs space-y-0.5 text-slate-800">
                  {patientName && <div><span className="text-slate-500">Patient:</span> <strong>{patientName}</strong></div>}
                  {location && <div><span className="text-slate-500">Location:</span> <strong>{location}</strong></div>}
                  {contact && <div><span className="text-slate-500">Contact:</span> <strong>{contact}</strong></div>}
                </div>
              )}

              {/* Dispatched Drugs List */}
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Dispatched Medicines ({dispatchedDrugs.length})
                </div>
                <div className="space-y-1.5 divide-y divide-slate-100">
                  {dispatchedDrugs.map((drug, i) => (
                    <div key={i} className="pt-1.5 first:pt-0 flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{drug.name}</div>
                        <div className="text-[10px] text-slate-500">{drug.dose} · {drug.route}</div>
                      </div>
                      <div className="text-xs font-black text-slate-800 text-right">
                        {drug.qty} {drug.unit}
                        {drug.critical && <div className="text-[8.5px] text-red-600 font-bold">⚡ Critical</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-[10px] text-red-800 font-bold text-center">
                    ⚠️ EMERGENCY DISPATCH PROTOCOL — PRIORITY HANDLING
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Emergency</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

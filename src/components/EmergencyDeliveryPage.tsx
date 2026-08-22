import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { finalizeEmergencyInvoice } from '../store/posSlice';
import type { FinalizedInvoice, PaymentDetails, PaymentMethodType, CartItem } from '../types/pos';
import {
  AlertTriangle, Zap, Phone, Clock, CheckCircle2, ChevronRight,
  User, MapPin, PackageCheck, Printer, RotateCcw, HeartPulse,
  Bug, Siren, Wind, Flame, Pill, Activity, ShieldAlert, Sparkles,
  QrCode, CreditCard, Banknote, Split, Repeat, ShieldCheck,
  Check, X, FileText, Loader2, Smartphone
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmergencyDrug {
  name: string;
  genericName: string;
  dose: string;
  route: string;
  qty: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  hsnCode: string;
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

// ─── Emergency Kit Data (With Medicine Prices & GST Codes) ───────────────────

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
      { name: 'Polyvalent Anti-Snake Venom Serum', genericName: 'Anti-Venom Injection', dose: '10 vials IV over 1 hr', route: 'IV', qty: 10, unit: 'Vials', unitPrice: 450, gstRate: 12, hsnCode: '30021200', critical: true, notes: 'Dilute in NS 100ml per vial; pre-load Adrenaline first' },
      { name: 'Adrenaline (Epinephrine) 1mg/1ml', genericName: 'Epinephrine', dose: '0.5 ml SC', route: 'SC', qty: 2, unit: 'Amp', unitPrice: 85, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Pre-load before anti-venom to prevent anaphylaxis' },
      { name: 'Hydrocortisone Sodium Succinate 100mg', genericName: 'Hydrocortisone', dose: '100mg IV stat', route: 'IV', qty: 4, unit: 'Vials', unitPrice: 65, gstRate: 12, hsnCode: '30043200', critical: true, notes: '' },
      { name: 'Promethazine 25mg/1ml', genericName: 'Promethazine HCl', dose: '25mg IM', route: 'IM', qty: 2, unit: 'Amp', unitPrice: 30, gstRate: 12, hsnCode: '30049099', critical: false, notes: 'Anti-histamine pre-medication' },
      { name: 'Normal Saline 500ml', genericName: 'Sodium Chloride 0.9%', dose: '500ml IV drip', route: 'IV', qty: 4, unit: 'Bottles', unitPrice: 45, gstRate: 12, hsnCode: '30049099', critical: true, notes: '' },
      { name: 'Tetanus Toxoid 0.5ml', genericName: 'Tetanus Vaccine', dose: '0.5ml IM', route: 'IM', qty: 1, unit: 'Amp', unitPrice: 25, gstRate: 5, hsnCode: '30022019', critical: false, notes: '' },
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
      { name: 'Adrenaline (Epinephrine) 1mg/1ml', genericName: 'Epinephrine', dose: '0.5mg IM outer thigh', route: 'IM', qty: 3, unit: 'Amp', unitPrice: 85, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'First-line treatment — administer immediately' },
      { name: 'Chlorpheniramine 10mg/1ml', genericName: 'Chlorpheniramine Maleate', dose: '10mg IM', route: 'IM', qty: 2, unit: 'Amp', unitPrice: 20, gstRate: 12, hsnCode: '30049099', critical: true, notes: '' },
      { name: 'Hydrocortisone Sodium Succinate 100mg', genericName: 'Hydrocortisone', dose: '200mg IV', route: 'IV', qty: 4, unit: 'Vials', unitPrice: 65, gstRate: 12, hsnCode: '30043200', critical: true, notes: '' },
      { name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol', dose: '4 puffs via spacer', route: 'Inhalation', qty: 1, unit: 'Inhaler', unitPrice: 165, gstRate: 12, hsnCode: '30049099', critical: false, notes: 'For bronchospasm / wheezing' },
      { name: 'Ringer Lactate 500ml', genericName: "Ringer's Lactate", dose: '1L IV rapid bolus', route: 'IV', qty: 2, unit: 'Bottles', unitPrice: 55, gstRate: 12, hsnCode: '30049099', critical: true, notes: '' },
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
      { name: 'Aspirin 325mg', genericName: 'Acetylsalicylic Acid', dose: '325mg chew stat', route: 'Oral', qty: 4, unit: 'Tabs', unitPrice: 14, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Patient must CHEW — not swallow whole' },
      { name: 'Isosorbide Dinitrate (Sorbitrate) 5mg', genericName: 'Isosorbide Dinitrate', dose: '5mg sub-lingual', route: 'Sub-lingual', qty: 3, unit: 'Tabs', unitPrice: 18, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Repeat every 5 min up to 3 doses' },
      { name: 'Clopidogrel 300mg', genericName: 'Clopidogrel', dose: '300mg loading dose', route: 'Oral', qty: 2, unit: 'Tabs', unitPrice: 45, gstRate: 12, hsnCode: '30049099', critical: true, notes: '' },
      { name: 'Atropine Sulphate 0.6mg/1ml', genericName: 'Atropine', dose: '0.6mg IV', route: 'IV', qty: 3, unit: 'Amp', unitPrice: 28, gstRate: 12, hsnCode: '30049099', critical: false, notes: 'For bradycardia only' },
      { name: 'Normal Saline 100ml', genericName: 'Sodium Chloride 0.9%', dose: 'For drug dilution', route: 'IV', qty: 2, unit: 'Bottles', unitPrice: 25, gstRate: 12, hsnCode: '30049099', critical: false, notes: '' },
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
      { name: 'Diazepam 10mg/2ml', genericName: 'Diazepam', dose: '10mg IV slow or PR', route: 'IV / PR', qty: 3, unit: 'Amp', unitPrice: 35, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Max rate 2mg/min IV; can give rectally if no IV access' },
      { name: 'Phenytoin Sodium 250mg/5ml', genericName: 'Phenytoin', dose: '15-20 mg/kg IV', route: 'IV', qty: 4, unit: 'Amp', unitPrice: 60, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Slow infusion over 30 min — monitor ECG' },
      { name: 'Dextrose 25% 50ml', genericName: 'Dextrose', dose: '50ml IV push', route: 'IV', qty: 2, unit: 'Vials', unitPrice: 38, gstRate: 12, hsnCode: '30049099', critical: false, notes: 'Rule out hypoglycemia as cause' },
      { name: 'Oxygen Cylinder Portable', genericName: 'Medical Oxygen', dose: '4-6 L/min via mask', route: 'Mask', qty: 1, unit: 'Cylinder', unitPrice: 450, gstRate: 12, hsnCode: '28044090', critical: true, notes: '' },
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
      { name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol Sulphate', dose: '4-8 puffs every 20 min', route: 'Inhalation', qty: 2, unit: 'Inhalers', unitPrice: 165, gstRate: 12, hsnCode: '30049099', critical: true, notes: '' },
      { name: 'Ipratropium Bromide Inhaler 20mcg', genericName: 'Ipratropium', dose: '4 puffs every 20 min', route: 'Inhalation', qty: 1, unit: 'Inhaler', unitPrice: 220, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Combine with Salbutamol for synergy' },
      { name: 'Prednisolone 40mg', genericName: 'Prednisolone', dose: '40mg oral stat', route: 'Oral', qty: 2, unit: 'Tabs', unitPrice: 22, gstRate: 12, hsnCode: '30043200', critical: true, notes: '' },
      { name: 'Aminophylline 250mg/10ml', genericName: 'Aminophylline', dose: '250mg IV over 30 min', route: 'IV', qty: 2, unit: 'Amp', unitPrice: 42, gstRate: 12, hsnCode: '30049099', critical: false, notes: 'Only if no response to inhaler therapy' },
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
      { name: 'Silver Sulfadiazine Cream 1%', genericName: 'Silver Sulfadiazine', dose: 'Apply generously to wound', route: 'Topical', qty: 2, unit: 'Tubes', unitPrice: 95, gstRate: 12, hsnCode: '30049099', critical: true, notes: '' },
      { name: 'Tramadol 50mg/1ml', genericName: 'Tramadol HCl', dose: '100mg IM', route: 'IM', qty: 2, unit: 'Amp', unitPrice: 48, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Pain management — first line' },
      { name: 'Tetanus Toxoid 0.5ml', genericName: 'Tetanus Vaccine', dose: '0.5ml IM', route: 'IM', qty: 1, unit: 'Amp', unitPrice: 25, gstRate: 5, hsnCode: '30022019', critical: true, notes: '' },
      { name: 'Ringer Lactate 500ml', genericName: "Ringer's Lactate", dose: 'Per Parkland formula IV', route: 'IV', qty: 4, unit: 'Bottles', unitPrice: 55, gstRate: 12, hsnCode: '30049099', critical: true, notes: '4ml/kg/% burn area in first 24hrs' },
      { name: 'Cefazolin 1g', genericName: 'Cefazolin Sodium', dose: '1g IV every 8 hours', route: 'IV', qty: 6, unit: 'Vials', unitPrice: 75, gstRate: 12, hsnCode: '30042099', critical: false, notes: 'Prophylactic antibiotic cover' },
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
      { name: 'Activated Charcoal 50g', genericName: 'Activated Charcoal', dose: '50g in 200ml water oral', route: 'Oral', qty: 2, unit: 'Sachets', unitPrice: 85, gstRate: 12, hsnCode: '38021000', critical: true, notes: 'Only within 1 hour of ingestion; patient must be conscious' },
      { name: 'Atropine Sulphate 0.6mg/1ml', genericName: 'Atropine', dose: '2-4mg IV repeat every 10 min', route: 'IV', qty: 10, unit: 'Amp', unitPrice: 28, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'For organophosphate / nerve agent poisoning' },
      { name: 'Pralidoxime Chloride 1g', genericName: 'Pralidoxime', dose: '1-2g IV slow infusion', route: 'IV', qty: 4, unit: 'Vials', unitPrice: 380, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Organophosphate antidote — always with Atropine' },
      { name: 'Naloxone 0.4mg/1ml', genericName: 'Naloxone HCl', dose: '0.4-2mg IV or IM', route: 'IV / IM', qty: 4, unit: 'Amp', unitPrice: 290, gstRate: 12, hsnCode: '30049099', critical: true, notes: 'Opioid overdose reversal — may repeat every 2-3 min' },
      { name: 'N-Acetylcysteine 600mg', genericName: 'Acetylcysteine', dose: '150mg/kg IV over 15min', route: 'IV', qty: 10, unit: 'Amp', unitPrice: 120, gstRate: 12, hsnCode: '30049099', critical: false, notes: 'Paracetamol/Tylenol overdose antidote' },
    ],
  },
];

interface EmergencySpecialist {
  id: string;
  name: string;
  role: string;
  regNo: string;
  qualification: string;
  phone: string;
  avatarInitials: string;
  isLead?: boolean;
}

const EMERGENCY_SPECIALISTS: EmergencySpecialist[] = [
  {
    id: 'spec-1',
    name: 'Dr. S. Reddy',
    role: 'Chief Emergency Pharmacist (Critical Care & Toxicology)',
    regNo: 'TG-PH-99214',
    qualification: 'Pharm.D (Critical Care), Toxicology Certified',
    phone: '+91 94401 23456',
    avatarInitials: 'SR',
    isLead: true
  },
];

// ─── Main Component (Light Theme) ─────────────────────────────────────────────

export const EmergencyDeliveryPage: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>('spec-1');
  const [pharmacistVerified, setPharmacistVerified] = useState<boolean>(true);
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

  // ── Multi-Mode Payment Modal State (Pic 1 Match) ──
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('UPI');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [upiCountdown, setUpiCountdown] = useState<number>(30);
  const [isUpiSimulated, setIsUpiSimulated] = useState<boolean>(false);
  const [latestEmergencyInvoice, setLatestEmergencyInvoice] = useState<FinalizedInvoice | null>(null);

  const currentSpecialist = EMERGENCY_SPECIALISTS.find(s => s.id === selectedSpecialistId) || EMERGENCY_SPECIALISTS[0];

  // Calculate live pricing and GST for selected drugs
  const selectedDrugs = selectedKit ? selectedKit.drugs.filter(d => checkedSet.has(`${selectedKit.id}_${d.name}`)) : [];
  const subtotal = selectedDrugs.reduce((sum, d) => sum + (d.unitPrice * d.qty), 0);
  const totalCGST = selectedDrugs.reduce((sum, d) => sum + ((d.unitPrice * d.qty * (d.gstRate / 2)) / 100), 0);
  const totalSGST = selectedDrugs.reduce((sum, d) => sum + ((d.unitPrice * d.qty * (d.gstRate / 2)) / 100), 0);
  const grandTotal = subtotal + totalCGST + totalSGST;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerActive) interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // UPI countdown timer in payment modal
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (showPaymentModal && paymentMethod === 'UPI' && !isUpiSimulated) {
      setUpiCountdown(30);
      timer = setInterval(() => {
        setUpiCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsUpiSimulated(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPaymentModal, paymentMethod, isUpiSimulated]);

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
    setLatestEmergencyInvoice(null);
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

  const handleOpenPayment = () => {
    if (!selectedKit || checkedSet.size === 0 || !pharmacistVerified) return;
    setCashTendered(Math.round(grandTotal));
    setIsUpiSimulated(false);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedKit) return;
    setIsSubmittingPayment(true);

    setTimeout(() => {
      const dispatched = selectedKit.drugs.filter(d => checkedSet.has(`${selectedKit.id}_${d.name}`));
      setDispatchedDrugs(dispatched);
      setBillGenerated(true);
      setTimerActive(false);

      const items: CartItem[] = dispatched.map((d, idx) => ({
        cartItemId: `item-sos-${idx}-${Date.now()}`,
        productId: `prod-sos-${idx}`,
        product: {
          _id: `prod-sos-${idx}`,
          name: d.name,
          brand: 'EMERGENCY PROTOCOL',
          saltComposition: d.genericName,
          barcode: `890123456${idx}`,
          hsnCode: d.hsnCode,
          gstRate: d.gstRate,
          unitMRP: Number((d.unitPrice * 1.15).toFixed(2)),
          sellingPrice: d.unitPrice,
          grossMarginPercent: 20,
          scheduleCategory: 'REGULAR',
          stockStatus: 'IN_STOCK',
          totalStock: 50,
          packSize: d.unit,
          batches: [{
            batchNumber: `EM-B${Math.floor(100 + Math.random() * 900)}`,
            expiryDate: '2028-12-31',
            stockQuantity: 50,
            location: 'EMERGENCY_RACK_01',
            mrp: Number((d.unitPrice * 1.15).toFixed(2))
          }]
        },
        selectedBatch: {
          batchNumber: `EM-B${Math.floor(100 + Math.random() * 900)}`,
          expiryDate: '2028-12-31',
          stockQuantity: 50,
          location: 'EMERGENCY_RACK_01',
          mrp: Number((d.unitPrice * 1.15).toFixed(2))
        },
        quantity: d.qty,
        unitMode: 'PACK',
        unitPrice: d.unitPrice,
        discountPercent: 0,
        taxableAmount: d.unitPrice * d.qty,
        cgstAmount: (d.unitPrice * d.qty * (d.gstRate / 2)) / 100,
        sgstAmount: (d.unitPrice * d.qty * (d.gstRate / 2)) / 100,
        totalGst: (d.unitPrice * d.qty * d.gstRate) / 100,
        lineTotal: (d.unitPrice * d.qty) + ((d.unitPrice * d.qty * d.gstRate) / 100)
      }));

      const payment: PaymentDetails = {
        method: paymentMethod,
        cashAmount: paymentMethod === 'CASH' ? grandTotal : 0,
        upiAmount: paymentMethod === 'UPI' ? grandTotal : 0,
        cardAmount: paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD' ? grandTotal : 0,
        creditCardAmount: paymentMethod === 'CREDIT_CARD' ? grandTotal : 0,
        debitCardAmount: paymentMethod === 'DEBIT_CARD' ? grandTotal : 0,
        autoPayAmount: paymentMethod === 'AUTO_PAY' ? grandTotal : 0,
        totalPaid: grandTotal,
        changeDue: paymentMethod === 'CASH' ? Math.max(0, cashTendered - grandTotal) : 0,
        cardLast4: paymentMethod === 'CREDIT_CARD' ? '4242' : '5588',
        cardNetwork: paymentMethod === 'CREDIT_CARD' ? 'VISA' : 'RUPAY',
        paymentStatus: 'SUCCESS'
      };

      const invoice: FinalizedInvoice = {
        invoiceNumber: `INV-SOS-${Math.floor(100000 + Math.random() * 900000)}`,
        invoiceDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        billingSession: {
          id: `session-sos-${Date.now()}`,
          tabTitle: `🚨 SOS: ${patientName || 'Emergency Patient'}`,
          assignedPharmacistId: 'pharm-emergency',
          items,
          doctorDetails: {
            doctorName: `${currentSpecialist.name} (Emergency Protocol)`,
            regNo: currentSpecialist.regNo
          },
          patientDetails: {
            patientName: patientName || 'Emergency Patient',
            phone: contact || '9999999999',
            age: '35',
            gender: 'MALE'
          },
          scheduleXVerified: false,
          pharmacistSignatureAcknowledged: true,
          createdAt: new Date().toISOString()
        },
        subtotal: Number(subtotal.toFixed(2)),
        totalDiscount: 0,
        totalCGST: Number(totalCGST.toFixed(2)),
        totalSGST: Number(totalSGST.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        payment,
        pharmacistName: currentSpecialist.name,
        counterNumber: 4,
        isEmergencyInvoice: true,
        emergencyCondition: selectedKit.name,
        storeInfo: {
          name: 'GENQUANTAA MEDPLUS PHARMACY',
          dlNo: 'DL-2024/HYD/889201',
          gstin: '36AAACG1234F1Z8',
          address: 'Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081',
          phone: '+91 98765 43210'
        }
      };

      // Save to store and open the Tax Invoice & Print View Modal (Image 2)
      dispatch(finalizeEmergencyInvoice(invoice));
      setLatestEmergencyInvoice(invoice);
      setIsSubmittingPayment(false);
      setShowPaymentModal(false);
    }, 700);
  };

  const handleReset = () => {
    setSelectedKit(null);
    setCheckedSet(new Set());
    setDispatchedDrugs([]);
    setBillGenerated(false);
    setLatestEmergencyInvoice(null);
    setPatientName('');
    setLocation('');
    setContact('');
    setElapsedSeconds(0);
    setTimerActive(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 min-h-screen p-4 space-y-4 font-sans">

      {/* ── Top Emergency Header Banner (Clean Light-Accented) ── */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-red-50/60 via-white to-rose-50/60">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-sm ring-2 ring-red-100 animate-pulse flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight font-heading uppercase">
                🚨 Emergency Fast Dispensing &amp; Billing
              </h1>
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200">
                LIFE CRITICAL
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Rapid life-saving drug dispatch protocols with instant multi-mode payment and official tax invoices
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

      {/* ── 👨‍⚕️ Assigned Emergency Specialist Pharmacist on Duty Banner ── */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-2xl border border-red-800 p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black flex items-center justify-center text-sm shadow-md ring-2 ring-red-400/40 flex-shrink-0">
            {currentSpecialist.avatarInitials}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-[10px] bg-red-600/90 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                <span>Assigned Emergency Specialist</span>
              </span>
              <span className="text-xs text-red-200 font-bold">Reg: {currentSpecialist.regNo}</span>
            </div>
            <h3 className="text-sm font-black text-white mt-1 flex items-center space-x-2">
              <span>{currentSpecialist.name}</span>
              <span className="text-xs text-red-200 font-medium hidden md:inline">({currentSpecialist.qualification})</span>
            </h3>
            <p className="text-[11px] text-slate-300">{currentSpecialist.role} • 📞 {currentSpecialist.phone}</p>
          </div>
        </div>

        {/* Chief Emergency Pharmacist — Fixed (No Dropdown) */}
        <div className="flex items-center space-x-2 w-full sm:w-auto bg-black/40 border border-red-800/80 px-3 py-2 rounded-xl">
          <span className="text-xs text-red-300 font-bold whitespace-nowrap">Specialist:</span>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-black text-white whitespace-nowrap">
              Dr. S. Reddy (Chief) - Reg: TG-PH-99214
            </span>
          </div>
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
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                      isSelected
                        ? kit.activeBg
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{kit.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{kit.name}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          kit.urgencyLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {kit.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{kit.description}</p>
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

        {/* ── CENTER: Selected Kit Details & Drug Protocol ── */}
        <div className="col-span-12 lg:col-span-5 space-y-3">
          {selectedKit ? (
            <div className="space-y-3">
              {/* Protocol Details Header */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{selectedKit.emoji}</span>
                    <div>
                      <h2 className="text-sm font-black text-slate-900">{selectedKit.name} Protocol</h2>
                      <p className="text-xs text-slate-500">{selectedKit.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {checkedSet.size === selectedKit.drugs.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Drugs Checkbox List */}
                <div className="space-y-2">
                  {selectedKit.drugs.map((drug) => {
                    const key = `${selectedKit.id}_${drug.name}`;
                    const isChecked = checkedSet.has(key);
                    const itemTotal = drug.unitPrice * drug.qty;

                    return (
                      <div
                        key={drug.name}
                        onClick={() => handleToggleDrug(drug)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 select-none ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">{drug.name}</h4>
                            <span className="text-xs font-black text-slate-900">₹{itemTotal.toFixed(2)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{drug.genericName} • {drug.dose} ({drug.route})</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                              Qty: {drug.qty} {drug.unit} @ ₹{drug.unitPrice}
                            </span>
                            <span className="text-[10px] text-slate-400">GST: {drug.gstRate}%</span>
                            {drug.critical && (
                              <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded uppercase">
                                ⚡ Critical
                              </span>
                            )}
                          </div>
                          {drug.notes && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 border border-amber-200">
                              ⚠️ {drug.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 space-y-2">
              <Siren className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Select an emergency protocol on the left to begin dispensing</p>
              <p className="text-[11px] text-slate-400">Snake bite, cardiac arrest, anaphylaxis, asthma crisis &amp; overdose</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Patient Details + Multi-Mode Billing Action ── */}
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

          {/* Dispatch & Billing Summary Panel */}
          {selectedKit && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>Emergency Billing Summary</span>
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
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (CGST + SGST)</span>
                  <span className="font-semibold text-slate-900">₹{(totalCGST + totalSGST).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-extrabold text-sm">
                  <span>Grand Total (Payable)</span>
                  <span className="text-emerald-700 font-heading text-base font-black">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Specialist Verification Sign-Off Card */}
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-red-950">
                  <span className="flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Specialist Verification</span>
                  </span>
                  <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.2 rounded font-black">{currentSpecialist.regNo}</span>
                </div>
                <label className="flex items-center space-x-2 text-[11px] text-slate-700 cursor-pointer font-medium pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={pharmacistVerified}
                    onChange={e => setPharmacistVerified(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Verified by <strong>{currentSpecialist.name}</strong></span>
                </label>
              </div>

              {/* 💳 Proceed to Payment & Tax Invoice Button (Opens Multi-Mode Terminal) */}
              <button
                onClick={handleOpenPayment}
                disabled={checkedSet.size === 0 || !pharmacistVerified}
                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 ${
                  checkedSet.size > 0 && pharmacistVerified
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white cursor-pointer animate-pulse'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>💳 Pay ₹{grandTotal.toFixed(2)} &amp; Generate Invoice</span>
              </button>
            </div>
          )}

          {/* ── Generated Dispatch Bill Card ── */}
          {billGenerated && dispatchedDrugs.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-emerald-400 shadow-xl overflow-hidden animate-fadeIn">
              {/* Bill Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    <h3 className="font-black text-sm uppercase tracking-wide">Emergency Bill Finalized</h3>
                  </div>
                  <span className="bg-emerald-900/80 text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40">
                    PAID &amp; INVOICED
                  </span>
                </div>
                <div className="text-emerald-100 text-[10px] space-y-0.5 mt-2">
                  <div>Invoice #: <strong className="text-white">{latestEmergencyInvoice?.invoiceNumber || 'INV-SOS-RECENT'}</strong></div>
                  <div>Scenario: <strong className="text-white">{selectedKit?.emoji} {selectedKit?.name}</strong></div>
                  <div>Grand Total: <strong className="text-white text-xs">₹{grandTotal.toFixed(2)}</strong></div>
                </div>
              </div>

              {/* 👨‍⚕️ Assigned Specialist Verification Stamp */}
              <div className="px-4 py-2 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Dispensing Specialist</div>
                    <div className="font-bold text-white leading-tight">{currentSpecialist.name} ({currentSpecialist.regNo})</div>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  ✓ SIGNED OFF
                </span>
              </div>

              {/* Actions */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    if (latestEmergencyInvoice) {
                      dispatch(finalizeEmergencyInvoice(latestEmergencyInvoice));
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-md active:scale-98"
                >
                  <FileText className="w-4 h-4" />
                  <span>📄 View &amp; Print Official Tax Invoice (A4 / Thermal)</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-95 border border-slate-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>New Emergency</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 💳 MULTI-MODE PAYMENT TERMINAL MODAL (Image 1 Match) ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[95vh] flex flex-col">
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  MULTI-MODE PAYMENT TERMINAL
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-heading mt-1">
                  Select Billing Payment Method
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-4">
              
              {/* Grand Total Display Card (Image 1 Banner) */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-xs text-emerald-100 font-medium">Payable Amount (GST &amp; Discounts Applied)</p>
                  <h2 className="text-3xl font-black font-heading tracking-tight">₹{grandTotal.toFixed(2)}</h2>
                </div>
                <div className="text-right space-y-1">
                  <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-xs font-bold inline-block">
                    {selectedDrugs.length} Cart Items
                  </div>
                  <div className="text-[10px] text-emerald-200">
                    Patient: <span className="font-bold text-white">{patientName || 'Walk-in Customer'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Grid (6 buttons matching Image 1) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {/* 1. Dynamic UPI */}
                <button
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-indigo-600" />
                  <span className="text-[11px] leading-tight text-center">Dynamic UPI QR</span>
                </button>

                {/* 2. Cash */}
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                  <span className="text-[11px] leading-tight text-center">Cash</span>
                </button>

                {/* 3. Credit Card */}
                <button
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mb-1 text-blue-600" />
                  <span className="text-[11px] leading-tight text-center">Credit Card</span>
                </button>

                {/* 4. Debit Card */}
                <button
                  onClick={() => setPaymentMethod('DEBIT_CARD')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentMethod === 'DEBIT_CARD'
                      ? 'bg-sky-50 border-sky-600 text-sky-700 ring-2 ring-sky-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 mb-1 text-sky-600" />
                  <span className="text-[11px] leading-tight text-center">Debit Card</span>
                </button>

                {/* 5. Auto Pay Refill */}
                <button
                  onClick={() => setPaymentMethod('AUTO_PAY')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentMethod === 'AUTO_PAY'
                      ? 'bg-purple-50 border-purple-600 text-purple-700 ring-2 ring-purple-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Repeat className="w-5 h-5 mb-1 text-purple-600" />
                  <span className="text-[11px] leading-tight text-center">Auto Pay Refill</span>
                </button>

                {/* 6. Split Bill */}
                <button
                  onClick={() => setPaymentMethod('SPLIT')}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentMethod === 'SPLIT'
                      ? 'bg-amber-50 border-amber-600 text-amber-700 ring-2 ring-amber-600/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Split className="w-5 h-5 mb-1 text-amber-600" />
                  <span className="text-[11px] leading-tight text-center">Split Bill</span>
                </button>
              </div>

              {/* Dynamic Content based on selected payment method */}
              {paymentMethod === 'UPI' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
                  {/* Stylized QR Code Visual (Exact Image 1 Match) */}
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="10" width="30" height="30" rx="4" fill="#0f172a" />
                      <rect x="60" y="10" width="30" height="30" rx="4" fill="#0f172a" />
                      <rect x="10" y="60" width="30" height="30" rx="4" fill="#0f172a" />
                      <rect x="18" y="18" width="14" height="14" rx="2" fill="white" />
                      <rect x="68" y="18" width="14" height="14" rx="2" fill="white" />
                      <rect x="18" y="68" width="14" height="14" rx="2" fill="white" />
                      <rect x="48" y="48" width="16" height="16" rx="2" fill="#0f172a" />
                      <rect x="48" y="20" width="8" height="16" rx="2" fill="#0f172a" />
                      <rect x="20" y="48" width="16" height="8" rx="2" fill="#0f172a" />
                      <rect x="70" y="48" width="18" height="8" rx="2" fill="#0f172a" />
                      <rect x="70" y="68" width="12" height="8" rx="2" fill="#0f172a" />
                      <rect x="68" y="78" width="18" height="10" rx="2" fill="#0f172a" />
                    </svg>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>
                        {isUpiSimulated
                          ? '✅ UPI Payment Received & Verified!'
                          : `Waiting for customer scan... Auto-verifying in ${upiCountdown}s`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsUpiSimulated(true)}
                    className="w-full max-w-sm py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                    <span>⚡ Simulate Instant UPI Scan (PhonePe / GPay / Paytm)</span>
                  </button>
                </div>
              )}

              {paymentMethod === 'CASH' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Cash Tendered (₹)</label>
                      <input
                        type="number"
                        value={cashTendered || ''}
                        onChange={e => setCashTendered(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Change Due (₹)</label>
                      <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-emerald-700">
                        ₹{Math.max(0, cashTendered - grandTotal).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1.5">
                    {[100, 200, 500, 1000, 2000, 5000].map(val => (
                      <button
                        key={val}
                        onClick={() => setCashTendered(val)}
                        className="flex-1 py-1 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-center">
                  <CreditCard className="w-8 h-8 mx-auto text-blue-600" />
                  <p className="text-xs font-bold text-slate-800">Card Terminal Ready (EDC Swiped / Chip Read)</p>
                  <p className="text-[11px] text-slate-500">Card ending with •••• 4242 (Visa) — Auth Code: AUTH-{Math.floor(100000 + Math.random() * 900000)}</p>
                </div>
              )}

              {paymentMethod === 'AUTO_PAY' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-center">
                  <Repeat className="w-8 h-8 mx-auto text-purple-600" />
                  <p className="text-xs font-bold text-slate-800">AutoPay Monthly Refill Mandate</p>
                  <p className="text-[11px] text-slate-500">e-Mandate: MN-2026-884920 • Patient VPA: {contact ? `${contact}@upi` : 'customer@okhdfcbank'}</p>
                </div>
              )}

              {paymentMethod === 'SPLIT' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Cash Portion:</span>
                    <span className="font-bold">₹{(grandTotal / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPI / Card Portion:</span>
                    <span className="font-bold">₹{(grandTotal / 2).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions (Image 1 Bottom Bar) */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPayment}
                disabled={isSubmittingPayment}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer active:scale-95"
              >
                {isSubmittingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirm {paymentMethod} &amp; Generate Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

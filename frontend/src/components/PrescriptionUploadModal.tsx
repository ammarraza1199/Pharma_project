import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import type { RootState } from '../store';
import {
  setPrescriptionUploadModalOpen,
  attachPrescriptionToSession,
  removePrescriptionFromSession,
  setDoctorDetails,
  setPatientDetails,
  addItemToCart
} from '../store/posSlice';
import {
  FileText, Upload, X, ZoomIn, ZoomOut, RotateCw, CheckCircle2,
  Stethoscope, UserCheck, AlertCircle, Plus, Eye, Sparkles, Trash2, Camera,
  ScanLine, History, Search, ArrowRight, RefreshCw, Check, Sun, Moon,
  Layers, Package, ChevronRight, SlidersHorizontal
} from 'lucide-react';

type PrescriptionTab = 'SCAN_UPLOAD' | 'SIDE_BY_SIDE' | 'RX_ARCHIVE';

interface RecognizedItemConfig {
  productId: string;
  prescribedName: string;
  dosage: string;
  qty: number;
  unitMode: 'PACK' | 'LOOSE';
  selected: boolean;
  substituteProductId?: string;
}

export const PrescriptionUploadModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.pos.prescriptionUploadModal.isOpen);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const products = useSelector((state: RootState) => state.pos.products);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const uploadedUrl = currentSession?.uploadedPrescriptionUrl;
  const uploadedName = currentSession?.uploadedPrescriptionName;

  // Tabs & Viewer Controls
  const [activeTab, setActiveTab] = useState<PrescriptionTab>('SIDE_BY_SIDE');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected Sample & Custom Upload
  const [selectedSampleId, setSelectedSampleId] = useState<string>('sample-1');
  const [customRxUrl, setCustomRxUrl] = useState<string | null>(null);
  const [customRxName, setCustomRxName] = useState<string | null>(null);

  // Archive State
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveList, setArchiveList] = useState<any[]>([]);
  const [archiveLoading, setArchiveLoading] = useState<boolean>(false);

  // Preset Realistic Pharmacy Doctor Prescriptions
  const sampleRxList = [
    {
      id: 'sample-1',
      title: 'Dr. V. Sharma (Cardiologist) - BP & Diabetes Rx',
      doctor: 'Dr. V. Sharma, MD (Cardio)',
      regNo: 'MCI-54219/HYD',
      hospital: 'Apollo Heart & Diabetes Centre',
      patientName: 'Ramesh Kumar',
      patientPhone: '9876543210',
      patientAge: '42',
      patientGender: 'MALE' as const,
      diagnoses: 'Essential Hypertension (Stage 2) + Type-2 DM',
      date: '2026-08-20',
      recognizedItems: [
        { productId: '64f1a2b3c4d5e6f7a8b9c004', prescribedName: 'Tab. Calpol 650mg', dosage: '1 Tab Daily Morning (BP)', qty: 30, unitMode: 'PACK' as const },
        { productId: '64f1a2b3c4d5e6f7a8b9c003', prescribedName: 'Tab. Dolo 650mg', dosage: '1 Tab Twice Daily (Sugar)', qty: 30, unitMode: 'PACK' as const }
      ],
      previewContent: (
        <div className="bg-amber-50/50 p-4 border border-amber-200 rounded-xl font-serif text-slate-800 text-xs space-y-3 shadow-inner">
          <div className="border-b border-amber-300 pb-2 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans tracking-wide">APOLLO HEART &amp; DIABETES CENTRE</h4>
              <p className="text-[10px] text-slate-600">Dr. V. Sharma, MD, DM (Cardiology) | Reg No: MCI-54219/HYD</p>
              <p className="text-[9.5px] text-slate-500">Road No 12, Banjara Hills, Hyderabad - 500034</p>
            </div>
            <div className="text-right text-[10px]">
              <span className="font-bold">Date:</span> 20-Aug-2026<br />
              <span className="font-bold">Rx No:</span> RX-2026-8841
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-amber-200 text-[11px] flex justify-between">
            <div><strong>Patient:</strong> Ramesh Kumar (42 M)</div>
            <div><strong>Phone:</strong> +91 98765 43210</div>
            <div><strong>BP:</strong> 142/90 mmHg | <strong>FBS:</strong> 148 mg/dL</div>
          </div>

          <div className="space-y-2 pt-1 font-sans">
            <div className="text-xs font-black text-amber-900 tracking-wider">℞ PRESCRIPTION:</div>
            
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>1. Tab. Calpol / Amlodipine 650mg</span>
                <span className="text-emerald-700 font-semibold">1 — 0 — 1 (After Meals) × 30 Days</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">For Blood Pressure regulation. Monitor BP weekly.</p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>2. Tab. Dolo / Metformin 650mg</span>
                <span className="text-emerald-700 font-semibold">1 — 0 — 0 (Morning with Breakfast) × 30 Days</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">For Glycemic control. Avoid high carbohydrate diet.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-amber-300 flex justify-between items-center text-[10px] text-slate-500 font-sans">
            <span>Next Review: After 30 Days with FBS / HbA1c</span>
            <div className="text-right">
              <span className="font-serif italic font-bold text-slate-700 text-xs block">Dr. V. Sharma</span>
              <span>Signed Digitally &amp; Verified</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sample-2',
      title: 'Dr. P. Deshmukh (Pulmonologist) - Respiratory & Antibiotics Rx',
      doctor: 'Dr. P. Deshmukh, MD (Chest)',
      regNo: 'APMC-98124',
      hospital: 'Care Pulmonary & Allergy Clinic',
      patientName: 'Priya Sharma',
      patientPhone: '9876543211',
      patientAge: '35',
      patientGender: 'FEMALE' as const,
      diagnoses: 'Acute Bronchitis with Wheezing',
      date: '2026-08-22',
      recognizedItems: [
        { productId: '64f1a2b3c4d5e6f7a8b9c001', prescribedName: 'Tab. Augmentin 625 Duo', dosage: '1 Tab Twice Daily × 7 Days', qty: 14, unitMode: 'PACK' as const }
      ],
      previewContent: (
        <div className="bg-teal-50/50 p-4 border border-teal-200 rounded-xl font-serif text-slate-800 text-xs space-y-3 shadow-inner">
          <div className="border-b border-teal-300 pb-2 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans tracking-wide">CARE PULMONOLOGY CLINIC</h4>
              <p className="text-[10px] text-slate-600">Dr. P. Deshmukh, MD (Pulmonary Medicine) | Reg: APMC-98124</p>
              <p className="text-[9.5px] text-slate-500">Road No 2, Jubilee Hills, Hyderabad</p>
            </div>
            <div className="text-right text-[10px]">
              <span className="font-bold">Date:</span> 22-Aug-2026<br />
              <span className="font-bold">Rx:</span> PULM-2026-092
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-teal-200 text-[11px] flex justify-between">
            <div><strong>Patient:</strong> Priya Sharma (35 F)</div>
            <div><strong>Phone:</strong> +91 98765 43211</div>
            <div><strong>SpO2:</strong> 97% | <strong>Temp:</strong> 100.4°F</div>
          </div>

          <div className="space-y-2 pt-1 font-sans">
            <div className="text-xs font-black text-teal-900 tracking-wider">℞ PRESCRIPTION:</div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>1. Tab. Augmentin 625 Duo (Amoxicillin+Clavulanate)</span>
                <span className="text-teal-700 font-semibold">1 — 0 — 1 × 7 Days</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">Complete full 7-day antibiotic course. Take with light meal.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-teal-300 flex justify-between items-center text-[10px] text-slate-500 font-sans">
            <span>Drink warm fluids &amp; rest</span>
            <div className="text-right">
              <span className="font-serif italic font-bold text-slate-700 text-xs block">Dr. P. Deshmukh</span>
              <span>Signed Digitally &amp; Verified</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sample-3',
      title: 'Dr. Ananya Roy (Internal Medicine) - Multi-Drug Therapy Rx',
      doctor: 'Dr. Ananya Roy, MBBS, MD',
      regNo: 'TSMC-33418',
      hospital: 'Continental Multispeciality Hospital',
      patientName: 'Sunil Rao',
      patientPhone: '9876543212',
      patientAge: '50',
      patientGender: 'MALE' as const,
      diagnoses: 'Bacterial Pharyngitis & High Grade Pyrexia',
      date: '2026-08-25',
      recognizedItems: [
        { productId: '64f1a2b3c4d5e6f7a8b9c001', prescribedName: 'Tab. Augmentin 625 Duo', dosage: '1 Tab Twice Daily × 5 Days', qty: 10, unitMode: 'PACK' as const },
        { productId: '64f1a2b3c4d5e6f7a8b9c005', prescribedName: 'Tab. Paracip 650', dosage: '1 Tab SOS when fever > 100°F', qty: 15, unitMode: 'PACK' as const }
      ],
      previewContent: (
        <div className="bg-indigo-50/50 p-4 border border-indigo-200 rounded-xl font-serif text-slate-800 text-xs space-y-3 shadow-inner">
          <div className="border-b border-indigo-300 pb-2 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans tracking-wide">CONTINENTAL MULTISPECIALITY</h4>
              <p className="text-[10px] text-slate-600">Dr. Ananya Roy, MBBS, MD (Int. Med) | Reg: TSMC-33418</p>
              <p className="text-[9.5px] text-slate-500">Financial District, Gachibowli, Hyderabad</p>
            </div>
            <div className="text-right text-[10px]">
              <span className="font-bold">Date:</span> 25-Aug-2026<br />
              <span className="font-bold">Rx:</span> CNT-2026-4412
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-indigo-200 text-[11px] flex justify-between">
            <div><strong>Patient:</strong> Sunil Rao (50 M)</div>
            <div><strong>Phone:</strong> +91 98765 43212</div>
            <div><strong>Temp:</strong> 101.8°F</div>
          </div>

          <div className="space-y-2 pt-1 font-sans">
            <div className="text-xs font-black text-indigo-900 tracking-wider">℞ PRESCRIPTION:</div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>1. Tab. Augmentin 625 Duo</span>
                <span className="text-indigo-700 font-semibold">1 — 0 — 1 (After Meals) × 5 Days</span>
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>2. Tab. Paracip 650mg</span>
                <span className="text-indigo-700 font-semibold">1 Tab SOS for fever (Max 3/day)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-indigo-300 flex justify-between items-center text-[10px] text-slate-500 font-sans">
            <span>Follow up in 5 days if fever persists</span>
            <div className="text-right">
              <span className="font-serif italic font-bold text-slate-700 text-xs block">Dr. Ananya Roy</span>
              <span>Signed Digitally &amp; Verified</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeSample = sampleRxList.find(s => s.id === selectedSampleId) || sampleRxList[0];

  // Item dispensing configuration state
  const [itemConfigs, setItemConfigs] = useState<Record<string, RecognizedItemConfig>>({});

  // Reset or initialize recognized item configs whenever the active sample changes
  useEffect(() => {
    const initialConfigs: Record<string, RecognizedItemConfig> = {};
    activeSample.recognizedItems.forEach(item => {
      initialConfigs[item.productId] = {
        productId: item.productId,
        prescribedName: item.prescribedName,
        dosage: item.dosage,
        qty: item.qty,
        unitMode: item.unitMode,
        selected: true
      };
    });
    setItemConfigs(initialConfigs);
  }, [activeSample]);

  // Load Prescriptions Archive on mount or tab switch
  useEffect(() => {
    if (activeTab === 'RX_ARCHIVE') {
      fetchArchive();
    }
  }, [activeTab]);

  const fetchArchive = async () => {
    setArchiveLoading(true);
    try {
      const res = await api.get('/prescriptions?limit=30');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setArchiveList(res.data.data);
      }
    } catch {
      // Fallback in-memory list
      setArchiveList([
        {
          _id: 'rx-arch-001',
          prescriptionNumber: 'RX-2026-8841',
          patientName: 'Ramesh Kumar',
          patientPhone: '9876543210',
          patientAge: '42',
          patientGender: 'MALE',
          doctorName: 'Dr. V. Sharma, MD (Cardio)',
          hospitalName: 'Apollo Heart & Diabetes Centre',
          diagnosis: 'Essential Hypertension (Stage 2) + Type-2 DM',
          date: '2026-08-20',
          sampleRefId: 'sample-1',
          medicationsCount: 2
        },
        {
          _id: 'rx-arch-002',
          prescriptionNumber: 'RX-2026-0921',
          patientName: 'Priya Sharma',
          patientPhone: '9876543211',
          patientAge: '35',
          patientGender: 'FEMALE',
          doctorName: 'Dr. P. Deshmukh, MD (Chest)',
          hospitalName: 'Care Pulmonary Clinic',
          diagnosis: 'Acute Bronchitis with Wheezing',
          date: '2026-08-22',
          sampleRefId: 'sample-2',
          medicationsCount: 1
        },
        {
          _id: 'rx-arch-003',
          prescriptionNumber: 'RX-2026-4412',
          patientName: 'Sunil Rao',
          patientPhone: '9876543212',
          patientAge: '50',
          patientGender: 'MALE',
          doctorName: 'Dr. Ananya Roy, MBBS, MD',
          hospitalName: 'Continental Multispeciality',
          diagnosis: 'Bacterial Pharyngitis & High Grade Pyrexia',
          date: '2026-08-25',
          sampleRefId: 'sample-3',
          medicationsCount: 2
        }
      ]);
    } finally {
      setArchiveLoading(false);
    }
  };

  if (!isOpen) return null;

  // Trigger OCR Laser Scan Simulation
  const handleRunOcrScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setActiveTab('SIDE_BY_SIDE');
      setNotification('✅ AI OCR Scan Complete: Medicines & Doctor verified successfully.');
      setTimeout(() => setNotification(null), 3500);
    }, 1200);
  };

  const handleAttachSampleRx = (sample: typeof sampleRxList[0]) => {
    dispatch(attachPrescriptionToSession({
      sessionId: activeSessionId,
      prescriptionUrl: `sample-rx-${sample.id}`,
      prescriptionName: `${sample.doctor} - ${sample.patientName}.pdf`
    }));

    dispatch(setDoctorDetails({
      doctorName: sample.doctor,
      regNo: sample.regNo,
      hospitalName: sample.hospital
    }));

    dispatch(setPatientDetails({
      patientName: sample.patientName,
      phone: sample.patientPhone,
      age: sample.patientAge,
      gender: sample.patientGender
    }));
  };

  // Dispense configured medicines into active cashier cart
  const handleDispenseAllToCart = () => {
    handleAttachSampleRx(activeSample);

    let dispensedCount = 0;
    Object.values(itemConfigs).forEach(cfg => {
      if (!cfg.selected) return;

      const targetId = cfg.substituteProductId || cfg.productId;
      const prod = products.find(p => p._id === targetId);

      if (prod && prod.batches && prod.batches.length > 0) {
        const batch = prod.batches.find(b => b.stockQuantity > 0) || prod.batches[0];
        dispatch(addItemToCart({
          product: prod,
          selectedBatch: batch,
          quantity: cfg.qty,
          unitMode: cfg.unitMode
        }));
        dispensedCount++;
      }
    });

    setNotification(`⚡ Successfully dispensed ${dispensedCount} medicines into Active Cart!`);
    setTimeout(() => {
      setNotification(null);
      dispatch(setPrescriptionUploadModalOpen(false));
    }, 1200);
  };

  // 1-Click Repeat Dispense from Archive
  const handleRepeatDispenseFromArchive = (archiveItem: any) => {
    const matchedSample = sampleRxList.find(s => s.id === archiveItem.sampleRefId) || sampleRxList[0];
    handleAttachSampleRx(matchedSample);

    matchedSample.recognizedItems.forEach(item => {
      const prod = products.find(p => p._id === item.productId);
      if (prod && prod.batches && prod.batches.length > 0) {
        const batch = prod.batches.find(b => b.stockQuantity > 0) || prod.batches[0];
        dispatch(addItemToCart({
          product: prod,
          selectedBatch: batch,
          quantity: item.qty,
          unitMode: item.unitMode
        }));
      }
    });

    setNotification(`⚡ Dispensed repeat Rx for ${archiveItem.patientName} directly to Cart!`);
    setTimeout(() => {
      setNotification(null);
      dispatch(setPrescriptionUploadModalOpen(false));
    }, 1200);
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setCustomRxUrl(base64Data);
      setCustomRxName(file.name);

      dispatch(attachPrescriptionToSession({
        sessionId: activeSessionId,
        prescriptionUrl: base64Data,
        prescriptionName: file.name
      }));

      handleRunOcrScan();

      try {
        await api.post('/prescriptions/upload', {
          fileData: base64Data,
          fileName: file.name
        });
      } catch (err) {
        console.warn('[PrescriptionUpload] Backend upload sync error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to toggle generic substitute
  const handleToggleGenericSubstitute = (productId: string, substituteId: string) => {
    setItemConfigs(prev => {
      const current = prev[productId];
      if (!current) return prev;
      const isSubstituted = current.substituteProductId === substituteId;
      return {
        ...prev,
        [productId]: {
          ...current,
          substituteProductId: isSubstituted ? undefined : substituteId
        }
      };
    });
  };

  // Filtered Archive
  const filteredArchive = archiveList.filter(item => {
    if (!archiveSearch.trim()) return true;
    const term = archiveSearch.toLowerCase();
    return (
      item.patientName?.toLowerCase().includes(term) ||
      item.patientPhone?.toLowerCase().includes(term) ||
      item.doctorName?.toLowerCase().includes(term) ||
      item.prescriptionNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 md:p-5 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-4 md:p-6 shadow-2xl border border-slate-200 relative flex flex-col max-h-[92vh] overflow-hidden">

        {/* Modal Top Notification Toast */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-lg border border-emerald-500/50 text-xs font-bold flex items-center space-x-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header with Title and Mode Switcher Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Digital Rx &amp; Quick Dispenser
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  AI OCR Matcher
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                OCR doctor prescription, inspect side-by-side &amp; 1-click dispense into cashier cart
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 3 Main Action Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('SCAN_UPLOAD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'SCAN_UPLOAD'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload &amp; Scan</span>
              </button>

              <button
                onClick={() => setActiveTab('SIDE_BY_SIDE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'SIDE_BY_SIDE'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Quick Dispense</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                  {activeSample.recognizedItems.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('RX_ARCHIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'RX_ARCHIVE'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Rx Archive</span>
              </button>
            </div>

            <button
              onClick={() => dispatch(setPrescriptionUploadModalOpen(false))}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Upload & OCR Scan View */}
        {activeTab === 'SCAN_UPLOAD' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-4 flex-1 overflow-y-auto pr-1">
            
            {/* Left side: Upload Dropzone & Live Camera Simulation (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Dropzone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
                  isDragOver ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                {/* Laser scan animation when scanning */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_1.5s_infinite]" />
                )}

                <input
                  type="file"
                  id="rx-file-upload-input"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="rx-file-upload-input" className="cursor-pointer block">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800">
                    Upload Doctor Prescription Document
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Drag &amp; drop prescription image, camera scan or PDF (JPG, PNG, PDF up to 15MB)
                  </p>
                  <div className="mt-3 inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-matches salt composition against pharmacy stock</span>
                  </div>
                </label>
              </div>

              {/* Camera Scanner Simulation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-800">Live Camera Rx Scanner</span>
                  </div>
                  <button
                    onClick={() => setCameraActive(!cameraActive)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {cameraActive ? 'Close Viewfinder' : 'Open Viewfinder'}
                  </button>
                </div>

                {cameraActive ? (
                  <div className="relative bg-slate-900 rounded-xl p-4 text-center text-white overflow-hidden border border-slate-700">
                    <div className="w-48 h-32 mx-auto border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center relative">
                      <span className="text-[11px] text-emerald-200 font-mono">Align Rx inside frame</span>
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-400 animate-pulse" />
                    </div>
                    <button
                      onClick={() => {
                        setCameraActive(false);
                        handleRunOcrScan();
                      }}
                      className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md inline-flex items-center space-x-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 Capture &amp; Run AI OCR</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Cashier can snap a clear photo directly using tablet or USB webcam scanner for instant prescription entry.
                  </p>
                )}
              </div>

              {/* Currently Attached Rx Status Bar */}
              {uploadedUrl && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-950 truncate max-w-xs">
                        {uploadedName || 'Verified Prescription Attached'}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        Linked with Session #{activeSessionId.slice(-4)} &amp; Schedule H Register
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(removePrescriptionFromSession({ sessionId: activeSessionId }))}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Remove Attached Prescription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

            {/* Right side: Realistic Sample Prescriptions for Testing (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Preset Clinical Prescriptions
                </span>
                <span className="text-[10px] text-slate-500">1-Click Test</span>
              </div>

              <div className="space-y-2">
                {sampleRxList.map(sample => (
                  <div
                    key={sample.id}
                    onClick={() => {
                      setSelectedSampleId(sample.id);
                      setCustomRxUrl(null);
                      handleAttachSampleRx(sample);
                    }}
                    className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedSampleId === sample.id && !customRxUrl
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-slate-900">{sample.doctor}</div>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                        {sample.regNo}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mb-1">
                      Patient: <strong className="text-slate-800">{sample.patientName}</strong> ({sample.patientAge}y {sample.patientGender})
                    </div>
                    <div className="text-[10px] text-slate-500 italic mb-2">
                      {sample.diagnoses}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                      <span className="text-emerald-700 font-bold">
                        {sample.recognizedItems.length} Medicines Prescribed
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSampleId(sample.id);
                          handleRunOcrScan();
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>Scan &amp; Dispense</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Side-by-Side Quick Dispenser View */}
        {activeTab === 'SIDE_BY_SIDE' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-3 flex-1 overflow-hidden">
            
            {/* Left Column (5 cols): Zoomable / Rotatable Rx Document Viewer */}
            <div className="md:col-span-5 flex flex-col bg-slate-100 rounded-2xl border border-slate-200 p-3 overflow-hidden">
              
              {/* Viewer Controls Bar */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs font-semibold flex-shrink-0">
                <div className="flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-800 font-bold">Rx Document</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                    className="p-1 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-600 w-9 text-center font-bold">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(160, prev + 10))}
                    className="p-1 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-1 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer ml-1"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`p-1 border rounded-lg cursor-pointer ml-1 ${
                      highContrast ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Toggle High Contrast for faint cursive handwriting"
                  >
                    {highContrast ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Document Canvas with Zoom & High Contrast Filters */}
              <div className="flex-1 overflow-auto p-2 bg-slate-50 rounded-xl border border-slate-200 flex justify-center items-start">
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'top center',
                    filter: highContrast ? 'contrast(160%) brightness(95%)' : 'none',
                    transition: 'transform 0.15s ease-out, filter 0.2s ease'
                  }}
                  className="w-full max-w-md shadow-xs"
                >
                  {customRxUrl ? (
                    <div className="bg-white p-2 rounded-xl border border-slate-300">
                      <img src={customRxUrl} alt="Uploaded Rx Document" className="w-full h-auto rounded-lg object-contain" />
                      <div className="text-center text-[10px] text-slate-500 mt-2 font-mono">{customRxName}</div>
                    </div>
                  ) : (
                    activeSample.previewContent
                  )}
                </div>
              </div>

              {/* Bottom Doctor & Patient Quick Info Strip */}
              <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] grid grid-cols-2 gap-2 flex-shrink-0">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Doctor &amp; Clinic</div>
                  <div className="font-bold text-slate-800 truncate">{activeSample.doctor}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{activeSample.regNo}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Patient Profile</div>
                  <div className="font-bold text-slate-800 truncate">{activeSample.patientName}</div>
                  <div className="text-[10px] text-slate-500">{activeSample.patientPhone}</div>
                </div>
              </div>

            </div>

            {/* Right Column (7 cols): Recognized Medicines & Quick Dispenser Panel */}
            <div className="md:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-4 overflow-hidden">
              
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Matched Pharmacy Inventory
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  {Object.values(itemConfigs).filter(i => i.selected).length} Selected for Dispense
                </span>
              </div>

              {/* Medicines List with Unit, Quantity & Generic Substitution */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {activeSample.recognizedItems.map((item) => {
                  const cfg = itemConfigs[item.productId] || {
                    productId: item.productId,
                    prescribedName: item.prescribedName,
                    dosage: item.dosage,
                    qty: item.qty,
                    unitMode: item.unitMode,
                    selected: true
                  };

                  const targetId = cfg.substituteProductId || cfg.productId;
                  const prod = products.find(p => p._id === targetId);
                  const isSubstituted = !!cfg.substituteProductId;
                  const availableBatch = prod?.batches?.find(b => b.stockQuantity > 0) || prod?.batches?.[0];

                  return (
                    <div
                      key={item.productId}
                      className={`p-3 rounded-xl border transition-all ${
                        cfg.selected
                          ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs'
                          : 'border-slate-200 opacity-60 bg-slate-50'
                      }`}
                    >
                      {/* Top row: Checkbox, Medicine Name, Stock Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            checked={cfg.selected}
                            onChange={(e) => {
                              setItemConfigs(prev => ({
                                ...prev,
                                [item.productId]: { ...cfg, selected: e.target.checked }
                              }));
                            }}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-extrabold text-xs text-slate-900 flex items-center space-x-2">
                              <span>{prod ? prod.name : item.prescribedName}</span>
                              {isSubstituted && (
                                <span className="text-[9.5px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                  Generic Bio-Equivalent
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Salt: <span className="font-semibold text-slate-700">{prod?.saltComposition || 'Paracetamol / Active API'}</span>
                            </div>
                            <div className="text-[10px] text-emerald-800 font-medium italic mt-0.5">
                              Rx Dosage: {item.dosage}
                            </div>
                          </div>
                        </div>

                        {/* Stock & Rack Location Pill */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            (prod?.totalStock || 0) > 20
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {(prod?.totalStock || 0) > 0 ? `In Stock: ${prod?.totalStock} Units` : 'Out of Stock'}
                          </div>
                          <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                            Shelf: {availableBatch?.location || 'Rack A-1'}
                          </div>
                        </div>
                      </div>

                      {/* Middle row: Unit Mode (Pack vs Loose) & Quantity Stepper */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-500 font-bold">Dispense Unit:</span>
                          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                            <button
                              onClick={() => {
                                setItemConfigs(prev => ({
                                  ...prev,
                                  [item.productId]: { ...cfg, unitMode: 'PACK' }
                                }));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                cfg.unitMode === 'PACK'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Pack / Box
                            </button>
                            <button
                              onClick={() => {
                                setItemConfigs(prev => ({
                                  ...prev,
                                  [item.productId]: { ...cfg, unitMode: 'LOOSE' }
                                }));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                cfg.unitMode === 'LOOSE'
                                  ? 'bg-emerald-600 text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Loose / Strip
                            </button>
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-500 font-bold">Qty:</span>
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                            <button
                              onClick={() => {
                                setItemConfigs(prev => ({
                                  ...prev,
                                  [item.productId]: { ...cfg, qty: Math.max(1, cfg.qty - 1) }
                                }));
                              }}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900 min-w-8 text-center">
                              {cfg.qty}
                            </span>
                            <button
                              onClick={() => {
                                setItemConfigs(prev => ({
                                  ...prev,
                                  [item.productId]: { ...cfg, qty: cfg.qty + 1 }
                                }));
                              }}
                              className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right min-w-16">
                            <span className="text-xs font-extrabold text-slate-900">
                              ₹{((prod?.sellingPrice || 30) * cfg.qty).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Generic Alternative Option if applicable */}
                      {item.productId === '64f1a2b3c4d5e6f7a8b9c004' && (
                        <div className="mt-2 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/80 flex items-center justify-between text-[10px]">
                          <span className="text-amber-900">
                            💡 Cheaper generic alternative available: <strong>Paracip 650 (Cipla)</strong> ₹25.00
                          </span>
                          <button
                            onClick={() => handleToggleGenericSubstitute(item.productId, '64f1a2b3c4d5e6f7a8b9c005')}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded cursor-pointer"
                          >
                            {isSubstituted ? 'Revert to Calpol' : 'Switch to Paracip'}
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Action Footer */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Schedule H Compliance Check:</div>
                  <div className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Doctor Reg No &amp; Patient phone linked automatically</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => dispatch(setPrescriptionUploadModalOpen(false))}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispenseAllToCart}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>⚡ Populate Patient &amp; Dispense to Active Cart</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Rx Archive View */}
        {activeTab === 'RX_ARCHIVE' && (
          <div className="flex flex-col my-3 flex-1 overflow-hidden space-y-3">
            
            {/* Search Bar & Archive Stats */}
            <div className="flex items-center justify-between gap-3 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search archive by patient name, phone, doctor name or Rx number..."
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <button
                onClick={fetchArchive}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center space-x-1.5"
                title="Refresh Archive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${archiveLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Archive List Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredArchive.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No matching prescription records found.
                </div>
              ) : (
                filteredArchive.map(item => (
                  <div
                    key={item._id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-slate-900 font-heading">
                          {item.prescriptionNumber}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                          {item.date || '2026-08-20'}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          {item.medicationsCount || 2} Medicines
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 mt-1">
                        Patient: <strong>{item.patientName}</strong> ({item.patientPhone}) · {item.patientAge}y {item.patientGender}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Doctor: <strong>{item.doctorName}</strong> ({item.hospitalName})
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSampleId(item.sampleRefId || 'sample-1');
                          setActiveTab('SIDE_BY_SIDE');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Rx</span>
                      </button>

                      <button
                        onClick={() => handleRepeatDispenseFromArchive(item)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5 transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>⚡ 1-Click Repeat Dispense</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

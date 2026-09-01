import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  Stethoscope, UserCheck, AlertCircle, Plus, Eye, Sparkles, Trash2, Camera
} from 'lucide-react';

export const PrescriptionUploadModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.pos.prescriptionUploadModal.isOpen);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const products = useSelector((state: RootState) => state.pos.products);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const uploadedUrl = currentSession?.uploadedPrescriptionUrl;
  const uploadedName = currentSession?.uploadedPrescriptionName;

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedSample, setSelectedSample] = useState<string>('sample-1');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  if (!isOpen) return null;

  // Preset Realistic Pharmacy Doctor Prescriptions for quick testing
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
        { productId: '64f1a2b3c4d5e6f7a8b9c004', name: 'Calpol 650mg Tablet', dosage: '1 Tab Daily Morning (BP)', qty: 30 },
        { productId: '64f1a2b3c4d5e6f7a8b9c003', name: 'Dolo 650 Tablet', dosage: '1 Tab Twice Daily (Sugar)', qty: 30 }
      ],
      previewContent: (
        <div className="bg-amber-50/40 p-4 border border-amber-200 rounded-xl font-serif text-slate-800 text-xs space-y-3 shadow-inner">
          <div className="border-b border-amber-300 pb-2 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans">APOLLO HEART &amp; DIABETES CENTRE</h4>
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
                <span className="text-emerald-700">1 — 0 — 1 (After Meals) × 30 Days</span>
              </div>
              <p className="text-[10px] text-slate-500 italic">For Blood Pressure regulation. Monitor BP weekly.</p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>2. Tab. Dolo / Metformin 650mg</span>
                <span className="text-emerald-700">1 — 0 — 0 (Morning with Breakfast) × 30 Days</span>
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
        { productId: '64f1a2b3c4d5e6f7a8b9c001', name: 'Augmentin 625 Duo Tablet', dosage: '1 Tab Twice Daily', qty: 14 }
      ],
      previewContent: (
        <div className="bg-teal-50/40 p-4 border border-teal-200 rounded-xl font-serif text-slate-800 text-xs space-y-3 shadow-inner">
          <div className="border-b border-teal-300 pb-2 flex justify-between items-start">
            <div>
              <h4 className="font-bold text-sm text-slate-900 font-sans">CARE PULMONOLOGY CLINIC</h4>
              <p className="text-[10px] text-slate-600">Dr. P. Deshmukh, MD (Pulmonary Medicine) | Reg: APMC-98124</p>
            </div>
            <div className="text-right text-[10px]">
              <span className="font-bold">Date:</span> 22-Aug-2026
            </div>
          </div>

          <div className="bg-white p-2 rounded-lg border border-teal-200 text-[11px]">
            <strong>Patient:</strong> Priya Sharma (35 F) | <strong>Phone:</strong> +91 98765 43211
          </div>

          <div className="space-y-2 pt-1 font-sans">
            <div className="text-xs font-black text-teal-900">℞ PRESCRIPTION:</div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex justify-between font-bold text-slate-900">
                <span>1. Tab. Augmentin 625 Duo (Amoxicillin+Clavulanate)</span>
                <span className="text-teal-700">1 — 0 — 1 × 7 Days</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeSample = sampleRxList.find(s => s.id === selectedSample) || sampleRxList[0];

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

  const handleAddRecognizedItemToCart = (prodId: string, qty: number) => {
    const prod = products.find(p => p._id === prodId);
    if (prod && prod.batches && prod.batches.length > 0) {
      const batch = prod.batches.find(b => b.stockQuantity > 0) || prod.batches[0];
      dispatch(addItemToCart({
        product: prod,
        selectedBatch: batch,
        quantity: qty,
        unitMode: 'PACK'
      }));
    }
  };

  const handleAddAllRecognizedToCart = () => {
    activeSample.recognizedItems.forEach(item => {
      handleAddRecognizedItemToCart(item.productId, item.qty);
    });
  };

  const handlePopulateAndClose = () => {
    handleAttachSampleRx(activeSample);
    handleAddAllRecognizedToCart();
    dispatch(setPrescriptionUploadModalOpen(false));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch(attachPrescriptionToSession({
        sessionId: activeSessionId,
        prescriptionUrl: url,
        prescriptionName: file.name
      }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch(attachPrescriptionToSession({
        sessionId: activeSessionId,
        prescriptionUrl: url,
        prescriptionName: file.name
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-heading">
                Upload &amp; Verify Doctor Prescription (℞)
              </h3>
              <p className="text-[11px] text-slate-500">Attach doctor Rx to invoice, view side-by-side &amp; auto-populate chronic patient items</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setPrescriptionUploadModalOpen(false))}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-3 flex-1 overflow-y-auto pr-1">
          
          {/* Left Column: Upload / Select Rx (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            
            {/* File Upload Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                isDragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <input
                type="file"
                id="rx-file-input"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="rx-file-input" className="cursor-pointer block">
                <Upload className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800">
                  Click to Upload or Drag &amp; Drop Rx
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, PDF, Camera Scans (up to 10MB)</p>
              </label>
            </div>

            {/* Currently Attached Rx Status */}
            {uploadedUrl && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-900 truncate max-w-[180px]">
                      {uploadedName || 'Prescription Attached'}
                    </div>
                    <div className="text-[10px] text-emerald-700">Attached to active billing session</div>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(removePrescriptionFromSession({ sessionId: activeSessionId }))}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  title="Remove Attached Prescription"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Realistic Demo / Preset Doctor Prescriptions */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Sample Doctor Prescriptions (1-Click Test)
              </span>
              <div className="space-y-1.5">
                {sampleRxList.map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      setSelectedSample(sample.id);
                      handleAttachSampleRx(sample);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      selectedSample === sample.id
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{sample.title}</div>
                      <div className="text-[10px] text-slate-500">
                        Patient: <strong>{sample.patientName}</strong> ({sample.patientPhone})
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Recognized Medicines in Prescription */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recognized Medicines ({activeSample.recognizedItems.length})</span>
                </span>
                <button
                  onClick={handleAddAllRecognizedToCart}
                  className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg transition-all cursor-pointer active:scale-95"
                >
                  ⚡ Add All to Cart
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                {activeSample.recognizedItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.dosage} · Qty: {item.qty}</div>
                    </div>
                    <button
                      onClick={() => handleAddRecognizedItemToCart(item.productId, item.qty)}
                      className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                      title="Add this medicine to cart"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Zoomable Rx Document Viewer (7 cols) */}
          <div className="md:col-span-7 flex flex-col bg-slate-100 rounded-xl border border-slate-200 p-3">
            
            {/* Viewer Controls */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200 text-xs font-semibold">
              <span className="text-slate-700 font-bold flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Side-by-Side Rx Document Preview</span>
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                  className="p-1 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-600 px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
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
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="flex-1 overflow-auto p-2 bg-white rounded-lg border border-slate-200 flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
                className="w-full max-w-lg"
              >
                {activeSample.previewContent}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-shrink-0 text-xs">
          <span className="text-slate-500 text-[11px]">
            Prescription is automatically attached to invoice and Schedule H register.
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => dispatch(setPrescriptionUploadModalOpen(false))}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePopulateAndClose}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>⚡ Add Prescribed Items Directly to Billing</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

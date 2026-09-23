import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPatientInstructionModalOpen, setPILLanguage } from '../store/posSlice';
import type { PILLanguage, Product } from '../types/pos';
import { SUPPORTED_PIL_LANGUAGES, getOrCreateLeaflet } from '../mock/pilCatalog';
import { formatPhoneForWhatsApp } from '../utils/whatsappShare';
import {
  FileText,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Printer,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  ShieldAlert,
  Info,
  Thermometer,
  Trash2,
  Languages,
  X,
  User,
  Stethoscope
} from 'lucide-react';

export const PatientInstructionModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.patientInstructionModal);
  const settings = useSelector((state: RootState) => state.pos.settings);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Fallback product if none passed
  const activeProduct: Product = modal.selectedProduct || {
    _id: 'sample-prod-001',
    name: 'Augmentin 625 Duo Tablet',
    brand: 'GlaxoSmithKline',
    saltComposition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    barcode: '8901234567890',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 201.5,
    sellingPrice: 185.0,
    grossMarginPercent: 24.5,
    scheduleCategory: 'SCHEDULE_H',
    stockStatus: 'IN_STOCK',
    totalStock: 140,
    batches: []
  };

  const leaflet = getOrCreateLeaflet(activeProduct);
  const currentLang = modal.selectedLanguage || 'en';
  const activeVoiceClip = leaflet.voiceClips[currentLang] || leaflet.voiceClips.en;

  // Audio Speech State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechProgress, setSpeechProgress] = useState<number>(0);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Printable ref
  const printContentRef = useRef<HTMLDivElement>(null);

  // Stop speech synthesis on modal close or unmount
  useEffect(() => {
    if (!modal.isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setSpeechProgress(0);
    }
  }, [modal.isOpen]);

  // Restart speech if language changes while playing
  useEffect(() => {
    if (isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      handlePlayVoice(currentLang);
    }
  }, [currentLang]);

  const handlePlayVoice = (langCode: PILLanguage = currentLang) => {
    if (!('speechSynthesis' in window)) {
      setSpeechError('Web Speech API is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const script = leaflet.voiceClips[langCode]?.voiceScript || leaflet.voiceClips.en.voiceScript;
    const utterance = new SpeechSynthesisUtterance(script);

    // Pick speech locale
    const langMeta = SUPPORTED_PIL_LANGUAGES.find((l) => l.code === langCode);
    utterance.lang = langMeta ? langMeta.speechLocale : 'en-IN';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0, 2))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setSpeechError(null);
      setSpeechProgress(10);
    };

    utterance.onboundary = (event) => {
      if (script.length > 0) {
        const progress = Math.min(95, Math.round((event.charIndex / script.length) * 100));
        setSpeechProgress(progress);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setSpeechProgress(100);
      setTimeout(() => setSpeechProgress(0), 1000);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsPlaying(false);
      setSpeechProgress(0);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseVoice = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      }
    }
  };

  const handleReplayVoice = () => {
    handlePlayVoice(currentLang);
  };

  const handleSpeedToggle = () => {
    const nextRate = speechRate === 0.75 ? 1.0 : speechRate === 1.0 ? 1.25 : 0.75;
    setSpeechRate(nextRate);
    if (isPlaying) {
      handlePlayVoice(currentLang);
    }
  };

  // WhatsApp sharing of PIL instructions
  const handleShareWhatsApp = () => {
    const patientPhone = modal.patientName ? activeSession?.patientDetails.phone : '';
    const phone = formatPhoneForWhatsApp(patientPhone || '');

    const message = `*PATIENT MEDICATION INSTRUCTION LEAFLET (PIL)*
*Pharmacy:* ${settings.storeName || 'GENQUANTAA Pharmacy'}
*Medicine:* ${leaflet.medicineName} (${leaflet.brand})
*Salt Composition:* ${leaflet.saltComposition}
----------------------------------------
*HOW TO TAKE:*
${leaflet.howToTake}

*DOSAGE TIMING:*
${leaflet.timingRecommendation}

*FOOD RELATION:*
${leaflet.foodInstructions}

*IF YOU MISS A DOSE:*
${leaflet.missedDoseAdvice}

*KEY WARNINGS & SIDE EFFECTS:*
• ${leaflet.sideEffects.common.slice(0, 2).join('\n• ')}
${leaflet.sideEffects.severeAlerts.length > 0 ? `*Emergency Alert:* ${leaflet.sideEffects.severeAlerts[0]}` : ''}

*STORAGE:*
${leaflet.storageAdvice}
----------------------------------------
_For any severe adverse reaction, consult your physician immediately._`;

    const encoded = encodeURIComponent(message);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Browser Print trigger for the leaflet
  const handlePrint = () => {
    window.print();
  };

  if (!modal.isOpen) return null;

  const patientName = modal.patientName || activeSession?.patientDetails.patientName;
  const doctorName = modal.doctorName || activeSession?.doctorDetails.doctorName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* ── 1. MODAL HEADER ──────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between flex-shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold font-heading tracking-tight text-white">
                  Patient Instruction Leaflet (PIL)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Multilingual Audio &amp; Leaflet
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5 flex items-center space-x-2">
                <span>{leaflet.medicineName}</span>
                <span>•</span>
                <span className="text-slate-300">{leaflet.saltComposition}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Print / Save Leaflet PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Share Leaflet via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={() => dispatch(setPatientInstructionModalOpen({ isOpen: false }))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Leaflet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. MULTI-LANGUAGE VOICE CLIPS AUDIO PLAYER ───────────────────── */}
        <div className="bg-gradient-to-r from-slate-50 via-teal-50/40 to-slate-50 border-b border-slate-200 px-5 py-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {/* Language Switcher Tabs */}
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1 text-xs font-bold text-slate-700 mr-1.5">
                <Languages className="w-3.5 h-3.5 text-teal-700" />
                <span>Audio Voice Language:</span>
              </div>
              {SUPPORTED_PIL_LANGUAGES.map((lang) => {
                const isActive = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => dispatch(setPILLanguage(lang.code))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-600/30'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.nativeLabel}</span>
                    <span className="text-[10px] opacity-75">({lang.label})</span>
                  </button>
                );
              })}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                onClick={handleSpeedToggle}
                className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {speechRate}x Speed
              </button>

              <button
                onClick={handleReplayVoice}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                title="Restart Spoken Audio"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {isPlaying ? (
                <button
                  onClick={handlePauseVoice}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer animate-pulse"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Voice</span>
                </button>
              ) : (
                <button
                  onClick={() => handlePlayVoice(currentLang)}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Play Voice Clip</span>
                </button>
              )}
            </div>
          </div>

          {/* Sound Wave Animation & Spoken Script Banner */}
          <div className="mt-2.5 bg-white rounded-xl p-2.5 border border-teal-200/80 shadow-xs flex items-center space-x-3">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex-shrink-0">
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-teal-600 animate-bounce' : 'text-slate-400'}`} />
              <div className="flex items-end space-x-0.5 h-4 w-10 justify-center">
                <span className={`w-1 bg-teal-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
                <span className={`w-1 bg-teal-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-4 animate-ping' : 'h-1.5'}`} />
                <span className={`w-1 bg-teal-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-2 animate-pulse' : 'h-1'}`} />
                <span className={`w-1 bg-teal-600 rounded-full transition-all duration-300 ${isPlaying ? 'h-3.5 animate-bounce' : 'h-1'}`} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-800 font-medium leading-relaxed italic truncate sm:whitespace-normal">
                &ldquo;{activeVoiceClip.voiceScript}&rdquo;
              </p>
              {isPlaying && (
                <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${speechProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {speechError && (
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              Note: {speechError}
            </p>
          )}
        </div>

        {/* ── 3. CLINICAL LEAFLET CONTENT BODY (SCROLLABLE & PRINTABLE) ───── */}
        <div
          ref={printContentRef}
          className="flex-1 overflow-y-auto p-5 space-y-5 bg-white print:p-0 print:overflow-visible"
        >
          {/* Pharmacy & Patient Header Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Official Pharmacy Dispensing Leaflet
              </span>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {settings.storeName || 'GENQUANTAA Retail Pharmacy'}
              </h3>
              <p className="text-xs text-slate-500">
                {settings.address || 'Licensed Pharmacy Premises'} • DL No: {settings.dlNo || 'DL-20B-10293'}
              </p>
            </div>

            {(patientName || doctorName) && (
              <div className="flex items-center space-x-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4 text-xs">
                {patientName && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Patient</span>
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <User className="w-3 h-3 text-teal-600" />
                      <span>{patientName}</span>
                    </span>
                  </div>
                )}
                {doctorName && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Prescribed By</span>
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <Stethoscope className="w-3 h-3 text-indigo-600" />
                      <span>{doctorName.trim().startsWith('Dr') ? doctorName : `Dr. ${doctorName}`}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Medicine Card Overview */}
          <div className="border border-teal-200 bg-teal-50/30 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/60 pb-3">
              <div>
                <h4 className="text-lg font-bold text-slate-900 font-heading">
                  {leaflet.medicineName}
                </h4>
                <p className="text-xs font-medium text-slate-600">
                  <strong className="text-teal-800">Active Salt:</strong> {leaflet.saltComposition}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  {leaflet.dosageForm}
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                    leaflet.scheduleCategory === 'SCHEDULE_H'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : leaflet.scheduleCategory === 'SCHEDULE_H1'
                      ? 'bg-orange-100 text-orange-900 border-orange-300'
                      : leaflet.scheduleCategory === 'SCHEDULE_X'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {leaflet.scheduleCategory.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Therapeutic Class
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">{leaflet.therapeuticCategory}</p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 md:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Clinical Indication (Why it is given)
                </span>
                <p className="font-semibold text-slate-800 mt-0.5">{leaflet.indication}</p>
              </div>
            </div>
          </div>

          {/* Core Dosage & Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: How & When to Take */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold font-heading text-sm mb-2.5">
                <Clock className="w-4 h-4" />
                <span>How &amp; When to Take</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Administration:</span>
                  <p className="text-slate-600 leading-relaxed">{leaflet.howToTake}</p>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-700 block">Recommended Timing:</span>
                  <p className="text-slate-600 leading-relaxed">{leaflet.timingRecommendation}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Food & Beverage Relation */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold font-heading text-sm mb-2.5">
                <Pill className="w-4 h-4" />
                <span>Food, Meals &amp; Alcohol Precautions</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Meal Relation:</span>
                  <p className="text-slate-600 leading-relaxed">{leaflet.foodInstructions}</p>
                </div>
                <div className="border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-700 block">Missed Dose Guideline:</span>
                  <p className="text-slate-600 leading-relaxed">{leaflet.missedDoseAdvice}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Spoken Native Guidance Bullet Points */}
          <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4">
            <h5 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center space-x-1.5 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>Key Patient Summary Points ({activeVoiceClip.languageLabel})</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activeVoiceClip.keyInstructions.map((inst, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-white p-2.5 rounded-lg border border-teal-200/80">
                  <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 font-medium leading-tight">{inst}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Effects & Emergency Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Common Mild Reactions */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center space-x-2 text-slate-700 font-bold font-heading text-xs mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Common Mild Reactions</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                {leaflet.sideEffects.common.map((eff, i) => (
                  <li key={i}>{eff}</li>
                ))}
              </ul>
            </div>

            {/* High Alert Warnings */}
            <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/40">
              <div className="flex items-center space-x-2 text-rose-700 font-bold font-heading text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Call Doctor Immediately If</span>
              </div>
              <ul className="space-y-1.5 text-rose-800 font-medium list-disc list-inside">
                {leaflet.sideEffects.severeAlerts.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Storage & Safe Disposal */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Safe Storage</span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">{leaflet.storageAdvice}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Safe Disposal</span>
                <p className="text-slate-500 mt-0.5 leading-relaxed">{leaflet.disposalAdvice}</p>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer Footer */}
          <div className="text-[10px] text-slate-400 text-center border-t border-slate-200 pt-3 pb-1">
            This Patient Information Leaflet is provided for educational and clinical guidance only. Always follow the specific instructions of your prescribing physician.
          </div>
        </div>

        {/* ── 4. MODAL ACTION FOOTER ───────────────────────────────────────── */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="text-slate-500 font-medium flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Voice synthesis active in {SUPPORTED_PIL_LANGUAGES.length} regional languages</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => dispatch(setPatientInstructionModalOpen({ isOpen: false }))}
              className="px-4 py-1.5 rounded-lg font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientInstructionModal;

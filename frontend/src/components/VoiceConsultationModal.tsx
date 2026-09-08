import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setVoiceConsultationModalOpen,
  saveConsultationRecord,
  deleteConsultationRecord
} from '../store/posSlice';
import type { VoiceConsultationRecord } from '../types/pos';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Save,
  Trash2,
  Share2,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  FileText,
  Stethoscope,
  Volume2,
  Download,
  AlertCircle,
  X
} from 'lucide-react';

const CATEGORY_OPTIONS: { id: VoiceConsultationRecord['category']; label: string; color: string }[] = [
  { id: 'CHRONIC_CARE', label: 'Chronic Care & Refill', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
  { id: 'DOSAGE_ADMIN', label: 'Dosage & Administration', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  { id: 'ALLERGY_WARNING', label: 'Drug Allergy & Warning', color: 'bg-rose-500/10 text-rose-700 border-rose-200' },
  { id: 'OTC_GUIDANCE', label: 'OTC Symptom Guidance', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  { id: 'PEDIATRIC_GERIATRIC', label: 'Pediatric / Geriatric', color: 'bg-sky-500/10 text-sky-700 border-sky-200' },
  { id: 'GENERAL_ADVICE', label: 'General Health Advice', color: 'bg-teal-500/10 text-teal-700 border-teal-200' },
];

const PRESET_TAGS = [
  '#WithFood',
  '#BeforeBed',
  '#AvoidAlcohol',
  '#CompleteCourse',
  '#ReportDizziness',
  '#BloodSugarLog',
  '#DoctorFollowUp',
  '#DrinkPlentyWater'
];

export const VoiceConsultationModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.voiceConsultationModal);
  const consultationRecords = useSelector((state: RootState) => state.pos.consultationRecords);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const activePharmacist = pharmacists.find(p => p.id === activePharmacistId) || pharmacists[0];

  const [activeTab, setActiveTab] = useState<'RECORD' | 'HISTORY'>('RECORD');

  // Form State
  const [patientName, setPatientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [category, setCategory] = useState<VoiceConsultationRecord['category']>('CHRONIC_CARE');
  const [chiefDiscussion, setChiefDiscussion] = useState<string>('');
  const [pharmacistAdvice, setPharmacistAdvice] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['#WithFood']);
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Audio Recorder State
  const [recordState, setRecordState] = useState<'IDLE' | 'RECORDING' | 'PAUSED' | 'STOPPED'>('IDLE');
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // History Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Initialize with session patient info whenever modal opens
  useEffect(() => {
    if (modal.isOpen) {
      setPatientName(modal.patientName || currentSession?.patientDetails?.patientName || '');
      setPhone(modal.phone || currentSession?.patientDetails?.phone || '');
      setAge(modal.age || currentSession?.patientDetails?.age || '');
      setGender(modal.gender || currentSession?.patientDetails?.gender || 'MALE');
      setMicError(null);
    } else {
      stopRecordingCleanup();
      setRecordState('IDLE');
      setRecordDuration(0);
      setAudioUrl(null);
    }
  }, [modal.isOpen, currentSession]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  // Start Audio Recording
  const startRecording = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // Stop all audio tracks to turn off mic indicator
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(250); // Slice chunks every 250ms
      setRecordState('RECORDING');
      setRecordDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission or hardware issue:', err);
      setMicError(
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. Please allow microphone permissions in browser settings, or use simulated recording below for testing.'
          : `Microphone unavailable (${err.message || 'No mic found'}). You can use simulated sample recording for testing.`
      );
    }
  };

  // Simulated recording fallback for offline/no-mic dev testing
  const startSimulatedRecording = () => {
    setMicError(null);
    setRecordState('RECORDING');
    setRecordDuration(0);

    timerIntervalRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordState('PAUSED');
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    timerIntervalRef.current = setInterval(() => {
      setRecordDuration(prev => prev + 1);
    }, 1000);
    setRecordState('RECORDING');
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (!audioUrl) {
      // If simulated recording, generate a silent/beep tone data URL so audio preview works
      setAudioUrl('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    }

    setRecordState('STOPPED');
  };

  const resetRecording = () => {
    stopRecordingCleanup();
    setRecordState('IDLE');
    setRecordDuration(0);
    setAudioUrl(null);
    setIsPlayingAudio(false);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!selectedTags.includes(formatted)) {
      setSelectedTags([...selectedTags, formatted]);
    }
    setNewTagInput('');
  };

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Please enter or verify the patient name.');
      return;
    }
    if (!chiefDiscussion.trim()) {
      alert('Please enter a brief summary of the patient discussion.');
      return;
    }

    const now = new Date();
    const newRecord: VoiceConsultationRecord = {
      id: `consult-${Date.now()}`,
      patientName: patientName.trim(),
      phone: phone.trim() || '9876543210',
      age: age || undefined,
      gender,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: recordDuration > 0 ? recordDuration : 30,
      audioUrl: audioUrl || undefined,
      category,
      chiefDiscussion: chiefDiscussion.trim(),
      pharmacistAdvice: pharmacistAdvice.trim() || 'Patient instructed on proper dosage and food compliance.',
      tags: selectedTags,
      pharmacistName: activePharmacist.name,
      counterNumber: activePharmacist.counterNumber,
      sessionId: activeSessionId
    };

    dispatch(saveConsultationRecord(newRecord));
    alert('Consultation record & voice note saved successfully!');

    // Reset form and switch to history
    resetRecording();
    setChiefDiscussion('');
    setPharmacistAdvice('');
    setActiveTab('HISTORY');
  };

  const handleShareWhatsApp = (rec: VoiceConsultationRecord) => {
    const targetPhone = rec.phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `*GENQUANTAA PHARMACY - Patient Care & Consultation Summary*\n\n` +
      `👤 *Patient:* ${rec.patientName} (${rec.age ? rec.age + ' yrs' : 'N/A'})\n` +
      `📅 *Date:* ${rec.date} at ${rec.time}\n` +
      `💊 *Category:* ${rec.category.replace('_', ' ')}\n\n` +
      `📋 *Discussion Notes:* ${rec.chiefDiscussion}\n\n` +
      `🩺 *Pharmacist Instructions:* ${rec.pharmacistAdvice}\n\n` +
      `🏷️ *Tags:* ${rec.tags.join(' ')}\n\n` +
      `👨‍⚕️ *Consulting Pharmacist:* ${rec.pharmacistName} (Counter ${rec.counterNumber || 1})\n` +
      `_Thank you for choosing GENQUANTAA Pharmacy. For urgent inquiries, call +91 98765 43210._`
    );
    window.open(`https://wa.me/91${targetPhone}?text=${text}`, '_blank');
  };

  if (!modal.isOpen) return null;

  const filteredRecords = consultationRecords.filter(r => {
    const matchSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.chiefDiscussion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = filterCategory === 'ALL' || r.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Customer Voice Record & Discussion Notes
              </h2>
              <p className="text-xs text-slate-400">
                Record counter microphone consultations, capture clinical discussion notes, and maintain patient audio logs.
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(setVoiceConsultationModalOpen({ isOpen: false }))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── TABS NAVIGATION ────────────────────────────────────────── */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('RECORD')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'RECORD'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Mic className="w-4 h-4 text-rose-600" />
              <span>New Voice Recording & Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Consultation Audio History ({consultationRecords.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pharmacist: <strong className="text-slate-800">{activePharmacist.name}</strong></span>
          </div>
        </div>

        {/* ── MODAL BODY ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'RECORD' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN (5 cols): Audio Recorder Deck */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Counter Microphone
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      recordState === 'RECORDING'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        : recordState === 'PAUSED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : recordState === 'STOPPED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {recordState === 'RECORDING' && '● RECORDING LIVE'}
                      {recordState === 'PAUSED' && '❚❚ PAUSED'}
                      {recordState === 'STOPPED' && '✓ AUDIO CAPTURED'}
                      {recordState === 'IDLE' && 'READY TO RECORD'}
                    </span>
                  </div>

                  {/* Visual Soundwave / Mic Dial */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                      recordState === 'RECORDING'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 animate-pulse'
                        : recordState === 'PAUSED'
                        ? 'bg-amber-500 text-white shadow-md'
                        : recordState === 'STOPPED'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300'
                    }`}>
                      <Mic className="w-12 h-12" />
                    </div>

                    {/* Animated sound wave bars when recording */}
                    {recordState === 'RECORDING' && (
                      <div className="absolute -bottom-2 flex items-end gap-1 h-8">
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-4" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-7" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-5" style={{ animationDelay: '0.3s' }}></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-8" style={{ animationDelay: '0.15s' }}></span>
                        <span className="w-1 bg-rose-500 rounded-full animate-bounce h-6" style={{ animationDelay: '0.25s' }}></span>
                      </div>
                    )}
                  </div>

                  {/* Timer Display */}
                  <div>
                    <div className="text-3xl font-black font-mono tracking-wider text-slate-900">
                      {formatSeconds(recordDuration)}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {recordState === 'RECORDING' ? 'Listening to patient conversation...' : 'Record duration'}
                    </p>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-2 pt-2 w-full">
                    {recordState === 'IDLE' && (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Microphone Recording</span>
                      </button>
                    )}

                    {recordState === 'RECORDING' && (
                      <>
                        <button
                          type="button"
                          onClick={pauseRecording}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Stop & Save Clip</span>
                        </button>
                      </>
                    )}

                    {recordState === 'PAUSED' && (
                      <>
                        <button
                          type="button"
                          onClick={resumeRecording}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Stop & Save</span>
                        </button>
                      </>
                    )}

                    {recordState === 'STOPPED' && (
                      <div className="w-full space-y-2">
                        {/* Audio Player */}
                        {audioUrl && (
                          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                            <audio
                              ref={audioPlayerRef}
                              src={audioUrl}
                              onEnded={() => setIsPlayingAudio(false)}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={togglePlayAudio}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all cursor-pointer"
                              title={isPlayingAudio ? 'Pause' : 'Play Audio'}
                            >
                              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>

                            <div className="flex-1 text-left">
                              <span className="text-[11px] font-bold text-slate-800 block">Consultation Audio Clip</span>
                              <span className="text-[10px] text-slate-500">{formatSeconds(recordDuration)} recorded</span>
                            </div>

                            <a
                              href={audioUrl}
                              download={`Consultation_${patientName.replace(/\s+/g, '_') || 'Patient'}_${Date.now()}.webm`}
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Download Audio Clip"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={resetRecording}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-record Audio</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mic Error or Simulation Info */}
                  {micError && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2">
                      <div className="flex items-start gap-2 text-xs text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{micError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={startSimulatedRecording}
                        className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        ⚡ Use Simulated Mic Recording
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Advice Tips */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Clinical Best Practices
                  </span>
                  <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                    <li>Mention medicine dosage timing clearly (morning/night).</li>
                    <li>Warn about common food interactions (e.g. dairy, grapefruit).</li>
                    <li>Always confirm if patient has past penicillin/NSAID allergies.</li>
                  </ul>
                </div>
              </div>

              {/* RIGHT COLUMN (7 cols): Discussion Notes Editor */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <form onSubmit={handleSaveConsultation} className="space-y-4">
                  
                  {/* Patient Info Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Patient Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={e => setPatientName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp / Phone No
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Age & Gender
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          placeholder="Age"
                          className="w-16 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none"
                        />
                        <select
                          value={gender}
                          onChange={e => setGender(e.target.value as any)}
                          className="flex-1 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 outline-none"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Consultation Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORY_OPTIONS.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                            category === cat.id
                              ? `${cat.color} ring-2 ring-emerald-500/50 shadow-xs`
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chief Discussion Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chief Discussion & Patient Inquiries *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={chiefDiscussion}
                      onChange={e => setChiefDiscussion(e.target.value)}
                      placeholder="e.g. Patient mentioned waking up with throat soreness and asked if Paracetamol 650mg can be taken with Cetirizine..."
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Pharmacist Instructions Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pharmacist Clinical Instructions & Follow-up Advice
                    </label>
                    <textarea
                      rows={2}
                      value={pharmacistAdvice}
                      onChange={e => setPharmacistAdvice(e.target.value)}
                      placeholder="e.g. Advised to take Cetirizine only at bedtime to prevent daytime drowsiness. Complete 3-day course. If fever persists >48hrs, visit physician..."
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Clinical & Care Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_TAGS.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTag(t)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            selectedTags.includes(t)
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        placeholder="Add custom tag (e.g. #AsthmaCheck)"
                        className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTag}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        + Add Tag
                      </button>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => dispatch(setVoiceConsultationModalOpen({ isOpen: false }))}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Consultation Record</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ) : (
            /* ── TAB 2: CONSULTATION HISTORY ────────────────────────── */
            <div className="space-y-4">
              
              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search consultations by patient, phone, symptoms, or tags..."
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    onClick={() => setFilterCategory('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      filterCategory === 'ALL'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORY_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setFilterCategory(c.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                        filterCategory === c.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Records List */}
              {filteredRecords.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">No consultation records match your filter</h3>
                  <p className="text-xs text-slate-400">
                    Try changing your search terms or record a new consultation from the tab above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecords.map(rec => {
                    const catConfig = CATEGORY_OPTIONS.find(c => c.id === rec.category) || CATEGORY_OPTIONS[0];
                    return (
                      <div
                        key={rec.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
                      >
                        <div className="space-y-2.5">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                {rec.patientName}
                                {rec.age && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {rec.age} yrs • {rec.gender}
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{rec.phone}</span>
                                <span>•</span>
                                <span>{rec.date} at {rec.time}</span>
                              </p>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catConfig.color}`}>
                              {catConfig.label}
                            </span>
                          </div>

                          {/* Audio Clip Bar */}
                          {rec.durationSeconds > 0 && (
                            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Voice Recording</span>
                                <span className="text-[10px] text-slate-400 font-mono">({formatSeconds(rec.durationSeconds)})</span>
                              </div>
                              {rec.audioUrl ? (
                                <audio controls src={rec.audioUrl} className="h-7 max-w-[180px]" />
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Saved consultation note</span>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          <div className="text-xs space-y-1.5 text-slate-700">
                            <div>
                              <strong className="text-slate-900 block text-[11px] font-bold">Discussion:</strong>
                              <p className="text-slate-600 leading-relaxed text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                                {rec.chiefDiscussion}
                              </p>
                            </div>
                            {rec.pharmacistAdvice && (
                              <div>
                                <strong className="text-slate-900 block text-[11px] font-bold">Pharmacist Instructions:</strong>
                                <p className="text-emerald-900 leading-relaxed text-[11px] bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                                  {rec.pharmacistAdvice}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Tags */}
                          {rec.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {rec.tags.map(t => (
                                <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400">
                            By: <strong className="text-slate-600">{rec.pharmacistName}</strong> (Counter {rec.counterNumber || 1})
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleShareWhatsApp(rec)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              title="Send consultation summary via WhatsApp"
                            >
                              <Share2 className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete consultation record for ${rec.patientName}?`)) {
                                  dispatch(deleteConsultationRecord(rec.id));
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default VoiceConsultationModal;

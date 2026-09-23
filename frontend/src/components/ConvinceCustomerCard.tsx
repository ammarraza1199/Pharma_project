import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '../types/pos';
import { generateConvinceTalkingPoints } from '../utils/convinceCustomerEngine';
import {
  Sparkles, X, Volume2, VolumeX, Copy, Check, ShieldCheck,
  Award, HelpCircle, ChevronDown, ChevronUp, DollarSign,
  ArrowRight, Maximize2, Minimize2, CheckCircle2, MessageSquare
} from 'lucide-react';

interface ConvinceCustomerCardProps {
  originalProduct?: Product | null;
  alternativeProduct?: Product | null;
  onClose: () => void;
  onSelectAlternative?: (product: Product) => void;
  isReplaceMode?: boolean;
}

export const ConvinceCustomerCard: React.FC<ConvinceCustomerCardProps> = ({
  originalProduct,
  alternativeProduct,
  onClose,
  onSelectAlternative,
  isReplaceMode = false
}) => {
  const [activeTab, setActiveTab] = useState<'SCRIPTS' | 'OBJECTIONS' | 'MATRIX'>('SCRIPTS');
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [openObjectionIndex, setOpenObjectionIndex] = useState<number | null>(0);

  const points = useMemo(() => {
    return generateConvinceTalkingPoints(originalProduct, alternativeProduct);
  }, [originalProduct, alternativeProduct]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyPitch = () => {
    const textToCopy = language === 'EN' ? points.quickElevatorPitch : points.quickElevatorPitchHindi;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = language === 'EN' ? points.quickElevatorPitch : points.quickElevatorPitchHindi;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-6 z-50 animate-bounce">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 bg-gradient-to-r from-teal-700 via-emerald-700 to-indigo-800 text-white px-4 py-2.5 rounded-full shadow-2xl border-2 border-emerald-300 font-extrabold text-xs cursor-pointer hover:scale-105 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span>🗣️ Convince Customer Card ({points.alternativeName})</span>
          <Maximize2 className="w-3.5 h-3.5 text-emerald-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-end p-4 sm:p-6 bg-slate-900/30 backdrop-blur-2xs transition-all">
      <div className="pointer-events-auto w-full max-w-lg bg-white border-2 border-emerald-400/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* ── CARD HEADER ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-800 to-indigo-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Counter Pitch Guide
                </span>
                <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                  Saves ₹{points.rupeeSavings.toFixed(2)}
                </span>
              </div>
              <h3 className="text-sm font-black text-white font-heading truncate max-w-[280px]">
                How to Convince: {points.alternativeName}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/20 text-emerald-100 rounded-xl transition-colors cursor-pointer"
              title="Minimize Card"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 text-emerald-100 rounded-xl transition-colors cursor-pointer"
              title="Close Talking Points"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── COMPARISON SUMMARY STRIP ────────────────────────────────── */}
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 flex-shrink-0">
          <div className="truncate flex-1 pr-2">
            <span className="text-slate-400 line-through mr-1 font-mono text-[10px]">
              {points.originalName} (₹{points.originalPrice.toFixed(2)})
            </span>
            <span className="text-emerald-700 font-bold">
              &rarr; {points.alternativeName} (₹{points.discountedPrice.toFixed(2)})
            </span>
          </div>
          <div className="flex items-center space-x-1 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex-shrink-0 shadow-2xs">
            <span>15% Discount</span>
          </div>
        </div>

        {/* ── CARD NAV TABS ───────────────────────────────────────────── */}
        <div className="px-4 pt-2.5 pb-1 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('SCRIPTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SCRIPTS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🗣️ 4 Core Pillars
            </button>
            <button
              onClick={() => setActiveTab('OBJECTIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'OBJECTIONS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ❓ Objections (FAQ)
            </button>
            <button
              onClick={() => setActiveTab('MATRIX')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'MATRIX'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚖️ Bio-Equivalence
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-black">
            <button
              onClick={() => setLanguage('EN')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                language === 'EN' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('HI')}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                language === 'HI' ? 'bg-white text-emerald-800 shadow-2xs font-extrabold' : 'text-slate-500'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* ── CARD BODY (SCROLLABLE) ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          
          {/* Quick Elevator Pitch Box */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-teal-50/60 to-emerald-50 border border-teal-200/90 rounded-2xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center space-x-1">
                <MessageSquare className="w-3 h-3 text-teal-600" />
                <span>10-Second Counter Elevator Pitch</span>
              </span>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleToggleSpeak}
                  className={`p-1 rounded-lg border text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all ${
                    isSpeaking
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-white hover:bg-teal-50 text-teal-700 border-teal-200'
                  }`}
                  title="Listen to verbal read-aloud"
                >
                  {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  <span>{isSpeaking ? 'Stop' : 'Speak'}</span>
                </button>

                <button
                  onClick={handleCopyPitch}
                  className="p-1 rounded-lg bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                  title="Copy pitch to clipboard"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-800 leading-relaxed italic bg-white/80 p-2.5 rounded-xl border border-teal-100">
              &ldquo;{language === 'EN' ? points.quickElevatorPitch : points.quickElevatorPitchHindi}&rdquo;
            </p>
          </div>

          {/* TAB 1: 4 CORE CONVINCING PILLARS */}
          {activeTab === 'SCRIPTS' && (
            <div className="space-y-2.5">
              <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                Key Verbal Arguments &amp; Clinical Backing:
              </h4>

              {points.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 shadow-2xs transition-all"
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="text-xl leading-none flex-shrink-0 mt-0.5">{pillar.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-extrabold text-slate-900 leading-snug">
                        {pillar.title}
                      </h5>
                      <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {language === 'EN' ? pillar.scriptEnglish : pillar.scriptHindi}
                      </p>
                      <div className="mt-1 flex items-center space-x-1 text-[9.5px] text-teal-800 font-bold">
                        <ShieldCheck className="w-3 h-3 text-teal-600 flex-shrink-0" />
                        <span className="truncate">{pillar.clinicalDetail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: OBJECTION HANDLING (FAQ) */}
          {activeTab === 'OBJECTIONS' && (
            <div className="space-y-2">
              <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                Customer Objections &amp; Pharmacist Reassurance:
              </h4>

              {points.objections.map((obj, idx) => {
                const isOpen = openObjectionIndex === idx;

                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                  >
                    <button
                      onClick={() => setOpenObjectionIndex(isOpen ? null : idx)}
                      className="w-full text-left px-3.5 py-2.5 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 pr-2">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-900 font-heading">
                          &ldquo;{obj.question}&rdquo;
                        </span>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 space-y-1.5 animate-fadeIn">
                        <div className="bg-emerald-50 text-emerald-900 text-[10.5px] font-bold px-2 py-1 rounded-lg border border-emerald-200">
                          ⚡ Key Takeaway: {obj.shortAnswer}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-1">
                          {obj.detailedResponse}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: BIO-EQUIVALENCE MATRIX */}
          {activeTab === 'MATRIX' && (
            <div className="space-y-2">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 text-[11px] text-teal-900 font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>
                  Clinical match: Both medicines deliver equal therapeutic efficacy under CDSCO standards.
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                      <th className="py-2 px-3">Specification</th>
                      <th className="py-2 px-2">Requested</th>
                      <th className="py-2 px-3 text-emerald-800">Substitute</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {points.bioEquivalenceMatrix.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-700">{row.attribute}</td>
                        <td className="py-2 px-2 text-slate-500 font-mono text-[10.5px]">{row.original}</td>
                        <td className="py-2 px-3 font-black text-emerald-700 font-mono text-[10.5px] flex items-center space-x-1">
                          <span>{row.substitute}</span>
                          <Check className="w-3 h-3 text-emerald-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* ── CARD FOOTER WITH ACTION ─────────────────────────────────── */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">CDSCO Drugs &amp; Cosmetics Certified</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              Dismiss
            </button>

            {onSelectAlternative && alternativeProduct && (
              <button
                onClick={() => {
                  onSelectAlternative(alternativeProduct);
                  onClose();
                }}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black px-4 py-1.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>{isReplaceMode ? 'Replace in Cart' : 'Accept & Add'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default ConvinceCustomerCard;

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  closeDrugInteractionModal,
  acknowledgePharmacistSignature,
  verifyOwnerPin
} from '../store/posSlice';
import { AlertOctagon, Lock } from 'lucide-react';

export const DrugInteractionModal: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const modal = useSelector((state: RootState) => state.pos.drugInteractionModal);
  const [signedCheckbox, setSignedCheckbox] = useState<boolean>(false);
  const [overridePin, setOverridePin] = useState<string>('');

  if (!modal.isOpen || modal.interactions.length === 0) return null;

  const hasContraindicated = modal.interactions.some(i => i.severity === 'CONTRAINDICATED');
  const majorInteractions = modal.interactions.filter(i => i.severity === 'MAJOR' || i.severity === 'CONTRAINDICATED');

  const handleSignatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedCheckbox) {
      alert('Pharmacist checkbox signature is required to acknowledge clinical risk.');
      return;
    }
    dispatch(acknowledgePharmacistSignature());
  };

  const handleContraindicatedOverride = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(verifyOwnerPin(overridePin));
    setOverridePin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className={`glass-modal rounded-2xl max-w-xl w-full p-6 shadow-2xl border relative overflow-hidden ${
        hasContraindicated ? 'border-rose-600 bg-rose-950/90 text-white' : 'border-rose-300 bg-white text-slate-900'
      }`}>
        {/* Top Danger Header */}
        <div className={`flex items-center space-x-3 p-4 -mx-6 -mt-6 mb-4 ${
          hasContraindicated ? 'bg-rose-700 text-white' : 'bg-rose-600 text-white'
        }`}>
          <AlertOctagon className="w-6 h-6 text-rose-200 animate-ping" />
          <div>
            <h3 className="text-sm font-extrabold tracking-wide font-heading uppercase">
              {hasContraindicated
                ? 'CRITICAL CONTRAINDICATED DRUG COMBINATION'
                : 'MAJOR CLINICAL DRUG INTERACTION ALERT'}
            </h3>
            <p className="text-[11px] text-rose-100 font-medium">
              Real-Time AI Drug Engine detected severe clinical risk in current cart
            </p>
          </div>
        </div>

        {/* Interaction Details List */}
        <div className="space-y-3 mb-5 max-h-60 overflow-y-auto pr-1">
          {majorInteractions.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs ${
                hasContraindicated
                  ? 'bg-rose-900/60 border-rose-700 text-rose-100'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-heading">
                  {item.severity}
                </span>
                <span className="text-[11px] font-bold">{item.drug1} ⚡ {item.drug2}</span>
              </div>
              <p className="text-xs mb-1 font-semibold">{item.description}</p>
              <p className="text-[11px] opacity-80">
                <strong>Clinical Impact:</strong> {item.clinicalImpact}
              </p>
            </div>
          ))}
        </div>

        {/* Action Form: Store Owner PIN Required for Contraindicated Drug Combinations */}
        {hasContraindicated ? (
          <form onSubmit={handleContraindicatedOverride} className="space-y-3.5 pt-3 border-t border-rose-800">
            <div className="bg-rose-900/90 border border-rose-600 p-3.5 rounded-xl text-xs space-y-1.5 shadow-inner">
              <p className="font-extrabold flex items-center space-x-1.5 text-white tracking-wide">
                <Lock className="w-4 h-4 text-rose-300 animate-bounce" />
                <span>STORE OWNER PIN VERIFICATION REQUIRED</span>
              </p>
              <p className="text-[11px] text-rose-200 leading-snug">
                This medicine combination creates a severe, potentially life-threatening clinical hazard.
                You must enter the <strong>Store Owner PIN (Default: 1234)</strong> to authorize adding this contraindicated drug combination to cart.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-200 mb-1">
                Enter 4-Digit Owner PIN *
              </label>
              <input
                type="password"
                maxLength={4}
                value={overridePin}
                onChange={(e) => setOverridePin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-xl font-black tracking-widest py-2.5 border border-rose-500 rounded-xl bg-rose-950 text-white placeholder-rose-400 focus:ring-2 focus:ring-rose-400 focus:outline-hidden"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => dispatch(closeDrugInteractionModal())}
                className="px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 rounded-lg cursor-pointer transition-colors"
              >
                Cancel &amp; Remove Item
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-extrabold bg-white text-rose-950 hover:bg-rose-100 rounded-lg shadow-md font-heading cursor-pointer active:scale-98 transition-all"
              >
                Authorize &amp; Add to Cart
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignatureSubmit} className="space-y-4 pt-3 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signedCheckbox}
                  onChange={(e) => setSignedCheckbox(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  required
                />
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  I, <strong>{currentUser?.pharmacistName || 'Pharmacist'} (Chief Pharmacist)</strong>, hereby verify that I have counseled the patient regarding this major drug interaction and confirm physician approval.
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => dispatch(closeDrugInteractionModal())}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!signedCheckbox}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition-all shadow-md cursor-pointer ${
                  signedCheckbox ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Sign &amp; Acknowledge Risk
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

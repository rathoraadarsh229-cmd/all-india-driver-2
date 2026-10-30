import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, Check, ExternalLink, X, 
  CheckSquare, Square, Smartphone, ArrowRight
} from 'lucide-react';

export type SafetyScenario = 'owner_hires_driver' | 'driver_accepts_job' | 'hire_mechanic';

interface SafetyReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  scenario: SafetyScenario;
  targetName?: string;
  defaultLang?: 'hi' | 'en';
}

export const SafetyReminderModal: React.FC<SafetyReminderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  scenario,
  targetName,
  defaultLang = 'hi'
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [lang, setLang] = useState<'hi' | 'en'>(defaultLang);

  // Reset checkbox every time popup opens (har baar fresh confirmation)
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setLang(defaultLang);
    }
  }, [isOpen, defaultLang]);

  if (!isOpen) return null;

  // Exact texts requested by user:
  const content = {
    owner_hires_driver: {
      title: lang === 'hi' ? 'ड्राइवर हायरिंग सुरक्षा सूचना' : 'Driver Hiring Safety Reminder',
      subtitle: targetName 
        ? (lang === 'hi' ? `${targetName} को हायर करने से पहले:` : `Before hiring ${targetName}:`)
        : (lang === 'hi' ? 'ड्राइवर को गाड़ी सौंपने से पहले:' : 'Before handing over vehicle:'),
      message: lang === 'hi'
        ? 'Gaadi dene se pehle driver ka Driving Licence mParivahan app me check karein: naam, validity aur vehicle class (LMV/HMV). Original DL bhi dekh lein.'
        : "Before handing over the vehicle, check the driver's Driving Licence in the mParivahan app: name, validity and vehicle class (LMV/HMV). Also see the original DL.",
      showMParivahan: true
    },
    driver_accepts_job: {
      title: lang === 'hi' ? 'ट्रिप स्वीकार करने से पहले सुरक्षा सूचना' : 'Trip Acceptance Safety Reminder',
      subtitle: targetName 
        ? (lang === 'hi' ? `${targetName} की ट्रिप शुरू करने से पहले:` : `Before starting trip for ${targetName}:`)
        : (lang === 'hi' ? 'गाड़ी चलाने से पहले:' : 'Before driving:'),
      message: lang === 'hi'
        ? 'Kaam shuru karne se pehle gaadi ka RC, insurance aur fitness mParivahan app me check karein. Trip aur payment pehle saaf kar lein.'
        : "Before starting, check the vehicle's RC, insurance and fitness in the mParivahan app. Clear the trip and payment terms first.",
      showMParivahan: true
    },
    hire_mechanic: {
      title: lang === 'hi' ? 'मैकेनिक सेवा सुरक्षा सूचना' : 'Mechanic Service Safety Reminder',
      subtitle: targetName 
        ? (lang === 'hi' ? `${targetName} से काम कराने से पहले:` : `Before service by ${targetName}:`)
        : (lang === 'hi' ? 'ऑन-रोड मैकेनिक बुलाने से पहले:' : 'Before calling roadside mechanic:'),
      message: lang === 'hi'
        ? 'Kaam se pehle rate tay kar lein. Payment seedha mechanic ko karein.'
        : 'Agree on the rate before the work starts. Pay the mechanic directly.',
      showMParivahan: false
    }
  }[scenario];

  const commonLine = lang === 'hi'
    ? 'All India Driver sirf aapko jodta hai. Phone number/email ke alawa hum koi verification nahi karte. Hire karne ka faisla aapka hai.'
    : 'All India Driver only connects you. Apart from phone/email, we do not verify anyone. The decision to hire is yours.';

  const checkboxLabel = lang === 'hi' 
    ? 'Maine ye check kar liya hai' 
    : 'I have checked this';

  const confirmBtnText = lang === 'hi' 
    ? 'पुष्टि करें व आगे बढ़ें' 
    : 'Confirm & Proceed';

  const cancelBtnText = lang === 'hi' ? 'रद्द करें' : 'Cancel';

  const handleConfirm = () => {
    if (!isChecked) return;
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div 
        className="w-full max-w-lg bg-[#121214] border-2 border-[#E10600]/40 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-white relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Warning Badge + Language Toggle + Close */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E10600]/20 border border-[#E10600]/40 flex items-center justify-center text-[#E10600] shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#E10600]" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E10600] uppercase tracking-widest block">
                SAFETY & VIGILANCE REMINDER
              </span>
              <h3 className="font-display font-black text-base uppercase text-white leading-tight">
                {content.title}
              </h3>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#1A1A22] border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'hi' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                lang === 'en' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Primary Role Specific Safety Notice Box */}
        <div className="bg-[#1A1A22] border border-white/15 rounded-2xl p-4 sm:p-5 space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">
            {content.subtitle}
          </p>
          <div className="text-sm font-black text-white leading-relaxed bg-[#0B0B0C] border border-white/10 p-3.5 rounded-xl">
            {content.message}
          </div>

          {/* mParivahan Button (Shown for Owner & Driver, NOT for Mechanic) */}
          {content.showMParivahan && (
            <a
              href="https://play.google.com/store/apps/details?id=com.nic.mparivahan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer group"
            >
              <Smartphone className="w-4 h-4 text-[#E10600]" />
              <span>{lang === 'hi' ? 'mParivahan app kholein' : 'Open mParivahan app'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
            </a>
          )}
        </div>

        {/* Mandatory Verification Checkbox */}
        <div 
          onClick={() => setIsChecked(!isChecked)}
          className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
            isChecked 
              ? 'bg-[#E10600]/15 border-[#E10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.2)]' 
              : 'bg-[#1A1A22] border-white/15 text-gray-300 hover:border-white/30'
          }`}
        >
          <div className="shrink-0">
            {isChecked ? (
              <div className="w-6 h-6 rounded-lg bg-[#E10600] flex items-center justify-center text-white shadow-sm">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-lg border-2 border-gray-500 bg-transparent" />
            )}
          </div>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
            {checkboxLabel}
          </span>
        </div>

        {/* Common Platform Disclaimer (Always Present) */}
        <div className="bg-[#0B0B0C] border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300/90 leading-relaxed font-semibold">
            {commonLine}
          </p>
        </div>

        {/* Action Buttons: Cancel vs Confirm */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#1A1A22] hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-white/10"
          >
            {cancelBtnText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isChecked}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isChecked
                ? 'bg-[#E10600] hover:bg-[#c20500] text-white shadow-[0_0_20px_rgba(225,6,0,0.5)] cursor-pointer'
                : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>{confirmBtnText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyReminderModal;

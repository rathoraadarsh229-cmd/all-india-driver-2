import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Smartphone, 
  Send,
  MessageCircle,
  ExternalLink,
  Users
} from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage?: string;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage = 'hi'
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  // The official public live shared URL of this application
  const appUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('ais-dev')
    ? window.location.origin
    : 'https://ais-pre-re2663gtvtceq5idf3xfrk-20227451905.asia-southeast1.run.app';

  const shareText = `🇮🇳 *ऑल इंडिया ड्राइवर ऐप (All India Driver App)*\n\nभारत के सभी ड्राइवरों, गाड़ी मालिकों और मैकेनिक्स के लिए नंबर 1 ऐप!\n\n✅ तुरंत काम व नौकरियां खोजें\n✅ वेरिफाइड ड्राइवर या गाड़ी बुक करें\n✅ 24x7 नजदीकी मैकेनिक सहायता (SOS)\n\n👉 अभी ऐप खोलें (बिना प्ले स्टोर के सीधे फोन में चलेगा):\n${appUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(appUrl);
      } else {
        // Fallback for older browsers / iframe restrictions
        const textArea = document.createElement('textarea');
        textArea.value = appUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy', err);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'All India Driver App',
          text: 'ड्राइवर, गाड़ी मालिक और मैकेनिक के लिए भारत का नंबर 1 ऐप - All India Driver App',
          url: appUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to whatsapp
        console.log('Share dismissed or not completed', err);
      }
    } else {
      // Fallback: navigate directly or copy
      window.location.href = whatsappUrl;
    }
  };

  // Online generated QR code image URL pointing directly to the app URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(appUrl)}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-navy via-navy to-navy-light text-white p-4.5 flex items-center justify-between border-b border-navy-light/30">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-brand-orange text-navy flex items-center justify-center shadow-md">
              <Share2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                दोस्तों को शेयर करें (Share App)
              </h3>
              <p className="text-[11px] text-slate-300 font-bold">
                ड्राइवर, गाड़ी मालिक और मैकेनिक दोस्तों को जोड़ें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4.5 overflow-y-auto space-y-4">
          
          {/* Main Action 1: WhatsApp Share (Most popular in India) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm"
          >
            <MessageCircle className="h-5 w-5 fill-white stroke-none shrink-0" />
            <span>व्हाट्सएप पर शेयर करें (WhatsApp Share)</span>
          </a>

          {/* Main Action 2: Native Share (System share dialog for mobile) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full bg-navy hover:bg-navy-light active:scale-[0.98] text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer text-sm"
          >
            <Share2 className="h-5 w-5 text-brand-orange shrink-0" />
            <span>अन्य ऐप्स में शेयर करें (Other Apps)</span>
          </button>

          {/* Copy Link Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700">
                ऐप की डायरेक्ट लिंक (Direct Link)
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`text-xs font-black px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  copied 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-brand-orange text-navy hover:bg-orange-500 shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>कॉपी हो गया!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>लिंक कॉपी करें</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate select-all">
              {appUrl}
            </div>
          </div>

          {/* QR Code toggle for in-person sharing */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-navy block">
                    QR कोड दिखाकर स्कैन करवाएं
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    पास खड़े दोस्त अपने फोन के कैमरे से स्कैन कर सकते हैं
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-brand-orange hover:underline">
                {showQrCode ? 'छुपाएं' : 'दिखाएं'}
              </span>
            </button>

            {showQrCode && (
              <div className="pt-2 flex flex-col items-center justify-center border-t border-slate-100">
                <div className="p-3 bg-white border-2 border-brand-orange/40 rounded-2xl shadow-inner my-2">
                  <img 
                    src={qrCodeUrl} 
                    alt="App QR Code" 
                    className="w-48 h-48 object-contain"
                    loading="lazy"
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-500 text-center">
                  कैमरे या Google Lens से स्कैन करें और ऐप तुरंत खुल जाएगा
                </p>
              </div>
            )}
          </div>

          {/* Simple Explanation Guide in Hindi */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 space-y-2 text-left">
            <div className="flex items-center gap-2 text-blue-900 font-black text-xs">
              <Smartphone className="h-4 w-4 text-blue-600 shrink-0" />
              <span>दोस्तों के लिए आसान गाइड:</span>
            </div>
            <ul className="text-[11px] text-blue-950 font-bold space-y-1.5 list-disc list-inside">
              <li>दोस्त लिंक पर क्लिक करके किसी भी फोन (Android / iPhone) में बिना इंस्टॉल किए तुरंत चला सकते हैं।</li>
              <li>ऐप को फोन स्क्रीन पर रखने के लिए ब्राउज़र मेनू (⋮) में <span className="font-extrabold text-navy">"Add to Home Screen"</span> या <span className="font-extrabold text-navy">"ऐप इंस्टॉल करें"</span> चुनें।</li>
              <li>ड्राइवर, गाड़ी मालिक और मैकेनिक तीनों के लिए एक ही ऐप काम करता है।</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-black text-xs text-navy transition-all cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

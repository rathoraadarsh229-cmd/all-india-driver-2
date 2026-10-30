import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Lock, Send, Mic, Play, Square, AlertCircle, Check, X, ShieldAlert, Compass, Sparkles, RefreshCw, Truck, Eye, Image as ImageIcon, Camera, Bell, Wrench, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppScreen, Message, DriverProfile, OwnerJob, MechanicProfile, MechanicHelpRequest } from '../types';
import { saveChatMessageToInsForge } from '../services/insforgeService';
import { SafetyReminderModal, SafetyScenario } from './SafetyReminderModal';

interface ScreenChatRoomProps {
  setScreen: (screen: AppScreen) => void;
  selectedDriver: DriverProfile | null;
  reportedDriverIds: string[];
  setReportedDriverIds: React.Dispatch<React.SetStateAction<string[]>>;
  replacementCredits: number;
  setReplacementCredits: React.Dispatch<React.SetStateAction<number>>;
  addLog?: (message: string, type: 'auth' | 'kyc' | 'unlock' | 'request' | 'system') => void;
  chatPerspective?: 'owner' | 'driver' | 'mechanic';
  selectedOwnerJob?: OwnerJob | null;
  reportedOwnerIds?: string[];
  setReportedOwnerIds?: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMechanic?: MechanicProfile | null;
  selectedMechanicHelpRequest?: MechanicHelpRequest | null;
  chatTargetType?: 'driver' | 'owner' | 'mechanic';
}

export default function ScreenChatRoom({ 
  setScreen, 
  selectedDriver,
  reportedDriverIds,
  setReportedDriverIds,
  replacementCredits,
  setReplacementCredits,
  addLog,
  chatPerspective = 'owner',
  selectedOwnerJob,
  reportedOwnerIds = [],
  setReportedOwnerIds,
  selectedMechanic,
  selectedMechanicHelpRequest,
  chatTargetType
}: ScreenChatRoomProps) {
  const isMechanicPartner = chatTargetType === 'mechanic' || Boolean(selectedMechanic);
  const isMechanicPerspective = chatPerspective === 'mechanic';
  const isDriverPerspective = chatPerspective === 'driver';

  // Partner display details
  const partnerName = isMechanicPartner
    ? (selectedMechanic ? selectedMechanic.name : 'मास्टर मैकेनिक')
    : isMechanicPerspective
    ? (selectedMechanicHelpRequest ? selectedMechanicHelpRequest.requesterName : 'गाड़ी चालक/मालिक')
    : isDriverPerspective 
    ? (selectedOwnerJob?.companyName || selectedOwnerJob?.ownerName || 'गाड़ी मालिक')
    : (selectedDriver ? selectedDriver.name : 'ड्राइवर');

  const partnerSubtitle = isMechanicPartner
    ? (selectedMechanic?.garageName ? `${selectedMechanic.garageName} • अधिकृत मैकेनिक` : '24x7 ऑन-साइट मैकेनिक')
    : isMechanicPerspective
    ? (selectedMechanicHelpRequest ? `${selectedMechanicHelpRequest.requesterRole === 'owner' ? 'गाड़ी मालिक' : 'चालक'} • ${selectedMechanicHelpRequest.vehicleFamily || 'वाहन'}` : 'सत्यापित यूजर')
    : isDriverPerspective
    ? (selectedOwnerJob?.ownerName ? `${selectedOwnerJob.ownerName} • गाड़ी मालिक` : 'सत्यापित गाड़ी मालिक')
    : (selectedDriver ? `${selectedDriver.vehicleType} • चालक` : 'चालक');

  const partnerPhone = isMechanicPartner
    ? (selectedMechanic?.phone || 'चैट में उपलब्ध')
    : isMechanicPerspective
    ? (selectedMechanicHelpRequest?.requesterPhone || 'चैट में उपलब्ध')
    : isDriverPerspective
    ? (selectedOwnerJob?.phone || 'चैट में उपलब्ध')
    : (selectedDriver ? selectedDriver.phone : 'चैट में उपलब्ध');

  // Safety Reminder Modal state for Chat Room
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const currentSafetyScenario: SafetyScenario = isMechanicPartner
    ? 'hire_mechanic'
    : isDriverPerspective
    ? 'driver_accepts_job'
    : 'owner_hires_driver';

  const handleConfirmChatCall = () => {
    if (partnerPhone && partnerPhone !== 'चैट में उपलब्ध') {
      window.location.href = `tel:${partnerPhone}`;
    }
  };

  const isAlreadyCancelled = isMechanicPartner
    ? false
    : isMechanicPerspective
    ? false
    : isDriverPerspective
    ? (selectedOwnerJob?.id ? reportedOwnerIds.includes(selectedOwnerJob.id) : false)
    : (selectedDriver ? reportedDriverIds.includes(selectedDriver.id) : false);

  // Partner ID for chat tracking
  const partnerId = isMechanicPartner
    ? (selectedMechanic?.id ? `mech-${selectedMechanic.id}` : 'mech-chat')
    : isMechanicPerspective
    ? (selectedMechanicHelpRequest?.id ? `req-${selectedMechanicHelpRequest.id}` : 'req-chat')
    : isDriverPerspective 
    ? (selectedOwnerJob?.id || 'job-chat') 
    : (selectedDriver?.id || 'driver-chat');

  const [isNotificationDelivered, setIsNotificationDelivered] = useState<boolean>(true);

  // Initialize messages state with persistence and intelligent starter
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`aid_chat_history_${partnerId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const curTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isMechanicPartner) {
      return [
        {
          id: `sys-mech-${Date.now()}`,
          text: `🔧 सुरक्षित मैकेनिक सहायता: ${partnerName} (${partnerSubtitle}) के साथ चैट रूम सक्रिय है। ऑन-साइट विजिटिंग चार्ज, आवश्यक टूल्स और पहुंचने का समय यहाँ सीधे तय करें।`,
          time: curTime,
          isSender: false,
          type: 'text'
        }
      ];
    } else if (isMechanicPerspective) {
      return [
        {
          id: `sys-mech-req-${Date.now()}`,
          text: `🔧 ग्राहक ब्रेकडाउन सहायता: ${partnerName} (${partnerSubtitle}) ने सहायता का अनुरोध भेजा है। लोकेशन और काम की पुष्टि करके तुरंत सहायता प्रदान करें।`,
          time: curTime,
          isSender: false,
          type: 'text'
        }
      ];
    }
    return [];
  });

  // Persist messages whenever updated
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(`aid_chat_history_${partnerId}`, JSON.stringify(messages));
      } catch {}
    }
  }, [messages, partnerId]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState(
    isMechanicPartner
      ? 'गाड़ी किसी अन्य माध्यम से चालू हो गई (Vehicle fixed by other mechanic)'
      : isDriverPerspective
      ? 'मालिक का बात करने का व्यवहार/लहजा खराब लगा (Owner behavior / rude attitude)'
      : 'Incompatibility (चालक पसंद नहीं आया / बातचीत ठीक नहीं लगी)'
  );

  // 🚛 Vehicle Photos Viewing in Chat Room
  const [showChatVehiclePhotos, setShowChatVehiclePhotos] = useState(false);
  const [chatPhotoPreview, setChatPhotoPreview] = useState<string | null>(null);



  // Auto-scroll chat history to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Recording timer simulation
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  const handleSendMessage = () => {
    if (!isNotificationDelivered || !inputText.trim()) return;

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newMsg: Message = {
      id: `msg-user-${Date.now()}`,
      text: inputText,
      time: currentTime,
      isSender: true,
      type: 'text'
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Sync real user message to InsForge backend (insforge.dev)
    const activeChatId = isDriverPerspective ? (selectedOwnerJob?.id || 'job-chat') : (selectedDriver?.id || 'driver-chat');
    saveChatMessageToInsForge(activeChatId, isDriverPerspective ? 'driver' : 'owner', newMsg.text).catch(err => {
      console.warn('InsForge chat sync warning:', err);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Toggle Voice Note recording
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const minutes = Math.floor(recordingSeconds / 60);
      const seconds = recordingSeconds % 60;
      const formattedDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-voice-${Date.now()}`,
          text: `🎙️ Voice message (${formattedDuration})`,
          time: currentTime,
          isSender: true,
          type: 'audio',
          audioDuration: formattedDuration
        }
      ]);
    } else {
      setIsRecording(true);
    }
  };

  // Perform Cancellation / Report
  const handleCompleteCancelAndRefund = () => {
    setIsProcessingCancel(true);

    setTimeout(() => {
      setIsProcessingCancel(false);
      setCancelSuccess(true);

      const systemTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      if (isDriverPerspective) {
        // DRIVER PERSPECTIVE: Driver rejects Owner's offer / reports bad behavior
        const ownerId = selectedOwnerJob?.id || 'opp-3';
        if (setReportedOwnerIds) {
          setReportedOwnerIds((prev) => {
            if (!prev.includes(ownerId)) {
              return [...prev, ownerId];
            }
            return prev;
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-syscancel-${Date.now()}`,
            text: `❌ OFFER DECLINED BY DRIVER: Driver rejected this hiring offer.\nReason: "${selectedCancelReason}"\n🛡️ DRIVER DIGNITY REPORT: Driver reported owner behavior. Safe exit enabled.`,
            time: systemTime,
            isSender: false,
            type: 'text'
          }
        ]);

        if (addLog) {
          addLog(`🚨 Driver Reported Owner: Disliked owner behavior "${selectedCancelReason}" for job "${partnerName}". Offer safely declined.`, 'request');
        }
      } else {
        // OWNER PERSPECTIVE: Owner cancels match and reports driver
        if (selectedDriver) {
          setReportedDriverIds((prev) => {
            if (!prev.includes(selectedDriver.id)) {
              return [...prev, selectedDriver.id];
            }
            return prev;
          });
        }

        setReplacementCredits((prev) => prev + 1);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-syscancel-${Date.now()}`,
            text: `❌ MATCH CANCELLED: Owner disconnected connection.\nReason: "${selectedCancelReason}"\n🛡️ SAFE EXIT: Connection safely ended. No payment required.`,
            time: systemTime,
            isSender: false,
            type: 'text'
          }
        ]);

        if (addLog && selectedDriver) {
          addLog(`🚨 Match Cancelled by Owner: Disconnected driver "${selectedDriver.name}" ("${selectedCancelReason}"). Free direct connect active.`, 'system');
        }
      }
    }, 1200);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelSuccess(false);
  };

  const handleBackNavigation = () => {
    if (chatPerspective === 'mechanic') {
      setScreen('mechanic-dashboard');
    } else if (chatPerspective === 'driver') {
      setScreen('driver-dashboard');
    } else {
      setScreen('owner-dashboard');
    }
  };

  return (
    <div id="screen-secure-chat" className="flex-1 flex flex-col justify-between bg-slate-100 rounded-b-3xl overflow-hidden relative h-full">
      
      {/* 1. HEADER CONTACT PROFILE */}
      <div id="chat-header" className="bg-navy text-white px-4 py-3 flex items-center justify-between shadow-md z-10 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back arrow icon */}
          <button 
            onClick={handleBackNavigation}
            className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-all cursor-pointer shrink-0"
            id="chat-back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {/* User / Owner / Mechanic profile icon */}
          <div className="h-8.5 w-8.5 bg-slate-700 text-white flex items-center justify-center rounded-full shrink-0 border border-white/10 relative">
            {isMechanicPartner ? (
              <Wrench className="h-4 w-4 text-brand-orange" />
            ) : isDriverPerspective ? (
              <Truck className="h-4 w-4 text-brand-orange" />
            ) : isMechanicPerspective ? (
              <User className="h-4 w-4 text-brand-orange" />
            ) : (
              <User className="h-4 w-4 text-brand-orange" />
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 bg-emerald-500 rounded-full ring-1 ring-navy" />
          </div>

          {/* Label Text */}
          <div className="block leading-tight text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-extrabold tracking-wide uppercase truncate max-w-[150px]">
                {partnerName}
              </h4>
              <span className="text-[8px] bg-white/15 px-1 rounded font-bold uppercase shrink-0">
                {isMechanicPartner 
                  ? 'MECHANIC' 
                  : isMechanicPerspective 
                  ? (selectedMechanicHelpRequest?.requesterRole === 'owner' ? 'OWNER' : 'DRIVER')
                  : (isDriverPerspective ? 'OWNER' : 'DRIVER')}
              </span>
            </div>
            <p className={`text-[9.5px] font-medium leading-tight truncate max-w-[180px] ${isAlreadyCancelled ? 'text-red-400' : 'text-emerald-400'}`}>
              {isAlreadyCancelled ? '❌ Deal Cancelled' : `● Online | ${partnerPhone}`}
            </p>
          </div>
        </div>

        {/* Security Icon & Badge */}
        <div className="flex items-center gap-1 bg-brand-orange/20 border border-brand-orange text-brand-orange text-[9px] font-extrabold px-2 py-1 rounded shadow-sm shrink-0 select-none">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* 1.5. DYNAMIC INTERACTIVE ACTION & BEHAVIOR REPORTING BANNER */}
      {!isAlreadyCancelled ? (
        isMechanicPartner ? (
          /* MECHANIC PARTNER BANNER: On-Site Breakdown Assistant */
          <div className="bg-blue-50 border-b border-blue-200 px-3.5 py-2 flex items-center justify-between shrink-0 select-none animate-fade-in relative z-10">
            <div className="flex items-start gap-2 max-w-[70%]">
              <Wrench className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-left leading-tight">
                <span className="block text-[10px] font-black text-blue-950 uppercase tracking-wide">
                  24x7 ऑन-साइट मैकेनिक सहायता (Roadside Mechanic)
                </span>
                <span className="block text-[8.5px] text-slate-600 font-bold leading-normal">
                  {selectedMechanic?.garageName || 'अधिकृत गैरेज'} • {selectedMechanic?.location || 'निकटतम हाईवे'}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsSafetyModalOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[9px] rounded-xl flex items-center justify-center gap-1 shadow-sm uppercase shrink-0 cursor-pointer transition-all"
            >
              <Phone className="h-3 w-3" />
              <span>कॉल करें</span>
            </button>
          </div>
        ) : isMechanicPerspective ? (
          /* MECHANIC PERSPECTIVE BANNER: Client Assistance */
          <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 flex items-center justify-between shrink-0 select-none animate-fade-in relative z-10">
            <div className="flex items-start gap-2 max-w-[70%]">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
              <div className="text-left leading-tight">
                <span className="block text-[10px] font-black text-emerald-950 uppercase tracking-wide">
                  सक्रिय ब्रेकडाउन कार्य (Active Repair Job)
                </span>
                <span className="block text-[8.5px] text-slate-600 font-bold leading-normal">
                  {selectedMechanicHelpRequest?.issueDescription || 'हाईवे रोडसाइड सहायता'}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsSafetyModalOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[9px] rounded-xl flex items-center justify-center gap-1 shadow-sm uppercase shrink-0 cursor-pointer transition-all"
            >
              <Phone className="h-3 w-3" />
              <span>कॉल करें</span>
            </button>
          </div>
        ) : isDriverPerspective ? (
          /* DRIVER PERSPECTIVE: Report / Decline Owner's Behavior */
          <div className="bg-amber-50 border-b border-amber-250 px-3.5 py-2 flex items-center justify-between shrink-0 select-none animate-fade-in relative z-10">
            <div className="flex items-start gap-2 max-w-[70%]">
              <span className="text-sm mt-0.5 animate-pulse shrink-0">⚠️</span>
              <div className="text-left leading-tight">
                <span className="block text-[10px] font-black text-amber-950 uppercase tracking-wide">
                  मालिक का व्यवहार ठीक नहीं लगा? / Dislike Owner?
                </span>
                <span className="block text-[8.5px] text-slate-600 font-bold leading-normal">
                  यदि मालिक का लहजा, कम सैलरी या अनुचित शर्तें पसंद न आएँ, तो यहाँ से डील रिजेक्ट करें।
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-[9px] rounded-xl flex items-center justify-center gap-1 shadow-sm uppercase shrink-0 cursor-pointer transition-all border border-amber-500"
            >
              <span>Decline Deal 🚫</span>
            </button>
          </div>
        ) : (
          /* OWNER PERSPECTIVE: Dislike Driver */
          <div className="bg-red-50 border-b border-red-150 px-3.5 py-2 flex items-center justify-between shrink-0 select-none animate-fade-in relative z-10">
            <div className="flex items-start gap-2 max-w-[70%]">
              <span className="text-sm mt-0.5 animate-pulse shrink-0">⚠️</span>
              <div className="text-left leading-tight">
                <span className="block text-[10px] font-black text-red-700 uppercase tracking-wide">ड्राइवर पसंद नहीं आया? / Dislike Driver?</span>
                <span className="block text-[8.5px] text-slate-500 font-bold leading-normal">
                  यदि बातचीत या शर्तें ठीक न लगें, तो यहाँ से मैच सुरक्षित रद्द करें।
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] rounded-xl flex items-center justify-center gap-1 shadow-sm uppercase shrink-0 cursor-pointer transition-all active:scale-95 border border-red-500"
            >
              <span>Cancel Match ❌</span>
            </button>
          </div>
        )
      ) : (
        isDriverPerspective ? (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center shrink-0 animate-fade-in select-none relative z-10">
            <span className="block text-red-800 text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              ऑफर अस्वीकार किया गया (Offer Declined by Driver)
            </span>
            <span className="block text-[8.5px] text-slate-600 font-bold leading-tight mt-0.5">
              मालिक के अनुचित व्यवहार की रिपोर्ट दर्ज हो चुकी है। यह मालिक आपको दोबारा संपर्क नहीं कर सकेगा।
            </span>
          </div>
        ) : (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-center shrink-0 animate-fade-in select-none relative z-10">
            <span className="block text-red-800 text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              मैच कैंसल है / Match Cancelled
            </span>
            <span className="block text-[8.5px] text-slate-500 font-bold leading-tight mt-0.5">
              इस ड्राइवर के साथ बातचीत बंद कर दी गई है। आप अन्य ड्राइवरों से सीधे व निःशुल्क संपर्क कर सकते हैं।
            </span>
          </div>
        )
      )}

      {/* 1.8. VEHICLE INFORMATION & PHOTOS STRIP */}
      {selectedOwnerJob && (
        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-[9px] border-b border-white/10 shrink-0 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <Truck className="h-3.5 w-3.5 text-brand-orange shrink-0" />
            <span className="font-bold truncate text-slate-200">
              गाड़ी: <strong className="text-white">{selectedOwnerJob.vehicle}</strong>
            </span>
          </div>

          {selectedOwnerJob.vehiclePhotos && selectedOwnerJob.vehiclePhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowChatVehiclePhotos(true)}
              className="px-2 py-0.5 bg-brand-orange hover:bg-brand-orange/90 text-navy font-black text-[8.5px] rounded-lg flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              <Eye className="h-3 w-3 stroke-[2.5]" />
              <span>गाड़ी फोटो देखें ({selectedOwnerJob.vehiclePhotos.length})</span>
            </button>
          )}
        </div>
      )}

      {/* 2. CHAT HISTORY FEED */}
      <div 
        id="chat-feed" 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-100 border-x border-slate-50"
      >
        <div className="mx-auto text-center my-1 select-none space-y-1.5">
          <span className="inline-block bg-white/80 text-[9px] font-bold text-slate-500 uppercase px-3 py-1 rounded-full border border-slate-200 shadow-xs">
            {isMechanicPartner
              ? '🔒 सुरक्षित मैकेनिक सहायता चैट (Mechanic Assistance Chat)'
              : isMechanicPerspective
              ? '🔒 ग्राहक ब्रेकडाउन सहायता (Client Breakdown Chat)'
              : isDriverPerspective 
              ? '🔒 सुरक्षित चालक-मालिक बातचीत (Direct Driver-Owner Chat)'
              : '🔒 सुरक्षित चालक नियुक्ति चैट (Driver Hiring Room)'}
          </span>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-950 text-[9.5px] p-2.5 rounded-xl text-left font-bold flex items-start gap-1.5">
            <span className="text-brand-orange text-xs mt-0.5 shrink-0">
              {isMechanicPartner || isMechanicPerspective ? '🔧' : '🚛'}
            </span>
            <p className="leading-tight">
              {isMechanicPartner || isMechanicPerspective ? (
                <>
                  <strong className="text-navy">मैकेनिक नियम:</strong> ऑन-साइट पहुंचने का समय, विजिटिंग चार्ज, रिपेयरिंग शुल्क और आवश्यक स्पेयर पार्ट्स की जानकारी यहाँ सीधे तय करें। कोई मध्यस्थ या दलाली नहीं।
                </>
              ) : (
                <>
                  <strong className="text-navy">स्पष्ट नियम:</strong> गाड़ी (ट्रक/वाहन) मालिक उपलब्ध कराएगा, और चालक केवल सुरक्षित ड्राइविंग ड्यूटी प्रदान करेगा। सैलरी, ट्रिप भत्ता और काम के नियम यहाँ सीधे तय करें।
                </>
              )}
            </p>
          </div>
        </div>


        {messages.length === 0 && isNotificationDelivered && (
          <div className="text-center py-8 px-4 text-slate-400 space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg">
              💬
            </div>
            <p className="text-xs font-bold text-slate-600">सीधी और सुरक्षित बातचीत (Direct Chat)</p>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
              आप दोनों सीधे जुड़े हैं। काम, ड्यूटी रूट या सैलरी की चर्चा के लिए नीचे मैसेज लिखें या त्वरित सवाल चुनें।
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isSystem = msg.text.startsWith('❌') || msg.text.includes('MATCH CANCELLED') || msg.text.includes('OFFER DECLINED');

          if (isSystem) {
            return (
              <div key={msg.id} className="w-full text-center py-2 select-none animate-fade-in max-w-[95%] mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-left space-y-1.5 shadow-xs">
                  <span className="text-[10px] font-black text-red-700 uppercase tracking-wider block flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4 text-red-650 shrink-0" />
                    CANCELLATION & SAFETY REPORT / रिपोर्ट दर्ज
                  </span>
                  
                  <p className="text-[10px] text-slate-700 font-bold whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </p>

                  <span className="text-[8px] text-slate-400 font-black tracking-wider block text-right">
                    ⏱️ Processed Instantly • {msg.time}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[82%] ${
                msg.isSender ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              {/* Bubble */}
              <div
                className={`px-3.5 py-2.5 rounded-xl shadow-xs text-xs font-semibold select-text leading-relaxed ${
                  msg.isSender
                    ? 'bg-emerald-100 text-[#14532d] rounded-br-none border border-emerald-200' 
                    : 'bg-white text-slate-700 rounded-bl-none border border-slate-200' 
                }`}
              >
                {msg.type === 'audio' ? (
                  <div className="flex items-center gap-3.5 min-w-[140px] py-1">
                    <button className="h-7 w-7 rounded-full bg-emerald-700/10 text-emerald-800 flex items-center justify-center cursor-pointer hover:bg-emerald-700/20 active:scale-95 transition-all">
                      <span className="text-xs">▶</span>
                    </button>
                    <div className="flex-1">
                      <div className="h-1 bg-emerald-700/20 rounded-full w-full relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-emerald-700 rounded-full w-1/3" />
                      </div>
                      <span className="text-[9px] text-emerald-600 font-bold mt-1 block">Voice Note ({msg.audioDuration})</span>
                    </div>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>

              {/* Timestamp label below */}
              <span className="text-[9px] text-slate-400 font-bold tracking-wider mt-1 px-1">
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick message chips */}
      {!isAlreadyCancelled && isNotificationDelivered && (
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-hide text-[9px] shrink-0">
          <span className="text-slate-400 font-extrabold shrink-0 self-center uppercase text-[8px]">
            {isMechanicPartner 
              ? 'मैकेनिक से सवाल:' 
              : isMechanicPerspective 
              ? 'मैकेनिक के त्वरित जवाब:' 
              : isDriverPerspective 
              ? 'चालक के सवाल:' 
              : 'मालिक के त्वरित सवाल:'}
          </span>
          {(isMechanicPartner ? [
            "भैया, गाड़ी NH पर रुकी है, क्या आप आ सकते हैं?",
            "विजिटिंग चार्ज और रिपेयरिंग का क्या चार्ज लगेगा?",
            "क्या आपके पास 20T हाइड्रोलिक जैक व न्यूमेटिक टूल है?",
            "गाड़ी का एयर प्रेशर पाइप फट गया है, स्पेयर पार्ट मिलेगा?",
            "लगभग कितने मिनट में आप लोकेशन पर पहुंच जाएंगे?"
          ] : isMechanicPerspective ? [
            "हाँ भाई, मैं टूल्स और जैक लेकर 20 मिनट में आ रहा हूँ।",
            "कृपया अपनी सटीक लाइव GPS लोकेशन शेयर करें।",
            "विजिटिंग चार्ज ₹200 है, बाकी काम देखने के बाद तय होगा।",
            "गाड़ी को रोड की साइड में खड़ा करके पार्किंग लाइट चालू रखें।"
          ] : isDriverPerspective ? [
            "मालिक, गाड़ी के फिटनेस व बीमा कागजात पूरे हैं?",
            "सिर्फ ड्राइविंग करनी है ना, कोई हमाली तो नहीं?",
            "ट्रिप का एडवांस खर्चा गाड़ी निकलने से पहले मिलेगा?",
            "महीने में कितनी छुट्टियां मिलेंगी मालिक?"
          ] : [
            "सैलरी या ट्रिप का भत्ता क्या लोगे?",
            "गाड़ी कल सुबह बालाघाट से उठानी है, तैयार हो?",
            "क्या आप 16-चक्का भारी ट्रक चला लेते हैं?",
            "गाड़ी में सिर्फ ड्राइविंग करनी है, नो हमाली।"
          ]).map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setInputText(chip)}
              className="bg-white hover:bg-slate-100 active:scale-95 border border-slate-250 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap font-bold shadow-2xs transition-all cursor-pointer"
            >
              💬 {chip}
            </button>
          ))}
        </div>
      )}

      {/* 3. BOTTOM MESSAGE INPUT BAR */}
      <div 
        id="chat-input-bar" 
        className="bg-white border-t border-slate-200 px-3 py-3 flex items-center gap-2.5 shrink-0"
      >
        {isAlreadyCancelled ? (
          <div className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">
              🚫 Chat closed because match was cancelled
            </span>
          </div>

        ) : isRecording ? (
          /* Pulsing recording visualization */
          <div className="flex-1 flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5 transition-all">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-orange"></span>
              </span>
              <span className="text-xs text-brand-orange font-bold animate-pulse">
                🎙️ Recording Voice... 
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-orange-600">
                0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
              </span>
              <button 
                onClick={() => setIsRecording(false)} 
                className="text-slate-400 hover:text-red-500 font-semibold text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Standard input */
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type message / संदेश लिखें..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-navy focus:bg-white focus:ring-1 focus:ring-navy rounded-xl px-3 py-2 text-xs outline-none transition-all placeholder:text-slate-400 font-semibold"
            />
            {inputText.trim() && (
              <button
                onClick={handleSendMessage}
                className="p-2 text-brand-orange hover:text-navy rounded-xl active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Microphone action button */}
        {!isAlreadyCancelled && isNotificationDelivered && (
          <button
            onClick={handleToggleRecord}
            className={`h-11 w-11 rounded-full flex items-center justify-center active:scale-95 transition-all text-white cursor-pointer shadow-md shadow-brand-orange/15 shrink-0 ${
              isRecording 
                ? 'bg-navy border-2 border-slate-100' 
                : 'bg-brand-orange hover:opacity-90 text-navy'
            }`}
          >
            {isRecording ? (
              <Square className="h-3.5 w-3.5 fill-white text-white" />
            ) : (
              <Mic className="h-5 w-5 text-navy" />
            )}
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. CHAT-ROOM INTEGRATED CANCELLATION & REFUND / REPORT SYSTEM MODAL */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] w-full p-5 space-y-4 border border-slate-150 shadow-2xl max-w-[340px]"
            >
              
              {!cancelSuccess ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    
                    {isDriverPerspective ? (
                      <>
                        <h3 className="text-sm font-black text-navy uppercase leading-tight">क्या आपको मालिक का व्यवहार ठीक नहीं लगा?</h3>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          यदि गाड़ी मालिक <strong className="text-slate-800">{partnerName}</strong> की बातचीत, व्यवहार, कम सैलरी या अनुचित शर्तों की वजह से आप काम नहीं करना चाहते, तो यहाँ कारण दर्ज करें। आपकी सुरक्षा व सम्मान हमारी प्राथमिकता है।
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-black text-navy uppercase leading-tight">क्या आपको ड्राइवर पसंद नहीं आया?</h3>
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                          यदि ड्राइवर <strong className="text-slate-800">{partnerName}</strong> वार्तालाप, व्यवहार अथवा अनुभव की वजह से आपको पसंद नहीं आया, तो यहाँ कैंसल करें।
                        </p>
                      </>
                    )}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-left border border-slate-100 max-h-[190px] overflow-y-auto">
                    <span className="text-[8.5px] text-slate-400 font-black block bg-white border px-1.5 py-0.5 rounded italic w-max mb-1">
                      {isDriverPerspective ? 'डील रिजेक्ट करने का कारण चुनें:' : 'मैच कैंसल करने का कारण चुनें:'}
                    </span>
                    {(isDriverPerspective ? [
                      'मालिक का बात करने का व्यवहार/लहजा खराब लगा (Owner behavior / rude attitude)',
                      'सैलरी या ट्रिप भत्ता तय से बहुत कम दे रहे हैं (Offered low salary or unfair cuts)',
                      'ड्राइविंग के अलावा जबरन हमाली/लोडिंग का काम बोल रहे हैं (Demanding porter/manual labor)',
                      'गाड़ी के कागजात/फिटनेस सही नहीं लग रहे (Vehicle papers/fitness doubtful)',
                      'रूट, नाइट ड्राइविंग या समय पर असहमति है (Route or timing mismatch)',
                      'मालिक ने फोन पर कोई संतोषजनक जवाब नहीं दिया (Unprofessional / vague responses)'
                    ] : [
                      'Driver demanded high salary (चालक ज्यादा तनख्वाह मांग रहा है)',
                      'mParivahan check mismatch (mParivahan ऐप में जानकारी मेल नहीं खाई)',
                      'Behavior / Attitude issue (बात व्यवहार पसंद नहीं आया)',
                      'Route or general disagreement (लोकेशन या रूट पर असहमति है)',
                      'Changed my mind (फिलहाल गाड़ी नहीं चलानी है)'
                    ]).map((reason, index) => (
                      <label key={index} className="flex items-start gap-2 text-[9.5px] text-slate-650 font-bold cursor-pointer hover:text-navy py-0.5">
                        <input 
                          type="radio" 
                          name="chat_cancel_reason" 
                          checked={selectedCancelReason === reason}
                          onChange={() => setSelectedCancelReason(reason)}
                          className="mt-0.5 accent-brand-orange scale-90 shrink-0" 
                        />
                        <span className="leading-tight">{reason}</span>
                      </label>
                    ))}
                  </div>

                  <div className="bg-brand-orange/10 border border-brand-orange/30 p-2 rounded-xl text-center">
                    <p className="text-[9px] text-brand-orange font-black leading-normal uppercase">
                      {isDriverPerspective 
                        ? '🛡️ DRIVER DIGNITY & ZERO-PENALTY POLICY' 
                        : '🛡️ 100% FREE DIRECT CONNECT & SAFE EXIT'}
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-205 text-slate-700 font-extrabold text-[10px] rounded-xl cursor-pointer uppercase transition-all"
                    >
                      No, Go Back
                    </button>
                    <button
                      onClick={handleCompleteCancelAndRefund}
                      disabled={isProcessingCancel}
                      className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase transition-all active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                    >
                      {isProcessingCancel 
                        ? 'Processing...' 
                        : (isDriverPerspective ? 'Decline & Report 🚫' : 'Cancel Match ❌')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4 py-2 select-none">
                  <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <Check className="h-8 w-8 stroke-[3]" />
                  </div>

                  {isDriverPerspective ? (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-navy uppercase leading-normal">Safety Report Registered! 🛡️</h3>
                        <p className="text-[10px] text-slate-600 font-bold leading-relaxed px-1">
                          मालिक के अनुचित व्यवहार व शर्तों की रिपोर्ट सुरक्षित रूप से दर्ज कर ली गई है। 
                          <strong className="text-navy block mt-1 tracking-wide uppercase">Report ID: AID-SAF-{Date.now().toString().slice(-6)}</strong>
                          All India Driver पर ड्राइवरों के स्वाभिमान व सुरक्षा का पूरा ख्याल रखा जाता है।
                        </p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center">
                        <span className="block text-[8.5px] font-black text-emerald-600 uppercase">PROTECTED STATUS</span>
                        <span className="block text-xs font-black">मालिक ब्लॉक किया गया (Owner Blocked)</span>
                        <span className="block text-[9px] text-slate-500 font-bold leading-normal mt-0.5">
                          यह मालिक अब आपकी ड्यूटी लिस्ट में नहीं दिखेगा। आप बेझिझक अन्य सम्मानित गाड़ी मालिकों की ड्यूटी चुन सकते हैं।
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-navy uppercase leading-normal">Match Cancelled 🛡️</h3>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-2">
                          कैंसलेशन अनुरोध स्वीकृत हो गया है। ड्राइवर के साथ संपर्क सुरक्षित रूप से समाप्त कर दिया गया है। 
                          <strong className="text-navy block mt-1 tracking-wide uppercase">Exit ID: AID-DIS-{Date.now().toString().slice(-6)}</strong>
                        </p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center">
                        <span className="block text-[8.5px] font-black text-emerald-600 uppercase">100% FREE CONNECT</span>
                        <span className="block text-xs font-black">Free Direct Search Active</span>
                        <span className="block text-[9px] text-slate-500 font-bold leading-normal mt-0.5">
                          आप अन्य ड्राइवरों से बिल्कुल मुफ्त सीधे संपर्क कर सकते हैं।
                        </span>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => {
                      closeCancelModal();
                      handleBackNavigation();
                    }}
                    className="w-full py-3 bg-navy text-white hover:opacity-95 font-black text-xs rounded-xl cursor-pointer hover:bg-slate-850 uppercase tracking-widest transition-all"
                  >
                    Done / वापस डैशबोर्ड पर जाएँ
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. VEHICLE PHOTOS MODAL IN CHAT */}
      <AnimatePresence>
        {showChatVehiclePhotos && selectedOwnerJob?.vehiclePhotos && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none"
            onClick={() => setShowChatVehiclePhotos(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-4 space-y-3 shadow-2xl text-left border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-brand-orange" />
                  <div>
                    <h3 className="text-xs font-black text-navy uppercase leading-none">मालिक की गाड़ी की फोटो</h3>
                    <span className="text-[8.5px] text-slate-400 font-bold">{selectedOwnerJob.vehicle}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatVehiclePhotos(false)}
                  className="p-1 px-2 text-slate-400 hover:text-navy font-bold text-xs rounded-lg hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[8.5px] text-slate-400 font-extrabold uppercase">
                  तस्वीरें (Photos - Tap to Zoom):
                </span>
                <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto p-0.5">
                  {selectedOwnerJob.vehiclePhotos.map((photo, idx) => {
                    const photoTags = ['#1 Front', '#2 Side', '#3 Cargo', '#4 Cabin', '#5 Tyres', '#6 Plate'];
                    const tagText = photoTags[idx] || `#${idx + 1}`;
                    return (
                      <div
                        key={`chat-vphoto-${idx}`}
                        onClick={() => setChatPhotoPreview(photo)}
                        className="relative rounded-xl overflow-hidden border-2 border-brand-orange aspect-video bg-black cursor-pointer group shadow-xs"
                      >
                        <img src={photo} alt="Vehicle" className="h-full w-full object-cover group-hover:scale-105 transition-all" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="absolute bottom-1 right-1 text-[7.5px] bg-black/75 text-white font-extrabold px-1.5 py-0.2 rounded">
                          {tagText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-emerald-800 text-[9px] font-bold">
                ✓ गाड़ी मालिक द्वारा सीधे अपलोड की गई प्रमाणित वास्तविक फोटो
              </div>

              <button
                type="button"
                onClick={() => setShowChatVehiclePhotos(false)}
                className="w-full py-2.5 bg-navy text-white font-black text-xs rounded-xl cursor-pointer hover:bg-navy/90"
              >
                वापस चैट में जाएँ (Back to Chat)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. FULL LIGHTBOX PREVIEW IN CHAT */}
      <AnimatePresence>
        {chatPhotoPreview && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 select-none"
            onClick={() => setChatPhotoPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden p-2.5 border border-white/20 shadow-2xl text-center space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-1 pt-1">
                <span className="text-[10px] font-black text-brand-orange uppercase flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  <span>गाड़ी फोटो (Vehicle Photo)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setChatPhotoPreview(null)}
                  className="h-6 w-6 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[65vh]">
                <img
                  src={chatPhotoPreview}
                  alt="Zoom"
                  className="w-full h-auto object-contain max-h-[65vh]"
                />
              </div>

              <button
                type="button"
                onClick={() => setChatPhotoPreview(null)}
                className="w-full py-2 bg-brand-orange text-navy font-black text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Safety Reminder Popup: Call / Confirm Deal in Chat Room */}
      <SafetyReminderModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        onConfirm={handleConfirmChatCall}
        scenario={currentSafetyScenario}
        targetName={partnerName}
      />

    </div>
  );
}

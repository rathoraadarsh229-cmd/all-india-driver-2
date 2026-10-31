import React, { useState, useEffect, useMemo } from 'react';
import { insforge } from '../insforge';
import { 
  Wrench, 
  Phone, 
  MessageSquare,
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Power, 
  User, 
  Star,
  Settings,
  CreditCard,
  Camera,
  Truck,
  Eye,
  Plus,
  X,
  Clock,
  Sparkles,
  Navigation,
  Check,
  Heart
} from 'lucide-react';
import { AppScreen, MechanicProfile, MechanicHelpRequest, UserAuthType } from '../types';
import { DashboardShell, DashboardTab } from './DashboardShell';
import { getT } from '../utils/i18n';

interface Props {
  setScreen: (screen: AppScreen) => void;
  mechanicData?: Partial<MechanicProfile>;
  onOpenChatWithRequester?: (req: MechanicHelpRequest) => void;
  selectedLanguage?: string;
  setSelectedLanguage?: (lang: string) => void;
  authType?: UserAuthType;
  onOpenDonate?: () => void;
  onOpenAiAssistant?: () => void;
  onGoToWebsite?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const MechanicDashboard: React.FC<Props> = ({
  setScreen,
  mechanicData,
  onOpenChatWithRequester,
  selectedLanguage = 'hi',
  setSelectedLanguage,
  authType = 'gmail',
  onOpenDonate,
  onOpenAiAssistant,
  onGoToWebsite,
  theme,
  onToggleTheme
}) => {
  const t = getT(selectedLanguage);
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [garageStatus, setGarageStatus] = useState<'open' | 'closed'>('open');
  const [is24x7Emergency, setIs24x7Emergency] = useState(true);

  // Modals for Quick Actions
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [garagePhotos, setGaragePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=500&auto=format&fit=crop&q=80'
  ]);
  const [hourlyRate, setHourlyRate] = useState('₹450 / विज़िट');

  const activeMech = useMemo(() => {
    if (mechanicData?.name) return mechanicData;
    try {
      const raw = localStorage.getItem('insforge_real_mechanics_v2');
      if (raw) {
        const list = JSON.parse(raw);
        if (list && list.length > 0) return list[0];
      }
    } catch {}
    return mechanicData;
  }, [mechanicData]);

  // Load real incoming requests: shows both broadcast requests ('all') and direct requests
  const [activeRequests, setActiveRequests] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('aid_mechanic_requests');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          return list.filter((r: any) => 
            r && 
            !r.id?.startsWith('sample-') && 
            !r.id?.startsWith('fake-') && 
            r.requesterName !== 'Ramkumar Yadav' && 
            r.requesterName !== 'Suresh Kumar' &&
            (!r.targetMechanicId || r.targetMechanicId === 'all' || (activeMech?.id && r.targetMechanicId === activeMech.id))
          );
        }
      }
    } catch {}
    return [];
  });

  // Re-sync requests periodically or on storage change
  useEffect(() => {
    const syncRequests = () => {
      try {
        const raw = localStorage.getItem('aid_mechanic_requests');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const clean = list.filter((r: any) => 
              r && 
              !r.id?.startsWith('sample-') && 
              !r.id?.startsWith('fake-') && 
              r.requesterName !== 'Ramkumar Yadav' && 
              r.requesterName !== 'Suresh Kumar' &&
              (!r.targetMechanicId || r.targetMechanicId === 'all' || (activeMech?.id && r.targetMechanicId === activeMech.id))
            );
            setActiveRequests(clean);
          }
        }
      } catch {}
    };

    syncRequests();
    const interval = setInterval(syncRequests, 5000);
    return () => clearInterval(interval);
  }, [activeMech?.id]);

  useEffect(() => {
    try {
      // Ensure session persistence for mechanic role
      localStorage.setItem('all_india_driver_is_authenticated', 'true');
      localStorage.setItem('all_india_driver_selected_role', 'mechanic');
    } catch {}
  }, []);

  const handleAccept = (id: string) => {
    setActiveRequests(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: 'accepted' as const } : r);
      try {
        localStorage.setItem('aid_mechanic_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleComplete = (id: string) => {
    setActiveRequests(prev => {
      const updated = prev.filter(r => r.id !== id);
      try {
        localStorage.setItem('aid_mechanic_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Profile completion calculation
  const profileCompletionPercentage = useMemo(() => {
    let score = 30;
    if (activeMech?.name) score += 25;
    if (activeMech?.garageName) score += 25;
    if (activeMech?.phone) score += 20;
    return Math.min(100, score);
  }, [activeMech]);

  return (
    <DashboardShell
      appName={t('appName', 'ALL INDIA DRIVER APP')}
      roleKey="mechanic"
      onOpenAiAssistant={onOpenAiAssistant}
      onGoToWebsite={onGoToWebsite}
      theme={theme}
      onToggleTheme={onToggleTheme}
      userName={activeMech?.garageName || activeMech?.name || 'मास्टर मैकेनिक'}
      userPhone={activeMech?.phone || 'फ़ोन नंबर दर्ज नहीं'}
      userRoleTitle="मैकेनिक गैरेज"
      authType={authType}
      walletCredits={10}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      profileCompletionPercentage={profileCompletionPercentage}
      onCompleteProfileClick={() => setScreen('mechanic-profile-setup')}
      selectedLanguage={selectedLanguage}
      onLanguageChange={setSelectedLanguage}
      onSwitchRoleClick={() => setScreen('role-selection')}
      onLogoutClick={async () => {
        try {
          await insforge.auth.signOut();
        } catch {}
        try {
          localStorage.removeItem('all_india_driver_is_authenticated');
          localStorage.removeItem('all_india_driver_google_verified');
          localStorage.removeItem('all_india_driver_auth_type');
          localStorage.removeItem('all_india_driver_user_email');
          localStorage.removeItem('all_india_driver_verified_email');
        } catch {}
        setScreen('login');
      }}
      onDonateClick={onOpenDonate}
    >
      {/* WHEN TAB IS HOME */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          
          {/* 1. BADA TOGGLE: गैरेज खुला है / बंद है (CHARCOAL #1C1C21 + YELLOW #E10600) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`h-4 w-4 rounded-full shrink-0 ${
                  garageStatus === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
                <div>
                  <h3 className="text-base font-black text-[#1C1C21] leading-tight">
                    {garageStatus === 'open' 
                      ? t('mechanicToggleOpen', 'गैरेज खुला है') 
                      : t('mechanicToggleClosed', 'गैरेज बंद है')}
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    {garageStatus === 'open' ? 'ड्राइवर आपको कॉल व रिक्वेस्ट भेज सकते हैं' : 'नई रिक्वेस्ट प्राप्त नहीं होंगी'}
                  </span>
                </div>
              </div>

              {/* Status Switch (Min 48px high) */}
              <button
                type="button"
                onClick={() => setGarageStatus(prev => prev === 'open' ? 'closed' : 'open')}
                className={`min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  garageStatus === 'open'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#1C1C21] hover:bg-[#2A2A32] text-slate-300'
                }`}
              >
                <Power className="h-4 w-4" />
                <span>{garageStatus === 'open' ? 'खुला (Open)' : 'बंद (Closed)'}</span>
              </button>
            </div>

            {/* 24x7 Emergency Option */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-black text-[#1C1C21] flex items-center gap-1.5">
                <span>🚨</span>
                <span>{t('mechanicToggle24x7', '24x7 इमरजेंसी सेवा')}</span>
              </span>
              <button
                type="button"
                onClick={() => setIs24x7Emergency(!is24x7Emergency)}
                className={`min-h-[48px] px-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                  is24x7Emergency
                    ? 'bg-[#1C1C21] border-[#E10600] text-[#E10600]'
                    : 'bg-white border-slate-300 text-slate-500'
                }`}
              >
                {is24x7Emergency ? '✓ सक्रिय (Active)' : 'निष्क्रिय (Off)'}
              </button>
            </div>
          </div>

          {/* 2. QUICK STATS CARDS */}
          <div className="grid grid-cols-3 gap-2">
            {/* Stat 1: Service requests */}
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-3 text-center shadow-xs space-y-1">
              <span className="text-xs font-black text-gray-400 block truncate">
                {t('mechanicStatRequests', 'सर्विस रिक्वेस्ट')}
              </span>
              <span className="text-xl font-black text-white block leading-none">
                {activeRequests.length}
              </span>
              <span className="text-xs text-gray-500 font-bold block">
                एक्टिव
              </span>
            </div>

            {/* Stat 2: Rating */}
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-3 text-center shadow-xs space-y-1">
              <span className="text-xs font-black text-gray-400 block truncate">
                {t('mechanicStatRating', 'रेटिंग')}
              </span>
              <div className="flex items-center justify-center gap-1 leading-none">
                <span className="text-xl font-black text-[#E10600]">
                  {activeMech?.rating ? Number(activeMech.rating).toFixed(1) : 'नया'}
                </span>
                <Star className="h-4 w-4 fill-[#E10600] text-[#E10600]" />
              </div>
              <span className="text-xs text-gray-500 font-bold block">
                {activeMech?.rating ? 'प्रमाणित' : 'नया मैकेनिक'}
              </span>
            </div>

            {/* Stat 3: Profile views */}
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-3 text-center shadow-xs space-y-1">
              <span className="text-xs font-black text-gray-400 block truncate">
                {t('mechanicStatViews', 'प्रोफ़ाइल देखीं')}
              </span>
              <span className="text-xl font-black text-white block leading-none">
                {activeRequests.length > 0 ? activeRequests.length * 3 : 0}
              </span>
              <span className="text-xs text-gray-500 font-bold block">
                चालक / मालिक
              </span>
            </div>
          </div>

          {/* 3. QUICK ACTIONS (MIN 48PX HEIGHT, CHARCOAL + YELLOW) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Action 1: पास की सर्विस रिक्वेस्ट */}
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className="min-h-[52px] bg-[#1C1C21] hover:bg-[#25252c] border border-[#E10600]/40 rounded-2xl p-3 flex items-center gap-2.5 shadow-sm cursor-pointer transition-all active:scale-95 text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-[#E10600] text-[#1C1C21] flex items-center justify-center shrink-0 font-black">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-black text-[#E10600] block leading-tight truncate">
                  नई रिक्वेस्ट ({activeRequests.length})
                </span>
                <span className="text-xs font-bold text-slate-300 block truncate">
                  ब्रेकडाउन सूची
                </span>
              </div>
            </button>

            {/* Action 2: मेरी सर्विस और रेट */}
            <button
              type="button"
              onClick={() => setShowRatesModal(true)}
              className="min-h-[52px] bg-white border-2 border-slate-200 hover:border-[#1C1C21] rounded-2xl p-3 flex items-center gap-2.5 shadow-xs cursor-pointer transition-all active:scale-95 text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-[#1C1C21] flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-black text-[#1C1C21] block leading-tight truncate">
                  {t('mechanicActionRates', 'सर्विस और रेट')}
                </span>
                <span className="text-xs font-bold text-slate-500 block truncate">
                  {hourlyRate}
                </span>
              </div>
            </button>

            {/* Action 3: सपोर्ट करें (Support Us) */}
            {onOpenDonate && (
              <button
                type="button"
                onClick={onOpenDonate}
                className="min-h-[52px] bg-[#1C1C21] hover:bg-[#25252c] border border-[#E10600]/40 rounded-2xl p-3 flex items-center justify-between shadow-sm cursor-pointer transition-all active:scale-[0.98] col-span-2 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-[#E10600] text-[#1C1C21] flex items-center justify-center shrink-0 font-black">
                    <Heart className="h-5 w-5 fill-[#1C1C21]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#E10600] leading-tight">
                        सपोर्ट करें (Support Us)
                      </span>
                      <span className="text-[9px] bg-[#E10600]/20 text-[#E10600] font-black px-1.5 py-0.5 rounded-full border border-[#E10600]/40 uppercase shrink-0">
                        फ्री सेवा
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-300 block truncate mt-0.5">
                      ऑनलाइन ड्राइवर को फ्री रखने में सहयोग दें और सभी सहयोगियों की सूची देखें
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#1C1C21] bg-[#E10600] px-3 py-1.5 rounded-xl shrink-0 ml-2">
                  देखें ➔
                </span>
              </button>
            )}
          </div>

          {/* 4. नई रिक्वेस्ट / ब्रेकडाउन अनुरोध (STRICT NO-FAKE DATA: SHOW "अभी कुछ नहीं है" IF EMPTY) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#E10600] animate-pulse" />
                <h4 className="text-base font-black text-[#1C1C21]">
                  नई रिक्वेस्ट ({activeRequests.length})
                </h4>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {activeRequests.length > 0 ? 'तुरंत संपर्क करें' : 'लाइव'}
              </span>
            </div>

            {/* IF NO REQUESTS: STRICTLY SHOW "अभी कुछ नहीं है" */}
            {activeRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h5 className="text-base font-black text-[#1C1C21]">
                  अभी कुछ नहीं है
                </h5>
                <p className="text-sm font-medium text-slate-500">
                  अभी कोई नई सर्विस रिक्वेस्ट नहीं है। आसपास से कोई ड्राइवर या मालिक मदद मांगेगा तो वह तुरंत यहाँ दिखेगी।
                </p>
              </div>
            ) : (
              /* REAL REQUESTS SENT FROM DRIVER / OWNER */
              <div className="space-y-3">
                {activeRequests.map(req => {
                  const reqLat = req.lat || 21.8124;
                  const reqLng = req.lng || 80.1838;
                  const issueName = req.issueCategory || 'ब्रेकडाउन सहायता';

                  return (
                    <div 
                      key={req.id} 
                      className="border-2 border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-xs hover:border-[#1C1C21] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-[#1C1C21]">
                              {req.requesterName}
                            </span>
                            <span className="text-xs bg-[#1C1C21] text-[#E10600] font-black px-2 py-0.5 rounded-md">
                              {req.requesterRole === 'owner' ? 'गाड़ी मालिक' : 'चालक'}
                            </span>
                            <span className="text-xs bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-md">
                              {issueName}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium text-slate-700 mt-1">
                            {req.issueDescription}
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-1">
                            <MapPin className="h-3.5 w-3.5 text-[#E10600] fill-[#E10600]" />
                            <span>{req.location || 'हाईवे मार्ग'}</span>
                            {req.timestamp && (
                              <span className="text-slate-400 ml-1">• {req.timestamp}</span>
                            )}
                          </div>
                        </div>

                        {req.status === 'accepted' && (
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md shrink-0">
                            स्वीकृत ✓
                          </span>
                        )}
                      </div>

                      {/* ACTION BUTTONS (MIN 48PX HEIGHT): Call, Directions, Accept, Done */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        {/* 1. कॉल करें */}
                        {req.requesterPhone ? (
                          <a
                            href={`tel:${req.requesterPhone}`}
                            className="min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Phone className="h-4 w-4" />
                            <span>कॉल करें</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="min-h-[48px] bg-slate-100 text-slate-400 rounded-xl font-black text-sm flex items-center justify-center gap-1.5"
                          >
                            <Phone className="h-4 w-4" />
                            <span>फ़ोन उपलब्ध नहीं</span>
                          </button>
                        )}

                        {/* 2. रास्ता देखें (Google Maps directions) */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${reqLat},${reqLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[48px] bg-[#1C1C21] hover:bg-[#25252c] text-[#E10600] rounded-xl font-black text-sm flex items-center justify-center gap-1.5 border border-[#E10600]/40 shadow-xs cursor-pointer"
                        >
                          <Navigation className="h-4 w-4" />
                          <span>रास्ता देखें</span>
                        </a>
                      </div>

                      {/* Accept & Complete buttons */}
                      <div className="flex gap-2">
                        {req.status !== 'accepted' ? (
                          <button
                            type="button"
                            onClick={() => handleAccept(req.id)}
                            className="flex-1 min-h-[48px] bg-[#1C1C21] text-[#E10600] hover:bg-[#25252c] rounded-xl font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer border border-[#E10600]/40"
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                            <span>अनुरोध स्वीकार करें</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleComplete(req.id)}
                            className="flex-1 min-h-[48px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm cursor-pointer"
                          >
                            पूर्ण (Done - हटाएं)
                          </button>
                        )}

                        {onOpenChatWithRequester && (
                          <button
                            type="button"
                            onClick={() => onOpenChatWithRequester(req)}
                            className="min-h-[48px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                            title="चैट करें"
                          >
                            <MessageSquare className="h-4 w-4 text-[#1C1C21]" />
                            <span>चैट</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* WHEN TAB IS SEARCH / ALL REQUESTS */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-base font-black text-[#1C1C21] border-b border-slate-100 pb-2.5">
              सभी ब्रेकडाउन व सर्विस रिक्वेस्ट ({activeRequests.length})
            </h4>

            {activeRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h5 className="text-base font-black text-[#1C1C21]">
                  अभी कुछ नहीं है
                </h5>
                <p className="text-sm font-medium text-slate-500">
                  कोई पेंडिंग अनुरोध नहीं है। नई रिक्वेस्ट आने पर तुरंत यहाँ दिखेगी।
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map(req => (
                  <div key={req.id} className="border-2 border-slate-200 rounded-2xl p-3.5 space-y-2 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-[#1C1C21]">{req.requesterName}</span>
                      <span className="text-xs bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-md">
                        {req.issueCategory || 'ब्रेकडाउन'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{req.issueDescription}</p>
                    <div className="flex gap-2 pt-1">
                      {req.requesterPhone && (
                        <a
                          href={`tel:${req.requesterPhone}`}
                          className="flex-1 min-h-[48px] bg-emerald-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-1.5"
                        >
                          <Phone className="h-4 w-4" />
                          <span>कॉल करें</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleComplete(req.id)}
                        className="flex-1 min-h-[48px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-black text-sm"
                      >
                        पूर्ण (Done)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: मेरी सर्विस और रेट (Rates modal) */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-base font-black text-[#1C1C21]">मेरी सर्विस और रेट कार्ड</h4>
              <button 
                type="button" 
                onClick={() => setShowRatesModal(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase block mb-1">
                  विज़िट व सर्विस रेट
                </label>
                <input
                  type="text"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full min-h-[48px] px-3.5 border-2 border-slate-300 rounded-xl font-black text-[#1C1C21]"
                  placeholder="उदा. ₹450 / विज़िट"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-500 uppercase block">उपलब्ध सेवाएं</span>
                {['इमरजेंसी रोडसाइड ब्रेकडाउन', 'एयर ब्रेक व क्लच रिपेयर', 'टायर पंक्चर व हाइड्रोलिक जैक', 'इलेक्ट्रिकल व बैटरी जंप-स्टार्ट'].map(s => (
                  <div key={s} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-xs font-bold text-[#1C1C21]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRatesModal(false)}
              className="w-full min-h-[48px] bg-[#1C1C21] hover:bg-[#25252c] text-[#E10600] rounded-xl font-black text-sm shadow-xs cursor-pointer border border-[#E10600]/40"
            >
              सेव करें
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: गैरेज फोटो (Garage Photos Modal) */}
      {showPhotosModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-base font-black text-[#1C1C21]">गैरेज फोटो (Garage Photos)</h4>
              <button 
                type="button" 
                onClick={() => setShowPhotosModal(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {garagePhotos.map((p, idx) => (
                <div key={idx} className="h-28 rounded-xl overflow-hidden border border-slate-200 relative group">
                  <img src={p} alt="Garage" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500&auto=format&fit=crop&q=80';
                setGaragePhotos(prev => [...prev, sample]);
              }}
              className="w-full min-h-[48px] bg-[#1C1C21] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>नई फोटो जोड़ें</span>
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

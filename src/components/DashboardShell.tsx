import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  User, 
  Settings, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  LogOut,
  Globe,
  Shuffle,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Share2,
  Heart,
  Truck
} from 'lucide-react';
import { UserAuthBadge } from './UserAuthBadge';
import { UserAuthType } from '../types';
import { getT } from '../utils/i18n';
import { LANGUAGES } from '../data';
import { ShareAppModal } from './ShareAppModal';
import { LegalTermsPrivacyModal, LegalDocType } from './LegalTermsPrivacyModal';

export type DashboardTab = 'home' | 'convoy' | 'search' | 'profile' | 'settings';

interface DashboardShellProps {
  appName?: string;
  userName: string;
  userPhone?: string;
  userRoleTitle: string; // 'ड्राइवर' | 'गाड़ी मालिक' | 'मैकेनिक'
  authType?: UserAuthType;
  walletCredits: number;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  profileCompletionPercentage: number;
  onCompleteProfileClick: () => void;
  selectedLanguage: string;
  onLanguageChange?: (langCode: string) => void;
  onSwitchRoleClick?: () => void;
  onLogoutClick?: () => void;
  onDonateClick?: () => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  appName,
  userName,
  userPhone,
  userRoleTitle,
  authType = 'gmail',
  walletCredits,
  activeTab,
  setActiveTab,
  profileCompletionPercentage,
  onCompleteProfileClick,
  selectedLanguage = 'hi',
  onLanguageChange,
  onSwitchRoleClick,
  onLogoutClick,
  onDonateClick,
  children
}) => {
  const t = getT(selectedLanguage);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terms');

  return (
    <div className="flex-1 bg-[#0B0B0C] flex flex-col h-full w-full overflow-hidden select-none font-sans text-white">
      
      {/* 1. TOP HEADER (HERO MOTOCORP RACING RED & BLACK) */}
      <header className="bg-[#121214] text-white px-4 sm:px-8 py-3.5 shrink-0 shadow-md border-b border-white/10 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* App title + User role */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#E10600] text-white font-black flex items-center justify-center shrink-0 shadow-md shadow-[#E10600]/30 text-base">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[12px] text-[#E10600] font-black uppercase tracking-wider truncate">
                {appName || t('appName', 'ALL INDIA DRIVER APP')}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black text-white truncate">
                  {userName}
                </span>
                <span className="text-xs bg-[#1A1A22] text-[#E10600] font-black px-2 py-0.5 rounded-md border border-[#E10600]/40 shrink-0">
                  {userRoleTitle}
                </span>
                <UserAuthBadge type={authType} size="xs" />
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Support Us Button */}
            {onDonateClick && (
              <button
                type="button"
                onClick={onDonateClick}
                className="min-h-[40px] px-3.5 bg-[#E10600] hover:bg-[#c20500] text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-md shadow-[#E10600]/25 cursor-pointer active:scale-95"
                title="सपोर्ट करें (Support Us)"
              >
                <Heart className="h-4 w-4 fill-white stroke-[2.5]" />
                <span className="font-sans">सपोर्ट करें</span>
              </button>
            )}

            {/* Share Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="min-h-[40px] px-3 bg-[#1A1A22] hover:bg-[#25252e] text-[#E10600] rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all border border-white/10 shadow-xs cursor-pointer"
              title="ऐप शेयर करें"
            >
              <Share2 className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">शेयर</span>
            </button>

            {/* Switch Role Button */}
            {onSwitchRoleClick && (
              <button
                type="button"
                onClick={onSwitchRoleClick}
                className="min-h-[40px] px-3 bg-[#1A1A22] hover:bg-[#25252e] text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1 transition-all border border-white/10 shadow-xs cursor-pointer"
                title="रोल बदलें (Driver / Owner / Mechanic)"
              >
                <Shuffle className="h-4 w-4 text-[#E10600]" />
                <span className="hidden sm:inline">रोल बदलें</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. DASHBOARD SUB-NAVIGATION TABS (CLEAN WEBSITE STYLE - NO MOBILE FLOATING BOTTOM BAR) */}
      <div className="bg-[#16161A] border-b border-white/10 px-4 sm:px-8 py-2.5 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-[#E10600] text-white shadow-md shadow-[#E10600]/30'
                : 'bg-[#1A1A22] text-gray-300 hover:text-white hover:bg-[#25252e] border border-white/5'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>अवलोकन (Dashboard)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('convoy')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'convoy'
                ? 'bg-[#E10600] text-white shadow-md shadow-[#E10600]/30'
                : 'bg-[#1A1A22] text-gray-300 hover:text-white hover:bg-[#25252e] border border-white/5'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>काफिला (हमसफर)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-[#E10600] text-white shadow-md shadow-[#E10600]/30'
                : 'bg-[#1A1A22] text-gray-300 hover:text-white hover:bg-[#25252e] border border-white/5'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>खोज / नौकरियां</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-[#E10600] text-white shadow-md shadow-[#E10600]/30'
                : 'bg-[#1A1A22] text-gray-300 hover:text-white hover:bg-[#25252e] border border-white/5'
            }`}
          >
            <User className="h-4 w-4" />
            <span>प्रोफ़ाइल</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-[#E10600] text-white shadow-md shadow-[#E10600]/30'
                : 'bg-[#1A1A22] text-gray-300 hover:text-white hover:bg-[#25252e] border border-white/5'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>सेटिंग्स</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN SCROLLABLE CONTENT BODY (FULL WEBSITE WIDTH) */}
      <main className="flex-1 overflow-y-auto pb-12 overscroll-contain">
        
        {/* HOME TAB CONTENT */}
        {activeTab === 'home' && (
          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* Profile Incompletion Banner if < 100% */}
            {profileCompletionPercentage < 100 && (
              <div 
                onClick={onCompleteProfileClick}
                className="bg-[#121214] text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 border border-[#E10600]/40 cursor-pointer hover:bg-[#1A1A22] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#E10600] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-[#E10600]/30">
                    {profileCompletionPercentage}%
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white leading-tight">
                      {t('profileAlertTitle', 'प्रोफाइल पूरी करें')}
                    </h4>
                    <p className="text-xs text-gray-300 font-medium mt-0.5">
                      {t('profileAlertDesc', 'अधिक नौकरियां और सीधे संपर्क पाने के लिए विवरण भरें।')}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#E10600] shrink-0" />
              </div>
            )}

            {/* Dashboard Child View (e.g. driver job market, owner radar) */}
            {children}
          </div>
        )}

        {/* CONVOY (KAFILA) TAB */}
        {activeTab === 'convoy' && (
          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        )}

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
            <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="h-16 w-16 rounded-2xl bg-[#E10600] text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-[#E10600]/30">
                  {userName ? userName[0].toUpperCase() : 'U'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase">{userName}</h3>
                  <p className="text-xs text-gray-400 font-bold">{userPhone || 'मोबाइल नंबर उपलब्ध'}</p>
                  <span className="inline-block bg-[#E10600]/20 text-[#E10600] border border-[#E10600]/40 text-[10px] font-black px-2 py-0.5 rounded-md">
                    {userRoleTitle}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onCompleteProfileClick}
                  className="w-full py-3.5 px-4 bg-[#1A1A22] hover:bg-[#25252e] text-white font-bold text-xs rounded-xl flex items-center justify-between border border-white/10 transition-colors"
                >
                  <span>प्रोफाइल एडिट करें / Edit Profile</span>
                  <ChevronRight className="h-4 w-4 text-[#E10600]" />
                </button>

                {onSwitchRoleClick && (
                  <button
                    type="button"
                    onClick={onSwitchRoleClick}
                    className="w-full py-3.5 px-4 bg-[#1A1A22] hover:bg-[#25252e] text-white font-bold text-xs rounded-xl flex items-center justify-between border border-white/10 transition-colors"
                  >
                    <span>भूमिका बदलें / Switch Role</span>
                    <Shuffle className="h-4 w-4 text-[#E10600]" />
                  </button>
                )}

                {onLogoutClick && (
                  <button
                    type="button"
                    onClick={onLogoutClick}
                    className="w-full py-3.5 px-4 bg-red-950/40 hover:bg-red-950/60 text-red-400 font-bold text-xs rounded-xl flex items-center justify-between border border-red-900/40 transition-colors"
                  >
                    <span>लॉग आउट / Sign Out</span>
                    <LogOut className="h-4 w-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
            <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h3 className="text-lg font-black text-white uppercase border-b border-white/10 pb-4">
                सेटिंग्स एवं प्राथमिकताएं
              </h3>

              {/* Language selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  ऐप भाषा (Language):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LANGUAGES.slice(0, 6).map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => onLanguageChange && onLanguageChange(l.code)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                        selectedLanguage === l.code
                          ? 'bg-[#E10600] text-white border-[#E10600] shadow-sm'
                          : 'bg-[#1A1A22] text-gray-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="block font-black">{l.nativeLabel}</span>
                      <span className="text-[10px] text-gray-400">{l.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Legal Documentation Links */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  कानूनी दस्तावेज़ एवं नीतियां (Legal Policies):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocType('terms');
                      setIsLegalModalOpen(true);
                    }}
                    className="p-3 rounded-2xl bg-[#1A1A22] hover:bg-[#25252e] border border-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-xs font-black text-white">उपयोग की शर्तें</span>
                      <span className="text-[10px] text-gray-400">Terms of Use (English & हिन्दी)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLegalDocType('privacy');
                      setIsLegalModalOpen(true);
                    }}
                    className="p-3 rounded-2xl bg-[#1A1A22] hover:bg-[#25252e] border border-white/10 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-xs font-black text-white">गोपनीयता नीति</span>
                      <span className="text-[10px] text-gray-400">Privacy Policy (English & हिन्दी)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Share App Modal */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        selectedLanguage={selectedLanguage}
      />

      {/* Official Legal Terms & Privacy Modal */}
      <LegalTermsPrivacyModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialDoc={legalDocType}
        defaultLang={selectedLanguage === 'en' ? 'en' : 'hi'}
      />
    </div>
  );
};

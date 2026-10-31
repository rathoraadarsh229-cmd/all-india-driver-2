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
  Truck,
  Sparkles,
  AlertTriangle,
  Sun,
  Moon,
  type LucideIcon
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
  roleKey?: 'driver' | 'owner' | 'mechanic';
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
  onOpenSOS?: () => void;
  onOpenAiAssistant?: () => void;
  onGoToWebsite?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  appName,
  userName,
  userPhone,
  userRoleTitle,
  roleKey = 'driver',
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
  onOpenSOS,
  onOpenAiAssistant,
  onGoToWebsite,
  theme = 'dark',
  onToggleTheme,
  children
}) => {
  const t = getT(selectedLanguage);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terms');

  const tabItems: { key: DashboardTab; label: string; icon: LucideIcon }[] = [
    { key: 'home', label: roleKey === 'mechanic' ? 'नई रिक्वेस्ट' : 'डैशबोर्ड', icon: Home },
    ...(roleKey === 'mechanic' ? [] : [{ key: 'convoy' as DashboardTab, label: 'काफिला', icon: Truck }]),
    { key: 'search', label: roleKey === 'mechanic' ? 'सभी रिक्वेस्ट' : roleKey === 'owner' ? 'ड्राइवर खोजें' : 'नौकरी खोजें', icon: Search },
    { key: 'profile', label: 'मेरी प्रोफाइल', icon: User },
    { key: 'settings', label: 'सेटिंग्स', icon: Settings }
  ];

  const tabDescriptions: Record<DashboardTab, { title: string; description: string }> = {
    home: roleKey === 'mechanic'
      ? { title: 'नई सर्विस रिक्वेस्ट', description: 'ड्राइवर या गाड़ी मालिक से आई नई मदद की रिक्वेस्ट यहाँ देखें और जवाब दें।' }
      : roleKey === 'owner'
      ? { title: 'मालिक डैशबोर्ड', description: 'अपनी गाड़ियाँ, ड्राइवर से जुड़ी गतिविधियाँ और ज़रूरी शॉर्टकट यहाँ देखें।' }
      : { title: 'ड्राइवर डैशबोर्ड', description: 'अपनी ड्यूटी की उपलब्धता, काम की स्थिति और ज़रूरी शॉर्टकट यहाँ देखें।' },
    convoy: roleKey === 'owner'
      ? { title: 'काफिला और यात्रा', description: 'यात्रा और काफिले से जुड़ी जानकारी यहाँ देखें।' }
      : { title: 'काफिला / हमसफर', description: 'साथ चलने वाले ड्राइवरों और यात्रा समूहों की जानकारी यहाँ देखें।' },
    search: roleKey === 'mechanic'
      ? { title: 'सभी सर्विस रिक्वेस्ट', description: 'आपको मिली ब्रेकडाउन और सर्विस रिक्वेस्ट की सूची यहाँ देखें।' }
      : roleKey === 'owner'
      ? { title: 'ड्राइवर खोजें', description: 'स्थान और वाहन की ज़रूरत के अनुसार ड्राइवर खोजें और उनसे संपर्क करें।' }
      : { title: 'नौकरी खोजें', description: 'उपलब्ध ड्राइविंग काम देखें और गाड़ी मालिक से सीधे संपर्क करें।' },
    profile: { title: 'मेरी प्रोफाइल', description: 'अपना नाम, मोबाइल नंबर और अन्य प्रोफाइल जानकारी देखें या अपडेट करें।' },
    settings: { title: 'सेटिंग्स', description: 'ऐप की भाषा और अपनी प्राथमिकताएँ बदलें।' }
  };

  const activeTabInfo = tabDescriptions[activeTab];

  return (
    <div className="flex-1 bg-[#0B0B0C] flex flex-col h-full w-full overflow-hidden select-none font-sans text-white">
      
      {/* 1. TOP HEADER (HERO MOTOCORP RACING RED & BLACK) */}
      <header className="bg-[#121214] text-white px-4 sm:px-8 py-3.5 shrink-0 shadow-md border-b border-white/10 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* App title + User role */}
          <button
            type="button"
            onClick={onGoToWebsite}
            disabled={!onGoToWebsite}
            className="flex items-center gap-3 min-w-0 text-left cursor-pointer disabled:cursor-default"
            title="मुख्य वेबसाइट पर जाएँ"
            aria-label="मुख्य वेबसाइट पर जाएँ"
          >
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
          </button>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="h-10 w-10 rounded-xl bg-[#1A1A22] hover:bg-[#25252e] text-white border border-white/10 flex items-center justify-center cursor-pointer"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-200" />}
              </button>
            )}
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="min-h-[40px] px-3 bg-[#1A1A22] hover:bg-[#25252e] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
                title="AI सहायता खोलें"
                aria-label="AI सहायता खोलें"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="hidden sm:inline">AI सहायता</span>
              </button>
            )}
            {onOpenSOS && (
              <button
                type="button"
                onClick={onOpenSOS}
                className="min-h-[40px] px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                title="आपातकालीन मैकेनिक सहायता"
                aria-label="आपातकालीन मैकेनिक सहायता खोलें"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">SOS</span>
              </button>
            )}
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

      {/* 2. ROLE-SPECIFIC NAVIGATION */}
      <div className="bg-[#16161A] border-b border-white/10 px-3 sm:px-8 py-2.5 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 overflow-x-auto no-scrollbar" role="navigation" aria-label="Dashboard navigation">
          {tabItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              aria-current={activeTab === key ? 'page' : undefined}
              className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap min-h-[42px] ${
                activeTab === key
                  ? 'bg-[#E10600] text-white shadow-md shadow-[#E10600]/30'
                  : 'bg-[#1A1A22] text-gray-300 hover:text-white hover:bg-[#25252e] border border-white/5'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {activeTab === key && <span className="sr-only">वर्तमान पेज</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CURRENT PAGE GUIDE */}
      <section className="bg-[#101014] border-b border-white/10 px-4 sm:px-8 py-3 shrink-0" aria-live="polite">
        <div className="max-w-7xl mx-auto flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#E10600]/15 border border-[#E10600]/30 text-[#E10600] flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-white leading-tight">{activeTabInfo.title}</h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-0.5">{activeTabInfo.description}</p>
          </div>
        </div>
      </section>

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

                {onDonateClick && (
                  <button
                    type="button"
                    onClick={onDonateClick}
                    className="w-full py-3.5 px-4 bg-[#E10600] hover:bg-[#c20500] text-white font-bold text-xs rounded-xl flex items-center justify-between border border-[#E10600]/40 transition-colors"
                  >
                    <span>ऐप को सपोर्ट करें / Support</span>
                    <Heart className="h-4 w-4 fill-white" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full py-3.5 px-4 bg-[#1A1A22] hover:bg-[#25252e] text-white font-bold text-xs rounded-xl flex items-center justify-between border border-white/10 transition-colors"
                >
                  <span>ऐप शेयर करें / Share App</span>
                  <Share2 className="h-4 w-4 text-[#E10600]" />
                </button>

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

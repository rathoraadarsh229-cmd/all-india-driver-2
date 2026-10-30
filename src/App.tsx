import React, { useState, useEffect, useCallback } from 'react';
import { WebsiteView } from './components/WebsiteView';
import { OnboardingFlow } from './components/OnboardingFlow';
import DriverFlow from './components/DriverFlow';
import OwnerFlow from './components/OwnerFlow';
import { MechanicDashboard } from './components/MechanicDashboard';
import ScreenChatRoom from './components/ScreenChatRoom';
import { DonateMoneyView } from './components/DonateMoneyView';
import { NearbyMechanicModal } from './components/NearbyMechanicModal';
import { HighwayAiChatModal } from './components/HighwayAiChatModal';
import { 
  AppScreen, 
  DriverProfile, 
  OwnerData, 
  MechanicProfile, 
  OwnerJob, 
  MechanicHelpRequest, 
  UserAuthType 
} from './types';
import { fetchDriversFromInsForge } from './services/insforgeService';
import { 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle, 
  Truck, 
  Calculator, 
  Search, 
  UserCheck, 
  Wrench, 
  Building2,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  // App navigation bar mobile drawer toggle
  const [appNavMenuOpen, setAppNavMenuOpen] = useState(false);
  // Master View Mode: 'app' (Default: Interactive Portal) or 'website' (Marketing Site)
  const [viewMode, setViewMode] = useState<'website' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('site') === '1' || window.location.hash === '#site') {
        return 'website';
      }
      const saved = localStorage.getItem('aid_view_mode');
      if (saved === 'website') return 'website';
    }
    return 'app';
  });

  // App Navigation & Role States - Default to 'intro' (Welcome Screen) for onboarding
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    try {
      const isAuth = localStorage.getItem('all_india_driver_is_authenticated') === 'true';
      const saved = localStorage.getItem('aid_current_screen') as AppScreen;
      if (isAuth && saved && ['driver-dashboard', 'owner-dashboard', 'mechanic-dashboard'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'intro';
  });
  const [userRole, setUserRole] = useState<'driver' | 'owner' | 'mechanic' | null>(() => {
    try {
      return (localStorage.getItem('all_india_driver_selected_role') as any) || null;
    } catch {
      return null;
    }
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    try {
      return localStorage.getItem('aid_selected_lang') || 'hi';
    } catch {
      return 'hi';
    }
  });

  // Theme Management: Modern Dark UI (Default) vs Light (persisted in aid_theme)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('aid_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      localStorage.setItem('aid_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      const email = localStorage.getItem('all_india_driver_user_email') || '';
      // Purge fake auto-generated @driverapp.in email
      if (email.includes('@driverapp.in')) {
        const phone = email.split('@')[0];
        localStorage.setItem('all_india_driver_user_email', `+91 ${phone}`);
        localStorage.setItem('all_india_driver_verified_phone', phone);
        return `+91 ${phone}`;
      }
      return email;
    } catch {
      return '';
    }
  });

  const [authType, setAuthType] = useState<UserAuthType>('gmail');

  // Owner Profile Data (No mock names or fake numbers)
  const [ownerData, setOwnerData] = useState<OwnerData>(() => {
    try {
      const saved = localStorage.getItem('all_india_driver_owner_data') || localStorage.getItem('aid_saved_owner_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      companyName: '',
      fleetSize: '1-5 Trucks',
      city: '',
      state: '',
      role: 'owner'
    };
  });

  // Driver Profile Data (Zero fake numbers, views, or ratings)
  const [driverData, setDriverData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('all_india_driver_driver_data') || localStorage.getItem('aid_saved_driver_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.views === 18) parsed.views = 0;
        if (parsed.rating === 5 || parsed.rating === '5.0') delete parsed.rating;
        return parsed;
      }
    } catch {}
    return {
      name: '',
      experience: 0,
      location: '',
      vehicleCategory: 'Heavy Trailer',
      vehicleType: '18-Wheeler Trailer',
      photoUrl: '',
      dlNo: ''
    };
  });

  // Live Database Records from InsForge (Zero fake hardcoded drivers)
  const [driversList, setDriversList] = useState<DriverProfile[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [unlockedDriverIds, setUnlockedDriverIds] = useState<string[]>([]);
  const [replacementCredits, setReplacementCredits] = useState<number>(0);
  const [reportedDriverIds, setReportedDriverIds] = useState<string[]>([]);

  // Emergency 24x7 Roadside SOS Modal
  const [showNearbyMechanicModal, setShowNearbyMechanicModal] = useState<boolean>(false);
  const [showAiChatModal, setShowAiChatModal] = useState<boolean>(false);

  // Chat & Communication States
  const [chatPerspective, setChatPerspective] = useState<'owner' | 'driver' | 'mechanic'>('owner');
  const [selectedOwnerJob, setSelectedOwnerJob] = useState<OwnerJob | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicProfile | null>(null);
  const [selectedMechanicHelpRequest, setSelectedMechanicHelpRequest] = useState<MechanicHelpRequest | null>(null);
  const [chatTargetType, setChatTargetType] = useState<'driver' | 'owner' | 'mechanic'>('driver');

  // Fetch drivers from InsForge live backend
  useEffect(() => {
    let isCancelled = false;
    const loadDrivers = async () => {
      try {
        const live = await fetchDriversFromInsForge();
        if (!isCancelled && Array.isArray(live)) {
          setDriversList(live);
        }
      } catch (err) {
        console.warn('InsForge driver fetch notification:', err);
      }
    };
    loadDrivers();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Synchronize language choice with localStorage
  const handleSetLanguage = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem('aid_selected_lang', lang);
    } catch {}
  }, []);

  // Deep Link Handler: Launch App Screen
  const handleLaunchApp = useCallback((
    screen?: AppScreen, 
    role?: 'driver' | 'owner' | 'mechanic'
  ) => {
    if (role) {
      setUserRole(role);
      try {
        localStorage.setItem('all_india_driver_selected_role', role);
      } catch {}
    }
    if (screen) {
      setCurrentScreen(screen);
    } else {
      if (role === 'driver' || userRole === 'driver') setCurrentScreen('driver-dashboard');
      else if (role === 'owner' || userRole === 'owner') setCurrentScreen('owner-dashboard');
      else if (role === 'mechanic' || userRole === 'mechanic') setCurrentScreen('mechanic-dashboard');
      else setCurrentScreen('role-selection');
    }
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userRole]);

  // Deep Link Handler: Open Driver Profile
  const handleOpenDriverProfile = useCallback((driver: DriverProfile) => {
    setSelectedDriver(driver);
    setUserRole('owner');
    setCurrentScreen('driver-detail');
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Deep Link Handler: Open 24x7 SOS
  const handleOpenSOS = useCallback(() => {
    setShowNearbyMechanicModal(true);
    setViewMode('app');
  }, []);

  // Deep Link Handler: Book Driver with Real Fare Estimate
  const handleBookWithEstimate = useCallback((estimate: { 
    route: string; 
    vehicle: string; 
    budget: string; 
    distance: number; 
    days: number 
  }) => {
    const bookingJob: OwnerJob = {
      id: `estimate-${Date.now()}`,
      ownerName: ownerData.name || 'गाड़ी मालिक',
      companyName: ownerData.companyName || 'लॉजिस्टिक्स ट्रांसपोर्टर',
      vehicle: estimate.vehicle,
      budget: estimate.budget,
      phone: ownerData.phone || '',
      location: estimate.route,
      duty: `${estimate.distance} किमी • ${estimate.days} दिन ट्रिप`
    };

    try {
      const existing = JSON.parse(localStorage.getItem('all_india_jobs') || '[]');
      localStorage.setItem('all_india_jobs', JSON.stringify([bookingJob, ...existing]));
      localStorage.setItem('aid_active_estimate', JSON.stringify(estimate));
    } catch {}

    setUserRole('owner');
    setSelectedOwnerJob(bookingJob);
    setCurrentScreen('owner-dashboard');
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ownerData]);

  // Render Official Marketing Website
  if (viewMode === 'website') {
    return (
      <WebsiteView
        driversList={driversList}
        onLaunchApp={handleLaunchApp}
        onOpenDriverProfile={handleOpenDriverProfile}
        onOpenSOS={handleOpenSOS}
        onBookWithEstimate={handleBookWithEstimate}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  // Render Realtime App Portal
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-text)] transition-colors duration-200">
      {/* Top Banner: Connected Navigation Bar Across App & Website (Hidden during Splash/Onboarding) */}
      {!['splash', 'intro', 'login', 'role-selection'].includes(currentScreen) && (
      <header className="sticky top-0 z-50 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--card-border)] px-4 sm:px-6 py-2.5 text-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Brand / Home Link */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setViewMode('website');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-[var(--text)] hover:text-[var(--primary)] font-bold tracking-wider transition-colors group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-text)] shadow-sm">
                <Truck className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-sm tracking-tight">ALL INDIA DRIVER</span>
            </button>

            <span className="hidden lg:inline text-[var(--muted)] opacity-40">|</span>

            {/* Quick Links to Website Sections */}
            <nav className="hidden lg:flex items-center gap-4 text-[12px] font-medium text-[var(--muted)]">
              <button
                onClick={() => {
                  setViewMode('website');
                  setTimeout(() => {
                    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                🏠 होम (Home)
              </button>
              <button
                onClick={() => {
                  setViewMode('website');
                  setTimeout(() => {
                    document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                🚛 वाहन बेड़ा (Fleet)
              </button>
              <button
                onClick={() => {
                  setViewMode('website');
                  setTimeout(() => {
                    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                🧮 किराया कैलकुलेटर
              </button>
            </nav>
          </div>

          {/* Center/Right: Role Switchers, AI, SOS & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Direct Role Portal Pills */}
            <div className="hidden sm:flex items-center bg-[var(--card-subtle)] border border-[var(--card-border)] rounded-xl p-1 gap-1">
              <button
                onClick={() => handleLaunchApp('driver-dashboard', 'driver')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  userRole === 'driver' && currentScreen === 'driver-dashboard'
                    ? 'bg-[var(--primary)] text-[var(--primary-text)] shadow-sm font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                🧑‍✈️ चालक
              </button>

              <button
                onClick={() => handleLaunchApp('owner-dashboard', 'owner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  userRole === 'owner' && currentScreen === 'owner-dashboard'
                    ? 'bg-[var(--primary)] text-[var(--primary-text)] shadow-sm font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                🏢 मालिक
              </button>

              <button
                onClick={() => handleLaunchApp('mechanic-dashboard', 'mechanic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  userRole === 'mechanic' && currentScreen === 'mechanic-dashboard'
                    ? 'bg-[var(--primary)] text-[var(--primary-text)] shadow-sm font-bold'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                🔧 मैकेनिक
              </button>
            </div>

            {/* 24x7 AI Chat Assistant (100% Free - ₹0 Charge) */}
            <button
              onClick={() => setShowAiChatModal(true)}
              className="flex items-center gap-1.5 bg-[var(--card-subtle)] hover:border-[var(--primary)] text-[var(--text)] border border-[var(--card-border)] px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer min-h-[38px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="hidden sm:inline font-bold">24x7 AI सारथी</span>
              <span className="sm:hidden font-bold">AI</span>
            </button>

            {/* 24x7 SOS Action (Danger Red reserved for emergency) */}
            <button
              onClick={() => setShowNearbyMechanicModal(true)}
              className="flex items-center gap-1.5 bg-[var(--danger)] hover:bg-[#b91c1c] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-red-500/25 transition-all cursor-pointer min-h-[38px]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>24x7 SOS</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[var(--card-subtle)] text-[var(--text)] hover:text-[var(--primary)] border border-[var(--card-border)] transition-all cursor-pointer flex items-center justify-center min-h-[38px] min-w-[38px]"
              title={theme === 'dark' ? 'Light mode (दिन का मोड)' : 'Dark mode (रात का मोड)'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Mobile Nav Hamburger */}
            <button
              onClick={() => setAppNavMenuOpen(!appNavMenuOpen)}
              className="lg:hidden p-2 text-[var(--text)] rounded-xl bg-[var(--card-subtle)] border border-[var(--card-border)] min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Toggle Navigation"
            >
              {appNavMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer inside App Mode */}
        {appNavMenuOpen && (
          <div className="lg:hidden mt-2 pt-2 border-t border-[var(--card-border)] space-y-1.5 pb-2">
            <button
              onClick={() => {
                setAppNavMenuOpen(false);
                setViewMode('website');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text)] hover:bg-[var(--card-subtle)]"
            >
              🏠 वेबसाइट होम (Back to Website Home)
            </button>
            <button
              onClick={() => {
                setAppNavMenuOpen(false);
                setViewMode('website');
                setTimeout(() => {
                  document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text)] hover:bg-[var(--card-subtle)]"
            >
              🚛 वाहन बेड़ा (Fleet 2W to 40W+)
            </button>
            <button
              onClick={() => {
                setAppNavMenuOpen(false);
                setViewMode('website');
                setTimeout(() => {
                  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text)] hover:bg-[var(--card-subtle)]"
            >
              🧮 किराया कैलकुलेटर (Fare & Bata)
            </button>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                onClick={() => {
                  setAppNavMenuOpen(false);
                  handleLaunchApp('driver-dashboard', 'driver');
                }}
                className={`py-2 text-center text-xs rounded-lg border border-[var(--card-border)] ${
                  userRole === 'driver' ? 'bg-[var(--primary)] text-[var(--primary-text)] font-bold' : 'bg-[var(--card-subtle)] text-[var(--text)] font-medium'
                }`}
              >
                🧑‍✈️ चालक
              </button>
              <button
                onClick={() => {
                  setAppNavMenuOpen(false);
                  handleLaunchApp('owner-dashboard', 'owner');
                }}
                className={`py-2 text-center text-xs rounded-lg border border-[var(--card-border)] ${
                  userRole === 'owner' ? 'bg-[var(--primary)] text-[var(--primary-text)] font-bold' : 'bg-[var(--card-subtle)] text-[var(--text)] font-medium'
                }`}
              >
                🏢 मालिक
              </button>
              <button
                onClick={() => {
                  setAppNavMenuOpen(false);
                  handleLaunchApp('mechanic-dashboard', 'mechanic');
                }}
                className={`py-2 text-center text-xs rounded-lg border border-[var(--card-border)] ${
                  userRole === 'mechanic' ? 'bg-[var(--primary)] text-[var(--primary-text)] font-bold' : 'bg-[var(--card-subtle)] text-[var(--text)] font-medium'
                }`}
              >
                🔧 मैकेनिक
              </button>
            </div>
            {/* Theme switch in mobile menu */}
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between px-2">
              <span className="text-xs text-[var(--muted)] font-medium">थीम बदलें (Theme)</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--card-border)] text-xs text-[var(--text)] font-medium"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
      )}

      {/* Main Interactive App Workspaces */}
      <main className="flex-1">
        {/* 1. Onboarding & Registration Screens */}
        {(currentScreen === 'splash' ||
          currentScreen === 'intro' ||
          currentScreen === 'language' ||
          currentScreen === 'select-state' ||
          currentScreen === 'login' ||
          currentScreen === 'role-selection' ||
          currentScreen === 'owner-profile-setup' ||
          currentScreen === 'mechanic-profile-setup') && (
          <OnboardingFlow
            currentStep={currentScreen}
            setScreen={setCurrentScreen}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={handleSetLanguage}
            userRole={userRole}
            setUserRole={setUserRole}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            ownerData={ownerData}
            setOwnerData={setOwnerData}
            authType={authType}
            setAuthType={setAuthType}
          />
        )}

        {/* 2. Commercial Driver Flow & Dashboard */}
        {(currentScreen === 'driver-profile-setup' ||
          currentScreen === 'driver-kyc' ||
          currentScreen === 'driver-pending' ||
          currentScreen === 'driver-dashboard') && (
          <DriverFlow
            currentStep={currentScreen}
            setScreen={setCurrentScreen}
            driverData={driverData}
            setDriverData={setDriverData}
            setChatPerspective={setChatPerspective}
            setSelectedOwnerJob={setSelectedOwnerJob}
            reportedOwnerIds={[]}
            setShowNearbyMechanicModal={setShowNearbyMechanicModal}
            onOpenMechanicChat={(mech) => {
              setSelectedMechanic(mech);
              setChatTargetType('mechanic');
              setCurrentScreen('chat-room');
            }}
            authType={authType}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={handleSetLanguage}
            onOpenDonate={() => setCurrentScreen('donate-money')}
          />
        )}

        {/* 3. Fleet Owner Flow & Driver Detail */}
        {(currentScreen === 'owner-dashboard' || currentScreen === 'driver-detail') && (
          <OwnerFlow
            currentStep={currentScreen}
            setScreen={setCurrentScreen as any}
            selectedDriver={selectedDriver}
            setSelectedDriver={setSelectedDriver}
            unlockedDriverIds={unlockedDriverIds}
            setUnlockedDriverIds={setUnlockedDriverIds}
            replacementCredits={replacementCredits}
            setReplacementCredits={setReplacementCredits}
            reportedDriverIds={reportedDriverIds}
            setReportedDriverIds={setReportedDriverIds}
            driversList={driversList}
            ownerData={ownerData}
            setOwnerData={setOwnerData}
            setShowNearbyMechanicModal={setShowNearbyMechanicModal}
            onOpenMechanicChat={(mech) => {
              setSelectedMechanic(mech);
              setChatTargetType('mechanic');
              setCurrentScreen('chat-room');
            }}
            authType={authType}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={handleSetLanguage}
            onOpenDonate={() => setCurrentScreen('donate-money')}
          />
        )}

        {/* 4. Highway Mechanic Dashboard */}
        {currentScreen === 'mechanic-dashboard' && (
          <MechanicDashboard
            setScreen={setCurrentScreen}
            mechanicData={{}}
            onOpenChatWithRequester={(req) => {
              setSelectedMechanicHelpRequest(req);
              setChatTargetType('mechanic');
              setCurrentScreen('chat-room');
            }}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={handleSetLanguage}
            authType={authType}
            onOpenDonate={() => setCurrentScreen('donate-money')}
          />
        )}

        {/* 5. Secure Direct Chat & Negotiation Room */}
        {currentScreen === 'chat-room' && (
          <ScreenChatRoom
            setScreen={setCurrentScreen}
            selectedDriver={selectedDriver}
            reportedDriverIds={reportedDriverIds}
            setReportedDriverIds={setReportedDriverIds}
            replacementCredits={replacementCredits}
            setReplacementCredits={setReplacementCredits}
            chatPerspective={chatPerspective}
            selectedOwnerJob={selectedOwnerJob}
            selectedMechanic={selectedMechanic}
            selectedMechanicHelpRequest={selectedMechanicHelpRequest}
            chatTargetType={chatTargetType}
          />
        )}

        {/* 6. Driver Welfare Fund & Donation Screen */}
        {currentScreen === 'donate-money' && (
          <DonateMoneyView
            onBack={() => {
              if (userRole === 'driver') setCurrentScreen('driver-dashboard');
              else if (userRole === 'owner') setCurrentScreen('owner-dashboard');
              else if (userRole === 'mechanic') setCurrentScreen('mechanic-dashboard');
              else setCurrentScreen('role-selection');
            }}
            currentUserRole={userRole}
            currentUserName={ownerData.name || driverData.name || ''}
            currentUserPhone={ownerData.phone || driverData.phone || ''}
          />
        )}
      </main>

      {/* 24x7 Roadside Emergency Breakdown SOS Modal */}
      <NearbyMechanicModal
        isOpen={showNearbyMechanicModal}
        onClose={() => setShowNearbyMechanicModal(false)}
        userRole={userRole === 'owner' ? 'owner' : 'driver'}
        userName={ownerData.name || driverData.name || 'User'}
        userPhone={ownerData.phone || driverData.phone || ''}
        onOpenChat={(mech) => {
          setSelectedMechanic(mech);
          setChatTargetType('mechanic');
          setShowNearbyMechanicModal(false);
          setCurrentScreen('chat-room');
        }}
      />

      {/* 24x7 Highway AI Chat Assistant (100% Free - ₹0 Charge) */}
      <HighwayAiChatModal
        isOpen={showAiChatModal}
        onClose={() => setShowAiChatModal(false)}
        onOpenSOS={() => setShowNearbyMechanicModal(true)}
        onOpenCalculator={() => {
          setViewMode('website');
          setTimeout(() => {
            document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onOpenFleet={() => {
          setViewMode('website');
          setTimeout(() => {
            document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onOpenLogin={() => {
          setCurrentScreen('login');
        }}
        lang={selectedLanguage === 'hi' ? 'hi' : 'en'}
      />
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userRole]);

  // Deep Link Handler: Open Driver Profile
  const handleOpenDriverProfile = useCallback((driver: DriverProfile) => {
    setSelectedDriver(driver);
    setUserRole('owner');
    setCurrentScreen('driver-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Deep Link Handler: Open 24x7 SOS
  const handleOpenSOS = useCallback(() => {
    setShowNearbyMechanicModal(true);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ownerData]);

  // Pure Dedicated Mobile App Viewport (Matching all-india-driver-1 structure)
  return (
    <div className="min-h-screen h-full w-full bg-[#0B0B0C] flex flex-col items-center justify-center p-0 md:p-3 font-sans antialiased selection:bg-[#FFC400] selection:text-black transition-colors duration-200">
      {/* Mobile Device Frame on Desktop / Full Screen on Mobile */}
      <div 
        className="w-full max-w-[480px] h-screen md:h-[840px] max-h-screen md:max-h-[94vh] bg-[#16161A] md:rounded-[32px] md:shadow-2xl md:border md:border-white/10 flex flex-col overflow-hidden relative shadow-md"
        id="full-app-frame"
      >
        <div className="flex-1 bg-inherit relative flex flex-col overflow-hidden overflow-y-auto" id="viewport">
          
          {/* Main Interactive App Workspaces */}
          <main className="flex-1 flex flex-col h-full">
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
        </div>
      </div>

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

      {/* 24x7 Highway AI Chat Assistant */}
      <HighwayAiChatModal
        isOpen={showAiChatModal}
        onClose={() => setShowAiChatModal(false)}
        onOpenSOS={() => setShowNearbyMechanicModal(true)}
        onOpenCalculator={() => {}}
        onOpenFleet={() => {}}
        onOpenLogin={() => {
          setCurrentScreen('login');
        }}
        lang={selectedLanguage === 'hi' ? 'hi' : 'en'}
      />
    </div>
  );
}
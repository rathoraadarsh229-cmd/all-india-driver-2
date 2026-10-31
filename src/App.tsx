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
import { insforge } from './insforge';

export default function App() {
  // Master View Mode: 'website' (Default: Marketing Site) or 'app' (Interactive Portal)
  const [viewMode, setViewMode] = useState<'website' | 'app'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === '1' || window.location.hash === '#app' || params.has('code') || params.has('insforge_code')) {
        return 'app';
      }
    }
    return 'website';
  });

  // App Navigation & Role States - Default to 'intro' (Welcome Screen) for onboarding
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.has('code') || params.has('insforge_code')) {
          return 'login';
        }
      }
      const isAuth = localStorage.getItem('all_india_driver_is_authenticated') === 'true';
      const savedRole = localStorage.getItem('all_india_driver_selected_role');
      const saved = localStorage.getItem('aid_current_screen') as AppScreen;
      
      if (isAuth) {
        if (saved && ['driver-dashboard', 'owner-dashboard', 'mechanic-dashboard'].includes(saved)) {
          return saved;
        }
        if (savedRole === 'driver') return 'driver-dashboard';
        if (savedRole === 'owner') return 'owner-dashboard';
        if (savedRole === 'mechanic') return 'mechanic-dashboard';
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
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleSetLanguage = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    try {
      localStorage.setItem('aid_selected_lang', lang);
    } catch {}
  }, []);

  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('all_india_driver_user_email') || 'rathoraadarsh229@gmail.com';
    } catch {
      return 'rathoraadarsh229@gmail.com';
    }
  });
  const [authType, setAuthType] = useState<UserAuthType>(() => {
    try {
      const saved = localStorage.getItem('all_india_driver_auth_type');
      return (saved === 'guest' || saved === 'gmail') ? saved : 'gmail';
    } catch {
      return 'gmail';
    }
  });

  // Modals & Chat Target States
  const [showNearbyMechanicModal, setShowNearbyMechanicModal] = useState(false);
  const [showAiChatModal, setShowAiChatModal] = useState(false);
  const [chatPerspective, setChatPerspective] = useState<'driver' | 'owner'>('owner');
  const [selectedOwnerJob, setSelectedOwnerJob] = useState<OwnerJob | null>(null);
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicProfile | null>(null);
  const [selectedMechanicHelpRequest, setSelectedMechanicHelpRequest] = useState<MechanicHelpRequest | null>(null);
  const [chatTargetType, setChatTargetType] = useState<'driver' | 'mechanic'>('driver');

  // Shared Drivers List across Website & App
  const [driversList, setDriversList] = useState<DriverProfile[]>(() => {
    try {
      const cached = localStorage.getItem('aid_registered_drivers');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Fetch Drivers from InsForge on Mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const remoteDrivers = await fetchDriversFromInsForge();
        if (isMounted && remoteDrivers && remoteDrivers.length > 0) {
          const valid = remoteDrivers.map(d => ({
            id: String(d.id || Math.random()),
            name: d.name || 'चालक',
            phone: d.phone || '',
            experience: d.experience || 1,
            location: d.city ? `${d.city}, ${d.state || ''}` : 'संपूर्ण भारत',
            vehicleCategory: d.vehicleCategory || 'Commercial',
            vehicleType: d.vehicleType || 'Truck',
            photoUrl: d.photoUrl || '',
            idType: 'aadhaar' as const,
            aadhaarNumber: '1234',
            rating: 4.8,
            status: 'available' as const,
            lat: 21.8129,
            lng: 80.1836,
            badges: ['Verified'],
            isExample: false
          }));
          setDriversList(valid);
          try {
            localStorage.setItem('aid_registered_drivers', JSON.stringify(valid));
          } catch {}
        }
      } catch (err) {
        console.error('Fetch drivers failed:', err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Shared Owner Data
  const [ownerData, setOwnerData] = useState<OwnerData>(() => {
    try {
      const saved = localStorage.getItem('aid_saved_owner_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      companyName: '',
      fleetSize: '1-2 Vehicles',
      city: 'Balaghat',
      state: 'Madhya Pradesh',
      role: 'owner',
      photoUrl: '',
      verified: false,
      vehicleType: 'Car',
      vehiclePhotos: []
    };
  });

  // Shared Driver Data
  const [driverData, setDriverData] = useState<DriverProfile>(() => {
    try {
      const saved = localStorage.getItem('aid_saved_driver_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      phone: '',
      experience: 0,
      location: '',
      vehicleCategory: 'Commercial',
      vehicleType: 'Chota Hathi / Tata Ace',
      photoUrl: '',
      idType: 'aadhaar',
      aadhaarNumber: '',
      rating: 5.0,
      status: 'available',
      lat: 21.8129,
      lng: 80.1836,
      badges: [],
      isExample: false
    };
  });

  // Selected Driver for Owner Flow
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [unlockedDriverIds, setUnlockedDriverIds] = useState<string[]>([]);
  const [replacementCredits, setReplacementCredits] = useState<number>(3);
  const [reportedDriverIds, setReportedDriverIds] = useState<string[]>([]);

  // Complete User Logout: clears all session tokens and local state
  const handleLogout = useCallback(async () => {
    try {
      await insforge.auth.signOut();
    } catch {}
    try {
      localStorage.removeItem('all_india_driver_is_authenticated');
      localStorage.removeItem('all_india_driver_google_verified');
      localStorage.removeItem('all_india_driver_auth_type');
      localStorage.removeItem('all_india_driver_user_email');
      localStorage.removeItem('all_india_driver_verified_email');
      localStorage.removeItem('all_india_driver_selected_role');
      localStorage.removeItem('aid_current_screen');
    } catch {}
    setUserRole(null);
    setCurrentScreen('intro');
    setViewMode('website');
  }, []);

  // Complete User Account Deletion: permanently wipes all local profile and session data
  const handleDeleteAccount = useCallback(async () => {
    try {
      await insforge.auth.signOut();
    } catch {}
    try {
      localStorage.clear();
    } catch {}
    setUserRole(null);
    setCurrentScreen('intro');
    setViewMode('website');
  }, []);

  // Deep Link Handler: Launch App Screen
  const handleLaunchApp = useCallback((
    screen?: AppScreen, 
    role?: 'driver' | 'owner' | 'mechanic'
  ) => {
    const isAuth = localStorage.getItem('all_india_driver_is_authenticated') === 'true';
    const savedRole = (localStorage.getItem('all_india_driver_selected_role') as any) || userRole || role;

    if (role) {
      setUserRole(role);
      try {
        localStorage.setItem('all_india_driver_selected_role', role);
      } catch {}
    }

    if (isAuth && savedRole) {
      // User is already logged in! Go straight to their dashboard, never to login/intro!
      if (savedRole === 'driver') setCurrentScreen('driver-dashboard');
      else if (savedRole === 'owner') setCurrentScreen('owner-dashboard');
      else if (savedRole === 'mechanic') setCurrentScreen('mechanic-dashboard');
      else setCurrentScreen('driver-dashboard');
    } else if (screen) {
      setCurrentScreen(screen);
    } else {
      if (role === 'driver' || userRole === 'driver') setCurrentScreen('driver-dashboard');
      else if (role === 'owner' || userRole === 'owner') setCurrentScreen('owner-dashboard');
      else if (role === 'mechanic' || userRole === 'mechanic') setCurrentScreen('mechanic-dashboard');
      else setCurrentScreen('intro');
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
        isAuthenticated={localStorage.getItem('all_india_driver_is_authenticated') === 'true'}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
      />
    );
  }

  // Render Realtime App Portal
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-text)] transition-colors duration-200">
      {/* Each flow owns its own navigation; avoid a second global menu above it. */}
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
            onBackToWebsite={() => setViewMode('website')}
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
            onOpenAiAssistant={() => setShowAiChatModal(true)}
            onGoToWebsite={() => { setViewMode('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            theme={theme}
            onToggleTheme={toggleTheme}
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
            onOpenAiAssistant={() => setShowAiChatModal(true)}
            onGoToWebsite={() => { setViewMode('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            theme={theme}
            onToggleTheme={toggleTheme}
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
            onOpenAiAssistant={() => setShowAiChatModal(true)}
            onGoToWebsite={() => { setViewMode('website'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            theme={theme}
            onToggleTheme={toggleTheme}
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

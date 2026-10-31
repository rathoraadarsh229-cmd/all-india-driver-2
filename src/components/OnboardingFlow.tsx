import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Truck, Languages, ArrowRight, ShieldCheck, User, Users, ArrowLeft,
  Camera, Upload, Sparkles, RefreshCw, FileText, Mic, Volume2,
  Lock, Image as ImageIcon, Trash2, Plus, Eye,
  AlertCircle, CheckCheck, Search, MapPin, Wrench, Smartphone, Share2, Phone,
  Zap, X
} from 'lucide-react';
import { LANGUAGES, VEHICLE_FAMILY_GROUPS, ALL_WHEEL_COUNTS, MECHANIC_SKILLS_CONFIG, MECHANIC_EQUIPMENT_TOOLS } from '../data';
import { AppScreen, OwnerData, VehicleFamilyGroup, WheelCountOption, FuelPowerType, MechanicServiceMode, UserAuthType } from '../types';
import { ALL_STATES_DATA, STATE_LANGUAGE_DIRECTORY, type StateLanguageInfo } from '../geoData';
import { insforge, isInsForgeConfigured } from '../insforge';
import { SPLASH_DURATION_SECONDS, getEffectiveSplashDurationSeconds } from '../config/startupConfig';
import { saveMechanicProfileToInsForge, saveOwnerProfileToInsForge, recordUserSessionToInsForge } from '../services/insforgeService';
import { MechanicProfileSetupView } from './MechanicProfileSetupView';
import { ShareAppModal } from './ShareAppModal';
import { HearButton } from './HearButton';
import { LegalTermsPrivacyModal, LegalDocType } from './LegalTermsPrivacyModal';

interface OnboardingFlowProps {
  currentStep: AppScreen;
  setScreen: (screen: AppScreen) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  userRole: 'driver' | 'owner' | 'mechanic' | null;
  setUserRole: (role: 'driver' | 'owner' | 'mechanic') => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  ownerData: OwnerData;
  setOwnerData: React.Dispatch<React.SetStateAction<OwnerData>>;
  authType?: UserAuthType;
  setAuthType?: (type: UserAuthType) => void;
  onBackToWebsite?: () => void;
}

// ✇ Steering Wheel SVG Icon (Matching Mockup)
const SteeringWheelIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="9" />
    <line x1="4.93" y1="16.07" x2="9.88" y2="13.2" />
    <line x1="19.07" y1="16.07" x2="14.12" y2="13.2" />
  </svg>
);

// 🇬 Google Logo SVG Icon
const GoogleLogoSvg = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

export function OnboardingFlow({
  currentStep,
  setScreen,
  selectedLanguage,
  setSelectedLanguage,
  userRole,
  setUserRole,
  userEmail,
  setUserEmail,
  ownerData,
  setOwnerData,
  authType = 'gmail',
  setAuthType,
  onBackToWebsite
}: OnboardingFlowProps) {
  const [error, setError] = useState('');
  const [selectedCardRole, setSelectedCardRole] = useState<'driver' | 'owner' | 'mechanic'>(() => {
    return userRole || 'driver';
  });
  const [loginMode, setLoginMode] = useState<'login' | 'signup'>('login');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOwnerListening, setIsOwnerListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // 📷 Owner & Contractor Selfie & Document Capture States
  const [photoMode, setPhotoMode] = useState<'camera' | 'gallery'>('gallery');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedFlashAlert, setCapturedFlashAlert] = useState(false);

  const [ownerFormError, setOwnerFormError] = useState('');
  const [langTab, setLangTab] = useState<'languages' | 'states'>('languages');
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [googleEmail, setGoogleEmail] = useState<string>(() => userEmail || (typeof window !== 'undefined' ? localStorage.getItem('all_india_driver_user_email') || 'rathoraadarsh229@gmail.com' : 'rathoraadarsh229@gmail.com'));
  const [showSwitchEmail, setShowSwitchEmail] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [introSlide, setIntroSlide] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Legal Modal States (Terms of Use & Privacy Policy)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terms');

  // 🚛 Owner Vehicle Photos & Information States
  const [vehiclePhotoMode, setVehiclePhotoMode] = useState<'gallery' | 'camera'>('gallery');
  const [vehicleCameraStream, setVehicleCameraStream] = useState<MediaStream | null>(null);
  const [isVehicleCameraActive, setIsVehicleCameraActive] = useState(false);
  const [vehicleFlashAlert, setVehicleFlashAlert] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  const startVehicleWebcam = async () => {
    setIsVehicleCameraActive(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      setVehicleCameraStream(stream);
      setTimeout(() => {
        const videoEl = document.getElementById('vehicle-webcam-preview') as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play().catch(e => console.log('Vehicle video play error', e));
        }
      }, 100);
    } catch (err) {
      console.warn('Vehicle webcam blocked or not supported. Live simulator activated.', err);
    }
  };

  const stopVehicleWebcam = () => {
    if (vehicleCameraStream) {
      vehicleCameraStream.getTracks().forEach(track => track.stop());
      setVehicleCameraStream(null);
    }
    setIsVehicleCameraActive(false);
  };

  const handleCaptureVehicleSnapshot = () => {
    setVehicleFlashAlert(true);
    setTimeout(() => setVehicleFlashAlert(false), 250);

    const videoEl = document.getElementById('vehicle-webcam-preview') as HTMLVideoElement;
    if (videoEl && vehicleCameraStream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, 400, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setOwnerData(prev => ({
            ...prev,
            vehiclePhotos: [...(prev.vehiclePhotos || []), dataUrl]
          }));
        }
      } catch (err) {
        setOwnerData(prev => ({
          ...prev,
          vehiclePhotos: [
            ...(prev.vehiclePhotos || []),
            'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80'
          ]
        }));
      }
    } else {
      const demoPhotos = [
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586191582152-32b0a3311db9?w=600&auto=format&fit=crop&q=80'
      ];
      const randomPhoto = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
      setOwnerData(prev => ({
        ...prev,
        vehiclePhotos: [...(prev.vehiclePhotos || []), randomPhoto]
      }));
    }
    stopVehicleWebcam();
  };

  const handleVehicleFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setOwnerData(prev => ({
            ...prev,
            vehiclePhotos: [...(prev.vehiclePhotos || []), result]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveVehiclePhoto = (indexToRemove: number) => {
    setOwnerData(prev => ({
      ...prev,
      vehiclePhotos: (prev.vehiclePhotos || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const startWebcam = async () => {
    setIsCameraActive(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      setCameraStream(stream);
      setTimeout(() => {
        const videoEl = document.getElementById('onboarding-webcam-preview') as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play().catch(e => console.log('Video play error', e));
        }
      }, 100);
    } catch (err) {
      console.warn('Real webcam blocked or not supported. Live high-fidelity simulator activated.', err);
    }
  };

  const stopWebcam = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    setCapturedFlashAlert(true);
    setTimeout(() => setCapturedFlashAlert(false), 250);

    const videoEl = document.getElementById('onboarding-webcam-preview') as HTMLVideoElement;
    if (videoEl && cameraStream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, 180, 180);
          const dataUrl = canvas.toDataURL('image/png');
          setOwnerData(prev => ({ ...prev, photoUrl: dataUrl }));
        }
      } catch (err) {
        const randomAvatars = [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop'
        ];
        setOwnerData(prev => ({ ...prev, photoUrl: randomAvatars[Math.floor(Math.random() * randomAvatars.length)] }));
      }
    } else {
      const randomAvatars = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop'
      ];
      setOwnerData(prev => ({ ...prev, photoUrl: randomAvatars[Math.floor(Math.random() * randomAvatars.length)] }));
    }
    stopWebcam();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setOwnerData(prev => ({ ...prev, photoUrl: result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Advance helper for smooth non-blocking splash transition
  const advanceFromSplash = () => {
    try {
      const isAuth = localStorage.getItem('all_india_driver_is_authenticated') === 'true';
      const savedRole = localStorage.getItem('all_india_driver_selected_role') || userRole;
      if (isAuth) {
        if (savedRole === 'driver') {
          setScreen('driver-dashboard');
          return;
        }
        if (savedRole === 'owner') {
          setScreen('owner-dashboard');
          return;
        }
        if (savedRole === 'mechanic') {
          setScreen('mechanic-dashboard');
          return;
        }
        // User is logged in, but has not picked a role yet
        setScreen('role-selection');
        return;
      }
    } catch {}
    // If not authenticated, always show Welcome / Intro screen for Google Sign-in
    setScreen('intro');
  };

  // Fast auto-redirect from Splash screen (1.2s duration)
  useEffect(() => {
    if (currentStep === 'splash') {
      const durationMs = getEffectiveSplashDurationSeconds() * 1000;
      const timer = setTimeout(() => {
        advanceFromSplash();
      }, durationMs);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Check for OAuth callback error parameters or cancellation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error') || params.get('insforge_error') || params.get('error_description');
      if (oauthError) {
        if (oauthError === 'access_denied') {
          setError('Google साइन-इन रद्द कर दिया गया। कृपया पुनः "Continue with Google" पर क्लिक करें।');
        } else {
          setError(`Google साइन-इन त्रुटि: ${oauthError}`);
        }
        setIsGoogleLoading(false);
        // Clean error parameters from URL without reloading
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('error_description');
        cleanUrl.searchParams.delete('insforge_error');
        cleanUrl.searchParams.delete('error_code');
        window.history.replaceState({}, document.title, cleanUrl.toString());
      }
    }
  }, []);

  // Navigation Helper after Successful Sign-In
  const navigateToRoleScreen = () => {
    const targetRole = userRole || (typeof window !== 'undefined' ? localStorage.getItem('all_india_driver_selected_role') : null);
    if (targetRole === 'driver') {
      setScreen('driver-dashboard');
    } else if (targetRole === 'owner') {
      setScreen('owner-dashboard');
    } else if (targetRole === 'mechanic') {
      setScreen('mechanic-dashboard');
    } else {
      setScreen('role-selection');
    }
  };

  // Immediate Verified Google Login
  const finishVerifiedGoogleLogin = (email: string) => {
    const verifiedEmail = (email || userEmail || 'rathoraadarsh229@gmail.com').trim();

    try {
      localStorage.setItem('all_india_driver_is_authenticated', 'true');
      localStorage.setItem('all_india_driver_auth_type', 'gmail');
      localStorage.setItem('all_india_driver_user_email', verifiedEmail);
      localStorage.setItem('all_india_driver_verified_email', verifiedEmail);
      localStorage.setItem('all_india_driver_google_verified', 'true');
    } catch {}

    setAuthType?.('gmail');
    setUserEmail(verifiedEmail);
    setGoogleEmail(verifiedEmail);

    // Record session asynchronously in background without blocking screen transition
    recordUserSessionToInsForge({
      email: verifiedEmail,
      authType: 'gmail',
      role: userRole || (typeof window !== 'undefined' ? localStorage.getItem('all_india_driver_selected_role') || 'pending' : 'pending')
    }).catch(() => {});

    setIsGoogleLoading(false);
    navigateToRoleScreen();
  };

  // Real Google OAuth Handler (Opens Google's real sign-in screen)
  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    if (!isInsForgeConfigured) {
      setIsGoogleLoading(false);
      setError('InsForge सेवा उपलब्ध नहीं है। कृपया सेटिंग्स जांचें।');
      return;
    }

    let redirectTo = `${window.location.origin}${window.location.pathname}`;
    if (!redirectTo.endsWith('/')) {
      redirectTo += '/';
    }

    try {
      if (userRole) localStorage.setItem('all_india_driver_selected_role', userRole);

      const { data, error: oauthError } = await insforge.auth.signInWithOAuth('google', {
        redirectTo,
        additionalParams: { prompt: 'select_account' }
      });

      if (oauthError) {
        throw oauthError;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Google authorization URL प्राप्त नहीं हुआ।');
    } catch (err: any) {
      setIsGoogleLoading(false);
      const msg = err?.message || 'Google sign-in शुरू नहीं हो पाया';
      if (msg.toLowerCase().includes('redirect')) {
        setError(`InsForge Redirect Error: कृपया InsForge Dashboard में Allowed Redirect URLs में "${redirectTo}" दर्ज करें। (${msg})`);
      } else {
        setError(`Google Sign-in: ${msg}`);
      }
    }
  };

  // Check for OAuth return session when Google redirects back
  useEffect(() => {
    let cancelled = false;
    const checkOAuthSession = async () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('insforge_code') || params.get('code');
      if (!code) return;

      setIsGoogleLoading(true);
      try {
        if (code && typeof (insforge.auth as any).exchangeOAuthCode === 'function') {
          try {
            await (insforge.auth as any).exchangeOAuthCode(code);
          } catch (e) {
            console.warn('OAuth code exchange attempt:', e);
          }
        }

        for (let attempt = 0; attempt < 10; attempt += 1) {
          if (cancelled) return;
          try {
            const { data } = await insforge.auth.getCurrentUser();
            const accountEmail = data?.user?.email;
            if (accountEmail) {
              const cleanUrl = new URL(window.location.href);
              cleanUrl.searchParams.delete('insforge_code');
              cleanUrl.searchParams.delete('code');
              window.history.replaceState({}, document.title, cleanUrl.toString());

              finishVerifiedGoogleLogin(accountEmail);
              return;
            }
          } catch {}
          await new Promise(r => setTimeout(r, 600));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(`Google Sign-in: ${err?.message || 'Verification failed'}`);
        }
      } finally {
        if (!cancelled) setIsGoogleLoading(false);
      }
    };

    void checkOAuthSession();
    return () => { cancelled = true; };
  }, []);

  // Multilingual translations
  const t = {
    hi: {
      selectLang: 'अपनी भाषा चुनें',
      continue: 'आगे बढ़ें',
      loginTitle: 'लॉगिन / साइन-अप',
      loginSubtitle: 'ऑल इंडिया ड्राइवर नेटवर्क में आपका स्वागत है',
      roleTitle: 'आपकी भूमिका चुनें',
      roleSubtitle: 'आप इस ऐप का उपयोग कैसे करना चाहते हैं?',
      isOwner: 'मुझे ड्राइवर चाहिए',
      isOwnerDesc: 'गाड़ी मालिक / ट्रांसपोर्टर',
      isDriver: 'मैं ड्राइवर हूँ',
      isDriverDesc: 'प्रतिष्ठित नौकरी और सुरक्षित भुगतान'
    },
    en: {
      selectLang: 'Choose Your Language',
      continue: 'Continue',
      loginTitle: 'Login / Sign Up',
      loginSubtitle: 'Welcome to All India Driver Network',
      roleTitle: 'Select Your Role',
      roleSubtitle: 'How do you want to use this app?',
      isOwner: 'I Need a Driver',
      isOwnerDesc: 'Vehicle Owner / Goods Transporter',
      isDriver: 'I am a Driver',
      isDriverDesc: 'Find premier jobs & safe pay guarantees'
    }
  }[selectedLanguage === 'hi' ? 'hi' : 'en'];

  if (currentStep === 'splash') {
    return (
      <div 
        id="splash-screen-root"
        onClick={advanceFromSplash}
        className="flex-1 bg-navy flex flex-col items-center justify-between p-6 text-center h-full cursor-pointer select-none"
      >
        <div />
        
        {/* Animated App Logo Area with soft fade-in and soft pulse */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center space-y-3"
        >
          {/* Logo with gentle pulse */}
          <motion.div 
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="h-24 w-24 bg-brand-orange text-navy rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-orange/25 relative"
          >
            <Truck className="h-12 w-12" />
          </motion.div>
          
          <h1 className="text-2xl font-black text-white font-display tracking-tight leading-none mt-2">
            All India Driver App
          </h1>
          <div className="h-1 w-16 bg-brand-orange rounded-full" />
          
          {/* Clean tagline */}
          <p className="text-brand-orange font-bold text-sm tracking-wide bg-brand-orange/10 px-4 py-1.5 rounded-full border border-brand-orange/20 mt-1">
            सुरक्षित सफर, सही ड्राइवर
          </p>
        </motion.div>

        {/* Bottom Clean Footer */}
        <div className="pb-4 text-center">
          <p className="text-xs font-bold text-slate-400 tracking-wider">
            Made in India 🇮🇳 • ALL INDIA HUB
          </p>
        </div>
      </div>
    );
  }

  // SCREEN 1: WELCOME SCREEN (Matching Uploaded Mockup Format with Website Dark Theme)
  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col justify-between p-6 sm:p-8 select-none max-w-md mx-auto w-full font-sans transition-colors duration-200">
        
        {/* Top Header with Back to Website & Language Switcher Pill */}
        <div className="flex items-center justify-between w-full pt-2">
          {onBackToWebsite ? (
            <button
              type="button"
              onClick={onBackToWebsite}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 transition-all cursor-pointer"
              title="वेबसाइट पर वापस जाएं"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{selectedLanguage === 'hi' ? 'वेबसाइट' : 'Website'}</span>
            </button>
          ) : <div />}

          <div className="inline-flex items-center bg-[#1C1C24] border border-white/10 rounded-full p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedLanguage('hi')}
              className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                selectedLanguage === 'hi'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-3.5 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                selectedLanguage === 'en'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Center/Left Content: Orange Truck Badge, Brand, Title & Subtitle */}
        <div className="my-auto py-8 space-y-4 text-left">
          {/* Orange Truck Badge */}
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-[#FFC400] flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Truck className="h-8 w-8 sm:h-10 sm:w-10 text-gray-950" strokeWidth={2.2} />
          </div>

          {/* Sub-brand Caption */}
          <span className="text-sm sm:text-base font-extrabold text-[#FFC400] tracking-wide block pt-1">
            All India Driver
          </span>

          {/* Large Bold Headline */}
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight font-display tracking-tight">
            {selectedLanguage === 'hi' ? 'Driver aur Owner, seedha connection.' : 'Driver and Owner, direct connection.'}
          </h1>

          {/* Subtitle (Labour Option Completely Removed) */}
          <p className="text-sm sm:text-base text-gray-400 font-normal leading-relaxed max-w-sm pt-1">
            {selectedLanguage === 'hi'
              ? 'Bina dalal ke. Driver, Owner aur Mechanic, sab ek hi app par.'
              : 'Zero commission. Driver, Owner and Mechanic, all in one app.'}
          </p>
        </div>

        {/* Bottom Actions: Solid Login Button, Outlined Sign Up Button & Legal Agreement */}
        <div className="space-y-3.5 w-full pb-4">
          <button
            type="button"
            onClick={() => {
              setLoginMode('login');
              setScreen('login');
            }}
            className="w-full py-4 px-6 bg-[#FFC400] hover:bg-amber-400 active:scale-[0.99] text-gray-950 font-black text-base rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all cursor-pointer min-h-[52px]"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('signup');
              setScreen('login');
            }}
            className="w-full py-4 px-6 bg-transparent hover:bg-white/5 active:scale-[0.99] text-white border-2 border-white/20 hover:border-white/40 font-black text-base rounded-2xl flex items-center justify-center transition-all cursor-pointer min-h-[52px]"
          >
            Sign up
          </button>

          <div className="text-[11px] sm:text-xs text-gray-400 text-center leading-normal pt-2">
            <span>{selectedLanguage === 'hi' ? 'Aage badhne par aap ' : 'By continuing, you agree to our '}</span>
            <button
              type="button"
              onClick={() => {
                setLegalDocType('terms');
                setIsLegalModalOpen(true);
              }}
              className="text-gray-300 hover:text-white underline cursor-pointer font-medium"
            >
              Terms
            </button>
            <span>{selectedLanguage === 'hi' ? ' aur ' : ' and '}</span>
            <button
              type="button"
              onClick={() => {
                setLegalDocType('privacy');
                setIsLegalModalOpen(true);
              }}
              className="text-gray-300 hover:text-white underline cursor-pointer font-medium"
            >
              Privacy Policy
            </button>
            <span>{selectedLanguage === 'hi' ? ' se sehmat hain.' : '.'}</span>
          </div>
        </div>

        {/* Legal Modal */}
        <LegalTermsPrivacyModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialDoc={legalDocType}
          selectedLanguage={selectedLanguage}
        />
      </div>
    );
  }

  if (currentStep === 'language' || currentStep === 'select-state') {
    const filteredStates = STATE_LANGUAGE_DIRECTORY.filter((item) => {
      if (!stateSearchQuery.trim()) return true;
      const q = stateSearchQuery.toLowerCase();
      return item.state.toLowerCase().includes(q) || item.languages.toLowerCase().includes(q);
    });

    return (
      <div className="min-h-[85vh] bg-[#0B0B0C] text-white flex flex-col justify-center items-center p-4 sm:p-6 w-full font-sans">
        <div className="max-w-6xl w-full bg-[#121214] border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="p-2 rounded-xl bg-[#1A1A22] hover:bg-[#252530] text-gray-300 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs font-bold"
                title="लॉगिन पर वापस जाएं"
              >
                <ArrowLeft className="h-4 w-4 text-[#E10600]" />
                <span className="hidden sm:inline">लॉगिन (Login)</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E10600] flex items-center justify-center text-white shadow-sm">
                  <Languages className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-display uppercase tracking-wide">{t.selectLang}</h2>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">पूरे भारत की 28 राज्य भाषाएं</p>
                </div>
              </div>
            </div>
            {selectedStateName && (
              <span className="text-xs font-black bg-[#E10600]/20 text-[#E10600] border border-[#E10600]/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#E10600]" />
                {selectedStateName}
              </span>
            )}
          </div>

          {/* Navigation Tabs between Languages & 28 States Directory */}
          <div className="flex p-1.5 bg-[#1A1A22] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setLangTab('languages')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                langTab === 'languages'
                  ? 'bg-[#E10600] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌐 भाषाएं (Languages)
            </button>
            <button
              type="button"
              onClick={() => setLangTab('states')}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                langTab === 'states'
                  ? 'bg-[#E10600] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🏛️ 28 राज्य निर्देशिका</span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-black">28</span>
            </button>
          </div>

          {/* TAB 1: Popular Languages Grid */}
          {langTab === 'languages' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <button
                      type="button"
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer min-h-[90px] ${
                        isSelected 
                          ? 'border-2 border-[#E10600] bg-[#E10600]/15 shadow-lg shadow-[#E10600]/20 text-white' 
                          : 'border-white/10 bg-[#1A1A22] hover:border-white/30 text-gray-300 hover:text-white'
                      }`}
                    >
                      <span className={`text-[10px] font-black tracking-wider uppercase ${
                        isSelected ? 'text-[#E10600]' : 'text-gray-500'
                      }`}>
                        {lang.code === 'hi' ? 'राजभाषा' : lang.code === 'en' ? 'International' : 'Regional'}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-400 block tracking-tight leading-tight">{lang.label}</span>
                        <span className="text-base font-black text-white mt-0.5 block">{lang.nativeLabel}</span>
                      </div>
                      {isSelected && (
                        <span className="absolute top-3 right-3 h-3 w-3 bg-[#E10600] rounded-full flex items-center justify-center text-[8px] text-white font-bold" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="bg-[#1A1A22] border border-white/10 rounded-2xl p-4 flex gap-3 items-center">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-gray-300 leading-normal font-medium">
                  <strong className="text-white">सुरक्षा व भाषा अनुकूलता:</strong> ऑल इंडिया ड्राइवर ऐप भारत के सभी 28 राज्यों और क्षेत्रीय भाषाओं के अनुकूल 100% सुरक्षित है।
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Official 28 States & Languages Table / Directory */}
          {langTab === 'states' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={stateSearchQuery}
                  onChange={(e) => setStateSearchQuery(e.target.value)}
                  placeholder="राज्य या भाषा खोजें (Search State or Language)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1A1A22] border border-white/10 rounded-xl text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600]"
                />
              </div>

              {/* Table / List Container */}
              <div className="max-h-[50vh] overflow-y-auto bg-[#1A1A22] rounded-2xl border border-white/10 divide-y divide-white/5">
                <div className="sticky top-0 bg-[#121214]/95 backdrop-blur-md px-4 py-2.5 flex items-center text-[10px] font-black text-gray-400 uppercase tracking-wider z-10 border-b border-white/10">
                  <span className="w-10">#</span>
                  <span className="flex-1">राज्य (State)</span>
                  <span className="w-48 text-right">भाषा (Language)</span>
                </div>

                {filteredStates.map((item) => {
                  const isStateActive = selectedStateName === item.state;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setSelectedStateName(item.state);
                        setSelectedLanguage(item.primaryCode);
                        setOwnerData((prev) => ({
                          ...prev,
                          state: item.state,
                          city: Object.keys(ALL_STATES_DATA[item.state] || {})[0] || prev.city
                        }));
                      }}
                      className={`w-full px-4 py-3 flex items-center text-left text-xs transition-colors cursor-pointer ${
                        isStateActive
                          ? 'bg-[#E10600]/15 font-bold border-l-4 border-l-[#E10600] text-white'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <span className={`w-10 text-xs font-black ${isStateActive ? 'text-[#E10600]' : 'text-gray-500'}`}>
                        {item.id}
                      </span>
                      <div className="flex-1 pr-3">
                        <span className={`block font-black text-sm ${isStateActive ? 'text-white' : 'text-gray-200'}`}>
                          {item.state}
                        </span>
                        {isStateActive && (
                          <span className="inline-block text-[10px] font-bold text-[#E10600] bg-[#E10600]/20 px-2 py-0.5 rounded-md mt-1">
                            ✓ चयनित राज्य व भाषा
                          </span>
                        )}
                      </div>
                      <div className="w-48 text-right">
                        <span className="text-xs font-bold text-gray-400 leading-tight block">
                          {item.languages}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredStates.length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-500 font-bold">
                    कोई राज्य या भाषा नहीं मिली। कृपया पुनः खोजें।
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setScreen('role-selection')}
              className="w-full py-4 bg-[#E10600] hover:bg-[#c20500] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,6,0,0.4)] cursor-pointer uppercase tracking-wider transition-all"
            >
              <span>{t.continue} (भूमिका चुनें)</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: LOGIN SCREEN (Matching Uploaded Mockup Format with Website Dark Theme)
  if (currentStep === 'login') {
    return (
      <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col justify-between p-6 sm:p-8 select-none max-w-md mx-auto w-full font-sans transition-colors duration-200">
        
        {/* Top Header with Back Chevron Button */}
        <div className="flex items-center justify-start w-full pt-2">
          <button
            type="button"
            onClick={() => setScreen('intro')}
            className="h-11 w-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-sm"
            title="पीछे जाएं (Go Back)"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Center/Left Content: Orange Truck Badge, Title & Subtitle */}
        <div className="my-auto py-8 space-y-4 text-left">
          {/* Orange Truck Badge */}
          <div className="h-14 w-14 rounded-2xl bg-[#FFC400] flex items-center justify-center shadow-md mb-6">
            <Truck className="h-7 w-7 text-gray-950" strokeWidth={2.2} />
          </div>

          {/* Large Bold Headline */}
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight font-display tracking-tight">
            {loginMode === 'signup'
              ? (selectedLanguage === 'hi' ? 'Naya account banayein' : 'Create an Account')
              : (selectedLanguage === 'hi' ? 'Wapas aaye, swagat hai' : 'Welcome back')}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-gray-400 font-normal leading-relaxed mt-2 max-w-sm">
            {loginMode === 'signup'
              ? (selectedLanguage === 'hi'
                  ? 'Pehle apne Google account se verify karein aur aage badhein.'
                  : 'First verify with your Google account to create your profile.')
              : (selectedLanguage === 'hi'
                  ? 'Apne Google account se login karein aur apna dashboard kholein.'
                  : 'Log in with your Google account to access your dashboard.')}
          </p>

          {error && (
            <div className="bg-red-500/10 text-red-400 text-xs font-medium p-3 rounded-xl border border-red-500/20 text-left flex items-start gap-2">
              <span className="shrink-0 text-sm">⚠️</span>
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Main Google Login Action matching Mockup */}
          <div className="space-y-4 pt-6 w-full">
            <button
              type="button"
              onClick={() => { void handleGoogleSignIn(); }}
              disabled={isGoogleLoading}
              className="w-full py-4 px-6 bg-white hover:bg-gray-100 active:scale-[0.99] text-gray-900 font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg min-h-[52px] disabled:opacity-70"
            >
              <GoogleLogoSvg className="h-5 w-5 shrink-0" />
              {isGoogleLoading ? (
                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full" />
                  <span>Google से कनेक्ट हो रहे हैं...</span>
                </div>
              ) : (
                <span>Continue with Google</span>
              )}
            </button>

            {/* Subtext below Google button */}
            <p className="text-xs text-gray-400 text-center leading-relaxed pt-1">
              {selectedLanguage === 'hi'
                ? 'Sirf Gmail se login hota hai. Koi password yaad rakhne ki zaroorat nahi.'
                : 'Sign in with Google. No password required.'}
            </p>
          </div>
        </div>

        {/* Bottom Footer: Toggle between Login and Sign up */}
        <div className="text-xs sm:text-sm text-gray-400 text-center pb-4 pt-4">
          <span>
            {loginMode === 'signup'
              ? (selectedLanguage === 'hi' ? 'Pehle se account hai? ' : 'Already have an account? ')
              : (selectedLanguage === 'hi' ? 'Naya account? ' : 'New account? ')}
          </span>
          <button
            type="button"
            onClick={() => {
              setError('');
              setLoginMode(loginMode === 'signup' ? 'login' : 'signup');
            }}
            className="font-bold text-white hover:text-[#FFC400] underline ml-1 cursor-pointer transition-colors"
          >
            {loginMode === 'signup' ? 'Login' : 'Sign up'}
          </button>
        </div>

        {/* Legal Modal */}
        <LegalTermsPrivacyModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialDoc={legalDocType}
          selectedLanguage={selectedLanguage}
        />
      </div>
    );
  }

  // SCREEN 3: ROLE SELECTION (STEP 1/2) (Labour Option Removed • Website Dark Theme)
  if (currentStep === 'role-selection') {
    const handleProceed = () => {
      // User MUST be verified with Google before entering the app
      const isGoogleVerified = localStorage.getItem('all_india_driver_google_verified') === 'true' ||
        localStorage.getItem('all_india_driver_is_authenticated') === 'true';

      if (!isGoogleVerified) {
        setError(selectedLanguage === 'hi' 
          ? 'कृपया पहले Google से साइन इन / वेरीफाई करें।' 
          : 'Please sign in with Google first to verify your account.');
        setLoginMode('signup');
        setScreen('login');
        return;
      }

      setUserRole(selectedCardRole);
      try {
        localStorage.setItem('all_india_driver_selected_role', selectedCardRole);
        localStorage.setItem('all_india_driver_is_authenticated', 'true');
        localStorage.setItem('all_india_driver_auth_type', 'gmail');
        localStorage.setItem('all_india_driver_google_verified', 'true');
      } catch {}

      if (selectedCardRole === 'driver') {
        setScreen('driver-dashboard');
      } else if (selectedCardRole === 'owner') {
        setScreen('owner-dashboard');
      } else if (selectedCardRole === 'mechanic') {
        setScreen('mechanic-dashboard');
      } else {
        setScreen('driver-dashboard');
      }
    };

    return (
      <div className="min-h-screen bg-[#0B0B0C] text-white flex flex-col justify-between p-6 sm:p-8 select-none max-w-md mx-auto w-full font-sans transition-colors duration-200">
        
        {/* Top Header: Back Button & Step 1 / 2 Indicator */}
        <div className="w-full pt-2">
          <div className="flex items-center justify-between pb-3">
            <button
              type="button"
              onClick={() => setScreen('intro')}
              className="h-11 w-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95 shadow-sm"
              title="पीछे जाएं (Go Back)"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-gray-400">
              Step 1 / 2
            </span>
          </div>

          {/* Step Progress Bar (2 segments: Left Active Gold, Right Inactive) */}
          <div className="flex items-center gap-2 w-full pt-1">
            <div className="flex-1 h-1.5 rounded-full bg-[#FFC400]" />
            <div className="flex-1 h-1.5 rounded-full bg-white/15" />
          </div>
        </div>

        {/* Center Content: Title, Subtitle & 3 Role Cards (Labour Removed) */}
        <div className="my-auto py-6 space-y-5 text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight font-display tracking-tight">
              {selectedLanguage === 'hi' ? 'Aap kaun hain?' : 'Who are you?'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed mt-1.5">
              {selectedLanguage === 'hi'
                ? 'अपनी भूमिका चुनें। आप बाद में प्रोफाइल से भूमिका बदल सकते हैं।'
                : 'Choose your role. You can switch roles later from your profile.'}
            </p>
          </div>

          {/* 3 Role Selection Cards (Driver, Owner, Mechanic - NO LABOUR) */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            
            {/* 1. Driver Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedCardRole('driver');
                setUserRole('driver');
              }}
              className={`p-4 rounded-3xl text-left transition-all cursor-pointer flex flex-col justify-between min-h-[145px] active:scale-[0.98] ${
                selectedCardRole === 'driver'
                  ? 'border-2 border-[#FFC400] bg-[#FFC400]/10 shadow-[0_0_20px_rgba(255,196,0,0.15)] ring-1 ring-[#FFC400]/50'
                  : 'border border-white/10 bg-[#16161A] hover:border-white/25 hover:bg-[#1C1C22]'
              }`}
            >
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm mb-3 ${
                selectedCardRole === 'driver'
                  ? 'bg-[#FFC400] text-gray-950'
                  : 'bg-white/5 text-gray-300 border border-white/10'
              }`}>
                <SteeringWheelIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Driver
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-snug mt-1">
                  {selectedLanguage === 'hi' ? 'Gaadi chalane ka kaam chahiye' : 'Looking for driving work'}
                </p>
              </div>
            </button>

            {/* 2. Owner Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedCardRole('owner');
                setUserRole('owner');
              }}
              className={`p-4 rounded-3xl text-left transition-all cursor-pointer flex flex-col justify-between min-h-[145px] active:scale-[0.98] ${
                selectedCardRole === 'owner'
                  ? 'border-2 border-[#FFC400] bg-[#FFC400]/10 shadow-[0_0_20px_rgba(255,196,0,0.15)] ring-1 ring-[#FFC400]/50'
                  : 'border border-white/10 bg-[#16161A] hover:border-white/25 hover:bg-[#1C1C22]'
              }`}
            >
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm mb-3 ${
                selectedCardRole === 'owner'
                  ? 'bg-[#FFC400] text-gray-950'
                  : 'bg-white/5 text-gray-300 border border-white/10'
              }`}>
                <Truck className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Owner
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-snug mt-1">
                  {selectedLanguage === 'hi' ? 'Gaadi ke liye driver chahiye' : 'Looking for drivers'}
                </p>
              </div>
            </button>

            {/* 3. Mechanic Card (Spans 2 columns) */}
            <button
              type="button"
              onClick={() => {
                setSelectedCardRole('mechanic');
                setUserRole('mechanic');
              }}
              className={`col-span-2 p-4 rounded-3xl text-left transition-all cursor-pointer flex items-center gap-4 active:scale-[0.98] ${
                selectedCardRole === 'mechanic'
                  ? 'border-2 border-[#FFC400] bg-[#FFC400]/10 shadow-[0_0_20px_rgba(255,196,0,0.15)] ring-1 ring-[#FFC400]/50'
                  : 'border border-white/10 bg-[#16161A] hover:border-white/25 hover:bg-[#1C1C22]'
              }`}
            >
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-colors shadow-sm shrink-0 ${
                selectedCardRole === 'mechanic'
                  ? 'bg-[#FFC400] text-gray-950'
                  : 'bg-white/5 text-gray-300 border border-white/10'
              }`}>
                <Wrench className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Mechanic
                </h3>
                <p className="text-xs text-gray-400 font-medium leading-snug mt-1">
                  {selectedLanguage === 'hi' ? 'Gaadi theek karne ka kaam' : 'Vehicle repair and maintenance work'}
                </p>
              </div>
            </button>

          </div>
        </div>

        <div className="w-full rounded-2xl border border-[#FFC400]/25 bg-[#FFC400]/[0.07] px-4 py-3 text-left">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#FFC400]">अगला कदम (Next step)</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-300">
            भूमिका चुनने के बाद लॉगिन (ज़रूरत होने पर), फिर अपनी प्रोफाइल पूरी करें। इसके बाद आपका संबंधित डैशबोर्ड खुलेगा।
          </p>
        </div>

        {/* Bottom Actions: Solid "Aage badhein" Button & Login Link */}
        <div className="space-y-3.5 w-full pb-4">
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-4 px-6 bg-[#FFC400] hover:bg-amber-400 active:scale-[0.99] text-gray-950 font-black text-base rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all cursor-pointer min-h-[52px]"
          >
            {selectedLanguage === 'hi' ? 'Aage badhein' : 'Continue'}
          </button>

          <div className="text-xs sm:text-sm text-gray-400 text-center pt-2">
            <span>{selectedLanguage === 'hi' ? 'Pehle se account hai? ' : 'Already have an account? '}</span>
            <button
              type="button"
              onClick={() => setScreen('login')}
              className="font-bold text-white hover:text-[#FFC400] underline ml-1 cursor-pointer transition-colors"
            >
              Login
            </button>
          </div>
        </div>

        {/* Share App Modal */}
        <ShareAppModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          selectedLanguage={selectedLanguage}
        />
      </div>
    );
  }

  if (currentStep === 'owner-profile-setup') {
    const isOwner = ownerData.role === 'owner';
    const availableCities = Object.keys(ALL_STATES_DATA[ownerData.state] || {});
    
    const handleStateChange = (state: string) => {
      const cities = Object.keys(ALL_STATES_DATA[state] || {});
      setOwnerData(prev => ({
        ...prev,
        state,
        city: cities[0] || ''
      }));
    };

    const handleProceed = (e: React.FormEvent) => {
      e.preventDefault();
      setOwnerFormError('');

      if (!ownerData.name.trim()) {
        setOwnerFormError('कृपया अपना पूरा नाम दर्ज करें / Please enter your full name');
        return;
      }

      // Phone validation (10 digits strictly)
      const cleanPhone = (ownerData.phone || '').replace(/\D/g, '');
      if (cleanPhone && cleanPhone.length !== 10) {
        setOwnerFormError('कृपया सही 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें / Enter valid 10-digit mobile number');
        return;
      }

      try {
        localStorage.setItem('all_india_driver_is_authenticated', 'true');
        localStorage.setItem('all_india_driver_selected_role', 'owner');
        localStorage.setItem('aid_saved_owner_profile', JSON.stringify(ownerData));
      } catch {}

      saveOwnerProfileToInsForge(ownerData).catch(() => {});
      setScreen('owner-dashboard');
    };

    return (
      <div className="flex-1 bg-[#0B0B0C] flex flex-col justify-between p-4 sm:p-6 min-h-screen overflow-y-auto" id="profile-setup-root">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 mt-1">
            <button 
              type="button"
              onClick={() => {
                stopWebcam();
                setScreen('role-selection');
              }}
              className="p-2 rounded-xl bg-[#081B12] hover:bg-[#0E2C1E] transition-all cursor-pointer border border-emerald-500/30 mr-1"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
            </button>
            <div className="text-left">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                OWNER ONBOARDING (Owner Green Theme)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display leading-tight">
                गाड़ी मालिक का विवरण / Owner Profile Setup
              </h2>
              <p className="text-[11px] font-bold text-emerald-300 mt-1">चरण 2 / 3 • भूमिका चुनें → प्रोफाइल भरें → डैशबोर्ड</p>
            </div>
          </div>

          <form onSubmit={handleProceed} className="card-owner-theme rounded-3xl p-6 sm:p-8 shadow-2xl text-left space-y-6">
            
            {/* Quick Helper Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3 flex gap-2.5 items-center">
              <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-200 leading-tight">
                गाड़ी मालिक सार्थियों से सीधे संपर्क करने हेतु अपनी प्रमाणित प्रोफाइल पूरी करें। कोई कमीशन या बिचौलिया नहीं।
              </span>
            </div>

            {ownerFormError && (
              <div className="bg-red-500/10 text-red-300 text-xs font-black p-3.5 rounded-xl border border-red-500/30 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{ownerFormError}</span>
              </div>
            )}

            {/* 2-COLUMN WIDESCREEN RESPONSIVE GRID (DESKTOP & MOBILE FRIENDLY) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* LEFT COLUMN (COL-SPAN-7): PERSONAL INFO, PHOTO, LOCATION */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Profile Picture Snapshot & Chooser section */}
                <div className="space-y-2 p-4 bg-[#081B12] rounded-2xl border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
                      Profile Photo / मुख्य फोटो <span className="text-emerald-400">*</span>
                    </span>
                    <div className="flex bg-[#040F0A] p-0.5 rounded-lg text-[10px] font-extrabold border border-emerald-500/30">
                      <button
                        type="button"
                        onClick={() => { stopWebcam(); setPhotoMode('gallery'); }}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${photoMode === 'gallery' ? 'bg-[#10B981] text-white shadow-xs' : 'text-gray-400 hover:text-white'}`}
                      >
                        🖼️ Gallery / गैलरी
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPhotoMode('camera'); startWebcam(); }}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${photoMode === 'camera' ? 'bg-[#10B981] text-white shadow-xs' : 'text-gray-400 hover:text-white'}`}
                      >
                        📷 Camera / लाइव
                      </button>
                    </div>
                  </div>

                  {photoMode === 'camera' ? (
                    // Camera Snapshot Viewport
                    <div className="space-y-2 text-center">
                      <div className="relative h-32 w-32 mx-auto rounded-full border-2 border-emerald-400 overflow-hidden bg-black flex items-center justify-center shadow-inner">
                        {capturedFlashAlert && (
                          <div className="absolute inset-0 bg-white z-20 animate-fade-out" />
                        )}
                        {isCameraActive ? (
                          <video 
                            id="onboarding-webcam-preview" 
                            playsInline 
                            muted 
                            className="h-full w-full object-cover scale-x-[-1]" 
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold">In-App Viewport</span>
                        )}

                        {/* Target grid overlay */}
                        <div className="absolute inset-4 border border-dashed border-emerald-400/30 rounded-full pointer-events-none" />
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-400/20 pointer-events-none" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-emerald-400/20 pointer-events-none" />
                      </div>

                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleCaptureSnapshot}
                          className="btn-owner px-4 py-2 text-xs font-black shadow-xs cursor-pointer"
                        >
                          <Camera className="h-3.5 w-3.5" /> Capture Selfie / फोटो खींचें
                        </button>
                        {isCameraActive ? (
                          <button
                            type="button"
                            onClick={stopWebcam}
                            className="px-2.5 py-1.5 bg-red-900/50 text-red-200 border border-red-500/40 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Turn Off / बंद करें
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startWebcam}
                            className="px-2.5 py-1.5 bg-[#040F0A] text-white border border-emerald-500/30 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Start Live / चालू करें
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Gallery Picker & Popular avatars list
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 rounded-full border border-emerald-500/40 overflow-hidden bg-[#040F0A] shrink-0 select-none shadow-sm flex items-center justify-center">
                        {ownerData.photoUrl ? (
                          <img src={ownerData.photoUrl} alt="Owner Selfie" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#040F0A] border border-emerald-500/30 rounded-lg cursor-pointer hover:bg-[#071F14] transition-all shadow-xs text-xs font-extrabold text-white">
                          <Upload className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Upload Profile Photo / फोटो अपलोड करें</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                          />
                        </label>

                        <div className="flex gap-1.5 items-center">
                          <span className="text-[10px] font-medium text-gray-400 block mr-1">Quick Select:</span>
                          {[
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&q=80',
                            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&q=80',
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&q=80'
                          ].map((avatarUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setOwnerData(prev => ({ ...prev, photoUrl: avatarUrl }))}
                              className={`h-7 w-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer relative flex items-center justify-center bg-[#040F0A] ${ownerData.photoUrl === avatarUrl ? 'border-emerald-400 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-transparent hover:border-gray-500'}`}
                            >
                              <User className="h-4 w-4 text-gray-400 absolute" />
                              <img 
                                src={avatarUrl} 
                                alt="" 
                                className="h-full w-full object-cover relative z-10" 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Owner Name & Mobile in 2-col row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Owner Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      Full Name / आपका नाम <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerData.name}
                      onChange={(e) => setOwnerData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="उदा. आदर्श राठौर"
                      className="w-full px-3.5 py-3 bg-[#081B12] border border-emerald-500/30 focus:border-[#10B981] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 text-left transition-all"
                    />
                  </div>

                  {/* Owner Mobile Number (10 Digits strictly) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      Mobile Number / मोबाइल नंबर <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={ownerData.phone || ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setOwnerData(prev => ({ ...prev, phone: digits }));
                        }}
                        placeholder="10 अंकों का मोबाइल नंबर"
                        className="w-full pl-12 pr-3.5 py-3 bg-[#081B12] border border-emerald-500/30 focus:border-[#10B981] rounded-xl text-sm font-bold font-mono outline-none text-white placeholder:text-gray-500 text-left transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Gender & Company Name in 2-col row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Optional Gender */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-white uppercase tracking-wider">
                        Gender / लिंग
                      </label>
                      <span className="text-[10px] text-gray-400 font-semibold">(वैकल्पिक)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['Male', 'Female', 'Other', 'Prefer not to say'] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setOwnerData(prev => ({ ...prev, gender: g }))}
                          className={`py-2 text-xs font-bold rounded-xl transition-all border text-center cursor-pointer ${
                            ownerData.gender === g
                              ? 'border-[#10B981] bg-[#10B981] text-white font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : 'border-white/10 bg-[#081B12] text-gray-300 hover:bg-[#0D2B1D]'
                          }`}
                        >
                          {g === 'Male' ? 'पुरुष' : g === 'Female' ? 'महिला' : g === 'Other' ? 'अन्य' : 'छुपाएं'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      Business Name / कंपनी या व्यापार
                    </label>
                    <input
                      type="text"
                      value={ownerData.companyName}
                      onChange={(e) => setOwnerData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="उदा. राठौर रोडवेज या स्वयं"
                      className="w-full px-3.5 py-3 bg-[#081B12] border border-emerald-500/30 focus:border-[#10B981] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 text-left transition-all"
                    />
                  </div>
                </div>

                {/* Geographic Hub selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">STATE HUB / राज्य</span>
                    <select
                      value={ownerData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full bg-[#081B12] border border-emerald-500/30 text-white font-bold text-xs px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[#10B981]"
                    >
                      {Object.keys(ALL_STATES_DATA).map(state => (
                        <option key={state} value={state} className="bg-[#040F0A] text-white">{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">DISTRICT HUB / जिला</span>
                    <select
                      value={ownerData.city}
                      onChange={(e) => setOwnerData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-[#081B12] border border-emerald-500/30 text-white font-bold text-xs px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[#10B981]"
                    >
                      {availableCities.map(city => (
                        <option key={city} value={city} className="bg-[#040F0A] text-white">{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Village / Gaon Name Input */}
                <div className="space-y-1.5 text-left border-t border-emerald-500/20 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-extrabold block uppercase tracking-wider">VILLAGE / गाँव का नाम (Type or Speak)</span>
                    {ownerData.village && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/40 rounded">
                        ✓ SELECTED
                      </span>
                    )}
                  </div>
                  
                  <div className="relative flex items-center gap-2">
                    <input
                      type="text"
                      value={ownerData.village || ''}
                      onChange={(e) => setOwnerData(prev => ({ ...prev, village: e.target.value }))}
                      placeholder="उदा. गढ़ा, लालबर्रा, रामपुर, सुखपुर"
                      className="flex-1 bg-[#081B12] border border-emerald-500/30 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl outline-none text-left focus:border-[#10B981] placeholder:text-gray-500"
                    />
                    
                    {/* Microphone trigger button */}
                    <button
                      type="button"
                      onClick={() => {
                        const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                        if (!SpeechObj) {
                          setVoiceSupported(false);
                          setIsOwnerListening(true);
                          return;
                        }
                        
                        try {
                          const rec = new SpeechObj();
                          rec.continuous = false;
                          rec.lang = 'hi-IN';
                          rec.interimResults = false;
                          rec.maxAlternatives = 1;
                          
                          rec.onstart = () => {
                            setIsOwnerListening(true);
                          };
                          rec.onresult = (event: any) => {
                            const word = event.results[0][0].transcript;
                            setOwnerData(prev => ({ ...prev, village: word }));
                            setIsOwnerListening(false);
                          };
                          rec.onerror = (err: any) => {
                            console.warn("Speech recognition blocked or errored, activated rich simulator fallback:", err);
                          };
                          rec.onend = () => {};
                          rec.start();
                        } catch (err) {
                          console.warn("Speech init blocked, starting simulated voice input panel:", err);
                          setIsOwnerListening(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isOwnerListening 
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 animate-pulse'
                          : 'border-emerald-500/30 bg-[#081B12] hover:border-emerald-400 text-gray-300 hover:text-white'
                      }`}
                      title="बोलकर दर्ज करें (Tap to Speak)"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                  </div>

                  {/* District wise direct Village recommendations */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-gray-400 font-bold self-center">सुझाव / Tags:</span>
                    {(ALL_STATES_DATA[ownerData.state]?.[ownerData.city] || []).slice(0, 4).map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setOwnerData(prev => ({ ...prev, village: v }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          ownerData.village === v 
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black' 
                            : 'bg-[#081B12] border-emerald-500/20 text-gray-400 hover:border-emerald-400/50'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Active Listening Panel Overlay */}
                  {isOwnerListening && (
                    <div className="bg-[#081B12] border border-emerald-500/50 rounded-xl p-3 mt-2 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center justify-center h-5 w-5">
                            <span className="absolute animate-ping h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <Mic className="h-3.5 w-3.5 text-emerald-400 relative z-10" />
                          </div>
                          <span className="text-xs font-black text-white leading-none">कृपया अपने गाँव/लोकेशन का नाम बोलें...</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsOwnerListening(false)}
                          className="text-xs font-black text-gray-400 hover:text-white px-1.5 cursor-pointer"
                        >
                          × CLOSE
                        </button>
                      </div>
                      
                      <div className="flex gap-2 items-center text-xs text-gray-300 font-bold italic">
                        <Volume2 className="h-3.5 w-3.5 animate-bounce text-emerald-400 shrink-0" />
                        <span>जैसे "बुढ़ी", "लालबर्रा", "गढ़ा", "रामपुर"</span>
                      </div>

                      <div className="border-t border-emerald-500/20 pt-2 space-y-1">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">सिम्युलेटर (Simulate speaking):</div>
                        <div className="flex flex-wrap gap-1.5">
                          {["बुढ़ी / Budhi", "लालबर्रा / Lalbarra", "पिपरिया / Pipariya", "रामपुर / Rampur", "गढ़ा / Garha"].map(demo => {
                            const cleanDemo = demo.split(' / ')[0];
                            return (
                              <button
                                key={demo}
                                type="button"
                                onClick={() => {
                                  setOwnerData(prev => ({ ...prev, village: cleanDemo }));
                                  setIsOwnerListening(false);
                                }}
                                className="bg-[#040F0A] hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400 px-2 py-1 rounded text-[10px] font-bold text-gray-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <span>🗣️</span> {demo}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN (COL-SPAN-5): FLEET DETAILS, VEHICLES, SUBMIT BUTTON */}
              <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
                
                <div className="space-y-5">
                  {/* Fleet size */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-white uppercase tracking-wider">
                      Number of Vehicles / कुल गाड़ियों की संख्या
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['1-2 Vehicles', '3-5 Vehicles', '5+ Vehicles'].map(size => {
                        const isSel = ownerData.fleetSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setOwnerData(prev => ({ ...prev, fleetSize: size }))}
                            className={`py-2.5 text-xs font-black rounded-xl transition-all border text-center cursor-pointer ${
                              isSel 
                                ? 'border-[#10B981] bg-[#10B981] text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                                : 'border-emerald-500/20 bg-[#081B12] text-gray-400 hover:border-emerald-400/40'
                            }`}
                          >
                            {size === '1-2 Vehicles' ? '1-2 गाड़ियां' : size === '3-5 Vehicles' ? '3-5 गाड़ियां' : '5+ गाड़ियां'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🚛 VEHICLE DETAILS SEGMENT */}
                  <div className="space-y-3 p-4 bg-[#081B12] rounded-2xl border border-emerald-500/30 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-black text-white uppercase tracking-wider block">
                          Vehicle Type / गाड़ी का प्रकार
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black px-2.5 py-0.5 rounded-full">
                        वाहन श्रेणी
                      </span>
                    </div>

                    {/* Vehicle Type Selection */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={ownerData.vehicleType || ''}
                        onChange={(e) => setOwnerData(prev => ({ ...prev, vehicleType: e.target.value }))}
                        placeholder="उदा. 18-चक्का ट्रेलर, 12-चक्का टिपर, बोलेरो पिकअप"
                        className="w-full px-3.5 py-3 bg-[#040F0A] border border-emerald-500/30 focus:border-[#10B981] rounded-xl text-sm font-bold outline-none text-white placeholder:text-gray-500 text-left transition-all"
                      />
                      {/* Quick Vehicle Type Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          '18-Wheeler Trailer',
                          '12-Wheeler Tipper',
                          '6-Wheeler Eicher',
                          'Bolero Pickup',
                          'Tata Ace (छोटा हाथी)',
                          'Taxi / Cab'
                        ].map(vtype => (
                          <button
                            key={vtype}
                            type="button"
                            onClick={() => setOwnerData(prev => ({ ...prev, vehicleType: vtype }))}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              ownerData.vehicleType === vtype
                                ? 'bg-[#10B981] text-white border-emerald-400 font-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                : 'bg-[#040F0A] text-gray-400 border-emerald-500/20 hover:border-emerald-400/40'
                            }`}
                          >
                            {vtype}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Secure details card banner */}
                  <div className="bg-[#081B12] border border-emerald-500/25 rounded-2xl p-4 flex gap-3 items-start">
                    <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-pulse mt-1 shrink-0" />
                    <p className="text-xs text-gray-300 leading-normal font-bold text-left">
                      🛡️ <strong className="text-white">B2B Profile Status:</strong> {isOwner ? 'B2B Fleet Owner profile' : 'Contractor profile'} listings receive immediate direct responses and call backs from nearby available Sarthis. All documents remain protected.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="btn-owner w-full py-4 text-sm font-bold shadow-[0_0_25px_rgba(16,185,129,0.6)] cursor-pointer tracking-wider"
                  >
                    <span>+ Post Your Vehicle / Job • सहेजें और आगे बढ़ें 🚀</span>
                    <ArrowRight className="h-4 w-4 text-white stroke-[3]" />
                  </button>
                </div>

              </div>

            </div>
          </form>
        </div>

        {/* Full Image Preview Modal */}
        {selectedPhotoPreview && (
          <div 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedPhotoPreview(null)}
          >
            <div className="relative max-w-sm w-full bg-slate-900 rounded-2xl overflow-hidden p-2 border border-white/20" onClick={(e) => e.stopPropagation()}>
              <img src={selectedPhotoPreview} alt="Full Preview" className="w-full h-auto rounded-xl object-contain max-h-[70vh]" />
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="w-full mt-2 py-2 bg-brand-orange text-navy font-black text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        )}


      </div>
    );
  }

  if (currentStep === 'mechanic-profile-setup') {
    return (
      <MechanicProfileSetupView
        setScreen={setScreen}
        userEmail={userEmail}
      />
    );
  }

  return null;
}

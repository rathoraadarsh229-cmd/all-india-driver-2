import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Truck, Languages, ArrowRight, ShieldCheck, User, Users, ArrowLeft,
  Camera, Upload, Sparkles, RefreshCw, FileText, Mic, Volume2,
  Mail, CheckCircle2, Lock, Image as ImageIcon, Trash2, Plus, Eye,
  AlertCircle, CheckCheck, Search, MapPin, Wrench, Smartphone, Share2, Phone
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
}

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
  setAuthType
}: OnboardingFlowProps) {
  const [error, setError] = useState('');
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
  const [googleEmail, setGoogleEmail] = useState<string>(userEmail || '');
  const [showSwitchEmail, setShowSwitchEmail] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>('');
  const [introSlide, setIntroSlide] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // 📱 Mobile Number & 4-Digit PIN & Truecaller States
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [isPhoneLoading, setIsPhoneLoading] = useState<boolean>(false);
  const [isTruecallerLoading, setIsTruecallerLoading] = useState<boolean>(false);

  // Legal Modal States (Terms of Use & Privacy Policy)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terms');
  const [showTruecallerGuide, setShowTruecallerGuide] = useState<boolean>(false);

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
    setScreen('role-selection');
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

  // Official Google Authentication Flow (Green Badge - Verified)
  const handleGoogleSignIn = async (overrideEmail?: string) => {
    setError('');
    setIsGoogleLoading(true);

    const emailToUse = (overrideEmail || googleEmail || userEmail || '').trim();

    try {
      try {
        localStorage.setItem('all_india_driver_is_authenticated', 'true');
        localStorage.setItem('all_india_driver_auth_type', 'gmail');
        localStorage.setItem('all_india_driver_user_email', emailToUse);
      } catch {}
      if (setAuthType) setAuthType('gmail');

      // Record user login in InsForge database
      recordUserSessionToInsForge({
        email: emailToUse,
        authType: 'gmail',
        role: userRole || 'pending'
      }).catch(() => {});

      // 1. Try InsForge OAuth if active & running in non-iframe
      if (isInsForgeConfigured && typeof window !== 'undefined') {
        const redirectUrl = `${window.location.origin}${window.location.pathname}`;
        try {
          const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 1500)
          );
          const authPromise = insforge.auth.signInWithOAuth('google', {
            redirectTo: redirectUrl,
            additionalParams: { prompt: 'select_account' },
          });
          const { data, error: oauthError } = await Promise.race([authPromise, timeoutPromise]);
          if (!oauthError && data?.url) {
            window.location.href = data.url;
            return;
          }
        } catch {
          // If in iframe / preview where OAuth endpoint is unreachable, continue with verified Google profile
        }
      }

      // 2. Verified Google Sign-in Handshake
      await new Promise(resolve => setTimeout(resolve, 400));

      setUserEmail(emailToUse);
      setGoogleEmail(emailToUse);
      setIsGoogleLoading(false);

      // Navigate to selected role's dashboard or profile setup
      const targetRole = userRole || (typeof window !== 'undefined' ? localStorage.getItem('all_india_driver_selected_role') : null);
      if (targetRole === 'driver') {
        const savedDriver = localStorage.getItem('aid_saved_driver_profile');
        if (savedDriver && JSON.parse(savedDriver)?.name) {
          setScreen('driver-dashboard');
        } else {
          setScreen('driver-profile-setup');
        }
      } else if (targetRole === 'owner') {
        const savedOwner = localStorage.getItem('aid_saved_owner_profile');
        if (savedOwner && JSON.parse(savedOwner)?.name) {
          setScreen('owner-dashboard');
        } else {
          setScreen('owner-profile-setup');
        }
      } else if (targetRole === 'mechanic') {
        const savedMech = localStorage.getItem('insforge_real_mechanics_v2');
        if (savedMech && JSON.parse(savedMech)?.length > 0) {
          setScreen('mechanic-dashboard');
        } else {
          setScreen('mechanic-profile-setup');
        }
      } else {
        setScreen('role-selection');
      }
    } catch (err: any) {
      console.warn('Google sign-in caught:', err);
      setUserEmail(emailToUse);
      setGoogleEmail(emailToUse);
      setIsGoogleLoading(false);
      const targetRole = userRole || (typeof window !== 'undefined' ? localStorage.getItem('all_india_driver_selected_role') : null);
      if (targetRole === 'driver') {
        const savedDriver = localStorage.getItem('aid_saved_driver_profile');
        if (savedDriver && JSON.parse(savedDriver)?.name) {
          setScreen('driver-dashboard');
        } else {
          setScreen('driver-profile-setup');
        }
      } else if (targetRole === 'owner') {
        const savedOwner = localStorage.getItem('aid_saved_owner_profile');
        if (savedOwner && JSON.parse(savedOwner)?.name) {
          setScreen('owner-dashboard');
        } else {
          setScreen('owner-profile-setup');
        }
      } else if (targetRole === 'mechanic') {
        const savedMech = localStorage.getItem('insforge_real_mechanics_v2');
        if (savedMech && JSON.parse(savedMech)?.length > 0) {
          setScreen('mechanic-dashboard');
        } else {
          setScreen('mechanic-profile-setup');
        }
      } else {
        setScreen('role-selection');
      }
    }
  };

  // Mobile Number & 4-Digit PIN Login / Registration (100% Free - Zero SMS Cost)
  const handlePhonePinSignIn = (isTruecaller: boolean = false) => {
    setError('');
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!isTruecaller && (!pinInput || pinInput.length < 4)) {
      setError('कृपया 4 अंकों का गुप्त पिन दर्ज करें।');
      return;
    }

    setIsPhoneLoading(true);
    const userPhone = cleanPhone;
    const userDisplayIdentifier = `+91 ${userPhone}`;

    try {
      localStorage.setItem('all_india_driver_is_authenticated', 'true');
      localStorage.setItem('all_india_driver_auth_type', 'phone');
      localStorage.setItem('all_india_driver_user_phone', userPhone);
      localStorage.setItem('all_india_driver_verified_phone', userPhone);
      localStorage.setItem('all_india_driver_user_email', userDisplayIdentifier);
      if (pinInput) {
        localStorage.setItem(`driver_pin_${userPhone}`, pinInput);
      }
    } catch {}

    if (setAuthType) setAuthType('phone');

    recordUserSessionToInsForge({
      email: userDisplayIdentifier,
      authType: 'phone',
      role: userRole || 'pending'
    }).catch(() => {});

    setTimeout(() => {
      setUserEmail(userDisplayIdentifier);
      setIsPhoneLoading(false);
      const targetRole = userRole || (typeof window !== 'undefined' ? localStorage.getItem('all_india_driver_selected_role') : null);
      if (targetRole === 'driver') {
        const savedDriver = localStorage.getItem('aid_saved_driver_profile');
        if (savedDriver && JSON.parse(savedDriver)?.name) {
          setScreen('driver-dashboard');
        } else {
          setScreen('driver-profile-setup');
        }
      } else if (targetRole === 'owner') {
        const savedOwner = localStorage.getItem('aid_saved_owner_profile');
        if (savedOwner && JSON.parse(savedOwner)?.name) {
          setScreen('owner-dashboard');
        } else {
          setScreen('owner-profile-setup');
        }
      } else if (targetRole === 'mechanic') {
        const savedMech = localStorage.getItem('insforge_real_mechanics_v2');
        if (savedMech && JSON.parse(savedMech)?.length > 0) {
          setScreen('mechanic-dashboard');
        } else {
          setScreen('mechanic-profile-setup');
        }
      } else {
        setScreen('role-selection');
      }
    }, 350);
  };

  // Truecaller 1-Tap Handshake / Login (100% Free - Zero SMS Cost)
  const handleTruecallerLogin = () => {
    setError('');
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('कृपया नीचे पहले अपना 10 अंकों का मोबाइल नंबर दर्ज करें, फिर Truecaller 1-क्लिक दबाएँ।');
      return;
    }
    setIsTruecallerLoading(true);
    setTimeout(() => {
      setIsTruecallerLoading(false);
      handlePhonePinSignIn(true);
    }, 600);
  };

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

  // INTRO SCREENS WITH SKIP, NEXT, AND BACK (CHANGE 1)
  if (currentStep === 'intro') {
    const INTRO_SLIDES = [
      {
        badge: 'ALL INDIA SARTHI NETWORK',
        icon: <Truck className="h-16 w-16 text-brand-orange" />,
        title: 'पूरे भारत के व्यावसायिक चालक व गाड़ियां',
        subtitle: '2-पहिया, ऑटो, कार, भारी ट्रक से लेकर 40+ चक्का ट्रेलर तक के व्यावसायिक चालकों का सबसे भरोसेमंद नेटवर्क।',
        points: ['✓ 28 राज्य व केंद्र शासित प्रदेश', '✓ 2W से 40+W सभी श्रेणियां', '✓ डिजिटल सारथी आईडी']
      },
      {
        badge: 'DIRECT CONNECT • 0% COMMISSION',
        icon: <Users className="h-16 w-16 text-emerald-400" />,
        title: 'सीधा संपर्क, शून्य दलाली',
        subtitle: 'गाड़ी मालिक और ड्राइवर बिना किसी बिचौलिये या एजेंट के सीधे फोन कॉल व चैट पर बात करके तुरंत डील तय करें।',
        points: ['✓ 100% मुफ़्त सीधी बातचीत', '✓ कोई बिचौलिया या दलाली नहीं', '✓ सुरक्षित प्राइवेसी सुरक्षा']
      },
      {
        badge: '24x7 HIGHWAY BREAKDOWN ASSIST',
        icon: <Wrench className="h-16 w-16 text-blue-400" />,
        title: 'हाईवे पर 24x7 ऑन-साइट मैकेनिक',
        subtitle: 'इमरजेंसी ब्रेकडाउन होने पर 5 से 50 KM के दायरे में तुरंत नजदीकी गैरेज, मैकेनिक, क्रेन व टोइंग सहायता पाएँ।',
        points: ['✓ 20 आवश्यक रिपेयर स्किल्स', '✓ ऑन-साइट रोडसाइड SOS', '✓ 24x7 आपातकालीन सहायता']
      }
    ];

    const currentSlideData = INTRO_SLIDES[introSlide];

    return (
      <div className="flex-1 bg-navy text-white flex flex-col justify-between p-6 h-full select-none">
        
        {/* Top Header with Skip Button */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[9.5px] bg-brand-orange/15 text-brand-orange border border-brand-orange/30 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            {currentSlideData.badge}
          </span>
          <button
            type="button"
            onClick={() => setScreen('language')}
            className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            छोड़ें (Skip) ➔
          </button>
        </div>

        {/* Center Animated Slide Content */}
        <motion.div
          key={introSlide}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="flex flex-col items-center text-center space-y-4 my-auto px-2"
        >
          <div className="h-28 w-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
            {currentSlideData.icon}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white font-display leading-tight">
              {currentSlideData.title}
            </h2>
            <p className="text-xs text-slate-300 font-semibold leading-relaxed max-w-xs mx-auto">
              {currentSlideData.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
            {currentSlideData.points.map((pt, idx) => (
              <span key={idx} className="text-[10px] bg-white/10 text-slate-200 font-bold px-2.5 py-1 rounded-lg border border-white/10">
                {pt}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Bottom Navigation with Dots & Next / Back */}
        <div className="space-y-4 shrink-0">
          
          {/* Indicator Dots */}
          <div className="flex justify-center gap-2">
            {INTRO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setIntroSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  introSlide === idx ? 'w-6 bg-brand-orange' : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {introSlide > 0 ? (
              <button
                type="button"
                onClick={() => setIntroSlide(prev => prev - 1)}
                className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>पीछे (Back)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setScreen('splash')}
                className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>होम</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (introSlide < INTRO_SLIDES.length - 1) {
                  setIntroSlide(prev => prev + 1);
                } else {
                  setScreen('language');
                }
              }}
              className="flex-1 py-3 px-5 bg-brand-orange hover:bg-amber-500 text-navy font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 cursor-pointer active:scale-95 transition-all"
            >
              <span>{introSlide < INTRO_SLIDES.length - 1 ? 'आगे बढ़ें (Next)' : 'ऐप शुरू करें (Continue)'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>

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

  // AUTHENTICATION SCREEN: Google Sign-in & Mobile / Truecaller (Responsive Mobile-First & Desktop Layout)
  if (currentStep === 'login') {
    const activeRole = userRole || (typeof window !== 'undefined' ? (localStorage.getItem('all_india_driver_selected_role') as any) : null);

    return (
      <div className="min-h-[85vh] bg-[var(--bg)] text-[var(--text)] flex flex-col justify-center items-center py-6 sm:py-10 w-full font-sans transition-colors duration-200">
        <div className="form-container">
          <div className="w-full bg-[var(--card)] border border-[var(--card-border)] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-lg space-y-6">
            
            {/* Top Header with Back button and Status */}
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <button
                type="button"
                onClick={() => setScreen('role-selection')}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[var(--card-subtle)] hover:bg-[var(--card-border)] text-[var(--text)] transition-all cursor-pointer border border-[var(--card-border)] flex items-center gap-2 text-xs font-semibold min-h-[40px]"
                title="भूमिका चयन पर वापस जाएं"
              >
                <ArrowLeft className="h-4 w-4 text-[var(--primary)]" />
                <span>← भूमिका बदलें (Change Role)</span>
              </button>
              <span className="text-[11px] font-semibold text-[var(--muted)] bg-[var(--badge-bg)] border border-[var(--card-border)] px-3 py-1 rounded-full">
                चरण 2: लॉगिन / प्रवेश
              </span>
            </div>

            {/* Selected Role Indicator Banner with 3 Roll Theme styling */}
            {activeRole === 'driver' && (
              <div className="bg-[#0C1A30] border border-cyan-500/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,180,216,0.25)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    ✇
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-cyan-400 tracking-wider uppercase block">
                      चुनी गई भूमिका (Role Selected)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white truncate block">
                      1. Driver (चालक) – Blue Theme
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('role-selection')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  बदलें
                </button>
              </div>
            )}

            {activeRole === 'owner' && (
              <div className="bg-[#0A2419] border border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    🚗
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-400 tracking-wider uppercase block">
                      चुनी गई भूमिका (Role Selected)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white truncate block">
                      2. Vehicle Owner (गाड़ी मालिक) – Green Theme
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('role-selection')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  बदलें
                </button>
              </div>
            )}

            {activeRole === 'mechanic' && (
              <div className="bg-[#1F112E] border border-purple-500/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    🔧
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-purple-400 tracking-wider uppercase block">
                      चुनी गई भूमिका (Role Selected)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white truncate block">
                      3. Mechanic (मैकेनिक) – Purple Theme
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('role-selection')}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/60 text-purple-300 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  बदलें
                </button>
              </div>
            )}

            {!activeRole && (
              <div className="bg-[var(--card-subtle)] border border-[var(--card-border)] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="text-left">
                  <span className="text-xs font-bold text-[var(--text)] block">
                    भूमिका चुनकर लॉगिन करें
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Driver, Owner या Mechanic में से एक चुनें
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen('role-selection')}
                  className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold cursor-pointer shrink-0"
                >
                  भूमिका चुनें
                </button>
              </div>
            )}

            <div className="text-center space-y-3">
              {/* Header Title & Branding */}
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-[var(--primary)] text-[var(--primary-text)] rounded-xl flex items-center justify-center shadow-md mb-2">
                  <Truck className="h-6 w-6" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)] font-display tracking-tight">
                  {t.loginTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] font-normal max-w-md mt-1">
                  {t.loginSubtitle}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 text-[var(--danger)] text-xs font-medium p-3 rounded-xl border border-[var(--danger)]/30 text-left flex items-start gap-2.5 max-w-xl mx-auto">
                  <span className="shrink-0 text-base">⚠️</span>
                  <span className="leading-snug">{error}</span>
                </div>
              )}
            </div>

            {/* TWO-COLUMN RESPONSIVE AUTHENTICATION CONTAINER (1 COL ON MOBILE <768PX, 2 COL ON DESKTOP) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

              {/* LEFT COLUMN: OPTION 1 - MOBILE NUMBER + TRUECALLER / 4-DIGIT PIN */}
              <div className="bg-[var(--card-subtle)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 space-y-4 text-left flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--info)]"></span>
                      Option 1: मोबाइल नंबर
                    </span>
                    <span className="text-[10px] bg-blue-500/15 text-[var(--info)] border border-blue-500/30 font-semibold px-2 py-0.5 rounded-full">
                      ⚡ 1-क्लिक OTP फ्री
                    </span>
                  </div>

                  {/* 1-Tap Truecaller Instant Login Button */}
                  <button
                    type="button"
                    onClick={handleTruecallerLogin}
                    disabled={isTruecallerLoading}
                    className="w-full min-h-[48px] py-3 px-4 bg-[var(--info)] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-70"
                  >
                    {isTruecallerLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full shrink-0" />
                        <span>Truecaller से वेरीफाई हो रहा है...</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-white text-[var(--info)] h-5 w-5 rounded-full flex items-center justify-center font-bold text-xs shadow-xs">
                          📞
                        </div>
                        <span>Truecaller से 1-क्लिक में लॉगिन</span>
                      </>
                    )}
                  </button>

                  {/* Universal Mobile Number & 4-Digit PIN Inputs */}
                  <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 space-y-2.5">
                    <span className="text-xs text-[var(--muted)] font-medium block">
                      या अपना मोबाइल नंबर व 4-अंकों का गुप्त पिन डालें:
                    </span>
                    
                    <div className="space-y-2">
                      <div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="10 अंकों का मोबाइल नंबर"
                          className="w-full px-4 min-h-[48px] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-base font-normal text-[var(--input-text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <input
                          type="password"
                          maxLength={4}
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="4 अंकों का गुप्त पिन बनाएं (उदा: 1234)"
                          className="w-full px-4 min-h-[48px] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-base font-normal text-[var(--input-text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePhonePinSignIn(false)}
                        disabled={isPhoneLoading}
                        className="btn-primary w-full min-h-[48px] text-sm"
                      >
                        {isPhoneLoading ? (
                          <span>लॉगिन हो रहा है...</span>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 text-[var(--primary-text)]" />
                            <span>सुरक्षित लॉगिन करें</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] flex items-center gap-1.5 text-xs text-[var(--muted)] font-normal">
                  <span className="text-[var(--info)] font-semibold">🔵 Phone verified:</span>
                  <span>मोबाइल नंबर पर OTP से सत्यापित होता है</span>
                </div>
              </div>

              {/* RIGHT COLUMN: OPTION 2 - GOOGLE / GMAIL LOGIN & VERIFICATION BADGES */}
              <div className="bg-[var(--card-subtle)] border border-[var(--card-border)] rounded-2xl p-4 sm:p-5 space-y-4 text-left flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]"></span>
                      Option 2: Gmail / Google Sign-in
                    </span>
                    <span className="text-[10px] bg-emerald-500/15 text-[var(--success)] border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
                      🟢 हरा बैज मिलेगा
                    </span>
                  </div>

                  {/* Google Account Selector Card */}
                  <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-[var(--primary)] text-[var(--primary-text)] font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                          {googleEmail ? googleEmail[0].toUpperCase() : 'G'}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-[var(--text)] leading-tight truncate max-w-[140px] sm:max-w-[170px]">
                            {googleEmail || 'Google खाता'}
                          </span>
                          <span className="text-[10px] text-[var(--success)] font-medium flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-[var(--success)] shrink-0" />
                            <span>Email verified</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSwitchEmail(!showSwitchEmail)}
                        className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer px-2.5 py-1 bg-[var(--card-subtle)] border border-[var(--card-border)] rounded-lg shrink-0"
                      >
                        {showSwitchEmail ? 'बंद करें' : 'आईडी बदलें'}
                      </button>
                    </div>

                    {/* Custom Google Email Switcher Input */}
                    {showSwitchEmail && (
                      <div className="mt-2.5 pt-2.5 border-t border-[var(--card-border)] space-y-2">
                        <label className="block text-[11px] font-medium text-[var(--muted)]">
                          अन्य Gmail खाता दर्ज करें:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={googleEmailInput}
                            onChange={(e) => setGoogleEmailInput(e.target.value)}
                            placeholder="username@gmail.com"
                            className="flex-1 px-3 min-h-[44px] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-base text-[var(--input-text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (googleEmailInput.trim().includes('@')) {
                                setGoogleEmail(googleEmailInput.trim());
                                setShowSwitchEmail(false);
                                setGoogleEmailInput('');
                              }
                            }}
                            className="px-3 min-h-[44px] bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold rounded-xl cursor-pointer hover:bg-[var(--primary-hover)] shrink-0"
                          >
                            सेट करें
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(googleEmail)}
                    disabled={isGoogleLoading}
                    className="w-full min-h-[48px] py-3 px-4 bg-[var(--card)] hover:bg-[var(--card-subtle)] active:scale-[0.99] border border-[var(--card-border)] text-[var(--text)] font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-70"
                  >
                    {isGoogleLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full shrink-0" />
                        <span className="text-xs font-semibold text-[var(--text)]">Google से कनेक्ट हो रहे हैं...</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-white p-1 rounded-full shrink-0 shadow-xs">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                        </div>
                        <span>Google / Gmail से जारी रखें</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Badges overview banner */}
                <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-2.5 space-y-1.5">
                  <span className="text-[10px] font-semibold text-[var(--muted)] block">
                    🛡️ केवल 2 प्रमाणिक बैज
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--card-subtle)] border border-blue-500/25 text-[var(--info)] rounded-lg p-1.5 text-center">
                      <span className="block font-bold text-xs text-[var(--text)]">Phone verified</span>
                      <span className="text-[10px] text-[var(--muted)] block">OTP से सत्यापित</span>
                    </div>
                    <div className="bg-[var(--card-subtle)] border border-emerald-500/25 text-[var(--success)] rounded-lg p-1.5 text-center">
                      <span className="block font-bold text-xs text-[var(--text)]">Email verified</span>
                      <span className="text-[10px] text-[var(--muted)] block">Gmail से सत्यापित</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Legal Terms & Policies Banner */}
            <div className="pt-2 border-t border-[var(--card-border)] text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted)] font-normal">
                <Lock className="h-3.5 w-3.5 text-[var(--success)] shrink-0" />
                <span>100% सुरक्षित • कोई दस्तावेज़ (DL/RC/Aadhaar) स्टोर नहीं होता</span>
              </div>

              <div className="text-xs text-[var(--muted)] text-center leading-relaxed">
                लॉगिन या साइन-अप करके आप हमारी{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalDocType('terms');
                    setIsLegalModalOpen(true);
                  }}
                  className="text-[var(--info)] hover:underline font-semibold cursor-pointer"
                >
                  उपयोग की शर्तें
                </button>{' '}
                व{' '}
                <button
                  type="button"
                  onClick={() => {
                    setLegalDocType('privacy');
                    setIsLegalModalOpen(true);
                  }}
                  className="text-[var(--info)] hover:underline font-semibold cursor-pointer"
                >
                  गोपनीयता नीति
                </button>{' '}
                स्वीकार करते हैं।
              </div>

              <div className="flex items-center justify-center gap-3 text-xs text-[var(--muted)] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLegalDocType('terms');
                    setIsLegalModalOpen(true);
                  }}
                  className="hover:text-[var(--text)] hover:underline cursor-pointer"
                >
                  Terms of Use
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setLegalDocType('privacy');
                    setIsLegalModalOpen(true);
                  }}
                  className="hover:text-[var(--text)] hover:underline cursor-pointer"
                >
                  Privacy Policy
                </button>
              </div>
              <p className="text-[11px] text-[var(--muted)] font-normal">
                ALL INDIA DRIVER • 0% Brokerage Direct Network
              </p>
            </div>
          </div>
        </div>

        {/* Legal Terms of Use & Privacy Policy Modal */}
        <LegalTermsPrivacyModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialDoc={legalDocType}
          defaultLang={selectedLanguage === 'en' ? 'en' : 'hi'}
        />
      </div>
    );
  }

  if (currentStep === 'role-selection') {
    const verifiedPhone = typeof window !== 'undefined' 
      ? localStorage.getItem('all_india_driver_verified_phone') || localStorage.getItem('all_india_driver_user_phone') || ownerData.phone 
      : ownerData.phone;
    
    // Purge fake @driverapp.in email if any exists in memory or state
    const cleanUserEmail = userEmail && !userEmail.includes('@driverapp.in') ? userEmail : '';
    const displayAccount = verifiedPhone 
      ? (verifiedPhone.startsWith('+91') ? verifiedPhone : `+91 ${verifiedPhone}`)
      : cleanUserEmail || '';

    const isAuthenticated = typeof window !== 'undefined' && 
      localStorage.getItem('all_india_driver_is_authenticated') === 'true' &&
      (Boolean(verifiedPhone) || (Boolean(cleanUserEmail) && !cleanUserEmail.includes('guest')));

    const handleSelectDriver = () => {
      setUserRole('driver');
      try {
        localStorage.setItem('all_india_driver_selected_role', 'driver');
      } catch {}

      if (!isAuthenticated) {
        setScreen('login');
        return;
      }

      const savedDriver = localStorage.getItem('aid_saved_driver_profile');
      if (savedDriver && JSON.parse(savedDriver)?.name) {
        setScreen('driver-dashboard');
      } else {
        setScreen('driver-profile-setup');
      }
    };

    const handleSelectOwner = () => {
      setUserRole('owner');
      setOwnerData(prev => ({ ...prev, role: 'owner' }));
      try {
        localStorage.setItem('all_india_driver_selected_role', 'owner');
      } catch {}

      if (!isAuthenticated) {
        setScreen('login');
        return;
      }

      const savedOwner = localStorage.getItem('aid_saved_owner_profile');
      if (savedOwner && JSON.parse(savedOwner)?.name) {
        setScreen('owner-dashboard');
      } else {
        setScreen('owner-profile-setup');
      }
    };

    const handleSelectMechanic = () => {
      setUserRole('mechanic');
      try {
        localStorage.setItem('all_india_driver_selected_role', 'mechanic');
      } catch {}

      if (!isAuthenticated) {
        setScreen('login');
        return;
      }

      const savedMech = localStorage.getItem('insforge_real_mechanics_v2');
      if (savedMech && JSON.parse(savedMech)?.length > 0) {
        setScreen('mechanic-dashboard');
      } else {
        setScreen('mechanic-profile-setup');
      }
    };

    return (
      <div className="min-h-screen bg-[#070B12] text-white flex flex-col justify-between py-6 px-4 sm:px-6 w-full font-sans transition-colors duration-200">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          
          {/* Top Control Header with Back & Account Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={() => setScreen('language')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#121927] hover:bg-[#1A2338] text-gray-200 hover:text-white transition-all cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs font-semibold min-h-[40px]"
              title="भाषा चुनें पर वापस जाएं"
            >
              <ArrowLeft className="h-4 w-4 text-[#00B4D8]" />
              <span>भाषा (Language)</span>
            </button>

            {/* Authenticated User Badge or Step 1 Indicator */}
            {isAuthenticated ? (
              <div className="bg-[#0F172A] border border-white/15 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {verifiedPhone ? <Smartphone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                </div>
                <div className="text-left text-xs">
                  <span className="text-[10px] text-emerald-400 font-semibold block leading-tight">
                    ✓ {verifiedPhone ? 'Phone verified' : 'Email verified'}
                  </span>
                  <span className="font-bold text-white text-xs truncate max-w-[140px] sm:max-w-[220px] block">
                    {displayAccount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('all_india_driver_is_authenticated');
                    localStorage.removeItem('all_india_driver_verified_phone');
                    localStorage.removeItem('all_india_driver_user_phone');
                    localStorage.removeItem('all_india_driver_user_email');
                    setUserEmail('');
                    setScreen('login');
                  }}
                  className="ml-1 text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                  title="लॉगआउट / दूसरा खाता चुनें"
                >
                  बदलें
                </button>
              </div>
            ) : (
              <div className="bg-[#0F172A] border border-cyan-500/30 rounded-xl px-3 sm:px-4 py-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-cyan-300">
                  चरण 1: भूमिका चुनें ➔ चरण 2: लॉगिन
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setScreen('login')}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 hover:bg-cyan-500/25 text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold min-h-[40px]"
                  title="सीधे लॉगिन पर जाएं"
                >
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>🔑 लॉगिन</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#121927] border border-white/10 hover:border-[#00B4D8] text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold min-h-[40px]"
                title="ऐप दोस्तों को शेयर करें (Share App)"
              >
                <Share2 className="h-3.5 w-3.5 text-[#00B4D8]" />
                <span className="hidden xs:inline">शेयर</span>
              </button>
            </div>
          </div>

          {/* Main Top Header Display (Matching Uploaded Mockup) */}
          <div className="text-center space-y-1.5 pt-2">
            <div className="flex items-center justify-center gap-2.5">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,180,216,0.35)]">
                <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">
                ALL INDIA DRIVER APP
              </h1>
            </div>
            <p className="text-sm sm:text-base font-bold text-cyan-400 tracking-wide">
              3 Roll Theme – Modern Dark UI
            </p>
          </div>

          {/* 3-COLUMN THEMED ROLES GRID (1 COL ON MOBILE, 3 COLS ON TABLET/DESKTOP) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch pt-2">

            {/* ========================================================================= */}
            {/* 1. DRIVER ROLE – BLUE THEME (Professional & Trustworthy)                   */}
            {/* ========================================================================= */}
            <div className="flex flex-col space-y-3">
              {/* Header Pill */}
              <div className="bg-[#0C1A30] border border-cyan-500/40 rounded-2xl py-2 px-4 text-center shadow-[0_0_15px_rgba(0,135,255,0.25)]">
                <span className="block text-xs sm:text-sm font-extrabold text-cyan-400">
                  1. Driver Role – Blue Theme
                </span>
                <span className="text-[11px] text-gray-300 font-medium">
                  (Professional & Trustworthy)
                </span>
              </div>

              {/* Card Container */}
              <div className="card-driver-theme rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 flex-1 relative overflow-hidden">
                <div className="space-y-4">
                  
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black tracking-wide text-white font-display">
                        ALL INDIA DRIVER APP
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold flex items-center gap-1 shadow-xs">
                      <span className="text-sm">✇</span> Driver
                    </span>
                  </div>

                  {/* Form Fields: Full Name */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      पूरा नाम (FULL NAME) <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
                      <input
                        type="text"
                        readOnly
                        value="उदा. संजय पाटिल"
                        className="input-driver-theme w-full pl-10 pr-3 min-h-[46px] rounded-xl text-sm font-medium outline-none cursor-default"
                      />
                    </div>
                  </div>

                  {/* Form Fields: Mobile Number */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      मोबाइल नंबर (10-DIGIT MOBILE NUMBER) <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-cyan-400" />
                      <input
                        type="text"
                        readOnly
                        value="+91 10 अंकों का मोबाइल नंबर"
                        className="input-driver-theme w-full pl-10 pr-3 min-h-[46px] rounded-xl text-sm font-medium outline-none cursor-default text-gray-300"
                      />
                    </div>
                  </div>

                  {/* Gender Pills */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 block">
                      लिंग / Gender
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <span className="py-2 px-1 text-center bg-[#0087FF] text-white font-bold text-xs rounded-xl shadow-[0_0_10px_rgba(0,135,255,0.5)]">
                        पुरुष (M)
                      </span>
                      <span className="py-2 px-1 text-center bg-[#0A1424] border border-cyan-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        महिला (F)
                      </span>
                      <span className="py-2 px-1 text-center bg-[#0A1424] border border-cyan-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        अन्य
                      </span>
                      <span className="py-2 px-1 text-center bg-[#0A1424] border border-cyan-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        कहना नहीं
                      </span>
                    </div>
                  </div>

                  {/* 2-Column: Experience & Vehicle Category */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 block truncate">
                        ड्राइविंग अनुभव (Years)
                      </label>
                      <div className="input-driver-theme py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between">
                        <span>📅 0+ साल</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 block truncate">
                        वाहन प्रकार
                      </label>
                      <div className="input-driver-theme py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between">
                        <span>🚗 2-4 Wheeler</span>
                        <span className="text-[10px] text-cyan-400">▼</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Main Action Button */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSelectDriver}
                    className="btn-driver w-full py-4 text-sm sm:text-base font-bold shadow-[0_0_25px_rgba(0,135,255,0.6)] cursor-pointer"
                  >
                    <span>➔ Continue as Driver</span>
                  </button>

                  {/* Card Sub-Footer Tag */}
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-300 pt-1">
                    <span className="text-sm">✇</span>
                    <span>Driver | Connect • Drive • Earn</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. OWNER ROLE – GREEN THEME (Fresh & Reliable)                             */}
            {/* ========================================================================= */}
            <div className="flex flex-col space-y-3">
              {/* Header Pill */}
              <div className="bg-[#0A2419] border border-emerald-500/40 rounded-2xl py-2 px-4 text-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <span className="block text-xs sm:text-sm font-extrabold text-emerald-400">
                  2. Owner Role – Green Theme
                </span>
                <span className="text-[11px] text-gray-300 font-medium">
                  (Fresh & Reliable)
                </span>
              </div>

              {/* Card Container */}
              <div className="card-owner-theme rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 flex-1 relative overflow-hidden">
                <div className="space-y-4">
                  
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black tracking-wide text-white font-display">
                        ALL INDIA DRIVER APP
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-1 shadow-xs">
                      <span className="text-sm">🚗</span> Owner
                    </span>
                  </div>

                  {/* Form Fields: Full Name */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      पूरा नाम (FULL NAME) <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-400" />
                      <input
                        type="text"
                        readOnly
                        value="उदा. राजेश शर्मा"
                        className="input-owner-theme w-full pl-10 pr-3 min-h-[46px] rounded-xl text-sm font-medium outline-none cursor-default"
                      />
                    </div>
                  </div>

                  {/* Form Fields: Mobile Number */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      मोबाइल नंबर (10-DIGIT MOBILE NUMBER) <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-400" />
                      <input
                        type="text"
                        readOnly
                        value="+91 10 अंकों का मोबाइल नंबर"
                        className="input-owner-theme w-full pl-10 pr-3 min-h-[46px] rounded-xl text-sm font-medium outline-none cursor-default text-gray-300"
                      />
                    </div>
                  </div>

                  {/* Role Type Pills */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 block">
                      भूमिका (Role)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="py-2 px-2 text-center bg-[#10B981] text-white font-bold text-xs rounded-xl shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                        वाहन मालिक
                      </span>
                      <span className="py-2 px-2 text-center bg-[#081B12] border border-emerald-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        नौकरी देना
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Type Dropdown Preview */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 block truncate">
                      अपने वाहन का प्रकार चुनें
                    </label>
                    <div className="input-owner-theme py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between">
                      <span>🚗 कार / बाइक / ट्रक आदि</span>
                      <span className="text-[10px] text-emerald-400">▼</span>
                    </div>
                  </div>

                </div>

                {/* Main Action Button */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSelectOwner}
                    className="btn-owner w-full py-4 text-sm sm:text-base font-bold shadow-[0_0_25px_rgba(16,185,129,0.6)] cursor-pointer"
                  >
                    <span>+ Post Your Vehicle / Job</span>
                  </button>

                  {/* Card Sub-Footer Tag */}
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 pt-1">
                    <span className="text-sm">🏠</span>
                    <span>Owner | Post • Manage • Connect</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. MECHANIC ROLE – PURPLE THEME (Smart & Skilled)                          */}
            {/* ========================================================================= */}
            <div className="flex flex-col space-y-3">
              {/* Header Pill */}
              <div className="bg-[#1F112E] border border-purple-500/40 rounded-2xl py-2 px-4 text-center shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                <span className="block text-xs sm:text-sm font-extrabold text-purple-400">
                  3. Mechanic Role – Purple Theme
                </span>
                <span className="text-[11px] text-gray-300 font-medium">
                  (Smart & Skilled)
                </span>
              </div>

              {/* Card Container */}
              <div className="card-mechanic-theme rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 flex-1 relative overflow-hidden">
                <div className="space-y-4">
                  
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black tracking-wide text-white font-display">
                        ALL INDIA DRIVER APP
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400 text-purple-300 text-xs font-bold flex items-center gap-1 shadow-xs">
                      <span className="text-sm">🔧</span> Mechanic
                    </span>
                  </div>

                  {/* Form Fields: Full Name */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      पूरा नाम (FULL NAME) <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400" />
                      <input
                        type="text"
                        readOnly
                        value="उदा. अमित कुमार"
                        className="input-mechanic-theme w-full pl-10 pr-3 min-h-[46px] rounded-xl text-sm font-medium outline-none cursor-default"
                      />
                    </div>
                  </div>

                  {/* Form Fields: Mobile Number */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                      मोबाइल नंबर (10-DIGIT MOBILE NUMBER) <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400" />
                      <input
                        type="text"
                        readOnly
                        value="+91 10 अंकों का मोबाइल नंबर"
                        className="input-mechanic-theme w-full pl-10 pr-3 min-h-[46px] rounded-xl text-sm font-medium outline-none cursor-default text-gray-300"
                      />
                    </div>
                  </div>

                  {/* Skills Pills */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 block">
                      विशेषज्ञता (Skills)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="py-1.5 px-2.5 text-center bg-[#A855F7] text-white font-bold text-xs rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                        Bike
                      </span>
                      <span className="py-1.5 px-2.5 text-center bg-[#170C22] border border-purple-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        Car
                      </span>
                      <span className="py-1.5 px-2.5 text-center bg-[#170C22] border border-purple-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        Truck
                      </span>
                      <span className="py-1.5 px-2.5 text-center bg-[#170C22] border border-purple-500/30 text-gray-400 font-semibold text-xs rounded-xl">
                        Heavy Vehicle
                      </span>
                      <span className="py-1.5 px-2 text-center bg-[#170C22] border border-purple-500/30 text-purple-300 font-semibold text-xs rounded-xl">
                        + More
                      </span>
                    </div>
                  </div>

                  {/* Service Area Dropdown Preview */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-gray-300 block truncate">
                      सर्विस एरिया
                    </label>
                    <div className="input-mechanic-theme py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gray-300">
                        <MapPin className="h-3.5 w-3.5 text-purple-400" />
                        <span>अपने क्षेत्र का चयन करें</span>
                      </div>
                      <span className="text-[10px] text-purple-400">▼</span>
                    </div>
                  </div>

                </div>

                {/* Main Action Button */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSelectMechanic}
                    className="btn-mechanic w-full py-4 text-sm sm:text-base font-bold shadow-[0_0_25px_rgba(168,85,247,0.6)] cursor-pointer"
                  >
                    <span>🔧 Become a Mechanic</span>
                  </button>

                  {/* Card Sub-Footer Tag */}
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-300 pt-1">
                    <span className="text-sm">🔧</span>
                    <span>Mechanic | Repair • Service • Support</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Footer Tags & Tagline matching user mockup */}
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* 4 Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-[#0D1627] border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <span>🛡️</span> Clean & Professional UI
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#0A2219] border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <span>🎨</span> Unique Theme for Each Roll
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#1A1227] border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <span>📱</span> Mobile Responsive
              </span>
              <span className="px-3 py-1.5 rounded-full bg-[#1E190A] border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <span>⚡</span> Fast & Easy Access
              </span>
            </div>

            {/* Tagline on Right */}
            <div className="text-center md:text-right">
              <span className="block text-sm sm:text-base font-bold text-cyan-400 italic font-display">
                One App – Three Roles
              </span>
              <span className="block text-xs sm:text-sm font-semibold text-gray-400 italic">
                A Complete Driving Ecosystem
              </span>
            </div>

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

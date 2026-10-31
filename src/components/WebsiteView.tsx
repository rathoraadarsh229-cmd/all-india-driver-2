import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, ShieldCheck, Gauge, Zap, Phone, MapPin, ChevronRight, 
  CheckCircle2, Wrench, Clock, Compass, FileText, Star, Menu, X, 
  ArrowRight, Shield, Award, Sparkles, Radio, ArrowUpRight, 
  AlertTriangle, UserPlus, Users, DollarSign, HelpCircle, Heart,
  Smartphone, Search, ChevronDown, Check, ExternalLink, RefreshCw,
  Sun, Moon
} from 'lucide-react';
import { DriverProfile, AppScreen } from '../types';
import { HighwayAiChatModal } from './HighwayAiChatModal';
import { SafetyReminderModal, SafetyScenario } from './SafetyReminderModal';
import { LegalTermsPrivacyModal, LegalDocType } from './LegalTermsPrivacyModal';
import { GoogleLogoSvg } from './UserAuthBadge';
import { 
  INDIAN_CITIES_COORDS, 
  fetchOsrmDistance, 
  computeTripFare, 
  FareCalculationResult 
} from '../lib/osrm';

interface WebsiteViewProps {
  driversList: DriverProfile[];
  onLaunchApp: (screen?: AppScreen, role?: 'driver' | 'owner' | 'mechanic', extra?: any) => void;
  onOpenDriverProfile: (driver: DriverProfile) => void;
  onOpenSOS: () => void;
  onBookWithEstimate: (estimate: { route: string; vehicle: string; budget: string; distance: number; days: number }) => void;
  onNavigatePage?: (page: string) => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
  isAuthenticated?: boolean;
  userEmail?: string;
  userRole?: 'driver' | 'owner' | 'mechanic' | null;
  onLogout?: () => void;
}

export const WebsiteView: React.FC<WebsiteViewProps> = ({
  driversList,
  onLaunchApp,
  onOpenDriverProfile,
  onOpenSOS,
  onBookWithEstimate,
  onNavigatePage,
  theme = 'light',
  toggleTheme,
  isAuthenticated = false,
  userEmail = '',
  userRole = null,
  onLogout
}) => {
  // Navigation & UI States
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [lang, setLang] = useState<'hi' | 'en'>(() => {
    try {
      const saved = localStorage.getItem('aid_selected_lang');
      if (saved === 'en' || saved === 'hi') return saved;
    } catch {}
    return 'hi';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'hi' ? 'en' : 'hi';
    setLang(nextLang);
    try {
      localStorage.setItem('aid_selected_lang', nextLang);
    } catch {}
  };

  // Fleet Categories State
  const [selectedFleetTab, setSelectedFleetTab] = useState<string>('heavy-trailer');

  // Safety Reminder Modal States (Mandatory verification before hiring/booking/SOS)
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [safetyScenario, setSafetyScenario] = useState<SafetyScenario>('owner_hires_driver');
  const [safetyTargetName, setSafetyTargetName] = useState<string | undefined>(undefined);
  const [safetyOnConfirmAction, setSafetyOnConfirmAction] = useState<(() => void) | null>(null);

  // Legal Documentation Modal States (Terms of Use & Privacy Policy)
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('terms');

  // Fare Calculator States (Powered by Real OSRM Highway API)
  const cityList = Object.keys(INDIAN_CITIES_COORDS);
  const [calcTripType, setCalcTripType] = useState<'outstation' | 'local'>('outstation');
  const [calcOrigin, setCalcOrigin] = useState<string>('Balaghat');
  const [calcDestination, setCalcDestination] = useState<string>('Mumbai');
  const [calcVehicle, setCalcVehicle] = useState<string>('14-22 Wheeler Multi-Axle Heavy Trailer');
  const [calcDays, setCalcDays] = useState<number>(3);
  const [calculatingDistance, setCalculatingDistance] = useState<boolean>(false);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number>(850);
  const [fareBreakdown, setFareBreakdown] = useState<FareCalculationResult>(() =>
    computeTripFare('14-22 Wheeler Multi-Axle Heavy Trailer', 850, 3, 'outstation')
  );

  // Radar / Directory Filter States
  const [radarStateFilter, setRadarStateFilter] = useState<string>('All');
  const [radarSearch, setRadarSearch] = useState<string>('');

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // PWA Install State
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaInstalled(true);
      }
      setPwaPrompt(null);
    } else {
      alert(lang === 'hi' 
        ? 'ऐप इंस्टॉल करने के लिए अपने ब्राउज़र के मेनू (⋮) में जाकर "Add to Home Screen" या "Install App" चुनें।' 
        : 'To install the app, open your browser menu (⋮) and tap "Add to Home Screen" or "Install App".');
    }
  };

  // Smooth scroll to section or navigate to page
  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (onNavigatePage) {
      onNavigatePage(id);
    }
  };

  // OSRM Real Road Distance Calculation
  useEffect(() => {
    let isCancelled = false;

    const runRouting = async () => {
      if (calcTripType === 'local') {
        const localKm = 100;
        setCalculatedDistanceKm(localKm);
        const res = computeTripFare(calcVehicle, localKm, calcDays, 'local');
        setFareBreakdown(res);
        return;
      }

      setCalculatingDistance(true);
      try {
        const route = await fetchOsrmDistance(calcOrigin, calcDestination);
        if (!isCancelled) {
          setCalculatedDistanceKm(route.distanceKm);
          const res = computeTripFare(calcVehicle, route.distanceKm, calcDays, 'outstation');
          setFareBreakdown(res);
        }
      } catch (err) {
        console.warn('Highway distance calculation notice:', err);
      } finally {
        if (!isCancelled) setCalculatingDistance(false);
      }
    };

    runRouting();

    return () => {
      isCancelled = true;
    };
  }, [calcOrigin, calcDestination, calcTripType, calcVehicle, calcDays]);

  // Handle "Book Driver For This Estimate" with mandatory Safety Reminder
  const handleProceedWithEstimate = () => {
    const routeTitle = calcTripType === 'local' 
      ? `${calcOrigin} (लोकल ड्यूटी)` 
      : `${calcOrigin} ➔ ${calcDestination}`;
    
    setSafetyScenario('owner_hires_driver');
    setSafetyTargetName(calcVehicle ? `${calcVehicle} चालक` : 'चालक');
    setSafetyOnConfirmAction(() => () => {
      onBookWithEstimate({
        route: routeTitle,
        vehicle: calcVehicle,
        budget: `₹${fareBreakdown.totalTripEstimate.toLocaleString('en-IN')}`,
        distance: calculatedDistanceKm,
        days: calcDays
      });
    });
    setIsSafetyModalOpen(true);
  };

  // Handle Highway Breakdown SOS Trigger with mandatory Safety Reminder
  const handleTriggerSOS = (breakdownLabel?: string) => {
    setSafetyScenario('hire_mechanic');
    setSafetyTargetName(breakdownLabel ? `हाईवे मैकेनिक (${breakdownLabel})` : '24x7 ऑन-रोड मैकेनिक');
    setSafetyOnConfirmAction(() => () => {
      onOpenSOS();
    });
    setIsSafetyModalOpen(true);
  };

  // 6 Fleet Categories (2W to 40W+) - Hero MotoCorp Styling
  const fleetCategories = [
    {
      id: '2w-courier',
      badge: '2-WHEELER',
      title: lang === 'hi' ? '2-पहिया (डिलीवरी एवं त्वरित कूरियर)' : '2-Wheeler (Delivery & Quick Courier)',
      specs: {
        wheels: '2 Wheels',
        payload: '50 - 150 kg',
        license: '2W Commercial / LMV',
        expRequired: '1+ Years Highway/City',
        startingRate: '₹400 - ₹600 / दिन',
        dutyType: 'हाइपरलोकल कूरियर, ई-कॉमर्स पार्सल'
      },
      desc: lang === 'hi' 
        ? 'त्वरित शहर लॉजिस्टिक्स और पार्सल कूरियर के लिए 2-पहिया बाइक चालक।'
        : 'Two-wheeler riders for hyperlocal urgent dispatch, e-commerce, and city deliveries.',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: '3w-loader',
      badge: '3-WHEELER',
      title: lang === 'hi' ? '3-पहिया ऑटो / ई-लोडर / मालवाहक' : '3-Wheeler Auto & E-Loader / Cargo',
      specs: {
        wheels: '3 Wheels',
        payload: '500 - 1,000 kg',
        license: '3W Commercial / Badge',
        expRequired: '2+ Years Mandi/City',
        startingRate: '₹600 - ₹800 / दिन',
        dutyType: 'मंडी सप्लाई, लोकल वेयरहाउस'
      },
      desc: lang === 'hi'
        ? 'सब्जी मंडी, ई-रिक्शा मालवाहक और स्थानीय डिस्ट्रीब्यूशन के लिए कुशल चालक।'
        : 'Specialized 3-wheeler auto and electric cargo drivers for wholesale markets and urban distribution.',
      image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: '4w-pickup',
      badge: '4-WHEELER',
      title: lang === 'hi' ? '4-पहिया पिकअप / टैक्सी / बोलेरो' : '4-Wheeler Car / Taxi / Bolero Pickup',
      specs: {
        wheels: '4 Wheels',
        payload: '1.0 - 2.0 Ton',
        license: 'LMV Commercial Transport',
        expRequired: '3+ Years Highway Driving',
        startingRate: '₹800 - ₹1,200 / दिन',
        dutyType: 'बोलेरो मैक्सी ट्रक, टैक्सी, इंट्रा-सिटी'
      },
      desc: lang === 'hi'
        ? 'बोलेरो पिकअप, टाटा योद्धा, टूरिस्ट टैक्सी एवं कमर्शियल कारों के अनुभवी चालक।'
        : 'Experienced drivers for pickup trucks, Bolero Maxi, passenger cabs, and light commercial vehicles.',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'medium-cargo',
      badge: '6-10 WHEELER',
      title: lang === 'hi' ? '6-10 चक्का मध्यम कार्गो (आइशर / टाटा 407/1109)' : '6-10 Wheeler Medium Cargo (Eicher / Tata)',
      specs: {
        wheels: '6 - 10 Wheels',
        payload: '7 - 15 Ton',
        license: 'Heavy Commercial Vehicle (HCV)',
        expRequired: '4+ Years Inter-District',
        startingRate: '₹1,200 - ₹1,800 / दिन',
        dutyType: 'एफएमसीजी, राज्य स्तरीय माल परिवहन'
      },
      desc: lang === 'hi'
        ? 'आइशर प्रो, टाटा 1109, 1613 कैंटर व 10-चक्का ट्रकों के लिए प्रशिक्षित चालक।'
        : 'Rigid chassis medium cargo specialists for state transport corridors and industrial distribution.',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'heavy-trailer',
      badge: '14-22 WHEELER',
      title: lang === 'hi' ? '14-22 चक्का मल्टी-एक्सल भारी ट्रेलर' : '14-22 Wheeler Multi-Axle Heavy Trailer',
      specs: {
        wheels: '14 - 22 Wheels',
        payload: '25 - 45 Ton',
        license: 'Heavy Transport (HMV) + Articulated',
        expRequired: '5+ Years National Highway',
        startingRate: '₹2,000 - ₹2,800 / दिन',
        dutyType: 'कंटेनर, स्टील, सीमेंट, कोयला फ्रेट'
      },
      desc: lang === 'hi'
        ? 'टाटा सिग्ना, अशोक लेलैंड 4018/5525 और मल्टी-एक्सल आर्टिकुलेटेड ट्रेलर्स के हाईवे मास्टर्स।'
        : 'Long-haul national highway masters for multi-axle trailers, shipping containers, and heavy freight.',
      image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'odc-haulage',
      badge: '24-40+ WHEELER',
      title: lang === 'hi' ? '24-40+ चक्का ODC भारी हाइड्रोलिक ट्रेलर' : '24-40+ Wheeler ODC & Heavy Haulage',
      specs: {
        wheels: '24 - 40+ Modular Axles',
        payload: '50 - 150+ Ton ODC',
        license: 'Special Heavy Transport License',
        expRequired: '8+ Years Over-Dimensional',
        startingRate: '₹3,000 - ₹4,500 / दिन',
        dutyType: 'विंडमिल ब्लेड्स, टर्बाइन, ट्रांसफार्मर'
      },
      desc: lang === 'hi'
        ? 'वोल्वो/स्कैनिया हैवी पुलर एवं हाइड्रोलिक एक्सल ट्रेलर्स के प्रमाणित ODC पायलट चालक।'
        : 'Elite pilots trained for modular hydraulic trailers, heavy equipment, and infrastructure cargo.',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const currentFleet = fleetCategories.find(c => c.id === selectedFleetTab) || fleetCategories[4];

  // 6 Quick Breakdown Chips for 24x7 Roadside SOS Spotlight
  const breakdownChips = [
    { id: 'puncture', label: lang === 'hi' ? 'पंचर / टायर' : 'Tyre Puncture', icon: '🛞', desc: 'ट्यूबलेस एवं हैवी ट्रक टायर रिपेयर' },
    { id: 'engine', label: lang === 'hi' ? 'इंजन हीटिंग' : 'Engine Heating', icon: '🔥', desc: 'रेडिएटर, कूलेंट व ओवरहीटिंग फॉल्ट' },
    { id: 'clutch', label: lang === 'hi' ? 'क्लच / गियर' : 'Clutch / Gearbox', icon: '⚙️', desc: 'क्लच प्लेट, प्रेशर प्लेट, गियर स्टक' },
    { id: 'battery', label: lang === 'hi' ? 'बैटरी जंपस्टार्ट' : 'Battery Jumpstart', icon: '⚡', desc: '24V हैवी ट्रक व 12V बैटरी बूस्ट' },
    { id: 'towing', label: lang === 'hi' ? 'टोइंग क्रेन' : 'Towing & Recovery', icon: '🚜', desc: '20T - 100T हाइड्रोलिक रिकवरी' },
    { id: 'brake', label: lang === 'hi' ? 'ब्रेक / एयर लीक' : 'Brake / Air Leak', icon: '🛑', desc: 'न्यूमेटिक एयर प्रेशर व ब्रेक लाइन लीकेज' }
  ];

  // FAQ Items
  const faqItems = [
    {
      q: lang === 'hi' ? 'क्या इस ऐप पर वास्तव में 0% कमीशन है?' : 'Is there truly 0% commission on this platform?',
      a: lang === 'hi' 
        ? 'हाँ, बिल्कुल! ऑल इंडिया ड्राइवर ऐप पर कोई दलाल या मध्यस्थ नहीं है। गाड़ी मालिक और ड्राइवर सीधे आपस में बात करते हैं और तय किया गया पूरा पैसा सीधे ड्राइवर को यूपीआई या नकद मिलता है। प्लेटफॉर्म ₹0 फीस लेता है।'
        : 'Yes, 100%! All India Driver App eliminates middlemen. Vehicle owners negotiate and settle payouts directly with drivers via UPI or Cash. The platform charges ₹0 commission.'
    },
    {
      q: lang === 'hi' ? 'ड्राइवर व गाड़ी मालिक का सत्यापन कैसे होता है?' : 'How are drivers and vehicle owners verified?',
      a: lang === 'hi'
        ? 'All India Driver सिर्फ आपको जोड़ता है। फोन नंबर/ईमेल के अलावा हम कोई सत्यापन नहीं करते। गाड़ी सौंपने या काम शुरू करने से पहले दोनों पक्ष mParivahan ऐप में DL, RC, फिटनेस व इंश्योरेंस स्वयं चेक करें। हायर करने का फैसला आपका है।'
        : 'All India Driver only connects you. Apart from phone/email, we do not verify anyone. Before hiring or starting work, both parties should check DL, RC, fitness and insurance in the mParivahan app. The decision to hire is yours.'
    },
    {
      q: lang === 'hi' ? 'हाईवे पर गाड़ी खराब होने पर 24x7 SOS कैसे काम करता है?' : 'How does the 24x7 Highway SOS breakdown work?',
      a: lang === 'hi'
        ? 'जैसे ही आप SOS बटन दबाते हैं, आपकी लाइव जीपीएस लोकेशन के 5 से 20 किमी दायरे में मौजूद ऑन-रोड मैकेनिक की सूची दिखती है। काम से पहले रेट तय कर लें और पेमेंट सीधा मैकेनिक को करें।'
        : 'When you trigger SOS, on-call roadside mechanics within 5-20 km of your location appear for direct call. Agree on the rate before the work starts and pay the mechanic directly.'
    },
    {
      q: lang === 'hi' ? 'किराया कैलकुलेटर में दूरी भत्ता और दैनिक बाटा कैसे तय होता है?' : 'How are Driver Allowance and Daily Bata calculated?',
      a: lang === 'hi'
        ? 'ओपनस्ट्रीटमैप OSRM सैटेलाइट रूट से सटीक हाईवे दूरी (KM) निकाली जाती है। वाहन श्रेणी के अनुसार प्रति-किमी दूरी भत्ता और दिन के हिसाब से दैनिक भोजन/बाटा सीधे जुड़कर ड्राइवर का नेट पेआउट तय करते हैं।'
        : 'OSRM highway routing determines real road kilometers. Vehicle-class distance allowances plus daily driver fooding/bata calculate the net transparent driver payout.'
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-text)] transition-colors duration-200">
      
      {/* ============================================================================== */}
      {/* 1. TOP UTILITY BAR                                                            */}
      {/* ============================================================================== */}
      <div className="bg-[var(--card)] border-b border-[var(--card-border)] px-4 sm:px-8 py-2 text-xs text-[var(--muted)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: 24x7 Highway Network Live Status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
            <span className="text-[var(--text)] font-medium">24x7 राष्ट्रीय राजमार्ग सहायता व 0% ब्रोकरेज नेटवर्क सक्रिय</span>
          </div>

          {/* Right: PWA Install, Language Switcher, Theme Toggle & Direct Login Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleInstallPwa}
              className="hidden md:inline-flex items-center gap-1.5 bg-[var(--card-subtle)] hover:bg-[var(--card-border)] text-[var(--text)] px-3 py-1 rounded-full border border-[var(--card-border)] text-[11px] font-medium transition-all cursor-pointer"
            >
              <Smartphone className="w-3 h-3 text-[var(--primary)]" />
              <span>{pwaInstalled ? '✓ ऐप इंस्टॉल है' : '📱 ऐप इंस्टॉल करें'}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 bg-[var(--card-subtle)] hover:bg-[var(--card-border)] px-3 py-1 rounded-full border border-[var(--card-border)] text-xs font-semibold text-[var(--text)] transition-all cursor-pointer"
            >
              <span className="text-[var(--primary)]">🌐</span>
              <span>{lang === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>

            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full bg-[var(--card-subtle)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-[var(--text)] transition-all cursor-pointer"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              </button>
            )}

            {/* User Account / Direct Login Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Visible Verified Google Account Pill */}
                <div className="flex items-center gap-1.5 bg-[#16161A] border border-[#FFC400]/40 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs">
                  <GoogleLogoSvg className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[140px] sm:max-w-[190px] truncate">{userEmail || 'rathoraadarsh229@gmail.com'}</span>
                  <span className="text-emerald-400 font-black text-[10px]">✓</span>
                </div>

                <button
                  onClick={() => onLaunchApp()}
                  className="bg-[#FFC400] text-gray-950 font-black px-3.5 py-1 rounded-full hover:bg-amber-400 transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>
                    {userRole === 'driver' ? (lang === 'hi' ? 'ड्राइवर डैशबोर्ड' : 'Driver Dashboard') :
                     userRole === 'owner' ? (lang === 'hi' ? 'मालिक डैशबोर्ड' : 'Owner Dashboard') :
                     userRole === 'mechanic' ? (lang === 'hi' ? 'मैकेनिक डैशबोर्ड' : 'Mechanic Dashboard') :
                     (lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard')}
                  </span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-2.5 py-1 rounded-full border border-red-500/30 text-xs transition-all cursor-pointer"
                    title={lang === 'hi' ? 'लॉग आउट' : 'Log out'}
                  >
                    {lang === 'hi' ? 'लॉग आउट' : 'Logout'}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onLaunchApp('login')}
                className="bg-[#FFC400] text-gray-950 font-black px-3.5 py-1.5 rounded-full hover:bg-amber-400 transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5"
              >
                <GoogleLogoSvg className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'hi' ? 'Google लॉगिन / प्रवेश' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 2. STICKY SUB-NAVIGATION BAR                                                  */}
      {/* ============================================================================== */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-b border-[var(--card-border)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo & Brand Badge */}
          <div 
            onClick={() => scrollTo('overview')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img 
              src="/branding/logo.jpg" 
              alt="ALL INDIA DRIVER Logo" 
              className="w-11 h-11 rounded-xl object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40 shadow-md group-hover:scale-105 transition-transform" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[var(--text)] uppercase font-display">
                  ALL INDIA DRIVER
                </span>
                <span className="bg-[#FFC400]/15 text-[#FFC400] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#FFC400]/30">
                  0% BROKERAGE
                </span>
              </div>
              <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>ऑल इंडिया ड्राइवर</span>
                <span className="text-red-500">•</span>
                <span className="text-[#FFC400]">Drive Safe Grow Together</span>
              </p>
            </div>
          </div>

          {/* Desktop Sub-Nav Anchors */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-[var(--muted)]">
            <button 
              onClick={() => scrollTo('overview')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'overview' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              {lang === 'hi' ? 'अवलोकन' : 'Overview'}
            </button>
            <button 
              onClick={() => scrollTo('vehicles')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'vehicles' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              {lang === 'hi' ? 'वाहन बेड़ा' : 'Vehicles'}
            </button>
            <button 
              onClick={() => scrollTo('features')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'features' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              {lang === 'hi' ? 'मुख्य फीचर्स' : 'Features'}
            </button>
            <button 
              onClick={() => scrollTo('sos')} 
              className={`hover:text-[var(--danger)] transition-colors cursor-pointer ${activeSection === 'sos' ? 'text-[var(--danger)] font-bold border-b-2 border-[var(--danger)] pb-1' : ''}`}
            >
              <span className="text-[var(--danger)]">🚨</span> 24x7 SOS
            </button>
            <button 
              onClick={() => scrollTo('roles')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'roles' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              {lang === 'hi' ? 'भूमिका चुनें' : 'Roles'}
            </button>
            <button 
              onClick={() => scrollTo('calculator')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'calculator' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              {lang === 'hi' ? 'किराया कैलकुलेटर' : 'Fare'}
            </button>
            <button 
              onClick={() => scrollTo('support')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'support' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              {lang === 'hi' ? 'सपोर्ट' : 'Support'}
            </button>
            <button 
              onClick={() => scrollTo('faq')} 
              className={`hover:text-[var(--text)] transition-colors cursor-pointer ${activeSection === 'faq' ? 'text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1' : ''}`}
            >
              FAQ
            </button>
            <button 
              onClick={() => setIsAiChatOpen(true)} 
              className="hover:border-[var(--primary)] transition-colors cursor-pointer flex items-center gap-1.5 bg-[var(--card-subtle)] text-[var(--text)] border border-[var(--card-border)] px-2.5 py-1 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{lang === 'hi' ? '24x7 AI सारथी' : 'AI Help'}</span>
              <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">Free</span>
            </button>
          </nav>

          {/* Quick Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLaunchApp(isAuthenticated ? undefined : 'intro')}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer hidden sm:inline-flex items-center gap-1.5"
            >
              <span>{isAuthenticated ? (lang === 'hi' ? 'डैशबोर्ड खोलें' : 'Open Dashboard') : (lang === 'hi' ? 'ऐप पोर्टल खोलें' : 'Open Portal')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-[var(--text)] rounded-xl bg-[var(--card-subtle)] border border-[var(--card-border)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-[var(--card)] border-b border-[var(--card-border)] px-4 py-4 space-y-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/10 mb-2">
              <img src="/branding/logo.jpg" alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40 shadow-sm" />
              <div>
                <span className="text-sm font-black text-white uppercase block leading-tight">ALL INDIA DRIVER</span>
                <span className="text-[9px] text-[#FFC400] font-bold uppercase tracking-wider block">Drive Safe • Grow Together</span>
              </div>
            </div>
            <button 
              onClick={() => scrollTo('overview')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              {lang === 'hi' ? 'अवलोकन (Overview)' : 'Overview'}
            </button>
            <button 
              onClick={() => scrollTo('vehicles')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              {lang === 'hi' ? 'वाहन बेड़ा (Commercial Fleet 2W-40W+)' : 'Vehicles (2W to 40W+)'}
            </button>
            <button 
              onClick={() => scrollTo('features')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              {lang === 'hi' ? 'मुख्य फीचर्स (Features)' : 'Features'}
            </button>
            <button 
              onClick={() => scrollTo('sos')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-[#E10600] hover:bg-white/5"
            >
              24x7 Highway Roadside SOS
            </button>
            <button 
              onClick={() => scrollTo('roles')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              {lang === 'hi' ? 'भूमिका चुनें (Roles: Driver, Owner, Mechanic)' : 'Choose Role'}
            </button>
            <button 
              onClick={() => scrollTo('calculator')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              {lang === 'hi' ? 'किराया व बाटा कैलकुलेटर (Fare Calculator)' : 'Fare Calculator'}
            </button>
            <button 
              onClick={() => scrollTo('support')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              {lang === 'hi' ? 'सपोर्ट एवं डोनेशन' : 'Support & Community'}
            </button>
            <button 
              onClick={() => scrollTo('faq')} 
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-gray-200 hover:bg-white/5"
            >
              FAQ
            </button>
            <div className="pt-2 flex flex-col gap-2">
              {isAuthenticated && (
                <div className="p-3 bg-[#16161A] border border-[#FFC400]/40 rounded-2xl flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                    <GoogleLogoSvg className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white truncate">{userEmail || 'rathoraadarsh229@gmail.com'}</span>
                      <span className="text-emerald-400 font-black text-[10px]">✓</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium block">
                      {userRole ? `${userRole.toUpperCase()} • Google Verified` : 'Google Verified Account'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchApp(isAuthenticated ? undefined : 'login');
                }}
                className="w-full py-2.5 bg-[#FFC400] text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl text-center shadow-sm flex items-center justify-center gap-2"
              >
                {!isAuthenticated && <GoogleLogoSvg className="w-4 h-4 shrink-0" />}
                <span>{isAuthenticated ? (lang === 'hi' ? 'डैशबोर्ड खोलें' : 'Open Dashboard') : (lang === 'hi' ? 'Google से लॉगिन करें' : 'Sign in with Google')}</span>
              </button>
              {isAuthenticated && onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl text-center border border-red-500/30"
                >
                  {lang === 'hi' ? 'लॉग आउट' : 'Log out'}
                </button>
              )}
            </div>
            {toggleTheme && (
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
            )}
          </div>
        )}
      </header>

      {/* ============================================================================== */}
      {/* 3. CINEMATIC HERO STAGE                                                       */}
      {/* ============================================================================== */}
      <section id="overview" className="relative pt-12 pb-20 px-4 sm:px-8 overflow-hidden bg-[var(--bg)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Top Tagline Label */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card)] border border-[var(--card-border)] text-xs font-semibold tracking-wider text-[var(--primary)] uppercase mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping"></span>
            <span>CHALLENGING THE NORMS OF HIGHWAY LOGISTICS</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Heading, Subhead, and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-[var(--text)] leading-[1.08] font-display">
                0% कमीशन <br />
                <span className="text-[var(--primary)]">
                  भारत का सबसे भरोसेमंद
                </span> <br />
                चालक व हाईवे नेटवर्क
              </h1>

              <p className="text-[var(--muted)] text-sm sm:text-base leading-relaxed max-w-xl font-normal">
                {lang === 'hi' 
                  ? 'बिना किसी दलाल या बिचौलिये के वाहन मालिक, भारी वाहन चालक और 24x7 ऑन-रोड मैकेनिक सीधे जुड़ें। 100% डायरेक्ट पेमेंट सीधे यूपीआई या नकद।'
                  : 'India\'s automotive-grade digital highway network connecting commercial fleet owners directly with heavy trailer drivers and 24x7 breakdown mechanics with 0% brokerage.'}
              </p>

              {/* CTAs: [ड्राइवर बुक करें] and [ड्राइवर के रूप में जुड़ें] */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onLaunchApp('intro', 'owner')}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-bold text-sm px-7 py-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 group shadow-sm min-h-[48px]"
                >
                  <span>{lang === 'hi' ? 'ड्राइवर बुक करें' : 'Book a Driver'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onLaunchApp('intro', 'driver')}
                  className="bg-[var(--card)] hover:bg-[var(--card-subtle)] text-[var(--text)] font-bold text-sm px-7 py-3.5 rounded-xl border border-[var(--card-border)] transition-all cursor-pointer flex items-center gap-2 hover:border-[var(--primary)] min-h-[48px]"
                >
                  <UserPlus className="w-4 h-4 text-[var(--primary)]" />
                  <span>{lang === 'hi' ? 'ड्राइवर के रूप में जुड़ें' : 'Join as Driver'}</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                  <span className="text-white">🟢 Email verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0087FF]"></span>
                  <span className="text-white">🔵 Phone verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-white">100% डायरेक्ट पेमेंट</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Impact Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#121214] shadow-2xl group">
                <img 
                  src="/branding/hero-banner.jpg" 
                  alt="ALL INDIA DRIVER - 0% Commission Direct Driver & Highway Network" 
                  className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-transparent to-transparent"></div>

                {/* Floating Official Logo Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-xl">
                  <img src="/branding/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
                  <div>
                    <span className="text-xs font-black text-white tracking-wide block leading-tight">ALL INDIA DRIVER</span>
                    <span className="text-[9px] text-[#FFC400] font-black uppercase tracking-wider block">Drive Safe • Grow Together</span>
                  </div>
                </div>

                {/* Floating HUD Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#121214]/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#E10600] font-black uppercase tracking-wider block">
                        HIGHWAY DISPATCH
                      </span>
                      <h4 className="text-sm font-black text-white uppercase">
                        2W से 40W+ भारी वाहन नेटवर्क
                      </h4>
                    </div>
                    <span className="bg-[#E10600]/20 text-[#E10600] font-black text-xs px-2.5 py-1 rounded-full border border-[#E10600]/40">
                      LIVE RADAR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High-Contrast Automotive Stats Ticker */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 text-center hover:border-[#E10600]/40 transition-colors">
              <Radio className="w-5 h-5 text-[#E10600] mx-auto mb-2" />
              <div className="text-2xl font-black text-white font-display">5 KM</div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                लाइव रडार मैचिंग
              </div>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 text-center hover:border-[#E10600]/40 transition-colors">
              <Truck className="w-5 h-5 text-[#E10600] mx-auto mb-2" />
              <div className="text-2xl font-black text-white font-display">2W - 40W+</div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                भारी वाहन बेड़ा
              </div>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 text-center hover:border-[#E10600]/40 transition-colors">
              <Wrench className="w-5 h-5 text-[#E10600] mx-auto mb-2" />
              <div className="text-2xl font-black text-white font-display">24x7</div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                हाईवे ब्रेकडाउन SOS
              </div>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 text-center hover:border-[#10B981]/40 transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#10B981] mx-auto mb-2" />
              <div className="text-2xl font-black text-white font-display">₹0</div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                प्लेटफॉर्म कमीशन (0%)
              </div>
            </div>
          </div>

          {/* Full-Fleet Branded Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
            <img
              src="/branding/roles-collage.jpg"
              alt="ALL INDIA DRIVER Commercial Fleet Network"
              className="w-full max-h-[460px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <img src="/branding/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-black/60 p-0.5 border border-[#FFC400]/40 shadow-sm" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
                      ALL INDIA DRIVER FLEET NETWORK
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-display leading-tight">
                    भारत का सबसे भरोसेमंद 0% ब्रोकरेज चालक, वाहन मालिक व मैकेनिक नेटवर्क
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    2W डिलीवरी से लेकर 40W+ भारी ट्रेलर्स तक — बिना किसी दलाल के सीधे जुड़े, सुरक्षित यात्रा करें और एक साथ आगे बढ़ें।
                  </p>
                </div>
                <button
                  onClick={() => onLaunchApp('intro', 'owner')}
                  className="bg-[#FFC400] hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <span>वाहन रजिस्टर करें / Hire Driver</span>
                  <ArrowRight className="w-4 h-4 text-gray-950" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 4. INTERACTIVE COMMERCIAL FLEET SHOWCASE (2W TO 40W+)                         */}
      {/* ============================================================================== */}
      <section id="vehicles" className="py-20 px-4 sm:px-8 bg-[#0B0B0C] border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#E10600] bg-[#121214] px-3.5 py-1.5 rounded-full border border-white/10">
              COMMERCIAL FLEET (2W TO 40W+)
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display">
              संपूर्ण कमर्शियल वाहन बेड़ा
            </h2>
            <p className="text-gray-400 text-sm">
              {lang === 'hi'
                ? 'डिलीवरी बाइक और ऑटो से लेकर 40+ चक्का हाइड्रोलिक हेवी पुलर तक हर गाड़ी के लिए अनुभवी चालक उपलब्ध हैं।'
                : 'From city couriers and pickups to heavy articulated multi-axle trailers, connect with professional operators on-demand.'}
            </p>
          </div>

          {/* Vehicle Category Selection Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start lg:justify-center">
            {fleetCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedFleetTab(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                  selectedFleetTab === cat.id
                    ? 'bg-[#E10600] text-white border-[#E10600] shadow-md shadow-[#E10600]/30'
                    : 'bg-[#121214] text-gray-300 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat.badge}
              </button>
            ))}
          </div>

          {/* Active Fleet Showcase Card */}
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Image & Badge */}
              <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B0B0C]">
                <img 
                  src={currentFleet.image} 
                  alt={currentFleet.title}
                  className="w-full h-72 sm:h-80 object-cover object-center"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/85 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-black text-white shadow-md">
                  <img src="/branding/logo.jpg" alt="Logo" className="w-4 h-4 rounded-full object-contain" />
                  <span className="text-[#E10600] font-black">{currentFleet.badge}</span>
                </div>
              </div>

              {/* Right Column: Detailed Specs Table & Hire Action */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase font-display">
                    {currentFleet.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    {currentFleet.desc}
                  </p>
                </div>

                {/* Real Vehicle Specs Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#16161A] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 uppercase font-black text-[10px] block">चक्का संख्या (Wheels)</span>
                    <span className="text-white font-bold text-sm">{currentFleet.specs.wheels}</span>
                  </div>
                  <div className="bg-[#16161A] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 uppercase font-black text-[10px] block">पेलोड क्षमता (Payload)</span>
                    <span className="text-[#E10600] font-bold text-sm">{currentFleet.specs.payload}</span>
                  </div>
                  <div className="bg-[#16161A] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 uppercase font-black text-[10px] block">लाइसेंस वर्ग (License)</span>
                    <span className="text-white font-bold">{currentFleet.specs.license}</span>
                  </div>
                  <div className="bg-[#16161A] p-3 rounded-xl border border-white/5">
                    <span className="text-gray-500 uppercase font-black text-[10px] block">अनुमानित दर (Starting Rate)</span>
                    <span className="text-[#10B981] font-black text-sm">{currentFleet.specs.startingRate}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#16161A] rounded-xl border border-white/5 text-xs text-gray-300">
                  <span className="text-[#E10600] font-black uppercase text-[10px] block">मुख्य उपयोग:</span>
                  <span>{currentFleet.specs.dutyType}</span>
                </div>

                {/* Hire Driver CTA */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setCalcVehicle(currentFleet.title);
                      scrollTo('calculator');
                    }}
                    className="w-full sm:w-auto bg-[#E10600] hover:bg-[#c20500] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(225,6,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{lang === 'hi' ? 'इस श्रेणी का ड्राइवर हायर करें' : 'Hire Driver For This Class'}</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Fleet Branded Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
            <img
              src="/branding/roles-collage.jpg"
              alt="ALL INDIA DRIVER Commercial Fleet Network"
              className="w-full max-h-[460px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <img src="/branding/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-black/60 p-0.5 border border-[#FFC400]/40 shadow-sm" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
                      ALL INDIA DRIVER FLEET NETWORK
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-display leading-tight">
                    भारत का सबसे भरोसेमंद 0% ब्रोकरेज चालक, वाहन मालिक व मैकेनिक नेटवर्क
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    2W डिलीवरी से लेकर 40W+ भारी ट्रेलर्स तक — बिना किसी दलाल के सीधे जुड़े, सुरक्षित यात्रा करें और एक साथ आगे बढ़ें।
                  </p>
                </div>
                <button
                  onClick={() => onLaunchApp('intro', 'owner')}
                  className="bg-[#FFC400] hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <span>वाहन रजिस्टर करें / Hire Driver</span>
                  <ArrowRight className="w-4 h-4 text-gray-950" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 5. HIGHWAY DRIVER FARE & BATA CALCULATOR (PURE ALLOWANCE & BATA)              */}
      {/* ============================================================================== */}
      <section id="calculator" className="py-20 px-4 sm:px-8 bg-[#121214] border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#E10600] bg-[#0B0B0C] px-3.5 py-1.5 rounded-full border border-white/10">
              TRANSPARENT FARE & BATA ESTIMATOR
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display">
              चालक दूरी भत्ता एवं दैनिक बाटा कैलकुलेटर
            </h2>
            <p className="text-gray-400 text-sm">
              {lang === 'hi'
                ? 'ओपनस्ट्रीटमैप OSRM द्वारा वास्तविक हाईवे सड़क दूरी की गणना। केवल ड्राइवर दूरी भत्ता और दैनिक भोजन बाटा - 0% प्लेटफॉर्म कटौती!'
                : 'Real road distance via OpenStreetMap OSRM. Focuses purely on Driver Distance Allowance and Daily Bata with 0% platform deduction.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Controls */}
            <div className="lg:col-span-6 bg-[#0B0B0C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5">
              
              {/* Trip Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  ट्रिप प्रकार (Trip Duty Type):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCalcTripType('outstation')}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      calcTripType === 'outstation'
                        ? 'bg-[#E10600] text-white border-[#E10600] shadow-[0_0_15px_rgba(225,6,0,0.3)]'
                        : 'bg-[#16161A] text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    आउटस्टेशन (Highway Trip)
                  </button>
                  <button
                    onClick={() => setCalcTripType('local')}
                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      calcTripType === 'local'
                        ? 'bg-[#E10600] text-white border-[#E10600] shadow-[0_0_15px_rgba(225,6,0,0.3)]'
                        : 'bg-[#16161A] text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    लोकल ड्यूटी (City / Mandi)
                  </button>
                </div>
              </div>

              {/* Origin and Destination City Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    प्रस्थान शहर (From Origin):
                  </label>
                  <select
                    value={calcOrigin}
                    onChange={(e) => setCalcOrigin(e.target.value)}
                    className="w-full bg-[#16161A] border border-white/15 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#E10600]"
                  >
                    {cityList.map(c => (
                      <option key={c} value={c} className="bg-[#121214] text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    गंतव्य शहर (To Destination):
                  </label>
                  <select
                    value={calcDestination}
                    onChange={(e) => setCalcDestination(e.target.value)}
                    disabled={calcTripType === 'local'}
                    className="w-full bg-[#16161A] border border-white/15 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#E10600] disabled:opacity-40"
                  >
                    {cityList.map(c => (
                      <option key={c} value={c} className="bg-[#121214] text-white">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  वाहन का प्रकार (Vehicle Class):
                </label>
                <select
                  value={calcVehicle}
                  onChange={(e) => setCalcVehicle(e.target.value)}
                  className="w-full bg-[#16161A] border border-white/15 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#E10600]"
                >
                  <option value="2-Wheeler (Delivery & Quick Courier)">2-पहिया (Delivery & Courier - ₹1.5/km, ₹350 बाटा)</option>
                  <option value="3-Wheeler Auto & E-Rickshaw / Loader">3-पहिया ऑटो / ई-रिक्शा (₹2.0/km, ₹450 बाटा)</option>
                  <option value="4-Wheeler Car / Taxi / Bolero Pickup">4-पहिया बोलेरो / पिकअप / टैक्सी (₹2.6/km, ₹550 बाटा)</option>
                  <option value="6-10 Wheeler Medium Cargo (Eicher / Tata)">6-10 चक्का मध्यम ट्रक (₹3.2/km, ₹650 बाटा)</option>
                  <option value="14-22 Wheeler Multi-Axle Heavy Trailer">14-22 चक्का हैवी ट्रेलर (₹4.2/km, ₹850 बाटा)</option>
                  <option value="24-40+ Wheeler ODC & Heavy Haulage">24-40+ चक्का ODC भारी ट्रेलर (₹5.5/km, ₹1200 बाटा)</option>
                </select>
              </div>

              {/* Estimated Trip Duration */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
                  <span>अनुमानित ट्रिप दिन (Trip Days):</span>
                  <span className="text-[#E10600] font-black text-sm">{calcDays} दिन</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={calcDays}
                  onChange={(e) => setCalcDays(Number(e.target.value))}
                  className="w-full accent-[#E10600] cursor-pointer"
                />
              </div>

              {/* OSRM Highway Live Route Status */}
              <div className="p-3 bg-[#16161A] rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#E10600]" />
                  <span className="text-gray-300 font-bold">
                    {calcTripType === 'local' ? `${calcOrigin} लोकल डिस्ट्रीब्यूशन` : `${calcOrigin} ➔ ${calcDestination}`}
                  </span>
                </div>
                <span className="text-white font-black">
                  {calculatingDistance ? 'गणना हो रही है...' : `${calculatedDistanceKm} KM (सड़क मार्ग)`}
                </span>
              </div>
            </div>

            {/* Fare & Bata Breakdown Card */}
            <div className="lg:col-span-6 bg-[#0B0B0C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] text-[#E10600] font-black uppercase tracking-wider block">
                    TRANSPARENT DRIVER PAYOUT
                  </span>
                  <h3 className="text-lg font-black text-white uppercase">
                    अनुमानित चालक पारिश्रमिक
                  </h3>
                </div>
                <span className="bg-[#10B981]/20 text-[#10B981] font-black text-xs px-2.5 py-1 rounded-full border border-[#10B981]/40">
                  0% कमीशन
                </span>
              </div>

              {/* Pure Driver Allowance & Daily Bata Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">
                    दूरी भत्ता ({calculatedDistanceKm} KM @ ₹{fareBreakdown.perKmRate}/km):
                  </span>
                  <span className="text-white font-bold text-sm">
                    ₹{fareBreakdown.driverWageAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">
                    दैनिक भोजन / बाटा ({calcDays} दिन @ ₹{fareBreakdown.dailyBataRate}/दिन):
                  </span>
                  <span className="text-white font-bold text-sm">
                    ₹{fareBreakdown.dailyBataAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">
                    प्लेटफॉर्म कमीशन (All India Driver Fee):
                  </span>
                  <span className="text-[#10B981] font-black text-sm">
                    ₹0 (मुफ्त डायरेक्ट कनेक्शन)
                  </span>
                </div>

                {/* Grand Total */}
                <div className="p-4 bg-[#16161A] rounded-2xl border border-white/10 flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] text-[#E10600] font-black uppercase tracking-wider block">
                      कुल देय चालक भुगतान (DIRECT TO DRIVER)
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white font-display">
                      ₹{fareBreakdown.totalTripEstimate.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">भुगतान विधि</span>
                    <span className="text-xs font-bold text-[#10B981]">सीधा UPI / नकद</span>
                  </div>
                </div>
              </div>

              {/* Book Driver For This Estimate Button */}
              <button
                onClick={handleProceedWithEstimate}
                className="w-full bg-[#E10600] hover:bg-[#c20500] text-white font-black text-sm py-4 rounded-2xl uppercase tracking-wider shadow-[0_0_20px_rgba(225,6,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>इस एस्टीमेट के साथ ड्राइवर बुक करें</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Branded Fare Calculator Visual Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B0B0C] shadow-2xl group">
            <img 
              src="/branding/calculator-banner.jpg" 
              alt="ALL INDIA DRIVER Fare & Bhatta Calculator" 
              className="w-full max-h-[460px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-xl">
              <img src="/branding/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
              <div>
                <span className="text-xs font-black text-white tracking-wide block leading-tight">ALL INDIA DRIVER CALCULATOR</span>
                <span className="text-[9px] text-[#FFC400] font-black uppercase tracking-wider block">सटीक दूरी भत्ता • 0% कमीशन</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 6. 24x7 HIGHWAY ROADSIDE SOS SPOTLIGHT                                         */}
      {/* ============================================================================== */}
      <section id="sos" className="py-20 px-4 sm:px-8 bg-[#0B0B0C] border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#E10600] bg-[#121214] px-3.5 py-1.5 rounded-full border border-white/10">
              HIGHWAY EMERGENCY BREAKDOWN
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display">
              24x7 ऑन-रोड हाईवे मैकेनिक सहायता
            </h2>
            <p className="text-gray-400 text-sm">
              {lang === 'hi'
                ? 'हाईवे पर पंचर, इंजन हीटिंग या ब्रेकडाउन होने पर 1-टैप में निकटतम ऑन-साइट मैकेनिक से जुड़ें।'
                : '1-tap emergency dispatch connecting commercial drivers with roadside highway mechanics nationwide.'}
            </p>
          </div>

          {/* 6 Quick Breakdown Chips */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {breakdownChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => handleTriggerSOS(chip.label)}
                className="bg-[#121214] hover:bg-[#1A1A22] border border-white/10 hover:border-[#E10600]/50 p-4 rounded-2xl text-center space-y-2 transition-all cursor-pointer group shadow-sm"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">{chip.icon}</div>
                <div className="font-bold text-xs text-white">{chip.label}</div>
                <p className="text-[10px] text-gray-400 leading-tight">{chip.desc}</p>
              </button>
            ))}
          </div>

          {/* Emergency SOS Banner */}
          <div className="bg-gradient-to-r from-red-950/60 via-[#121214] to-red-950/60 border border-[#E10600]/30 rounded-3xl p-6 sm:p-10 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-[#E10600] font-black text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>हाईवे इमरजेंसी सहायता</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                क्या आप या आपका ड्राइवर हाईवे पर फंसे हैं?
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm">
                ऑटो-डिटेक्ट लोकेशन और 5-20 किमी के दायरे में मौजूद नजदीकी वर्कशॉप एवं मोबाइल वैन मैकेनिक को सीधा कॉल करें।
              </p>
            </div>

            <button
              onClick={() => handleTriggerSOS('हाईवे इमरजेंसी ब्रेकडाउन')}
              className="bg-[#E10600] hover:bg-[#c20500] text-white font-black text-xs uppercase tracking-wider px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(225,6,0,0.5)] transition-all cursor-pointer flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>SOS मैकेनिक खोजें</span>
            </button>
          </div>

          {/* 24x7 Highway Emergency Infographic Visual Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
              <img 
                src="/branding/sos-emergency-banner.jpg" 
                alt="24x7 Highway SOS Emergency Assistance" 
                className="w-full h-64 sm:h-72 object-cover object-center group-hover:scale-[1.02] transition-transform duration-700" 
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                <img src="/branding/logo.jpg" alt="Logo" className="w-5 h-5 rounded-md object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
                <span className="text-[11px] font-black text-white">24x7 HIGHWAY SOS</span>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
              <img 
                src="/branding/mechanic-support-banner.jpg" 
                alt="On-Road Highway Mechanic Assistance" 
                className="w-full h-64 sm:h-72 object-cover object-center group-hover:scale-[1.02] transition-transform duration-700" 
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                <img src="/branding/logo.jpg" alt="Logo" className="w-5 h-5 rounded-md object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
                <span className="text-[11px] font-black text-white">MECHANIC SUPPORT</span>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
              <img 
                src="/branding/sos-roadside-banner.jpg" 
                alt="On-Road Emergency Assistance Anywhere" 
                className="w-full h-64 sm:h-72 object-cover object-center group-hover:scale-[1.02] transition-transform duration-700" 
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                <img src="/branding/logo.jpg" alt="Logo" className="w-5 h-5 rounded-md object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
                <span className="text-[11px] font-black text-white">ROADSIDE ASSISTANCE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 7. ROLE SELECTION (3 UNIVERSES)                                               */}
      {/* ============================================================================== */}
      <section id="roles" className="py-20 px-4 sm:px-8 bg-[#121214] border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#E10600] bg-[#0B0B0C] px-3.5 py-1.5 rounded-full border border-white/10">
              3 UNIVERSES ROLE SELECTION
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display">
              अपनी भूमिका चुनें
            </h2>
            <p className="text-gray-400 text-sm">
              {lang === 'hi'
                ? 'आप इस मंच पर किस रूप में जुड़ना चाहते हैं? अपनी श्रेणी चुनें और तुरंत शुरुआत करें।'
                : 'Select your role to access customized dashboards, real-time dispatch, and 0% commission operations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Universe 1: Commercial Driver – Blue Theme */}
            <div className="card-driver-theme rounded-3xl p-8 space-y-6 transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,180,216,0.3)]">
                  <Truck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white uppercase font-display">
                  1. वाहन चालक (Driver – Blue Theme)
                </h3>
                <p className="text-gray-300 text-xs leading-relaxed">
                  2W से 40W+ भारी वाहनों के ड्राइवर अपना प्रोफाइल बनाएं, वाहन श्रेणी चुनें और गाड़ी मालिकों से सीधे 0% कमीशन पर ट्रिप्स पाएं।
                </p>
                <ul className="text-xs space-y-2 text-cyan-200 font-semibold">
                  <li className="flex items-center gap-2">✓ 0% कमीशन, पूरा पैसा आपका</li>
                  <li className="flex items-center gap-2">✓ Phone verified नेटवर्क</li>
                  <li className="flex items-center gap-2">✓ ऑनलाइन/ऑफलाइन उपलब्धता टॉगल</li>
                </ul>
              </div>

              <button
                onClick={() => onLaunchApp('driver-profile-setup', 'driver')}
                className="btn-driver w-full py-3.5 text-xs uppercase tracking-wider text-center cursor-pointer shadow-[0_0_20px_rgba(0,135,255,0.5)]"
              >
                ➔ Continue as Driver (चालक चुनें)
              </button>
            </div>

            {/* Universe 2: Fleet Owner / Transporter – Green Theme */}
            <div className="card-owner-theme rounded-3xl p-8 space-y-6 transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white uppercase font-display">
                  2. गाड़ी मालिक (Owner – Green Theme)
                </h3>
                <p className="text-gray-300 text-xs leading-relaxed">
                  5 KM रडार से आसपास के ड्राइवरों को तुरंत खोजें, प्रोफाइल देखें, ट्रिप पोस्ट करें और डायरेक्ट संपर्क करें।
                </p>
                <ul className="text-xs space-y-2 text-emerald-200 font-semibold">
                  <li className="flex items-center gap-2">✓ 5 KM जीपीएस रडार से ड्राइवर खोज</li>
                  <li className="flex items-center gap-2">✓ सीधे फोन कॉल व चैट की सुविधा</li>
                  <li className="flex items-center gap-2">✓ कोई ब्रोकर नहीं, शून्य कमीशन</li>
                </ul>
              </div>

              <button
                onClick={() => onLaunchApp('owner-profile-setup', 'owner')}
                className="btn-owner w-full py-3.5 text-xs uppercase tracking-wider text-center cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.5)]"
              >
                + Post Your Vehicle / Job (मालिक चुनें)
              </button>
            </div>

            {/* Universe 3: Roadside Mechanic – Purple Theme */}
            <div className="card-mechanic-theme rounded-3xl p-8 space-y-6 transition-all group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Wrench className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white uppercase font-display">
                  3. हाईवे मैकेनिक (Mechanic – Purple Theme)
                </h3>
                <p className="text-gray-300 text-xs leading-relaxed">
                  हाईवे गैराज, टायर पंक्चर शॉप और मोबाइल वैन मैकेनिक रजिस्टर करें और पास के ब्रेकडाउन वाले वाहनों से काम पाएं।
                </p>
                <ul className="text-xs space-y-2 text-purple-200 font-semibold">
                  <li className="flex items-center gap-2">✓ 24x7 ऑन-रोड SOS अलर्ट</li>
                  <li className="flex items-center gap-2">✓ गैराज व ऑन-साइट सर्विस मोड</li>
                  <li className="flex items-center gap-2">✓ ग्राहक से सीधा भुगतान</li>
                </ul>
              </div>

              <button
                onClick={() => onLaunchApp('mechanic-profile-setup', 'mechanic')}
                className="btn-mechanic w-full py-3.5 text-xs uppercase tracking-wider text-center cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.5)]"
              >
                🔧 Become a Mechanic (मैकेनिक चुनें)
              </button>
            </div>
          </div>

          {/* Branded Roles & How It Works Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B0B0C] shadow-2xl group">
            <img 
              src="/branding/roles-banner.jpg" 
              alt="ALL INDIA DRIVER Roles and How It Works" 
              className="w-full max-h-[460px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-md">
              <img src="/branding/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
              <div>
                <span className="text-xs font-black text-white tracking-wide block leading-tight">ALL INDIA DRIVER NETWORK</span>
                <span className="text-[9px] text-[#FFC400] font-black uppercase tracking-wider block">Driver • Owner • Mechanic</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 8. KEY FEATURES                                                                */}
      {/* ============================================================================== */}
      <section id="features" className="py-20 px-4 sm:px-8 bg-[#0B0B0C] border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#E10600] bg-[#121214] px-3.5 py-1.5 rounded-full border border-white/10">
              CORE ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-display">
              ऑल इंडिया ड्राइवर की मुख्य विशेषताएं
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 space-y-3 hover:border-[#E10600]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E10600]/10 flex items-center justify-center text-[#E10600]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white uppercase">0% कमीशन</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                ट्रांसपोर्ट उद्योग में दलाली खत्म। गाड़ी मालिक और ड्राइवर के बीच 100% सीधा लेनदेन।
              </p>
            </div>

            {/* Feature 2: 24x7 Chat AI (100% Free, Zero Charge) */}
            <div 
              onClick={() => setIsAiChatOpen(true)}
              className="bg-[#121214] border border-[#E10600]/40 hover:border-[#E10600] rounded-2xl p-6 space-y-3 transition-all cursor-pointer group shadow-lg shadow-[#E10600]/10 hover:scale-[1.02]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E10600]/15 flex items-center justify-center text-[#E10600] group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-[#E10600]" />
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-white uppercase group-hover:text-[#E10600] transition-colors">
                  24x7 AI चैट सारथी
                </h4>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black uppercase">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                हाईवे ब्रेकडाउन, किराया-बाटा, ड्राइवर भर्ती और आपकी हर समस्या का त्वरित समाधान। ₹0 चार्ज, 100% मुफ़्त सेवा।
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E10600] group-hover:underline">
                AI से अभी बात करें ➔
              </span>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 space-y-3 hover:border-[#E10600]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E10600]/10 flex items-center justify-center text-[#E10600]">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white uppercase">5 KM लाइव रडार</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                सटीक जीपीएस प्रोक्सिमिटी एल्गोरिदम निकटतम उपलब्ध वाहन चालकों को तुरंत मैप पर दिखाता है।
              </p>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 space-y-3 hover:border-[#E10600]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E10600]/10 flex items-center justify-center text-[#E10600]">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-black text-white uppercase">24x7 हाईवे रोडसाइड सहायता</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                24 घंटे 365 दिन ऑन-रोड मैकेनिक, टायर पंचर, क्रेन व टोइंग इमरजेंसी सपोर्ट उपलब्ध।
              </p>
            </div>
          </div>

          {/* Branded Core Features Infographic Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
            <img 
              src="/branding/features-banner.jpg" 
              alt="ALL INDIA DRIVER Core Features & Highway Tools" 
              className="w-full max-h-[460px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-md">
              <img src="/branding/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
              <div>
                <span className="text-xs font-black text-white tracking-wide block leading-tight">CORE HIGHWAY FEATURES</span>
                <span className="text-[9px] text-[#FFC400] font-black uppercase tracking-wider block">Smart Tools • Strong Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 9. TRANSPARENT WELFARE FUND (SUPPORT US)                                      */}
      {/* ============================================================================== */}
      <section id="support" className="py-20 px-4 sm:px-8 bg-[#121214] border-t border-white/10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Driver Community & Welfare Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#0B0B0C] shadow-2xl group">
            <img 
              src="/branding/community-banner.jpg" 
              alt="ALL INDIA DRIVER Community & Welfare" 
              className="w-full max-h-[440px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-md">
              <img src="/branding/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
              <div>
                <span className="text-xs font-black text-white tracking-wide block leading-tight">COMMUNITY & WELFARE</span>
                <span className="text-[9px] text-[#FFC400] font-black uppercase tracking-wider block">साथ चलें • साथ बढ़ें</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0B0B0C] to-[#16161A] border border-[#E10600]/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-[#E10600]/10 border border-[#E10600]/40 flex items-center justify-center text-[#E10600] mx-auto shadow-[0_0_20px_rgba(225,6,0,0.3)]">
              <Heart className="w-8 h-8 fill-[#E10600]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#E10600]">
                COMMUNITY WELFARE FUND
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white font-display">
                ड्राइवर कल्याण कोष (सपोर्ट करें)
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                ऑल इंडिया ड्राइवर एक निस्वार्थ 0% कमीशन मंच है। हाईवे पर जरूरतमंद ड्राइवरों के आपातकालीन इलाज, भोजन व सड़क सहायता के लिए स्वेच्छा से योगदान दें।
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => onLaunchApp('donate-money')}
                className="bg-[#E10600] hover:bg-[#c20500] text-white font-black text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(225,6,0,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>कल्याण कोष में सहयोग करें (0% कटौती)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 10. FREQUENTLY ASKED QUESTIONS (FAQ)                                          */}
      {/* ============================================================================== */}
      <section id="faq" className="py-20 px-4 sm:px-8 bg-[#0B0B0C] border-t border-white/10">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#E10600] bg-[#121214] px-3.5 py-1.5 rounded-full border border-white/10">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl font-black uppercase text-white font-display">
              अक्सर पूछे जाने वाले प्रश्न
            </h2>
          </div>

          {/* FAQ Visual Infographic Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-2xl group">
            <img 
              src="/branding/faq-banner.jpg" 
              alt="Frequently Asked Questions - ALL INDIA DRIVER" 
              className="w-full max-h-[380px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-700" 
            />
            <div className="absolute top-4 left-4 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 shadow-md">
              <img src="/branding/logo.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40" />
              <div>
                <span className="text-xs font-black text-white tracking-wide block leading-tight">FAQ & HIGHWAY HELP</span>
                <span className="text-[9px] text-[#FFC400] font-black uppercase tracking-wider block">आपके सवाल • हमारे जवाब</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-[#121214] border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-[#E10600] transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${expandedFaq === idx ? 'rotate-180 text-[#E10600]' : 'text-gray-400'}`} />
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================================== */}
      {/* 11. AUTOMOTIVE FOOTER                                                          */}
      {/* ============================================================================== */}
      <footer className="bg-[#050506] border-t border-white/10 pt-16 pb-12 px-4 sm:px-8 text-gray-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/branding/logo.jpg" 
                alt="ALL INDIA DRIVER Logo" 
                className="w-10 h-10 rounded-xl object-contain bg-[#16161A] p-0.5 border border-[#FFC400]/40 shadow-[0_0_15px_rgba(225,6,0,0.5)]" 
              />
              <div>
                <span className="text-base font-black text-white uppercase tracking-tight block leading-tight">
                  ALL INDIA DRIVER
                </span>
                <span className="text-[10px] text-[#FFC400] font-bold tracking-wider uppercase block">
                  Drive Safe Grow Together
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              भारत के करोड़ों चालकों, गाड़ी मालिकों और हाईवे मैकेनिक्स को बिना किसी दलाली के सीधे जोड़ने वाला ऑटोमोटिव डिजिटल मंच।
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded border border-[#10B981]/40 font-bold">
                0% COMMISSION
              </span>
              <span className="text-[10px] bg-[#E10600]/20 text-[#E10600] px-2 py-0.5 rounded border border-[#E10600]/40 font-bold">
                PAN-INDIA NETWORK
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">त्वरित लिंक्स</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => scrollTo('overview')} className="hover:text-white transition-colors cursor-pointer">
                  मुख्य अवलोकन
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('vehicles')} className="hover:text-white transition-colors cursor-pointer">
                  वाहन बेड़ा (2W से 40W+)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('calculator')} className="hover:text-white transition-colors cursor-pointer">
                  किराया व बाटा कैलकुलेटर
                </button>
              </li>
              <li>
                <button onClick={onOpenSOS} className="hover:text-[#E10600] transition-colors cursor-pointer text-[#E10600]">
                  24x7 हाईवे SOS सहायता
                </button>
              </li>
            </ul>
          </div>

          {/* Roles & Entry */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">भूमिका एवं प्रवेश</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onLaunchApp('driver-profile-setup', 'driver')} className="hover:text-white transition-colors cursor-pointer">
                  ड्राइवर पंजीकरण
                </button>
              </li>
              <li>
                <button onClick={() => onLaunchApp('owner-profile-setup', 'owner')} className="hover:text-white transition-colors cursor-pointer">
                  गाड़ी मालिक पंजीकरण
                </button>
              </li>
              <li>
                <button onClick={() => onLaunchApp('mechanic-profile-setup', 'mechanic')} className="hover:text-white transition-colors cursor-pointer">
                  हाईवे मैकेनिक पंजीकरण
                </button>
              </li>
              <li>
                <button onClick={() => onLaunchApp('donate-money')} className="hover:text-white transition-colors cursor-pointer">
                  ड्राइवर कल्याण कोष (सपोर्ट)
                </button>
              </li>
            </ul>
          </div>

          {/* Real Contacts & Highway Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">संपर्क एवं सहायता</h4>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">आधिकारिक ईमेल:</span>
                <a href="mailto:support@allindiadriver.com" className="text-white hover:underline block">
                  support@allindiadriver.com
                </a>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleInstallPwa}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#E10600]" />
                  <span>{pwaInstalled ? '✓ ऐप इंस्टॉल है' : '📱 Android / PWA ऐप इंस्टॉल करें'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            © {new Date().getFullYear()} ALL INDIA DRIVER APP. All Rights Reserved. 100% Direct Payout, Zero Brokerage.
          </div>
          
          {/* Legal Links (Terms of Use & Privacy Policy) */}
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
            <button
              type="button"
              onClick={() => {
                setLegalDocType('terms');
                setIsLegalModalOpen(true);
              }}
              className="hover:text-white hover:underline transition-colors cursor-pointer"
            >
              उपयोग की शर्तें (Terms of Use)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setLegalDocType('privacy');
                setIsLegalModalOpen(true);
              }}
              className="hover:text-white hover:underline transition-colors cursor-pointer"
            >
              गोपनीयता नीति (Privacy Policy)
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span>डिजिटल भारत • आत्मनिर्भर चालक</span>
          </div>
        </div>
      </footer>

      {/* Floating 24x7 AI Highway Assistant Launcher (100% Free - ₹0 Charge) */}
      <button
        type="button"
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#E10600] hover:bg-[#c20500] text-white px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(225,6,0,0.55)] border-2 border-white/20 flex items-center gap-2.5 font-black text-xs uppercase tracking-wider transition-all hover:scale-105 cursor-pointer group"
        aria-label="Open 24x7 AI Chat"
      >
        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
        <span>24x7 AI सारथी</span>
        <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
          Free
        </span>
      </button>

      {/* 24x7 Highway AI Chat Modal */}
      <HighwayAiChatModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        onOpenSOS={onOpenSOS}
        onOpenCalculator={() => scrollTo('calculator')}
        onOpenFleet={() => scrollTo('vehicles')}
        onOpenLogin={() => onLaunchApp('login')}
        lang={lang}
      />

      {/* Mandatory Safety Reminder Popup (Owner Hires Driver / SOS Mechanic) */}
      <SafetyReminderModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        onConfirm={() => {
          if (safetyOnConfirmAction) {
            safetyOnConfirmAction();
          }
        }}
        scenario={safetyScenario}
        targetName={safetyTargetName}
        defaultLang={lang}
      />

      {/* Official Legal Terms of Use & Privacy Policy Modal */}
      <LegalTermsPrivacyModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialDoc={legalDocType}
        defaultLang={lang}
      />
    </div>
  );
};

export default WebsiteView;

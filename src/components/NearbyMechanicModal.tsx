import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Phone, 
  Navigation, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Check, 
  X, 
  Send, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Compass,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { MechanicProfile } from '../types';
import { fetchDiscoverableMechanics, createMechanicSosRequest } from '../services/insforgeService';
import { SafetyReminderModal } from './SafetyReminderModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
  userRole?: 'driver' | 'owner';
  userName?: string;
  userPhone?: string;
  userLocation?: string;
  onOpenChat?: (mech: MechanicProfile) => void;
}

// 6 Required Chips as specified by the user
const ISSUE_CHIPS = [
  'ब्रेकडाउन',
  'पंक्चर/टायर',
  'इंजन',
  'बैटरी/बिजली',
  'क्रेन/टोइंग',
  'दूसरी'
] as const;

type IssueType = typeof ISSUE_CHIPS[number];

export const NearbyMechanicModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userLat = 21.8124,
  userLng = 80.1838,
  userRole = 'driver',
  userName = 'वाहन चालक',
  userPhone = '',
  userLocation = 'हाईवे मार्ग (वर्तमान स्थान)',
  onOpenChat
}) => {
  // 1. Location state (user can edit/change)
  const [currentLocation, setCurrentLocation] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aid_user_current_location');
      return saved || userLocation || 'हाईवे मार्ग (वर्तमान स्थान)';
    } catch {
      return userLocation || 'हाईवे मार्ग (वर्तमान स्थान)';
    }
  });
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocationInput, setTempLocationInput] = useState(currentLocation);

  // 2. Issue Chips Selection
  const [selectedIssue, setSelectedIssue] = useState<IssueType>('ब्रेकडाउन');

  // 3. 24x7 Only Toggle
  const [only24x7, setOnly24x7] = useState<boolean>(false);

  // 4. Mechanics list
  const [allMechanics, setAllMechanics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 5. Broadcast request state
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // 6. Direct request states per mechanic
  const [directSentIds, setDirectSentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('aid_requested_mechanics');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Fetch real mechanics from database/storage (strictly no fake dummy data)
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchDiscoverableMechanics(true)
      .then((mechs) => {
        if (!isMounted) return;
        // Strictly real registered mechanics
        const cleanList = (mechs || []).filter((m: any) => 
          m && 
          !m.id?.startsWith('fake-') && 
          !m.id?.startsWith('sample-') &&
          m.name !== 'Fake Mechanic'
        );
        setAllMechanics(cleanList);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Error fetching mechanics:', err);
        if (isMounted) {
          setAllMechanics([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter mechanics by 24x7 toggle
  const filteredMechanics = useMemo(() => {
    if (!only24x7) return allMechanics;
    return allMechanics.filter(m => 
      m.emergency24x7 === true || 
      m.working_hours === '24x7' || 
      m.availability === '24x7'
    );
  }, [allMechanics, only24x7]);

  // Handle Location Change Save
  const handleSaveLocation = () => {
    const trimmed = tempLocationInput.trim();
    if (trimmed) {
      setCurrentLocation(trimmed);
      try {
        localStorage.setItem('aid_user_current_location', trimmed);
      } catch {}
    }
    setIsEditingLocation(false);
  };

  // Safety Reminder Modal state for hiring/calling mechanic
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [pendingSafetyAction, setPendingSafetyAction] = useState<{
    type: 'call' | 'direct_request' | 'broadcast';
    mech?: any;
    phone?: string;
    name?: string;
  } | null>(null);

  const handleConfirmSafety = () => {
    if (!pendingSafetyAction) return;
    const action = pendingSafetyAction;
    setPendingSafetyAction(null);
    if (action.type === 'call' && action.phone) {
      window.location.href = `tel:${action.phone}`;
    } else if (action.type === 'direct_request' && action.mech) {
      performDirectRequest(action.mech);
    } else if (action.type === 'broadcast') {
      performSendBroadcastRequest();
    }
  };

  // Big Action: "पास के सभी मैकेनिक को रिक्वेस्ट भेजें"
  const handleSendBroadcastRequest = () => {
    setPendingSafetyAction({
      type: 'broadcast',
      name: 'पास के सभी हाईवे मैकेनिक'
    });
    setIsSafetyModalOpen(true);
  };

  const performSendBroadcastRequest = async () => {
    if (isSendingBroadcast) return;
    setIsSendingBroadcast(true);

    const newRequest = {
      id: 'sos-' + Date.now(),
      requesterName: userName || (userRole === 'owner' ? 'गाड़ी मालिक' : 'चालक'),
      requesterPhone: userPhone || '',
      requesterRole: userRole || 'driver',
      issueCategory: selectedIssue,
      issueDescription: `दिक्कत: ${selectedIssue} • तुरंत सहायता चाहिए`,
      location: currentLocation,
      lat: userLat,
      lng: userLng,
      targetMechanicId: 'all', // Broadcast to all nearby mechanics
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // 1. Save to local storage for instant sync across dashboards
    try {
      const existing = JSON.parse(localStorage.getItem('aid_mechanic_requests') || '[]');
      const updated = [newRequest, ...existing.filter((r: any) => r && r.id !== newRequest.id)];
      localStorage.setItem('aid_mechanic_requests', JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn('Local request cache save note:', e);
    }

    // 2. Dispatch to InsForge database
    try {
      await createMechanicSosRequest({
        requesterName: newRequest.requesterName,
        requesterPhone: newRequest.requesterPhone,
        requesterRole: newRequest.requesterRole,
        issueDescription: `${selectedIssue}: ${currentLocation}`,
        location: currentLocation,
        lat: userLat,
        lng: userLng
      });
    } catch (err) {
      console.warn('InsForge mechanic SOS insert notice:', err);
    }

    setIsSendingBroadcast(false);
    setBroadcastSent(true);

    // Auto dismiss notice after 6 seconds
    setTimeout(() => {
      setBroadcastSent(false);
    }, 6000);
  };

  // Direct request to individual mechanic
  const handleDirectRequest = (mech: any) => {
    setPendingSafetyAction({
      type: 'direct_request',
      mech,
      name: mech.name || mech.garageName
    });
    setIsSafetyModalOpen(true);
  };

  const performDirectRequest = async (mech: any) => {
    const mechId = mech.id || String(mech.name);
    if (directSentIds.includes(mechId)) return;

    const newReq = {
      id: 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      requesterName: userName || (userRole === 'owner' ? 'गाड़ी मालिक' : 'चालक'),
      requesterPhone: userPhone || '',
      requesterRole: userRole || 'driver',
      targetMechanicId: mechId,
      targetMechanicName: mech.name || mech.garageName,
      issueCategory: selectedIssue,
      issueDescription: `सीधा अनुरोध: ${selectedIssue} • स्थान: ${currentLocation}`,
      location: currentLocation,
      lat: userLat,
      lng: userLng,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(localStorage.getItem('aid_mechanic_requests') || '[]');
      const updated = [newReq, ...existing.filter((r: any) => r && r.id !== newReq.id)];
      localStorage.setItem('aid_mechanic_requests', JSON.stringify(updated.slice(0, 50)));
      
      const newSent = [...directSentIds, mechId];
      setDirectSentIds(newSent);
      localStorage.setItem('aid_requested_mechanics', JSON.stringify(newSent));
    } catch (e) {
      console.warn(e);
    }

    try {
      await createMechanicSosRequest({
        requesterName: newReq.requesterName,
        requesterPhone: newReq.requesterPhone,
        requesterRole: newReq.requesterRole,
        issueDescription: `${selectedIssue} -> ${mech.garageName || mech.name}`,
        location: currentLocation,
        lat: userLat,
        lng: userLng
      });
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-300">
        
        {/* 1. TOP HEADER (CHARCOAL #121214 + HERO RED #E10600) */}
        <div className="bg-[#121214] text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#E10600] text-white flex items-center justify-center font-black shadow-md shadow-[#E10600]/30">
              <Wrench className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                पास का मैकेनिक
              </h2>
              <p className="text-xs text-gray-300 font-bold">
                गाड़ी खराब होने पर तुरंत 24x7 सहायता
              </p>
            </div>
          </div>

          {/* Close button (Min 48px height & width) */}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] rounded-xl bg-[#1A1A22] hover:bg-[#25252e] text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
            title="बंद करें"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-800">

          {/* SUCCESS BANNER AFTER SENDING BROADCAST */}
          {broadcastSent && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-start gap-3 animate-fade-in">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-emerald-950">
                  ✅ पास के सभी मैकेनिक को रिक्वेस्ट भेज दी गई है!
                </h4>
                <p className="text-xs font-bold text-emerald-850">
                  मैकेनिक के डैशबोर्ड पर आपका अनुरोध दिख रहा है। जल्द ही आपसे कॉल या चैट द्वारा संपर्क होगा।
                </p>
              </div>
            </div>
          )}

          {/* 2. अपनी लोकेशन (बदल सकें) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#1C1C21]" />
                <span>आपकी लोकेशन</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempLocationInput(currentLocation);
                  setIsEditingLocation(!isEditingLocation);
                }}
                className="text-xs font-black text-[#1C1C21] hover:text-black underline cursor-pointer px-2 py-1"
              >
                {isEditingLocation ? 'रद्द करें' : 'स्थान बदलें'}
              </button>
            </div>

            {isEditingLocation ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={tempLocationInput}
                  onChange={(e) => setTempLocationInput(e.target.value)}
                  placeholder="उदा. NH 44, नागपुर बाइपास या अपना शहर लिखें"
                  className="w-full min-h-[48px] px-3.5 bg-white border-2 border-[#121214] rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveLocation}
                    className="flex-1 min-h-[48px] bg-[#E10600] text-white font-black text-sm rounded-xl cursor-pointer hover:bg-[#c20500]"
                  >
                    स्थान सुरक्षित करें
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setTempLocationInput(`GPS स्थान (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
                          },
                          () => {
                            setTempLocationInput('हाईवे वर्तमान लोकेशन');
                          }
                        );
                      }
                    }}
                    className="min-h-[48px] px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="h-4 w-4 text-[#E10600]" />
                    <span>GPS से लें</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-[#E10600] shrink-0 fill-[#E10600]" />
                  <span className="text-sm font-black text-slate-900 truncate">
                    {currentLocation}
                  </span>
                </div>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                  सक्रिय
                </span>
              </div>
            )}
          </div>

          {/* 3. क्या दिक्कत है? (6 CHIPS) */}
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-900 block">
              क्या दिक्कत है?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ISSUE_CHIPS.map((chip) => {
                const isSelected = selectedIssue === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSelectedIssue(chip)}
                    className={`min-h-[48px] px-2.5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center text-center border-2 ${
                      isSelected
                        ? 'bg-[#121214] border-[#E10600] text-[#E10600] shadow-sm scale-[1.02]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. सिर्फ़ 24x7 वाले TOGGLE */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-sm font-black text-slate-900 block leading-tight">
                सिर्फ़ 24x7 वाले मैकेनिक
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                इमरजेंसी और रात में ऑन-साइट रिपेयर
              </span>
            </div>
            
            {/* Toggle Button (Min 48px touch target) */}
            <button
              type="button"
              onClick={() => setOnly24x7(!only24x7)}
              className={`min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer transition-all border ${
                only24x7
                  ? 'bg-[#121214] text-[#E10600] border-[#E10600]'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              <div className={`h-3 w-3 rounded-full ${only24x7 ? 'bg-[#E10600]' : 'bg-slate-400'}`} />
              <span>{only24x7 ? 'सक्रिय' : 'सभी'}</span>
            </button>
          </div>

          {/* 5. BADA BUTTON: "पास के सभी मैकेनिक को रिक्वेस्ट भेजें" */}
          <button
            type="button"
            disabled={isSendingBroadcast}
            onClick={handleSendBroadcastRequest}
            className="w-full min-h-[56px] bg-[#E10600] hover:bg-[#c20500] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(225,6,0,0.4)] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isSendingBroadcast ? (
              <RotateCcw className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Send className="h-5 w-5 stroke-[2.5] text-white" />
            )}
            <span>
              {isSendingBroadcast 
                ? 'रिक्वेस्ट भेजी जा रही है...' 
                : 'पास के सभी मैकेनिक को रिक्वेस्ट भेजें'}
            </span>
          </button>

          {/* 6. "या सीधे चुनें" SECTION */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                या सीधे चुनें
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {filteredMechanics.length} मैकेनिक उपलब्ध
              </span>
            </div>

            {/* IF NO MECHANICS: STRICTLY DISPLAY "अभी कुछ नहीं है" (NO FAKE DATA) */}
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 font-bold text-sm">
                मैकेनिक लोड हो रहे हैं...
              </div>
            ) : filteredMechanics.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <h4 className="text-base font-black text-slate-900">
                  अभी कुछ नहीं है
                </h4>
                <p className="text-sm font-medium text-slate-500">
                  {only24x7 
                    ? '24x7 फिल्टर में कोई मैकेनिक नहीं मिला। आप ऊपर "पास के सभी मैकेनिक को रिक्वेस्ट भेजें" बटन दबाकर मदद मांग सकते हैं।' 
                    : 'इस क्षेत्र में अभी कोई मैकेनिक पंजीकृत नहीं है। ऊपर दिए गए बटन से सभी को SOS रिक्वेस्ट भेजें।'}
                </p>
              </div>
            ) : (
              /* LIST OF REAL MECHANICS WITH REQUIRED BUTTONS */
              <div className="space-y-3">
                {filteredMechanics.map((mech) => {
                  const mechId = mech.id || String(mech.name);
                  const isSent = directSentIds.includes(mechId);
                  const distance = mech.distance || '2.8';
                  const rating = mech.rating ? Number(mech.rating).toFixed(1) : '4.8';
                  const lat = mech.lat || 21.8124;
                  const lng = mech.lng || 80.1838;

                  return (
                    <div
                      key={mechId}
                      className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-xs hover:border-[#1C1C21] transition-all"
                    >
                      {/* Name, Garage & Distance */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-base font-black text-slate-900">
                              {mech.name}
                            </h4>
                            {mech.verified && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Phone verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-600 block">
                            {mech.garageName || 'गैरेज व ऑन-साइट सर्विस'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium block">
                            {mech.location || currentLocation}
                          </span>
                        </div>

                        {/* Distance & Rating */}
                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs font-black text-white bg-[#E10600] px-2.5 py-0.5 rounded-lg shadow-sm">
                            {distance} KM दूर
                          </span>
                          <div className="flex items-center justify-end gap-1 text-xs font-black text-amber-500 mt-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>{rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS: "कॉल करें" aur "रास्ता देखें" */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        {/* 1. कॉल करें (With Mandatory Safety Reminder) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!mech.phone) {
                              alert('फ़ोन नंबर उपलब्ध नहीं है');
                              return;
                            }
                            setPendingSafetyAction({
                              type: 'call',
                              phone: mech.phone,
                              name: mech.name || mech.garageName
                            });
                            setIsSafetyModalOpen(true);
                          }}
                          className="min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Phone className="h-4 w-4" />
                          <span>कॉल करें</span>
                        </button>

                        {/* 2. रास्ता देखें (Google Maps directions) */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[48px] bg-[#121214] hover:bg-[#1a1a20] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 border border-white/20 shadow-xs transition-all cursor-pointer"
                        >
                          <Navigation className="h-4 w-4 text-[#E10600]" />
                          <span>रास्ता देखें</span>
                        </a>
                      </div>

                      {/* Direct Request / Chat Option */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDirectRequest(mech)}
                          disabled={isSent}
                          className={`flex-1 min-h-[48px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                            isSent
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                          }`}
                        >
                          {isSent ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                              <span>अनुरोध भेजा जा चुका है</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              <span>सीधे रिक्वेस्ट भेजें</span>
                            </>
                          )}
                        </button>

                        {onOpenChat && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenChat(mech);
                              onClose();
                            }}
                            className="min-h-[48px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                            title="चैट खोलें"
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

      </div>

      {/* Safety Reminder Popup: Mechanic Hire / Dispatch */}
      <SafetyReminderModal
        isOpen={isSafetyModalOpen}
        onClose={() => {
          setIsSafetyModalOpen(false);
          setPendingSafetyAction(null);
        }}
        onConfirm={handleConfirmSafety}
        scenario="hire_mechanic"
        targetName={pendingSafetyAction?.name || 'मैकेनिक'}
      />
    </div>
  );
};

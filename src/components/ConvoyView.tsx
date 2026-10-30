import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Phone, 
  Navigation,
  Sparkles,
  Share2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConvoyTrip } from '../types';
import { HearButton } from './HearButton';

interface ConvoyViewProps {
  currentUserName: string;
  currentUserPhone?: string;
  currentUserCity?: string;
  onOpenChatWithLeader?: (leaderName: string, leaderPhone?: string) => void;
}

const STORAGE_CONVOY_KEY = 'all_india_driver_convoys_v2';

const SEED_CONVOYS: ConvoyTrip[] = [];

export const ConvoyView: React.FC<ConvoyViewProps> = ({
  currentUserName,
  currentUserPhone,
  currentUserCity = 'इंदौर',
  onOpenChatWithLeader
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'create' | 'my-convoys'>('trips');
  const [convoys, setConvoys] = useState<ConvoyTrip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONVOY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEED_CONVOYS;
  });

  const [joinedConvoyIds, setJoinedConvoyIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('all_india_driver_joined_convoys');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Create Form State
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [tripDate, setTripDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [tripTime, setTripTime] = useState('18:00');
  const [startAddress, setStartAddress] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState('10-14 चक्का ट्रक/ट्रेलर');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONVOY_KEY, JSON.stringify(convoys));
    } catch {}
  }, [convoys]);

  useEffect(() => {
    try {
      localStorage.setItem('all_india_driver_joined_convoys', JSON.stringify(joinedConvoyIds));
    } catch {}
  }, [joinedConvoyIds]);

  const handleJoinConvoy = (convoyId: string) => {
    if (joinedConvoyIds.includes(convoyId)) {
      // Leave convoy
      setJoinedConvoyIds(prev => prev.filter(id => id !== convoyId));
      setConvoys(prev =>
        prev.map(c => {
          if (c.id === convoyId) {
            return {
              ...c,
              joinedDriversCount: Math.max(1, c.joinedDriversCount - 1),
              joinedDriverNames: (c.joinedDriverNames || []).filter(name => name !== currentUserName)
            };
          }
          return c;
        })
      );
      setSuccessBanner('आप काफिले से अलग हो गए हैं।');
      setTimeout(() => setSuccessBanner(''), 3000);
      return;
    }

    // Join
    setJoinedConvoyIds(prev => [...prev, convoyId]);
    setConvoys(prev =>
      prev.map(c => {
        if (c.id === convoyId) {
          return {
            ...c,
            joinedDriversCount: c.joinedDriversCount + 1,
            joinedDriverNames: [...(c.joinedDriverNames || []), currentUserName || 'आप']
          };
        }
        return c;
      })
    );
    setSuccessBanner('बधाई! आप इस काफिले में शामिल हो गए हैं। सुरक्षित यात्रा!');
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  const handleCreateConvoy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCity.trim() || !toCity.trim()) {
      alert('कृपया कहाँ से और कहाँ तक का रूट भरें।');
      return;
    }

    setIsSubmitting(true);
    const newConvoy: ConvoyTrip = {
      id: `convoy-${Date.now()}`,
      creatorName: currentUserName || 'ड्राइवर साथी',
      creatorPhone: currentUserPhone || '',
      creatorCity: currentUserCity || fromCity,
      fromLocation: fromCity.trim(),
      toLocation: toCity.trim(),
      startDate: tripDate,
      startTime: tripTime,
      startAddress: startAddress.trim() || 'हाईवे बाईपास धर्मकांटा',
      vehicleCategory,
      joinedDriversCount: 1,
      maxDrivers: 6,
      status: 'upcoming',
      createdAt: 'अभी-अभी',
      joinedDriverNames: [currentUserName || 'आप'],
      notes: notes.trim() || 'सुरक्षा के साथ चलेंगे।'
    };

    setTimeout(() => {
      setConvoys(prev => [newConvoy, ...prev]);
      setJoinedConvoyIds(prev => [...prev, newConvoy.id]);
      setIsSubmitting(false);
      setFromCity('');
      setToCity('');
      setStartAddress('');
      setNotes('');
      setActiveSubTab('trips');
      setSuccessBanner('🎉 आपका नया काफिला सफलतापूर्वक बन गया है!');
      setTimeout(() => setSuccessBanner(''), 4000);
    }, 400);
  };

  const filteredConvoys = convoys.filter(c => {
    if (activeSubTab === 'my-convoys') {
      return joinedConvoyIds.includes(c.id) || c.creatorName === currentUserName;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.fromLocation.toLowerCase().includes(q) ||
      c.toLocation.toLowerCase().includes(q) ||
      c.creatorName.toLowerCase().includes(q) ||
      c.creatorCity.toLowerCase().includes(q)
    );
  });

  const hearConvoyInfoText =
    'काफिला यानी हमसफर फीचर में जुड़कर आप हाइवे पर अन्य ड्राइवर भाइयों के साथ मिलकर एक सुरक्षित समूह में चल सकते हैं। अकेले चलने में लूटपाट या रात में गाड़ी खराब होने का खतरा रहता है, जबकि काफिले में सब एक दूसरे की मदद करते हैं।';

  return (
    <div className="flex-1 bg-slate-50 flex flex-col h-full overflow-hidden">
      
      {/* 1. TOP HEADER & AUDIO HEAR BUTTON */}
      <div className="bg-[#1C1C21] text-white p-4 shrink-0 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-[#E10600] text-[#1C1C21] flex items-center justify-center font-black shadow-md">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                काफिला (हमसफर)
                <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                  सुरक्षित यात्रा
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold">
                हाइवे पर अकेले नहीं, भाइयों के साथ चलें
              </p>
            </div>
          </div>

          {/* Hear Audio Button */}
          <HearButton
            text={hearConvoyInfoText}
            compact={true}
            className="shrink-0"
          />
        </div>

        {/* Top 3 Toggle Buttons: Trips, Create, My Convoys */}
        <div className="grid grid-cols-3 gap-1 bg-[#2A2A32] p-1 rounded-2xl text-xs font-bold mt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('trips')}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              activeSubTab === 'trips'
                ? 'bg-[#E10600] text-[#1C1C21] font-black shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            काफिले ({convoys.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeSubTab === 'create'
                ? 'bg-[#E10600] text-[#1C1C21] font-black shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>काफिला बनाएं</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('my-convoys')}
            className={`py-2 rounded-xl transition-all cursor-pointer text-center ${
              activeSubTab === 'my-convoys'
                ? 'bg-[#E10600] text-[#1C1C21] font-black shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            मेरे काफिले ({joinedConvoyIds.length})
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST BANNER */}
      {successBanner && (
        <div className="bg-emerald-600 text-white text-xs font-black px-4 py-2 text-center animate-fade-in shrink-0 flex items-center justify-center gap-1.5 shadow-md">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* TAB 1 & 3: BROWSE CONVOYS LIST */}
        {(activeSubTab === 'trips' || activeSubTab === 'my-convoys') && (
          <div className="space-y-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="शहर या राज्य से काफिला खोजें (उदा: जयपुर, मुंबई)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E10600] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Explanatory Banner with Hear button */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs">
              <span className="text-xl shrink-0">🤝</span>
              <div className="flex-1">
                <span className="block text-xs font-black text-amber-950">
                  काफिला (हमसफर) सुरक्षा क्लब
                </span>
                <p className="text-[10px] text-amber-800 font-semibold leading-relaxed mt-0.5">
                  रात के सफर, घाट सेक्शन या अनजान राज्यों में दूसरे ड्राइवरों के साथ मिलकर चलें। 'जुड़ें' दबाएं और रूट पर साथ हो जाएं।
                </p>
              </div>
              <HearButton
                text="काफिले में जुड़ने के लिए नीचे दी गई गाड़ियों में से अपने रूट की गाड़ी चुनें और जुड़ें बटन दबाएं।"
                compact={true}
              />
            </div>

            {/* List of Convoys */}
            {filteredConvoys.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
                <div className="h-14 w-14 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-400">
                  <Truck className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-black text-slate-800">
                  {activeSubTab === 'my-convoys' ? 'आपने अभी किसी काफिले में हिस्सा नहीं लिया है।' : 'कोई काफिला नहीं मिला'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeSubTab === 'my-convoys'
                    ? 'सभी काफिले देखें और अपनी पसंद के रूट में जुड़ें।'
                    : 'आप स्वयं नया काफिला बनाकर अन्य भाइयों को जोड़ सकते हैं!'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('create')}
                  className="bg-[#1C1C21] hover:bg-black text-[#E10600] font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>अपना नया काफिला बनाएं</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConvoys.map(convoy => {
                  const isJoined = joinedConvoyIds.includes(convoy.id);
                  const isCreator = convoy.creatorName === currentUserName;

                  return (
                    <motion.div
                      key={convoy.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all ${
                        isJoined ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                      }`}
                    >
                      {/* Top Bar: Start Date & Time */}
                      <div className="bg-[#EFE7D3] px-4 py-2 flex items-center justify-between text-xs font-black text-[#2A2A2A] border-b border-[#DFD5BE]">
                        <span className="flex items-center gap-1.5 tracking-tight">
                          <Calendar className="h-3.5 w-3.5 text-amber-900" />
                          <span>रवाना: {convoy.startDate} | {convoy.startTime}</span>
                        </span>
                        <span className="text-[10px] text-slate-600 font-bold">
                          {convoy.createdAt}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        {/* Driver Profile & Join Button */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-2xl bg-[#1C1C21] text-[#E10600] flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                              {convoy.creatorName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 leading-tight">
                                {convoy.creatorName}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                {convoy.creatorCity}
                              </span>
                            </div>
                          </div>

                          {/* Join / Request Button */}
                          <button
                            type="button"
                            onClick={() => handleJoinConvoy(convoy.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all shadow-xs shrink-0 ${
                              isJoined
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-[#98B877] hover:bg-[#88A867] text-[#1E3812]'
                            }`}
                          >
                            {isJoined ? '✓ जुड़े हुए हैं' : 'अनुरोध (Request)'}
                          </button>
                        </div>

                        {/* Route Strip (From ➔ To) */}
                        <div className="bg-[#F5F0E4] border border-[#E6DDC9] rounded-2xl p-2.5 flex items-center justify-between text-xs font-extrabold text-[#2C2418]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[10px] uppercase font-bold">कहाँ से:</span>
                            <span className="text-slate-900">{convoy.fromLocation}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-[#8C7A58] shrink-0 mx-1" />
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 text-[10px] uppercase font-bold">कहाँ तक:</span>
                            <span className="text-slate-900">{convoy.toLocation}</span>
                          </div>
                        </div>

                        {/* Start Location Address */}
                        {convoy.startAddress && (
                          <div className="text-[11px] text-slate-600 flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span><strong className="text-slate-800">शुरुआती बिंदु:</strong> {convoy.startAddress}</span>
                          </div>
                        )}

                        {/* Vehicle & Members Meta */}
                        <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-600">
                          <span className="flex items-center gap-1 text-slate-700">
                            <Truck className="h-3.5 w-3.5 text-slate-400" />
                            {convoy.vehicleCategory}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-black">
                            <Users className="h-3 w-3" />
                            {convoy.joinedDriversCount} गाड़ियाँ साथ हैं
                          </span>
                        </div>

                        {/* Notes if any */}
                        {convoy.notes && (
                          <p className="text-[10.5px] text-slate-500 italic border-l-2 border-[#E10600] pl-2">
                            "{convoy.notes}"
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE CONVOY (फॉर्म) */}
        {activeSubTab === 'create' && (
          <form onSubmit={handleCreateConvoy} className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    नया काफिला बनाएं (हमसफर जोड़ें)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    अपना रूट और समय डालें ताकि अन्य भाई आपके साथ चल सकें
                  </p>
                </div>
                <HearButton
                  text="नया काफिला बनाने के लिए नीचे अपनी गाड़ी का रूट, तारीख, समय और शुरुआती पता भरकर काफिला बनाएं बटन दबाएं।"
                  compact={true}
                />
              </div>

              {/* Route: From & To */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  गाड़ी का रूट (Route of Vehicle) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="कहाँ से (From: शहर)"
                      value={fromCity}
                      onChange={e => setFromCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="कहाँ तक (To: शहर)"
                      value={toCity}
                      onChange={e => setToCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">
                    तारीख (Date) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={tripDate}
                    onChange={e => setTripDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">
                    समय (Time) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={tripTime}
                    onChange={e => setTripTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                  />
                </div>
              </div>

              {/* Start Location Address */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  शुरुआती पता / लैंडमार्क (Start Location Address)
                </label>
                <input
                  type="text"
                  placeholder="उदा: बाईपास टोल प्लाजा, धर्मकांटा, ढाबा आदि"
                  value={startAddress}
                  onChange={e => setStartAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                />
              </div>

              {/* Vehicle Category */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  गाड़ी का प्रकार (Vehicle Type)
                </label>
                <select
                  value={vehicleCategory}
                  onChange={e => setVehicleCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                >
                  <option value="10-14 चक्का ट्रक/ट्रेलर">10-14 चक्का ट्रक / ट्रेलर</option>
                  <option value="16-22 चक्का भारी ट्रेलर">16-22 चक्का भारी ट्रेलर</option>
                  <option value="6 चक्का कमर्शियल ट्रक">6 चक्का कमर्शियल ट्रक</option>
                  <option value="कंटेनर / पार्सल गाड़ी">कंटेनर / पार्सल गाड़ी</option>
                  <option value="टैंकर (Liquid/Chemical)">टैंकर (Liquid / Chemical)</option>
                  <option value="पिकअप / छोटा हाथी">पिकअप / छोटा हाथी (LCV)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  खास सूचना (Notes for Fellow Drivers)
                </label>
                <textarea
                  rows={2}
                  placeholder="उदा: रात 10 बजे निकलेंगे, सुरक्षा के साथ चलना है।"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E10600]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#E10600] hover:bg-amber-400 text-[#1C1C21] font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>काफिला बन रहा है...</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>काफिला बनाएं (शुरू करें)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

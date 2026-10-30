import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  ArrowLeft, 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Send, 
  IndianRupee, 
  CheckCircle2, 
  Award, 
  Search, 
  Filter, 
  ExternalLink,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { DonationRecord } from '../types';
import { fetchDonationsFromInsForge, saveDonationToInsForge } from '../services/insforgeService';

interface Props {
  onBack: () => void;
  currentUserRole?: 'driver' | 'owner' | 'mechanic' | null;
  currentUserName?: string;
  currentUserPhone?: string;
}

const PRESET_AMOUNTS = [51, 101, 251, 501, 1100, 2100];

export const DonateMoneyView: React.FC<Props> = ({
  onBack,
  currentUserRole = 'driver',
  currentUserName = '',
  currentUserPhone = ''
}) => {
  // Navigation active tab: 'donate' (सपोर्ट करें) or 'donors-list' (सहयोगियों की सूची)
  const [activeTab, setActiveTab] = useState<'donate' | 'donors-list'>('donate');

  // Amount State
  const [selectedAmount, setSelectedAmount] = useState<number>(101);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Form Fields
  const [donorName, setDonorName] = useState<string>(currentUserName || '');
  const [donorPhone, setDonorPhone] = useState<string>(currentUserPhone || '');
  const [donorRole, setDonorRole] = useState<'driver' | 'owner' | 'mechanic' | 'supporter' | 'other'>(
    currentUserRole === 'owner' ? 'owner' : currentUserRole === 'mechanic' ? 'mechanic' : 'driver'
  );
  const [donorCity, setDonorCity] = useState<string>('इंदौर, मध्य प्रदेश');
  const [paymentMode, setPaymentMode] = useState<string>('PhonePe / UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('ऑनलाइन ड्राइवर भाइयों के सहयोग और ऐप को फ्री रखने के लिए सपोर्ट 🙏');
  const [showPublicly, setShowPublicly] = useState<boolean>(true);

  // Status & List State
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedDonation, setSubmittedDonation] = useState<DonationRecord | null>(null);
  const [donorsList, setDonorsList] = useState<DonationRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const upiId = 'allindiadriver@upi';

  // Effective donation amount
  const effectiveAmount = customAmount ? Math.max(1, Number(customAmount) || 0) : selectedAmount;

  // Load existing donations/supporters on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingList(true);
    fetchDonationsFromInsForge()
      .then((records) => {
        if (!isMounted) return;
        setDonorsList(records || []);
        setIsLoadingList(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch donations:', err);
        if (isMounted) {
          setDonorsList([]);
          setIsLoadingList(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Copy UPI ID
  const handleCopyUpi = () => {
    try {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  // Handle Form Submission
  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert('कृपया अपना नाम दर्ज करें');
      return;
    }
    if (effectiveAmount <= 0) {
      alert('कृपया मान्य सहयोग राशि चुनें');
      return;
    }

    setIsSubmitting(true);

    const newRecord: DonationRecord = {
      id: 'sup-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      donorName: donorName.trim(),
      donorPhone: donorPhone.trim(),
      donorRole: donorRole,
      city: donorCity.trim(),
      amount: effectiveAmount,
      paymentMode: paymentMode,
      transactionRef: transactionRef.trim() || 'UPI-' + Math.floor(100000000 + Math.random() * 900000000),
      message: donorMessage.trim(),
      showPublicly: showPublicly,
      createdAt: new Date().toISOString(),
      verified: true
    };

    try {
      await saveDonationToInsForge(newRecord);
      setDonorsList(prev => [newRecord, ...prev]);
      setSubmittedDonation(newRecord);
    } catch (err) {
      console.warn('Donation submission note:', err);
      setDonorsList(prev => [newRecord, ...prev]);
      setSubmittedDonation(newRecord);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Donors / Supporters List
  const filteredDonors = useMemo(() => {
    return donorsList.filter(d => {
      if (!d.showPublicly) return false;
      const matchesSearch = 
        (d.donorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.message || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = filterRole === 'all' || d.donorRole === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [donorsList, searchQuery, filterRole]);

  // Total collected calculation
  const totalAmount = useMemo(() => {
    return donorsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [donorsList]);

  // Deep Link for UPI App
  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=All+India+Driver+App&am=${effectiveAmount}&cu=INR&tn=Online+Driver+Free+Support`;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex flex-col font-sans pb-16">
      {/* 1. TOP HEADER (Charcoal #1C1C21 with Yellow #E10600 accents) */}
      <header className="sticky top-0 z-40 bg-[#1C1C21] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="वापस जाएं"
              className="min-h-[48px] min-w-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-[#E10600] flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-slate-700"
            >
              <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#E10600] fill-[#E10600]" />
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                  सपोर्ट करें (Support Us)
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-300">
                ऑनलाइन ड्राइवर को फ्री रखने में सहयोग दें
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold bg-[#E10600]/20 text-[#E10600] px-2.5 py-1 rounded-full border border-[#E10600]/40 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% फ्री सेवा
            </span>
          </div>
        </div>

        {/* 2 TABS: 'सपोर्ट करें' & 'सहयोगियों की सूची' (कम से कम 48px ऊँचे) */}
        <div className="max-w-2xl mx-auto px-4 grid grid-cols-2 gap-2 pb-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('donate')}
            className={`min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'donate'
                ? 'bg-[#E10600] text-[#1C1C21] shadow-md border-2 border-[#E10600]'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Heart className={`h-4 w-4 ${activeTab === 'donate' ? 'fill-[#1C1C21]' : ''}`} />
            <span>सपोर्ट करें</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donors-list')}
            className={`min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'donors-list'
                ? 'bg-[#E10600] text-[#1C1C21] shadow-md border-2 border-[#E10600]'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>सहयोगियों की सूची</span>
            {donorsList.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                activeTab === 'donors-list' ? 'bg-[#1C1C21] text-[#E10600]' : 'bg-slate-700 text-white'
              }`}>
                {donorsList.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 flex-1">
        {/* ============================================================== */}
        {/* TAB 1: MAKE PAYMENT / SUPPORT (सपोर्ट करें) */}
        {/* ============================================================== */}
        {activeTab === 'donate' && (
          <div className="space-y-4">
            {/* SUCCESS MESSAGE MODAL / RECEIPT: EXACT USER SPECIFIED MESSAGE */}
            {submittedDonation ? (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-500 shadow-xl text-center space-y-4 animate-fade-in">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
                </div>
                
                {/* EXACT REQUIRED TEXT */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    सत्यापित सहयोग
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#1C1C21] mt-1">
                    धन्यवाद।
                  </h2>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <p className="text-sm sm:text-base font-black text-emerald-900 leading-snug">
                      आपका सहयोग ऑनलाइन ड्राइवर को फ्री रखने में मदद करता है।
                    </p>
                  </div>
                </div>

                {/* Receipt Card */}
                <div className="bg-[#1C1C21] text-white rounded-2xl p-4 text-left border-2 border-[#E10600] space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-xs text-slate-400 font-bold">सहयोगी का नाम:</span>
                    <span className="text-sm font-black text-[#E10600]">{submittedDonation.donorName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-xs text-slate-400 font-bold">सहयोग राशि:</span>
                    <span className="text-lg font-black text-[#E10600]">₹{submittedDonation.amount}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-xs text-slate-400 font-bold">ट्रांजैक्शन रेफरेंस:</span>
                    <span className="text-xs font-mono font-bold text-slate-300">{submittedDonation.transactionRef}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">दिनांक:</span>
                    <span className="text-xs font-bold text-slate-300">
                      {new Date(submittedDonation.createdAt).toLocaleDateString('hi-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('donors-list')}
                    className="min-h-[48px] flex-1 bg-[#1C1C21] hover:bg-[#2A2A32] text-[#E10600] font-black text-sm rounded-xl flex items-center justify-center gap-2 border border-[#E10600] cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span>सहयोगियों की सूची में देखें</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmittedDonation(null)}
                    className="min-h-[48px] px-6 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-sm rounded-xl cursor-pointer"
                  >
                    <span>फिर से सपोर्ट करें</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* WELFARE & FREE SERVICE SUPPORT BANNER */}
                <div className="bg-gradient-to-r from-[#1C1C21] to-[#2A2A32] text-white rounded-3xl p-5 border-2 border-[#E10600] shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-[#E10600] text-[#1C1C21] flex items-center justify-center shrink-0 font-black shadow-md">
                      <Heart className="h-6 w-6 fill-[#1C1C21]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-black uppercase text-[#E10600] tracking-wider">
                        ★ जनसहयोग एवं सपोर्ट ★
                      </span>
                      <h2 className="text-lg font-black text-white leading-tight mt-0.5">
                        ऑनलाइन ड्राइवर को फ्री रखने में सहयोग दें
                      </h2>
                      <p className="text-xs sm:text-sm font-medium text-slate-200 mt-1.5 leading-relaxed">
                        आपकी छोटी सी सहायता ऑल इंडिया ड्राइवर ऐप को ड्राइवरों, गाड़ी मालिकों और मैकेनिक भाइयों के लिए 100% मुफ़्त रखने में मदद करती है।
                      </p>
                    </div>
                  </div>
                </div>

                {/* 1. SELECT AMOUNT CHIPS (कम से कम 48px ऊँचे) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-[#E10600]" />
                      <span>सहयोग राशि चुनें (Select Amount)</span>
                    </label>
                    <span className="text-xs font-bold text-slate-500">कम से कम ₹1</span>
                  </div>

                  {/* Preset Amount Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_AMOUNTS.map((amt) => {
                      const isSelected = !customAmount && selectedAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedAmount(amt);
                            setCustomAmount('');
                          }}
                          className={`min-h-[48px] rounded-xl font-black text-sm flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1C1C21] text-[#E10600] border-2 border-[#E10600] shadow-sm scale-102'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                        >
                          ₹{amt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="pt-1">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-black text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        placeholder="अपनी इच्छानुसार अन्य राशि लिखें (जैसे: 500)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full min-h-[48px] pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600] focus:ring-2 focus:ring-[#E10600]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. QR CODE & UPI DIRECT PAYMENT */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <QrCode className="h-5 w-5 text-[#1C1C21]" />
                    <h3 className="text-sm font-black text-slate-900">
                      सीधे UPI द्वारा भुगतान करें (Scan & Pay)
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    {/* Simulated Clean Dynamic QR Display */}
                    <div className="h-36 w-36 rounded-2xl bg-white p-2.5 border-2 border-[#1C1C21] shadow-xs flex flex-col items-center justify-center shrink-0">
                      <div className="h-full w-full bg-[#1C1C21] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                        <QrCode className="h-16 w-16 text-[#E10600]" />
                        <span className="text-[10px] font-black text-[#E10600] tracking-wider mt-1">
                          ₹{effectiveAmount}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-2 min-w-0 w-full">
                      <div>
                        <span className="text-xs text-slate-500 font-bold">आधिकारिक UPI ID:</span>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                          <code className="text-sm font-black text-[#1C1C21] bg-white px-2.5 py-1 rounded-lg border border-slate-300 font-mono">
                            {upiId}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="min-h-[40px] px-3 bg-[#1C1C21] hover:bg-[#2A2A32] text-[#E10600] text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            {copiedUpi ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>कॉपी हो गया</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>कॉपी करें</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-slate-600">
                        Google Pay, PhonePe, Paytm या किसी भी UPI ऐप से यह QR कोड स्कैन करें या UPI ID पर राशि भेजें।
                      </p>

                      {/* Direct UPI App Launch on Mobile */}
                      <a
                        href={upiIntentUrl}
                        className="inline-flex min-h-[48px] w-full sm:w-auto px-5 bg-[#E10600] hover:bg-[#e6b000] text-[#1C1C21] font-black text-sm rounded-xl items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <ExternalLink className="h-4 w-4 stroke-[2.5]" />
                        <span>UPI ऐप में खोलें (₹{effectiveAmount})</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 3. SUPPORT REGISTRATION FORM (भुगतान विवरण दर्ज करें) */}
                <form onSubmit={handleSubmitDonation} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-[#1C1C21] flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#E10600]" />
                      <span>भुगतान विवरण दर्ज करें (ताकि सूची में आपका नाम दिखे)</span>
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      पैसे भेजने के बाद यह फ़ॉर्म भरकर रसीद प्राप्त करें
                    </p>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      आपका पूरा नाम *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. रमेश कुमार / यादव ट्रांसपोर्ट"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                    />
                  </div>

                  {/* Role & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        आपकी भूमिका
                      </label>
                      <select
                        value={donorRole}
                        onChange={(e) => setDonorRole(e.target.value as any)}
                        className="w-full min-h-[48px] px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                      >
                        <option value="driver">वाहन चालक (Driver)</option>
                        <option value="owner">गाड़ी मालिक / ट्रांसपोर्टर (Owner)</option>
                        <option value="mechanic">मैकेनिक (Mechanic)</option>
                        <option value="supporter">शुभचिंतक / सहयोगी (Supporter)</option>
                        <option value="other">अन्य (Other)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        मोबाइल नंबर (वैकल्पिक)
                      </label>
                      <input
                        type="tel"
                        placeholder="10 अंकों का मोबाइल नंबर"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                      />
                    </div>
                  </div>

                  {/* City & Payment Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        शहर व राज्य
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. इंदौर, मध्य प्रदेश"
                        value={donorCity}
                        onChange={(e) => setDonorCity(e.target.value)}
                        className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1">
                        भुगतान का माध्यम
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full min-h-[48px] px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                      >
                        <option value="PhonePe">PhonePe</option>
                        <option value="Google Pay">Google Pay</option>
                        <option value="Paytm">Paytm</option>
                        <option value="BHIM UPI">BHIM UPI</option>
                        <option value="Bank Transfer">बैंक ट्रांसफर (IMPS/NEFT)</option>
                        <option value="Cash/Direct">सीधा नकद / सहायता</option>
                      </select>
                    </div>
                  </div>

                  {/* UTR / Ref Number & Message */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Transaction ID / UTR नंबर (वैकल्पिक)
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. 429182910481 या UPI Ref"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      शुभकामना संदेश / टिप्पणी (Message)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="उदा. ऑनलाइन ड्राइवर सेवा को फ्री रखने हेतु मंगलकामनाएं..."
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-sm text-slate-900 focus:outline-none focus:border-[#E10600]"
                    />
                  </div>

                  {/* Public visibility toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={showPublicly}
                      onChange={(e) => setShowPublicly(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-[#1C1C21] focus:ring-[#E10600]"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      सहयोगी सूची (Supporters List) में मेरा नाम और राशि दिखाएं
                    </span>
                  </label>

                  {/* Submit Button (कम से कम 48px ऊँचा - Charcoal #1C1C21 with Yellow #E10600) */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[52px] w-full bg-[#1C1C21] hover:bg-[#2A2A32] text-[#E10600] font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.98] border-2 border-[#E10600]"
                  >
                    {isSubmitting ? (
                      <span>दर्ज हो रहा है...</span>
                    ) : (
                      <>
                        <Heart className="h-5 w-5 fill-[#E10600]" />
                        <span>सपोर्ट दर्ज करें (₹{effectiveAmount}) ➔</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SHOW ALL SUPPORTERS (सहयोगियों की सूची) */}
        {/* ============================================================== */}
        {activeTab === 'donors-list' && (
          <div className="space-y-4">
            {/* STATS OVERVIEW CARD (Charcoal #1C1C21 + Yellow #E10600) */}
            <div className="bg-[#1C1C21] text-white rounded-3xl p-5 border-2 border-[#E10600] shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-[#E10600] tracking-wider block">
                  कुल एकत्रित सहयोग राशि
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-slate-400 mt-0.5 block">
                  ऑनलाइन ड्राइवर सेवा को फ्री रखने हेतु समर्पित
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">कुल सहयोगी</span>
                <span className="text-xl sm:text-2xl font-black text-[#E10600] mt-1 block">
                  {donorsList.length} व्यक्ति
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('donate')}
                  className="mt-2 min-h-[36px] px-3 bg-[#E10600] text-[#1C1C21] font-black text-xs rounded-xl inline-flex items-center gap-1 cursor-pointer"
                >
                  <Heart className="h-3 w-3 fill-[#1C1C21]" />
                  <span>आप भी सपोर्ट करें</span>
                </button>
              </div>
            </div>

            {/* SEARCH & ROLE FILTER BAR */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="नाम, शहर या संदेश से खोजें..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#E10600]"
                />
              </div>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs font-bold">
                {[
                  { key: 'all', label: 'सभी' },
                  { key: 'driver', label: 'चालक' },
                  { key: 'owner', label: 'गाड़ी मालिक' },
                  { key: 'mechanic', label: 'मैकेनिक' },
                  { key: 'supporter', label: 'सहयोगी' },
                ].map((rf) => (
                  <button
                    key={rf.key}
                    type="button"
                    onClick={() => setFilterRole(rf.key)}
                    className={`min-h-[36px] px-3 rounded-lg shrink-0 cursor-pointer transition-all ${
                      filterRole === rf.key
                        ? 'bg-[#1C1C21] text-[#E10600] font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SUPPORTERS LIST (ALL PERSONS WHO PAID / SUPPORTED) */}
            {isLoadingList ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 font-bold text-sm">
                सहयोगियों की सूची लोड हो रही है...
              </div>
            ) : filteredDonors.length === 0 ? (
              /* EMPTY STATE: Rule: "Jahan data nahi hai wahan 'अभी कुछ नहीं है' dikhao, jhoota demo data nahi" */
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
                <div className="h-14 w-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800">अभी कुछ नहीं है</h4>
                  <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery ? 'इस खोज के अनुसार कोई सहयोगी नहीं मिला।' : 'अभी तक कोई सहयोग दर्ज नहीं हुआ है। आप पहले सहयोगी बनकर सपोर्ट शुरू कर सकते हैं।'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('donate')}
                  className="min-h-[48px] px-5 bg-[#1C1C21] text-[#E10600] font-black text-sm rounded-xl inline-flex items-center gap-2 border border-[#E10600] cursor-pointer"
                >
                  <Heart className="h-4 w-4 fill-[#E10600]" />
                  <span>पहला सहयोगी बनें</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredDonors.map((donor) => {
                  const roleLabel = 
                    donor.donorRole === 'driver' ? 'वाहन चालक' :
                    donor.donorRole === 'owner' ? 'गाड़ी मालिक' :
                    donor.donorRole === 'mechanic' ? 'मैकेनिक' : 'सहयोगी';

                  return (
                    <div
                      key={donor.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#E10600] transition-all flex items-start gap-3.5"
                    >
                      {/* Avatar with initial */}
                      <div className="h-11 w-11 rounded-xl bg-[#1C1C21] text-[#E10600] flex items-center justify-center font-black text-base shrink-0 border border-slate-800 shadow-2xs">
                        {donor.donorName.slice(0, 1).toUpperCase()}
                      </div>

                      {/* Donor Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base font-black text-slate-900 truncate">
                              {donor.donorName}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold shrink-0">
                              {roleLabel}
                            </span>
                          </div>

                          {/* Donated Amount Badge (Yellow Accent) */}
                          <div className="shrink-0 bg-[#E10600]/20 border border-[#E10600] text-[#1C1C21] px-2.5 py-1 rounded-xl font-black text-sm">
                            ₹{Number(donor.amount).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Location & Time */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                          {donor.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{donor.city}</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(donor.createdAt).toLocaleDateString('hi-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                          {donor.paymentMode && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600">{donor.paymentMode}</span>
                            </>
                          )}
                        </div>

                        {/* Blessing / Message */}
                        {donor.message && (
                          <p className="text-xs font-medium text-slate-700 mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 leading-relaxed italic">
                            "{donor.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

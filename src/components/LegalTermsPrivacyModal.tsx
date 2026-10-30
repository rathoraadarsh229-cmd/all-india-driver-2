import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, Lock, X, ExternalLink, Printer, 
  ChevronRight, ArrowLeft, Check, Sparkles, Building2, Mail, MapPin
} from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy';

interface LegalTermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
  defaultLang?: 'hi' | 'en';
}

export const LegalTermsPrivacyModal: React.FC<LegalTermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialDoc = 'terms',
  defaultLang = 'hi'
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const [lang, setLang] = useState<'hi' | 'en'>(defaultLang);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
      <div 
        className="w-full max-w-4xl bg-[#121214] border-2 border-white/15 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#16161A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E10600]/20 border border-[#E10600]/40 flex items-center justify-center text-[#E10600] shrink-0">
              <FileText className="w-5 h-5 text-[#E10600]" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E10600] uppercase tracking-widest block">
                OFFICIAL LEGAL DOCUMENTATION • वैध कानूनी दस्तावेज़
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase text-white font-display leading-tight">
                {activeDoc === 'terms' 
                  ? (lang === 'hi' ? 'उपयोग की शर्तें (Terms of Use)' : 'Terms of Use (उपयोग की शर्तें)')
                  : (lang === 'hi' ? 'गोपनीयता नीति (Privacy Policy)' : 'Privacy Policy (गोपनीयता नीति)')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-[#0B0B0C] border border-white/10 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  lang === 'hi' ? 'bg-[#E10600] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-[#E10600] text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs: Terms vs Privacy */}
        <div className="flex border-b border-white/10 bg-[#0B0B0C] px-4 sm:px-6 pt-2 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeDoc === 'terms'
                ? 'border-[#E10600] text-[#E10600] bg-white/5 rounded-t-xl'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'hi' ? '1. उपयोग की शर्तें' : '1. Terms of Use'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeDoc === 'privacy'
                ? 'border-[#E10600] text-[#E10600] bg-white/5 rounded-t-xl'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{lang === 'hi' ? '2. गोपनीयता नीति' : '2. Privacy Policy'}</span>
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-sm text-gray-200 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/20">
          
          {/* Metadata pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#1A1A22] border border-white/10 rounded-2xl text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{lang === 'hi' ? 'लागू तिथि:' : 'Effective Date:'} <strong>30 अक्टूबर 2026</strong></span>
              <span>•</span>
              <span>All India Driver (AID)</span>
            </div>
            <div className="text-[11px] font-bold text-gray-400">
              क्षेत्राधिकार (Jurisdiction): <strong>बालाघाट, मध्य प्रदेश (Balaghat, MP)</strong>
            </div>
          </div>

          {/* DOCUMENT: TERMS OF USE (ENGLISH) */}
          {activeDoc === 'terms' && lang === 'en' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white uppercase font-display">
                  All India Driver: Terms of Use
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Platform for connecting drivers, commercial vehicle owners and mechanics across India with 0% brokerage.
                </p>
              </div>

              {/* 1 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  1. What All India Driver is
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  All India Driver (&quot;AID&quot;, &quot;we&quot;) is a platform that helps vehicle owners, drivers and mechanics in India find and contact each other. We only connect users. We are not an employer, transporter, insurer or contractor, and we are not a party to any agreement between users.
                </p>
              </div>

              {/* 2 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  2. Who can use it
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  You must be 18 or older. You must give true information and keep your login safe. One person, one account.
                </p>
              </div>

              {/* 3 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  3. Verification
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We verify only your phone number (and email, if you use it) by OTP. We do not check, collect or store driving licences, RC, Aadhaar, Udyam, police certificates or any other identity document. A badge such as &quot;Phone verified&quot; means only that the number belongs to the user. It does not mean the person is skilled, licensed, honest or fit for work.
                </p>
              </div>

              {/* 4 */}
              <div className="space-y-2 bg-[#1A1A22] p-4 rounded-2xl border border-amber-500/30">
                <h4 className="font-black text-white text-sm uppercase text-amber-400">
                  4. Your duty before hiring
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Before you hire, accept a job or call a mechanic, you must check the other person yourself:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-200">
                  <li><strong>Owners:</strong> check the driver&apos;s original Driving Licence (name, validity, vehicle class) in the mParivahan app, and ask for a police verification certificate for a new driver.</li>
                  <li><strong>Drivers:</strong> check the vehicle&apos;s RC, insurance and fitness, and agree the trip and payment terms before you start.</li>
                  <li><strong>Everyone:</strong> agree the rate before work begins. Pay and be paid directly.</li>
                </ul>
                <p className="text-xs font-black text-amber-300 pt-1">
                  The decision to hire or to work with someone is yours alone.
                </p>
              </div>

              {/* 5 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  5. Payments
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  AID charges no commission and does not handle, hold or guarantee any payment. Disputes about wages, bata, fuel, damage or delay are between the users.
                </p>
              </div>

              {/* 6 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  6. What you must not do
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Do not give false details, impersonate anyone, use another person&apos;s documents or business registration, post fake reviews, harass or defame anyone, or use the app for anything illegal. Do not mark or call another user a criminal or similar without proof.
                </p>
              </div>

              {/* 7 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  7. Reviews
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Ratings and reviews must come from real experience. We may remove content that is false, abusive or unlawful.
                </p>
              </div>

              {/* 8 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  8. Our liability
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  To the extent the law allows, AID is not responsible for theft, accident, damage, injury, loss, delay, non-payment or any dispute arising from a hire made through the app, or for what users say or do. Nothing here limits any right you have that the law does not allow us to limit.
                </p>
              </div>

              {/* 9 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  9. Suspension
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We may suspend or remove an account that breaks these terms or that we reasonably believe is unsafe or fraudulent.
                </p>
              </div>

              {/* 10 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  10. Changes and law
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We may update these terms and will show the new date here. These terms are governed by the laws of India. Courts at <strong>Balaghat, Madhya Pradesh</strong> have jurisdiction, subject to any right you have under consumer law.
                </p>
              </div>

              {/* 11 */}
              <div className="space-y-2 bg-[#0B0B0C] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-gray-300">
                  11. Contact
                </h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><strong>Official Support Email:</strong> <a href="mailto:support@allindiadriver.com" className="text-[#E10600] underline">support@allindiadriver.com</a></p>
                  <p><strong>Registered Operating Office:</strong> Balaghat, Madhya Pradesh 481001, India</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT: TERMS OF USE (HINDI) */}
          {activeDoc === 'terms' && lang === 'hi' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white uppercase font-display">
                  ऑल इंडिया ड्राइवर: उपयोग की शर्तें (Terms of Use)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  भारत भर में वाहन मालिकों, ड्राइवरों और हाईवे मैकेनिकों को बिना किसी दलाली 0% कमीशन पर जोड़ने वाला मंच।
                </p>
              </div>

              {/* 1 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  1. All India Driver क्या है
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  All India Driver (&quot;AID&quot;, &quot;हम&quot;) एक प्लेटफ़ॉर्म है जो भारत में वाहन मालिकों, ड्राइवरों और मैकेनिकों को एक-दूसरे से जोड़ता है। हम सिर्फ़ जोड़ने का काम करते हैं। हम न नियोक्ता हैं, न ट्रांसपोर्टर, न बीमा कंपनी, और उपयोगकर्ताओं के बीच होने वाले किसी समझौते में हम पक्षकार नहीं हैं।
                </p>
              </div>

              {/* 2 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  2. कौन उपयोग कर सकता है
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  आपकी उम्र 18 साल या उससे ज़्यादा होनी चाहिए। सही जानकारी दें और अपना लॉगिन सुरक्षित रखें। एक व्यक्ति, एक खाता।
                </p>
              </div>

              {/* 3 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  3. सत्यापन
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  हम सिर्फ़ आपका फ़ोन नंबर (और ईमेल, अगर आप उसका उपयोग करते हैं) OTP से जाँचते हैं। हम ड्राइविंग लाइसेंस, RC, आधार, उद्यम, पुलिस प्रमाणपत्र या कोई भी पहचान दस्तावेज़ न जाँचते हैं, न लेते हैं, न रखते हैं। &quot;Phone verified&quot; का मतलब सिर्फ़ इतना है कि नंबर उसी उपयोगकर्ता का है। इसका मतलब यह नहीं कि व्यक्ति कुशल, लाइसेंसधारी, ईमानदार या काम के योग्य है।
                </p>
              </div>

              {/* 4 */}
              <div className="space-y-2 bg-[#1A1A22] p-4 rounded-2xl border border-amber-500/30">
                <h4 className="font-black text-white text-sm uppercase text-amber-400">
                  4. हायर करने से पहले आपकी ज़िम्मेदारी
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  किसी को हायर करने, काम स्वीकार करने या मैकेनिक बुलाने से पहले सामने वाले की जाँच आपको खुद करनी है:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-gray-200">
                  <li><strong>मालिक:</strong> गाड़ी देने से पहले ड्राइवर का असली ड्राइविंग लाइसेंस mParivahan ऐप में जाँचें (नाम, वैधता, वाहन क्लास), और नए ड्राइवर से पुलिस वेरिफिकेशन सर्टिफिकेट माँगें।</li>
                  <li><strong>ड्राइवर:</strong> काम शुरू करने से पहले गाड़ी का RC, बीमा और फिटनेस जाँचें, और ट्रिप व भुगतान की शर्तें तय कर लें।</li>
                  <li><strong>सभी:</strong> काम शुरू होने से पहले रेट तय करें। भुगतान सीधे करें और सीधे लें।</li>
                </ul>
                <p className="text-xs font-black text-amber-300 pt-1">
                  हायर करने या किसी के साथ काम करने का फ़ैसला पूरी तरह आपका है।
                </p>
              </div>

              {/* 5 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  5. भुगतान
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  AID कोई कमीशन नहीं लेता और किसी भुगतान को न संभालता है, न रोकता है, न उसकी गारंटी देता है। मज़दूरी, बाटा, डीज़ल, नुकसान या देरी के विवाद उपयोगकर्ताओं के बीच के हैं।
                </p>
              </div>

              {/* 6 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  6. क्या नहीं करना है
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  झूठी जानकारी न दें, किसी की नकल न करें, किसी और के दस्तावेज़ या व्यापार पंजीकरण का उपयोग न करें, नकली रिव्यू न डालें, किसी को परेशान या बदनाम न करें, और ऐप का कोई गैरकानूनी उपयोग न करें। बिना सबूत किसी उपयोगकर्ता को अपराधी या ऐसा कुछ न कहें।
                </p>
              </div>

              {/* 7 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  7. रिव्यू
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  रेटिंग और रिव्यू असली अनुभव पर आधारित होने चाहिए। झूठी, अपमानजनक या गैरकानूनी सामग्री हम हटा सकते हैं।
                </p>
              </div>

              {/* 8 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  8. हमारी ज़िम्मेदारी की सीमा
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  कानून जितनी अनुमति देता है, उस हद तक AID ऐप से हुई किसी हायरिंग से पैदा हुई चोरी, दुर्घटना, नुकसान, चोट, देरी, भुगतान न होने या किसी विवाद के लिए, या उपयोगकर्ताओं के कहे-किए के लिए ज़िम्मेदार नहीं है। यहाँ लिखी कोई बात आपके उन अधिकारों को सीमित नहीं करती जिन्हें कानून सीमित करने की अनुमति नहीं देता।
                </p>
              </div>

              {/* 9 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  9. खाता बंद करना
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  जो खाता इन शर्तों को तोड़ता है, या जिसे हम उचित कारण से असुरक्षित या धोखाधड़ी वाला मानते हैं, उसे हम रोक या हटा सकते हैं।
                </p>
              </div>

              {/* 10 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  10. बदलाव और कानून
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  हम ये शर्तें बदल सकते हैं और नई तारीख यहीं दिखाएँगे। ये शर्तें भारत के कानून के अधीन हैं। <strong>बालाघाट, मध्य प्रदेश</strong> की अदालतों को अधिकार-क्षेत्र होगा, उपभोक्ता कानून के तहत आपके अधिकारों को छोड़कर।
                </p>
              </div>

              {/* 11 */}
              <div className="space-y-2 bg-[#0B0B0C] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-gray-300">
                  11. संपर्क
                </h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><strong>आधिकारिक सपोर्ट ईमेल:</strong> <a href="mailto:support@allindiadriver.com" className="text-[#E10600] underline">support@allindiadriver.com</a></p>
                  <p><strong>पंजीकृत कार्यालय:</strong> बालाघाट, मध्य प्रदेश 481001, भारत</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT: PRIVACY POLICY (ENGLISH) */}
          {activeDoc === 'privacy' && lang === 'en' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white uppercase font-display">
                  All India Driver: Privacy Policy
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  We value your privacy. We store zero identity documents and only process what is needed to connect users.
                </p>
              </div>

              {/* 1 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  1. What we collect
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Only what the app needs to work:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-200">
                  <li>Name, phone number and email (if you use email login)</li>
                  <li>State, city, vehicle type and years of experience that you choose to add to your profile</li>
                  <li>Bookings, ratings and reviews you create</li>
                  <li>Location, only when you use SOS or the map, and only after you allow it on your phone</li>
                </ul>
              </div>

              {/* 2 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-emerald-500/30">
                <h4 className="font-black text-white text-sm uppercase text-emerald-400">
                  2. What we do not collect
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We do not ask for or store Driving Licence, RC, Aadhaar, Udyam, PAN, bank or card details, police certificates or photos of any identity document.
                </p>
              </div>

              {/* 3 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  3. Why we use it
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  To create your account, show your profile to other users, connect drivers, owners and mechanics, send OTPs, handle SOS requests, and keep the app safe.
                </p>
              </div>

              {/* 4 */}
              <div className="space-y-1.5 bg-[#1A1A22] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  4. Who can see it
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Your name, state, vehicle type, experience and rating are visible to other users. Your full phone number is shown to the other person only after a booking is confirmed. We do not sell your data and do not share it with advertisers.
                </p>
              </div>

              {/* 5 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  5. Service providers
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We use outside services to run the app, such as hosting, the database, SMS/OTP and maps (<strong>InsForge</strong>, <strong>Truecaller / SMS Gateway</strong>, <strong>OpenStreetMap</strong>). They process data only to provide those services.
                </p>
              </div>

              {/* 6 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  6. How long we keep it
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  While your account is active. When you delete your account we delete your profile; we may keep limited records for as long as the law requires.
                </p>
              </div>

              {/* 7 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  7. Your choices
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  You can see and edit your profile, turn off location in your phone settings, and ask us to delete your account and data at <a href="mailto:support@allindiadriver.com" className="text-[#E10600] underline font-bold">support@allindiadriver.com</a>. We will reply within <strong>30 days</strong>.
                </p>
              </div>

              {/* 8 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  8. Security
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We use reasonable safeguards, but no system is perfectly secure. Keep your login private.
                </p>
              </div>

              {/* 9 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  9. Children
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  The app is not for anyone under 18.
                </p>
              </div>

              {/* 10 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  10. Changes
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  We will show the updated date here when this policy changes.
                </p>
              </div>

              {/* 11 */}
              <div className="space-y-2 bg-[#0B0B0C] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-gray-300">
                  11. Contact for privacy questions
                </h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><strong>Privacy Email:</strong> <a href="mailto:support@allindiadriver.com" className="text-[#E10600] underline">support@allindiadriver.com</a></p>
                  <p><strong>Registered Address:</strong> Balaghat, Madhya Pradesh 481001, India</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT: PRIVACY POLICY (HINDI) */}
          {activeDoc === 'privacy' && lang === 'hi' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-xl font-black text-white uppercase font-display">
                  ऑल इंडिया ड्राइवर: गोपनीयता नीति (Privacy Policy)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। हम कोई भी पहचान दस्तावेज़ स्टोर नहीं करते।
                </p>
              </div>

              {/* 1 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  1. हम क्या लेते हैं
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  सिर्फ़ वही जो ऐप चलाने के लिए ज़रूरी है:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-gray-200">
                  <li>नाम, फ़ोन नंबर और ईमेल (अगर ईमेल लॉगिन उपयोग करें)</li>
                  <li>राज्य, शहर, वाहन का प्रकार और अनुभव, जो आप खुद प्रोफ़ाइल में जोड़ें</li>
                  <li>आपकी बनाई बुकिंग, रेटिंग और रिव्यू</li>
                  <li>लोकेशन, सिर्फ़ SOS या मैप उपयोग करते समय, और सिर्फ़ तब जब आप अपने फ़ोन में अनुमति दें</li>
                </ul>
              </div>

              {/* 2 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-emerald-500/30">
                <h4 className="font-black text-white text-sm uppercase text-emerald-400">
                  2. हम क्या नहीं लेते
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  हम ड्राइविंग लाइसेंस, RC, आधार, उद्यम, PAN, बैंक या कार्ड की जानकारी, पुलिस प्रमाणपत्र या किसी पहचान दस्तावेज़ की फ़ोटो न माँगते हैं, न रखते हैं।
                </p>
              </div>

              {/* 3 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  3. उपयोग क्यों
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  आपका खाता बनाने, दूसरों को आपकी प्रोफ़ाइल दिखाने, ड्राइवर, मालिक और मैकेनिक को जोड़ने, OTP भेजने, SOS अनुरोध संभालने और ऐप को सुरक्षित रखने के लिए।
                </p>
              </div>

              {/* 4 */}
              <div className="space-y-1.5 bg-[#1A1A22] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  4. कौन देख सकता है
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  आपका नाम, राज्य, वाहन का प्रकार, अनुभव और रेटिंग दूसरे उपयोगकर्ताओं को दिखते हैं। आपका पूरा फ़ोन नंबर बुकिंग पक्की होने के बाद ही सामने वाले को दिखता है। हम आपका डेटा बेचते नहीं और विज्ञापन कंपनियों से साझा नहीं करते।
                </p>
              </div>

              {/* 5 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  5. बाहरी सेवाएँ
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  ऐप चलाने के लिए हम बाहरी सेवाएँ उपयोग करते हैं, जैसे होस्टिंग, डेटाबेस, SMS/OTP और मैप (<strong>InsForge</strong>, <strong>Truecaller / SMS Gateway</strong>, <strong>OpenStreetMap</strong>)। वे डेटा सिर्फ़ ये सेवाएँ देने के लिए संसाधित करती हैं।
                </p>
              </div>

              {/* 6 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  6. कितने समय तक रखते हैं
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  जब तक आपका खाता चालू है। खाता हटाने पर हम आपकी प्रोफ़ाइल हटा देते हैं; कानून जितना ज़रूरी बताए, उतने समय के लिए सीमित रिकॉर्ड रह सकते हैं।
                </p>
              </div>

              {/* 7 */}
              <div className="space-y-1.5 bg-[#16161A] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  7. आपके विकल्प
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  आप अपनी प्रोफ़ाइल देख और बदल सकते हैं, फ़ोन की सेटिंग में लोकेशन बंद कर सकते हैं, और <a href="mailto:support@allindiadriver.com" className="text-[#E10600] underline font-bold">support@allindiadriver.com</a> पर खाता व डेटा हटाने का अनुरोध कर सकते हैं। हम <strong>30 दिन</strong> में जवाब देंगे।
                </p>
              </div>

              {/* 8 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  8. सुरक्षा
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  हम उचित सुरक्षा उपाय अपनाते हैं, पर कोई भी सिस्टम पूरी तरह सुरक्षित नहीं होता। अपना लॉगिन किसी को न बताएँ।
                </p>
              </div>

              {/* 9 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  9. बच्चे
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  यह ऐप 18 साल से कम उम्र के लोगों के लिए नहीं है।
                </p>
              </div>

              {/* 10 */}
              <div className="space-y-1.5">
                <h4 className="font-black text-white text-sm uppercase text-[#E10600]">
                  10. बदलाव
                </h4>
                <p className="text-gray-300 text-xs sm:text-sm">
                  नीति बदलने पर नई तारीख यहीं दिखाई जाएगी।
                </p>
              </div>

              {/* 11 */}
              <div className="space-y-2 bg-[#0B0B0C] p-4 rounded-2xl border border-white/10">
                <h4 className="font-black text-white text-sm uppercase text-gray-300">
                  11. गोपनीयता संबंधी संपर्क
                </h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><strong>गोपनीयता सहायता ईमेल:</strong> <a href="mailto:support@allindiadriver.com" className="text-[#E10600] underline">support@allindiadriver.com</a></p>
                  <p><strong>पंजीकृत पता:</strong> बालाघाट, मध्य प्रदेश 481001, भारत</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#16161A] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#E10600]" />
            <span>ALL INDIA DRIVER • Balaghat (M.P.) India</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#E10600] hover:bg-[#c20500] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(225,6,0,0.4)]"
          >
            {lang === 'hi' ? 'समझ गया / बंद करें (Close)' : 'I Understand / Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LegalTermsPrivacyModal;

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, User, ArrowRight, AlertTriangle, 
  Calculator, Truck, Wrench, Shield, CheckCircle2, RefreshCw,
  MessageSquare, ChevronRight, Phone, MapPin, Zap
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  action?: {
    type: 'open-sos' | 'open-calc' | 'open-fleet' | 'open-login';
    label: string;
  };
}

interface HighwayAiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSOS?: () => void;
  onOpenCalculator?: () => void;
  onOpenFleet?: () => void;
  onOpenLogin?: () => void;
  lang?: 'hi' | 'en';
}

const QUICK_CHIPS = [
  { id: 'breakdown', label: '🚨 हाईवे पर गाड़ी खराब है (SOS मदद)', prompt: 'मेरी गाड़ी हाईवे पर खराब हो गई है, मुझे तुरंत मैकेनिक चाहिए।' },
  { id: 'fare', label: '🧮 ड्राइवर का किराया व दैनिक बाटा कैसे निकालें?', prompt: 'ड्राइवर का प्रति किमी दूरी भत्ता और दैनिक बाटा कैसे कैलकुलेट करें?' },
  { id: 'hire', label: '🚛 14-22W भारी ट्रेलर ड्राइवर कैसे मिलेगा?', prompt: 'मुझे 18-चक्का ट्रेलर के लिए अनुभवी ड्राइवर की आवश्यकता है।' },
  { id: 'job', label: '🧑‍✈️ ड्राइवर को 0% कमीशन ट्रिप्स कैसे मिलेंगी?', prompt: 'मैं कमर्शियल ड्राइवर हूँ, मुझे बिना दलाली के सीधी ट्रिप्स कैसे मिलेंगी?' },
  { id: 'safety', label: '🛡️ क्या इसका कोई चार्ज या फीस है?', prompt: 'क्या इस AI या प्लेटफॉर्म का कोई चार्ज या हिडन फीस है?' }
];

export const HighwayAiChatModal: React.FC<HighwayAiChatModalProps> = ({
  isOpen,
  onClose,
  onOpenSOS,
  onOpenCalculator,
  onOpenFleet,
  onOpenLogin,
  lang = 'hi'
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: lang === 'hi'
        ? 'नमस्ते! 🙏 मैं हूँ ऑल इंडिया ड्राइवर 24x7 AI सारथी।\n\nमैं हाईवे ब्रेकडाउन, ड्राइवर भर्ती, किराया-बाटा कैलकुलेशन और गाड़ी मालिक सहायता के लिए 24 घंटे 100% मुफ़्त उपलब्ध हूँ।\n\nमुझसे कोई भी सवाल पूछें, इसका आपसे कोई चार्ज नहीं लिया जाएगा! 🇮🇳'
        : 'Hello! 🙏 I am your 24x7 All India Driver AI Highway Assistant.\n\nI am available 24/7 100% free with zero charges to solve breakdown issues, driver hiring, and trip fare calculations.\n\nHow can I help you today?',
      time: 'अब'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 150);
    }
  }, [isOpen, messages, isTyping]);

  // Intelligent On-Device Highway Brain (100% Free Forever, Zero API Cost)
  const generateAiReply = (query: string): { text: string; action?: Message['action'] } => {
    const q = query.toLowerCase().trim();

    // 1. Highway Breakdown & SOS Emergency
    if (q.includes('खराब') || q.includes('breakdown') || q.includes('मैकेनिक') || q.includes('पंचर') || q.includes('sos') || q.includes('टायर') || q.includes('इंजन') || q.includes('हीटिंग') || q.includes('क्लच') || q.includes('बैटरी') || q.includes('टोइंग') || q.includes('क्रेन')) {
      return {
        text: '🚨 आपातकालीन सहायता (Highway Breakdown Assistance):\n\n1. गाड़ी को तुरंत हाईवे के बाईं ओर (Left Shoulder) सुरक्षित पार्क करें और पार्किंग लाइट / हैजार्ड लैंप चालू करें।\n2. हमारे 24x7 SOS सिस्टम से आपकी लाइव जीपीएस लोकेशन के 5-20 KM में नजदीकी टायर, इंजन, क्लच व क्रेन मैकेनिक तुरंत उपलब्ध हो जाते हैं।\n3. प्लेटफॉर्म ₹0 फीस लेता है, आप सीधे मैकेनिक को कॉल कर सकते हैं।',
        action: onOpenSOS ? { type: 'open-sos', label: '🚨 24x7 इमरजेंसी SOS खोलें' } : undefined
      };
    }

    // 2. Fare & Daily Bata Calculation
    if (q.includes('किराया') || q.includes('fare') || q.includes('बाटा') || q.includes('bata') || q.includes('दूरी') || q.includes('रेट') || q.includes('km') || q.includes('कैलकुलेट')) {
      return {
        text: '🧮 ड्राइवर किराया व दैनिक बाटा का पारदर्शी फार्मूला:\n\n• कुल दूरी (KM) x प्रति-किमी दूरी भत्ता (वाहन श्रेणी अनुसार ₹2.50 से ₹5.00/किमी)\n• + दैनिक भोजन/बाटा भत्ता (₹400 से ₹800 प्रतिदिन x ट्रिप के दिन)\n• 0% कमीशन: पूरा पैसा सीधा ड्राइवर को मिलता है। बिचौलिये या दलाली ₹0 है।',
        action: onOpenCalculator ? { type: 'open-calc', label: '🧮 किराया कैलकुलेटर खोलें' } : undefined
      };
    }

    // 3. Driver Hiring / Vehicles / Fleet
    if (q.includes('ट्रेलर') || q.includes('ड्राइवर चाहिए') || q.includes('ट्रक') || q.includes('गाड़ी') || q.includes('पिकअप') || q.includes('18-चक्का') || q.includes('fleet') || q.includes('hire') || q.includes('चालक')) {
      return {
        text: '🚛 पूरे भारत के 2W से 40W+ भारी वाहनों के ड्राइवर:\n\n• 4W पिकअप / बोलेरो: ₹800 - ₹1,200/दिन\n• 6-10W मध्यम कार्गो (आइशर/टाटा): ₹1,200 - ₹1,800/दिन\n• 14-22W भारी ट्रेलर (सिग्ना/लेलैंड): ₹2,000 - ₹2,800/दिन\n• 24-40+W ODC हाइड्रोलिक ट्रेलर: ₹3,000 - ₹4,500/दिन\n\nगाड़ी मालिक सीधे ड्राइवर को कॉल कर सकते हैं, कोई दलाल नहीं!',
        action: onOpenFleet ? { type: 'open-fleet', label: '🚛 वाहन बेड़ा (Fleet) देखें' } : undefined
      };
    }

    // 4. Job Search for Drivers
    if (q.includes('नौकरी') || q.includes('job') || q.includes('काम') || q.includes('जुड़ें') || q.includes('ट्रिप') || q.includes('रजिस्टर')) {
      return {
        text: '🧑‍✈️ ड्राइवर भाइयों के लिए 100% मुफ़्त ट्रिप्स:\n\n1. "ड्राइवर के रूप में जुड़ें" बटन दबाकर अपना नाम, मोबाइल नंबर और अनुभव भरें।\n2. अपनी ड्यूटी स्टेटस को "ड्यूटी चालू (Online)" करें।\n3. आसपास के गाड़ी मालिक आपको सीधे कॉल करेंगे। तय किया गया 100% पैसा आपका होगा, ₹0 कमीशन कटेगा!',
        action: onOpenLogin ? { type: 'open-login', label: '🧑‍✈️ ड्राइवर रजिस्ट्रेशन / लॉगिन' } : undefined
      };
    }

    // 5. Charges / Fees / Pricing (0% Free Guarantee)
    if (q.includes('चार्ज') || q.includes('फीस') || q.includes('पैसा') || q.includes('charge') || q.includes('free') || q.includes('cost') || q.includes('कमीशन')) {
      return {
        text: '🟢 100% मुफ़्त गारंटी (Zero Charges Forever):\n\n• इस 24x7 Chat AI का आपसे कोई चार्ज या सब्सक्रिप्शन फीस नहीं है।\n• प्लेटफॉर्म पर गाड़ी मालिक और ड्राइवर से ₹0 कमीशन लिया जाता है।\n• किसी भी छिपे हुए चार्ज (Hidden Charges) के बिना 100% डायरेक्ट पेमेंट मॉडल है।',
        action: undefined
      };
    }

    // Default Friendly Helpful Answer
    return {
      text: 'मैं आपकी पूरी मदद करने के लिए तैयार हूँ! आप मुझसे निम्न विषयों पर पूछ सकते हैं:\n\n1. हाईवे पर 24x7 मैकेनिक कैसे बुलाएँ? 🚨\n2. दूरी के हिसाब से ड्राइवर का सही किराया व बाटा क्या होगा? 🧮\n3. 14-22W ट्रेलर या भारी ट्रक के लिए ड्राइवर कैसे खोजें? 🚛\n4. ड्राइवर के रूप में जुड़कर 0% कमीशन ट्रिप्स कैसे पाएँ? 🧑‍✈️\n\nनीचे दिए गए सुझाव बटनों पर भी टैप कर सकते हैं!',
      action: undefined
    };
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateAiReply(userText);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply.text,
        time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
        action: reply.action
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleChipClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: prompt,
        time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      setTimeout(() => {
        const reply = generateAiReply(prompt);
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply.text,
          time: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
          action: reply.action
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 450);
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div 
        className="w-full sm:max-w-xl h-[90vh] sm:h-[650px] bg-[#0B0B0C] border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#121214] border-b border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E10600] to-[#990000] flex items-center justify-center text-white shadow-lg shadow-[#E10600]/30 relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#121214] animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-sm uppercase tracking-wide text-white">
                  24x7 AI सारथी (Highway AI)
                </h3>
                <span className="bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  100% Free
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-bold">
                हाईवे ब्रेकडाउन, किराया व समस्या समाधान • ₹0 चार्ज
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1A1A22] hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer border border-white/10"
            aria-label="Close AI Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0B0B0C]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-[#E10600] flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-md text-xs leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-[#E10600] text-white font-bold rounded-tr-xs'
                    : 'bg-[#121214] border border-white/10 text-gray-200 font-medium rounded-tl-xs'
                }`}
              >
                <div>{msg.text}</div>

                {msg.action && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (msg.action?.type === 'open-sos' && onOpenSOS) onOpenSOS();
                        else if (msg.action?.type === 'open-calc' && onOpenCalculator) onOpenCalculator();
                        else if (msg.action?.type === 'open-fleet' && onOpenFleet) onOpenFleet();
                        else if (msg.action?.type === 'open-login' && onOpenLogin) onOpenLogin();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#E10600] hover:bg-[#c20500] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(225,6,0,0.4)] transition-all cursor-pointer"
                    >
                      <span>{msg.action.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <span className="block text-[9px] text-right mt-1.5 text-gray-400 font-mono">
                  {msg.time}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[#1A1A22] border border-white/10 flex items-center justify-center text-gray-300 shrink-0 mt-1 shadow-sm">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pl-9">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E10600] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#E10600] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#E10600] animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span>AI सारथी उत्तर सोच रहा है...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-[#121214] border-t border-white/10 overflow-x-auto flex gap-2 shrink-0 scrollbar-none">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleChipClick(chip.prompt)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#1A1A22] hover:bg-[#252532] border border-white/10 hover:border-[#E10600]/50 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-[#121214] border-t border-white/10 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="यहाँ अपनी समस्या लिखें (उदा: NH-48 पर पंचर हो गया, क्या करूँ?)..."
              className="flex-1 bg-[#1A1A22] border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-gray-500 focus:outline-none focus:border-[#E10600] focus:ring-1 focus:ring-[#E10600]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-3 bg-[#E10600] hover:bg-[#c20500] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-[#E10600]/30 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
          <div className="text-center mt-1.5">
            <span className="text-[10px] text-gray-500 font-bold">
              100% Free AI • कोई चार्ज नहीं • ऑल इंडिया ड्राइवर नेटवर्क
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

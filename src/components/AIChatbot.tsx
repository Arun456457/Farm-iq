import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Sparkles,
  MessageSquare,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Search,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { User, LanguageCode } from '../types';
import { api } from '../api';
import { CHATBOT_40_QUESTIONS, CHATBOT_CATEGORIES, ChatbotQuestion } from '../data/chatbotQuestions';

interface AIChatbotProps {
  user: User | null;
  language: LanguageCode;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const UI_TEXT: Record<LanguageCode, {
  advisorTitle: string;
  advisorSubtitle: string;
  floatingButton: string;
  welcomeMessage: string;
  topicsButton: string;
  drawerTitle: string;
  drawerSubtitle: string;
  searchPlaceholder: string;
  noQuestionsFound: string;
  askButton: string;
  researching: string;
  quickQuestionsBar: string;
  scrollHint: string;
  close: string;
  resetChat: string;
  chatCleaned: string;
}> = {
  en: {
    advisorTitle: "Kisan Mitra AI",
    advisorSubtitle: "Instant Agri & FarmiQ Marketplace Advisor",
    floatingButton: "Ask AI Advisor (40 Topics)",
    welcomeMessage: "Namaste! 🙏 I am Kisan Mitra, your intelligent FarmiQ Agricultural & Marketplace Advisor.\n\nBrowse and choose from the 40 questions below by scrolling and tapping! Get instant, certified answers in your language on Live Mandi Rates, Cash on Delivery, Escrow Payouts, Cold Storage, and more.",
    topicsButton: "40 Topics",
    drawerTitle: "Choose from 40 FarmiQ Questions",
    drawerSubtitle: "Scroll & tap any question to get an instant answer (no typing required)",
    searchPlaceholder: "Filter 40 questions (e.g. Mandi, UPI, COD, Storage)...",
    noQuestionsFound: "No questions match your filter. Try another keyword or reset!",
    askButton: "Ask",
    researching: "Kisan Mitra is researching FarmiQ knowledge...",
    quickQuestionsBar: "⚡ Scroll & Tap to Ask",
    scrollHint: "Tap any question below to get an instant answer",
    close: "Close",
    resetChat: "Reset",
    chatCleaned: "Chat reset. How can I help you next?"
  },
  hi: {
    advisorTitle: "किसान मित्र AI",
    advisorSubtitle: "तत्काल कृषि एवं FarmiQ बाजार सलाहकार",
    floatingButton: "किसान मित्र AI (40 प्रश्न)",
    welcomeMessage: "नमस्ते! 🙏 मैं किसान मित्र हूँ, आपका FarmiQ कृषि व बाजार सलाहकार।\n\nनीचे दिए गए 40 प्रश्नों में से स्क्रॉल करके किसी भी प्रश्न पर टैप करें! बिना टाइप किए लाइव मंडी भाव, कैश ऑन डिलीवरी, एस्क्रो भुगतान, कोल्ड स्टोरेज और अन्य विषयों पर तुरंत हिंदी में उत्तर पाएं।",
    topicsButton: "40 विषय",
    drawerTitle: "40 प्रश्नों में से चुनें",
    drawerSubtitle: "स्क्रॉल करें और किसी भी प्रश्न पर टैप करें (टाइप करने की आवश्यकता नहीं)",
    searchPlaceholder: "40 प्रश्नों में खोजें (जैसे मंडी, यूपीआई, डिलीवरी, स्टोरेज)...",
    noQuestionsFound: "कोई प्रश्न नहीं मिला। कृपया दूसरा शब्द खोजें या रीसेट करें!",
    askButton: "पूछें",
    researching: "किसान मित्र उत्तर तैयार कर रहे हैं...",
    quickQuestionsBar: "⚡ स्क्रॉल करें और पूछें",
    scrollHint: "तुरंत उत्तर पाने के लिए नीचे किसी भी प्रश्न पर टैप करें",
    close: "बंद करें",
    resetChat: "रीसेट",
    chatCleaned: "चैट रीसेट हो गई है। आगे क्या पूछना चाहते हैं?"
  },
  te: {
    advisorTitle: "కిసాన్ మిత్ర AI",
    advisorSubtitle: "వ్యవసాయ మరియు FarmiQ మార్కెట్ సలహాదారు",
    floatingButton: "కిసాన్ మిత్ర AI (40 ప్రశ్నలు)",
    welcomeMessage: "నమస్కారం! 🙏 నేను కిసాన్ మిత్రను, మీ FarmiQ వ్యవసాయ మరియు మార్కెట్ సలహాదారుని.\n\nక్రింద ఉన్న 40 ప్రశ్నల నుండి స్క్రోల్ చేసి నచ్చినదాన్ని ఎంచుకోండి! టైప్ చేయకుండానే లైవ్ మార్కెట్ ధరలు, క్యాష్ ఆన్ డెలివరీ, ఎస్క్రో చెల్లింపులు మరియు నిల్వ గిడ్డంగులపై తక్షణ సమాధానాలు పొందండి.",
    topicsButton: "40 అంశాలు",
    drawerTitle: "40 ప్రశ్నల నుండి ఎంచుకోండి",
    drawerSubtitle: "స్క్రోల్ చేసి ఏదైనా ప్రశ్నపై క్లిక్ చేయండి (టైప్ చేయాల్సిన పనిలేదు)",
    searchPlaceholder: "40 ప్రశ్నలలో వెతకండి (మార్కెట్, UPI, డెలివరీ, స్టోరేజ్)...",
    noQuestionsFound: "సరిపోలే ప్రశ్నలు లేవు. వేరే పదం వెతకండి!",
    askButton: "అడగండి",
    researching: "కిసాన్ మిత్ర సమాధానం సిద్ధం చేస్తున్నారు...",
    quickQuestionsBar: "⚡ స్క్రోల్ చేసి అడగండి",
    scrollHint: "సమాధానం కోసం క్రింద ఉన్న ప్రశ్నపై క్లిక్ చేయండి",
    close: "మూసివేయి",
    resetChat: "రీసెట్",
    chatCleaned: "చాట్ రీసెట్ చేయబడింది. తర్వాత ఏమి తెలుసుకోవాలనుకుంటున్నారు?"
  },
  mr: {
    advisorTitle: "किसान मित्र AI",
    advisorSubtitle: "थेट कृषी व FarmiQ बाजार सल्लागार",
    floatingButton: "किसान मित्र AI (४० प्रश्न)",
    welcomeMessage: "नमस्कार! 🙏 मी किसान मित्र आहे, तुमचा FarmiQ कृषी आणि बाजार सल्लागार.\n\nखाली दिलेल्या ४० प्रश्नांमधून स्क्रोल करून कोणताही प्रश्न निवडा! टाईप न करता थेट बाजारभाव, कॅश ऑन डिलिव्हरी, एस्क्रो पेमेंट, शीतगृह व इतर विषयांवर मराठीत त्वरित मार्गदर्शन मिळवा.",
    topicsButton: "४० विषय",
    drawerTitle: "४० प्रश्नांमधून निवडा",
    drawerSubtitle: "स्क्रोल करा आणि प्रश्नावर क्लिक करा (टाईप करण्याची गरज नाही)",
    searchPlaceholder: "४० प्रश्नांमध्ये शोधा (बाजारभाव, UPI, डिलिव्हरी, स्टोरेज)...",
    noQuestionsFound: "प्रश्न सापडला नाही. दुसरा शब्द टाकून पहा!",
    askButton: "विचारा",
    researching: "किसान मित्र माहिती तयार करत आहेत...",
    quickQuestionsBar: "⚡ स्क्रोल करा आणि विचारा",
    scrollHint: "तात्काळ उत्तरासाठी खालील कोणत्याही प्रश्नावर क्लिक करा",
    close: "बंद करा",
    resetChat: "रीसेट",
    chatCleaned: "चॅट रीसेट केली आहे. पुढे काय विचारू इच्छिता?"
  }
};

export const AIChatbot: React.FC<AIChatbotProps> = ({ user, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const currentLang: LanguageCode = ['en', 'hi', 'te', 'mr'].includes(language) ? language : 'en';
  const ui = UI_TEXT[currentLang] || UI_TEXT.en;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: ui.welcomeMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [
          {
            id: 'welcome',
            sender: 'bot',
            text: ui.welcomeMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      }
      return prev;
    });
  }, [language, ui.welcomeMessage]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showFaqDrawer]);

  const handleSelectQuestion = async (q: ChatbotQuestion) => {
    if (loading) return;

    const questionText = q.question[currentLang] || q.question.en;
    const answerText = q.answer[currentLang] || q.answer.en;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setShowFaqDrawer(false);

    // Provide quick simulated response time (350ms) for ultra-fast, smooth UX
    setTimeout(async () => {
      try {
        // Also ping backend in background to keep server in sync
        api.sendChat(questionText, { language: currentLang, questionId: q.id }, user?.role).catch(() => {});

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: answerText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } catch {
        const fallbackMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: answerText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, fallbackMsg]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: ui.chatCleaned,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Filter the 40 questions based on active category and search filter
  const filteredQuestions = CHATBOT_40_QUESTIONS.filter(q => {
    const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
    const query = searchFilter.trim().toLowerCase();
    if (!query) return matchesCategory;

    const qText = (q.question[currentLang] || q.question.en).toLowerCase();
    const qHint = (q.hint[currentLang] || q.hint.en).toLowerCase();
    const qCat = (q.categoryLabel[currentLang] || q.categoryLabel.en).toLowerCase();
    const qAns = (q.answer[currentLang] || q.answer.en).toLowerCase();

    const matchesQuery = qText.includes(query) || qHint.includes(query) || qCat.includes(query) || qAns.includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      {/* Floating Action Button at bottom right */}
      {!isOpen && (
        <button
          id="btn-open-chatbot"
          onClick={() => setIsOpen(true)}
          title={ui.floatingButton}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-tr from-emerald-700 via-emerald-800 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <div className="flex flex-col text-left hidden sm:flex">
            <span className="text-xs font-bold font-['Outfit'] flex items-center gap-1">
              {ui.advisorTitle}
              <span className="px-1.5 py-0.2 bg-amber-400 text-stone-900 rounded-full text-[9px] font-black">
                40 Qs
              </span>
            </span>
            <span className="text-[10px] text-emerald-200">
              {currentLang.toUpperCase()} • Multi-language
            </span>
          </div>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-50 w-[96vw] sm:w-[470px] h-[640px] max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-left animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-3.5 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-emerald-400/40 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  {ui.advisorTitle}
                  <span className="text-[10px] bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                    40 Topics
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-100/90 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  <span>{ui.advisorSubtitle}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFaqDrawer(!showFaqDrawer)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                  showFaqDrawer
                    ? 'bg-amber-400 text-stone-900'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={ui.drawerTitle}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{ui.topicsButton}</span>
              </button>
              
              <button
                onClick={handleResetChat}
                className="p-1 rounded-lg hover:bg-white/20 text-emerald-100 hover:text-white transition"
                title={ui.resetChat}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-emerald-100 hover:text-white transition"
                title={ui.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Full 40 Questions Browser Drawer */}
          {showFaqDrawer && (
            <div className="bg-stone-50 border-b border-stone-200 flex flex-col max-h-[380px] shadow-inner animate-in slide-in-from-top-4 duration-200">
              <div className="p-3 bg-white border-b border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{ui.drawerTitle}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {filteredQuestions.length} of 40
                  </span>
                </div>
                
                {/* Search / Filter within 40 Questions */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder={ui.searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Horizontal Filter Pills */}
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 mt-2.5 pb-0.5">
                  {CHATBOT_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap font-bold transition ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat.label[currentLang] || cat.label.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable List of Filtered Questions */}
              <div className="overflow-y-auto p-2 space-y-1.5 divide-y divide-stone-100">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-stone-500 px-4">
                    {ui.noQuestionsFound}
                  </div>
                ) : (
                  filteredQuestions.map(q => (
                    <div
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      className="pt-1.5 first:pt-0 flex items-start justify-between gap-2.5 p-2 rounded-xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 transition cursor-pointer group"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black flex items-center justify-center shrink-0">
                            {q.number}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {q.categoryLabel[currentLang] || q.categoryLabel.en}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-stone-900 group-hover:text-emerald-900 leading-snug">
                          {q.question[currentLang] || q.question.en}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                          {q.hint[currentLang] || q.hint.en}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQuestion(q);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition shrink-0 mt-1"
                      >
                        <span>{ui.askButton}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/70 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-tr from-emerald-800 to-teal-700 text-white rounded-tr-xs shadow-xs font-medium'
                      : 'bg-white text-stone-800 border border-stone-200/90 shadow-2xs rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-stone-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-stone-700 text-xs bg-white p-3 rounded-2xl border border-stone-200 max-w-[85%] shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
                <span>{ui.researching}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Area: NO TYPING INPUT - SCROLLABLE 40 QUESTIONS SELECTION BAR */}
          <div className="bg-white border-t border-stone-200 p-2.5 flex flex-col gap-2">
            
            {/* Category Selector Chips & Drawer Opener */}
            <div className="flex items-center justify-between text-[11px] px-1">
              <button
                onClick={() => setShowFaqDrawer(!showFaqDrawer)}
                className="flex items-center gap-1.5 text-emerald-800 font-bold hover:underline transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{showFaqDrawer ? 'Hide 40 Topics Drawer' : ui.quickQuestionsBar}</span>
                {showFaqDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[10px] text-stone-400 font-medium">
                {ui.scrollHint}
              </span>
            </div>

            {/* Horizontal Scrollable Question Cards Carousel */}
            <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar pt-0.5">
              {CHATBOT_40_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-[11px] font-semibold text-stone-800 hover:text-emerald-900 whitespace-nowrap transition flex items-center gap-2 shrink-0 group shadow-2xs"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white text-[9px] font-black flex items-center justify-center transition">
                    {q.number}
                  </span>
                  <span>{q.question[currentLang] || q.question.en}</span>
                  <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-emerald-700 transition" />
                </button>
              ))}
            </div>

          </div>

        </div>
      )}
    </>
  );
};

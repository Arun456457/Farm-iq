import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Sprout,
  MessageSquare,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Search,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { User, LanguageCode } from '../types';
import { api } from '../api';

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

interface FAQItem {
  id: string;
  category: 'orders' | 'farmer' | 'mandi' | 'contracts' | 'disputes' | 'storage';
  categoryLabel: string;
  question: string;
  hint: string;
}

export const FARMIQ_FAQS: FAQItem[] = [
  // 1. Orders & Delivery
  {
    id: 'faq-1',
    category: 'orders',
    categoryLabel: 'Orders & Delivery',
    question: 'How does Cash on Delivery (COD) work on FarmiQ?',
    hint: 'Instant order placement, farmer instant review, Zero Deduction Guarantee'
  },
  {
    id: 'faq-2',
    category: 'orders',
    categoryLabel: 'Orders & Delivery',
    question: "What is FarmiQ's Zero Deduction Guarantee for customers?",
    hint: '0 advance deduction on COD; pay only after doorstep produce inspection'
  },
  {
    id: 'faq-3',
    category: 'orders',
    categoryLabel: 'Orders & Delivery',
    question: 'How can I track my produce order in real time?',
    hint: 'Interactive map route, driver vehicle, real-time status steps, and ETA'
  },
  {
    id: 'faq-4',
    category: 'orders',
    categoryLabel: 'Orders & Delivery',
    question: 'Why did I get a popup notification when a delivery agent was assigned?',
    hint: 'Instant customer alert with agent name, contact number, and vehicle'
  },
  {
    id: 'faq-5',
    category: 'orders',
    categoryLabel: 'Orders & Delivery',
    question: 'How are distance-based delivery charges calculated?',
    hint: '₹5/km up to 5km, ₹3/km for 5-15km, ₹2/km for long haul'
  },

  // 2. Farmer Selling & Earnings
  {
    id: 'faq-6',
    category: 'farmer',
    categoryLabel: 'Farmer & Earnings',
    question: 'How do I list my harvested crops for sale on FarmiQ?',
    hint: 'Specify crop, quantity, modal price, harvest date, and quality grade'
  },
  {
    id: 'faq-7',
    category: 'farmer',
    categoryLabel: 'Farmer & Earnings',
    question: 'Do farmers receive the delivery charges in their payout?',
    hint: '100% of calculated delivery fee is added to farmer net earnings'
  },
  {
    id: 'faq-8',
    category: 'farmer',
    categoryLabel: 'Farmer & Earnings',
    question: 'How do I set up or update my UPI ID for direct payouts?',
    hint: 'Enter custom UPI ID at registration or edit anytime in Farmer Profile'
  },
  {
    id: 'faq-9',
    category: 'farmer',
    categoryLabel: 'Farmer & Earnings',
    question: 'How do I assign a delivery agent to customer orders?',
    hint: 'Open Order Details, enter Driver Name, Mobile, and Vehicle Number'
  },
  {
    id: 'faq-10',
    category: 'farmer',
    categoryLabel: 'Farmer & Earnings',
    question: 'What happens if I have not assigned a delivery agent yet?',
    hint: "Defaults automatically to the farmer's verified name and mobile number"
  },

  // 3. Mandi Prices & APMC
  {
    id: 'faq-11',
    category: 'mandi',
    categoryLabel: 'Mandi Rates & APMC',
    question: 'How does FarmiQ calculate live Mandi prices based on location?',
    hint: 'Haversine distance calculation to 20+ APMC Mandi hubs across India'
  },
  {
    id: 'faq-12',
    category: 'mandi',
    categoryLabel: 'Mandi Rates & APMC',
    question: 'Which APMC Mandi markets are currently tracked across India?',
    hint: 'Lasalgaon, Pune Gultekdi, Azadpur, Vashi, Kolar, Guntur, and more'
  },
  {
    id: 'faq-13',
    category: 'mandi',
    categoryLabel: 'Mandi Rates & APMC',
    question: 'Can I check mandi rate trends (Up, Down, Stable) for crops?',
    hint: 'Daily arrival volumes, percentage price fluctuations, and modal price'
  },
  {
    id: 'faq-14',
    category: 'mandi',
    categoryLabel: 'Mandi Rates & APMC',
    question: 'How do I find the nearest APMC mandi to my farm?',
    hint: 'Click Use Current Location on Live Mandi Rates page for instant distance'
  },
  {
    id: 'faq-15',
    category: 'mandi',
    categoryLabel: 'Mandi Rates & APMC',
    question: 'How do I toggle prices between Per Kg and Per Quintal?',
    hint: 'Use the unit switch on the Mandi Rates page (1 Quintal = 100 Kg)'
  },

  // 4. Verified Buyers & Digital Contracts
  {
    id: 'faq-16',
    category: 'contracts',
    categoryLabel: 'Contracts & Escrow',
    question: 'How do Digital Contracts protect verified buyers and farmers?',
    hint: '100% pre-funded Escrow lock guarantees payment and eliminates rejection risk'
  },
  {
    id: 'faq-17',
    category: 'contracts',
    categoryLabel: 'Contracts & Escrow',
    question: 'How does the 100% pre-funded Escrow system work?',
    hint: 'Buyer funds Escrow upfront; money stays secure until delivery confirmation'
  },
  {
    id: 'faq-18',
    category: 'contracts',
    categoryLabel: 'Contracts & Escrow',
    question: "When does Escrow release payment to the farmer's account?",
    hint: 'Released automatically when the buyer clicks Confirm Delivery'
  },
  {
    id: 'faq-19',
    category: 'contracts',
    categoryLabel: 'Contracts & Escrow',
    question: 'What is the 1.5% platform fee split between buyer and farmer?',
    hint: 'Transparent fee split on delivered contracts for escrow management'
  },
  {
    id: 'faq-20',
    category: 'contracts',
    categoryLabel: 'Contracts & Escrow',
    question: 'How can an institutional buyer get verified on FarmiQ?',
    hint: 'Submit company profile, GSTIN, and demand volume for admin verification'
  },

  // 5. Grievance Desk & Disputes
  {
    id: 'faq-21',
    category: 'disputes',
    categoryLabel: 'Grievance & Disputes',
    question: 'How do I file a dispute or grievance ticket?',
    hint: 'Submit ticket with Order ID, reason, issue description, and proof'
  },
  {
    id: 'faq-22',
    category: 'disputes',
    categoryLabel: 'Grievance & Disputes',
    question: 'How does the Admin resolve disputes between farmers and customers?',
    hint: 'Admin mediates with full complainant & counterparty contact visibility'
  },
  {
    id: 'faq-23',
    category: 'disputes',
    categoryLabel: 'Grievance & Disputes',
    question: 'Can the admin see contact numbers and details of both parties?',
    hint: 'Full visibility into complainant and counterparty name, phone, and role'
  },
  {
    id: 'faq-24',
    category: 'disputes',
    categoryLabel: 'Grievance & Disputes',
    question: 'What happens when a dispute is resolved in Escrow?',
    hint: 'Admin authorizes full release to farmer or fair refund to customer'
  },

  // 6. Cold Storage, Accounts & Logistics
  {
    id: 'faq-25',
    category: 'storage',
    categoryLabel: 'Storage & Account',
    question: 'How do I book cold storage for perishable crops like onions or tomatoes?',
    hint: 'Book warehouse space in Cold Storage & Logistics to prevent distress sale'
  },
  {
    id: 'faq-26',
    category: 'storage',
    categoryLabel: 'Storage & Account',
    question: 'How do I create a new Farmer, Customer, or Verified Buyer account?',
    hint: 'Click Register on top right, choose your role, and register in seconds'
  },
  {
    id: 'faq-27',
    category: 'storage',
    categoryLabel: 'Storage & Account',
    question: 'Is FarmiQ registration free for Indian farmers?',
    hint: '100% free registration with zero subscription or upfront listing fees'
  },
  {
    id: 'faq-28',
    category: 'storage',
    categoryLabel: 'Storage & Account',
    question: 'Which Indian languages does FarmiQ support?',
    hint: 'English, Hindi (हिंदी), Telugu (తెలుగు), and Marathi (मराठी)'
  }
];

const CATEGORY_TABS = [
  { key: 'all', label: 'All 28 FAQs' },
  { key: 'orders', label: 'Orders & Delivery' },
  { key: 'farmer', label: 'Farmer & UPI' },
  { key: 'mandi', label: 'Mandi Rates' },
  { key: 'contracts', label: 'Escrow Contracts' },
  { key: 'disputes', label: 'Dispute Desk' },
  { key: 'storage', label: 'Storage & App' }
];

export const AIChatbot: React.FC<AIChatbotProps> = ({ user, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);
  const [faqCategory, setFaqCategory] = useState<string>('all');
  const [faqSearch, setFaqSearch] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Namaste! 🙏 I am Kisan Mitra, your intelligent FarmiQ Agricultural & Marketplace Advisor.\n\nAsk me anything! Whether it's live Mandi prices, Cash on Delivery (COD), Escrow payouts, delivery agent assignment, or crop storage, I'm here 24/7.\n\n💡 Tap "⚡ 28 Quick Questions" below to explore common questions or edit them before asking!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showFaqDrawer]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);
    setShowFaqDrawer(false);

    try {
      const res = await api.sendChat(textToSend, { language }, user?.role);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || "I am here to assist with all your farming and produce queries.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I experienced a temporary connection hiccup with the advisor service. Please try asking again in a moment.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (q: string, directSend: boolean = false) => {
    if (directSend) {
      handleSend(q);
    } else {
      setInput(q);
      setShowFaqDrawer(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const filteredFaqs = FARMIQ_FAQS.filter(item => {
    const matchesCat = faqCategory === 'all' || item.category === faqCategory;
    const matchesSearch = !faqSearch.trim() ||
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.hint.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.categoryLabel.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      {/* Floating Small Icon at bottom right */}
      {!isOpen && (
        <button
          id="btn-open-chatbot"
          onClick={() => setIsOpen(true)}
          title="Ask Kisan Mitra AI"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-tr from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-bold font-['Outfit'] hidden sm:inline">
            Ask AI Advisor
          </span>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-50 w-[96vw] sm:w-[440px] h-[590px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-left animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-3.5 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white border border-emerald-500 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  Kisan Mitra AI
                  <span className="text-[10px] bg-emerald-600 px-1.5 py-0.5 rounded font-normal text-emerald-100">
                    FarmiQ 3.8
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-100/90">
                  Instant help for Mandi, Orders, Escrow & Farming
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFaqDrawer(!showFaqDrawer)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  showFaqDrawer
                    ? 'bg-amber-400 text-stone-900 font-bold'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title="Browse preset FarmiQ questions"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">28 Topics</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick FAQ Drawer (Top Toggleable Panel with 28 Questions) */}
          {showFaqDrawer && (
            <div className="bg-stone-50 border-b border-stone-200 flex flex-col max-h-[290px] overflow-hidden animate-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 pb-1 border-b border-stone-200/80 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Select a Topic to Ask or Edit:</span>
                  </div>
                  <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    {filteredFaqs.length} of {FARMIQ_FAQS.length} FAQs
                  </span>
                </div>

                {/* Search Bar for FAQs */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search questions (e.g. COD, Escrow, UPI, Mandi)..."
                    className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-emerald-600 focus:bg-white"
                  />
                  {faqSearch && (
                    <button
                      onClick={() => setFaqSearch('')}
                      className="absolute right-2 top-1.5 text-[10px] text-stone-400 hover:text-stone-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                  {CATEGORY_TABS.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFaqCategory(tab.key)}
                      className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition ${
                        faqCategory === tab.key
                          ? 'bg-emerald-700 text-white font-semibold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Questions List */}
              <div className="overflow-y-auto p-2 space-y-1.5 divide-y divide-stone-100">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-stone-400">
                    No matching questions found for "{faqSearch}". Try another keyword!
                  </div>
                ) : (
                  filteredFaqs.map(faq => (
                    <div
                      key={faq.id}
                      className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 p-1.5 rounded-lg hover:bg-emerald-50/50 transition group"
                    >
                      <div className="flex-1 text-left">
                        <span className="inline-block text-[9px] font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.2 rounded mb-0.5">
                          {faq.categoryLabel}
                        </span>
                        <p className="text-[11px] font-semibold text-stone-800 leading-snug">
                          {faq.question}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                          {faq.hint}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <button
                          onClick={() => handleSelectQuestion(faq.question, false)}
                          title="Put in input box to edit/type"
                          className="px-2 py-1 rounded bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-800 text-[10px] font-medium flex items-center gap-0.5 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleSelectQuestion(faq.question, true)}
                          title="Ask immediately"
                          className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-semibold flex items-center gap-0.5 shadow-2xs transition"
                        >
                          <span>Ask</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-stone-50/60 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-stone-800 border border-stone-200 shadow-2xs rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-stone-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-stone-600 text-xs bg-white p-3 rounded-2xl border border-stone-200 max-w-[85%] shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Kisan Mitra is researching FarmiQ knowledge...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Category Bar (Always Visible to open FAQ Drawer) */}
          <div className="px-3 py-1.5 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between text-[11px]">
            <button
              onClick={() => setShowFaqDrawer(!showFaqDrawer)}
              className="flex items-center gap-1.5 text-emerald-800 font-bold hover:underline transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{showFaqDrawer ? 'Hide Topics Drawer' : '⚡ 28 Quick Service Questions'}</span>
              {showFaqDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-stone-400">Click to select & type</span>
          </div>

          {/* Horizontal Quick Question Carousel (if drawer closed) */}
          {!showFaqDrawer && (
            <div className="px-3 py-1.5 bg-white border-t border-stone-100 flex overflow-x-auto gap-1.5 no-scrollbar">
              {FARMIQ_FAQS.slice(0, 10).map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleSelectQuestion(faq.question, false)}
                  className="px-2.5 py-1 rounded-full bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-[10px] font-medium text-stone-700 hover:text-emerald-800 whitespace-nowrap transition flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{faq.question}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask anything or select from the 28 topics above..."
              className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:bg-stone-200 disabled:text-stone-400 transition shadow-xs cursor-pointer"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

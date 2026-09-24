import { LanguageCode } from '../types';

export interface ChatbotQuestion {
  id: string;
  number: number;
  category: 'orders' | 'farmer' | 'payouts' | 'mandi' | 'contracts' | 'disputes' | 'storage' | 'account';
  categoryLabel: Record<LanguageCode, string>;
  question: Record<LanguageCode, string>;
  hint: Record<LanguageCode, string>;
  answer: Record<LanguageCode, string>;
}

export const CHATBOT_CATEGORIES = [
  {
    id: 'all',
    label: {
      en: 'All 40 Questions',
      hi: 'सभी 40 प्रश्न',
      te: 'మొత్తం 40 ప్రశ్నలు',
      mr: 'सर्व 40 प्रश्न'
    }
  },
  {
    id: 'orders',
    label: {
      en: 'Orders & Delivery',
      hi: 'ऑर्डर और डिलीवरी',
      te: 'ఆర్డర్లు & డెలివరీ',
      mr: 'ऑर्डर्स आणि डिलिव्हरी'
    }
  },
  {
    id: 'farmer',
    label: {
      en: 'Farmer & Crops',
      hi: 'किसान और फसल बिक्री',
      te: 'రైతు & ఉత్పత్తులు',
      mr: 'शेतकरी आणि विक्री'
    }
  },
  {
    id: 'payouts',
    label: {
      en: 'UPI & Earnings',
      hi: 'यूपीआई और भुगतान',
      te: 'UPI & చెల్లింపులు',
      mr: 'UPI आणि पेमेंट'
    }
  },
  {
    id: 'mandi',
    label: {
      en: 'Mandi Rates',
      hi: 'मंडी भाव व APMC',
      te: 'మార్కెట్ ధరలు',
      mr: 'थेट बाजारभाव'
    }
  },
  {
    id: 'contracts',
    label: {
      en: 'Escrow Contracts',
      hi: 'एस्क्रो अनुबंध',
      te: 'ఎస్క్రో ఒప్పందాలు',
      mr: 'डिजिटल करार'
    }
  },
  {
    id: 'disputes',
    label: {
      en: 'Disputes Desk',
      hi: 'तकरार और सहायता',
      te: 'వివాదాలు & సహాయం',
      mr: 'तक्रार निवारण'
    }
  },
  {
    id: 'storage',
    label: {
      en: 'Cold Storage',
      hi: 'कोल्ड स्टोरेज',
      te: 'కోల్డ్ స్టోరేజ్',
      mr: 'शीतगृह व वाहतूक'
    }
  },
  {
    id: 'account',
    label: {
      en: 'Account & App',
      hi: 'खाता और ऐप',
      te: 'ఖాతా & యాప్',
      mr: 'खाते व अॅप'
    }
  }
];

export const CHATBOT_40_QUESTIONS: ChatbotQuestion[] = [
  // -------------------------------------------------------------
  // Category 1: Orders & Delivery (Q1 - Q5)
  // -------------------------------------------------------------
  {
    id: 'faq-1',
    number: 1,
    category: 'orders',
    categoryLabel: {
      en: 'Orders & Delivery',
      hi: 'ऑर्डर और डिलीवरी',
      te: 'ఆర్డర్లు & డెలివరీ',
      mr: 'ऑर्डर्स आणि डिलिव्हरी'
    },
    question: {
      en: 'How does Cash on Delivery (COD) work on FarmiQ?',
      hi: 'FarmiQ पर कैश ऑन डिलीवरी (COD) कैसे काम करता है?',
      te: 'FarmiQ లో క్యాష్ ఆన్ డెలివరీ (COD) ఎలా పనిచేస్తుంది?',
      mr: 'FarmiQ वर कॅश ऑन डिलिव्हरी (COD) कशी काम करते?'
    },
    hint: {
      en: 'Zero upfront deduction, farmer review, pay at doorstep',
      hi: 'शून्य अग्रिम कटौती, किसान समीक्षा, घर पर भुगतान',
      te: 'ముందుగా ఎలాంటి కోత లేదు, ఇంటి వద్ద చెల్లింపు',
      mr: 'शून्य आगाऊ कपात, शेतकरी तपासणी, दारात पैसे द्या'
    },
    answer: {
      en: `**FarmiQ Cash on Delivery (COD) Workflow:**\n- 💵 **Zero Upfront Advance:** Customers place COD orders with ₹0 advance payment.\n- 🔔 **Instant Farmer Review:** The farmer receives an immediate alert to review and prepare fresh produce.\n- 🚚 **Doorstep Inspection:** Pay only after inspecting produce freshness at your doorstep via Cash or direct UPI.\n- 🛡️ 100% protected under our Zero Deduction Guarantee.`,
      hi: `**FarmiQ कैश ऑन डिलीवरी (COD) प्रक्रिया:**\n- 💵 **शून्य अग्रिम भुगतान:** ग्राहक बिना किसी अग्रिम पैसे के ₹0 में ऑर्डर दे सकते हैं।\n- 🔔 **तत्काल किसान समीक्षा:** किसान को फसल तैयार करने का तुरंत अलर्ट मिलता है।\n- 🚚 **दरवाजे पर जांच:** घर पर उपज की ताजगी जांचने के बाद ही नकद या UPI से भुगतान करें।\n- 🛡️ हमारे 'जीरो डिडक्शन गारंटी' के तहत पूरी तरह सुरक्षित।`,
      te: `**FarmiQ క్యాష్ ఆన్ డెలివరీ (COD) విధానం:**\n- 💵 **ముందస్తు చెల్లింపు లేదు:** వినియోగదారులు ₹0 చెల్లించి ఆర్డర్ చేయవచ్చు.\n- 🔔 **రైతుకు తక్షణ సమాచారం:** ఆర్డర్ రాగానే రైతుకు నోటిఫికేషన్ వెళ్తుంది.\n- 🚚 **నాణ్యత తనిఖీ తర్వాతే చెల్లింపు:** మీ ఇంటి వద్ద ఉత్పత్తుల నాణ్యత చూసిన తర్వాతే నగదు లేదా UPI ద్వారా చెల్లించండి.\n- 🛡️ జీరో డిడక్షన్ గ్యారెంటీతో పూర్తి భద్రత.`,
      mr: `**FarmiQ कॅश ऑन डिलिव्हरी (COD) पद्धत:**\n- 💵 **शून्य आगाऊ रक्कम:** ग्राहक ₹0 आगाऊ देऊन थेट ऑर्डर करू शकतात.\n- 🔔 **शेतकऱ्याला लगेच सूचना:** शेतकरी तात्काळ शेतमाल पॅक व तयार करतो.\n- 🚚 **दारात माल तपासून पैसे द्या:** भाजीपाला/फळे तपासून झाल्यावरच रोख किंवा UPI द्वारे पैसे द्या.\n- 🛡️ FarmiQ झिरो डिडक्शन हमीद्वारे सुरक्षित.`
    }
  },
  {
    id: 'faq-2',
    number: 2,
    category: 'orders',
    categoryLabel: {
      en: 'Orders & Delivery',
      hi: 'ऑर्डर और डिलीवरी',
      te: 'ఆర్డర్లు & డెలివరీ',
      mr: 'ऑर्डर्स आणि डिलिव्हरी'
    },
    question: {
      en: "What is FarmiQ's Zero Deduction Guarantee for customers?",
      hi: 'ग्राहकों के लिए FarmiQ की जीरो डिडक्शन गारंटी क्या है?',
      te: 'వినియోగదారుల కోసం FarmiQ జీరో డిడక్షన్ గ్యారెంటీ అంటే ఏమిటి?',
      mr: 'ग्राहकांसाठी FarmiQ ची झिरो डिडक्शन गॅरंटी काय आहे?'
    },
    hint: {
      en: 'No advance cut on COD; pay only upon satisfaction',
      hi: 'COD पर पहले पैसे नहीं कटते, संतुष्टि के बाद ही भुगतान',
      te: 'ముందుగా డబ్బులు కట్ కావు, సంతృప్తి చెందిన తర్వాతే చెల్లించండి',
      mr: 'COD वर अगोदर पैसे कापत नाहीत; समाधान झाल्यावरच पैसे द्या'
    },
    answer: {
      en: `**Zero Deduction Guarantee:**\n- 🛡️ For all Cash on Delivery orders, FarmiQ guarantees that **₹0 is charged in advance**.\n- 🔍 Inspect produce grading, weight, and freshness upon arrival.\n- 🤝 If produce does not meet expectations, you are never locked in or forced to pay.\n- 📦 Eliminates all risk for household buyers.`,
      hi: `**जीरो डिडक्शन गारंटी:**\n- 🛡️ सभी कैश ऑन डिलीवरी ऑर्डर्स के लिए FarmiQ गारंटी देता है कि **पहले ₹0 काटे जाते हैं**।\n- 🔍 डिलीवरी पहुंचने पर उपज की ग्रेडिंग और ताजगी स्वयं जांचें।\n- 🤝 यदि माल संतोषजनक न हो तो आप पर कोई दबाव नहीं है।\n- 📦 ग्राहकों के लिए 100% जोखिम-मुक्त खरीदारी।`,
      te: `**జీరో డిడక్షన్ గ్యారెంటీ:**\n- 🛡️ అన్ని క్యాష్ ఆన్ డెలివరీ ఆర్డర్లకు FarmiQ ద్వారా **ముందుగా పైసా కూడా కట్ కాదు**.\n- 🔍 డెలివరీ వచ్చినప్పుడు తాజాదనం మరియు నాణ్యతను మీరే స్వయంగా పరిశీలించండి.\n- 🤝 నచ్చకపోతే డబ్బులు చెల్లించాల్సిన పనిలేదు.\n- 📦 కొనుగోలుదారులకు పూర్తి నమ్మకం.`,
      mr: `**झिरो डिडक्शन गॅरंटी:**\n- 🛡️ सर्व कॅश ऑन डिलिव्हरी ऑर्डर्ससाठी FarmiQ खात्री देते की **एकही रुपया अगोदर कापला जात नाही**.\n- 🔍 माल आल्यावर स्वतः प्रत आणि दर्जा तपासा.\n- 🤝 माल योग्य नसल्यास जबरदस्तीने पैसे देण्याची गरज नाही.\n- 📦 ग्राहकांसाठी १००% खात्रीशीर खरेदी.`
    }
  },
  {
    id: 'faq-3',
    number: 3,
    category: 'orders',
    categoryLabel: {
      en: 'Orders & Delivery',
      hi: 'ऑर्डर और डिलीवरी',
      te: 'ఆర్డర్లు & డెలివరీ',
      mr: 'ऑर्डर्स आणि डिलिव्हरी'
    },
    question: {
      en: 'How can I track my produce order in real time?',
      hi: 'मैं अपने ऑर्डर को लाइव मैप पर कैसे ट्रैक कर सकता हूँ?',
      te: 'నా ఆర్డర్‌ను లైవ్ మ్యాప్‌లో ఎలా ట్రాక్ చేయవచ్చు?',
      mr: 'मी माझी शेतमाल ऑर्डर लाइव्ह मॅपवर कशी ट्रॅक करू शकतो?'
    },
    hint: {
      en: 'Live status steps, interactive map, driver phone & ETA',
      hi: 'लाइव स्टेटस चरण, मैप रूट, ड्राइवर मोबाइल और आगमन समय',
      te: 'లైవ్ స్టేటస్, మ్యాప్ రూట్, డ్రైవర్ ఫోన్ & రాక సమయం',
      mr: 'थेट टप्पे, नकाशा मार्ग, ड्रायव्हर फोन व पोहोचण्याची वेळ'
    },
    answer: {
      en: `**Live Order Tracking:**\n- 🗺️ Go to **My Orders** in the Customer Dashboard and click **Live Tracking**.\n- 📍 See real-time progress: Preparing ➔ Picked Up ➔ In Transit ➔ Out for Delivery ➔ Delivered.\n- 📞 View driver name, mobile number, vehicle number, and live calculated route.\n- ⏱️ Accurate ETA updated every 5 seconds.`,
      hi: `**लाइव ऑर्डर ट्रैकिंग:**\n- 🗺️ ग्राहक डैशबोर्ड में **My Orders** पर जाएं और **Live Tracking** पर क्लिक करें।\n- 📍 वास्तविक समय स्थिति देखें: तैयारी ➔ पिकअप ➔ रास्ते में ➔ डिलीवरी के लिए निकला ➔ डिलीवर।\n- 📞 ड्राइवर का नाम, मोबाइल नंबर, वाहन नंबर और लाइव रूट दिखाई देगा।\n- ⏱️ हर 5 सेकंड में आगमन समय (ETA) अपडेट होता है।`,
      te: `**లైవ్ ఆర్డర్ ట్రాకింగ్:**\n- 🗺️ కస్టమర్ డ్యాష్‌బోర్డ్‌లో **My Orders** కి వెళ్లి **Live Tracking** క్లిక్ చేయండి.\n- 📍 తాజా పరిస్థితి: సిద్ధం అవుతోంది ➔ బయలుదేరింది ➔ మార్గంలో ఉంది ➔ డెలివరీకి చేరింది.\n- 📞 డ్రైవర్ పేరు, ఫోన్ నంబర్, వాహనం వివరాలు మరియు మ్యాప్ రూట్ కనిపిస్తాయి.\n- ⏱️ ఖచ్చితమైన సమయం (ETA) నిరంతరం అప్‌డేట్ అవుతుంది.`,
      mr: `**थेट ऑर्डर ट्रॅकिंग:**\n- 🗺️ ग्राहक डॅशबोर्डमध्ये **My Orders** वर जा आणि **Live Tracking** वर क्लिक करा.\n- 📍 थेट स्थिती: शेतातून पॅक ➔ निघाले ➔ रस्त्यात ➔ दारात पोहोचत आहे ➔ डिलिव्हर्ड.\n- 📞 ड्रायव्हरचे नाव, मोबाईल नंबर, वाहन क्रमांक आणि थेट नकाशा मार्ग दिसेल.\n- ⏱️ दर ५ सेकंदांनी अचूक वेळ अपडेट होते.`
    }
  },
  {
    id: 'faq-4',
    number: 4,
    category: 'orders',
    categoryLabel: {
      en: 'Orders & Delivery',
      hi: 'ऑर्डर और डिलीवरी',
      te: 'ఆర్డర్లు & డెలివరీ',
      mr: 'ऑर्डर्स आणि डिलिव्हरी'
    },
    question: {
      en: 'Why did I get a popup notification when a delivery agent was assigned?',
      hi: 'डिलीवरी एजेंट नियुक्त होने पर मुझे पॉपअप सूचना क्यों मिली?',
      te: 'డెలివరీ ఏజెంట్ నియమించబడినప్పుడు నాకు పాప్-అప్ అలర్ట్ ఎందుకు వచ్చింది?',
      mr: 'डिलिव्हरी एजंट नेमल्यावर मला स्क्रीनवर पॉपअप सूचना का आली?'
    },
    hint: {
      en: 'Instant customer alert with agent name, contact, and vehicle',
      hi: 'एजेंट का नाम, मोबाइल और वाहन के साथ तुरंत ग्राहक अलर्ट',
      te: 'ఏజెంట్ పేరు, ఫోన్ మరియు వాహనం నంబర్‌తో అలర్ట్',
      mr: 'एजंटचे नाव, फोन व वाहन क्रमांकासह तात्काळ अलर्ट'
    },
    answer: {
      en: `**Interactive Delivery Assignment Alert:**\n- 🔔 As soon as the farmer assigns a delivery partner, an alert pops up on the customer screen.\n- 👤 Shows assigned driver name, phone number, and vehicle type.\n- 📞 Includes a one-tap **Call Delivery Agent** button for hassle-free coordination.\n- 🛡️ Keeps delivery fully transparent and secure.`,
      hi: `**इंटरैक्टिव डिलीवरी अलर्ट:**\n- 🔔 जैसे ही किसान किसी डिलीवरी एजेंट को नियुक्त करता है, ग्राहक की स्क्रीन पर तुरंत पॉपअप आता है।\n- 👤 इसमें ड्राइवर का नाम, मोबाइल नंबर और वाहन विवरण होता है।\n- 📞 सीधे बात करने के लिए **Call Delivery Agent** बटन उपलब्ध रहता है।\n- 🛡️ पूरी डिलीवरी प्रक्रिया को पारदर्शी बनाता है।`,
      te: `**తక్షణ డెలివరీ అలర్ట్:**\n- 🔔 రైతు డెలివరీ ఏజెంట్‌ను కేటాయించగానే కస్టమర్ స్క్రీన్‌పై అలర్ట్ పాప్-అప్ అవుతుంది.\n- 👤 ఇందులో డ్రైవర్ పేరు, ఫోన్ నంబర్, వాహనం వివరాలు ఉంటాయి.\n- 📞 నేరుగా మాట్లాడటానికి **Call Delivery Agent** బటన్ ఉంటుంది.\n- 🛡️ డెలివరీ సమాచారం పూర్తి పారదర్శకంగా ఉంటుంది.`,
      mr: `**डिलिव्हरी एजंट अलर्ट:**\n- 🔔 शेतकऱ्याने डिलिव्हरी एजंट नेमल्याबरोबर ग्राहकाच्या स्क्रीनवर पॉपअप येतो.\n- 👤 ड्रायव्हरचे नाव, मोबाईल आणि वाहनाचा प्रकार समोर दिसतो.\n- 📞 एका क्लिकवर संपर्क करण्यासाठी **Call Delivery Agent** बटण असते.\n- 🛡️ पारदर्शकता आणि सुरक्षिततेची पूर्ण खात्री.`
    }
  },
  {
    id: 'faq-5',
    number: 5,
    category: 'orders',
    categoryLabel: {
      en: 'Orders & Delivery',
      hi: 'ऑर्डर और डिलीवरी',
      te: 'ఆర్డర్లు & డెలివరీ',
      mr: 'ऑर्डर्स आणि डिलिव्हरी'
    },
    question: {
      en: 'How are distance-based delivery charges calculated?',
      hi: 'दूरी के आधार पर डिलीवरी शुल्क की गणना कैसे की जाती है?',
      te: 'దూరం ఆధారంగా డెలివరీ ఛార్జీలను ఎలా లెక్కిస్తారు?',
      mr: 'अंतरावर आधारित डिलिव्हरी चार्जेसची गणना कशी केली जाते?'
    },
    hint: {
      en: '₹5/km up to 5km, ₹3/km for 5-15km, ₹2/km long-haul',
      hi: '5 किमी तक ₹5/किमी, 5-15 किमी ₹3/किमी, आगे ₹2/किमी',
      te: '5 కి.మీ వరకు ₹5/కి.మీ, 5-15 కి.మీ ₹3/కి.మీ, పైన ₹2/కి.మీ',
      mr: '५ किमीपर्यंत ₹५/किमी, ५-१५ किमी ₹३/किमी, पुढे ₹२/किमी'
    },
    answer: {
      en: `**Fair Distance-Tiered Delivery Rates:**\n- 📏 **0 to 5 km:** ₹5 per km (minimum charge ₹25 for local dispatch).\n- 🚚 **5 to 15 km:** ₹3 per km for suburban routes.\n- 🛣️ **Beyond 15 km:** ₹2 per km economical rate for long hauls.\n- 💰 **100% to Farmer:** Every single rupee of delivery fee is added directly to the farmer's net payout!`,
      hi: `**उचित दूरी-आधारित डिलीवरी दरें:**\n- 📏 **0 से 5 किमी:** ₹5 प्रति किमी (स्थानीय न्यूनतम ₹25)।\n- 🚚 **5 से 15 किमी:** ₹3 प्रति किमी।\n- 🛣️ **15 किमी से अधिक:** लंबी दूरी के लिए मात्र ₹2 प्रति किमी।\n- 💰 **100% किसान को:** डिलीवरी शुल्क का पूरा पैसा सीधे किसान के खाते में जाता है!`,
      te: `**సరసమైన దూరపు డెలివరీ ఛార్జీలు:**\n- 📏 **0 నుండి 5 కి.మీ:** కిలోమీటరుకు ₹5 (కనిష్ట ఛార్జ్ ₹25).\n- 🚚 **5 నుండి 15 కి.మీ:** కిలోమీటరుకు ₹3.\n- 🛣️ **15 కి.మీ పైన:** ఎక్కువ దూరాలకు కిలోమీటరుకు ₹2 మాత్రమే.\n- 💰 **100% రైతుకే:** డెలివరీ ఫీజు మొత్తం నేరుగా రైతు ఖాతాకే జమవుతుంది!`,
      mr: `**रास्त अंतर-आधारित डिलिव्हरी दर:**\n- 📏 **० ते ५ किमी:** ₹५ प्रति किमी (किमान ₹२५).\n- 🚚 **५ ते १५ किमी:** ₹३ प्रति किमी.\n- 🛣️ **१५ किमीच्या पुढे:** लांब पल्ल्यासाठी फक्त ₹२ प्रति किमी.\n- 💰 **१००% शेतकऱ्याला:** डिलिव्हरी फीचा प्रत्येक रुपया थेट शेतकऱ्याच्या खात्यात जमा होतो!`
    }
  },

  // -------------------------------------------------------------
  // Category 2: Farmer Selling & Produce (Q6 - Q10)
  // -------------------------------------------------------------
  {
    id: 'faq-6',
    number: 6,
    category: 'farmer',
    categoryLabel: {
      en: 'Farmer & Crops',
      hi: 'किसान और फसल बिक्री',
      te: 'రైతు & ఉత్పత్తులు',
      mr: 'शेतकरी आणि विक्री'
    },
    question: {
      en: 'How do I list my harvested crops for sale on FarmiQ?',
      hi: 'मैं अपनी फसल को FarmiQ पर बिक्री के लिए कैसे सूचीबद्ध करूँ?',
      te: 'FarmiQ లో నా పంట ఉత్పత్తులను అమ్మకానికి ఎలా జాబితా చేయాలి?',
      mr: 'मी माझा शेतमाल FarmiQ वर विक्रीसाठी कसा जोडू शकतो?'
    },
    hint: {
      en: 'Specify crop, quantity, modal price, harvest date, and grade',
      hi: 'फसल का नाम, मात्रा, भाव प्रति किलो, तुड़ाई की तारीख और ग्रेड चुनें',
      te: 'పంట, పరిమాణం, కిలో ధర, కోత తేదీ మరియు గ్రేడ్ నమోదు చేయండి',
      mr: 'पिकाचे नाव, वजन, दर प्रति किलो, काढणी तारीख व प्रत निवडा'
    },
    answer: {
      en: `**Listing Produce on FarmiQ:**\n- 🌾 In your Farmer Dashboard, tap **Add Produce Listing**.\n- 🏷️ Select crop name (e.g. Onion, Tomato, Mango) and variety.\n- ⚖️ Enter available stock quantity (in kg or quintals) and your selling price.\n- 🌟 Choose Quality Grade (**Grade-A** or **Grade-B**) and harvest date.\n- 📸 An authentic high-resolution crop photo is assigned automatically!`,
      hi: `**FarmiQ पर फसल की लिस्टिंग:**\n- 🌾 किसान डैशबोर्ड में **Add Produce Listing** पर टैप करें।\n- 🏷️ फसल का नाम (जैसे प्याज, टमाटर, गेहूं) और किस्म चुनें।\n- ⚖️ उपलब्ध मात्रा (किग्रा/क्विंटल) और अपना विक्रय मूल्य दर्ज करें।\n- 🌟 गुणवत्ता ग्रेड (**Grade-A** या **Grade-B**) और तुड़ाई की तारीख चुनें।\n- 📸 प्रामाणिक फोटो अपने आप जुड़ जाएगी!`,
      te: `**పంటను లిస్ట్ చేసే విధానం:**\n- 🌾 రైతు డ్యాష్‌బోర్డ్‌లో **Add Produce Listing** పై క్లిక్ చేయండి.\n- 🏷️ పంట పేరు (టమోటా, ఉల్లి, మామిడి) మరియు రకాన్ని ఎంచుకోండి.\n- ⚖️ అందుబాటులో ఉన్న బరువు మరియు మీ అమ్మకపు ధరను నమోదు చేయండి.\n- 🌟 నాణ్యత గ్రేడ్ (**Grade-A** లేదా **Grade-B**) మరియు కోత తేదీని ఇవ్వండి.\n- 📸 స్వయంచాలకంగా నాణ్యమైన ఫోటో జతచేయబడుతుంది!`,
      mr: `**शेतमाल लिस्ट करण्याची पद्धत:**\n- 🌾 शेतकरी डॅशबोर्डवर **Add Produce Listing** वर क्लिक करा.\n- 🏷️ पिकाचे नाव (उदा. कांदा, टोमॅटो, गहू) व वाण निवडा.\n- ⚖️ उपलब्ध साठा (किलो/क्विंटल) आणि तुमचा विक्री दर भरा.\n- 🌟 शेतमालाची प्रत (**Grade-A** किंवा **Grade-B**) व काढणीची तारीख निवडा.\n- 📸 उच्च दर्जाचा फोटो आपोआप जोडला जाईल!`
    }
  },
  {
    id: 'faq-7',
    number: 7,
    category: 'farmer',
    categoryLabel: {
      en: 'Farmer & Crops',
      hi: 'किसान और फसल बिक्री',
      te: 'రైతు & ఉత్పత్తులు',
      mr: 'शेतकरी आणि विक्री'
    },
    question: {
      en: 'How does quality grading (Grade-A vs Grade-B) affect selling prices?',
      hi: 'गुणवत्ता ग्रेडिंग (Grade-A बनाम Grade-B) से बिक्री मूल्य पर क्या असर पड़ता है?',
      te: 'క్వాలిటీ గ్రేడింగ్ (Grade-A vs Grade-B) వలన అమ్మకపు ధరలపై ఎలాంటి ప్రభావం ఉంటుంది?',
      mr: 'क्वालिटी ग्रेडिंगमुळे (Grade-A विरुद्ध Grade-B) विक्री दरावर काय परिणाम होतो?'
    },
    hint: {
      en: 'Grade-A commands 15-25% premium from institutional buyers',
      hi: 'Grade-A पर कॉर्पोरेट खरीदारों से 15-25% अधिक प्रीमियम मिलता है',
      te: 'Grade-A ఉత్పత్తులకు పెద్ద కొనుగోలుదారులు 15-25% ఎక్కువ ధర ఇస్తారు',
      mr: 'Grade-A मालाला संस्थात्मक खरेदीदारांकडून १५-२५% जास्त भाव मिळतो'
    },
    answer: {
      en: `**Quality Grading Standards:**\n- 🥇 **Grade-A Produce:** Uniform size, vibrant color, zero blemishes, and harvested within 24-48 hours. Commands 15-25% premium price, preferred by institutional retail buyers.\n- 🥈 **Grade-B Produce:** Slight variations in size/shape, ideal for local retail markets and processing units at competitive rates.\n- 🏷️ Clear grading builds buyer trust and prevents doorstep disputes.`,
      hi: `**गुणवत्ता ग्रेडिंग मानक:**\n- 🥇 **Grade-A उपज:** एक समान आकार, चमकीला रंग, दाग-धब्बे रहित, 24-48 घंटे में तोड़ा गया माल। इस पर 15-25% अधिक भाव मिलता है।\n- 🥈 **Grade-B उपज:** आकार में थोड़ा अंतर, स्थानीय बाजार और फूड प्रोसेसिंग के लिए उपयुक्त।\n- 🏷️ स्पष्ट ग्रेडिंग से खरीदारों का भरोसा बढ़ता है।`,
      te: `**నాణ్యత గ్రేడింగ్ ప్రమాణాలు:**\n- 🥇 **Grade-A:** ఒకే పరిమాణం, తాజాదనం, మచ్చలు లేని నాణ్యమైన పంట. పెద్ద కొనుగోలుదారుల నుండి 15-25% ఎక్కువ ధర లభిస్తుంది.\n- 🥈 **Grade-B:** సాధారణ మార్కెట్ మరియు ప్రాసెసింగ్ కంపెనీలకు సరిపోయే ఉత్పత్తి.\n- 🏷️ సరైన గ్రేడింగ్ ద్వారా కొనుగోలుదారుల నమ్మకం పెరుగుతుంది.`,
      mr: `**गुणवत्ता प्रतवारीचे निकष:**\n- 🥇 **Grade-A माल:** एकसारखा आकार, डाग नसलेला, २४-४८ तासांत तोडलेला माल. याला १५-२५% जास्त भाव मिळतो.\n- 🥈 **Grade-B माल:** स्थानिक बाजारपेठ आणि प्रक्रियेसाठी उपयुक्त शेतमाल.\n- 🏷️ योग्य प्रतवारीमुळे ग्राहकांचा विश्वास वाढतो.`
    }
  },
  {
    id: 'faq-8',
    number: 8,
    category: 'farmer',
    categoryLabel: {
      en: 'Farmer & Crops',
      hi: 'किसान और फसल बिक्री',
      te: 'రైతు & ఉత్పత్తులు',
      mr: 'शेतकरी आणि विक्री'
    },
    question: {
      en: 'Can farmers upload photos and specify harvest dates for produce?',
      hi: 'क्या किसान फोटो अपलोड कर सकते हैं और फसल की तुड़ाई तारीख लिख सकते हैं?',
      te: 'రైతులు ఉత్పత్తుల ఫోటోలు మరియు కోత తేదీలను నమోదు చేయవచ్చా?',
      mr: 'शेतकरी मालाचे फोटो आणि काढणीची तारीख नमूद करू शकतात का?'
    },
    hint: {
      en: 'Yes, full control over photos, harvest date, and batch description',
      hi: 'हाँ, फोटो, तुड़ाई की तारीख और विवरण पर पूरा नियंत्रण',
      te: 'అవును, ఫోటోలు, కోత తేదీ మరియు వివరాలపై పూర్తి నియంత్రణ ఉంటుంది',
      mr: 'होय, फोटो, काढणी तारीख व पिकाच्या माहितीवर पूर्ण नियंत्रण'
    },
    answer: {
      en: `**Farm Photos & Harvest Dates:**\n- 📸 Yes! When listing produce, farmers can specify the exact harvest date so buyers know the freshness level.\n- 🖼️ FarmiQ supplies authentic verified photos of the crop variety automatically, or you can paste a custom photo link.\n- 📅 Produce shows a "Harvested On" badge to maximize sales velocity.`,
      hi: `**फोटो और तुड़ाई तारीख:**\n- 📸 जी हाँ! फसल लिस्ट करते समय किसान सही तुड़ाई की तारीख लिख सकते हैं ताकि खरीदार को ताजगी का पता चले।\n- 🖼️ FarmiQ प्रामाणिक फसल फोटो अपने आप जोड़ता है, या आप कस्टम लिंक भी लगा सकते हैं।\n- 📅 उत्पाद पर "तुड़ाई की तारीख" का स्पष्ट बैज दिखाई देता है।`,
      te: `**ఫోటోలు & కోత వివరాలు:**\n- 📸 ఖచ్చితంగా! పంట ఎప్పుడు కోయబడిందో నమోదు చేయడం ద్వారా కొనుగోలుదారులకు తాజాదనం తెలుస్తుంది.\n- 🖼️ FarmiQ సహజమైన ఫోటోలను స్వయంగా అందిస్తుంది, లేదా మీరూ జోడించవచ్చు.\n- 📅 ఉత్పత్తులపై కోత తేదీ స్పష్టంగా కనిపిస్తుంది.`,
      mr: `**फोटो व काढणी माहिती:**\n- 📸 होय! माल लिस्ट करताना शेतकरी काढणीची अचूक तारीख टाकू शकतात जेणेकरून ग्राहकांना ताजेपणा समजेल.\n- 🖼️ FarmiQ अस्सल फोटो आपोआप जोडते, किंवा शेतकरी स्वतः लिंक टाकू शकतात.\n- 📅 उत्पादनावर काढणीच्या तारखेचा बॅज ठळकपणे दिसतो.`
    }
  },
  {
    id: 'faq-9',
    number: 9,
    category: 'farmer',
    categoryLabel: {
      en: 'Farmer & Crops',
      hi: 'किसान और फसल बिक्री',
      te: 'రైతు & ఉత్పత్తులు',
      mr: 'शेतकरी आणि विक्री'
    },
    question: {
      en: 'What happens when stock runs out or gets sold out?',
      hi: 'जब स्टॉक समाप्त या बिक जाता है तो क्या होता है?',
      te: 'స్టాక్ అయిపోతే లేదా పూర్తిగా అమ్ముడుపోతే ఏమి జరుగుతుంది?',
      mr: 'शेतमाल संपल्यावर किंवा सर्व विकल्या गेल्यावर काय होते?'
    },
    hint: {
      en: 'Listing marks Out of Stock automatically, no accidental orders',
      hi: 'लिस्टिंग अपने आप आउट ऑफ स्टॉक हो जाती है, गलत ऑर्डर नहीं आते',
      te: 'స్వయంచాలకంగా అవుట్ ఆఫ్ స్టాక్ అవుతుంది, పొరపాటు ఆర్డర్లు రావు',
      mr: 'माल आपोआप आउट ऑफ स्टॉक होतो, अतिरिक्त ऑर्डर्स येत नाहीत'
    },
    answer: {
      en: `**Stock Depletion & Auto-Protection:**\n- 📉 As orders are placed, the remaining stock automatically decreases in real time.\n- 🛑 When quantity reaches 0, the card displays an **Out of Stock** badge and purchase is disabled.\n- 🔄 Farmers can edit the listing anytime to restock additional quantity after the next harvest.`,
      hi: `**स्टॉक सुरक्षा प्रणाली:**\n- 📉 ऑर्डर आने पर उपलब्ध स्टॉक अपने आप घटता जाता है।\n- 🛑 जब स्टॉक 0 हो जाता है, तो कार्ड पर **Out of Stock** आ जाता है और खरीदारी रुक जाती है।\n- 🔄 अगली तुड़ाई के बाद किसान किसी भी समय लिस्टिंग एडिट करके स्टॉक बढ़ा सकते हैं।`,
      te: `**స్టాక్ నిర్వహణ:**\n- 📉 ఆర్డర్లు వచ్చిన కొద్దీ మిగిలిన స్టాక్ లైవ్‌లో తగ్గుతుంది.\n- 🛑 పరిమాణం 0 కాగానే కార్డుపై **Out of Stock** అని పడి కొనుగోలు ఆగిపోతుంది.\n- 🔄 తదుపరి కోత తర్వాత రైతు ఎప్పుడైనా పరిమాణాన్ని అప్‌డేట్ చేయవచ్చు.`,
      mr: `**साठा व्यवस्थापन व सुरक्षितता:**\n- 📉 ऑर्डर्स आल्यावर शिल्लक साठा आपोआप कमी होतो.\n- 🛑 साठा ० झाल्यावर कार्डवर **Out of Stock** बॅज येतो आणि खरेदी थांबते.\n- 🔄 नवीन काढणी झाल्यावर शेतकरी पुन्हा साठा वाढवू शकतात.`
    }
  },
  {
    id: 'faq-10',
    number: 10,
    category: 'farmer',
    categoryLabel: {
      en: 'Farmer & Crops',
      hi: 'किसान और फसल बिक्री',
      te: 'రైతు & ఉత్పత్తులు',
      mr: 'शेतकरी आणि विक्री'
    },
    question: {
      en: 'How can Farmer Producer Organizations (FPOs) aggregate collective lots?',
      hi: 'किसान उत्पादक संगठन (FPO) सामूहिक लॉट कैसे बना सकते हैं?',
      te: 'రైతు ఉత్పత్తిదారుల సంఘాలు (FPO) సామూహిక పంటలను ఎలా సేకరించవచ్చు?',
      mr: 'शेतकरी उत्पादक कंपन्या (FPO) एकत्रित लॉट्स कसे बनवू शकतात?'
    },
    hint: {
      en: 'Aggregate small farmer harvests into bulk truckloads for corporate buyers',
      hi: 'छोटे किसानों की उपज को बड़े ट्रकलोड में जोड़कर कॉर्पोरेट को बेचें',
      te: 'చిన్న రైతుల పంటను కలిపి పెద్ద కొనుగోలుదారులకు అమ్మవచ్చు',
      mr: 'लहान शेतकऱ्यांचा माल एकत्र करून मोठ्या खरेदीदारांना विका'
    },
    answer: {
      en: `**FPO Collective Lots & Bulk Sourcing:**\n- 🚜 Smallholder farmers can pool their harvest into standardized **FPO Lots** (50 to 500 Quintals).\n- 🏢 Verified Corporate Buyers (like Reliance Fresh, BigBasket) purchase directly from FPO Lots via Escrow contracts.\n- 💰 Saves transport overhead and earns small farmers bulk institutional rates!`,
      hi: `**FPO सामूहिक लॉट प्रणाली:**\n- 🚜 छोटे किसान अपनी फसल को मिलाकर **FPO Lots** (50 से 500 क्विंटल) बना सकते हैं।\n- 🏢 बड़े कॉर्पोरेट खरीदार (जैसे रिलायंस, बिगबास्केट) सीधे FPO लॉट से एस्क्रो अनुबंध द्वारा खरीदते हैं।\n- 💰 परिवहन खर्च बचता है और छोटे किसानों को थोक का बेहतरीन भाव मिलता है!`,
      te: `**FPO సామూహిక ఉత్పత్తుల విక్రయం:**\n- 🚜 చిన్న రైతులు తమ పంటను కలిపి **FPO Lots** (50 నుండి 500 క్వింటాళ్లు) గా ఏర్పాటు చేయవచ్చు.\n- 🏢 పెద్ద సంస్థాగత కొనుగోలుదారులు నేరుగా FPO ల నుండి ఎస్క్రో ఒప్పందాల ద్వారా కొనుగోలు చేస్తారు.\n- 💰 రవాణా ఖర్చులు తగ్గి రైతులకు మంచి లాభాలు వస్తాయి!`,
      mr: `**FPO सामूहिक लॉट्स पद्धत:**\n- 🚜 लहान शेतकरी आपला शेतमाल एकत्र करून **FPO Lots** (५० ते ५०० क्विंटल) तयार करू शकतात.\n- 🏢 मोठे खरेदीदार (उदा. रिलायन्स, बिगबास्केट) थेट एस्क्रो कराराने संपूर्ण लॉट खरेदी करतात.\n- 💰 वाहतूक खर्च वाचतो आणि लहान शेतकऱ्यांनाही घाऊक बाजाराचा उच्च दर मिळतो!`
    }
  },

  // -------------------------------------------------------------
  // Category 3: Payment, Payouts & UPI (Q11 - Q15)
  // -------------------------------------------------------------
  {
    id: 'faq-11',
    number: 11,
    category: 'payouts',
    categoryLabel: {
      en: 'UPI & Earnings',
      hi: 'यूपीआई और भुगतान',
      te: 'UPI & చెల్లింపులు',
      mr: 'UPI आणि पेमेंट'
    },
    question: {
      en: 'How do I set up or update my custom UPI ID for instant payouts?',
      hi: 'त्वरित भुगतान के लिए मैं अपनी यूपीआई आईडी (UPI ID) कैसे सेट या बदलूँ?',
      te: 'చెల్లింపుల కోసం నా కస్టమ్ UPI ID ని ఎలా సెటప్ లేదా అప్‌డేట్ చేయాలి?',
      mr: 'थेट पेमेंटसाठी मी माझी UPI ID कशी सेट किंवा बदलू शकतो?'
    },
    hint: {
      en: 'Enter custom UPI ID at registration or edit anytime in Farmer Profile',
      hi: 'पंजीकरण के समय दर्ज करें या प्रोफाइल में कभी भी बदलें',
      te: 'రిజిస్ట్రేషన్ సమయంలో లేదా ప్రొఫైల్‌లో ఎప్పుడైనా మార్చుకోవచ్చు',
      mr: 'नोंदणी करताना टाका किंवा प्रोफाईलमध्ये कधीही बदला'
    },
    answer: {
      en: `**Farmer UPI ID Setup:**\n- 💳 Enter your personal UPI ID (e.g. \`kisan@okhdfcbank\`, \`farmer@sbi\`) during registration.\n- ⚙️ Update anytime in the **Farmer Dashboard ➔ Profile / Settings** tab.\n- ⚡ Customer direct payments and delivery settlements route straight to your linked bank account.\n- 🚫 Zero gateway hold-backs.`,
      hi: `**किसान UPI ID सेटअप:**\n- 💳 पंजीकरण करते समय अपनी व्यक्तिगत UPI ID (उदा. \`kisan@okhdfcbank\`, \`farmer@sbi\`) दर्ज करें।\n- ⚙️ कभी भी **Farmer Dashboard ➔ Profile / Settings** में जाकर अपडेट कर सकते हैं।\n- ⚡ ग्राहकों का भुगतान सीधे आपके बैंक खाते में जमा होता है।\n- 🚫 कोई बिचौलिया या भुगतान रोक नहीं।`,
      te: `**రైతు UPI ID సెటప్:**\n- 💳 రిజిస్ట్రేషన్ సమయంలో మీ వ్యక్తిగత UPI ID (ఉదా. \`kisan@okhdfcbank\`) నమోదు చేయండి.\n- ⚙️ ఎప్పుడైనా **Farmer Dashboard ➔ Profile / Settings** లో మార్చుకోవచ్చు.\n- ⚡ వినియోగదారుల చెల్లింపులు నేరుగా మీ బ్యాంక్ ఖాతాకే చేరుతాయి.\n- 🚫 ఎటువంటి ఆలస్యం ఉండదు.`,
      mr: `**शेतकरी UPI ID जोडणी:**\n- 💳 नोंदणी करताना तुमची वैयक्तिक UPI ID (उदा. \`kisan@okhdfcbank\`) टाका.\n- ⚙️ कधीही **Farmer Dashboard ➔ Profile / Settings** मध्ये बदलू शकता.\n- ⚡ ग्राहकांचे पैसे थेट तुमच्या बँक खात्यात तात्काळ जमा होतात.\n- 🚫 कोणतेही कमिशन कपात नाही.`
    }
  },
  {
    id: 'faq-12',
    number: 12,
    category: 'payouts',
    categoryLabel: {
      en: 'UPI & Earnings',
      hi: 'यूपीआई और भुगतान',
      te: 'UPI & చెల్లింపులు',
      mr: 'UPI आणि पेमेंट'
    },
    question: {
      en: 'Do farmers receive 100% of the customer-paid delivery fees?',
      hi: 'क्या ग्राहकों द्वारा दिया गया 100% डिलीवरी शुल्क किसान को मिलता है?',
      te: 'కస్టమర్ చెల్లించిన డెలివరీ రుసుము 100% రైతుకే అందుతుందా?',
      mr: 'ग्राहकांनी दिलेले १००% डिलिव्हरी चार्जेस शेतकऱ्यालाच मिळतात का?'
    },
    hint: {
      en: 'Yes, 100% of delivery fee is added directly to farmer net earnings',
      hi: 'हाँ, डिलीवरी का पूरा पैसा किसान की कुल कमाई में जुड़ता है',
      te: 'అవును, డెలివరీ ఫీజు మొత్తం రైతు ఆదాయంలో కలుస్తుంది',
      mr: 'होय, डिलिव्हरीचे १००% पैसे थेट शेतकऱ्याच्या नफ्यात जमा होतात'
    },
    answer: {
      en: `**100% Delivery Credited to Farmer:**\n- 💰 **Yes, Absolutely!** On FarmiQ, every single rupee of the calculated delivery fee is added to the farmer's net order total.\n- 📦 Payout Formula: \`Total Payout = Produce Value + Delivery Fee\`.\n- 🚜 Farmers are never penalized for local transport or fuel expenses.`,
      hi: `**100% डिलीवरी शुल्क किसान को:**\n- 💰 **जी हाँ, बिल्कुल!** FarmiQ पर दूरी के हिसाब से जुड़ा हुआ हर एक रुपया किसान की कुल कमाई में जाता है।\n- 📦 फॉर्मूला: \`कुल भुगतान = फसल की कीमत + डिलीवरी शुल्क\`।\n- 🚜 किसान को अपने वाहन या डिलीवरी का पूरा मुआवजा मिलता है।`,
      te: `**100% డెలివరీ ఫీజు రైతుకే:**\n- 💰 **అవును, ఖచ్చితంగా!** లెక్కించిన డెలివరీ ఛార్జీల మొత్తం పూర్తిగా రైతుకే చెల్లించబడుతుంది.\n- 📦 ఫార్ములా: \`మొత్తం ఆదాయం = పంట విలువ + డెలివరీ ఛార్జ్\`.\n- 🚜 రవాణా ఖర్చులను రైతు స్వయంగా భరించాల్సిన అవసరం లేదు.`,
      mr: `**१००% डिलिव्हरी फी शेतकऱ्याला:**\n- 💰 **होय, अगदी १००%!** FarmiQ वर डिलिव्हरी शुल्काचा प्रत्येक रुपया थेट शेतकऱ्याच्या एकूण कमाईत जोडला जातो.\n- 📦 हिशोब: \`एकूण पेमेंट = मालाची किंमत + डिलिव्हरी फी\`.\n- 🚜 शेतकऱ्याला वाहतुकीचा व इंधनाचा पूर्ण मोबदला मिळतो.`
    }
  },
  {
    id: 'faq-13',
    number: 13,
    category: 'payouts',
    categoryLabel: {
      en: 'UPI & Earnings',
      hi: 'यूपीआई और भुगतान',
      te: 'UPI & చెల్లింపులు',
      mr: 'UPI आणि पेमेंट'
    },
    question: {
      en: 'Are there any hidden deductions or commission fees taken from farmers?',
      hi: 'क्या किसानों से कोई छिपा हुआ शुल्क या कमीशन काटा जाता है?',
      te: 'రైతుల నుండి ఏదైనా రహస్య కమీషన్ లేదా ఛార్జీలు కట్ చేస్తారా?',
      mr: 'शेतकऱ्यांकडून कोणतीही छुपी कपात किंवा कमिशन कापले जाते का?'
    },
    hint: {
      en: 'Zero commission on direct farm produce sales',
      hi: 'सीधी फसल बिक्री पर शून्य कमीशन',
      te: 'ప్రత్యక్ష అమ్మకాలపై ఎలాంటి కమీషన్ ఉండదు',
      mr: 'थेट विक्रीवर शून्य टक्के कमिशन'
    },
    answer: {
      en: `**Zero Commission Policy for Farmers:**\n- 🚫 FarmiQ charges **0% commission** on direct farmer-to-customer retail sales.\n- 💵 What you set as your selling price per kg is exactly what you receive.\n- 🏛️ Institutional Escrow contracts have a transparent 1.5% platform fee split between buyer and seller to maintain escrow banking.`,
      hi: `**किसानों के लिए शून्य कमीशन नीति:**\n- 🚫 FarmiQ किसान से सीधे ग्राहक को बिक्री पर **0% कमीशन** लेता है।\n- 💵 आपने प्रति किलो जो भाव तय किया है, पूरा पैसा आपको मिलता है।\n- 🏛️ बड़े एस्क्रो अनुबंधों में एस्क्रो सुरक्षा के लिए मात्र 1.5% का पारदर्शी शुल्क दोनों पक्षों में बंटता है।`,
      te: `**రైతులకు జీరో కమీషన్ విధానం:**\n- 🚫 రైతు నుండి నేరుగా వినియోగదారునికి జరిగే అమ్మకాలపై FarmiQ **0% కమీషన్** తీసుకుంటుంది.\n- 💵 మీరు నిర్ణయించిన ధర మొత్తం మీకే అందుతుంది.\n- 🏛️ పెద్ద ఎస్క్రో ఒప్పందాలపై మాత్రమే 1.5% ప్లాట్‌ఫారమ్ రుసుము ఉంటుంది.`,
      mr: `**शेतकऱ्यांसाठी शून्य कमिशन धोरण:**\n- 🚫 FarmiQ थेट ग्राहक विक्रीवर **०% कमिशन** आकारते.\n- 💵 तुम्ही ठरवलेला प्रति किलो दर पूर्णपणे तुम्हालाच मिळतो.\n- 🏛️ संस्थात्मक एस्क्रो करारांवर बँकिंग सुरक्षिततेसाठी १.५% पारदर्शक फी विभागली जाते.`
    }
  },
  {
    id: 'faq-14',
    number: 14,
    category: 'payouts',
    categoryLabel: {
      en: 'UPI & Earnings',
      hi: 'यूपीआई और भुगतान',
      te: 'UPI & చెల్లింపులు',
      mr: 'UPI आणि पेमेंट'
    },
    question: {
      en: 'How fast are UPI settlements processed after order delivery?',
      hi: 'ऑर्डर डिलीवर होने के बाद यूपीआई सेटलमेंट कितनी जल्दी होता है?',
      te: 'ఆర్డర్ డెలివరీ అయిన తర్వాత UPI సెటిల్మెంట్ ఎంత త్వరగా జరుగుతుంది?',
      mr: 'ऑर्डर डिलिव्हरी झाल्यावर UPI पेमेंट किती वेळात जमा होते?'
    },
    hint: {
      en: 'Instant real-time transfer directly to the farmer UPI ID',
      hi: 'किसान की यूपीआई आईडी पर तुरंत रियल-टाइम ट्रांसफर',
      te: 'రైతు UPI ID కి తక్షణమే బదిలీ అవుతుంది',
      mr: 'शेतकऱ्याच्या UPI ID वर तात्काळ थेट ट्रान्सफर'
    },
    answer: {
      en: `**Instant Settlement Speed:**\n- ⚡ Deliveries settled via UPI or digital Escrow trigger **immediate transfer** upon customer delivery confirmation.\n- 📲 No 3-day holding periods or merchant delays.\n- 🔔 Instant SMS and on-screen confirmation with Bank Reference Number.`,
      hi: `**तत्काल सेटलमेंट गति:**\n- ⚡ यूपीआई या एस्क्रो से होने वाले भुगतान डिलीवरी कन्फर्म होते ही **तुरंत ट्रांसफर** हो जाते हैं।\n- 📲 कोई 3 दिन का होल्ड या मर्चेंट देरी नहीं होती।\n- 🔔 बैंक संदर्भ संख्या (UTR) के साथ तत्काल पुष्टि मिलती है।`,
      te: `**తక్షణ సెటిల్మెంట్ వేగం:**\n- ⚡ కస్టమర్ డెలివరీని ధృవీకరించిన వెంటనే డబ్బులు **తక్షణమే బదిలీ** అవుతాయి.\n- 📲 రోజుల తరబడి వేచి చూడాల్సిన అవసరం లేదు.\n- 🔔 బ్యాంక్ రిఫరెన్స్ నంబర్‌తో వెంటనే మెసేజ్ వస్తుంది.`,
      mr: `**झटपट पेमेंट जमा:**\n- ⚡ डिलिव्हरी कन्फर्म होताच UPI किंवा एस्क्रो पेमेंट **एका सेकंदात जमा** होते.\n- 📲 ३-४ दिवस थांबण्याची कोणतीही गरज नाही.\n- 🔔 बँक संदर्भ क्रमांकासह थेट मोबाईलवर मेसेज येतो.`
    }
  },
  {
    id: 'faq-15',
    number: 15,
    category: 'payouts',
    categoryLabel: {
      en: 'UPI & Earnings',
      hi: 'यूपीआई और भुगतान',
      te: 'UPI & చెల్లింపులు',
      mr: 'UPI आणि पेमेंट'
    },
    question: {
      en: 'How can a customer pay directly using UPI QR code upon delivery?',
      hi: 'डिलीवरी के समय ग्राहक यूपीआई क्यूआर कोड (QR Code) से सीधे कैसे भुगतान कर सकता है?',
      te: 'డెలివరీ సమయంలో కస్టమర్ UPI QR కోడ్ ద్వారా నేరుగా ఎలా చెల్లించవచ్చు?',
      mr: 'डिलिव्हरीच्या वेळी ग्राहक UPI QR कोड स्कॅन करून थेट पैसे कसे देऊ शकतो?'
    },
    hint: {
      en: 'Dynamic QR code generated on customer dashboard or invoice link',
      hi: 'ग्राहक डैशबोर्ड या इनवॉइस लिंक पर जनरेट हुआ डायनामिक क्यूआर कोड',
      te: 'కస్టమర్ డ్యాష్‌బోర్డ్ లేదా ఇన్వాయిస్ లింక్‌లో డైనమిక్ QR కోడ్ ఉంటుంది',
      mr: 'ग्राहक डॅशबोर्ड किंवा इनव्हॉइसवर थेट QR कोड स्कॅन करा'
    },
    answer: {
      en: `**Doorstep Dynamic UPI QR Payment:**\n- 📱 In the Customer Dashboard under Active Orders, tap **Pay Now (UPI)**.\n- 📸 A dynamic UPI QR code appears pre-filled with the exact order amount and farmer UPI ID.\n- 📲 Scan with any UPI app (PhonePe, Google Pay, Paytm, BHIM) for instant payment.\n- 🧾 Instant digital receipt generated immediately.`,
      hi: `**दरवाजे पर डायनामिक यूपीआई क्यूआर भुगतान:**\n- 📱 ग्राहक डैशबोर्ड में **Pay Now (UPI)** पर टैप करें।\n- 📸 सही राशि और किसान की UPI ID के साथ डायनामिक क्यूआर कोड सामने आ जाएगा।\n- 📲 किसी भी UPI ऐप (PhonePe, Google Pay, Paytm) से स्कैन करके भुगतान करें।\n- 🧾 तुरंत डिजिटल रसीद मिल जाती है।`,
      te: `**ఇంటి వద్ద డైనమిక్ UPI QR చెల్లింపు:**\n- 📱 కస్టమర్ డ్యాష్‌బోర్డ్‌లో **Pay Now (UPI)** క్లిక్ చేయండి.\n- 📸 సరైన బిల్లు మొత్తం మరియు రైతు UPI ID తో QR కోడ్ కనిపిస్తుంది.\n- 📲 PhonePe, Google Pay, Paytm ద్వారా స్కాన్ చేసి సులభంగా చెల్లించండి.\n- 🧾 వెంటనే డిజిటల్ రసీదు లభిస్తుంది.`,
      mr: `**दारात डायनॅमिक UPI QR कोड पेमेंट:**\n- 📱 ग्राहक डॅशबोर्डमध्ये **Pay Now (UPI)** वर क्लिक करा.\n- 📸 अचूक रकमेसह शेतकऱ्याचा QR कोड स्क्रीनवर येईल.\n- 📲 PhonePe, Google Pay, Paytm द्वारे स्कॅन करून सुरक्षित पेमेंट करा.\n- 🧾 तात्काळ डिजिटल पावती उपलब्ध होते.`
    }
  },

  // -------------------------------------------------------------
  // Category 4: Mandi Rates & APMC Geolocation (Q16 - Q20)
  // -------------------------------------------------------------
  {
    id: 'faq-16',
    number: 16,
    category: 'mandi',
    categoryLabel: {
      en: 'Mandi Rates',
      hi: 'मंडी भाव व APMC',
      te: 'మార్కెట్ ధరలు',
      mr: 'थेट बाजारभाव'
    },
    question: {
      en: 'How does FarmiQ calculate live Mandi benchmark rates by GPS location?',
      hi: 'FarmiQ जीपीएस लोकेशन के आधार पर लाइव मंडी भाव की गणना कैसे करता है?',
      te: 'FarmiQ జీపీఎస్ లొకేషన్ ఆధారంగా లైవ్ మార్కెట్ ధరలను ఎలా లెక్కిస్తుంది?',
      mr: 'FarmiQ जीपीएस लोकेशननुसार थेट बाजारभावाची गणना कशी करते?'
    },
    hint: {
      en: 'Haversine geodesic road distance algorithm to 20+ APMC yards',
      hi: '20+ APMC मंडियों की दूरी मापने वाला हावरसाइन एल्गोरिदम',
      te: '20 కి పైగా APMC మార్కెట్ల దూరాన్ని లెక్కించే హావర్సైన్ అల్గోరిథం',
      mr: '२०+ APMC बाजार समित्यांचे अंतर मोजणारा अचूक अल्गोरिदम'
    },
    answer: {
      en: `**GPS-Based Mandi Calculation:**\n- 📍 When you tap **Use My Location** on the Live Mandi Rates page, FarmiQ calculates your exact distance to 20+ APMC yards across India.\n- 📐 Uses the mathematical **Haversine formula** to measure real-world geodesic distances.\n- 🏆 Shows your closest local market first (e.g. Pune, Lasalgaon, Azadpur, Kolar) so you sell at true regional rates!`,
      hi: `**जीपीएस-आधारित मंडी गणना:**\n- 📍 लाइव मंडी भाव पेज पर **Use My Location** दबाने पर FarmiQ भारत की 20+ APMC मंडियों से आपकी सटीक दूरी निकालता है।\n- 📐 इसके लिए सटीक **हावरसाइन फॉर्मूला** का उपयोग किया जाता है।\n- 🏆 आपकी सबसे नजदीकी मंडी (जैसे पुणे, लासलगांव, आजादपुर, कोलार) सबसे ऊपर दिखती है।`,
      te: `**జీపీఎస్ ఆధారిత మార్కెట్ లెక్కలు:**\n- 📍 లైవ్ మార్కెట్ పేజీలో **Use My Location** నొక్కగానే మీ సమీపంలోని 20+ APMC మార్కెట్లతో దూరం లెక్కించబడుతుంది.\n- 📐 ఖచ్చితమైన **హావర్సైన్ ఫార్ములా** ఉపయోగించబడుతుంది.\n- 🏆 మీకు అత్యంత సమీపంలో ఉన్న మార్కెట్ (ఉదా. గుంటూరు, కోలార్, పూణే) ముందుగా కనిపిస్తుంది.`,
      mr: `**जीपीएसवर आधारित बाजारभाव गणना:**\n- 📍 थेट बाजारभाव पेजवर **Use My Location** क्लिक केल्यावर FarmiQ महाराष्ट्रातील व देशातील २०+ APMC चे अचूक अंतर मोजते.\n- 📐 **हावरसाइन गणितीय पद्धतीचा** वापर करून अंतर काढले जाते.\n- 🏆 तुमची सर्वात जवळची कृषी उत्पन्न बाजार समिती (उदा. पुणे, लासलगाव, वाशी) सर्वप्रथम दिसते.`
    }
  },
  {
    id: 'faq-17',
    number: 17,
    category: 'mandi',
    categoryLabel: {
      en: 'Mandi Rates',
      hi: 'मंडी भाव व APMC',
      te: 'మార్కెట్ ధరలు',
      mr: 'थेट बाजारभाव'
    },
    question: {
      en: 'Which major APMC Mandis are tracked across Maharashtra, Karnataka, and India?',
      hi: 'महाराष्ट्र, कर्नाटक और भारत की कौन-सी प्रमुख APMC मंडियों के भाव ट्रैक होते हैं?',
      te: 'మహారాష్ట్ర, కర్ణాటక మరియు భారతదేశంలోని ఏ ప్రధాన APMC మార్కెట్లు ట్రాక్ చేయబడుతున్నాయి?',
      mr: 'महाराष्ट्र व देशभरातील कोणत्या प्रमुख APMC बाजार समित्यांचे भाव ट्रॅक होतात?'
    },
    hint: {
      en: 'Lasalgaon, Pune Gultekdi, Azadpur, Vashi, Kolar, Guntur, and more',
      hi: 'लासलगांव, पुणे गुलटेकडी, आजादपुर, वाशी, कोलार, गुंटूर आदि',
      te: 'లాసల్‌గావ్, పూణే, ఆజాద్‌పూర్, వాషి, కోలార్, గుంటూరు మొదలైనవి',
      mr: 'लासलगाव, पुणे गुलटेकडी, वाशी, आझादपूर, कोल्हापूर, नाशिक इ.'
    },
    answer: {
      en: `**Tracked APMC Hubs:**\n- 🧅 **Maharashtra:** Lasalgaon (Onion hub), Pune Gultekdi, Vashi APMC (Navi Mumbai), Nashik, Pimpalgaon, Ratnagiri (Mango).\n- 🍅 **Karnataka & AP:** Kolar APMC (Tomato), Guntur (Chilli), Gadag, Kalaburagi.\n- 🌾 **North & Central India:** Azadpur Mandi Delhi, Indore APMC, Unjha Gujarat (Cumin/Spices).\n- 📊 All benchmarked with daily AGMARKNET volumes and arrivals.`,
      hi: `**ट्रैक होने वाली प्रमुख मंडियां:**\n- 🧅 **महाराष्ट्र:** लासलगांव (प्याज मंडी), पुणे गुलटेकडी, वाशी APMC (नवी मुंबई), नाशिक, पिंपलगांव, रत्नागिरी (आम)।\n- 🍅 **कर्नाटक व आंध्र:** कोलार APMC (टमाटर), गुंटूर (मिर्च), कलबुर्गी।\n- 🌾 **उत्तर व मध्य भारत:** आजादपुर मंडी दिल्ली, इंदौर, उंझा गुजरात (जीरा)।\n- 📊 सभी भाव AGMARKNET की दैनिक आवक से प्रमाणित हैं।`,
      te: `**ట్రాక్ చేయబడే ప్రముఖ మార్కెట్లు:**\n- 🧅 **మహారాష్ట్ర:** లాసల్‌గావ్ (ఉల్లి మార్కెట్), పూణే, వాషి, నాసిక్, రత్నగిరి (మామిడి).\n- 🍅 **దక్షిణ భారతం:** కోలార్ (టమోటా), గుంటూరు (మిర్చి), కలబురగి.\n- 🌾 **ఇతర రాష్ట్రాలు:** ఆజాద్‌పూర్ ఢిల్లీ, ఇండోర్, ఉంఝా గుజరాత్ (జీలకర్ర).\n- 📊 ప్రతిరోజూ అధికారిక AGMARKNET ధరలతో అప్‌డేట్ అవుతాయి.`,
      mr: `**समाविष्ट प्रमुख कृषी बाजार समित्या:**\n- 🧅 **महाराष्ट्र:** लासलगाव (आशियातील सर्वात मोठी कांदा बाजारपेठ), पुणे गुलटेकडी, वाशी मुंबई, नाशिक, पिंपळगाव, रत्नागिरी (हापूस आंबा).\n- 🍅 **कर्नाटक व आंध्र:** कोलार (टोमॅटो), गुंटूर (मिरची), कलबुर्गी (तूर डाळ).\n- 🌾 **इतर राज्ये:** आझादपूर दिल्ली, इंदूर, उंझा गुजरात (जिरे).\n- 📊 रोजच्या रोज AGMARKNET आवक व भावानुसार अपडेट.`
    }
  },
  {
    id: 'faq-18',
    number: 18,
    category: 'mandi',
    categoryLabel: {
      en: 'Mandi Rates',
      hi: 'मंडी भाव व APMC',
      te: 'మార్కెట్ ధరలు',
      mr: 'थेट बाजारभाव'
    },
    question: {
      en: 'How do I toggle produce prices between Per Kg and Per Quintal (100 kg)?',
      hi: 'प्रति किलो (₹/kg) और प्रति क्विंटल (₹/Quintal) के बीच भाव कैसे बदलें?',
      te: 'ధరలను కిలో (₹/kg) మరియు క్వింటాల్ (₹/Quintal) మధ్య ఎలా మార్చాలి?',
      mr: 'प्रति किलो (₹/kg) आणि प्रति क्विंटल (₹/Quintal) दर कसे बदलायचे?'
    },
    hint: {
      en: 'Use the unit switcher button on the Live Mandi Rates page',
      hi: 'लाइव मंडी भाव पेज पर यूनिट स्विचर बटन दबाएं (1 क्विंटल = 100 किग्रा)',
      te: 'లైవ్ మార్కెట్ పేజీలోని యూనిట్ స్విచ్చర్ బటన్ ఉపయోగించండి (1 క్వింటాల్ = 100 కిలోలు)',
      mr: 'थेट बाजारभाव पेजवरील युनिट बटणावर क्लिक करा (१ क्विंटल = १०० किलो)'
    },
    answer: {
      en: `**Unit Switcher (Kg vs Quintal):**\n- ⚖️ On the **Live Mandi Rates** page, look at the filter bar right above the crop cards.\n- 🔘 Tap **₹ / kg** for retail household rates, or tap **₹ / Quintal (100 kg)** for wholesale APMC auction benchmarks.\n- 🔄 All card prices and modal rates convert instantly in real time!`,
      hi: `**इकाई स्विचर (किलो बनाम क्विंटल):**\n- ⚖️ **Live Mandi Rates** पेज पर फिल्टर बार के पास यूनिट बटन देखें।\n- 🔘 खुदरा भाव के लिए **₹ / kg** दबाएं, या थोक नीलामी के लिए **₹ / Quintal (100 kg)** चुनें।\n- 🔄 सभी फसलों के भाव तुरंत उसी इकाई में बदल जाएंगे!`,
      te: `**యూనిట్ మార్పిడి (కిలో vs క్వింటాల్):**\n- ⚖️ **Live Mandi Rates** పేజీలోని ఫిల్టర్ బార్ వద్ద ఉన్న బటన్‌ను గమనించండి.\n- 🔘 చిల్లర ధరల కోసం **₹ / kg**, లేదా హోల్‌సేల్ వేలం ధరల కోసం **₹ / Quintal** ఎంచుకోండి.\n- 🔄 కార్డులలోని ధరలు తక్షణమే మారిపోతాయి!`,
      mr: `**युनिट बदल (किलो विरुद्ध क्विंटल):**\n- ⚖️ **Live Mandi Rates** पेजवर फिल्टर बार शेजारी युनिट बटण तपासा.\n- 🔘 किरकोळ दरासाठी **₹ / kg** आणि घाऊक लिलावासाठी **₹ / Quintal (100 kg)** निवडा.\n- 🔄 सर्व शेतमालाचे दर तत्काळ त्यानुसार बदलतात!`
    }
  },
  {
    id: 'faq-19',
    number: 19,
    category: 'mandi',
    categoryLabel: {
      en: 'Mandi Rates',
      hi: 'मंडी भाव व APMC',
      te: 'మార్కెట్ ధరలు',
      mr: 'थेट बाजारभाव'
    },
    question: {
      en: 'What do the price trend arrows (Up, Down, Stable) and arrivals mean?',
      hi: 'मूल्य रुझान तीर (Up, Down, Stable) और दैनिक आवक का क्या अर्थ है?',
      te: 'ధర ట్రెండ్ బాణాలు (Up, Down, Stable) మరియు రాకలు (Arrivals) ఏమి సూచిస్తాయి?',
      mr: 'दरातील चढ-उतार बाण (Up, Down, Stable) आणि आवक (Arrivals) चा काय अर्थ आहे?'
    },
    hint: {
      en: 'Green arrow means prices rising, Red means declining, Stable means steady',
      hi: 'हरा तीर मतलब भाव बढ़ रहे हैं, लाल मतलब घट रहे हैं, स्थिर मतलब सामान्य',
      te: 'ఆకుపచ్చ బాణం ధర పెరుగుదలను, ఎరుపు బాణం తగ్గుదలను సూచిస్తుంది',
      mr: 'हिरवा बाण भाव वाढ दर्शवतो, लाल बाण घसरण दर्शवतो'
    },
    answer: {
      en: `**Market Trends & Arrival Volumes:**\n- 🟢 **Green Arrow (UP):** Market price increased today compared to yesterday's closing auction.\n- 🔴 **Red Arrow (DOWN):** Increased arrivals caused a temporary price dip.\n- ⚪ **Gray (STABLE):** Balanced supply and steady demand.\n- 🚛 **Arrivals (Tonnes):** Total truck volume registered at the APMC yard today. High arrivals usually lead to softening prices.`,
      hi: `**बाजार रुझान और आवक:**\n- 🟢 **हरा तीर (UP):** कल की नीलामी के मुकाबले आज भाव में तेजी है।\n- 🔴 **लाल तीर (DOWN):** ज्यादा आवक के कारण भाव में नरमी आई है।\n- ⚪ **धूसर (STABLE):** मांग और आपूर्ति संतुलित है।\n- 🚛 **दैनिक आवक (टन):** आज मंडी में पहुंचे कुल ट्रकों का माल। भारी आवक से भाव पर दबाव रहता है।`,
      te: `**మార్కెట్ ట్రెండ్ వివరాలు:**\n- 🟢 **ఆకుపచ్చ (UP):** నిన్నటితో పోలిస్తే ఈరోజు మార్కెట్‌లో ధర పెరిగింది.\n- 🔴 **ఎరుపు (DOWN):** ఎక్కువ సరుకు రావడం వల్ల ధర కాస్త తగ్గింది.\n- ⚪ **STABLE:** డిమాండ్ మరియు సరఫరా సమానంగా ఉన్నాయి.\n- 🚛 **ఆవకాలు (టన్నులు):** ఈరోజు మార్కెట్‌కు వచ్చిన మొత్తం సరుకు పరిమాణం.`,
      mr: `**बाजार कल व आवक माहिती:**\n- 🟢 **हिरवा बाण (UP):** कालच्या तुलनेत आज बाजारात भाव वधारले आहेत.\n- 🔴 **लाल बाण (DOWN):** जास्त आवक झाल्यामुळे दरात किंचित घसरण झाली आहे.\n- ⚪ **STABLE:** पुरवठा आणि मागणी स्थिर आहे.\n- 🚛 **आवक (टन):** आज बाजार समितीत दाखल झालेला एकूण शेतमाल. जास्त आवक असल्यास भाव मवाळ होतात.`
    }
  },
  {
    id: 'faq-20',
    number: 20,
    category: 'mandi',
    categoryLabel: {
      en: 'Mandi Rates',
      hi: 'मंडी भाव व APMC',
      te: 'మార్కెట్ ధరలు',
      mr: 'थेट बाजारभाव'
    },
    question: {
      en: 'How do I find the nearest APMC yard to my village or farm?',
      hi: 'मैं अपने गांव या खेत से सबसे नजदीकी APMC मंडी कैसे खोजूँ?',
      te: 'నా గ్రామం లేదా పొలానికి అత్యంత సమీపంలో ఉన్న APMC మార్కెట్‌ను ఎలా కనుగొనాలి?',
      mr: 'माझ्या गावापासून किंवा शेतापासून सर्वात जवळची APMC बाजार समिती कशी शोधायची?'
    },
    hint: {
      en: 'Click Use My Location or filter by State and District dropdowns',
      hi: 'Use My Location दबाएं या राज्य और जिले के ड्रॉपडाउन से चुनें',
      te: 'Use My Location క్లిక్ చేయండి లేదా రాష్ట్రం, జిల్లా ఎంచుకోండి',
      mr: 'Use My Location वर क्लिक करा किंवा राज्य व जिल्हा निवडा'
    },
    answer: {
      en: `**Finding Nearest Mandi Yard:**\n- 📍 1. Tap **Use My Location** on the Live Mandi Rates page.\n- 🧭 2. Your closest APMC market is highlighted automatically with exact road distance in kilometers.\n- 🗺️ 3. Switch to **Map View** to see interactive GPS pins of all nearby market yards and contact phone numbers!`,
      hi: `**नजदीकी मंडी खोजने का तरीका:**\n- 📍 1. Live Mandi Rates पेज पर **Use My Location** पर क्लिक करें।\n- 🧭 2. सबसे नजदीकी मंडी किलोमीटर में सटीक दूरी के साथ सबसे ऊपर आ जाएगी।\n- 🗺️ 3. **Map View** चुनकर आप सभी मंडियों के पिन और उनके हेल्पलाइन फोन नंबर भी देख सकते हैं!`,
      te: `**సమీప మార్కెట్‌ను కనుగొనడం:**\n- 📍 1. Live Mandi Rates పేజీలో **Use My Location** పై క్లిక్ చేయండి.\n- 🧭 2. మీ సమీప మార్కెట్ ఖచ్చితమైన కిలోమీటర్ల దూరంతో పైన కనిపిస్తుంది.\n- 🗺️ 3. **Map View** ఎంచుకోవడం ద్వారా మ్యాప్‌లో అన్ని మార్కెట్లు మరియు ఫోన్ నంబర్లు చూడవచ్చు!`,
      mr: `**जवळची बाजार समिती शोधणे:**\n- 📍 १. Live Mandi Rates पेजवर **Use My Location** वर क्लिक करा.\n- 🧭 २. तुमची सर्वात जवळची बाजार समिती अचूक किलोमीटर अंतरासह सर्वात वर दिसेल.\n- 🗺️ ३. **Map View** निवडून तुम्ही नकाशावर सर्व समित्या आणि त्यांचे संपर्क क्रमांक पाहू शकता!`
    }
  },

  // -------------------------------------------------------------
  // Category 5: Verified Corporate Buyers & Escrow (Q21 - Q25)
  // -------------------------------------------------------------
  {
    id: 'faq-21',
    number: 21,
    category: 'contracts',
    categoryLabel: {
      en: 'Escrow Contracts',
      hi: 'एस्क्रो अनुबंध',
      te: 'ఎస్క్రో ఒప్పందాలు',
      mr: 'डिजिटल करार'
    },
    question: {
      en: 'How do Digital Contracts protect verified buyers and farmers?',
      hi: 'डिजिटल अनुबंध (Digital Contracts) कॉर्पोरेट खरीदारों और किसानों की रक्षा कैसे करते हैं?',
      te: 'డిజిటల్ ఒప్పందాలు సంస్థాగత కొనుగోలుదారులు మరియు రైతులను ఎలా రక్షిస్తాయి?',
      mr: 'डिजिटल करार (Digital Contracts) मोठे खरेदीदार आणि शेतकऱ्यांचे संरक्षण कसे करतात?'
    },
    hint: {
      en: '100% pre-funded Escrow lock guarantees payment and eliminates rejection risk',
      hi: '100% एस्क्रो लॉक से भुगतान की गारंटी और माल रिजेक्शन का शून्य जोखिम',
      te: '100% ముందస్తు ఎస్క్రో భద్రతతో చెల్లింపు గ్యారెంటీ',
      mr: '१००% आगाऊ एस्क्रो लॉकमुळे पैशांची पूर्ण खात्री'
    },
    answer: {
      en: `**Digital Contract Protection:**\n- 🤝 Institutional buyers (retail chains, processors) sign binding digital contracts with pre-agreed harvest volume and fixed prices.\n- 🔒 **100% Escrow Funding:** The buyer must lock the entire purchase funds into FarmiQ Escrow before farm dispatch begins.\n- 🛡️ Farmers are protected against market price crashes and arbitrary roadside rejections.`,
      hi: `**डिजिटल अनुबंध सुरक्षा:**\n- 🤝 बड़े खरीदार (जैसे रिटेल चेन, फूड कंपनियां) पूर्व-निर्धारित मूल्य और मात्रा पर डिजिटल अनुबंध करते हैं।\n- 🔒 **100% एस्क्रो लॉक:** माल उठाने से पहले खरीदार को पूरी रकम एस्क्रो खाते में जमा करनी होती है।\n- 🛡️ किसानों को बाजार में अचानक भाव गिरने या माल रिजेक्ट होने के जोखिम से 100% सुरक्षा मिलती है।`,
      te: `**డిజిటల్ కాంట్రాక్ట్ రక్షణ:**\n- 🤝 పెద్ద కొనుగోలుదారులు స్థిరమైన ధర మరియు పరిమాణంపై ముందస్తు ఒప్పందాలు చేసుకుంటారు.\n- 🔒 **100% ఎస్క్రో రక్షణ:** పంట లోడింగ్ మొదలయ్యే ముందే కొనుగోలుదారుడు మొత్తం సొమ్మును ఎస్క్రోలో జమ చేయాలి.\n- 🛡️ మార్కెట్ ధరలు తగ్గినా రైతులకు ఎలాంటి నష్టం ఉండదు.`,
      mr: `**डिजिटल कराराची सुरक्षितता:**\n- 🤝 मोठे खरेदीदार ठरावीक भाव व वजनावर शेतकऱ्यांशी थेट कायदेशीर डिजिटल करार करतात.\n- 🔒 **१००% एस्क्रो लॉक:** माल भरण्यापूर्वीच खरेदीदाराला संपूर्ण रक्कम एस्क्रोमध्ये सुरक्षित ठेवावी लागते.\n- 🛡️ बाजारात अचानक भाव पडले तरी शेतकऱ्याला करारात ठरलेलाच पूर्ण भाव मिळतो.`
    }
  },
  {
    id: 'faq-22',
    number: 22,
    category: 'contracts',
    categoryLabel: {
      en: 'Escrow Contracts',
      hi: 'एस्क्रो अनुबंध',
      te: 'ఎస్క్రో ఒప్పందాలు',
      mr: 'डिजिटल करार'
    },
    question: {
      en: 'How does the 100% pre-funded Escrow system work?',
      hi: '100% प्री-फंडेड एस्क्रो (Escrow) प्रणाली कैसे काम करती है?',
      te: '100% ముందస్తు ఎస్క్రో విధానం ఎలా పనిచేస్తుంది?',
      mr: '१००% प्री-फंडेड एस्क्रो (Escrow) पद्धत कशी काम करते?'
    },
    hint: {
      en: 'Buyer funds Escrow upfront; money stays secure until delivery confirmation',
      hi: 'खरीदार पहले एस्क्रो में पैसा जमा करता है; डिलीवरी की पुष्टि तक सुरक्षित रहता है',
      te: 'కొనుగోలుదారుడు ముందే డబ్బులు జమ చేస్తాడు, డెలివరీ అయ్యే వరకు సురక్షితంగా ఉంటాయి',
      mr: 'खरेदीदार अगोदर पैसे भरतो; माल पोहोचल्याची खात्री होईपर्यंत सुरक्षित राहतात'
    },
    answer: {
      en: `**Escrow Lock Mechanism:**\n- 🏦 FarmiQ maintains a secured institutional Escrow vault.\n- 💰 Once a contract is approved, the buyer deposits 100% of the contract value.\n- 🔒 Neither party can unilaterally withdraw the funds once transit commences.\n- 💸 Money is released directly to the farmer bank account upon delivery confirmation.`,
      hi: `**एस्क्रो लॉक प्रणाली:**\n- 🏦 FarmiQ एक सुरक्षित संस्थागत एस्क्रो तिजोरी संचालित करता है।\n- 💰 अनुबंध स्वीकृत होने पर खरीदार 100% राशि एस्क्रो में जमा करता है।\n- 🔒 परिवहन शुरू होने के बाद कोई भी पक्ष अकेले पैसे नहीं निकाल सकता।\n- 💸 डिलीवरी की पुष्टि होते ही पूरी रकम किसान के खाते में भेज दी जाती है।`,
      te: `**ఎస్క్రో భద్రతా విధానం:**\n- 🏦 FarmiQ ద్వారా సురక్షితమైన ఎస్క్రో ఖాతా నిర్వహించబడుతుంది.\n- 💰 కాంట్రాక్ట్ ఖరారవ్వగానే కొనుగోలుదారుడు 100% నగదును ఎస్క్రోలో జమ చేస్తాడు.\n- 🔒 రవాణా మొదలైన తర్వాత ఎవరూ మధ్యలో డబ్బులు ఉపసంహరించుకోలేరు.\n- 💸 డెలివరీ పూర్తయిన వెంటనే డబ్బులు రైతు ఖాతాలో పడతాయి.`,
      mr: `**एस्क्रो लॉक कार्यपद्धती:**\n- 🏦 FarmiQ सुरक्षित संस्थात्मक एस्क्रो खाते चालवते.\n- 💰 करार निश्चित होताच खरेदीदार १००% रक्कम एस्क्रोमध्ये भरतो.\n- 🔒 माल रस्त्यात असताना कोणीही एकतर्फी पैसे काढू शकत नाही.\n- 💸 माल गोदामात पोहोचल्यावर तात्काळ शेतकऱ्याच्या खात्यात वर्ग केले जातात.`
    }
  },
  {
    id: 'faq-23',
    number: 23,
    category: 'contracts',
    categoryLabel: {
      en: 'Escrow Contracts',
      hi: 'एस्क्रो अनुबंध',
      te: 'ఎస్క్రో ఒప్పందాలు',
      mr: 'डिजिटल करार'
    },
    question: {
      en: "When does Escrow release payment to the farmer's account?",
      hi: 'एस्क्रो किसान के खाते में भुगतान कब जारी करता है?',
      te: 'ఎస్క్రో నుండి రైతు ఖాతాకు డబ్బులు ఎప్పుడు విడుదలవుతాయి?',
      mr: 'एस्क्रोमधून शेतकऱ्याच्या खात्यात पैसे कधी जमा होतात?'
    },
    hint: {
      en: 'Released automatically when the buyer clicks Confirm Delivery',
      hi: 'जैसे ही खरीदार डिलीवरी कन्फर्म करता है, पैसे स्वतः ट्रांसफर हो जाते हैं',
      te: 'కొనుగోలుదారుడు డెలివరీ ధృవీకరించిన వెంటనే ఆటోమేటిక్‌గా విడుదలవుతాయి',
      mr: 'खरेदीदाराने डिलिव्हरी स्वीकारल्याबरोबर आपोआप पैसे जमा होतात'
    },
    answer: {
      en: `**Escrow Release Timing:**\n- 📦 When produce arrives at the buyer's warehouse, the buyer inspects grading and taps **Confirm Delivery**.\n- ⚡ Escrow immediately releases the full contract balance directly to the farmer UPI / bank details.\n- ⏱️ In case of ungrounded delays, auto-release triggers after 48 hours.`,
      hi: `**एस्क्रो रिलीज का समय:**\n- 📦 जब माल खरीदार के गोदाम पहुंचता है, तो खरीदार जांच करके **Confirm Delivery** दबाता है।\n- ⚡ एस्क्रो तुरंत पूरी अनुबंध राशि किसान के बैंक/UPI खाते में भेज देता है।\n- ⏱️ यदि खरीदार बिना वजह देरी करे, तो 48 घंटे बाद ऑटो-रिलीज हो जाता है।`,
      te: `**ఎస్క్రో విడుదల సమయం:**\n- 📦 సరుకు వేర్‌హౌస్‌కు చేరిన తర్వాత కొనుగోలుదారుడు తనిఖీ చేసి **Confirm Delivery** క్లిక్ చేస్తాడు.\n- ⚡ ఎస్క్రో వెంటనే పూర్తి మొత్తాన్ని రైతు ఖాతాకు బదిలీ చేస్తుంది.\n- ⏱️ కొనుగోలుదారుడు స్పందించకపోతే 48 గంటల్లో ఆటోమేటిక్‌గా విడుదలవుతుంది.`,
      mr: `**एस्क्रो पेमेंट रिलीज वेळ:**\n- 📦 माल गोदामात आल्यावर खरेदीदार दर्जा तपासून **Confirm Delivery** दाबतो.\n- ⚡ एस्क्रो तत्काळ संपूर्ण रक्कम शेतकऱ्याच्या UPI/बँक खात्यात वर्ग करते.\n- ⏱️ खरेदीदाराने विनाकारण विलंब केल्यास ४८ तासांत आपोआप पैसे जमा होतात.`
    }
  },
  {
    id: 'faq-24',
    number: 24,
    category: 'contracts',
    categoryLabel: {
      en: 'Escrow Contracts',
      hi: 'एस्क्रो अनुबंध',
      te: 'ఎస్క్రో ఒప్పందాలు',
      mr: 'डिजिटल करार'
    },
    question: {
      en: 'What is the 1.5% platform fee split between buyer and farmer?',
      hi: 'खरीदार और किसान के बीच 1.5% प्लेटफॉर्म शुल्क का विभाजन क्या है?',
      te: 'కొనుగోలుదారు మరియు రైతు మధ్య 1.5% ప్లాట్‌ఫారమ్ రుసుము విభజన ఏమిటి?',
      mr: 'खरेदीदार आणि शेतकऱ्यामधील १.५% प्लॅटफॉर्म फीचे विभाजन कसे होते?'
    },
    hint: {
      en: 'Transparent fee split on delivered contracts for escrow management',
      hi: 'एस्क्रो प्रबंधन के लिए पूर्ण हुए अनुबंधों पर पारदर्शी 1.5% शुल्क विभाजन',
      te: 'ఎస్క్రో నిర్వహణ కోసం పూర్తయిన కాంట్రాక్టులపై 1.5% ఫీజు పంపకం',
      mr: 'एस्क्रो व्यवस्थापनासाठी पूर्ण झालेल्या करारांवर १.५% पारदर्शक फी'
    },
    answer: {
      en: `**1.5% Platform Escrow Fee Split:**\n- ⚖️ On institutional Escrow contracts, FarmiQ applies a nominal 1.5% service fee split equally.\n- 🏛️ Covers institutional bank vault compliance, digital contract stamp verification, and 24/7 dispute mediation.\n- 🧾 Fully detailed on the generated tax invoice.`,
      hi: `**1.5% प्लेटफॉर्म एस्क्रो शुल्क:**\n- ⚖️ संस्थागत एस्क्रो अनुबंधों पर FarmiQ मात्र 1.5% सेवा शुल्क दोनों पक्षों में समान रूप से लगाता है।\n- 🏛️ यह बैंक तिजोरी सुरक्षा, डिजिटल अनुबंध स्टांप सत्यापन और विवाद मध्यस्थता को कवर करता है।\n- 🧾 कर चालान (Tax Invoice) पर इसका पूरा स्पष्ट विवरण रहता है।`,
      te: `**1.5% ప్లాట్‌ఫారమ్ ఎస్క్రో ఫీజు:**\n- ⚖️ సంస్థాగత కాంట్రాక్టులపై FarmiQ 1.5% ఫీజును సమానంగా తీసుకుంటుంది.\n- 🏛️ ఇది బ్యాంకింగ్ భద్రత, చట్టపరమైన ఒప్పందం మరియు వివాద పరిష్కారానికి ఉపయోగపడుతుంది.\n- 🧾 ఇన్‌వాయిస్‌లో పూర్తి వివరాలు నమోదు చేయబడతాయి.`,
      mr: `**१.५% प्लॅटफॉर्म एस्क्रो फी:**\n- ⚖️ मोठ्या एस्क्रो करारांवर FarmiQ १.५% नाममात्र सेवा शुल्क दोन्ही बाजूंमध्ये समान आकारते.\n- 🏛️ यामुळे बँक खात्याची कायदेशीर सुरक्षितता आणि विवाद निवारण हमी मिळते.\n- 🧾 टॅक्स इनव्हॉइसवर याचा स्पष्ट तपशील नमूद असतो.`
    }
  },
  {
    id: 'faq-25',
    number: 25,
    category: 'contracts',
    categoryLabel: {
      en: 'Escrow Contracts',
      hi: 'एस्क्रो अनुबंध',
      te: 'ఎస్క్రో ఒప్పందాలు',
      mr: 'डिजिटल करार'
    },
    question: {
      en: 'How can an institutional buyer get verified on FarmiQ?',
      hi: 'कोई कॉर्पोरेट खरीदार FarmiQ पर सत्यापित (Verified Buyer) कैसे बनता है?',
      te: 'ఒక సంస్థాగత కొనుగోలుదారు FarmiQ లో ఎలా ధృవీకరించబడతారు?',
      mr: 'संस्थात्मक खरेदीदार FarmiQ वर व्हेरिफाय (Verified Buyer) कसा होतो?'
    },
    hint: {
      en: 'Submit company profile, GSTIN, and demand volume for admin verification',
      hi: 'सत्यापन के लिए कंपनी प्रोफाइल, जीएसटी नंबर और मांग मात्रा जमा करें',
      te: 'కంపెనీ ప్రొఫైల్, GST నంబర్ మరియు డిమాండ్ వివరాలను సమర్పించాలి',
      mr: 'कंपनी प्रोफाईल, GST क्रमांक आणि खरेदी प्रमाण Admin पडताळणीसाठी सादर करा'
    },
    answer: {
      en: `**Verified Buyer Onboarding:**\n- 🏢 Institutional procurement managers register with Company Name, GSTIN, and central warehouse location.\n- 🔍 The FarmiQ Admin reviews business credentials, bank escrow facility, and credit score.\n- 🛡️ Once verified with the **Green Verified Badge**, the buyer can place bulk digital contracts.`,
      hi: `**सत्यापित खरीदार प्रक्रिया:**\n- 🏢 कॉर्पोरेट कंपनियां अपने कंपनी नाम, GSTIN और गोदाम पते के साथ रजिस्टर करती हैं।\n- 🔍 FarmiQ Admin व्यावसायिक दस्तावेजों, एस्क्रो क्षमता और ट्रैक रिकॉर्ड की जांच करता है।\n- 🛡️ सत्यापन के बाद **Green Verified Badge** मिलता है और वे डिजिटल अनुबंध बना सकते हैं।`,
      te: `**వెరిఫైడ్ కొనుగోలుదారుల నమోదు:**\n- 🏢 కంపెనీలు తమ పేరు, GST నంబర్ మరియు వేర్‌హౌస్ వివరాలతో రిజిస్టర్ చేసుకుంటాయి.\n- 🔍 FarmiQ అడ్మిన్ వ్యాపార వివరాలు మరియు బ్యాంక్ సామర్థ్యాన్ని తనిఖీ చేస్తారు.\n- 🛡️ ధృవీకరణ పూర్తయిన తర్వాత **Green Verified Badge** లభిస్తుంది.`,
      mr: `**व्हेरिफाइड खरेदीदार प्रक्रिया:**\n- 🏢 खरेदीदार कंपन्या कंपनीचे नाव, GST नंबर व गोदामाच्या पत्त्यासह नोंदणी करतात.\n- 🔍 FarmiQ Admin व्यवसायाची कागदपत्रे व आर्थिक पत तपासतो.\n- 🛡️ पडताळणी झाल्यावर **हिरवा Verified बॅज** मिळतो आणि ते डिजिटल करार करू शकतात.`
    }
  },

  // -------------------------------------------------------------
  // Category 6: Grievance Desk & Disputes (Q26 - Q30)
  // -------------------------------------------------------------
  {
    id: 'faq-26',
    number: 26,
    category: 'disputes',
    categoryLabel: {
      en: 'Disputes Desk',
      hi: 'तकरार और सहायता',
      te: 'వివాదాలు & సహాయం',
      mr: 'तक्रार निवारण'
    },
    question: {
      en: 'How do I raise a dispute or grievance ticket on FarmiQ?',
      hi: 'FarmiQ पर तकरार या शिकायत टिकट कैसे दर्ज करें?',
      te: 'FarmiQ లో వివాదం లేదా ఫిర్యాదు టిక్కెట్‌ను ఎలా నమోదు చేయాలి?',
      mr: 'FarmiQ वर तक्रार किंवा डिस्प्यूट तिकीट कसे नोंदवायचे?'
    },
    hint: {
      en: 'Submit ticket with Order ID, reason, issue description, and proof',
      hi: 'ऑर्डर नंबर, कारण, समस्या का विवरण और फोटो प्रमाण के साथ टिकट जमा करें',
      te: 'ఆర్డర్ ID, కారణం, సమస్య వివరణ మరియు ఫోటో రుజువులతో టిక్కెట్ ఇవ్వండి',
      mr: 'ऑर्डर क्रमांक, कारण, समस्येचे वर्णन व पुराव्यासह तिकीट सबमिट करा'
    },
    answer: {
      en: `**Filing a Grievance Ticket:**\n- ⚖️ Open the **Disputes & Support** tab in your dashboard.\n- 📝 Select Order ID, choose reason category (e.g. Quality Mismatch, Delivery Delay, Payment Query).\n- 📎 Enter issue description and attach photo proof.\n- 🔔 FarmiQ Admin instantly receives the grievance alert for prioritized mediation.`,
      hi: `**शिकायत दर्ज करने का तरीका:**\n- ⚖️ अपने डैशबोर्ड में **Disputes & Support** टैब खोलें।\n- 📝 ऑर्डर नंबर चुनें, कारण श्रेणी चुनें (जैसे गुणवत्ता में अंतर, देरी, भुगतान प्रश्न)।\n- 📎 समस्या का विवरण लिखें और फोटो प्रमाण संलग्न करें।\n- 🔔 FarmiQ Admin को तुरंत प्राथमिकता निवारण के लिए अलर्ट पहुंच जाता है।`,
      te: `**ఫిర్యాదు టిక్కెట్ నమోదు:**\n- ⚖️ మీ డ్యాష్‌బోర్డ్‌లో **Disputes & Support** ట్యాబ్‌ను తెరవండి.\n- 📝 ఆర్డర్ ID ని ఎంచుకుని, సమస్య వర్గాన్ని ఎంపిక చేయండి (నాణ్యత లోపం, ఆలస్యం తదితరాలు).\n- 📎 సమస్యను క్లుప్తంగా వివరించి, ఫోటో ఆధారాలు జతచేయండి.\n- 🔔 వెంటనే అడ్మిన్ వద్దకు నోటిఫికేషన్ వెళ్తుంది.`,
      mr: `**तक्रार नोंदवण्याची पद्धत:**\n- ⚖️ तुमच्या डॅशबोर्डमध्ये **Disputes & Support** टॅब उघडा.\n- 📝 ऑर्डर आयडी निवडा, समस्येचा प्रकार निवडा (उदा. मालाचा दर्जा, विलंब, पेमेंट प्रश्न).\n- 📎 समस्येचे वर्णन लिहा आणि फोटो पुरावा जोडा.\n- 🔔 FarmiQ Admin कडे तत्काळ निराकरणासाठी अलर्ट पोहोचतो.`
    }
  },
  {
    id: 'faq-27',
    number: 27,
    category: 'disputes',
    categoryLabel: {
      en: 'Disputes Desk',
      hi: 'तकरार और सहायता',
      te: 'వివాదాలు & సహాయం',
      mr: 'तक्रार निवारण'
    },
    question: {
      en: 'How does the FarmiQ Admin mediate disputes between farmers and buyers?',
      hi: 'FarmiQ Admin किसान और खरीदार के बीच विवादों का समाधान कैसे करता है?',
      te: 'రైతులు మరియు కొనుగోలుదారుల మధ్య వివాదాలను FarmiQ అడ్మిన్ ఎలా పరిష్కరిస్తారు?',
      mr: 'FarmiQ Admin शेतकरी आणि खरेदीदारांमधील वादांचे निवारण कसे करतो?'
    },
    hint: {
      en: 'Admin mediates with full contact visibility and fair evidence review',
      hi: 'संपर्क विवरण और निष्पक्ष साक्ष्य समीक्षा के साथ एडमिन मध्यस्थता करता है',
      te: 'అడ్మిన్ ఇరుపక్షాల వివరాలు మరియు ఆధారాలను పరిశీలించి న్యాయం చేస్తారు',
      mr: 'अॅडमिन पुरावे तपासून व दोन्ही बाजू समजून घेऊन तोडगा काढतो'
    },
    answer: {
      en: `**Admin Mediation Console:**\n- 🛡️ The System Admin accesses the dedicated **Grievance Resolution Console**.\n- 📋 Reviews order details, delivery timestamps, GPS route logs, and uploaded photos.\n- 📞 Directly contacts both parties to clarify any discrepancy.\n- ⚖️ Issues an equitable resolution: release to farmer, replacement, or partial customer refund.`,
      hi: `**एडमिन मध्यस्थता कंसोल:**\n- 🛡️ सिस्टम एडमिन समर्पित **Grievance Resolution Console** में समीक्षा करता है।\n- 📋 ऑर्डर विवरण, समय, जीपीएस रूट लॉग और फोटो साक्ष्य की जांच की जाती है।\n- 📞 दोनों पक्षों से सीधे फोन पर बात करके स्पष्टीकरण लिया जाता है।\n- ⚖️ निष्पक्ष निर्णय: किसान को भुगतान, माल बदलना या उचित रिफंड जारी करना।`,
      te: `**అడ్మిన్ మధ్యవర్తిత్వం:**\n- 🛡️ సిస్టమ్ అడ్మిన్ **Grievance Resolution Console** లో పూర్తి వివరాలు చూస్తారు.\n- 📋 ఆర్డర్ వివరాలు, GPS ట్రాకింగ్ మరియు ఫోటోలను పరిశీలిస్తారు.\n- 📞 ఇరువైపులా నేరుగా మాట్లాడి సమస్యను అర్థం చేసుకుంటారు.\n- ⚖️ న్యాయమైన పరిష్కారాన్ని (రైతుకు నగదు లేదా కస్టమర్‌కు రీఫండ్) అందిస్తారు.`,
      mr: `**अॅडमिन मध्यस्थी कार्यपद्धती:**\n- 🛡️ सिस्टीम अॅडमिन **Grievance Resolution Console** द्वारे तक्रार तपासतो.\n- 📋 ऑर्डर तपशील, जीपीएस मार्ग आणि फोटो पुराव्यांची सखोल छाननी केली जाते.\n- 📞 दोन्ही बाजूंशी थेट संपर्क साधून माहिती घेतली जाते.\n- ⚖️ निष्पक्ष तोडगा: शेतकऱ्याला पूर्ण पेमेंट, माल बदलून देणे किंवा योग्य परतावा.`
    }
  },
  {
    id: 'faq-28',
    number: 28,
    category: 'disputes',
    categoryLabel: {
      en: 'Disputes Desk',
      hi: 'तकरार और सहायता',
      te: 'వివాదాలు & సహాయం',
      mr: 'तक्रार निवारण'
    },
    question: {
      en: 'Can the Admin see full contact details of both complainant and counterparty?',
      hi: 'क्या एडमिन शिकायतकर्ता और प्रतिवादी दोनों के पूरे संपर्क विवरण देख सकता है?',
      te: 'అడ్మిన్ ఫిర్యాదుదారు మరియు ప్రతివాది ఇద్దరి పూర్తి వివరాలను చూడగలరా?',
      mr: 'अॅडमिन तक्रारदार आणि समोरची व्यक्ती दोघांचेही पूर्ण संपर्क तपशील पाहू शकतो का?'
    },
    hint: {
      en: 'Full visibility into name, phone, role, email, and location',
      hi: 'नाम, मोबाइल, भूमिका, ईमेल और पते की पूरी दृश्यता',
      te: 'పేరు, ఫోన్, పాత్ర, ఈమెయిల్ మరియు లొకేషన్ వివరాలు పూర్తిగా కనిపిస్తాయి',
      mr: 'नाव, मोबाईल, भूमिका, पत्ता या सर्वांची पूर्ण माहिती दिसते'
    },
    answer: {
      en: `**Complete Mediation Visibility:**\n- 🔍 Yes! The FarmiQ Admin console provides complete transparency.\n- 👤 **Complainant:** Full name, mobile number, role (Farmer / Customer / Buyer), delivery address.\n- 🤝 **Counterparty:** Full name, mobile number, role, produce listing details.\n- 📞 Direct click-to-call buttons ensure disputes are resolved within hours!`,
      hi: `**पूर्ण मध्यस्थता दृश्यता:**\n- 🔍 जी हाँ! FarmiQ एडमिन कंसोल में पूरी पारदर्शिता रहती है।\n- 👤 **शिकायतकर्ता:** पूरा नाम, मोबाइल नंबर, भूमिका (किसान/ग्राहक/खरीदार), पता।\n- 🤝 **सामने वाला पक्ष:** पूरा नाम, मोबाइल, फसल लिस्टिंग विवरण।\n- 📞 सीधे कॉल करने के बटन से कुछ ही घंटों में विवाद सुलझ जाता है!`,
      te: `**పూర్తి పారదర్శకత:**\n- 🔍 అవును! FarmiQ అడ్మిన్ స్క్రీన్‌లో పూర్తి సమాచారం ఉంటుంది.\n- 👤 **ఫిర్యాదుదారు:** పూర్తి పేరు, ఫోన్ నంబర్, పాత్ర (రైతు/కస్టమర్), అడ్రస్.\n- 🤝 **ఎదుటి వ్యక్తి:** పేరు, ఫోన్ నంబర్, పంట వివరాలు.\n- 📞 నేరుగా కాల్ చేసి కొద్ది గంటల్లోనే సమస్యను పరిష్కరిస్తారు!`,
      mr: `**पूर्ण पारदर्शकता:**\n- 🔍 होय! FarmiQ अॅडमिन कन्सोलमध्ये संपूर्ण पारदर्शकता असते.\n- 👤 **तक्रारदार:** पूर्ण नाव, मोबाईल नंबर, भूमिका (शेतकरी/ग्राहक), पत्ता.\n- 🤝 **दुसरा पक्ष:** नाव, फोन नंबर, शेतमालाचा तपशील.\n- 📞 थेट फोन करून काही तासांतच वाद मिटवला जातो!`
    }
  },
  {
    id: 'faq-29',
    number: 29,
    category: 'disputes',
    categoryLabel: {
      en: 'Disputes Desk',
      hi: 'तकरार और सहायता',
      te: 'వివాదాలు & సహాయం',
      mr: 'तक्रार निवारण'
    },
    question: {
      en: 'What happens to funds locked in Escrow when a dispute is resolved?',
      hi: 'विवाद हल होने पर एस्क्रो में बंद पैसों का क्या होता है?',
      te: 'వివాదం పరిష్కారమైనప్పుడు ఎస్క్రోలోని నిధులకు ఏమి జరుగుతుంది?',
      mr: 'तक्रार सुटल्यावर एस्क्रोमधील पैशांचे काय होते?'
    },
    hint: {
      en: 'Admin authorizes full release to farmer or fair refund to customer',
      hi: 'एडमिन किसान को पूरा भुगतान या खरीदार को उचित रिफंड जारी करता है',
      te: 'అడ్మిన్ రైతుకు చెల్లింపు లేదా కస్టమర్‌కు రీఫండ్‌ను ఖరారు చేస్తారు',
      mr: 'अॅडमिन शेतकऱ्याला पैसे वर्ग करतो किंवा ग्राहकाला परतावा देतो'
    },
    answer: {
      en: `**Escrow Dispute Resolution:**\n- ⚖️ Funds remain frozen in platform escrow until resolution is entered.\n- 👨‍🌾 If delivery fulfilled contract specifications, Admin releases 100% to the farmer.\n- 🔄 If transit damage occurred, a fair partial refund is routed back to the buyer with remainder to farmer.\n- 🛡️ Neither party can lose money unjustly.`,
      hi: `**एस्क्रो विवाद समाधान:**\n- ⚖️ जब तक निर्णय नहीं होता, पैसा सुरक्षित एस्क्रो में फ्रीज रहता है।\n- 👨‍🌾 यदि माल सही था, तो एडमिन 100% राशि किसान को रिलीज कर देता है।\n- 🔄 यदि रास्ते में नुकसान हुआ हो, तो उचित रिफंड खरीदार को और शेष किसान को दिया जाता है।\n- 🛡️ किसी भी पक्ष का अनुचित नुकसान नहीं होता।`,
      te: `**ఎస్క్రో వివాద పరిష్కారం:**\n- ⚖️ నిర్ణయం వచ్చే వరకు డబ్బులు ఎస్క్రోలోనే సురక్షితంగా ఉంటాయి.\n- 👨‍🌾 పంట సరిగ్గా ఉంటే 100% సొమ్ము రైతుకు అందుతుంది.\n- 🔄 రవాణాలో నష్టం జరిగితే సరైన రీఫండ్ కొనుగోలుదారునికి మరియు మిగిలినది రైతుకు వెళ్తుంది.\n- 🛡️ ఎవరికీ అన్యాయం జరగకుండా చూస్తారు.`,
      mr: `**एस्क्रो विवाद तोडगा:**\n- ⚖️ निकाल येईपर्यंत रक्कम एस्क्रोमध्ये सुरक्षित गोठवलेली राहते.\n- 👨‍🌾 माल योग्य असल्यास अॅडमिन १००% रक्कम शेतकऱ्याला देतो.\n- 🔄 वाहतुकीत नुकसान झाले असल्यास योग्य परतावा खरेदीदाराला व उर्वरित रक्कम शेतकऱ्याला मिळते.\n- 🛡️ कोणाचेही विनाकारण नुकसान होत नाही.`
    }
  },
  {
    id: 'faq-30',
    number: 30,
    category: 'disputes',
    categoryLabel: {
      en: 'Disputes Desk',
      hi: 'तकरार और सहायता',
      te: 'विవాదాలు & సహాయం',
      mr: 'तक्रार निवारण'
    },
    question: {
      en: 'How long does dispute review take and how am I notified?',
      hi: 'विवाद की समीक्षा में कितना समय लगता है और मुझे सूचना कैसे मिलेगी?',
      te: 'వివాద సమీక్షకు ఎంత సమయం పడుతుంది మరియు నాకు ఎలా తెలియజేస్తారు?',
      mr: 'तक्रार निवारणासाठी किती वेळ लागतो आणि मला माहिती कशी मिळते?'
    },
    hint: {
      en: 'Under 4 to 12 hours with SMS and in-app status updates',
      hi: 'एसएमएस और इन-ऐप स्टेटस अपडेट के साथ 4 से 12 घंटे में',
      te: 'ఎస్ఎంఎస్ మరియు యాప్ ద్వారా 4 నుండి 12 గంటల్లో పరిష్కారం',
      mr: 'एसएमएस आणि अॅप अलर्टद्वारे ४ ते १२ तासांच्या आत'
    },
    answer: {
      en: `**Resolution Timeline & Alerts:**\n- ⏱️ Standard grievance tickets are mediated within **4 to 12 hours**.\n- 📲 Both parties receive instant SMS and dashboard status badge updates (OPEN ➔ RESOLVED).\n- 📝 Detailed resolution comments written by Admin are visible in the ticket history.`,
      hi: `**समाधान समय और सूचना:**\n- ⏱️ सामान्य विवादों का समाधान **4 से 12 घंटे** के भीतर हो जाता है।\n- 📲 दोनों पक्षों को एसएमएस और डैशबोर्ड स्टेटस (OPEN ➔ RESOLVED) का अपडेट मिलता है।\n- 📝 एडमिन की पूरी टिप्पणी टिकट इतिहास में देखी जा सकती है।`,
      te: `**పరిష్కార సమయం & నోటిఫికేషన్లు:**\n- ⏱️ సాధారణ ఫిర్యాదులు **4 నుండి 12 గంటల్లో** పరిష్కరించబడతాయి.\n- 📲 ఇరువైపులా ఎస్ఎంఎస్ మరియు డ్యాష్‌బోర్డ్ అప్‌డేట్ (OPEN ➔ RESOLVED) అందుతాయి.\n- 📝 అడ్మిన్ నిర్ణయం టిక్కెట్ చరిత్రలో స్పష్టంగా కనిపిస్తుంది.`,
      mr: `**निवारण कालावधी व अपडेट:**\n- ⏱️ सर्वसामान्य तक्रारी **४ ते १२ तासांच्या आत** सोडवल्या जातात.\n- 📲 दोन्ही पक्षांना एसएमएस आणि डॅशबोर्ड स्टेटस (OPEN ➔ RESOLVED) द्वारे माहिती मिळते.\n- 📝 अॅडमिनचा निर्णय तिकीट हिस्टरीमध्ये वाचता येतो.`
    }
  },

  // -------------------------------------------------------------
  // Category 7: Cold Storage & Warehousing (Q31 - Q35)
  // -------------------------------------------------------------
  {
    id: 'faq-31',
    number: 31,
    category: 'storage',
    categoryLabel: {
      en: 'Cold Storage',
      hi: 'कोल्ड स्टोरेज',
      te: 'కోల్డ్ స్టోరేజ్',
      mr: 'शीतगृह व वाहतूक'
    },
    question: {
      en: 'How do I book cold storage space for perishable produce (onions, potatoes)?',
      hi: 'जल्दी खराब होने वाली फसलों (प्याज, आलू) के लिए कोल्ड स्टोरेज कैसे बुक करें?',
      te: 'త్వరగా పాడయ్యే పంటల (ఉల్లి, బంగాళాదుంప) కోసం కోల్డ్ స్టోరేజ్ ఎలా బుక్ చేయాలి?',
      mr: 'नाशवंत शेतमालासाठी (कांदा, बटाटा) कोल्ड स्टोरेज कसे बुक करावे?'
    },
    hint: {
      en: 'Reserve warehouse space in Storage & Logistics to prevent distress sale',
      hi: 'फसल खराब होने से बचाने के लिए स्टोरेज और लॉजिस्टिक्स में जगह बुक करें',
      te: 'స్టోరేజ్ & లాజిస్టిక్స్ ట్యాబ్‌లో గిడ్డంగి స్థలాన్ని బుక్ చేసుకోండి',
      mr: 'कमी भावात विक्री टाळण्यासाठी स्टोरेज व लॉजिस्टिक्समध्ये जागा बुक करा'
    },
    answer: {
      en: `**Cold Storage Booking:**\n- ❄️ Navigate to the **Storage & Logistics** tab from the top navigation bar.\n- 🏢 Browse certified temperature-controlled godowns near your district.\n- 📦 Enter commodity, quantity in quintals, and required storage duration in days.\n- 🏷️ Instant booking confirmation with warehouse gate pass and contact manager.`,
      hi: `**कोल्ड स्टोरेज बुकिंग:**\n- ❄️ ऊपर नेविगेशन बार से **Storage & Logistics** टैब पर जाएं।\n- 🏢 अपने जिले के नजदीकी तापमान-नियंत्रित गोदाम देखें।\n- 📦 फसल का नाम, क्विंटल में मात्रा और भंडारण के दिनों की संख्या दर्ज करें।\n- 🏷️ गोदाम गेट पास और मैनेजर फोन नंबर के साथ तत्काल बुकिंग प्राप्त करें।`,
      te: `**కోల్డ్ స్టోరేజ్ బుకింగ్:**\n- ❄️ పైన ఉన్న మెనూలో **Storage & Logistics** పై క్లిక్ చేయండి.\n- 🏢 మీ జిల్లాలోని గుర్తింపు పొందిన కోల్డ్ స్టోరేజ్ కేంద్రాలను చూడండి.\n- 📦 పంట రకం, క్వింటాళ్ల బరువు మరియు రోజుల సంఖ్యను నమోదు చేయండి.\n- 🏷️ గేట్ పాస్ మరియు మేనేజర్ ఫోన్ నంబర్‌తో వెంటనే బుకింగ్ పూర్తవుతుంది.`,
      mr: `**कोल्ड स्टोरेज बुकिंग पद्धत:**\n- ❄️ वरील मेनूमधून **Storage & Logistics** टॅब उघडा.\n- 🏢 तुमच्या जिल्ह्यातील प्रमाणित शीतगृहांची यादी तपासा.\n- 📦 पिकाचे नाव, वजन (क्विंटल) आणि किती दिवस ठेवायचे ते दिवस भरा.\n- 🏷️ गेट पास आणि व्यवस्थापकाचा नंबर तात्काळ मिळतो.`
    }
  },
  {
    id: 'faq-32',
    number: 32,
    category: 'storage',
    categoryLabel: {
      en: 'Cold Storage',
      hi: 'कोल्ड स्टोरेज',
      te: 'కోల్డ్ స్టోరేజ్',
      mr: 'शीतगृह व वाहतूक'
    },
    question: {
      en: 'What are the daily storage rates and temperature controls available?',
      hi: 'प्रति दिन भंडारण दरें और तापमान नियंत्रण की क्या सुविधाएं हैं?',
      te: 'రోజువారీ నిల్వ ఛార్జీలు మరియు ఉష్ణోగ్రత నియంత్రణలు ఎలా ఉంటాయి?',
      mr: 'दररोजचे शीतगृह भाडे आणि तापमान नियंत्रणाची काय सोय आहे?'
    },
    hint: {
      en: 'Subsidized rates from ₹1.5 to ₹4 per bag/day with 0°C to 15°C zones',
      hi: '₹1.5 से ₹4 प्रति बोरी/दिन की रियायती दरें और 0°C से 15°C के जोन',
      te: 'బస్తాకు రోజుకు ₹1.5 నుండి ₹4 వరకు నామమాత్రపు ఛార్జీలు',
      mr: 'प्रति गोणी दररोज ₹१.५ ते ₹४ सवलतीचे दर आणि ०°C ते १५°C कक्ष'
    },
    answer: {
      en: `**Storage Facilities & Economics:**\n- 🌡️ **Temperature Zones:** Specialized chambers for Potatoes (2°C - 4°C), Onions (ventilated dry 25°C - 30°C), Apples/Fruits (0°C - 2°C).\n- 💰 **Affordable Daily Rates:** ₹1.50 to ₹4 per bag per day depending on commodity.\n- 🛡️ Full insurance against fire, spoilage, and theft included.`,
      hi: `**भंडारण सुविधाएं और दरें:**\n- 🌡️ **तापमान कक्ष:** आलू के लिए (2°C - 4°C), प्याज के लिए (हवादार सूखा 25°C - 30°C), सेब/फलों के लिए (0°C - 2°C)।\n- 💰 **किफायती दरें:** फसल के अनुसार ₹1.50 से ₹4 प्रति बोरी प्रतिदिन।\n- 🛡️ आग, सड़न और चोरी के खिलाफ पूर्ण बीमा शामिल रहता है।`,
      te: `**నిల్వ సౌకర్యాలు & ధరలు:**\n- 🌡️ **ఉష్ణోగ్రత:** బంగాళాదుంపలకు (2°C - 4°C), ఉల్లిపాయలకు గాలి వెళ్లే గదులు, పండ్లకు (0°C - 2°C).\n- 💰 **సరసమైన ఛార్జీలు:** బస్తాకు రోజుకు ₹1.50 నుండి ₹4 మాత్రమే.\n- 🛡️ అగ్నిప్రమాదాలు, పాడైపోవడంపై పూర్తి బీమా రక్షణ ఉంటుంది.`,
      mr: `**शीतगृह सुविधा व दर:**\n- 🌡️ **तापमान कक्ष:** बटाट्यासाठी (२°C - ४°C), कांद्यासाठी खेळती हवा (२५°C - ३०°C), फळांसाठी (०°C - २°C).\n- 💰 **किफायती भाडे:** शेतमालानुसार दररोज प्रति गोणी ₹१.५० ते ₹४.\n- 🛡️ आग, नासाडी व चोरीपासून संपूर्ण विमा संरक्षण.`
    }
  },
  {
    id: 'faq-33',
    number: 33,
    category: 'storage',
    categoryLabel: {
      en: 'Cold Storage',
      hi: 'कोल्ड स्टोरेज',
      te: 'కోల్డ్ స్టోరేజ్',
      mr: 'शीतगृह व वाहतूक'
    },
    question: {
      en: 'How does booking cold storage prevent distress selling during price crashes?',
      hi: 'बाजार में भाव गिरने पर कोल्ड स्टोरेज में माल रखने से नुकसान से कैसे बचा जा सकता है?',
      te: 'ధరలు పడిపోయినప్పుడు కోల్డ్ స్టోరేజ్ రైతులను నష్టాల నుండి ఎలా కాపాడుతుంది?',
      mr: 'बाजारभाव गडगडल्यावर शीतगृहामुळे शेतकऱ्यांचे नुकसान कसे टळते?'
    },
    hint: {
      en: 'Store produce safely until market demand rises and prices rebound',
      hi: 'मांग बढ़ने और भाव सुधरने तक फसल को सुरक्षित रखें',
      te: 'మంచి ధర వచ్చే వరకు పంటను భద్రంగా నిల్వ చేసుకోవచ్చు',
      mr: 'भाव सुधारेपर्यंत माल सुरक्षित ठेवा आणि जास्त नफ्यात विका'
    },
    answer: {
      en: `**Preventing Distress Sales:**\n- 📉 During bumper harvests, mandi arrivals spike and modal prices crash by 40-60%.\n- 🛡️ Instead of selling at a loss, farmers store their harvest in temperature-controlled warehouses.\n- 📈 Sell 30 to 90 days later when market supply normalizes and prices rebound by 50-100%!`,
      hi: `**मंदी में नुकसान से बचाव:**\n- 📉 भारी फसल के समय मंडियों में आवक बढ़ने से भाव 40-60% गिर जाते हैं।\n- 🛡️ औने-पौने दाम में बेचने के बजाय किसान अपनी फसल को सुरक्षित कोल्ड स्टोरेज में रख सकते हैं।\n- 📈 1 से 3 महीने बाद जब बाजार में माल की कमी होती है, तब 50-100% ऊंचे भाव पर बेचें!`,
      te: `**కష్టాల నుండి రక్షణ:**\n- 📉 పంట ఎక్కువ వచ్చినప్పుడు మార్కెట్లో ధరలు 40-60% వరకు పడిపోతాయి.\n- 🛡️ తక్కువ ధరకు అమ్ముకోకుండా పంటను కోల్డ్ స్టోరేజ్‌లో భద్రపరచండి.\n- 📈 ఒకటి రెండు నెలల తర్వాత మార్కెట్లో కొరత ఏర్పడినప్పుడు మంచి ధరకు అమ్ముకోవచ్చు!`,
      mr: `**मंदीच्या काळात नुकसान टाळणे:**\n- 📉 आवक वाढल्यामुळे बाजारात भाव ४०-६०% घसरतात.\n- 🛡️ तोट्यात माल विकण्याऐवजी शेतकरी शीतगृहात सुरक्षित माल ठेवू शकतात.\n- 📈 १ ते ३ महिन्यांनी टंचाई निर्माण झाल्यावर ५०-१००% अधिक भावाने विक्री करा!`
    }
  },
  {
    id: 'faq-34',
    number: 34,
    category: 'storage',
    categoryLabel: {
      en: 'Cold Storage',
      hi: 'कोल्ड स्टोरेज',
      te: 'కోల్డ్ స్టోరేజ్',
      mr: 'शीतगृह व वाहतूक'
    },
    question: {
      en: 'Can I arrange pickup and warehouse transport directly through FarmiQ?',
      hi: 'क्या मैं सीधे FarmiQ के माध्यम से खेत से पिकअप और ट्रांसपोर्ट बुक कर सकता हूँ?',
      te: 'FarmiQ ద్వారా పొలం నుండి వేర్‌హౌస్‌కు రవాణా వాహనాన్ని బుక్ చేసుకోవచ్చా?',
      mr: 'मी FarmiQ द्वारे थेट शेतातून गोदामापर्यंत वाहतूक वाहन बुक करू शकतो का?'
    },
    hint: {
      en: 'Yes, partner pickup mini-trucks and tempo logistics available',
      hi: 'हाँ, पार्टनर पिकअप मिनी-ट्रक और टेम्पो वाहन उपलब्ध हैं',
      te: 'అవును, మినీ ట్రక్కులు మరియు రవాణా వాహనాలు అందుబాటులో ఉన్నాయి',
      mr: 'होय, पिकअप मिनी-ट्रक आणि टेम्पो थेट शेतात उपलब्ध होतात'
    },
    answer: {
      en: `**Farm-to-Warehouse Logistics:**\n- 🚛 Yes! While reserving cold storage space, check the **Include Farm Pickup** option.\n- 📍 Enter farm village address and required loading date.\n- 🚚 Verified partner logistics drivers arrive with electronic weighing scales to weigh and transport produce safely.`,
      hi: `**खेत से गोदाम तक परिवहन:**\n- 🚛 जी हाँ! कोल्ड स्टोरेज बुक करते समय **Include Farm Pickup** विकल्प चुनें।\n- 📍 अपने खेत का पता और लोडिंग की तारीख लिखें।\n- 🚚 अधिकृत ड्राइवर इलेक्ट्रॉनिक कांटे के साथ आकर माल तोलकर सुरक्षित गोदाम पहुंचाते हैं।`,
      te: `**పొలం నుండి వేర్‌హౌస్ రవాణా:**\n- 🚛 అవును! కోల్డ్ స్టోరేజ్ బుక్ చేసుకునేటప్పుడు **Include Farm Pickup** ఎంచుకోండి.\n- 📍 మీ పొలం అడ్రస్ మరియు తేదీని ఇవ్వండి.\n- 🚚 భాగస్వామ్య వాహనాలు మీ పొలానికే వచ్చి బరువు తూచి భద్రంగా చేరవేస్తాయి.`,
      mr: `**शेतातून थेट वाहतूक सोय:**\n- 🚛 होय! शीतगृह बुक करताना **Include Farm Pickup** पर्याय निवडा.\n- 📍 तुमच्या शेताचा पत्ता व तारीख नोंदवा.\n- 🚚 अधिकृत वाहन शेतात येऊन इलेक्ट्रॉनिक काट्यावर वजन करून माल सुरक्षित शीतगृहात पोहोचवते.`
    }
  },
  {
    id: 'faq-35',
    number: 35,
    category: 'storage',
    categoryLabel: {
      en: 'Cold Storage',
      hi: 'कोल्ड स्टोरेज',
      te: 'కోల్డ్ స్టోరేజ్',
      mr: 'शीतगृह व वाहतूक'
    },
    question: {
      en: 'How do I monitor preservation days stored and shelf life of stored crops?',
      hi: 'मैं स्टोर की गई फसल के दिनों और शेल्फ लाइफ की निगरानी कैसे करूँ?',
      te: 'నిల్వ ఉంచిన రోజుల సంఖ్య మరియు పంట నాణ్యతను ఎలా పర్యవేక్షించాలి?',
      mr: 'शीतगृहात साठवलेले दिवस आणि शेतमालाची गुणवत्ता कशी तपासायची?'
    },
    hint: {
      en: 'Real-time counters on Storage tab display Days Stored and Days Remaining',
      hi: 'स्टोरेज टैब पर दिन, बची हुई शेल्फ लाइफ और तापमान का लाइव मीटर',
      te: 'స్టోరేజ్ పేజీలో నిల్వ చేసిన రోజులు మరియు మిగిలిన రోజుల కౌంటర్ ఉంటుంది',
      mr: 'स्टोरेज टॅबवर साठवलेले दिवस व उर्वरित मुदतीचा थेट मीटर दिसतो'
    },
    answer: {
      en: `**Preservation & Shelf-Life Tracker:**\n- 📊 The **Storage & Logistics** dashboard displays live progress bars for each stored lot.\n- ⏳ Shows: **Days Stored**, **Days Remaining before Quality Depletion**, and current chamber temperature/humidity.\n- ⚠️ Automated alert sent 7 days before recommended retrieval.`,
      hi: `**शेल्फ-लाइफ और भंडारण ट्रैकर:**\n- 📊 **Storage & Logistics** डैशबोर्ड में हर लॉट का लाइव प्रोग्रेस बार दिखता है।\n- ⏳ इसमें दिखता है: **कितने दिन स्टोर हुआ**, **सुरक्षित कितने दिन बाकी हैं**, और वर्तमान तापमान/नमी।\n- ⚠️ माल निकालने के 7 दिन पहले फोन पर अलर्ट आ जाता है।`,
      te: `**నాణ్యత & రోజుల ట్రాకర్:**\n- 📊 **Storage & Logistics** లో ప్రతి బ్యాచ్ యొక్క ప్రోగ్రెస్ బార్ కనిపిస్తుంది.\n- ⏳ **నిల్వ చేసిన రోజులు**, **మిగిలిన రోజులు** మరియు ప్రస్తుత ఉష్ణోగ్రత వివరాలు ఉంటాయి.\n- ⚠️ గడువు ముగియడానికి 7 రోజుల ముందే ఫోన్‌కు అలర్ట్ వస్తుంది.`,
      mr: `**गुणवत्ता व दिवस ट्रॅकर:**\n- 📊 **Storage & Logistics** डॅशबोर्डवर प्रत्येक लॉटचा लाइव्ह प्रोग्रेस बार दिसतो.\n- ⏳ **साठवलेले दिवस**, **शिल्लक दिवस** आणि कक्षातील तापमान/आर्द्रता दिसते.\n- ⚠️ मुदत संपण्याच्या ७ दिवस अगोदर मोबाईलवर सावध करणारा मेसेज येतो.`
    }
  },

  // -------------------------------------------------------------
  // Category 8: Account, Language & Admin Support (Q36 - Q40)
  // -------------------------------------------------------------
  {
    id: 'faq-36',
    number: 36,
    category: 'account',
    categoryLabel: {
      en: 'Account & App',
      hi: 'खाता और ऐप',
      te: 'ఖాతా & యాప్',
      mr: 'खाते व अॅप'
    },
    question: {
      en: 'Is FarmiQ registration 100% free for Indian farmers?',
      hi: 'क्या भारतीय किसानों के लिए FarmiQ पर पंजीकरण 100% मुफ्त है?',
      te: 'భారతీయ రైతులకు FarmiQ రిజిస్ట్రేషన్ 100% ఉచితమా?',
      mr: 'भारतीय शेतकऱ्यांसाठी FarmiQ वर नोंदणी १००% मोफत आहे का?'
    },
    hint: {
      en: '100% free registration with zero subscription or upfront listing fees',
      hi: 'शून्य सदस्यता शुल्क के साथ 100% मुफ्त पंजीकरण',
      te: 'ఎలాంటి సభ్యత్వ రుసుము లేకుండా 100% ఉచిత రిజిస్ట్రేషన్',
      mr: 'कोणतेही शुल्क न देता १००% मोफत नोंदणी'
    },
    answer: {
      en: `**100% Free for Farmers:**\n- 🌾 **Yes!** Registering as a Farmer on FarmiQ is completely free.\n- 🚫 Zero monthly subscription fees, zero listing fees, zero setup costs.\n- 📲 Sign up with just your mobile number, name, and district to start selling in 60 seconds!`,
      hi: `**किसानों के लिए 100% मुफ्त:**\n- 🌾 **जी हाँ!** FarmiQ पर किसान के रूप में पंजीकरण पूरी तरह मुफ्त है।\n- 🚫 कोई मासिक शुल्क नहीं, कोई लिस्टिंग फीस नहीं, कोई छुपा खर्च नहीं।\n- 📲 केवल अपने मोबाइल नंबर, नाम और जिले के साथ 60 सेकंड में शुरू करें!`,
      te: `**రైతులకు 100% ఉచితం:**\n- 🌾 **అవును!** FarmiQ లో రైతుగా నమోదు చేసుకోవడం పూర్తిగా ఉచితం.\n- 🚫 నెలవారీ ఫీజులు గానీ, దాచిన ఛార్జీలు గానీ ఏమీ ఉండవు.\n- 📲 మీ మొబైల్ నంబర్, పేరు మరియు జిల్లా వివరాలతో కేవలం 60 సెకన్లలో ఖాతా తెరవవచ్చు!`,
      mr: `**शेतकऱ्यांसाठी १००% मोफत:**\n- 🌾 **होय!** FarmiQ वर शेतकरी म्हणून नोंदणी पूर्णपणे मोफत आहे.\n- 🚫 कोणताही मासिक खर्च नाही, कोणतीही लिस्टिंग फी नाही.\n- 📲 फक्त मोबाईल नंबर, नाव आणि जिल्ह्यासह ६० सेकंदात विक्री सुरू करा!`
    }
  },
  {
    id: 'faq-37',
    number: 37,
    category: 'account',
    categoryLabel: {
      en: 'Account & App',
      hi: 'खाता और ऐप',
      te: 'ఖాతా & యాప్',
      mr: 'खाते व अॅप'
    },
    question: {
      en: 'How do I switch languages between English, Hindi, Telugu, and Marathi?',
      hi: 'अंग्रेजी, हिंदी, तेलुगु और मराठी के बीच भाषा कैसे बदलें?',
      te: 'ఇంగ్లీష్, హిందీ, తెలుగు మరియు మరాఠీ భాషల మధ్య ఎలా మారాలి?',
      mr: 'इंग्रजी, हिंदी, तेलगू आणि मराठीमध्ये भाषा कशी बदलायची?'
    },
    hint: {
      en: 'Use the Language dropdown in the top navbar anytime',
      hi: 'शीर्ष नेविगेशन बार में भाषा ड्रॉपडाउन का उपयोग करें',
      te: 'పై మెనూలోని భాష ఎంపిక బటన్ ద్వారా ఎప్పుడైనా మార్చుకోవచ్చు',
      mr: 'वरील मेनूतील भाषा पर्यायावर क्लिक करून कधीही बदला'
    },
    answer: {
      en: `**Switching Languages:**\n- 🌐 Click the **Language Globe / Dropdown** at the top right of the navigation bar.\n- 🗣️ Select your preferred language: **English**, **हिंदी (Hindi)**, **తెలుగు (Telugu)**, or **मराठी (Marathi)**.\n- 🔄 The entire application, buttons, mandi rates, and Kisan Mitra AI update instantly.`,
      hi: `**भाषा बदलने का तरीका:**\n- 🌐 शीर्ष नेविगेशन बार में सबसे ऊपर दाईं ओर **भाषा ड्रॉपडाउन** पर क्लिक करें।\n- 🗣️ अपनी पसंदीदा भाषा चुनें: **English**, **हिंदी**, **తెలుగు (तेलुगु)** या **मराठी**।\n- 🔄 पूरा ऐप, सभी बटन, मंडी भाव और किसान मित्र AI तुरंत उस भाषा में बदल जाते हैं।`,
      te: `**భాషను మార్చే విధానం:**\n- 🌐 పై మెనూ బార్‌లో కుడివైపున ఉన్న **భాష డ్రాప్‌డౌన్** పై క్లిక్ చేయండి.\n- 🗣️ మీకు నచ్చిన భాషను ఎంచుకోండి: **English**, **हिंदी (హిందీ)**, **తెలుగు** లేదా **मराठी (మరాఠీ)**.\n- 🔄 మొత్తం అప్లికేషన్ మరియు కిసాన్ మిత్ర AI తక్షణమే ఆ భాషలోకి మారిపోతాయి.`,
      mr: `**भाषा बदलण्याची पद्धत:**\n- 🌐 वरील मेनूबारमध्ये उजव्या बाजूला **भाषा ड्रॉपडाउन** वर क्लिक करा.\n- 🗣️ तुमची आवडती भाषा निवडा: **English**, **हिंदी**, **తెలుగు (तेलगू)** किंवा **मराठी**.\n- 🔄 संपूर्ण अॅप, सर्व बटणे, बाजारभाव आणि किसान मित्र AI तात्काळ त्या भाषेत सुरू होते.`
    }
  },
  {
    id: 'faq-38',
    number: 38,
    category: 'account',
    categoryLabel: {
      en: 'Account & App',
      hi: 'खाता और ऐप',
      te: 'ఖాతా & యాప్',
      mr: 'खाते व अॅप'
    },
    question: {
      en: 'How does the Admin change or edit produce photos on Live Mandi Rates?',
      hi: 'एडमिन लाइव मंडी भाव पर फसलों की तस्वीरें कैसे बदल या संपादित कर सकता है?',
      te: 'అడ్మిన్ లైవ్ మార్కెట్ రేట్లలో పంట ఫోటోలను ఎలా మార్చవచ్చు లేదా సవరించవచ్చు?',
      mr: 'अॅडमिन थेट बाजारभावातील शेतमालाचे फोटो कसे बदलू किंवा संपादित करू शकतो?'
    },
    hint: {
      en: 'Log in as Admin, open Live Mandi Rates, and tap Edit Photo on any card',
      hi: 'एडमिन के रूप में लॉगिन करें, लाइव मंडी खोलें और कार्ड पर Edit Photo दबाएं',
      te: 'అడ్మిన్‌గా లాగిన్ అయి, లైవ్ మార్కెట్ తెరిచి ఫోటోపై Edit Photo క్లిక్ చేయండి',
      mr: 'Admin लॉगिन करा, Live Mandi उघडा आणि कार्डवरील Edit Photo वर क्लिक करा'
    },
    answer: {
      en: `**Admin Photo Management Mode:**\n- 🔑 Log in with Admin credentials (\`admin@farmiq.com\`).\n- 🌾 Open the **Live Mandi Rates** page.\n- ✏️ An **Edit Photo** overlay button appears on every produce card image.\n- 🖼️ Tap it, paste any image URL or pick from high-definition agricultural presets, and click **Save Photo**.\n- ⚡ Persists instantly to the cloud database and updates for all users across India!`,
      hi: `**एडमिन फोटो प्रबंधन मोड:**\n- 🔑 एडमिन क्रेडेंशियल्स (\`admin@farmiq.com\`) से लॉगिन करें।\n- 🌾 **Live Mandi Rates** पेज खोलें।\n- ✏️ प्रत्येक फसल कार्ड की फोटो पर **Edit Photo** का बटन दिखाई देगा।\n- 🖼️ उस पर क्लिक करें, नई फोटो का लिंक डालें या प्रीसेट चुनें और **Save Photo** दबाएं।\n- ⚡ यह तुरंत क्लाउड डेटाबेस में सेव होकर पूरे भारत के सभी उपयोगकर्ताओं को दिखने लगता है!`,
      te: `**అడ్మిన్ ఫోటో ఎడిటింగ్ విధానం:**\n- 🔑 అడ్మిన్ ఖాతా (\`admin@farmiq.com\`) తో లాగిన్ అవ్వండి.\n- 🌾 **Live Mandi Rates** పేజీని తెరవండి.\n- ✏️ ప్రతి పంట కార్డు ఫోటోపై **Edit Photo** బటన్ కనిపిస్తుంది.\n- 🖼️ దానిపై క్లిక్ చేసి కొత్త ఫోటో లింక్ ఇచ్చి **Save Photo** క్లిక్ చేయండి.\n- ⚡ వెంటనే క్లౌడ్ డేటాబేస్‌లో సేవ్ అయ్యి అందరు వినియోగదారులకు కనిపిస్తుంది!`,
      mr: `**अॅडमिन फोटो संपादन मोड:**\n- 🔑 अॅडमिन खात्याने (\`admin@farmiq.com\`) लॉगिन करा.\n- 🌾 **Live Mandi Rates** पेज उघडा.\n- ✏️ प्रत्येक शेतमालाच्या फोटोवर **Edit Photo** चे बटण दिसेल.\n- 🖼️ त्यावर क्लिक करून नवीन फोटोची लिंक टाका किंवा प्रीसेट निवडून **Save Photo** दाबा.\n- ⚡ तात्काळ क्लाउड डेटाबेसमध्ये सेव्ह होऊन सर्व युझर्सना नवा फोटो दिसू लागतो!`
    }
  },
  {
    id: 'faq-39',
    number: 39,
    category: 'account',
    categoryLabel: {
      en: 'Account & App',
      hi: 'खाता और ऐप',
      te: 'ఖాతా & యాప్',
      mr: 'खाते व अॅप'
    },
    question: {
      en: 'Can I use FarmiQ on my mobile phone as an installed PWA app?',
      hi: 'क्या मैं अपने मोबाइल फोन पर FarmiQ को इंस्टॉल किए गए PWA ऐप के रूप में चला सकता हूँ?',
      te: 'నా మొబైల్ ఫోన్‌లో FarmiQ ని ఇన్‌స్టాల్ చేసుకుని PWA యాప్‌గా ఉపయోగించవచ్చా?',
      mr: 'मी मोबाईलवर FarmiQ इन्स्टॉल करून PWA अॅपप्रमाणे वापरू शकतो का?'
    },
    hint: {
      en: 'Yes, full offline PWA support with Install App prompt on Android & iOS',
      hi: 'हाँ, एंड्रॉइड और आईफोन पर Install App बटन के साथ पूर्ण PWA समर्थन',
      te: 'అవును, ఆండ్రాయిడ్ మరియు ఐఫోన్‌లలో ఇన్‌స్టాల్ చేసుకునే సదుపాయం ఉంది',
      mr: 'होय, अँड्रॉइड व आयफोनवर Install App प्रॉम्प्टसह पूर्ण PWA सपोर्ट'
    },
    answer: {
      en: `**Progressive Web App (PWA) Installation:**\n- 📱 Yes! FarmiQ is fully certified as an installable Progressive Web App.\n- 📲 On Android Chrome, tap **Install App** on the popup or browser menu.\n- 🍏 On iPhone Safari, tap **Share ➔ Add to Home Screen**.\n- 🚀 Works in full-screen standalone mode with offline caching and instant load times.`,
      hi: `**प्रोग्रेसिव वेब ऐप (PWA) इंस्टॉलेशन:**\n- 📱 जी हाँ! FarmiQ पूरी तरह से इंस्टॉल करने योग्य PWA ऐप है।\n- 📲 एंड्रॉइड क्रोम पर स्क्रीन पर आने वाले **Install App** बटन पर टैप करें।\n- 🍏 आईफोन सफारी पर **Share ➔ Add to Home Screen** दबाएं।\n- 🚀 यह बिना ब्राउज़र बार के फुल स्क्रीन में ऐप की तरह बेहद तेजी से काम करता है।`,
      te: `**PWA యాప్ ఇన్‌స్టాలేషన్:**\n- 📱 అవును! FarmiQ పూర్తి స్థాయి ప్రోగ్రెసివ్ వెబ్ యాప్ (PWA).\n- 📲 ఆండ్రాయిడ్ ఫోన్‌లో వచ్చే **Install App** బటన్ క్లిక్ చేయండి.\n- 🍏 ఐఫోన్‌లో **Share ➔ Add to Home Screen** నొక్కండి.\n- 🚀 ప్లేస్టోర్ పనిలేకుండా నేరుగా యాప్‌లాగా వేగంగా పనిచేస్తుంది.`,
      mr: `**PWA अॅप इन्स्टॉलेशन:**\n- 📱 होय! FarmiQ हे इन्स्टॉल होणारे प्रोग्रेसिव्ह वेब अॅप (PWA) आहे.\n- 📲 अँड्रॉइडवर स्क्रीनवरील **Install App** बटणावर टॅप करा.\n- 🍏 आयफोनवर सफारीमध्ये **Share ➔ Add to Home Screen** दाबा.\n- 🚀 प्लेस्टोअरशिवाय थेट मोबाईल स्क्रीनवर फुलस्क्रीन अॅपप्रमाणे अतिशय वेगाने चालते.`
    }
  },
  {
    id: 'faq-40',
    number: 40,
    category: 'account',
    categoryLabel: {
      en: 'Account & App',
      hi: 'खाता और ऐप',
      te: 'ఖాతా & యాప్',
      mr: 'खाते व अॅप'
    },
    question: {
      en: 'How do I contact FarmiQ 24/7 customer and farmer support?',
      hi: 'FarmiQ 24/7 ग्राहक और किसान सहायता टीम से कैसे संपर्क करें?',
      te: 'FarmiQ 24/7 కస్టమర్ మరియు రైతు సహాయ బృందాన్ని ఎలా సంప్రదించాలి?',
      mr: 'FarmiQ 24/7 ग्राहक आणि शेतकरी मदत केंद्राशी कसा संपर्क साधायचा?'
    },
    hint: {
      en: 'Kisan Mitra AI 24/7, direct hotline, WhatsApp dispatch alerts, and disputes desk',
      hi: 'किसान मित्र AI, सीधा हेल्पलाइन नंबर, व्हाट्सएप अलर्ट और विवाद सहायता केंद्र',
      te: 'కిసాన్ మిత్ర AI, హెల్ప్‌లైన్ నంబర్, వాట్సాప్ మరియు వివాద పరిష్కార కేంద్రం',
      mr: 'किसान मित्र AI, थेट हेल्पलाइन, व्हॉट्सअॅप आणि तक्रार निवारण कक्ष'
    },
    answer: {
      en: `**24/7 Customer & Farmer Support:**\n- 🤖 **Kisan Mitra AI:** Instant answers 24/7 for all platform queries in English, Hindi, Telugu, and Marathi.\n- 📞 **Toll-Free Helpline:** +91 1800 425 1920 (Farmer & Procurement Desk).\n- 💬 **WhatsApp Dispatch Alerts:** Instant order tracking and invoice links sent directly to your phone.\n- ⚖️ **Grievance Desk:** File tickets in Disputes & Support with dedicated Admin review within hours.`,
      hi: `**24/7 सहायता संपर्क:**\n- 🤖 **किसान मित्र AI:** हिंदी, अंग्रेजी, तेलुगु और मराठी में 24/7 तत्काल उत्तर।\n- 📞 **टोल-फ्री हेल्पलाइन:** +91 1800 425 1920 (किसान और खरीद सहायता)।\n- 💬 **व्हाट्सएप अलर्ट:** ऑर्डर ट्रैकिंग और बिल सीधे आपके फोन पर।\n- ⚖️ **तकरार डेस्क:** Disputes & Support टैब में टिकट दर्ज करें, कुछ ही घंटों में समाधान।`,
      te: `**24/7 సహాయం పొందే మార్గాలు:**\n- 🤖 **కిసాన్ మిత్ర AI:** తెలుగు, ఇంగ్లీష్, హిందీ, మరాఠీలలో 24/7 తక్షణ సహాయం.\n- 📞 **టోల్-ఫ్రీ నంబర్:** +91 1800 425 1920 (రైతు మరియు కొనుగోలు డెస్క్).\n- 💬 **వాట్సాప్ అలర్ట్స్:** ఆర్డర్ ట్రాకింగ్ వివరాలు నేరుగా మీ మొబైల్‌కే అందుతాయి.\n- ⚖️ **ఫిర్యాదు కేంద్రం:** Disputes & Support లో టిక్కెట్ ఇవ్వండి, కొద్ది గంటల్లోనే పరిష్కారం.`,
      mr: `**२४/७ मदत व संपर्क:**\n- 🤖 **किसान मित्र AI:** मराठी, हिंदी, तेलगू आणि इंग्रजीत २४/७ तत्काळ उत्तरे.\n- 📞 **टोल-फ्री हेल्पलाइन:** +91 1800 425 1920 (शेतकरी व खरेदी मदत कक्ष).\n- 💬 **व्हॉट्सअॅप अपडेट्स:** थेट ऑर्डर ट्रॅकिंग आणि पावती मोबाईलवर.\n- ⚖️ **तक्रार कक्ष:** Disputes & Support टॅबमध्ये तिकीट नोंदवा, काही तासांत समाधान.`
    }
  }
];

import { LanguageCode } from '../types';

// Enormous dictionary mapping English phrases and words to Hindi (hi), Telugu (te), and Marathi (mr)
export const DICTIONARY: Record<'hi' | 'te' | 'mr', Record<string, string>> = {
  hi: {
    // Brand & Hero
    "Direct Farmer ↔ Customer Agriculture Hub": "प्रत्यक्ष किसान ↔ ग्राहक कृषि केंद्र",
    "Low-Cost Direct Transport": "किफायती सीधी ढुलाई",
    "Low-Cost Direct Delivery": "किफायती सीधी डिलीवरी",
    "Sustainable Agricultural Logistics & Marketplace": "टिकाऊ कृषि रसद और सीधा बाज़ार",
    "Know the Price. Find the Buyer. Sell Better.": "भाव जानें। खरीदार पाएं। बेहतर बेचें।",
    "Direct agricultural marketplace connecting farmers directly with customers with zero intermediaries, live mandi benchmark rates, and rapid farm-to-doorstep delivery.": "किसानों को बिना किसी बिचौलिए के सीधे ग्राहकों से जोड़ने वाला प्रत्यक्ष कृषि बाज़ार, लाइव मंडी भाव और सीधी डिलीवरी।",
    "Version 2.0 (Python + React)": "संस्करण 2.0 (पायथन + रिएक्ट)",
    "Install FarmiQ": "फार्मआईक्यू इंस्टॉल करें",
    "Install FarmiQ on Desktop or Mobile": "डेस्कटॉप या मोबाइल पर फार्मआईक्यू इंस्टॉल करें",
    "Create Account": "खाता बनाएं",
    "Login": "लॉग इन करें",
    "Logout": "लॉग आउट",
    "Sign In": "साइन इन करें",
    "Sign Up": "साइन अप करें",
    "Continue with Demo": "डेमो के साथ जारी रखें",
    "Enter as Farmer": "किसान के रूप में प्रवेश करें",
    "Enter as Customer": "ग्राहक के रूप में प्रवेश करें",
    "Sell Produce": "उपज बेचें",
    "Buy Fresh": "ताज़ा उपज खरीदें",
    "Upload produce photo with harvest date & preservation days": "कटाई की तारीख और संरक्षण दिनों के साथ उपज का फोटो अपलोड करें",
    "Compare your price side-by-side with live APMC Mandi rates": "लाइव एपीएमसी मंडी दरों के साथ अपने भाव की तुलना करें",
    "Receive direct customer orders with instant payment settlement": "तत्काल भुगतान के साथ सीधे ग्राहक ऑर्डर प्राप्त करें",
    "Select any custom quantity (e.g. 1 kg, 5 kg, 20 kg)": "अपनी पसंद की मात्रा चुनें (जैसे 1 किलो, 5 किलो, 20 किलो)",
    "Affordable distance-based direct farm delivery": "दूरी के आधार पर किफायती सीधी खेत से डिलीवरी",
    "Live GPS delivery tracking once the farmer accepts your order": "किसान द्वारा ऑर्डर स्वीकार करने पर लाइव जीपीएस ट्रैकिंग",
    "Live Mandi Fluctuations": "लाइव मंडी भाव में उतार-चढ़ाव",
    "Real-time modal prices and arrival tonnes across 20+ APMCs.": "20+ एपीएमसी मंडियों में वास्तविक समय मोडल भाव और आवक टन।",
    "Direct Farm Logistics": "सीधा कृषि परिवहन",
    "Fair delivery charges calculated automatically by distance.": "दूरी के अनुसार स्वचालित निष्पक्ष डिलीवरी शुल्क।",
    "Prevent Overselling": "अतिरिक्त बिक्री से सुरक्षा",
    "Atomic inventory locking protects farmers and buyers.": "सटीक इन्वेंटरी लॉकिंग किसानों और खरीदारों दोनों की सुरक्षा करती है।",
    "Kisan Mitra AI Assistant": "किसान मित्र एआई सहायक",
    "Smart advisor for crop diseases, market timing, and shelf life.": "फसल रोग, बाज़ार समय और भंडारण के लिए स्मार्ट सलाहकार।",
    "FarmiQ": "फार्मआईक्यू (FarmiQ)",

    // Navigation & Menus
    "Dashboard": "डैशबोर्ड",
    "My Produce": "मेरी उपज",
    "Add Produce": "उपज जोड़ें",
    "Incoming Orders": "प्राप्त ऑर्डर",
    "Customer Orders": "ग्राहक ऑर्डर",
    "My Orders": "मेरे ऑर्डर",
    "Buyer Orders": "थोक खरीदार ऑर्डर",
    "Marketplace": "मंडी बाज़ार",
    "Live Mandi Rates": "लाइव मंडी भाव",
    "Storage & Logistics": "कोल्ड स्टोरेज और परिवहन",
    "Digital Contracts": "डिजिटल अनुबंध",
    "Digital Contracts & Escrow": "डिजिटल अनुबंध और एस्क्रो",
    "Procure FPO Lots": "एफपीओ लॉट खरीदें",
    "FPO Lots & Aggregation": "एफपीओ लॉट और एकत्रीकरण",
    "Assemble Graded Lot": "ग्रेडेड लॉट तैयार करें",
    "Regional Farmers Directory": "क्षेत्रीय किसान निर्देशिका",
    "Post Requirement": "मांग पोस्ट करें",
    "Disputes & Support": "विवाद निवारण और सहायता",
    "Disputes": "विवाद",
    "Admin Monitor": "व्यवस्थापक निगरानी",
    "Admin Overview": "व्यवस्थापक अवलोकन",
    "Set Location": "स्थान निर्धारित करें",
    "Change Location": "स्थान बदलें",
    "Active": "सक्रिय",
    "Escrow": "एस्क्रो",
    "APMC Live": "एपीएमसी लाइव",

    // Crops / Produce Names
    "Tomato": "टमाटर",
    "Fresh Tomato": "ताज़ा टमाटर",
    "Onion": "प्याज",
    "Red Onion": "लाल प्याज",
    "Potato": "आलू",
    "Potatoes": "आलू",
    "Wheat": "गेहूं",
    "Golden Wheat": "सुनहरा गेहूं",
    "Rice / Paddy": "चावल / धान",
    "Rice": "चावल",
    "Paddy": "धान",
    "Basmati Rice": "बासमती चावल",
    "Mustard": "सरसों",
    "Mustard Seeds": "सरसों के बीज",
    "Moong Dal": "मूंग दाल",
    "Yellow Moong Dal": "पीली मूंग दाल",
    "Green Moong": "हरी मूंग",
    "Tur Dal": "तुअर दाल (अरहर)",
    "Arhar Dal": "अरहर दाल",
    "Toor Dal": "तूर दाल",
    "Okra / Bhindi": "भिंडी",
    "Okra": "भिंडी",
    "Bhindi": "भिंडी",
    "Ladyfinger": "भिंडी",
    "Guava": "अमरूद",
    "Fresh Guava": "ताज़ा अमरूद",
    "Cardamom": "इलायची",
    "Green Cardamom": "हरी इलायची",
    "Elaichi": "इलायची",
    "Coriander": "धनिया",
    "Coriander Seeds": "धनिया के बीज",
    "Fresh Coriander": "ताज़ा धनिया",
    "Mango": "आम",
    "Ripe Mango": "पका हुआ आम",
    "Alphonso Mango": "हापुस (अल्फांसो) आम",
    "Banana": "केला",
    "Bananas": "केले",
    "Apple": "सेब",
    "Fresh Apples": "ताज़ा सेब",
    "Green Chilli": "हरी मिर्च",
    "Red Chilli": "लाल मिर्च",
    "Chilli": "मिर्च",
    "Garlic": "लहसुन",
    "Garlic Bulbs": "लहसुन",
    "Ginger": "अदरक",
    "Ginger Root": "अदरक",
    "Turmeric": "हल्दी",
    "Turmeric Root": "कच्ची हल्दी",
    "Cotton": "कपास",
    "Raw Cotton": "कच्ची कपास",
    "Sugarcane": "गन्ना",
    "Soyabean": "सोयाबीन",
    "Soybean": "सोयाबीन",
    "Groundnut": "मूंगफली",
    "Peanut": "मूंगफली",
    "Maize": "मक्का",
    "Corn": "मक्का",
    "Grapes": "अंगूर",
    "Green Grapes": "हरे अंगूर",
    "Pomegranate": "अनार",
    "Cabbage": "पत्ता गोभी",
    "Cauliflower": "फूल गोभी",
    "Brinjal": "बैंगन",
    "Eggplant": "बैंगन",
    "Carrot": "गाजर",
    "Radish": "मूली",
    "Spinach": "पालक",
    "Fenugreek": "मेथी",
    "Cumin": "जीरा",

    // Categories
    "All Categories": "सभी श्रेणियां",
    "All Commodities": "सभी फसलें",
    "All Crops": "सभी फसलें",
    "Vegetables": "सब्जियां",
    "Fruits": "फल",
    "Grains & Cereals": "अनाज और खाद्यान्न",
    "Pulses & Dals": "दालें और दलहन",
    "Spices": "मसाले",
    "Cash Crops": "नकदी फसलें",
    "Organic Only": "केवल जैविक (Organic)",
    "Chemical-Free / Organic Certified Produce": "रसायन मुक्त / प्रमाणित जैविक उपज",

    // Mandi Filters & UI
    "Select State": "राज्य चुनें",
    "Select District": "ज़िला चुनें",
    "Select Local Mandi / Market": "स्थानीय मंडी / बाज़ार चुनें",
    "All States": "सभी राज्य",
    "All Districts": "सभी ज़िले",
    "All Markets": "सभी मंडियां",
    "All Mandi Yards": "सभी मंडी यार्ड",
    "Use My Location": "मेरी लोकेशन चुनें",
    "Locating nearest market...": "निकटतम मंडी खोज रहे हैं...",
    "Nearest Local Mandi": "निकटतम स्थानीय मंडी",
    "Active Location:": "सक्रिय स्थान:",
    "Selected Local Mandi Yard": "चयनित स्थानीय मंडी यार्ड",
    "Local Market Yard Overview": "स्थानीय मंडी यार्ड विवरण",
    "Interactive APMC Local Mandis Map": "इंटरएक्टिव एपीएमसी स्थानीय मंडी नक्शा",
    "(Click any pin to select that market yard)": "(उस मंडी यार्ड को चुनने के लिए किसी भी पिन पर क्लिक करें)",
    "Mandis in View": "नक्शे में मंडियां",
    "Back to Cards": "कार्ड सूची पर वापस जाएं",
    "View on Interactive Map": "इंटरएक्टिव नक्शे पर देखें",
    "Grid View": "ग्रिड सूची",
    "Map View": "नक्शा देखें",
    "Grid": "ग्रिड",
    "Map": "नक्शा",
    "Reset": "रीसेट करें",
    "Reset All Filters": "सभी फ़िल्टर रीसेट करें",
    "Major Traded Crops:": "मुख्य व्यापारिक फसलें:",
    "Major Traded Crops": "मुख्य व्यापारिक फसलें",
    "Search produce (e.g. Onion, Pyaz, Tomato)...": "फसल खोजें (जैसे प्याज, टमाटर, गेहूं)...",
    "Search produce by crop name, farmer, or location...": "फसल, किसान या स्थान से खोजें...",
    "Fetching live local APMC mandi benchmarks...": "लाइव स्थानीय एपीएमसी मंडी भाव लोड हो रहे हैं...",
    "No commodities found for this filter": "इस फ़िल्टर के लिए कोई फसल नहीं मिली",
    "Try resetting the search query or select another district/mandi to see active trades.": "खोज शब्द बदलें या सक्रिय व्यापार देखने के लिए दूसरा ज़िला/मंडी चुनें।",

    // Price & Trading Terms
    "Modal Price": "मोडल भाव",
    "Modal Price Range:": "मोडल मूल्य सीमा:",
    "Today's Market Arrivals:": "आज की मंडी आवक:",
    "Price Range": "मूल्य सीमा",
    "Farmer Price": "किसान भाव",
    "Current Market Price": "वर्तमान बाज़ार भाव",
    "Mandi Benchmark": "मंडी बेंचमार्क",
    "Use Mandi Rate": "मंडी भाव लागू करें",
    "₹ / kg": "₹ / किलो",
    "₹ / Quintal": "₹ / क्विंटल",
    "₹ / Quintal (100 kg)": "₹ / क्विंटल (100 किलो)",
    "Quintal": "क्विंटल",
    "tonnes": "टन",
    "tonnes today": "टन आज",
    "Distance from you": "आपसे दूरी",
    "km away": "किमी दूर",
    "km from you": "किमी आपसे दूर",
    "Benchmark Advice": "मंडी सलाह",
    "Benchmark Advice:": "मंडी सलाह:",
    "Bullish: Strong demand at yard": "तेज़ी: मंडी में भारी मांग है",
    "Bearish: Heavy supply arriving": "मंदी: भारी आवक के कारण भाव दबाव में",
    "Balanced trade volume": "संतुलित व्यापार: सामान्य मांग",
    "Stable": "स्थिर",
    "APMC Trading Active": "मंडी में व्यापार चालू है",
    "Edit Photo": "फोटो बदलें",
    "Admin: Change crop photo": "व्यवस्थापक: फसल का फोटो बदलें",
    "Edit Produce Photo": "उपज का फोटो बदलें",
    "Current Photo": "वर्तमान फोटो",
    "New Preview": "नया पूर्वावलोकन",
    "Save Changes": "परिवर्तन सहेजें",
    "Cancel": "रद्द करें",

    // Product Card & Actions
    "Take an Order": "ऑर्डर लें",
    "Buy Now": "अभी खरीदें",
    "Quantity": "मात्रा",
    "Available Stock": "उपलब्ध स्टॉक",
    "Out of Stock": "स्टॉक समाप्त",
    "Harvest Date": "कटाई की तारीख",
    "Preservation Guide": "ताज़गी सुरक्षा गाइड",
    "Days Stored": "भंडारण के दिन",
    "Days Remaining": "शेष दिन",
    "Preservation Advice": "संरक्षण सलाह",
    "Product / Crop Name": "फसल / उत्पाद का नाम",
    "Unit of Measurement": "माप की इकाई",
    "Available Quantity": "उपलब्ध मात्रा",
    "Farmer Price (₹ per kg)": "किसान भाव (₹ प्रति किलो)",
    "Farm Location": "खेत का स्थान",
    "Publish to Marketplace": "बाज़ार में प्रकाशित करें",

    // Orders & Tracking
    "Order Status": "ऑर्डर स्थिति",
    "Confirm Direct Order": "सीधे ऑर्डर की पुष्टि करें",
    "Payment Method": "भुगतान विधि",
    "Track Order": "ऑर्डर ट्रैक करें",
    "Live Tracking": "लाइव ट्रैकिंग",
    "View Invoice": "चालान / रसीद देखें",
    "View Receipt": "रसीद देखें",
    "Confirm Delivery": "डिलीवरी की पुष्टि करें",
    "Pay Now": "अभी भुगतान करें",
    "Total Amount": "कुल राशि",
    "Pending": "लंबित",
    "Accepted": "स्वीकृत",
    "Dispatched": "भेज दिया गया (रास्ते में)",
    "Delivered": "डिलीवर हो गया",
    "Cancelled": "रद्द कर दिया गया",
    "Order Placed": "ऑर्डर प्राप्त हुआ",
    "Order Confirmed": "ऑर्डर स्वीकृत",
    "Out for Delivery": "डिलीवरी के लिए निकला",
    "Delivered Successfully": "सफलतापूर्वक डिलीवर हो गया",
    "Zero Deduction Guarantee": "शून्य कटौती गारंटी",
    "Direct Farm Delivery": "सीधी खेत से डिलीवरी",

    // Storage & Logistics
    "Book Storage Space": "कोल्ड स्टोरेज स्पेस बुक करें",
    "Book Cold Storage": "कोल्ड स्टोरेज बुक करें",
    "Cold Storage": "कोल्ड स्टोरेज",
    "Warehouse": "गोदाम",
    "Cold Chamber": "शीत कक्ष (Cold Chamber)",
    "Dry Warehouse": "सूखा गोदाम (Dry Warehouse)",
    "Temperature": "तापमान",
    "Humidity": "नमी / आर्द्रता",
    "Moisture": "नमी",
    "Storage Capacity": "भंडारण क्षमता",
    "Available Capacity": "उपलब्ध क्षमता",

    // Digital Contracts & Escrow
    "Escrow Pre-Funded": "एस्क्रो 100% पहले से जमा",
    "Escrow Verified": "एस्क्रो सत्यापित",
    "Zero transit rejection guarantee": "पारगमन में शून्य अस्वीकृति गारंटी",
    "Instant UPI settlement": "तत्काल यूपीआई भुगतान",
    "File Dispute": "शिकायत दर्ज करें",
    "Live Sync Active": "लाइव डेटा सिंक सक्रिय",

    // Chatbot
    "Chat with Kisan AI": "किसान एआई से बात करें",
    "Kisan Mitra": "किसान मित्र",
    "Ask Kisan AI a Question": "किसान एआई से प्रश्न पूछें",
    "Frequently Asked Questions": "अक्सर पूछे जाने वाले 40 प्रश्न",
    "Select a Question": "सूची से प्रश्न चुनें",

    // Common Words
    "Farmer": "किसान",
    "Customer": "ग्राहक",
    "Admin": "व्यवस्थापक",
    "Buyer": "थोक खरीदार",
    "Orders": "ऑर्डर",
    "Produce": "उपज",
    "Price": "भाव / मूल्य",
    "Status": "स्थिति",
    "Details": "विवरण",
    "Search": "खोजें",
    "Filter": "फ़िल्टर",
    "Close": "बंद करें",
    "Submit": "जमा करें",
    "Update": "अपडेट करें",
    "Delivery": "डिलीवरी / परिवहन",
    "Address": "पता",
    "Contact": "संपर्क",
    "Phone": "फ़ोन नंबर",
    "Email": "ईमेल",
    "Password": "पासवर्ड",
    "Full Name": "पूरा नाम"
  },

  te: {
    // Brand & Hero
    "Direct Farmer ↔ Customer Agriculture Hub": "ప్రత్యక్ష రైతు ↔ వినియోగదారు వ్యవసాయ కేంద్రం",
    "Low-Cost Direct Transport": "సరసమైన ప్రత్యక్ష రవాణా",
    "Low-Cost Direct Delivery": "సరసమైన ప్రత్యక్ష డెలివరీ",
    "Sustainable Agricultural Logistics & Marketplace": "స్థిరమైన వ్యవసాయ లాజిస్టిక్స్ & ప్రత్యక్ష మార్కెట్",
    "Know the Price. Find the Buyer. Sell Better.": "ధర తెలుసుకోండి. కొనుగోలుదారుని పొందండి. లాభదాయకంగా అమ్మండి.",
    "Direct agricultural marketplace connecting farmers directly with customers with zero intermediaries, live mandi benchmark rates, and rapid farm-to-doorstep delivery.": "రైతులను దళారులు లేకుండా నేరుగా వినియోగదారులతో అనుసంధానించే ప్రత్యక్ష మార్కెట్, లైవ్ మార్కెట్ ధరలు మరియు వేగవంతమైన డెలివరీ.",
    "Version 2.0 (Python + React)": "వెర్షన్ 2.0 (పైథాన్ + రియాక్ట్)",
    "Install FarmiQ": "ఫార్మ్ఐక్యూ ఇన్‌స్టాల్ చేయండి",
    "Install FarmiQ on Desktop or Mobile": "డెస్క్‌టాప్ లేదా మొబైల్‌లో ఫార్మ్ఐక్యూ ఇన్‌స్టాల్ చేయండి",
    "Create Account": "ఖాతా సృష్టించండి",
    "Login": "లాగిన్",
    "Logout": "లాగ్ అవుట్",
    "Sign In": "సైన్ ఇన్",
    "Sign Up": "సైన్ అప్",
    "Continue with Demo": "డెమోతో కొనసాగండి",
    "Enter as Farmer": "రైతుగా ప్రవేశించండి",
    "Enter as Customer": "వినియోగదారుడిగా ప్రవేశించండి",
    "Sell Produce": "పంటను అమ్మండి",
    "Buy Fresh": "తాజా పంటను కొనండి",
    "Upload produce photo with harvest date & preservation days": "కోత తేదీ మరియు నిల్వ రోజుల వివరాలతో పంట ఫోటోను అప్‌లోడ్ చేయండి",
    "Compare your price side-by-side with live APMC Mandi rates": "లైవ్ మార్కెట్ ధరలతో మీ ధరను పోల్చి చూసుకోండి",
    "Receive direct customer orders with instant payment settlement": "తక్షణ చెల్లింపుతో నేరుగా కస్టమర్ల నుండి ఆర్డర్లు పొందండి",
    "Select any custom quantity (e.g. 1 kg, 5 kg, 20 kg)": "మీకు కావలసిన పరిమాణాన్ని ఎంచుకోండి (ఉదా: 1 కిలో, 5 కిలోలు, 20 కిలోలు)",
    "Affordable distance-based direct farm delivery": "దూరం ఆధారంగా సరసమైన ప్రత్యక్ష డెలివరీ",
    "Live GPS delivery tracking once the farmer accepts your order": "రైతు ఆర్డర్ అంగీకరించిన వెంటనే లైవ్ జీపీఎస్ ట్రాకింగ్",
    "Live Mandi Fluctuations": "లైవ్ మార్కెట్ ధరల హెచ్చుతగ్గులు",
    "Real-time modal prices and arrival tonnes across 20+ APMCs.": "20+ వ్యవసాయ మార్కెట్ యార్డులలో రియల్ టైమ్ ధరలు మరియు రాకడలు.",
    "Direct Farm Logistics": "ప్రత్యక్ష పొలం రవాణా",
    "Fair delivery charges calculated automatically by distance.": "దూరం ప్రకారం స్వయంచాలకంగా లెక్కించబడే న్యాయమైన డెలివరీ ఛార్జీలు.",
    "Prevent Overselling": "ఓవర్‌సెల్లింగ్ నివారణ",
    "Atomic inventory locking protects farmers and buyers.": "ఖచ్చితమైన ఇన్వెంటరీ లాకింగ్ రైతులు మరియు కొనుగోలుదారులను రక్షిస్తుంది.",
    "Kisan Mitra AI Assistant": "కిసాన్ మిత్ర ఏఐ సహాయకుడు",
    "Smart advisor for crop diseases, market timing, and shelf life.": "పంట తెగుళ్ళు, మార్కెట్ సమయం మరియు నిల్వ కోసం స్మార్ట్ సలహాదారు.",
    "FarmiQ": "ఫార్మ్ఐక్యూ (FarmiQ)",

    // Navigation & Menus
    "Dashboard": "డ్యాష్‌బోర్డ్",
    "My Produce": "నా పంటలు",
    "Add Produce": "పంటను జోడించండి",
    "Incoming Orders": "వచ్చిన ఆర్డర్లు",
    "Customer Orders": "కస్టమర్ ఆర్డర్లు",
    "My Orders": "నా ఆర్డర్లు",
    "Buyer Orders": "కొనుగోలుదారు ఆర్డర్లు",
    "Marketplace": "మార్కెట్‌ప్లేస్",
    "Live Mandi Rates": "లైవ్ మార్కెట్ ధరలు",
    "Storage & Logistics": "కోల్డ్ స్టోరేజ్ & రవాణా",
    "Digital Contracts": "డిజిటల్ ఒప్పందాలు",
    "Digital Contracts & Escrow": "డిజిటల్ ఒప్పందాలు & ఎస్క్రో",
    "Procure FPO Lots": "ఎఫ్పీఓ లాట్లను కొనండి",
    "FPO Lots & Aggregation": "ఎఫ్పీఓ లాట్లు & సమీకరణ",
    "Assemble Graded Lot": "గ్రేడెడ్ లాట్ సిద్ధం చేయండి",
    "Regional Farmers Directory": "ప్రాంతీయ రైతుల డైరెక్టరీ",
    "Post Requirement": "అవసరాన్ని పోస్ట్ చేయండి",
    "Disputes & Support": "సమస్యల పరిష్కారం & మద్దతు",
    "Disputes": "సమస్యలు",
    "Admin Monitor": "అడ్మిన్ మానిటర్",
    "Admin Overview": "అడ్మిన్ అవలోకనం",
    "Set Location": "లొకేషన్ సెట్ చేయండి",
    "Change Location": "లొకేషన్ మార్చండి",
    "Active": "చురుకుగా ఉంది",
    "Escrow": "ఎస్క్రో",
    "APMC Live": "మార్కెట్ లైవ్",

    // Crops
    "Tomato": "టమోటా",
    "Fresh Tomato": "తాజా టమోటా",
    "Onion": "ఉల్లిపాయ",
    "Red Onion": "ఎర్ర ఉల్లిపాయ",
    "Potato": "బంగాళాదుంప",
    "Potatoes": "బంగాళాదుంపలు",
    "Wheat": "గోధుమలు",
    "Golden Wheat": "బంగారు గోధుమలు",
    "Rice / Paddy": "వరి / బియ్యం",
    "Rice": "బియ్యం",
    "Paddy": "వరి",
    "Basmati Rice": "బాస్మతి బియ్యం",
    "Mustard": "ఆవాలు",
    "Mustard Seeds": "ఆవ గింజలు",
    "Moong Dal": "పెసర పప్పు",
    "Yellow Moong Dal": "పసుపు పెసర పప్పు",
    "Green Moong": "పచ్చ పెసలు",
    "Tur Dal": "కంది పప్పు",
    "Arhar Dal": "కంది పప్పు",
    "Toor Dal": "కంది పప్పు",
    "Okra / Bhindi": "బెండకాయ",
    "Okra": "బెండకాయ",
    "Bhindi": "బెండకాయ",
    "Ladyfinger": "బెండకాయ",
    "Guava": "జామకాయ",
    "Fresh Guava": "తాజా జామకాయ",
    "Cardamom": "యాలకులు",
    "Green Cardamom": "పచ్చ యాలకులు",
    "Elaichi": "యాలకులు",
    "Coriander": "కొత్తిమీర / ధనియాలు",
    "Coriander Seeds": "ధనియాలు",
    "Fresh Coriander": "తాజా కొత్తిమీర",
    "Mango": "మామిడి",
    "Ripe Mango": "పండిన మామిడి",
    "Alphonso Mango": "బంగినపల్లి / ఆల్ఫోన్సో మామిడి",
    "Banana": "అరటి",
    "Bananas": "అరటిపండ్లు",
    "Apple": "యాపిల్",
    "Fresh Apples": "తాజా యాపిల్స్",
    "Green Chilli": "పచ్చిమిర్చి",
    "Red Chilli": "ఎండిన మిర్చి",
    "Chilli": "మిర్చి",
    "Garlic": "వెల్లుల్లి",
    "Garlic Bulbs": "వెల్లుల్లి",
    "Ginger": "అల్లం",
    "Ginger Root": "అల్లం",
    "Turmeric": "పసుపు",
    "Turmeric Root": "పచ్చి పసుపు",
    "Cotton": "పత్తి",
    "Raw Cotton": "ముడి పత్తి",
    "Sugarcane": "చెరకు",
    "Soyabean": "సోయాబీన్",
    "Soybean": "సోయాబీన్",
    "Groundnut": "వేరుశెనగ",
    "Peanut": "వేరుశెనగ",
    "Maize": "మొక్కజొన్న",
    "Corn": "మొక్కజొన్న",
    "Grapes": "ద్రాక్ష",
    "Green Grapes": "పచ్చ ద్రాక్ష",
    "Pomegranate": "దానిమ్మ",

    // Categories
    "All Categories": "అన్ని రకాలు",
    "All Commodities": "అన్ని పంటలు",
    "All Crops": "అన్ని పంటలు",
    "Vegetables": "కూరగాయలు",
    "Fruits": "పండ్లు",
    "Grains & Cereals": "ధాన్యాలు",
    "Pulses & Dals": "పప్పుదినుసులు",
    "Spices": "మసాలాలు",
    "Cash Crops": "వాణిజ్య పంటలు",
    "Organic Only": "సేంద్రీయ మాత్రమే (Organic)",
    "Chemical-Free / Organic Certified Produce": "రసాయన రహిత / సేంద్రీయ ధృవీకృత పంట",

    // Mandi Filters & UI
    "Select State": "రాష్ట్రం ఎంచుకోండి",
    "Select District": "జిల్లా ఎంచుకోండి",
    "Select Local Mandi / Market": "స్థానిక మార్కెట్ ఎంచుకోండి",
    "All States": "అన్ని రాష్ట్రాలు",
    "All Districts": "అన్ని జిల్లాలు",
    "All Markets": "అన్ని మార్కెట్లు",
    "All Mandi Yards": "అన్ని మార్కెట్ యార్డులు",
    "Use My Location": "నా లొకేషన్ ఉపయోగించండి",
    "Locating nearest market...": "సమీప మార్కెట్‌ను శోధిస్తున్నాం...",
    "Nearest Local Mandi": "సమీప స్థానిక మార్కెట్",
    "Active Location:": "ప్రస్తుత లొకేషన్:",
    "Selected Local Mandi Yard": "ఎంచుకున్న స్థానిక మార్కెట్ యార్డ్",
    "Local Market Yard Overview": "స్థానిక మార్కెట్ వివరాలు",
    "Interactive APMC Local Mandis Map": "ఇంటరాక్టివ్ మార్కెట్ యార్డుల మ్యాప్",
    "(Click any pin to select that market yard)": "(ఆ మార్కెట్‌ను ఎంచుకోవడానికి పిన్‌పై క్లిక్ చేయండి)",
    "Mandis in View": "మ్యాప్‌లోని మార్కెట్లు",
    "Back to Cards": "కార్డుల జాబితాకు తిరిగి వెళ్లండి",
    "View on Interactive Map": "ఇంటరాక్టివ్ మ్యాప్‌లో చూడండి",
    "Grid View": "గ్రిడ్ వీక్షణ",
    "Map View": "మ్యాప్ వీక్షణ",
    "Grid": "గ్రిడ్",
    "Map": "మ్యాప్",
    "Reset": "రీసెట్ చేయండి",
    "Reset All Filters": "అన్ని ఫిల్టర్లను రీసెట్ చేయండి",
    "Major Traded Crops:": "ప్రధాన వర్తక పంటలు:",
    "Major Traded Crops": "ప్రధాన వర్తక పంటలు",
    "Search produce (e.g. Onion, Pyaz, Tomato)...": "పంట కోసం వెతకండి (ఉదా: ఉల్లిపాయ, టమోటా, గోధుమలు)...",
    "Search produce by crop name, farmer, or location...": "పంట పేరు, రైతు లేదా ప్రాంతం ద్వారా వెతకండి...",
    "Fetching live local APMC mandi benchmarks...": "లైవ్ మార్కెట్ ధరలు లోడ్ అవుతున్నాయి...",
    "No commodities found for this filter": "ఈ ఫిల్టర్‌కు పంటలేవీ కనుగొనబడలేదు",

    // Prices & Details
    "Modal Price": "సగటు మోడల్ ధర",
    "Modal Price Range:": "ధర పరిధి:",
    "Today's Market Arrivals:": "నేటి మార్కెట్ రాకడలు:",
    "Price Range": "ధర పరిధి",
    "Farmer Price": "రైతు ధర",
    "Current Market Price": "ప్రస్తుత మార్కెట్ ధర",
    "Mandi Benchmark": "మార్కెట్ బెంచ్‌మార్క్",
    "Use Mandi Rate": "మార్కెట్ ధరను వాడండి",
    "₹ / kg": "₹ / కిలో",
    "₹ / Quintal": "₹ / క్వింటాల్",
    "₹ / Quintal (100 kg)": "₹ / క్వింటాల్ (100 కిలోలు)",
    "Quintal": "క్వింటాల్",
    "tonnes": "టన్నులు",
    "tonnes today": "టన్నులు ఈరోజు",
    "Distance from you": "మీ నుండి దూరం",
    "km away": "కి.మీ దూరం",
    "km from you": "కి.మీ మీ నుండి",
    "Benchmark Advice": "ధర సలహా",
    "Benchmark Advice:": "ధర సలహా:",
    "Bullish: Strong demand at yard": "డిమాండ్ పెరిగింది: మార్కెట్‌లో మంచి ధర",
    "Bearish: Heavy supply arriving": "రాకడలు పెరిగాయి: ధరలపై ఒత్తిడి ఉంది",
    "Balanced trade volume": "సమతుల్య వర్తకం",
    "Stable": "స్థిరంగా ఉంది",
    "APMC Trading Active": "మార్కెట్ ట్రేడింగ్ చురుకుగా ఉంది",
    "Edit Photo": "ఫోటో మార్చండి",
    "Admin: Change crop photo": "అడ్మిన్: పంట ఫోటో మార్చండి",
    "Edit Produce Photo": "పంట ఫోటోను ఎడిట్ చేయండి",
    "Current Photo": "ప్రస్తుత ఫోటో",
    "New Preview": "కొత్త ప్రివ్యూ",
    "Save Changes": "మార్పులను సేవ్ చేయండి",
    "Cancel": "రద్దు చేయండి",

    // Product & Orders
    "Take an Order": "ఆర్డర్ తీసుకోండి",
    "Buy Now": "ఇప్పుడే కొనండి",
    "Quantity": "పరిమాణం",
    "Available Stock": "అందుబాటులో ఉన్న నిల్వ",
    "Out of Stock": "స్టాక్ అయిపోయింది",
    "Harvest Date": "కోత తేదీ",
    "Preservation Guide": "తాజాదన మార్గదర్శి",
    "Days Stored": "నిల్వ చేసిన రోజులు",
    "Days Remaining": "మిగిలిన రోజులు",
    "Preservation Advice": "నిల్వ సలహా",
    "Product / Crop Name": "పంట / ఉత్పత్తి పేరు",
    "Unit of Measurement": "కొలత ప్రమాణం",
    "Available Quantity": "అందుబాటులో ఉన్న పరిమాణం",
    "Farmer Price (₹ per kg)": "రైతు ధర (₹ ప్రతి కిలోకు)",
    "Farm Location": "పొలం స్థలం",
    "Publish to Marketplace": "మార్కెట్‌ప్లేస్‌లో ప్రచురించండి",
    "Order Status": "ఆర్డర్ స్థితి",
    "Confirm Direct Order": "ఆర్డర్ నిర్ధారించండి",
    "Payment Method": "చెల్లింపు పద్ధతి",
    "Track Order": "ఆర్డర్‌ను ట్రాక్ చేయండి",
    "Live Tracking": "లైవ్ ట్రాకింగ్",
    "View Invoice": "ఇన్వాయిస్ చూడండి",
    "View Receipt": "రసీదు చూడండి",
    "Confirm Delivery": "డెలివరీ నిర్ధారించండి",
    "Pay Now": "ఇప్పుడే చెల్లించండి",
    "Total Amount": "మొత్తం సొమ్ము",
    "Pending": "వేచి ఉంది",
    "Accepted": "స్వీకరించబడింది",
    "Dispatched": "రవాణాలో ఉంది",
    "Delivered": "డెలివరీ పూర్తయింది",
    "Cancelled": "రద్దు చేయబడింది",
    "Zero Deduction Guarantee": "జీరో కటింగ్ గ్యారెంటీ",

    // Storage & Contracts
    "Book Storage Space": "స్టోరేజ్ స్థలాన్ని బుక్ చేయండి",
    "Book Cold Storage": "కోల్డ్ స్టోరేజ్ బుక్ చేయండి",
    "Cold Storage": "కోల్డ్ స్టోరేజ్",
    "Warehouse": "గిడ్డంగి",
    "Temperature": "ఉష్ణోగ్రత",
    "Humidity": "తేమ శాతం",
    "Escrow Pre-Funded": "ఎస్క్రో 100% జమ చేయబడింది",
    "Escrow Verified": "ఎస్క్రో ధృవీకరించబడింది",
    "File Dispute": "ఫిర్యాదు నమోదు చేయండి",
    "Live Sync Active": "లైవ్ సింక్ యాక్టివ్",
    "Chat with Kisan AI": "కిసాన్ ఏఐతో మాట్లాడండి",
    "Farmer": "రైతు",
    "Customer": "వినియోగదారుడు",
    "Admin": "నిర్వాహకుడు",
    "Buyer": "హోల్‌సేల్ కొనుగోలుదారు"
  },

  mr: {
    // Brand & Hero
    "Direct Farmer ↔ Customer Agriculture Hub": "थेट शेतकरी ↔ ग्राहक कृषी केंद्र",
    "Low-Cost Direct Transport": "किफायतशीर थेट वाहतूक",
    "Low-Cost Direct Delivery": "किफायतशीर थेट घरपोच डिलिव्हरी",
    "Sustainable Agricultural Logistics & Marketplace": "शाश्वत कृषी रसद आणि थेट बाजारपेठ",
    "Know the Price. Find the Buyer. Sell Better.": "बाजारभाव जाणा. खरेदीदार शोधा. नफ्यात विका.",
    "Direct agricultural marketplace connecting farmers directly with customers with zero intermediaries, live mandi benchmark rates, and rapid farm-to-doorstep delivery.": "मध्यस्थांशिवाय शेतकऱ्यांना थेट ग्राहकांशी जोडणारी थेट कृषी बाजारपेठ, थेट बाजारभाव आणि तत्पर शेत-ते-घरपोच डिलिव्हरी.",
    "Version 2.0 (Python + React)": "आवृत्ती २.० (पायथन + रिएक्ट)",
    "Install FarmiQ": "फार्मआयक्यू इन्स्टॉल करा",
    "Install FarmiQ on Desktop or Mobile": "डेस्कटॉप किंवा मोबाईलवर फार्मआयक्यू इन्स्टॉल करा",
    "Create Account": "खाते तयार करा",
    "Login": "लॉग इन करा",
    "Logout": "लॉग आउट",
    "Sign In": "साइन इन करा",
    "Sign Up": "साइन अप करा",
    "Continue with Demo": "डेमोसह सुरू ठेवा",
    "Enter as Farmer": "शेतकरी म्हणून प्रवेश करा",
    "Enter as Customer": "ग्राहक म्हणून प्रवेश करा",
    "Sell Produce": "शेतीमाल विका",
    "Buy Fresh": "ताजा शेतीमाल खरेदी करा",
    "Upload produce photo with harvest date & preservation days": "काढणीची तारीख व टिकाऊपणाच्या दिवसांसह शेतीमालाचा फोटो अपलोड करा",
    "Compare your price side-by-side with live APMC Mandi rates": "थेट कृषी उत्पन्न बाजार समिती दरांशी तुमच्या दराची तुलना करा",
    "Receive direct customer orders with instant payment settlement": "त्वरित पेमेंटसह थेट ग्राहकांच्या ऑर्डर्स मिळवा",
    "Select any custom quantity (e.g. 1 kg, 5 kg, 20 kg)": "तुमच्या गरजेनुसार प्रमाण निवडा (उदा. १ किलो, ५ किलो, २० किलो)",
    "Affordable distance-based direct farm delivery": "अंतरानुसार वाजवी थेट शेतातून डिलिव्हरी",
    "Live GPS delivery tracking once the farmer accepts your order": "शेतकऱ्याने ऑर्डर स्वीकारताच थेट जीपीएस ट्रॅकिंग",
    "Live Mandi Fluctuations": "थेट बाजार समिती भाव चढ-उतार",
    "Real-time modal prices and arrival tonnes across 20+ APMCs.": "२०+ बाजार समित्यांमधील रिअल-टाइम सरासरी भाव आणि आवक टन.",
    "Direct Farm Logistics": "थेट शेतीमाल वाहतूक",
    "Fair delivery charges calculated automatically by distance.": "अंतरानुसार स्वयंचलित वाजवी वाहतूक शुल्क.",
    "Prevent Overselling": "जादा विक्रीस प्रतिबंध",
    "Atomic inventory locking protects farmers and buyers.": "अचूक साठा लॉकिंग शेतकरी आणि खरेदीदार दोघांचे रक्षण करते.",
    "Kisan Mitra AI Assistant": "किसान मित्र एआय सहाय्यक",
    "Smart advisor for crop diseases, market timing, and shelf life.": "पिकांचे रोग, योग्य बाजारभाव आणि साठवणुकीसाठी स्मार्ट सल्लागार.",
    "FarmiQ": "फार्मआयक्यू (FarmiQ)",

    // Navigation & Menus
    "Dashboard": "डॅशबोर्ड",
    "My Produce": "माझा शेतीमाल",
    "Add Produce": "शेतीमाल जोडा",
    "Incoming Orders": "नवीन ऑर्डर्स",
    "Customer Orders": "ग्राहकांच्या ऑर्डर्स",
    "My Orders": "माझ्या ऑर्डर्स",
    "Buyer Orders": "खरेदीदार ऑर्डर्स",
    "Marketplace": "बाजारपेठ",
    "Live Mandi Rates": "थेट बाजारभाव",
    "Storage & Logistics": "शीतगृह आणि वाहतूक",
    "Digital Contracts": "डिजिटल करार",
    "Digital Contracts & Escrow": "डिजिटल करार आणि एस्क्रो",
    "Procure FPO Lots": "एफपीओ लॉट खरेदी करा",
    "FPO Lots & Aggregation": "एफपीओ लॉट व एकत्रीकरण",
    "Assemble Graded Lot": "ग्रेडेड लॉट तयार करा",
    "Regional Farmers Directory": "स्थानिक शेतकरी निर्देशिका",
    "Post Requirement": "मागणी नोंदवा",
    "Disputes & Support": "तक्रार निवारण व मदत केंद्र",
    "Disputes": "तक्रारी",
    "Admin Monitor": "प्रशासक नियंत्रण",
    "Admin Overview": "प्रशासक आढावा",
    "Set Location": "ठिकाण निश्चित करा",
    "Change Location": "ठिकाण बदला",
    "Active": "सक्रिय",
    "Escrow": "एस्क्रो",
    "APMC Live": "बाजार समिती थेट",

    // Crops
    "Tomato": "टोमॅटो",
    "Fresh Tomato": "ताजा टोमॅटो",
    "Onion": "कांदा",
    "Red Onion": "लाल कांदा",
    "Potato": "बटाटा",
    "Potatoes": "बटाटे",
    "Wheat": "गहू",
    "Golden Wheat": "सोनेरी गहू",
    "Rice / Paddy": "तांदूळ / भात",
    "Rice": "तांदूळ",
    "Paddy": "भात",
    "Basmati Rice": "बासमती तांदूळ",
    "Mustard": "मोहरी",
    "Mustard Seeds": "मोहरी बियाणे",
    "Moong Dal": "मूग डाळ",
    "Yellow Moong Dal": "पिवळी मूग डाळ",
    "Green Moong": "हिरवे मूग",
    "Tur Dal": "तूर डाळ",
    "Arhar Dal": "तूर डाळ",
    "Toor Dal": "तूर डाळ",
    "Okra / Bhindi": "भेंडी",
    "Okra": "भेंडी",
    "Bhindi": "भेंडी",
    "Ladyfinger": "भेंडी",
    "Guava": "पेरू",
    "Fresh Guava": "ताजा पेरू",
    "Cardamom": "वेलची",
    "Green Cardamom": "हिरवी वेलची",
    "Elaichi": "वेलची",
    "Coriander": "कोथिंबीर / धणे",
    "Coriander Seeds": "धणे",
    "Fresh Coriander": "ताजी कोथिंबीर",
    "Mango": "आंबा",
    "Ripe Mango": "पिकलेला आंबा",
    "Alphonso Mango": "हापूस आंबा",
    "Banana": "केळी",
    "Bananas": "केळी",
    "Apple": "सफरचंद",
    "Fresh Apples": "ताजे सफरचंद",
    "Green Chilli": "हिरवी मिरची",
    "Red Chilli": "लाल मिरची",
    "Chilli": "मिरची",
    "Garlic": "लसूण",
    "Garlic Bulbs": "लसूण",
    "Ginger": "आले",
    "Ginger Root": "आले",
    "Turmeric": "हळद",
    "Turmeric Root": "कच्ची हळद",
    "Cotton": "कापूस",
    "Raw Cotton": "कच्चा कापूस",
    "Sugarcane": "ऊस",
    "Soyabean": "सोयाबीन",
    "Soybean": "सोयाबीन",
    "Groundnut": "भुईमूग (शेंगदाणे)",
    "Peanut": "शेंगदाणे",
    "Maize": "मका",
    "Corn": "मका",
    "Grapes": "द्राक्षे",
    "Green Grapes": "हिरवी द्राक्षे",
    "Pomegranate": "डाळिंब",
    "Cabbage": "कोबी",
    "Cauliflower": "फ्लॉवर",
    "Brinjal": "वांगी",
    "Eggplant": "वांगी",
    "Carrot": "गाजर",
    "Radish": "मुळा",
    "Spinach": "पालक",
    "Fenugreek": "मेथी",
    "Cumin": "जिरे",

    // Categories
    "All Categories": "सर्व वर्गवारी",
    "All Commodities": "सर्व पिके",
    "All Crops": "सर्व पिके",
    "Vegetables": "भाज्या",
    "Fruits": "फळे",
    "Grains & Cereals": "धान्य व कडधान्ये",
    "Pulses & Dals": "डाळी व कडधान्ये",
    "Spices": "मसाले",
    "Cash Crops": "नगदी पिके",
    "Organic Only": "केवळ सेंद्रिय (Organic)",
    "Chemical-Free / Organic Certified Produce": "रसायनमुक्त / प्रमाणित सेंद्रिय शेतीमाल",

    // Mandi Filters & UI
    "Select State": "राज्य निवडा",
    "Select District": "जिल्हा निवडा",
    "Select Local Mandi / Market": "स्थानिक बाजार समिती निवडा",
    "All States": "सर्व राज्ये",
    "All Districts": "सर्व जिल्हे",
    "All Markets": "सर्व बाजार समित्या",
    "All Mandi Yards": "सर्व बाजार समित्या",
    "Use My Location": "माझे लोकेशन वापरा",
    "Locating nearest market...": "जवळची बाजार समिती शोधत आहे...",
    "Nearest Local Mandi": "सर्वात जवळची बाजार समिती",
    "Active Location:": "सक्रिय ठिकाण:",
    "Selected Local Mandi Yard": "निवडलेली स्थानिक बाजार समिती",
    "Local Market Yard Overview": "स्थानिक बाजार समिती आढावा",
    "Interactive APMC Local Mandis Map": "इंटरएक्टिव बाजार समिती नकाशा",
    "(Click any pin to select that market yard)": "(ती बाजार समिती निवडण्यासाठी पिनवर क्लिक करा)",
    "Mandis in View": "दिसणाऱ्या बाजार समित्या",
    "Back to Cards": "कार्ड यादीकडे परत जा",
    "View on Interactive Map": "इंटरएक्टिव नकाशावर पहा",
    "Grid View": "ग्रिड सूची",
    "Map View": "नकाशा दृश्य",
    "Grid": "ग्रिड",
    "Map": "नकाशा",
    "Reset": "रीसेट करा",
    "Reset All Filters": "सर्व फिल्टर्स रीसेट करा",
    "Major Traded Crops:": "प्रमुख व्यापार पिके:",
    "Major Traded Crops": "प्रमुख व्यापार पिके",
    "Search produce (e.g. Onion, Pyaz, Tomato)...": "शेतीमाल शोधा (उदा. कांदा, टोमॅटो, गहू)...",
    "Search produce by crop name, farmer, or location...": "पिकाचे नाव, शेतकरी किंवा ठिकाणानुसार शोधा...",
    "Fetching live local APMC mandi benchmarks...": "थेट बाजार समिती दर लोड होत आहेत...",
    "No commodities found for this filter": "या फिल्टरसाठी कोणतेही पीक सापडले नाही",

    // Price & Details
    "Modal Price": "सरासरी बाजारभाव",
    "Modal Price Range:": "बाजारभाव मर्यादा:",
    "Today's Market Arrivals:": "आजची एकूण आवक:",
    "Price Range": "बाजारभाव मर्यादा",
    "Farmer Price": "शेतकरी दर",
    "Current Market Price": "चालू बाजारभाव",
    "Mandi Benchmark": "बाजार समिती बेंचमार्क",
    "Use Mandi Rate": "हा बाजारभाव लागू करा",
    "₹ / kg": "₹ / किलो",
    "₹ / Quintal": "₹ / क्विंटल",
    "₹ / Quintal (100 kg)": "₹ / क्विंटल (१०० किलो)",
    "Quintal": "क्विंटल",
    "tonnes": "टन",
    "tonnes today": "टन आज",
    "Distance from you": "तुमच्यापासून अंतर",
    "km away": "किमी लांब",
    "km from you": "किमी तुमच्यापासून",
    "Benchmark Advice": "बाजारभाव सल्ला",
    "Benchmark Advice:": "बाजारभाव सल्ला:",
    "Bullish: Strong demand at yard": "तेजी: बाजार समितीत जोरदार मागणी आहे",
    "Bearish: Heavy supply arriving": "मंदी: आवक जास्त असल्याने भाव कमी",
    "Balanced trade volume": "संतुलित व्यापार: सामान्य खरेदी-विक्री",
    "Stable": "स्थिर",
    "APMC Trading Active": "बाजार समितीत खरेदी-विक्री सुरू",
    "Edit Photo": "फोटो बदला",
    "Admin: Change crop photo": "प्रशासक: पिकाचा फोटो बदला",
    "Edit Produce Photo": "शेतीमालाचा फोटो बदला",
    "Current Photo": "सध्याचा फोटो",
    "New Preview": "नवीन पूर्वावलोकन",
    "Save Changes": "बदल जतन करा",
    "Cancel": "रद्द करा",

    // Product & Orders
    "Take an Order": "ऑर्डर घ्या",
    "Buy Now": "आत्ता खरेदी करा",
    "Quantity": "प्रमाण",
    "Available Stock": "शिल्लक साठा",
    "Out of Stock": "साठा संपला",
    "Harvest Date": "काढणीची तारीख",
    "Preservation Guide": "ताजेपणा टिकवण्याचे मार्गदर्शन",
    "Days Stored": "साठवणुकीचे दिवस",
    "Days Remaining": "उरलेले दिवस",
    "Preservation Advice": "साठवणूक सल्ला",
    "Product / Crop Name": "पिकाचे / उत्पादनाचे नाव",
    "Unit of Measurement": "मापनाचे एकक",
    "Available Quantity": "उपलब्ध प्रमाण",
    "Farmer Price (₹ per kg)": "शेतकरी दर (₹ प्रति किलो)",
    "Farm Location": "शेताचे ठिकाण",
    "Publish to Marketplace": "बाजारपेठेत विक्रीसाठी ठेवा",
    "Order Status": "ऑर्डर स्थिती",
    "Confirm Direct Order": "थेट ऑर्डरची पुष्टी करा",
    "Payment Method": "पेमेंट पर्याय",
    "Track Order": "ऑर्डर ट्रॅक करा",
    "Live Tracking": "थेट ट्रॅकिंग",
    "View Invoice": "पावती / बिल पहा",
    "View Receipt": "पावती पहा",
    "Confirm Delivery": "डिलिव्हरीची पुष्टी करा",
    "Pay Now": "आता पैसे भरा",
    "Total Amount": "एकूण रक्कम",
    "Pending": "प्रलंबित",
    "Accepted": "स्वीकारले",
    "Dispatched": "रवाना झाले",
    "Delivered": "डिलिव्हर झाले",
    "Cancelled": "रद्द झाले",
    "Zero Deduction Guarantee": "शून्य कपात हमी",

    // Storage & Contracts
    "Book Storage Space": "शीतगृह जागा बुक करा",
    "Book Cold Storage": "शीतगृह बुक करा",
    "Cold Storage": "शीतगृह",
    "Warehouse": "गोदाम",
    "Temperature": "तापमान",
    "Humidity": "आर्द्रता / दमटपणा",
    "Escrow Pre-Funded": "एस्क्रो १००% आधीच जमा",
    "Escrow Verified": "एस्क्रो पडताळणी पूर्ण",
    "File Dispute": "तक्रार नोंदवा",
    "Live Sync Active": "थेट सिंक सुरू आहे",
    "Chat with Kisan AI": "किसान एआयशी बोला",
    "Farmer": "शेतकरी",
    "Customer": "ग्राहक",
    "Admin": "प्रशासक",
    "Buyer": "थोक खरेदीदार"
  }
};

// Sort entries longest first to ensure multi-word phrases match before individual words
const COMPILED_RULES: Record<'hi' | 'te' | 'mr', Array<{ pattern: RegExp; replacement: string }>> = {
  hi: [],
  te: [],
  mr: []
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Precompile regex rules for speed
for (const lang of ['hi', 'te', 'mr'] as const) {
  const dict = DICTIONARY[lang];
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length);
  COMPILED_RULES[lang] = sortedKeys.map(key => {
    // If the key is alphanumeric, match with word boundary or boundary punctuation
    const escaped = escapeRegex(key);
    return {
      pattern: new RegExp(`(?<=^|\\s|["'(\\[{>])${escaped}(?=[\\s.,!?;:"')\\]}<]|$)`, 'gi'),
      replacement: dict[key]
    };
  });
}

/**
 * Translate a single text string into target language
 */
export function translateText(text: string, lang: LanguageCode): string {
  if (!text || lang === 'en' || !['hi', 'te', 'mr'].includes(lang)) {
    return text;
  }
  const rules = COMPILED_RULES[lang as 'hi' | 'te' | 'mr'];
  let result = text;
  for (const rule of rules) {
    result = result.replace(rule.pattern, rule.replacement);
  }
  return result;
}

// Active observer to continuously catch React state updates and re-renders
let activeObserver: MutationObserver | null = null;
let currentActiveLang: LanguageCode = 'en';
let isApplying = false;

/**
 * Recursively translate DOM node
 */
function translateNode(node: Node, lang: 'hi' | 'te' | 'mr') {
  // Ignore script, style, translate container, code
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'code', 'pre'].includes(tagName)) return;
    if (el.id === 'google_translate_element' || el.classList.contains('skiptranslate') || el.classList.contains('notranslate')) return;

    // Attributes: placeholder, title, aria-label
    if (el.hasAttribute('placeholder')) {
      const orig = el.getAttribute('data-orig-placeholder') || el.getAttribute('placeholder') || '';
      if (!el.hasAttribute('data-orig-placeholder')) el.setAttribute('data-orig-placeholder', orig);
      const translated = translateText(orig, lang);
      if (translated !== el.getAttribute('placeholder')) {
        el.setAttribute('placeholder', translated);
      }
    }

    if (el.hasAttribute('title')) {
      const orig = el.getAttribute('data-orig-title') || el.getAttribute('title') || '';
      if (!el.hasAttribute('data-orig-title')) el.setAttribute('data-orig-title', orig);
      const translated = translateText(orig, lang);
      if (translated !== el.getAttribute('title')) {
        el.setAttribute('title', translated);
      }
    }

    // Traverse children
    for (let i = 0; i < node.childNodes.length; i++) {
      translateNode(node.childNodes[i], lang);
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    const content = textNode.nodeValue || '';
    if (!content.trim()) return;

    const orig = (textNode as any)._origText !== undefined ? (textNode as any)._origText : content;
    if ((textNode as any)._origText === undefined) {
      (textNode as any)._origText = orig;
    }

    const translated = translateText(orig, lang);
    if (translated !== content) {
      textNode.nodeValue = translated;
    }
  }
}

/**
 * Revert DOM node back to English
 */
function revertNode(node: Node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript'].includes(tagName)) return;

    if (el.hasAttribute('data-orig-placeholder')) {
      el.setAttribute('placeholder', el.getAttribute('data-orig-placeholder')!);
      el.removeAttribute('data-orig-placeholder');
    }
    if (el.hasAttribute('data-orig-title')) {
      el.setAttribute('title', el.getAttribute('data-orig-title')!);
      el.removeAttribute('data-orig-title');
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      revertNode(node.childNodes[i]);
    }
  } else if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    if ((textNode as any)._origText !== undefined) {
      textNode.nodeValue = (textNode as any)._origText;
      delete (textNode as any)._origText;
    }
  }
}

/**
 * Apply full DOM translation and maintain live observer
 */
export function applyDomTranslation(lang: LanguageCode) {
  currentActiveLang = lang;

  if (typeof document === 'undefined') return;

  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }

  if (lang === 'en') {
    revertNode(document.body);
    return;
  }

  const targetLang = lang as 'hi' | 'te' | 'mr';

  // Translate existing DOM tree
  isApplying = true;
  try {
    translateNode(document.body, targetLang);
  } finally {
    isApplying = false;
  }

  // Set up high-performance mutation observer to translate new nodes
  activeObserver = new MutationObserver((mutations) => {
    if (isApplying || currentActiveLang === 'en') return;
    isApplying = true;
    try {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            translateNode(mutation.addedNodes[i], targetLang);
          }
        } else if (mutation.type === 'characterData') {
          const target = mutation.target as Text;
          if ((target as any)._origText === undefined) {
            (target as any)._origText = target.nodeValue || '';
          }
          const orig = (target as any)._origText;
          const translated = translateText(orig, targetLang);
          if (target.nodeValue !== translated) {
            target.nodeValue = translated;
          }
        }
      }
    } finally {
      isApplying = false;
    }
  });

  activeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

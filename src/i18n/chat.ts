// UI text for the NIAT AI Admission Agent in six languages.

export type ChatLanguage = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';

export const CHAT_LANGUAGES: { code: ChatLanguage; label: string; speech: string }[] = [
  { code: 'en', label: 'English', speech: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', speech: 'hi-IN' },
  { code: 'ta', label: 'தமிழ்', speech: 'ta-IN' },
  { code: 'te', label: 'తెలుగు', speech: 'te-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', speech: 'kn-IN' },
  { code: 'ml', label: 'മലയാളം', speech: 'ml-IN' }
];

interface ChatStrings {
  title: string;
  badge: string;
  subtitle: string;
  placeholder: string;
  thinking: string;
  connect: string;
  connectHuman: string;
  actionsTaken: string;
  verifiedRef: string;
  listening: string;
  voiceUnsupported: string;
  intro: string;
  cleared: string;
  errorQuery: string;
  errorNetwork: string;
  suggestions: string[];
}

export const CHAT_STRINGS: Record<ChatLanguage, ChatStrings> = {
  en: {
    title: 'NIAT AI Admission Agent',
    badge: 'Agent · Tools enabled',
    subtitle: 'Answers from the official handbook, and can act for you: check eligibility, register for events, book counselling.',
    placeholder: 'Ask anything, or say "register me for event 1"...',
    thinking: 'Thinking and using tools...',
    connect: 'Connect with Counsellor',
    connectHuman: 'Connect with Human Counsellor',
    actionsTaken: 'Agent actions',
    verifiedRef: 'Verified Official Reference:',
    listening: 'Listening...',
    voiceUnsupported: 'Voice input is not supported in this browser. Try Chrome.',
    intro: 'Hello{name}! I am the **NIAT AI Admission Agent**.\n\nAsk me about programs, eligibility, fees, scholarships, NSAT or placements. I can also **do things for you**: check your eligibility, register you for events, show your application status, book a counsellor, or review your GitHub profile for the Young Innovator Scholarship.\n\nYou can type or speak in English, हिन्दी, தமிழ், తెలుగు, ಕನ್ನಡ or മലയാളം.',
    cleared: 'Conversation cleared! How can I help you today?',
    errorQuery: 'Something went wrong. Please try again.',
    errorNetwork: 'Network connection issue. Please check your connection and retry.',
    suggestions: ['Am I eligible for B.Tech?', 'What are the fees and scholarships?', 'Show upcoming events', 'Register me for event 1', 'What is my application status?', 'Review my GitHub: github.com/octocat']
  },
  hi: {
    title: 'NIAT AI एडमिशन एजेंट',
    badge: 'एजेंट · टूल्स सक्रिय',
    subtitle: 'आधिकारिक हैंडबुक से जवाब, और आपके लिए काम: पात्रता जाँच, इवेंट रजिस्ट्रेशन, काउंसलिंग बुकिंग।',
    placeholder: 'कुछ भी पूछें, या कहें "event 1 के लिए रजिस्टर करो"...',
    thinking: 'सोच रहा हूँ और टूल्स इस्तेमाल कर रहा हूँ...',
    connect: 'काउंसलर से बात करें',
    connectHuman: 'एडमिशन काउंसलर से जुड़ें',
    actionsTaken: 'एजेंट ने ये किया',
    verifiedRef: 'आधिकारिक स्रोत:',
    listening: 'सुन रहा हूँ...',
    voiceUnsupported: 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। Chrome आज़माएँ।',
    intro: 'नमस्ते{name}! मैं **NIAT AI एडमिशन एजेंट** हूँ।\n\nप्रोग्राम, पात्रता, फीस, स्कॉलरशिप, NSAT या प्लेसमेंट के बारे में पूछें। मैं आपके लिए **काम भी कर सकता हूँ**: पात्रता जाँचना, इवेंट में रजिस्टर करना, एप्लिकेशन की स्थिति दिखाना, काउंसलर बुक करना या GitHub प्रोफ़ाइल देखना।',
    cleared: 'बातचीत साफ़ हो गई! मैं आपकी कैसे मदद कर सकता हूँ?',
    errorQuery: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।',
    errorNetwork: 'नेटवर्क की समस्या है। कृपया कनेक्शन जाँचें और फिर कोशिश करें।',
    suggestions: ['क्या मैं B.Tech के लिए पात्र हूँ?', 'फीस और स्कॉलरशिप क्या हैं?', 'आने वाले इवेंट्स दिखाओ', 'event 1 के लिए रजिस्टर करो', 'मेरी एप्लिकेशन की स्थिति क्या है?', 'हॉस्टल की सुविधा कैसी है?']
  },
  ta: {
    title: 'NIAT AI சேர்க்கை முகவர்',
    badge: 'முகவர் · கருவிகள் இயக்கத்தில்',
    subtitle: 'அதிகாரப்பூர்வ கையேட்டிலிருந்து பதில்கள், உங்களுக்காக செயல்களும்: தகுதி சரிபார்ப்பு, நிகழ்வு பதிவு, ஆலோசனை முன்பதிவு.',
    placeholder: 'எதையும் கேளுங்கள், அல்லது "நிகழ்வு 1-க்கு பதிவு செய்" என்று சொல்லுங்கள்...',
    thinking: 'யோசித்து கருவிகளைப் பயன்படுத்துகிறேன்...',
    connect: 'ஆலோசகருடன் பேசுங்கள்',
    connectHuman: 'சேர்க்கை ஆலோசகருடன் இணையுங்கள்',
    actionsTaken: 'முகவர் செய்தவை',
    verifiedRef: 'அதிகாரப்பூர்வ ஆதாரம்:',
    listening: 'கேட்கிறேன்...',
    voiceUnsupported: 'இந்த உலாவியில் குரல் உள்ளீடு இல்லை. Chrome-ஐ முயற்சிக்கவும்.',
    intro: 'வணக்கம்{name}! நான் **NIAT AI சேர்க்கை முகவர்**.\n\nபடிப்புகள், தகுதி, கட்டணம், உதவித்தொகை, NSAT அல்லது வேலைவாய்ப்பு பற்றிக் கேளுங்கள். உங்களுக்காக **செயல்படவும் முடியும்**: தகுதி சரிபார்ப்பு, நிகழ்வுகளில் பதிவு, விண்ணப்ப நிலை, ஆலோசகர் முன்பதிவு, GitHub சுயவிவர ஆய்வு.',
    cleared: 'உரையாடல் அழிக்கப்பட்டது! இன்று நான் எப்படி உதவலாம்?',
    errorQuery: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    errorNetwork: 'இணைய இணைப்பில் சிக்கல். இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.',
    suggestions: ['நான் B.Tech-க்கு தகுதியானவரா?', 'கட்டணம் மற்றும் உதவித்தொகை என்ன?', 'வரவிருக்கும் நிகழ்வுகளைக் காட்டு', 'நிகழ்வு 1-க்கு பதிவு செய்', 'என் விண்ணப்ப நிலை என்ன?', 'விடுதி வசதிகள் எப்படி?']
  },
  te: {
    title: 'NIAT AI అడ్మిషన్ ఏజెంట్',
    badge: 'ఏజెంట్ · టూల్స్ సక్రియం',
    subtitle: 'అధికారిక హ్యాండ్‌బుక్ నుండి సమాధానాలు, మీ కోసం పనులు: అర్హత తనిఖీ, ఈవెంట్ నమోదు, కౌన్సెలింగ్ బుకింగ్.',
    placeholder: 'ఏదైనా అడగండి, లేదా "ఈవెంట్ 1 కి నమోదు చేయి" అని చెప్పండి...',
    thinking: 'ఆలోచిస్తూ టూల్స్ ఉపయోగిస్తున్నాను...',
    connect: 'కౌన్సెలర్‌తో మాట్లాడండి',
    connectHuman: 'అడ్మిషన్ కౌన్సెలర్‌ను సంప్రదించండి',
    actionsTaken: 'ఏజెంట్ చేసినవి',
    verifiedRef: 'అధికారిక మూలం:',
    listening: 'వింటున్నాను...',
    voiceUnsupported: 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ లేదు. Chrome ప్రయత్నించండి.',
    intro: 'నమస్కారం{name}! నేను **NIAT AI అడ్మిషన్ ఏజెంట్**.\n\nకోర్సులు, అర్హత, ఫీజులు, స్కాలర్‌షిప్‌లు, NSAT లేదా ప్లేస్‌మెంట్ల గురించి అడగండి. మీ కోసం **పనులు కూడా చేయగలను**: అర్హత తనిఖీ, ఈవెంట్‌లలో నమోదు, దరఖాస్తు స్థితి, కౌన్సెలర్ బుకింగ్, GitHub ప్రొఫైల్ విశ్లేషణ.',
    cleared: 'సంభాషణ తొలగించబడింది! ఈ రోజు నేను ఎలా సహాయపడగలను?',
    errorQuery: 'ఏదో పొరపాటు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    errorNetwork: 'నెట్‌వర్క్ సమస్య. దయచేసి కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    suggestions: ['నేను B.Tech కి అర్హుడినా?', 'ఫీజులు మరియు స్కాలర్‌షిప్‌లు ఏమిటి?', 'రాబోయే ఈవెంట్‌లు చూపించు', 'ఈవెంట్ 1 కి నమోదు చేయి', 'నా దరఖాస్తు స్థితి ఏమిటి?', 'హాస్టల్ సౌకర్యాలు ఎలా ఉన్నాయి?']
  },
  kn: {
    title: 'NIAT AI ಪ್ರವೇಶ ಏಜೆಂಟ್',
    badge: 'ಏಜೆಂಟ್ · ಉಪಕರಣಗಳು ಸಕ್ರಿಯ',
    subtitle: 'ಅಧಿಕೃತ ಕೈಪಿಡಿಯಿಂದ ಉತ್ತರಗಳು, ನಿಮಗಾಗಿ ಕೆಲಸಗಳು: ಅರ್ಹತೆ ಪರಿಶೀಲನೆ, ಕಾರ್ಯಕ್ರಮ ನೋಂದಣಿ, ಸಮಾಲೋಚನೆ ಬುಕಿಂಗ್.',
    placeholder: 'ಏನಾದರೂ ಕೇಳಿ, ಅಥವಾ "ಕಾರ್ಯಕ್ರಮ 1 ಕ್ಕೆ ನೋಂದಾಯಿಸಿ" ಎಂದು ಹೇಳಿ...',
    thinking: 'ಯೋಚಿಸುತ್ತಾ ಉಪಕರಣಗಳನ್ನು ಬಳಸುತ್ತಿದ್ದೇನೆ...',
    connect: 'ಸಲಹೆಗಾರರೊಂದಿಗೆ ಮಾತನಾಡಿ',
    connectHuman: 'ಪ್ರವೇಶ ಸಲಹೆಗಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ',
    actionsTaken: 'ಏಜೆಂಟ್ ಮಾಡಿದ ಕೆಲಸಗಳು',
    verifiedRef: 'ಅಧಿಕೃತ ಮೂಲ:',
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ...',
    voiceUnsupported: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಇಲ್ಲ. Chrome ಪ್ರಯತ್ನಿಸಿ.',
    intro: 'ನಮಸ್ಕಾರ{name}! ನಾನು **NIAT AI ಪ್ರವೇಶ ಏಜೆಂಟ್**.\n\nಕೋರ್ಸ್‌ಗಳು, ಅರ್ಹತೆ, ಶುಲ್ಕ, ವಿದ್ಯಾರ್ಥಿವೇತನ, NSAT ಅಥವಾ ಉದ್ಯೋಗಾವಕಾಶಗಳ ಬಗ್ಗೆ ಕೇಳಿ. ನಿಮಗಾಗಿ **ಕೆಲಸವನ್ನೂ ಮಾಡಬಲ್ಲೆ**: ಅರ್ಹತೆ ಪರಿಶೀಲನೆ, ಕಾರ್ಯಕ್ರಮ ನೋಂದಣಿ, ಅರ್ಜಿಯ ಸ್ಥಿತಿ, ಸಲಹೆಗಾರರ ಬುಕಿಂಗ್, GitHub ಪ್ರೊಫೈಲ್ ವಿಶ್ಲೇಷಣೆ.',
    cleared: 'ಸಂಭಾಷಣೆ ಅಳಿಸಲಾಗಿದೆ! ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
    errorQuery: 'ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    errorNetwork: 'ನೆಟ್‌ವರ್ಕ್ ಸಮಸ್ಯೆ. ದಯವಿಟ್ಟು ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    suggestions: ['ನಾನು B.Tech ಗೆ ಅರ್ಹನೇ?', 'ಶುಲ್ಕ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ ಏನು?', 'ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ತೋರಿಸಿ', 'ಕಾರ್ಯಕ್ರಮ 1 ಕ್ಕೆ ನೋಂದಾಯಿಸಿ', 'ನನ್ನ ಅರ್ಜಿಯ ಸ್ಥಿತಿ ಏನು?', 'ಹಾಸ್ಟೆಲ್ ಸೌಲಭ್ಯಗಳು ಹೇಗಿವೆ?']
  },
  ml: {
    title: 'NIAT AI അഡ്മിഷൻ ഏജന്റ്',
    badge: 'ഏജന്റ് · ടൂളുകൾ സജീവം',
    subtitle: 'ഔദ്യോഗിക ഹാൻഡ്‌ബുക്കിൽ നിന്നുള്ള ഉത്തരങ്ങൾ, നിങ്ങൾക്കായി പ്രവൃത്തികൾ: യോഗ്യത പരിശോധന, പരിപാടി രജിസ്ട്രേഷൻ, കൗൺസിലിംഗ് ബുക്കിംഗ്.',
    placeholder: 'എന്തും ചോദിക്കൂ, അല്ലെങ്കിൽ "പരിപാടി 1-ന് രജിസ്റ്റർ ചെയ്യൂ" എന്ന് പറയൂ...',
    thinking: 'ആലോചിച്ച് ടൂളുകൾ ഉപയോഗിക്കുന്നു...',
    connect: 'കൗൺസിലറുമായി സംസാരിക്കുക',
    connectHuman: 'അഡ്മിഷൻ കൗൺസിലറുമായി ബന്ധപ്പെടുക',
    actionsTaken: 'ഏജന്റ് ചെയ്തത്',
    verifiedRef: 'ഔദ്യോഗിക ഉറവിടം:',
    listening: 'കേൾക്കുന്നു...',
    voiceUnsupported: 'ഈ ബ്രൗസറിൽ വോയ്സ് ഇൻപുട്ട് ലഭ്യമല്ല. Chrome ഉപയോഗിക്കുക.',
    intro: 'നമസ്കാരം{name}! ഞാൻ **NIAT AI അഡ്മിഷൻ ഏജന്റ്** ആണ്.\n\nകോഴ്സുകൾ, യോഗ്യത, ഫീസ്, സ്കോളർഷിപ്പ്, NSAT അല്ലെങ്കിൽ പ്ലേസ്മെന്റ് എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ. നിങ്ങൾക്കായി **കാര്യങ്ങൾ ചെയ്യാനും കഴിയും**: യോഗ്യത പരിശോധന, പരിപാടി രജിസ്ട്രേഷൻ, അപേക്ഷയുടെ നില, കൗൺസിലർ ബുക്കിംഗ്, GitHub പ്രൊഫൈൽ വിശകലനം.',
    cleared: 'സംഭാഷണം മായ്ച്ചു! ഇന്ന് ഞാൻ എങ്ങനെ സഹായിക്കണം?',
    errorQuery: 'എന്തോ പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.',
    errorNetwork: 'നെറ്റ്‌വർക്ക് പ്രശ്നം. കണക്ഷൻ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.',
    suggestions: ['എനിക്ക് B.Tech-ന് യോഗ്യതയുണ്ടോ?', 'ഫീസും സ്കോളർഷിപ്പും എന്തൊക്കെ?', 'വരാനിരിക്കുന്ന പരിപാടികൾ കാണിക്കൂ', 'പരിപാടി 1-ന് രജിസ്റ്റർ ചെയ്യൂ', 'എന്റെ അപേക്ഷയുടെ നില എന്താണ്?', 'ഹോസ്റ്റൽ സൗകര്യങ്ങൾ എങ്ങനെയാണ്?']
  }
};

const STORAGE_KEY = 'niat_chat_language';

export function loadChatLanguage(): ChatLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ChatLanguage | null;
    if (saved && saved in CHAT_STRINGS) return saved;
  } catch {
    // storage unavailable (private mode etc.)
  }
  return 'en';
}

export function saveChatLanguage(lang: ChatLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

// ========================================================
// NIAT Connect – Multilingual support for the admission agent
// English, Hindi, Tamil, Telugu, Kannada, Malayalam
// ========================================================

const LANGUAGES = {
  en: { name: 'English', native: 'English' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  ta: { name: 'Tamil', native: 'தமிழ்' },
  te: { name: 'Telugu', native: 'తెలుగు' },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', native: 'മലയാളം' }
};

// Unicode blocks for each script
const SCRIPT_RANGES = [
  { lang: 'hi', re: /[ऀ-ॿ]/g },
  { lang: 'ta', re: /[஀-௿]/g },
  { lang: 'te', re: /[ఀ-౿]/g },
  { lang: 'kn', re: /[ಀ-೿]/g },
  { lang: 'ml', re: /[ഀ-ൿ]/g }
];

/** Detects the language from the script the message is written in. */
function detectLanguage(text) {
  const value = String(text || '');
  let best = { lang: 'en', count: 0 };
  for (const { lang, re } of SCRIPT_RANGES) {
    const count = (value.match(re) || []).length;
    if (count > best.count) best = { lang, count };
  }
  return best.count >= 2 ? best.lang : 'en';
}

/**
 * The script of the message wins when it is clearly an Indian language;
 * otherwise the language picked in the UI is used.
 */
function resolveLanguage(requested, text) {
  const detected = detectLanguage(text);
  if (detected !== 'en') return detected;
  return LANGUAGES[requested] ? requested : 'en';
}

// Fixed phrases used when no LLM is configured (offline mode).
const STRINGS = {
  en: {
    greeting: `Hello! 👋 I'm the **NIAT AI Admission Agent**.

I can answer verified questions about programs, eligibility, fees & scholarships, the NSAT exam, campus life and placements. I can also **act for you**: check your eligibility, register you for events, show your application status, book a counselling session, look up a pincode, or review your GitHub profile for the Young Innovator Scholarship.

What would you like to do?`,
    noMatch: `I do not have a verified official record about that in the **NIAT 2026 Admissions Handbook**. To avoid misinformation, please use the button below to talk to an admission counsellor.`,
    englishNote: '',
    eventsHeader: 'Upcoming events you can join:',
    noEvents: 'There are no upcoming published events right now.',
    registered: '✅ You are registered for "{title}". Ticket number: **{ticket}**',
    alreadyRegistered: 'You are already registered for "{title}". Ticket number: **{ticket}**',
    eventFull: 'Sorry, "{title}" is full.',
    eventNotFound: 'I could not find that event. Here are the upcoming events:',
    whichEvent: 'Which event should I register you for? Reply with the event ID, e.g. "register me for event 2".',
    counsellingRequested: '✅ Your counselling request is recorded. An admission counsellor will contact you within 24 hours.',
    statusHeader: 'Your application status:',
    eligibilityHeader: 'Eligibility check:',
    pincodeHeader: 'Pincode details (India Post):',
    pincodeNotFound: 'That pincode was not found. Please enter a valid 6-digit pincode.',
    githubHeader: 'GitHub profile review (Young Innovator Scholarship):',
    githubNotFound: 'That GitHub user was not found. Please check the username.',
    unavailable: 'That service is not reachable right now. Please try again in a little while.'
  },
  hi: {
    greeting: `नमस्ते! 👋 मैं **NIAT AI एडमिशन एजेंट** हूँ।

मैं प्रोग्राम, पात्रता, फीस और स्कॉलरशिप, NSAT परीक्षा, कैंपस और प्लेसमेंट के बारे में आधिकारिक जानकारी दे सकता हूँ। मैं आपके लिए **काम भी कर सकता हूँ**: पात्रता जाँचना, इवेंट में रजिस्टर करना, एप्लिकेशन की स्थिति दिखाना, काउंसलिंग बुक करना, पिनकोड खोजना या स्कॉलरशिप के लिए आपकी GitHub प्रोफ़ाइल देखना।

आप क्या करना चाहेंगे?`,
    noMatch: 'माफ़ कीजिए, इस सवाल की आधिकारिक जानकारी **NIAT 2026 एडमिशन हैंडबुक** में नहीं है। सही जानकारी के लिए नीचे दिए बटन से किसी एडमिशन काउंसलर से बात करें।',
    englishNote: '_नीचे दी गई जानकारी आधिकारिक अंग्रेज़ी हैंडबुक से है।_',
    eventsHeader: 'आप इन आने वाले इवेंट्स में शामिल हो सकते हैं:',
    noEvents: 'अभी कोई आने वाला इवेंट उपलब्ध नहीं है।',
    registered: '✅ आपका "{title}" के लिए रजिस्ट्रेशन हो गया है। टिकट नंबर: **{ticket}**',
    alreadyRegistered: 'आप "{title}" के लिए पहले से रजिस्टर्ड हैं। टिकट नंबर: **{ticket}**',
    eventFull: 'माफ़ कीजिए, "{title}" की सभी सीटें भर चुकी हैं।',
    eventNotFound: 'यह इवेंट नहीं मिला। आने वाले इवेंट्स ये हैं:',
    whichEvent: 'किस इवेंट के लिए रजिस्टर करना है? कृपया इवेंट का ID बताइए, जैसे "event 2 के लिए रजिस्टर करो"।',
    counsellingRequested: '✅ आपकी काउंसलिंग रिक्वेस्ट दर्ज हो गई है। एक एडमिशन काउंसलर 24 घंटे में आपसे संपर्क करेंगे।',
    statusHeader: 'आपके एप्लिकेशन की स्थिति:',
    eligibilityHeader: 'पात्रता जाँच का परिणाम:',
    pincodeHeader: 'पिनकोड की जानकारी (India Post):',
    pincodeNotFound: 'यह पिनकोड नहीं मिला। कृपया 6 अंकों का सही पिनकोड डालें।',
    githubHeader: 'GitHub प्रोफ़ाइल विश्लेषण (Young Innovator Scholarship):',
    githubNotFound: 'यह GitHub यूज़र नहीं मिला। कृपया यूज़रनेम जाँचें।',
    unavailable: 'यह सेवा अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर कोशिश करें।'
  },
  ta: {
    greeting: `வணக்கம்! 👋 நான் **NIAT AI சேர்க்கை முகவர்**.

படிப்புகள், தகுதி, கட்டணம் மற்றும் உதவித்தொகை, NSAT தேர்வு, வளாகம் மற்றும் வேலைவாய்ப்பு பற்றி அதிகாரப்பூர்வ தகவல் தருவேன். உங்களுக்காக **செயல்படவும் முடியும்**: தகுதியைச் சரிபார்த்தல், நிகழ்வுகளில் பதிவு செய்தல், விண்ணப்ப நிலையைக் காட்டுதல், ஆலோசனை முன்பதிவு, அஞ்சல் குறியீடு தேடல், உதவித்தொகைக்காக உங்கள் GitHub சுயவிவரத்தை ஆய்வு செய்தல்.

நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?`,
    noMatch: 'மன்னிக்கவும், இந்தக் கேள்விக்கான அதிகாரப்பூர்வ தகவல் **NIAT 2026 சேர்க்கை கையேட்டில்** இல்லை. சரியான வழிகாட்டுதலுக்கு கீழே உள்ள பொத்தானைப் பயன்படுத்தி ஒரு சேர்க்கை ஆலோசகருடன் பேசுங்கள்.',
    englishNote: '_கீழே உள்ள விவரங்கள் அதிகாரப்பூர்வ ஆங்கிலக் கையேட்டிலிருந்து எடுக்கப்பட்டவை._',
    eventsHeader: 'நீங்கள் கலந்துகொள்ளக்கூடிய வரவிருக்கும் நிகழ்வுகள்:',
    noEvents: 'தற்போது வரவிருக்கும் நிகழ்வுகள் எதுவும் இல்லை.',
    registered: '✅ "{title}" நிகழ்வுக்கு நீங்கள் பதிவு செய்யப்பட்டுள்ளீர்கள். டிக்கெட் எண்: **{ticket}**',
    alreadyRegistered: '"{title}" நிகழ்வுக்கு நீங்கள் ஏற்கனவே பதிவு செய்துள்ளீர்கள். டிக்கெட் எண்: **{ticket}**',
    eventFull: 'மன்னிக்கவும், "{title}" நிகழ்வின் இடங்கள் நிரம்பிவிட்டன.',
    eventNotFound: 'அந்த நிகழ்வு கிடைக்கவில்லை. வரவிருக்கும் நிகழ்வுகள் இதோ:',
    whichEvent: 'எந்த நிகழ்வுக்குப் பதிவு செய்ய வேண்டும்? நிகழ்வு ID-ஐக் குறிப்பிடுங்கள், உதா. "event 2-க்கு பதிவு செய்".',
    counsellingRequested: '✅ உங்கள் ஆலோசனை கோரிக்கை பதிவு செய்யப்பட்டது. ஒரு சேர்க்கை ஆலோசகர் 24 மணி நேரத்திற்குள் உங்களைத் தொடர்புகொள்வார்.',
    statusHeader: 'உங்கள் விண்ணப்ப நிலை:',
    eligibilityHeader: 'தகுதி சரிபார்ப்பு முடிவு:',
    pincodeHeader: 'அஞ்சல் குறியீட்டு விவரங்கள் (India Post):',
    pincodeNotFound: 'இந்த அஞ்சல் குறியீடு கிடைக்கவில்லை. சரியான 6 இலக்க குறியீட்டை உள்ளிடவும்.',
    githubHeader: 'GitHub சுயவிவர பகுப்பாய்வு (Young Innovator Scholarship):',
    githubNotFound: 'அந்த GitHub பயனர் கிடைக்கவில்லை. பயனர்பெயரைச் சரிபார்க்கவும்.',
    unavailable: 'இந்தச் சேவை தற்போது கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
  },
  te: {
    greeting: `నమస్కారం! 👋 నేను **NIAT AI అడ్మిషన్ ఏజెంట్**.

కోర్సులు, అర్హత, ఫీజులు మరియు స్కాలర్‌షిప్‌లు, NSAT పరీక్ష, క్యాంపస్ మరియు ప్లేస్‌మెంట్ల గురించి అధికారిక సమాచారం ఇస్తాను. మీ కోసం **పనులు కూడా చేయగలను**: అర్హత తనిఖీ, ఈవెంట్‌లలో నమోదు, దరఖాస్తు స్థితి, కౌన్సెలింగ్ బుకింగ్, పిన్‌కోడ్ వివరాలు, స్కాలర్‌షిప్ కోసం మీ GitHub ప్రొఫైల్ విశ్లేషణ.

మీరు ఏమి చేయాలనుకుంటున్నారు?`,
    noMatch: 'క్షమించండి, ఈ ప్రశ్నకు సంబంధించిన అధికారిక సమాచారం **NIAT 2026 అడ్మిషన్ హ్యాండ్‌బుక్‌లో** లేదు. సరైన మార్గదర్శకత్వం కోసం కింద ఉన్న బటన్ ద్వారా అడ్మిషన్ కౌన్సెలర్‌తో మాట్లాడండి.',
    englishNote: '_కింది వివరాలు అధికారిక ఇంగ్లీష్ హ్యాండ్‌బుక్ నుండి తీసుకున్నవి._',
    eventsHeader: 'మీరు పాల్గొనగల రాబోయే ఈవెంట్‌లు:',
    noEvents: 'ప్రస్తుతం రాబోయే ఈవెంట్‌లు ఏవీ లేవు.',
    registered: '✅ "{title}" ఈవెంట్‌కు మీ నమోదు పూర్తయింది. టికెట్ నంబర్: **{ticket}**',
    alreadyRegistered: 'మీరు ఇప్పటికే "{title}" ఈవెంట్‌కు నమోదు చేసుకున్నారు. టికెట్ నంబర్: **{ticket}**',
    eventFull: 'క్షమించండి, "{title}" ఈవెంట్ సీట్లు నిండిపోయాయి.',
    eventNotFound: 'ఆ ఈవెంట్ కనుగొనబడలేదు. రాబోయే ఈవెంట్‌లు ఇవి:',
    whichEvent: 'ఏ ఈవెంట్‌కు నమోదు చేయాలి? దయచేసి ఈవెంట్ ID చెప్పండి, ఉదా. "event 2 కి రిజిస్టర్ చేయి".',
    counsellingRequested: '✅ మీ కౌన్సెలింగ్ అభ్యర్థన నమోదైంది. ఒక అడ్మిషన్ కౌన్సెలర్ 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తారు.',
    statusHeader: 'మీ దరఖాస్తు స్థితి:',
    eligibilityHeader: 'అర్హత పరిశీలన ఫలితం:',
    pincodeHeader: 'పిన్‌కోడ్ వివరాలు (India Post):',
    pincodeNotFound: 'ఈ పిన్‌కోడ్ కనుగొనబడలేదు. దయచేసి సరైన 6 అంకెల పిన్‌కోడ్ ఇవ్వండి.',
    githubHeader: 'GitHub ప్రొఫైల్ విశ్లేషణ (Young Innovator Scholarship):',
    githubNotFound: 'ఆ GitHub యూజర్ కనుగొనబడలేదు. దయచేసి యూజర్‌నేమ్ తనిఖీ చేయండి.',
    unavailable: 'ఈ సేవ ప్రస్తుతం అందుబాటులో లేదు. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.'
  },
  kn: {
    greeting: `ನಮಸ್ಕಾರ! 👋 ನಾನು **NIAT AI ಪ್ರವೇಶ ಏಜೆಂಟ್**.

ಕೋರ್ಸ್‌ಗಳು, ಅರ್ಹತೆ, ಶುಲ್ಕ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ, NSAT ಪರೀಕ್ಷೆ, ಕ್ಯಾಂಪಸ್ ಮತ್ತು ಉದ್ಯೋಗಾವಕಾಶಗಳ ಬಗ್ಗೆ ಅಧಿಕೃತ ಮಾಹಿತಿ ನೀಡುತ್ತೇನೆ. ನಿಮಗಾಗಿ **ಕೆಲಸವನ್ನೂ ಮಾಡಬಲ್ಲೆ**: ಅರ್ಹತೆ ಪರಿಶೀಲನೆ, ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ನೋಂದಣಿ, ಅರ್ಜಿಯ ಸ್ಥಿತಿ, ಸಮಾಲೋಚನೆ ಬುಕಿಂಗ್, ಪಿನ್‌ಕೋಡ್ ಹುಡುಕಾಟ, ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕಾಗಿ ನಿಮ್ಮ GitHub ಪ್ರೊಫೈಲ್ ವಿಶ್ಲೇಷಣೆ.

ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?`,
    noMatch: 'ಕ್ಷಮಿಸಿ, ಈ ಪ್ರಶ್ನೆಗೆ ಅಧಿಕೃತ ಮಾಹಿತಿ **NIAT 2026 ಪ್ರವೇಶ ಕೈಪಿಡಿಯಲ್ಲಿ** ಇಲ್ಲ. ಸರಿಯಾದ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಕೆಳಗಿನ ಬಟನ್ ಬಳಸಿ ಪ್ರವೇಶ ಸಲಹೆಗಾರರೊಂದಿಗೆ ಮಾತನಾಡಿ.',
    englishNote: '_ಕೆಳಗಿನ ವಿವರಗಳು ಅಧಿಕೃತ ಇಂಗ್ಲಿಷ್ ಕೈಪಿಡಿಯಿಂದ ಪಡೆದವು._',
    eventsHeader: 'ನೀವು ಭಾಗವಹಿಸಬಹುದಾದ ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು:',
    noEvents: 'ಸದ್ಯಕ್ಕೆ ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು ಇಲ್ಲ.',
    registered: '✅ "{title}" ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ನಿಮ್ಮ ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ. ಟಿಕೆಟ್ ಸಂಖ್ಯೆ: **{ticket}**',
    alreadyRegistered: 'ನೀವು ಈಗಾಗಲೇ "{title}" ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ನೋಂದಾಯಿಸಿದ್ದೀರಿ. ಟಿಕೆಟ್ ಸಂಖ್ಯೆ: **{ticket}**',
    eventFull: 'ಕ್ಷಮಿಸಿ, "{title}" ಕಾರ್ಯಕ್ರಮದ ಸೀಟುಗಳು ಭರ್ತಿಯಾಗಿವೆ.',
    eventNotFound: 'ಆ ಕಾರ್ಯಕ್ರಮ ಕಂಡುಬಂದಿಲ್ಲ. ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು ಇಲ್ಲಿವೆ:',
    whichEvent: 'ಯಾವ ಕಾರ್ಯಕ್ರಮಕ್ಕೆ ನೋಂದಾಯಿಸಬೇಕು? ದಯವಿಟ್ಟು ಕಾರ್ಯಕ್ರಮದ ID ತಿಳಿಸಿ, ಉದಾ. "event 2 ಗೆ ನೋಂದಾಯಿಸಿ".',
    counsellingRequested: '✅ ನಿಮ್ಮ ಸಮಾಲೋಚನೆ ವಿನಂತಿ ದಾಖಲಾಗಿದೆ. ಪ್ರವೇಶ ಸಲಹೆಗಾರರು 24 ಗಂಟೆಗಳ ಒಳಗೆ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.',
    statusHeader: 'ನಿಮ್ಮ ಅರ್ಜಿಯ ಸ್ಥಿತಿ:',
    eligibilityHeader: 'ಅರ್ಹತೆ ಪರಿಶೀಲನೆಯ ಫಲಿತಾಂಶ:',
    pincodeHeader: 'ಪಿನ್‌ಕೋಡ್ ವಿವರಗಳು (India Post):',
    pincodeNotFound: 'ಈ ಪಿನ್‌ಕೋಡ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಸರಿಯಾದ 6 ಅಂಕಿಗಳ ಪಿನ್‌ಕೋಡ್ ನಮೂದಿಸಿ.',
    githubHeader: 'GitHub ಪ್ರೊಫೈಲ್ ವಿಶ್ಲೇಷಣೆ (Young Innovator Scholarship):',
    githubNotFound: 'ಆ GitHub ಬಳಕೆದಾರ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಬಳಕೆದಾರ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ.',
    unavailable: 'ಈ ಸೇವೆ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
  },
  ml: {
    greeting: `നമസ്കാരം! 👋 ഞാൻ **NIAT AI അഡ്മിഷൻ ഏജന്റ്** ആണ്.

കോഴ്സുകൾ, യോഗ്യത, ഫീസ്, സ്കോളർഷിപ്പ്, NSAT പരീക്ഷ, ക്യാമ്പസ്, പ്ലേസ്മെന്റ് എന്നിവയെക്കുറിച്ച് ഔദ്യോഗിക വിവരങ്ങൾ നൽകാം. നിങ്ങൾക്കായി **കാര്യങ്ങൾ ചെയ്യാനും കഴിയും**: യോഗ്യത പരിശോധന, പരിപാടികളിൽ രജിസ്ട്രേഷൻ, അപേക്ഷയുടെ നില, കൗൺസിലിംഗ് ബുക്കിംഗ്, പിൻകോഡ് തിരയൽ, സ്കോളർഷിപ്പിനായി നിങ്ങളുടെ GitHub പ്രൊഫൈൽ വിശകലനം.

നിങ്ങൾക്ക് എന്താണ് ചെയ്യേണ്ടത്?`,
    noMatch: 'ക്ഷമിക്കണം, ഈ ചോദ്യത്തിനുള്ള ഔദ്യോഗിക വിവരം **NIAT 2026 അഡ്മിഷൻ ഹാൻഡ്‌ബുക്കിൽ** ഇല്ല. ശരിയായ മാർഗനിർദേശത്തിനായി താഴെയുള്ള ബട്ടൺ ഉപയോഗിച്ച് ഒരു അഡ്മിഷൻ കൗൺസിലറുമായി സംസാരിക്കുക.',
    englishNote: '_താഴെയുള്ള വിവരങ്ങൾ ഔദ്യോഗിക ഇംഗ്ലീഷ് ഹാൻഡ്‌ബുക്കിൽ നിന്നുള്ളതാണ്._',
    eventsHeader: 'നിങ്ങൾക്ക് പങ്കെടുക്കാവുന്ന വരാനിരിക്കുന്ന പരിപാടികൾ:',
    noEvents: 'ഇപ്പോൾ വരാനിരിക്കുന്ന പരിപാടികളൊന്നുമില്ല.',
    registered: '✅ "{title}" പരിപാടിക്കുള്ള നിങ്ങളുടെ രജിസ്ട്രേഷൻ പൂർത്തിയായി. ടിക്കറ്റ് നമ്പർ: **{ticket}**',
    alreadyRegistered: 'നിങ്ങൾ ഇതിനകം "{title}" പരിപാടിക്ക് രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. ടിക്കറ്റ് നമ്പർ: **{ticket}**',
    eventFull: 'ക്ഷമിക്കണം, "{title}" പരിപാടിയുടെ സീറ്റുകൾ നിറഞ്ഞു.',
    eventNotFound: 'ആ പരിപാടി കണ്ടെത്താനായില്ല. വരാനിരിക്കുന്ന പരിപാടികൾ ഇതാ:',
    whichEvent: 'ഏത് പരിപാടിക്കാണ് രജിസ്റ്റർ ചെയ്യേണ്ടത്? ദയവായി പരിപാടിയുടെ ID പറയുക, ഉദാ. "event 2 ന് രജിസ്റ്റർ ചെയ്യുക".',
    counsellingRequested: '✅ നിങ്ങളുടെ കൗൺസിലിംഗ് അഭ്യർത്ഥന രേഖപ്പെടുത്തി. ഒരു അഡ്മിഷൻ കൗൺസിലർ 24 മണിക്കൂറിനുള്ളിൽ നിങ്ങളെ ബന്ധപ്പെടും.',
    statusHeader: 'നിങ്ങളുടെ അപേക്ഷയുടെ നില:',
    eligibilityHeader: 'യോഗ്യതാ പരിശോധനാ ഫലം:',
    pincodeHeader: 'പിൻകോഡ് വിവരങ്ങൾ (India Post):',
    pincodeNotFound: 'ഈ പിൻകോഡ് കണ്ടെത്താനായില്ല. ദയവായി ശരിയായ 6 അക്ക പിൻകോഡ് നൽകുക.',
    githubHeader: 'GitHub പ്രൊഫൈൽ വിശകലനം (Young Innovator Scholarship):',
    githubNotFound: 'ആ GitHub ഉപയോക്താവിനെ കണ്ടെത്താനായില്ല. ദയവായി ഉപയോക്തൃനാമം പരിശോധിക്കുക.',
    unavailable: 'ഈ സേവനം ഇപ്പോൾ ലഭ്യമല്ല. കുറച്ച് സമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കുക.'
  }
};

function t(lang, key, vars = {}) {
  const table = STRINGS[lang] || STRINGS.en;
  const template = table[key] ?? STRINGS.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`));
}

// Native-script words mapped to concepts, so offline retrieval and intent
// detection work for questions typed in Indian languages.
const CONCEPTS = {
  fee: { en: 'fee tuition cost', words: ['फीस', 'शुल्क', 'கட்டண', 'ఫీజు', 'రుసుము', 'ಶುಲ್ಕ', 'ಫೀಸ', 'ഫീസ'] },
  hostel: { en: 'hostel accommodation', words: ['हॉस्टल', 'छात्रावास', 'விடுதி', 'హాస్టల్', 'వసతి', 'ಹಾಸ್ಟೆಲ್', 'ವಸತಿ', 'ഹോസ്റ്റൽ', 'താമസ'] },
  scholarship: { en: 'scholarship waiver', words: ['छात्रवृत्ति', 'स्कॉलरशिप', 'உதவித்தொகை', 'ஸ்காலர்ஷிப்', 'స్కాలర్‌షిప్', 'ఉపకార', 'ವಿದ್ಯಾರ್ಥಿವೇತನ', 'ಸ್ಕಾಲರ್‌ಶಿಪ', 'സ്കോളർഷിപ്പ'] },
  placement: { en: 'placement career', words: ['प्लेसमेंट', 'नौकरी', 'வேலைவாய்ப்பு', 'பிளேஸ்மென்ட்', 'ప్లేస్‌మెంట్', 'ఉద్యోగ', 'ಉದ್ಯೋಗ', 'ಪ್ಲೇಸ್‌ಮೆಂಟ್', 'പ്ലേസ്മെന്റ്', 'ജോലി'] },
  eligibility: { en: 'eligibility criteria', words: ['पात्र', 'योग्य', 'தகுதி', 'అర్హ', 'ಅರ್ಹ', 'യോഗ്യ'] },
  exam: { en: 'nsat exam syllabus', words: ['परीक्षा', 'தேர்வு', 'పరీక్ష', 'ಪರೀಕ್ಷೆ', 'പരീക്ഷ'] },
  admission: { en: 'application admission procedure', words: ['प्रवेश', 'दाखिला', 'एडमिशन', 'आवेदन', 'சேர்க்கை', 'விண்ணப்ப', 'ప్రవేశ', 'అడ్మిషన్', 'దరఖాస్తు', 'ಪ್ರವೇಶ', 'ಅರ್ಜಿ', 'പ്രവേശന', 'അഡ്മിഷൻ', 'അപേക്ഷ'] },
  program: { en: 'program curriculum', words: ['कोर्स', 'पाठ्यक्रम', 'படிப்பு', 'பாடநெறி', 'కోర్సు', 'ಕೋರ್ಸ್', 'കോഴ്സ്'] },
  campus: { en: 'campus facility', words: ['कैंपस', 'வளாக', 'క్యాంపస్', 'ಕ್ಯಾಂಪಸ್', 'ക്യാമ്പസ്'] },
  event: { en: 'event webinar', words: ['इवेंट', 'कार्यक्रम', 'वेबिनार', 'நிகழ்வு', 'வெபினார்', 'ఈవెంట్', 'కార్యక్రమ', 'వెబినార్', 'ಕಾರ್ಯಕ್ರಮ', 'ಈವೆಂಟ್', 'പരിപാടി', 'ഇവന്റ്'] },
  register: { en: 'register', words: ['रजिस्टर', 'पंजीकरण', 'பதிவு', 'నమోదు', 'రిజిస్టర్', 'ನೋಂದ', 'ರಿಜಿಸ್ಟರ್', 'രജിസ്റ്റർ'] },
  counselling: { en: 'counselling', words: ['काउंसलिंग', 'परामर्श', 'ஆலோசனை', 'కౌన్సెలింగ్', 'ಸಮಾಲೋಚನೆ', 'ಕೌನ್ಸೆಲಿಂಗ್', 'കൗൺസിലിംഗ്'] },
  status: { en: 'status', words: ['स्थिति', 'स्टेटस', 'நிலை', 'స్థితి', 'ಸ್ಥಿತಿ', 'നില'] },
  pincode: { en: 'pincode', words: ['पिन', 'பின்', 'పిన్', 'ಪಿನ್', 'പിൻ'] },
  greeting: { en: 'hello', words: ['नमस्ते', 'नमस्कार', 'हैलो', 'வணக்கம்', 'ஹலோ', 'నమస్కారం', 'నమస్తే', 'హలో', 'ನಮಸ್ಕಾರ', 'ಹಲೋ', 'നമസ്കാരം', 'ഹലോ'] }
};

function hasConcept(text, concept) {
  const value = String(text || '');
  return (CONCEPTS[concept]?.words || []).some(w => value.includes(w));
}

/** Adds English equivalents of native-script keywords so retrieval can match them. */
function expandQueryToEnglish(text) {
  const extra = Object.keys(CONCEPTS)
    .filter(c => c !== 'greeting' && hasConcept(text, c))
    .map(c => CONCEPTS[c].en);
  return extra.length ? `${text} ${extra.join(' ')}` : text;
}

/** True when the message is only a greeting in any supported language. */
function isNativeGreeting(text) {
  const stripped = String(text || '').replace(/[!.,?🙏👋\s]/gu, '');
  return stripped.length > 0 && stripped.length <= 20 && hasConcept(text, 'greeting') && detectLanguage(text) !== 'en';
}

module.exports = {
  LANGUAGES,
  STRINGS,
  detectLanguage,
  resolveLanguage,
  t,
  hasConcept,
  expandQueryToEnglish,
  isNativeGreeting
};

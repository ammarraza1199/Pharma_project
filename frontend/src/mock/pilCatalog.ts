import type { Product, PatientInstructionLeaflet, PILLanguage, PILVoiceClip } from '../types/pos';

export const SUPPORTED_PIL_LANGUAGES: {
  code: PILLanguage;
  label: string;
  nativeLabel: string;
  speechLocale: string;
  flag: string;
}[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', speechLocale: 'en-IN', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', speechLocale: 'hi-IN', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', speechLocale: 'te-IN', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', speechLocale: 'ta-IN', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', speechLocale: 'kn-IN', flag: '🇮🇳' },
];

export const PRESET_PIL_CATALOG: Record<string, PatientInstructionLeaflet> = {
  // ── 1. AUGMENTIN 625 (Amoxicillin + Clavulanate) ──────────────────────────
  'augmentin': {
    id: 'pil-augmentin-625',
    medicineName: 'Augmentin 625 Duo Tablet',
    brand: 'GlaxoSmithKline',
    saltComposition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    therapeuticCategory: 'Broad-Spectrum Antibiotic (Penicillin class)',
    scheduleCategory: 'SCHEDULE_H',
    dosageForm: 'Tablet (Oral)',
    indication: 'Bacterial infections of the respiratory tract, ear/nose/throat, urinary tract, skin and soft tissue.',
    howToTake: 'Swallow whole with a glass of water at the start of a meal to reduce gastrointestinal discomfort. Do not chew or crush.',
    timingRecommendation: 'Take exactly 1 tablet every 12 hours (twice daily) or as instructed by doctor.',
    foodInstructions: 'Always take at the beginning of a meal. Taking on an empty stomach may trigger nausea, vomiting, or stomach upset.',
    missedDoseAdvice: 'Take the missed dose as soon as you remember with food. If it is nearly time for your next scheduled dose, skip the missed one. Never take a double dose.',
    sideEffects: {
      common: [
        'Mild diarrhea or loose stools',
        'Nausea and indigestion',
        'Mild skin rash or itching',
        'Oral thrush or fungal overgrowth'
      ],
      severeAlerts: [
        'Severe allergic reaction (facial swelling, difficulty breathing)',
        'Severe watery or bloody diarrhea (Clostridioides difficile colitis)',
        'Yellowing of eyes or skin (hepatic jaundice)'
      ]
    },
    contraindications: [
      'Known severe allergy to Penicillin, Amoxicillin, or beta-lactam antibiotics',
      'History of Amoxicillin-associated jaundice or liver dysfunction',
      'Caution in patients with severe renal impairment'
    ],
    storageAdvice: 'Store in the original blister strip below 25°C in a dry place protected from direct heat and moisture.',
    disposalAdvice: 'Do not flush down household drain or sink. Return unused antibiotics to the pharmacy disposal bin.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: 'Hello. For Augmentin 625, take one tablet twice daily strictly at the beginning of your meal. Finish the full 5 to 7 days course even if you feel better. Drink plenty of water and do not skip doses.',
        keyInstructions: [
          'Take 1 tablet every 12 hours with meals',
          'Complete the full 5-7 days course',
          'Drink 2 to 3 liters of water daily',
          'Do not consume alcohol during antibiotic therapy'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: 'नमस्ते। ऑग्मेंटिन 625 की एक गोली दिन में दो बार, भोजन की शुरुआत में पानी के साथ लें। डॉक्टर द्वारा बताया गया पूरा कोर्स 5 से 7 दिन तक अवश्य पूरा करें। बीच में दवा बंद न करें।',
        keyInstructions: [
          'दिन में दो बार (सुबह और रात) खाने के साथ लें',
          'पूरा 5 से 7 दिन का कोर्स अवश्य पूरा करें',
          'खाली पेट न लें ताकि पेट दर्द न हो',
          'अधिक मात्रा में पानी पिएं'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: 'నమస్కారం. ఆగ్మెంటిన్ 625 మాత్రను ఉదయం మరియు రాత్రి భోజనం ప్రారంభంలో ఒక గ్లాసు నీటితో వేసుకోండి. డాక్టర్ సూచించిన 5 నుండి 7 రోజుల పూర్తి కోర్సును తప్పనిసరిగా పూర్తి చేయండి. ఖాళీ కడుపుతో తీసుకోకండి.',
        keyInstructions: [
          'రోజుకు రెండు సార్లు భోజనంతో పాటు వేసుకోవాలి',
          'డాక్టర్ చెప్పిన 5-7 రోజుల కోర్సు పూర్తి చేయాలి',
          'కడుపులో మంట రాకుండా ఖాళీ కడుపుతో వేసుకోకండి',
          'మంచి నీరు సమృద్ధిగా తాగండి'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: 'வணக்கம். ஆக்மென்டின் 625 மாத்திரையை காலை மற்றும் இரவு உணவின் தொடக்கத்தில் தண்ணீருடன் உட்கொள்ளவும். மருத்துவர் பரிந்துரைத்த 5 முதல் 7 நாட்கள் முழுமையான கால அளவை முடிக்கவும். வெறும் வயிற்றில் சாப்பிட வேண்டாம்.',
        keyInstructions: [
          'காலை மற்றும் இரவு உணவோடு ஒரு மாத்திரை',
          'முழு 5-7 நாட்கள் மாத்திரை உட்கொள்ளலை முடிக்கவும்',
          'வயிற்று உபாதையை தவிர்க்க உணவோடு எடுக்கவும்',
          'நிறைய தண்ணீர் குடிக்கவும்'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: 'ನಮಸ್ಕಾರ. ಆಗ್ಮೆಂಟಿನ್ 625 ಮಾತ್ರೆ ಊಟದ ಪ್ರಾರಂಭದಲ್ಲಿ ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. ವೈದ್ಯರು ಹೇಳಿದಂತೆ ಪೂರ್ಣ 5 ರಿಂದ 7 ದಿನಗಳ ಕೋರ್ಸ್ ಮುಗಿಸಿ. ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.',
        keyInstructions: [
          'ದಿನಕ್ಕೆ 2 ಬಾರಿ ಊಟದೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ',
          'ಪೂರ್ಣ ಕೋರ್ಸ್ ಮುಗಿಸುವುದು ಕಡ್ಡಾಯ',
          'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ',
          'ಹೆಚ್ಚು ನೀರು ಕುಡಿಯಿರಿ'
        ]
      }
    }
  },

  // ── 2. DOLO 650 / CROCIN (Paracetamol) ────────────────────────────────────
  'paracetamol': {
    id: 'pil-paracetamol-650',
    medicineName: 'Dolo 650 / Paracetamol Tablet',
    brand: 'Micro Labs / Haleon',
    saltComposition: 'Paracetamol 650mg',
    therapeuticCategory: 'Antipyretic & Mild-to-Moderate Analgesic',
    scheduleCategory: 'REGULAR',
    dosageForm: 'Tablet (Oral)',
    indication: 'Relief of mild to moderate fever, headaches, body aches, toothache, and post-vaccination discomfort.',
    howToTake: 'Take 1 tablet with a glass of water after food or as needed for fever. Maintain at least 4 to 6 hours interval between doses.',
    timingRecommendation: 'As needed for fever or pain every 6 to 8 hours. Do not exceed 4 tablets (2600mg) in 24 hours without medical supervision.',
    foodInstructions: 'May be taken with or without food. Taking after light meals reduces mild stomach discomfort.',
    missedDoseAdvice: 'Paracetamol is usually taken as needed for symptoms. If on a scheduled regimen, take when remembered unless close to the next dose.',
    sideEffects: {
      common: [
        'Well tolerated in standard doses',
        'Rare mild nausea or stomach distress',
        'Mild skin redness or sweating'
      ],
      severeAlerts: [
        'Acute liver toxicity from intentional or accidental overdose (>4g/day)',
        'Unexplained itching, hives, or breathing difficulty',
        'Dark urine or pale stools'
      ]
    },
    contraindications: [
      'Severe hepatic (liver) impairment or acute hepatitis',
      'Chronic active alcoholism',
      'Co-administration with other Paracetamol/Acetaminophen containing cold syrups'
    ],
    storageAdvice: 'Store below 30°C in a cool, dry place away from direct sunlight.',
    disposalAdvice: 'Dispose in dry pharmaceutical waste bin. Keep out of reach of children.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: 'For Dolo 650, take one tablet every 6 to 8 hours as needed for fever or pain. Do not exceed 4 tablets in 24 hours. Avoid consuming other paracetamol medicines or alcohol while taking this tablet.',
        keyInstructions: [
          'Take 1 tablet every 6 hours if fever exceeds 99°F',
          'Maximum 4 tablets per 24 hours',
          'Keep minimum 4 to 6 hours between doses',
          'Do not combine with other paracetamol cough syrups'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: 'डोलो 650 बुखार या बदन दर्द होने पर 6 से 8 घंटे के अंतराल पर एक गोली लें। 24 घंटे में 4 गोली से अधिक कभी न लें। शराब का सेवन न करें और अन्य पैरासिटामोल दवाओं के साथ न जोड़ें।',
        keyInstructions: [
          'बुखार होने पर 6 से 8 घंटे में एक गोली लें',
          '24 घंटे में अधिकतम 4 गोली ही लें',
          'दो खुराकों के बीच 4 से 6 घंटे का अंतर रखें',
          'शराब का सेवन बिल्कुल न करें'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: 'డోలో 650 జ్వరం లేదా ఒళ్ళు నొప్పులు ఉన్నప్పుడు 6 నుండి 8 గంటల వ్యవధిలో ఒక మాత్ర వేసుకోండి. 24 గంటల్లో 4 మాత్రల కంటే ఎక్కువ ఎట్టిపరిస్థితుల్లో తీసుకోకండి. మద్యపానం చేయవద్దు.',
        keyInstructions: [
          'జ్వరం లేదా నొప్పులకు 6 గంటల వ్యవధిలో 1 మాత్ర',
          'రోజుకు గరిష్టంగా 4 మాత్రలు మాత్రమే',
          'ఖాళీ కడుపుతో కాకుండా కొద్దిగా తిన్నాక వేసుకోండి',
          'ఇతర పారాసిటమాల్ సిరప్‌లతో కలపవద్దు'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: 'டோலோ 650 காய்ச்சல் அல்லது உடல் வலிக்கு 6 முதல் 8 மணி நேரத்திற்கு ஒரு மாத்திரை உட்கொள்ளவும். 24 மணி நேரத்தில் 4 மாத்திரைகளுக்கு மேல் எடுக்க வேண்டாம்.',
        keyInstructions: [
          'காய்ச்சல் இருக்கும்போது 6 மணி நேரத்திற்கு ஒரு முறை',
          'ஒரு நாளில் 4 மாத்திரைகளுக்கு மேல் வேண்டாம்',
          'மது அருந்துவதை தவிர்க்கவும்',
          'பிற பாராசிட்டமால் மருந்துகளுடன் சேர்க்க வேண்டாம்'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: 'ಡೋಲೋ 650 ಜ್ವರ ಅಥವಾ ಮೈಕೈ ನೋವಿದ್ದಾಗ 6 ರಿಂದ 8 ಗಂಟೆಗಳ ಅಂತರದಲ್ಲಿ ಒಂದು ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಿ. 24 ಗಂಟೆಗಳಲ್ಲಿ 4 ಕ್ಕಿಂತ ಹೆಚ್ಚು ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.',
        keyInstructions: [
          'ಜ್ವರಕ್ಕೆ 6 ರಿಂದ 8 ಗಂಟೆಗಳಿಗೊಮ್ಮೆ 1 ಮಾತ್ರೆ',
          'ದಿನಕ್ಕೆ ಗರಿಷ್ಠ 4 ಮಾತ್ರೆಗಳು ಮಾತ್ರ',
          'ಮದ್ಯ ಸೇವಿಸಬೇಡಿ',
          'ಇತರ ಪ್ಯಾರಸಿಟಮಾಲ್ ಔಷಧಗಳ ಜೊತೆ ಬೆರೆಸಬೇಡಿ'
        ]
      }
    }
  },

  // ── 3. GLYCOMET 500 / METFORMIN ──────────────────────────────────────────
  'metformin': {
    id: 'pil-metformin-500',
    medicineName: 'Glycomet 500 SR / Metformin Tablet',
    brand: 'USV Pvt Ltd',
    saltComposition: 'Metformin Hydrochloride 500mg (Sustained Release)',
    therapeuticCategory: 'Oral Antidiabetic Agent (Biguanide class)',
    scheduleCategory: 'SCHEDULE_H',
    dosageForm: 'Sustained Release Tablet',
    indication: 'Management of Type 2 Diabetes Mellitus to improve glycemic control and reduce insulin resistance.',
    howToTake: 'Swallow whole with water during or immediately after meals. Do not chew, break, or crush the sustained-release tablet.',
    timingRecommendation: 'Usually once or twice daily with breakfast and dinner as prescribed.',
    foodInstructions: 'Always take with food to minimize stomach cramps, bloating, metallic taste, or diarrhea.',
    missedDoseAdvice: 'Take with your next meal if remembered. If near your next dose, skip the missed one. Do not take extra medicine to compensate.',
    sideEffects: {
      common: [
        'Stomach bloating or indigestion',
        'Temporary metallic taste in mouth',
        'Mild diarrhea during the first 2 weeks of therapy',
        'Loss of appetite'
      ],
      severeAlerts: [
        'Lactic Acidosis (rare but serious: muscle cramps, severe fatigue, rapid breathing)',
        'Severe hypoglycemia if combined with Sulfonylureas or fasting',
        'Vitamin B12 deficiency during prolonged multi-year therapy'
      ]
    },
    contraindications: [
      'Severe kidney impairment (eGFR < 30 mL/min)',
      'Acute metabolic acidosis or diabetic ketoacidosis',
      'Heavy alcohol consumption or severe liver disease',
      'Hold 48 hours prior to and after iodinated radiocontrast imaging'
    ],
    storageAdvice: 'Store below 25°C in a dry location away from moisture and direct light.',
    disposalAdvice: 'Dispose safely in pharmacy return boxes.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: 'For Glycomet 500 SR, take one tablet strictly with or right after your meal. Do not crush or chew this sustained-release tablet. Monitor your blood sugar levels regularly and do not skip meals.',
        keyInstructions: [
          'Take with or immediately after meals',
          'Swallow whole; do not break or chew',
          'Log your fasting & post-meal blood sugar weekly',
          'Stay hydrated and avoid heavy alcohol intake'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: 'ग्लाइकोमेट 500 एसआर की गोली हमेशा खाने के साथ या खाने के तुरंत बाद पानी से लें। इस गोली को तोड़ें या चबाएं नहीं। अपनी ब्लड शुगर की नियमित जांच करें और भोजन कभी न छोड़ें।',
        keyInstructions: [
          'हमेशा भोजन के साथ या तुरंत बाद लें',
          'गोली को चबाएं या तोड़ें नहीं, पूरी निगलें',
          'नियमित रूप से ब्लड शुगर मापें',
          'खाली पेट न रहें ताकि चक्कर न आए'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: 'గ్లైకోమెట్ 500 ఎస్ఆర్ మాత్రను భోజనంతో పాటు లేదా భోజనం చేసిన వెంటనే వేసుకోవాలి. మాత్రను నమలడం లేదా ముక్కలు చేయడం చేయరాదు. రక్తంలో షుగర్ లెవల్స్‌ను తరచుగా పరీక్షించుకోండి.',
        keyInstructions: [
          'భోజనంతో పాటు మాత్రమే వేసుకోవాలి',
          'మాత్రను నమలకుండా పూర్తిగా మింగాలి',
          'షుగర్ టెస్ట్ క్రమం తప్పకుండా చేయించుకోవాలి',
          'భోజనం స్కిప్ చేయరాదు'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: 'கிளைகோமெட் 500 எஸ்ஆர் மாத்திரையை எப்போதும் உணவோடு அல்லது சாப்பிட்ட உடனேயே எடுத்துக் கொள்ளவும். மாத்திரையை உடைக்கவோ மெல்லவோ கூடாது. ரத்த சர்க்கரை அளவை தவறாமல் பரிசோதிக்கவும்.',
        keyInstructions: [
          'உணவோடு அல்லது சாப்பிட்ட உடனே எடுக்கவும்',
          'மாத்திரையை உடைக்காமல் முழுதாக விழுங்கவும்',
          'வாரம் ஒருமுறை ரத்த சர்க்கரை சரிபார்க்கவும்',
          'சாப்பாட்டை தவிர்க்க வேண்டாம்'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: 'ಗ್ಲೈಕೊಮೆಟ್ 500 ಎಸ್ಆರ್ ಮಾತ್ರೆಯನ್ನು ಊಟದ ಜೊತೆಗೆ ಅಥವಾ ಊಟವಾದ ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ. ಮಾತ್ರೆಯನ್ನು ಅಗಿಯಬೇಡಿ. ನಿಯಮಿತವಾಗಿ ರಕ್ತದ ಸಕ್ಕರೆ ಪ್ರಮಾಣವನ್ನು ಪರೀಕ್ಷಿಸಿ.',
        keyInstructions: [
          'ಊಟದ ಜೊತೆಗೆ ಮಾತ್ರ ತೆಗೆದುಕೊಳ್ಳಿ',
          'ಮಾತ್ರೆಯನ್ನು ಮುರಿಯದೆ ನುಂಗಿರಿ',
          'ನಿಯಮಿತ ಶುಗರ್ ಟೆಸ್ಟ್ ಮಾಡಿಸಿಕೊಳ್ಳಿ',
          'ಊಟವನ್ನು ಬಿಡಬೇಡಿ'
        ]
      }
    }
  },

  // ── 4. TELMA 40 (Telmisartan) ────────────────────────────────────────────
  'telmisartan': {
    id: 'pil-telmisartan-40',
    medicineName: 'Telma 40 / Telmisartan Tablet',
    brand: 'Glenmark Pharmaceuticals',
    saltComposition: 'Telmisartan 40mg',
    therapeuticCategory: 'Antihypertensive (Angiotensin II Receptor Blocker)',
    scheduleCategory: 'SCHEDULE_H',
    dosageForm: 'Tablet (Oral)',
    indication: 'Essential hypertension (high blood pressure) and reduction of cardiovascular risk in adults.',
    howToTake: 'Take 1 tablet daily at the same time every morning with water, with or without food.',
    timingRecommendation: 'Once daily, ideally in the morning around 8:00 AM.',
    foodInstructions: 'Can be taken before or after meals. Maintain consistent daily timing.',
    missedDoseAdvice: 'Take it as soon as remembered on that day. If forgotten until the next day, take only your normal single dose. Never double up.',
    sideEffects: {
      common: [
        'Mild postural dizziness when standing up quickly',
        'Sinus congestion or upper respiratory symptoms',
        'Mild back pain or fatigue'
      ],
      severeAlerts: [
        'Marked hypotension (fainting or severe lightheadedness)',
        'Hyperkalemia (high potassium levels; abnormal heart rhythm)',
        'Angioedema (swelling of lips, face, throat) - seek immediate emergency care'
      ]
    },
    contraindications: [
      'Pregnancy & Lactation (black box warning: can cause fetal harm)',
      'Severe biliary obstructive disorders or severe hepatic impairment',
      'Concomitant use with Aliskiren in diabetic patients'
    ],
    storageAdvice: 'Store below 30°C in blister packaging. Protect from moisture as Telmisartan is hygroscopic.',
    disposalAdvice: 'Dispose in pharmacy take-back collection.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: 'For Telma 40, take one tablet daily in the morning at the same time with water. Stand up slowly from sitting or lying down to prevent dizziness. Do not take potassium supplements without consulting your doctor.',
        keyInstructions: [
          'Take 1 tablet every morning at a fixed time',
          'Stand up slowly to prevent posture dizziness',
          'Check blood pressure at least once weekly',
          'Strictly contraindicated during pregnancy'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: 'टेल्मा 40 की एक गोली रोज़ सुबह एक ही समय पर पानी के साथ लें। अचानक उठने पर चक्कर आ सकते हैं, इसलिए धीरे-धीरे उठें। डॉक्टर की सलाह के बिना यह दवा कभी बंद न करें।',
        keyInstructions: [
          'रोज़ सुबह एक निश्चित समय पर 1 गोली लें',
          'अचानक बिस्तर या कुर्सी से तेजी से न उठें',
          'नियमित बीपी जांच करवाते रहें',
          'गर्भावस्था में इस दवा का उपयोग बिल्कुल न करें'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: 'టెల్మా 40 మాత్రను ప్రతిరోజు ఉదయం ఒకే సమయానికి నీటితో వేసుకోవాలి. కూర్చుని లేదా పడుకుని ఒక్కసారిగా వేగంగా లేవకండి, కళ్ళు తిరిగే అవకాశం ఉంది. క్రమం తప్పకుండా బీపీ చెక్ చేసుకోండి.',
        keyInstructions: [
          'ప్రతిరోజూ ఉదయం ఒకే సమయానికి వేసుకోవాలి',
          'తలతిరగడం రాకుండా నెమ్మదిగా లేవండి',
          'వారంకోసారి బీపీ రికార్డ్ చేసుకోండి',
          'గర్భిణీ స్త్రీలు ఈ మందు వాడకూడదు'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: 'டெல்மா 40 மாத்திரையை தினமும் காலையில் ஒரே நேரத்தில் தண்ணீருடன் உட்கொள்ளவும். உட்கார்ந்த நிலையிலிருந்து திடீரென எழுந்திருக்க வேண்டாம், மயக்கம் வரலாம். உங்கள் ரத்த அழுத்தத்தை தவறாமல் அளவிடவும்.',
        keyInstructions: [
          'தினமும் காலையில் ஒரே நேரத்தில் எடுக்கவும்',
          'மயக்கம் வராமல் இருக்க மெதுவாக எழுந்திருக்கவும்',
          'வாரந்தோறும் ரத்த அழுத்தம் சரிபார்க்கவும்',
          'கர்ப்பிணிகள் இதை உட்கொள்ளக்கூடாது'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: 'ಟೆಲ್ಮಾ 40 ಮಾತ್ರೆಯನ್ನು ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಒಂದೇ ಸಮಯಕ್ಕೆ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. ಕುಳಿತಲ್ಲಿಂದ ಅಥವಾ ಮಲಗಿದಲ್ಲಿಂದ ಥಟ್ಟನೆ ಎದ್ದೇಳಬೇಡಿ. ಬಿಪಿ ನಿಯಮಿತವಾಗಿ ತಪಾಸಣೆ ಮಾಡಿಸಿ.',
        keyInstructions: [
          'ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಒಂದೇ ಸಮಯಕ್ಕೆ 1 ಮಾತ್ರೆ',
          'ತಲೆತಿರುಗುವಿಕೆ ತಪ್ಪಿಸಲು ನಿಧಾನವಾಗಿ ಎದ್ದೇಳಿ',
          'ವಾರಕ್ಕೊಮ್ಮೆ ಬಿಪಿ ಪರೀಕ್ಷಿಸಿ',
          'ಗರ್ಭಿಣಿಯರು ಈ ಔಷಧ ಸೇವಿಸಬಾರದು'
        ]
      }
    }
  },

  // ── 5. PANTOCID 40 (Pantoprazole) ─────────────────────────────────────────
  'pantoprazole': {
    id: 'pil-pantoprazole-40',
    medicineName: 'Pantocid 40 / Pantoprazole Tablet',
    brand: 'Sun Pharma',
    saltComposition: 'Pantoprazole Sodium 40mg (Gastro-resistant)',
    therapeuticCategory: 'Proton Pump Inhibitor (PPI / Antacid)',
    scheduleCategory: 'SCHEDULE_H',
    dosageForm: 'Enteric Coated Tablet',
    indication: 'Gastroesophageal Reflux Disease (GERD), heartburn, acidity, and peptic ulcer prophylaxis.',
    howToTake: 'Swallow whole with water 30 to 60 minutes BEFORE breakfast. Do not chew or split the enteric coating.',
    timingRecommendation: 'Once daily in the morning on an empty stomach.',
    foodInstructions: 'Must be taken on an empty stomach at least 30 minutes before consuming morning food or tea/coffee.',
    missedDoseAdvice: 'Take before your next meal if forgotten in the morning. Do not take double doses.',
    sideEffects: {
      common: [
        'Mild headache',
        'Flatulence or mild diarrhea',
        'Abdominal discomfort'
      ],
      severeAlerts: [
        'Hypomagnesemia or bone fracture risk with long-term uninterrupted multi-year use',
        'Persistent diarrhea with fever',
        'Severe allergic skin rash'
      ]
    },
    contraindications: [
      'Hypersensitivity to Pantoprazole or substituted benzimidazoles',
      'Co-administration with Atazanavir / Nelfinavir',
      'Avoid long-term usage without clinical review'
    ],
    storageAdvice: 'Store below 25°C protected from moisture.',
    disposalAdvice: 'Dispose in dry pharmaceutical waste bin.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: 'For Pantocid 40, take one tablet in the morning on an empty stomach, at least 30 minutes before your breakfast or morning tea. Swallow the tablet whole without chewing.',
        keyInstructions: [
          'Take 30 to 60 minutes before breakfast',
          'Must be taken on an empty stomach',
          'Swallow whole; do not chew or crush',
          'Avoid spicy, fried foods and late night dinners'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: 'पेंटोसिड 40 की गोली सुबह खाली पेट, नाश्ते या चाय से कम से कम 30 मिनट पहले पानी के साथ लें। इस गोली को चबाएं नहीं, पूरी निगलें।',
        keyInstructions: [
          'सुबह खाली पेट नाश्ते से 30 मिनट पहले लें',
          'गोली को चबाएं नहीं, पानी से निगलें',
          'तला-भुना और अधिक तीखा खाना खाने से बचें',
          'रात का भोजन सोने से 2 घंटे पहले करें'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: 'పాంటోసిడ్ 40 మాత్రను ఉదయం టిఫిన్ లేదా టీ తాగడానికి కనీసం 30 నిమిషాల ముందు పరగడుపున నీటితో మింగాలి. మాత్రను నమలరాదు.',
        keyInstructions: [
          'ఉదయం ఖాళీ కడుపుతో టిఫిన్‌కు 30 నిమిషాల ముందు',
          'మాత్రను నమలకుండా మింగాలి',
          'కారంగా ఉండే మరియు వేయించిన ఆహారాలు తగ్గించండి',
          'రాత్రి నిద్రించే 2 గంటల ముందే భోజనం చేయండి'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: 'பான்டோசிட் 40 மாத்திரையை காலையில் காலை உணவுக்கு குறைந்தது 30 நிமிடங்களுக்கு முன் வெறும் வயிற்றில் தண்ணீருடன் முழுதாக விழுங்கவும். மெல்ல வேண்டாம்.',
        keyInstructions: [
          'காலை உணவுக்கு 30 நிமிடம் முன் வெறும் வயிற்றில்',
          'மாத்திரையை மெல்லாமல் முழுதாக விழுங்கவும்',
          'அதிக காரம் மற்றும் எண்ணெய் பலகாரங்களை தவிர்க்கவும்',
          'இரவு தாமதமாக சாப்பிடுவதை தவிர்க்கவும்'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: 'ಪ್ಯಾಂಟೊಸಿಡ್ 40 ಮಾತ್ರೆಯನ್ನು ಬೆಳಿಗ್ಗೆ ತಿಂಡಿ ಅಥವಾ ಚಹಾ ಕುಡಿಯುವ 30 ನಿಮಿಷಗಳ ಮೊದಲು ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ನೀರಿನೊಂದಿಗೆ ನುಂಗಿ. ಮಾತ್ರೆಯನ್ನು ಅಗಿಯಬೇಡಿ.',
        keyInstructions: [
          'ಬೆಳಿಗ್ಗೆ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ 30 ನಿಮಿಷಗಳ ಮುಂಚೆ',
          'ಮಾತ್ರೆಯನ್ನು ಅಗಿಯದೆ ನುಂಗಿರಿ',
          'ಖಾರ ಮತ್ತು ಎಣ್ಣೆಯುಕ್ತ ಆಹಾರ ಕಡಿಮೆ ಮಾಡಿ',
          'ರಾತ್ರಿ ಮಲಗುವ 2 ಗಂಟೆ ಮುಂಚಿತವಾಗಿ ಊಟ ಮಾಡಿ'
        ]
      }
    }
  },

  // ── 6. AZITHRAL 500 (Azithromycin) ────────────────────────────────────────
  'azithromycin': {
    id: 'pil-azithromycin-500',
    medicineName: 'Azithral 500 / Azithromycin Tablet',
    brand: 'Alembic Pharmaceuticals',
    saltComposition: 'Azithromycin 500mg',
    therapeuticCategory: 'Macrolide Antibiotic',
    scheduleCategory: 'SCHEDULE_H1',
    dosageForm: 'Tablet (Oral)',
    indication: 'Respiratory tract infections, tonsillitis, sinusitis, skin infections, and certain sexually transmitted infections.',
    howToTake: 'Take 1 tablet daily at a fixed time with water, preferably 1 hour before or 2 hours after a meal.',
    timingRecommendation: 'Once daily for strictly 3 to 5 days as prescribed by your doctor.',
    foodInstructions: 'Best absorbed on an empty stomach (1 hour before or 2 hours after food), but can be taken with food if stomach upset occurs.',
    missedDoseAdvice: 'Take the missed dose as soon as possible, then resume your regular once-daily schedule.',
    sideEffects: {
      common: [
        'Nausea, stomach cramps, or diarrhea',
        'Temporary loss of taste or mild dizziness',
        'Headache'
      ],
      severeAlerts: [
        'Cardiac QT prolongation or heart palpitations',
        'Severe allergic reaction or extensive rash',
        'Severe persistent watery diarrhea'
      ]
    },
    contraindications: [
      'Allergy to Azithromycin, Erythromycin, or any macrolide antibiotic',
      'History of cholestatic jaundice or liver impairment associated with prior azithromycin use',
      'Patients with known QT prolongation history'
    ],
    storageAdvice: 'Store below 30°C in a dry place.',
    disposalAdvice: 'Do not discard into household sewage. Return to pharmacy.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: 'For Azithral 500, take one tablet once daily at the same time for 3 consecutive days. Finish the complete course. Take either 1 hour before food or 2 hours after food with water.',
        keyInstructions: [
          'Take 1 tablet once daily for 3 days',
          'Take 1 hour before or 2 hours after food',
          'Complete all 3 tablets even if symptoms improve',
          'Avoid antacid gels 2 hours before or after taking this'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: 'एजिथ्रल 500 की एक गोली दिन में एक बार, लगातार 3 दिनों तक निश्चित समय पर लें। भोजन से 1 घंटा पहले या 2 घंटे बाद पानी के साथ लें और 3 दिन का पूरा कोर्स अवश्य समाप्त करें।',
        keyInstructions: [
          'दिन में 1 बार लगातार 3 दिन तक लें',
          'खाने से 1 घंटा पहले या 2 घंटे बाद लें',
          'लक्षण ठीक होने पर भी 3 दिन का कोर्स पूरा करें',
          'एंटासिड सिरप के साथ न लें'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: 'అజిత్రాల్ 500 మాత్రను రోజుకు ఒక్కసారి మాత్రమే, వరుసగా 3 రోజుల పాటు ఒకే సమయానికి వేసుకోవాలి. భోజనానికి 1 గంట ముందు లేదా 2 గంటల తర్వాత నీటితో మింగండి. 3 రోజుల కోర్సును పూర్తి చేయండి.',
        keyInstructions: [
          'రోజుకు ఒకే ఒక మాత్ర - 3 రోజులు మాత్రమే',
          'భోజనానికి 1 గంట ముందు లేదా 2 గంటల తర్వాత',
          'కోర్సు మధ్యలో ఆపవద్దు',
          'యాంటాసిడ్ జెల్స్‌తో కలిపి వాడకండి'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: 'அசித்ரால் 500 மாத்திரையை தினமும் ஒரு வேளை மட்டும் தொடர்ந்து 3 நாட்களுக்கு ஒரே நேரத்தில் எடுத்துக்கொள்ளவும். உணவுக்கு 1 மணி நேரத்திற்கு முன் அல்லது 2 மணி நேரத்திற்குப் பின் தண்ணீருடன் உட்கொள்ளவும்.',
        keyInstructions: [
          'தினமும் ஒரு மாத்திரை - 3 நாட்களுக்கு மட்டும்',
          'உணவுக்கு 1 மணி முன் அல்லது 2 மணி பின்',
          '3 நாட்கள் முழு கோர்ஸை முடிக்கவும்',
          'அசிடிட்டி ஜெல்களுடன் சேர்த்து எடுக்க வேண்டாம்'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: 'ಅಜಿತ್ರಾಲ್ 500 ಮಾತ್ರೆಯನ್ನು ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ ಸತತವಾಗಿ 3 ದಿನಗಳ ಕಾಲ ನಿಗದಿತ ಸಮಯಕ್ಕೆ ತೆಗೆದುಕೊಳ್ಳಿ. ಊಟಕ್ಕೆ 1 ಗಂಟೆ ಮೊದಲು ಅಥವಾ 2 ಗಂಟೆ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ.',
        keyInstructions: [
          'ದಿನಕ್ಕೆ 1 ಮಾತ್ರೆ - ಕೇವಲ 3 ದಿನಗಳ ಕಾಲ',
          'ಊಟಕ್ಕೆ 1 ಗಂಟೆ ಮೊದಲು ಅಥವಾ 2 ಗಂಟೆ ನಂತರ',
          'ಪೂರ್ಣ 3 ದಿನಗಳ ಕೋರ್ಸ್ ಮುಗಿಸಿ',
          'ಆಸಿಡಿಟಿ ಸಿರಪ್ ಜೊತೆ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ'
        ]
      }
    }
  }
};

/**
 * Helper to dynamically generate a Patient Instruction Leaflet for any medicine in the catalog
 * based on its salt composition, schedule category, and dosage form.
 */
export function getOrCreateLeaflet(product: Product): PatientInstructionLeaflet {
  const normalizedName = (product.name || '').toLowerCase();
  const normalizedSalt = (product.saltComposition || '').toLowerCase();

  // Try exact or substring matches in catalog
  if (normalizedName.includes('augmentin') || normalizedSalt.includes('amoxicillin') || normalizedSalt.includes('clavulanic')) {
    return { ...PRESET_PIL_CATALOG['augmentin'], medicineName: product.name, brand: product.brand, saltComposition: product.saltComposition };
  }
  if (normalizedName.includes('dolo') || normalizedName.includes('crocin') || normalizedSalt.includes('paracetamol') || normalizedSalt.includes('acetaminophen')) {
    return { ...PRESET_PIL_CATALOG['paracetamol'], medicineName: product.name, brand: product.brand, saltComposition: product.saltComposition };
  }
  if (normalizedName.includes('glycomet') || normalizedSalt.includes('metformin')) {
    return { ...PRESET_PIL_CATALOG['metformin'], medicineName: product.name, brand: product.brand, saltComposition: product.saltComposition };
  }
  if (normalizedName.includes('telma') || normalizedSalt.includes('telmisartan')) {
    return { ...PRESET_PIL_CATALOG['telmisartan'], medicineName: product.name, brand: product.brand, saltComposition: product.saltComposition };
  }
  if (normalizedName.includes('pantocid') || normalizedName.includes('pan 40') || normalizedSalt.includes('pantoprazole')) {
    return { ...PRESET_PIL_CATALOG['pantoprazole'], medicineName: product.name, brand: product.brand, saltComposition: product.saltComposition };
  }
  if (normalizedName.includes('azithral') || normalizedSalt.includes('azithromycin')) {
    return { ...PRESET_PIL_CATALOG['azithromycin'], medicineName: product.name, brand: product.brand, saltComposition: product.saltComposition };
  }

  // Dynamic clinical synthesis for any other medicine
  const isAntibiotic = /cillin|mycin|floxacin|cefp|amox|clav|doxy/i.test(normalizedSalt);
  const isPainRelief = /ibuprofen|diclofenac|aceclo|tramadol|nimesulide/i.test(normalizedSalt);
  const isAntiAllergic = /cetirizine|levocetirizine|fexo|loratadine|montelukast/i.test(normalizedSalt);
  const isScheduleX = product.scheduleCategory === 'SCHEDULE_X';
  const isScheduleH = product.scheduleCategory === 'SCHEDULE_H' || product.scheduleCategory === 'SCHEDULE_H1';

  const defaultCategory = isAntibiotic 
    ? 'Antibacterial / Anti-infective'
    : isPainRelief 
    ? 'Non-Steroidal Anti-inflammatory / Analgesic'
    : isAntiAllergic 
    ? 'Antihistamine / Anti-allergic'
    : isScheduleX
    ? 'Central Nervous System / Controlled Substance'
    : 'Therapeutic Pharmaceutical Formulation';

  const timingText = isAntibiotic
    ? 'Take every 8 to 12 hours as prescribed. Complete full course.'
    : isPainRelief
    ? 'Take after food with water when experiencing pain.'
    : isAntiAllergic
    ? 'Take once daily in the evening or at bedtime.'
    : 'Take strictly according to physician prescription.';

  const foodText = isPainRelief || isAntibiotic
    ? 'Always take with or after meals to protect stomach lining.'
    : 'Take with a glass of water. Follow prescription timing.';

  return {
    id: `pil-dyn-${product._id}`,
    medicineName: product.name,
    brand: product.brand || 'Pharmaceuticals',
    saltComposition: product.saltComposition || 'Active Pharmaceutical Ingredient',
    therapeuticCategory: defaultCategory,
    scheduleCategory: product.scheduleCategory,
    dosageForm: product.dosageForm || product.packType || 'Oral Formulation',
    indication: `Prescribed for therapeutic management of conditions requiring ${product.saltComposition || product.name}.`,
    howToTake: `Swallow whole with a full glass of water. ${foodText}`,
    timingRecommendation: timingText,
    foodInstructions: foodText,
    missedDoseAdvice: 'Take when remembered unless close to the next scheduled dose. Never take a double dose.',
    sideEffects: {
      common: [
        'Mild digestive discomfort or nausea',
        'Mild drowsiness or headache',
        'Dry mouth or fatigue'
      ],
      severeAlerts: [
        'Severe allergic reaction or skin rash',
        'Difficulty breathing or facial swelling',
        'Unusual heart palpitations or severe dizziness'
      ]
    },
    contraindications: [
      `Known hypersensitivity to ${product.saltComposition || 'the formulation'}`,
      isScheduleH ? 'Must only be dispensed against a valid registered medical practitioner prescription' : 'Consult doctor if symptoms persist',
      'Consult physician if pregnant, breastfeeding, or suffering from liver/kidney disease'
    ],
    storageAdvice: 'Store below 25°C to 30°C in a cool, dry place away from direct sunlight and humidity.',
    disposalAdvice: 'Dispose in pharmacy medication return receptacles. Do not discard in household drainage.',
    voiceClips: {
      en: {
        language: 'en',
        languageLabel: 'English',
        nativeLabel: 'English',
        voiceScript: `For ${product.name}, take as directed by your physician with water. ${foodText} Maintain regular timing and consult your pharmacist if you experience any adverse effects.`,
        keyInstructions: [
          `Take strictly as prescribed (${timingText})`,
          foodText,
          'Do not exceed recommended dosage',
          'Keep out of reach of children'
        ]
      },
      hi: {
        language: 'hi',
        languageLabel: 'Hindi',
        nativeLabel: 'हिंदी',
        voiceScript: `${product.name} को डॉक्टर के निर्देशानुसार पानी के साथ लें। दवा को सही समय पर लें और यदि कोई परेशानी महसूस हो तो तुरंत अपने फार्मासिस्ट या डॉक्टर से संपर्क करें।`,
        keyInstructions: [
          'डॉक्टर के बताए अनुसार नियमित समय पर लें',
          'पानी के साथ पूरी गोली निगलें',
          'खाली पेट न लें यदि पेट में जलन हो',
          'दवा को बच्चों की पहुंच से दूर रखें'
        ]
      },
      te: {
        language: 'te',
        languageLabel: 'Telugu',
        nativeLabel: 'తెలుగు',
        voiceScript: `${product.name} మందును డాక్టర్ సూచించిన విధంగా నీటితో వేసుకోండి. సరైన సమయానికి వాడండి మరియు ఏవైనా సమస్యలు ఎదురైతే వెంటనే డాక్టర్‌ను సంప్రదించండి.`,
        keyInstructions: [
          'డాక్టర్ సూచించిన నియమిత వేళల్లో వేసుకోండి',
          'నీటితో మింగండి, నమలరాదు',
          'కడుపులో మంట రాకుండా భోజనం తర్వాత వేసుకోండి',
          'పిల్లలకు అందకుండా భద్రపరచండి'
        ]
      },
      ta: {
        language: 'ta',
        languageLabel: 'Tamil',
        nativeLabel: 'தமிழ்',
        voiceScript: `${product.name} மருந்தை மருத்துவர் கூறியபடி தண்ணீருடன் உட்கொள்ளவும். மருந்தின் அளவை தவறாமல் பின்பற்றி, ஏதேனும் உபாதை ஏற்பட்டால் மருத்துவரை அணுகவும்.`,
        keyInstructions: [
          'மருத்துவர் கூறிய நேரத்திற்கு தவறாமல் உட்கொள்ளவும்',
          'தண்ணீருடன் விழுங்கவும்',
          'பரிந்துரைக்கப்பட்ட அளவை விட அதிகமாக எடுக்க வேண்டாம்',
          'குழந்தைகளுக்கு எட்டாத இடத்தில் வைக்கவும்'
        ]
      },
      kn: {
        language: 'kn',
        languageLabel: 'Kannada',
        nativeLabel: 'ಕನ್ನಡ',
        voiceScript: `${product.name} ಔಷಧಿಯನ್ನು ವೈದ್ಯರು ಸೂಚಿಸಿದಂತೆ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. ಸರಿಯಾದ ಸಮಯಕ್ಕೆ ಸೇವಿಸಿ ಮತ್ತು ಯಾವುದೇ ತೊಂದರೆಯಾದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`,
        keyInstructions: [
          'ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ನಿಗದಿತ ಸಮಯಕ್ಕೆ ಸೇವಿಸಿ',
          'ನೀರಿನೊಂದಿಗೆ ನುಂಗಿರಿ',
          'ಹೆಚ್ಚಿನ ಪ್ರಮಾಣದಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ',
          'ಮಕ್ಕಳ ಕೈಗೆ ಸಿಗದಂತೆ ಇರಿಸಿ'
        ]
      }
    }
  };
}

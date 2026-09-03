import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setWellnessBrochureModalOpen } from '../store/posSlice';
import type { WellnessBrochureCategory, WellnessBrochurePlan } from '../types/pos';
import { formatPhoneForWhatsApp } from '../utils/whatsappShare';
import {
  Heart,
  Activity,
  Wind,
  UserCheck,
  Baby,
  Sparkles,
  Printer,
  Share2,
  X,
  CheckCircle2,
  AlertTriangle,
  Apple,
  ShieldCheck,
  Stethoscope,
  Clock,
  Phone,
  FileText
} from 'lucide-react';

// ─── Wellness Brochure Clinical Catalog ─────────────────────────────────────

const WELLNESS_PLANS: Record<WellnessBrochureCategory, WellnessBrochurePlan> = {
  DIABETES: {
    id: 'wb-diab',
    category: 'DIABETES',
    title: 'Type 2 Diabetes Glycemic Care & Lifestyle Plan',
    subtitle: 'Comprehensive guide to blood sugar control, dietary care, and medication compliance.',
    icon: '🩸',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    targetCondition: 'Type 2 Diabetes / Impaired Fasting Glucose',
    recommendedDiet: [
      'High-fiber foods: Oats, brown rice, millets (ragi, jowar)',
      'Green leafy vegetables: Spinach, fenugreek, broccoli',
      'Lean proteins: Pulses, legumes, skinless poultry, paneer',
      'Low Glycemic Index fruits: Guava, apple, papaya, berries (in moderation)'
    ],
    foodsToAvoid: [
      'Refined carbohydrates: White bread, maida, polished rice',
      'Sugary drinks, fruit juices, sodas, and energy drinks',
      'Deep-fried snacks, bakeries, and high-trans-fat foods',
      'Excess sweets, jaggery, honey, and artificial syrups'
    ],
    lifestyleTips: [
      'Engage in 30 minutes of brisk walking or moderate exercise daily',
      'Monitor Fasting & Post-Prandial Blood Sugar every week',
      'Inspect feet daily for cuts, blisters, or numbness',
      'Maintain consistent sleep schedule (7-8 hours per night)'
    ],
    medicationAdherenceTips: [
      'Take Metformin / Glimepiride strictly before or with meals as advised',
      'Never skip doses even if blood sugar feels normal',
      'Keep glucose tablets or candy nearby in case of hypoglycemia (sweating/dizziness)',
      'Report any persistent stomach upset to your prescribing physician'
    ],
    warningSigns: [
      'Sweating, trembling, extreme hunger, or confusion (Sugar Drop < 70 mg/dL)',
      'Extreme thirst, frequent urination, and blurred vision (Sugar Surge > 250 mg/dL)',
      'Slow-healing foot wounds or persistent numbness in toes'
    ],
    recommendedCheckups: [
      'HbA1c Blood Test: Every 3 Months',
      'Fast & PP Blood Glucose: Bi-weekly',
      'Kidney Function & Microalbuminuria: Annually',
      'Diabetic Eye Retinopathy Check: Annually'
    ]
  },

  HYPERTENSION: {
    id: 'wb-hyp',
    category: 'HYPERTENSION',
    title: 'Hypertension & Cardiac Wellness Guide',
    subtitle: 'Evidence-based advice for blood pressure management, DASH diet, and heart safety.',
    icon: '❤️',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    targetCondition: 'Essential Hypertension / High Blood Pressure',
    recommendedDiet: [
      'DASH Diet: High potassium, calcium, and magnesium rich foods',
      'Fresh vegetables, garlic, ginger, and seeds (flaxseed, chia)',
      'Low-fat dairy products, skimmed milk, and curd',
      'Whole grains, oats, and pomegranate juice'
    ],
    foodsToAvoid: [
      'High sodium foods: Pickles, papad, canned soups, salted nuts',
      'Processed meats, sausages, and instant noodles',
      'Excess caffeine, energy drinks, and alcohol',
      'Butter, lard, ghee in excess, and hydrogenated oils'
    ],
    lifestyleTips: [
      'Restrict daily salt intake to less than 1 teaspoon (< 5 grams/day)',
      'Practice deep breathing, yoga, or meditation 15 mins daily',
      'Monitor Blood Pressure at home twice weekly and log readings',
      'Maintain a healthy Body Mass Index (BMI between 18.5 – 24.9)'
    ],
    medicationAdherenceTips: [
      'Take BP medication (Amlodipine/Telmisartan) at the exact same time daily',
      'Do NOT stop medication abruptly even if BP readings are normal',
      'Avoid taking anti-hypertensives with grapefruit juice',
      'Inform doctor before taking OTC pain killers like Ibuprofen/Diclofenac'
    ],
    warningSigns: [
      'Severe occipital headache or dizziness',
      'Chest tightness, pressure, or pain radiating to left arm/jaw',
      'Shortness of breath or sudden swelling in ankles/feet'
    ],
    recommendedCheckups: [
      'BP Monitoring: Weekly at home',
      'Lipid Profile (Cholesterol): Every 6 Months',
      'Serum Creatinine & Electrolytes: Every 6 Months',
      'ECG / Echocardiogram: Annually'
    ]
  },

  ASTHMA: {
    id: 'wb-asthma',
    category: 'ASTHMA',
    title: 'Asthma & Respiratory Health Action Plan',
    subtitle: 'Inhaler technique guide, environmental trigger reduction, and lung wellness.',
    icon: '🫁',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    targetCondition: 'Bronchial Asthma / COPD / Respiratory Allergy',
    recommendedDiet: [
      'Antioxidant-rich foods: Citrus fruits, berries, carrots, tomatoes',
      'Vitamin D foods: Mushrooms, fortified milk, egg yolks',
      'Omega-3 fatty acids: Flaxseed, walnuts, chia seeds',
      'Warm herbal teas, ginger water, and turmeric milk'
    ],
    foodsToAvoid: [
      'Sulfite-containing foods: Dried fruits, packaged wines, lemon juice concentrate',
      'Cold drinks, ice creams, and refrigerated chilled foods during flare-ups',
      'Processed foods with artificial colorings and preservatives',
      'Foods known to cause individual allergic responses'
    ],
    lifestyleTips: [
      'Identify and avoid known asthma triggers (dust mites, pollen, pet dander, smoke)',
      'Use air purifiers or wet-mop rooms to minimize airborne dust',
      'Perform breathing exercises (Pranayama, Pursed-lip breathing) daily',
      'Wear a protective mask outdoors during high AQI pollution days'
    ],
    medicationAdherenceTips: [
      'Use Controller / Maintenance Inhalers daily as prescribed',
      'Always rinse mouth with water and spit after corticosteroid inhaler use',
      'Keep Rescue Inhaler (Salbutamol) accessible at all times',
      'Check inhaler dose counter regularly to avoid running out'
    ],
    warningSigns: [
      'Severe wheezing, breathlessness while talking, or gasping',
      'Chest indrawing or bluish discoloration of lips/fingernails',
      'No relief 15 minutes after taking 2-4 puffs of rescue inhaler'
    ],
    recommendedCheckups: [
      'Peak Expiratory Flow Rate (PEFR): Daily at home',
      'Spirometry Lung Function Test: Every 6 Months',
      'Pulmonologist Consultation: Bi-annually'
    ]
  },

  GERIATRIC: {
    id: 'wb-geri',
    category: 'GERIATRIC',
    title: 'Senior Citizen Health & Joint Wellness Care Plan',
    subtitle: 'Bone strength, fall prevention, cognitive health, and multivitamin guidance.',
    icon: '👵',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    targetCondition: 'Osteoarthritis / Osteoporosis / Geriatric Care',
    recommendedDiet: [
      'Calcium & Vitamin D rich foods: Milk, sesame seeds, almonds, ragi',
      'Protein-rich soft meals: Dal, eggs, khichdi, paneer',
      'Hydrating fluids: Coconut water, soups, warm water throughout day',
      'Fiber-dense foods: Prunes, papaya, stewed apples for digestive ease'
    ],
    foodsToAvoid: [
      'Excessively hard or tough foods that are difficult to chew',
      'High-sugar snacks leading to energy spikes and crashes',
      'Very salty or spicy night meals disturbing sleep',
      'Alcohol and heavy caffeine disrupting bone density'
    ],
    lifestyleTips: [
      'Ensure home fall safety: Anti-skid mats, grab rails in bathrooms, adequate lighting',
      'Perform light range-of-motion joint exercises and gentle walking',
      'Expose arms and legs to early morning sun for 15-20 mins (Vitamin D synthesis)',
      'Engage in memory games, reading, or social interaction for cognitive health'
    ],
    medicationAdherenceTips: [
      'Use pill organizers (pill boxes labeled Mon-Sun) to prevent missed/double doses',
      'Take Calcium supplements with meals; Iron supplements on empty stomach with Vit C',
      'Keep an updated list of all medications in wallet/handbag',
      'Ask pharmacist for easy-open bottle caps if suffering from arthritis'
    ],
    warningSigns: [
      'Sudden loss of balance, dizziness, or frequent unsteadiness',
      'Severe joint swelling, warmth, or inability to bear weight',
      'Confusion, disorientation, or sudden memory lapses'
    ],
    recommendedCheckups: [
      'DEXA Bone Mineral Density Scan: Annually',
      'Vitamin B12 & Vitamin D3 Levels: Every 6 Months',
      'Comprehensive Geriatric Blood Panel: Bi-annually'
    ]
  },

  PEDIATRIC: {
    id: 'wb-pedia',
    category: 'PEDIATRIC',
    title: 'Childhood Growth, Immunity & Nutrition Guide',
    subtitle: 'Pediatric nutrition, hydration, fever management, and safety precautions.',
    icon: '👶',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    targetCondition: 'Childhood Nutrition / Immunity / Common Illness',
    recommendedDiet: [
      'Nutrient-dense foods: Milk, bananas, ragi malt, eggs, mashed lentils',
      'Seasonal fresh fruits: Oranges, pomegranates, apples, chiku',
      'Boiled, purified drinking water served warm or room temperature',
      'Homemade soups, vegetable purees, and nut powders in milk'
    ],
    foodsToAvoid: [
      'Junk foods: Packaged chips, candies, chocolates, carbonated sodas',
      'Artificially colored juices, popsicles, and excessive bakery items',
      'Choking hazards for under 3s: Whole nuts, raw carrots, hard candies',
      'Excess refined sugar leading to dental caries'
    ],
    lifestyleTips: [
      'Ensure 10-12 hours of restful sleep daily according to age group',
      'Maintain strict handwashing before meals and after outdoor play',
      'Limit screen time (TV/mobile) to under 1 hour daily',
      'Encourage outdoor physical play in safe playgrounds'
    ],
    medicationAdherenceTips: [
      'Use precise measuring syringes or calibrated cups for liquid pediatric syrups',
      'Calculate dosage strictly based on child weight (kg), not age alone',
      'Never refer to medicine as "candy" to prevent accidental self-ingestion',
      'Store all pediatric syrups safely in locked child-proof cabinets'
    ],
    warningSigns: [
      'High fever (> 102°F) unresponsive to Paracetamol within 2 hours',
      'Lethargy, refusal to drink fluids, or decreased wet diapers (< 4 in 24 hrs)',
      'Rapid breathing, chest retractions, or persistent vomiting'
    ],
    recommendedCheckups: [
      'Pediatric Growth & Height/Weight Charting: Monthly',
      'Vaccination / Immunization Schedule Verification: As per IAP Chart',
      'Pediatric Dental Checkup: Every 6 Months'
    ]
  },

  MATERNITY: {
    id: 'wb-mat',
    category: 'MATERNITY',
    title: 'Maternal & Postnatal Health Wellness Care Plan',
    subtitle: 'Prenatal nutrition, Iron-Folic acid compliance, and postnatal recovery.',
    icon: '🤰',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-300',
    targetCondition: 'Pregnancy Care / Postnatal Lactation & Health',
    recommendedDiet: [
      'Folate & Iron rich foods: Green leafy vegetables, beetroot, pomegranates, dates',
      'Protein rich foods: Eggs, pulses, fish (low mercury), paneer, tofu',
      'Hydration: 3-4 liters of water, coconut water, fresh buttermilk daily',
      'DHA & Omega-3 foods for fetal brain development: Walnuts, chia seeds'
    ],
    foodsToAvoid: [
      'Unpasteurized dairy products or soft cheeses',
      'Undercooked eggs, raw sprouts, or unwashed raw produce',
      'Excess caffeine (limit to < 200mg/day) and completely avoid alcohol',
      'Papaya (unripe/semi-ripe) and excessive pineapple in early pregnancy'
    ],
    lifestyleTips: [
      'Perform light prenatal yoga or 20-minute daily walking as cleared by OB-GYN',
      'Sleep on the left side (left lateral position) for optimal uterine blood flow',
      'Practice pelvic floor (Kegel) exercises daily',
      'Avoid heavy lifting, sudden jerks, or prolonged standing'
    ],
    medicationAdherenceTips: [
      'Take Iron & Folic Acid tablets daily as prescribed by your Obstetrician',
      'Separate Iron and Calcium tablets by at least 2 hours to optimize absorption',
      'Take Calcium with meals to minimize bloating/constipation',
      'Do NOT take any OTC medications without explicit OB-GYN approval'
    ],
    warningSigns: [
      'Vaginal bleeding, spotting, or fluid leakage',
      'Severe abdominal pain, persistent nausea/vomiting, or high fever',
      'Decreased fetal movements in late pregnancy (> 28 weeks)'
    ],
    recommendedCheckups: [
      'Obstetric Ultrasound Scans: Anomaly Scan (18-22wks), Growth Scans',
      'Hemoglobin & Blood Grouping: Trimester-wise',
      'Oral Glucose Tolerance Test (OGTT for Gestational Diabetes): 24-28 Weeks'
    ]
  }
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const WellnessBrochureModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.wellnessBrochureModal);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const currentSession = sessions.find(s => s.id === activeSessionId);
  const storeSettings = useSelector((state: RootState) => state.pos.settings);

  const [selectedCategory, setSelectedCategory] = useState<WellnessBrochureCategory>(
    modal.category || 'DIABETES'
  );
  const [patientNameInput, setPatientNameInput] = useState(
    modal.patientName || currentSession?.patientDetails?.patientName || ''
  );
  const [patientPhoneInput, setPatientPhoneInput] = useState(
    modal.phone || currentSession?.patientDetails?.phone || ''
  );

  if (!modal.isOpen) return null;

  const currentPlan = WELLNESS_PLANS[selectedCategory] || WELLNESS_PLANS.DIABETES;

  const handleClose = () => {
    dispatch(setWellnessBrochureModalOpen({ isOpen: false }));
  };

  // 1-Click WhatsApp Share
  const handleWhatsAppShare = () => {
    const phone = patientPhoneInput || currentSession?.patientDetails?.phone || '';
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const pName = patientNameInput || 'Valued Customer';

    let msg = `🏥 *${storeSettings.storeName.toUpperCase()}*\n`;
    msg += `📍 ${storeSettings.address}\n`;
    msg += `📞 Support: ${storeSettings.phone}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📋 *HEALTH & WELLNESS CARE PLAN*\n`;
    msg += `*Patient Name:* ${pName}\n`;
    msg += `*Plan Title:* ${currentPlan.title}\n`;
    msg += `*Condition:* ${currentPlan.targetCondition}\n\n`;

    msg += `🥗 *RECOMMENDED DIET:*\n`;
    currentPlan.recommendedDiet.forEach(item => {
      msg += `  • ${item}\n`;
    });

    msg += `\n🚫 *FOODS TO AVOID:*\n`;
    currentPlan.foodsToAvoid.forEach(item => {
      msg += `  • ${item}\n`;
    });

    msg += `\n🏃 *LIFESTYLE & EXERCISE:*\n`;
    currentPlan.lifestyleTips.forEach(item => {
      msg += `  • ${item}\n`;
    });

    msg += `\n💊 *MEDICATION ADHERENCE TIPS:*\n`;
    currentPlan.medicationAdherenceTips.forEach(item => {
      msg += `  • ${item}\n`;
    });

    msg += `\n🚨 *WARNING SIGNS / RED FLAGS:*\n`;
    currentPlan.warningSigns.forEach(item => {
      msg += `  • ${item}\n`;
    });

    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👨‍⚕️ *Pharmacist Advice:* Always consult your treating physician before making drastic diet or medication changes.\n`;
    msg += `Thank you for trusting ${storeSettings.storeName}! 🙏`;

    const encodedText = encodeURIComponent(msg);
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(url, '_blank');
  };

  // Print Brochure
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Health & Wellness Plan Brochure
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                  Task #29 Module
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate clinical brochures, diet advice, and 1-click WhatsApp care plans for patients.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Info Input Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 flex-1">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Patient Name (e.g. Ramesh Kumar)"
                value={patientNameInput}
                onChange={e => setPatientNameInput(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Phone className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="WhatsApp Phone No (e.g. 9876543210)"
                value={patientPhoneInput}
                onChange={e => setPatientPhoneInput(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              1-Click WhatsApp Share
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Brochure
            </button>
          </div>
        </div>

        {/* Category Tabs Bar */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          {(
            [
              { key: 'DIABETES', label: 'Diabetes Care', icon: '🩸', color: 'hover:bg-emerald-50 text-emerald-700' },
              { key: 'HYPERTENSION', label: 'Hypertension & BP', icon: '❤️', color: 'hover:bg-rose-50 text-rose-700' },
              { key: 'ASTHMA', label: 'Asthma & Respiratory', icon: '🫁', color: 'hover:bg-sky-50 text-sky-700' },
              { key: 'GERIATRIC', label: 'Senior Joint Care', icon: '👵', color: 'hover:bg-amber-50 text-amber-700' },
              { key: 'PEDIATRIC', label: 'Pediatric Nutrition', icon: '👶', color: 'hover:bg-purple-50 text-purple-700' },
              { key: 'MATERNITY', label: 'Maternity Wellness', icon: '🤰', color: 'hover:bg-pink-50 text-pink-700' }
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === tab.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/30'
                  : `bg-slate-50 border-slate-200 text-slate-600 ${tab.color}`
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Brochure Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Main Title Header Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentPlan.icon}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${currentPlan.badgeColor}`}>
                  {currentPlan.targetCondition}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {currentPlan.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentPlan.subtitle}
              </p>
            </div>

            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ISSUED BY PHARMACY</p>
              <p className="text-xs font-bold text-slate-800">{storeSettings.storeName}</p>
              <p className="text-[11px] text-slate-500">{storeSettings.phone}</p>
            </div>
          </div>

          {/* 2-Column Grid: Recommended Diet vs Foods to Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Recommended Diet Card */}
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Apple className="w-4 h-4 text-emerald-600" />
                <span>Recommended Diet & Nutrition</span>
              </div>
              <ul className="space-y-2">
                {currentPlan.recommendedDiet.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-emerald-950 font-medium leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Foods to Avoid Card */}
            <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <X className="w-4 h-4 text-rose-600" />
                <span>Foods & Habits to Avoid</span>
              </div>
              <ul className="space-y-2">
                {currentPlan.foodsToAvoid.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-rose-950 font-medium leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2-Column Grid: Lifestyle & Medication Adherence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Lifestyle Guidelines */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Lifestyle & Physical Activity</span>
              </div>
              <ul className="space-y-2">
                {currentPlan.lifestyleTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Medication Adherence Guidelines */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Medication Compliance Advice</span>
              </div>
              <ul className="space-y-2">
                {currentPlan.medicationAdherenceTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warning Signs / Red Flags Alert Box */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Warning Signs & Emergency Red Flags</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {currentPlan.warningSigns.map((sign, idx) => (
                <div key={idx} className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-xs text-amber-950 font-medium">
                  {sign}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Diagnostics Checkups */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Stethoscope className="w-4 h-4" />
              <span>Recommended Routine Diagnostic Checkups</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {currentPlan.recommendedCheckups.map((checkup, idx) => (
                <div key={idx} className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{checkup}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 italic">
            * Disclaimer: This brochure is provided for health education purposes and does not substitute formal medical diagnosis.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
export default WellnessBrochureModal;

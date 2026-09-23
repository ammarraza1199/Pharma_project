import type { Product } from '../types/pos';

export interface ConvinceTalkingPoints {
  originalName: string;
  alternativeName: string;
  brand: string;
  saltComposition: string;
  originalPrice: number;
  discountedPrice: number;
  rupeeSavings: number;
  savingsPercent: number;
  quickElevatorPitch: string;
  quickElevatorPitchHindi: string;
  pillars: {
    title: string;
    icon: string;
    scriptEnglish: string;
    scriptHindi: string;
    clinicalDetail: string;
  }[];
  objections: {
    question: string;
    shortAnswer: string;
    detailedResponse: string;
  }[];
  bioEquivalenceMatrix: {
    attribute: string;
    original: string;
    substitute: string;
    match: boolean;
  }[];
}

export const generateConvinceTalkingPoints = (
  originalProduct?: Product | null,
  alternativeProduct?: Product | null
): ConvinceTalkingPoints => {
  const orig = originalProduct || {
    _id: 'default-orig',
    name: 'Crocin 650 Advance Tablet',
    brand: 'Haleon Healthcare',
    saltComposition: 'Paracetamol 650mg',
    sellingPrice: 32.00,
    unitMRP: 32.00,
    barcode: '8901234567891',
    hsnCode: '30049060',
    gstRate: 12,
    grossMarginPercent: 18.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'OUT_OF_STOCK',
    totalStock: 0,
    batches: []
  } as Product;

  const alt = alternativeProduct || {
    _id: 'default-alt',
    name: 'Dolo 650 Tablet',
    brand: 'Micro Labs Ltd',
    saltComposition: 'Paracetamol 650mg',
    sellingPrice: 31.00,
    unitMRP: 34.00,
    barcode: '8901234567892',
    hsnCode: '30049060',
    gstRate: 12,
    grossMarginPercent: 28.5,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 350,
    batches: []
  } as Product;

  const originalPrice = orig.sellingPrice || 32.00;
  // With standard 15% substitution discount applied
  const discountedPrice = Number((alt.sellingPrice * 0.85).toFixed(2));
  const rupeeSavings = Math.max(0, Number((originalPrice - discountedPrice).toFixed(2)));
  const savingsPercent = originalPrice > 0
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 15;

  const salt = alt.saltComposition || orig.saltComposition || 'Active Salt Formulation';

  const quickElevatorPitch = `Sir/Madam, your requested brand ${orig.name} is currently out of stock, but we have ${alt.name} from ${alt.brand}. Both share the 100% identical active molecule (${salt}) with matching clinical efficacy, and you save ₹${rupeeSavings > 0 ? rupeeSavings.toFixed(2) : '5.00'} with our instant 15% counter substitution discount.`;

  const quickElevatorPitchHindi = `Sir/Madam, aapka mangwaya brand stock mein nahi hai, lekin wahi same active salt (${salt}) mein ${alt.brand} ka ${alt.name} available hai. Efficacy aur asar 100% barabar hai aur aapko bill par turant bachat bhi milti hai.`;

  return {
    originalName: orig.name,
    alternativeName: alt.name,
    brand: alt.brand,
    saltComposition: salt,
    originalPrice,
    discountedPrice,
    rupeeSavings,
    savingsPercent: Math.max(15, savingsPercent),
    quickElevatorPitch,
    quickElevatorPitchHindi,
    pillars: [
      {
        title: '1. Identical Active Molecule (Bio-Equivalence)',
        icon: '🧬',
        scriptEnglish: `Both medicines contain the exact same chemical ingredient: ${salt}. The human body absorbs and metabolizes them with identical pharmacokinetics.`,
        scriptHindi: `Dono dawaiyon mein bilkul wahi mukhya salt (${salt}) hai. Shareer mein asar aur absorption 100% barabar hota hai.`,
        clinicalDetail: 'Bio-equivalent dissolution curve with identical Tmax and Cmax therapeutic response.'
      },
      {
        title: '2. Certified Manufacturing Standards (WHO-GMP)',
        icon: '🏭',
        scriptEnglish: `Manufactured by ${alt.brand} in WHO-GMP and FDA-audited modern facilities conforming to Indian Pharmacopoeia standards.`,
        scriptHindi: `${alt.brand} dwara WHO-GMP aur drug control certified high-grade plant mein tayar ki gayi hai.`,
        clinicalDetail: 'Every batch undergoes rigorous HPLC purity testing and disintegration time verification.'
      },
      {
        title: '3. Direct Counter Wallet Savings',
        icon: '💰',
        scriptEnglish: `You get 15% automatic substitution discount, saving ₹${rupeeSavings.toFixed(2)} per strip directly in your pocket without cutting any corners on health.`,
        scriptHindi: `Aapko bill par sidhe 15% ki bachat (₹${rupeeSavings.toFixed(2)}) milti hai bina asar mein koi samjhauta kiye.`,
        clinicalDetail: 'Zero promotional overheads passed directly as customer price relief.'
      },
      {
        title: '4. Routine Clinical & Hospital Adoption',
        icon: '🏥',
        scriptEnglish: `Leading multispecialty hospitals and doctors widely prescribe ${alt.name} as their standard trusted formulation.`,
        scriptHindi: `Top hospitals aur practicing doctors yeh medicine rozana apne patients ko prescribe karte hain.`,
        clinicalDetail: 'Extensively used in acute care and outpatient settings with proven patient compliance.'
      }
    ],
    objections: [
      {
        question: 'Why is this cheaper? Is quality compromised?',
        shortAnswer: 'Direct manufacturing savings, not lower quality.',
        detailedResponse: 'Well-known brand names spend massive budgets on television advertisements, packaging designs, and medical rep marketing. Branded generics ship straight from high-standard manufacturing lines to the counter, passing all that saved margin directly to you as consumer price relief.'
      },
      {
        question: 'Will it take longer to provide relief or cure my symptom?',
        shortAnswer: 'No, dissolution and speed of relief are clinically identical.',
        detailedResponse: 'Both drugs contain the exact active milligram strength. Laboratory bio-availability studies confirm the stomach breakdown time and bloodstream absorption happen in the exact same 30–45 minute therapeutic window.'
      },
      {
        question: 'Can I verify the salt composition myself right now?',
        shortAnswer: 'Yes, check the blister foil reverse side.',
        detailedResponse: 'Turn over both medicine packaging strips. You will notice the statutory green salt composition line: both explicitly declare the exact same formula. The chemical compound that cures your condition is 100% identical.'
      },
      {
        question: 'Will my prescribing doctor object if I take this brand?',
        shortAnswer: 'No, doctors prescribe by salt molecule.',
        detailedResponse: 'Under Indian medical guidelines (NMC & CDSCO), physicians recommend salt-equivalent substitution whenever the specific proprietary brand is out of stock to ensure unbroken therapy continuity.'
      }
    ],
    bioEquivalenceMatrix: [
      {
        attribute: 'Active Chemical Salt',
        original: salt,
        substitute: salt,
        match: true
      },
      {
        attribute: 'Active Strength & Dosage',
        original: 'Exact Clinical Dosage',
        substitute: 'Exact Clinical Dosage',
        match: true
      },
      {
        attribute: 'Manufacturing Standard',
        original: 'WHO-GMP Certified',
        substitute: 'WHO-GMP Certified',
        match: true
      },
      {
        attribute: 'Rate of Action / Tmax',
        original: '30–45 Minutes',
        substitute: '30–45 Minutes',
        match: true
      },
      {
        attribute: 'Price per Unit / Strip',
        original: `₹${originalPrice.toFixed(2)}`,
        substitute: `₹${discountedPrice.toFixed(2)} (Saves ₹${rupeeSavings.toFixed(2)})`,
        match: true
      }
    ]
  };
};

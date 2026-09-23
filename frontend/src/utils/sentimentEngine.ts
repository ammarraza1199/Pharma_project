import type { CustomerSentimentResult, SentimentType } from '../types/pos';

interface KeywordRule {
  term: string;
  weight: number;
}

const PRICE_SENSITIVE_KEYWORDS: KeywordRule[] = [
  { term: 'expensive', weight: 3 },
  { term: 'costly', weight: 3 },
  { term: 'too high', weight: 3 },
  { term: 'price is high', weight: 3 },
  { term: 'rate high', weight: 2 },
  { term: 'cheaper', weight: 3 },
  { term: 'cheap', weight: 2 },
  { term: 'less price', weight: 2 },
  { term: 'lower price', weight: 2 },
  { term: 'generic', weight: 3 },
  { term: 'substitute', weight: 2 },
  { term: 'discount', weight: 3 },
  { term: 'concession', weight: 2 },
  { term: 'any offer', weight: 2 },
  { term: "can't afford", weight: 4 },
  { term: 'cannot afford', weight: 4 },
  { term: 'out of budget', weight: 3 },
  { term: 'budget', weight: 2 },
  { term: 'reduce', weight: 2 },
  { term: 'less tablets', weight: 2 },
  { term: 'few tablets', weight: 2 },
  { term: 'half strip', weight: 2 },
  { term: 'mrp', weight: 1 },
  { term: 'pricey', weight: 3 },
  { term: 'loot', weight: 4 },
  { term: 'heavy bill', weight: 3 },
  { term: 'very costly', weight: 4 }
];

const ANXIOUS_URGENT_KEYWORDS: KeywordRule[] = [
  { term: 'severe', weight: 3 },
  { term: 'acute', weight: 3 },
  { term: 'pain', weight: 2 },
  { term: 'unbearable', weight: 4 },
  { term: 'crying', weight: 3 },
  { term: 'high fever', weight: 4 },
  { term: 'fever', weight: 2 },
  { term: 'shivering', weight: 3 },
  { term: 'vomiting', weight: 3 },
  { term: 'bleeding', weight: 4 },
  { term: 'urgent', weight: 4 },
  { term: 'emergency', weight: 5 },
  { term: 'immediately', weight: 3 },
  { term: 'right now', weight: 3 },
  { term: 'fast relief', weight: 3 },
  { term: 'terrified', weight: 4 },
  { term: 'scared', weight: 3 },
  { term: 'worried', weight: 3 },
  { term: 'anxious', weight: 3 },
  { term: 'not reducing', weight: 4 },
  { term: 'getting worse', weight: 4 },
  { term: 'breathless', weight: 5 },
  { term: 'chest pain', weight: 5 },
  { term: 'dizzy', weight: 3 },
  { term: 'fainting', weight: 4 },
  { term: 'infection', weight: 2 }
];

const SATISFIED_RECEPTIVE_KEYWORDS: KeywordRule[] = [
  { term: 'thank you', weight: 3 },
  { term: 'thanks', weight: 2 },
  { term: 'very good', weight: 3 },
  { term: 'excellent', weight: 3 },
  { term: 'great service', weight: 4 },
  { term: 'regular', weight: 3 },
  { term: 'monthly', weight: 3 },
  { term: 'every month', weight: 4 },
  { term: 'bp medicine', weight: 2 },
  { term: 'sugar medicine', weight: 2 },
  { term: 'always buy', weight: 3 },
  { term: 'always come here', weight: 4 },
  { term: 'satisfied', weight: 3 },
  { term: 'helpful', weight: 3 },
  { term: 'polite', weight: 2 },
  { term: 'repeat', weight: 2 },
  { term: 'refill', weight: 3 },
  { term: 'good advice', weight: 3 },
  { term: 'trust', weight: 3 },
  { term: 'best pharmacy', weight: 4 }
];

export const analyzeCustomerSentiment = (rawText: string): CustomerSentimentResult => {
  if (!rawText || !rawText.trim()) {
    return {
      sentiment: 'NEUTRAL',
      confidence: 50,
      label: 'Neutral / Routine Consultation',
      toneSummary: 'Standard clinical conversation without strong price resistance or acute distress markers.',
      detectedKeywords: [],
      recommendedAction: 'Proceed with standard dispensing instructions and explain dosage schedules.'
    };
  }

  const text = rawText.toLowerCase();

  let priceScore = 0;
  const priceKeywordsFound: string[] = [];
  PRICE_SENSITIVE_KEYWORDS.forEach(({ term, weight }) => {
    if (text.includes(term)) {
      priceScore += weight;
      priceKeywordsFound.push(term);
    }
  });

  let anxiousScore = 0;
  const anxiousKeywordsFound: string[] = [];
  ANXIOUS_URGENT_KEYWORDS.forEach(({ term, weight }) => {
    if (text.includes(term)) {
      anxiousScore += weight;
      anxiousKeywordsFound.push(term);
    }
  });

  let satisfiedScore = 0;
  const satisfiedKeywordsFound: string[] = [];
  SATISFIED_RECEPTIVE_KEYWORDS.forEach(({ term, weight }) => {
    if (text.includes(term)) {
      satisfiedScore += weight;
      satisfiedKeywordsFound.push(term);
    }
  });

  // Calculate highest weighted category
  const maxScore = Math.max(priceScore, anxiousScore, satisfiedScore);

  if (maxScore === 0) {
    return {
      sentiment: 'NEUTRAL',
      confidence: 60,
      label: 'Neutral / Routine Consultation',
      toneSummary: 'Patient tone is balanced. Standard prescription counseling recommended.',
      detectedKeywords: [],
      recommendedAction: 'Proceed with standard dispensing and review PIL instructions with the patient.'
    };
  }

  // 1. PRICE SENSITIVE
  if (priceScore === maxScore && priceScore >= 2) {
    const confidence = Math.min(96, Math.max(65, 55 + priceScore * 6));
    return {
      sentiment: 'PRICE_SENSITIVE',
      confidence,
      label: 'Price-Sensitive / Hesitant',
      toneSummary: 'Customer expressed hesitation regarding high prescription cost, requested discounts, or inquired about affordable alternatives.',
      detectedKeywords: Array.from(new Set(priceKeywordsFound)),
      recommendedAction: 'Auto-trigger 10% Courtesy Counter Discount or offer clinically equivalent generic alternatives to prevent cart abandonment.',
      discountSuggestionPercent: 10,
      genericSuggestionPrompt: 'Clinically equivalent generic alternatives available with up to 40%–60% savings.'
    };
  }

  // 2. ANXIOUS / URGENT
  if (anxiousScore === maxScore && anxiousScore >= 2) {
    const confidence = Math.min(98, Math.max(70, 60 + anxiousScore * 5));
    return {
      sentiment: 'ANXIOUS_URGENT',
      confidence,
      label: 'Anxious / Urgent Care',
      toneSummary: 'Customer or attendant shows acute anxiety, severe discomfort, or urgency regarding active medical symptoms.',
      detectedKeywords: Array.from(new Set(anxiousKeywordsFound)),
      recommendedAction: 'Provide calm clinical dosage reassurance, check for emergency red flags, and highlight clinic helpline.',
      reassuranceText: 'Immediate dosage guidance: Take first dose with water now. Reassure patient that medication provides relief within 30-45 minutes.'
    };
  }

  // 3. SATISFIED / RECEPTIVE
  if (satisfiedScore === maxScore && satisfiedScore >= 2) {
    const confidence = Math.min(95, Math.max(68, 58 + satisfiedScore * 6));
    return {
      sentiment: 'SATISFIED_RECEPTIVE',
      confidence,
      label: 'Satisfied / Receptive (VIP Potential)',
      toneSummary: 'Customer expresses high satisfaction, loyalty, and recurring chronic medicine consumption.',
      detectedKeywords: Array.from(new Set(satisfiedKeywordsFound)),
      recommendedAction: 'Enroll customer in 30-Day Chronic Refill Program with automated WhatsApp alerts and doorstep delivery.',
      refillPrompt: 'Enroll in 30-Day WhatsApp Refill: Zero-lapse chronic therapy with priority counter discounts.'
    };
  }

  return {
    sentiment: 'NEUTRAL',
    confidence: 60,
    label: 'Neutral / Routine Consultation',
    toneSummary: 'Standard customer interaction.',
    detectedKeywords: [],
    recommendedAction: 'Provide standard medicine dispensing instructions.'
  };
};

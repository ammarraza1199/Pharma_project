import type { CartItem, DrugInteraction } from '../types/pos';
import { MOCK_DRUG_INTERACTIONS } from '../mock/products';

export interface InteractionCheckResult {
  hasMinor: boolean;
  hasMajor: boolean;
  hasContraindicated: boolean;
  interactions: DrugInteraction[];
}

/**
 * Real-Time AI Drug Interaction Checker
 * Scans active cart items and finds clinical drug-drug interaction pairs.
 */
export function analyzeDrugInteractions(cartItems: CartItem[]): InteractionCheckResult {
  if (cartItems.length < 2) {
    return {
      hasMinor: false,
      hasMajor: false,
      hasContraindicated: false,
      interactions: []
    };
  }

  const activeSalts = cartItems.map(item => item.product.saltComposition.toLowerCase());
  const detectedInteractions: DrugInteraction[] = [];

  for (const rule of MOCK_DRUG_INTERACTIONS) {
    const salt1Match = activeSalts.some(salt => salt.includes(rule.drug1.split(' ')[0].toLowerCase()));
    const salt2Match = activeSalts.some(salt => salt.includes(rule.drug2.split(' ')[0].toLowerCase()));

    if (salt1Match && salt2Match) {
      detectedInteractions.push(rule);
    }
  }

  const hasMinor = detectedInteractions.some(i => i.severity === 'MINOR');
  const hasMajor = detectedInteractions.some(i => i.severity === 'MAJOR');
  const hasContraindicated = detectedInteractions.some(i => i.severity === 'CONTRAINDICATED');

  return {
    hasMinor,
    hasMajor,
    hasContraindicated,
    interactions: detectedInteractions
  };
}

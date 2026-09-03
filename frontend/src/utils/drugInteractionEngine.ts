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
export function analyzeDrugInteractions(
  cartItems: CartItem[],
  targetMedicine?: string
): InteractionCheckResult {
  if (cartItems.length < 2) {
    return {
      hasMinor: false,
      hasMajor: false,
      hasContraindicated: false,
      interactions: []
    };
  }

  const activeSalts = cartItems.map(item => item.product.saltComposition.toLowerCase());
  const activeNames = cartItems.map(item => item.product.name.toLowerCase());
  const targetLower = targetMedicine ? targetMedicine.toLowerCase() : null;

  const detectedInteractions: DrugInteraction[] = [];

  for (const rule of MOCK_DRUG_INTERACTIONS) {
    const drug1Prefix = rule.drug1.split(' ')[0].toLowerCase();
    const drug2Prefix = rule.drug2.split(' ')[0].toLowerCase();

    const salt1Match = activeSalts.some(salt => salt.includes(drug1Prefix)) || activeNames.some(name => name.includes(drug1Prefix));
    const salt2Match = activeSalts.some(salt => salt.includes(drug2Prefix)) || activeNames.some(name => name.includes(drug2Prefix));

    if (salt1Match && salt2Match) {
      // When adding a specific medicine, only alert if the interaction directly involves that medicine
      if (targetLower) {
        const involvesTarget = targetLower.includes(drug1Prefix) || targetLower.includes(drug2Prefix);
        if (!involvesTarget) continue;
      }
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

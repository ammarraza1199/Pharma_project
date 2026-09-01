import { DrugInteraction } from '../models/DrugInteraction';

export interface InteractionCheckResult {
  hasMinor: boolean;
  hasMajor: boolean;
  hasContraindicated: boolean;
  interactions: {
    severity: string;
    drug1: string;
    drug2: string;
    description: string;
    clinicalImpact: string;
    management: string;
  }[];
}

/**
 * Check drug-drug interactions for a list of salt compositions.
 * Pairwise matching against the drug_interactions collection.
 */
export async function checkDrugInteractions(
  saltCompositions: string[]
): Promise<InteractionCheckResult> {
  if (saltCompositions.length < 2) {
    return { hasMinor: false, hasMajor: false, hasContraindicated: false, interactions: [] };
  }

  const rules = await DrugInteraction.find();
  const detectedInteractions: any[] = [];

  for (const rule of rules) {
    const drug1Prefix = rule.drug1.split(' ')[0].toLowerCase();
    const drug2Prefix = rule.drug2.split(' ')[0].toLowerCase();

    const salt1Match = saltCompositions.some((s) => s.toLowerCase().includes(drug1Prefix));
    const salt2Match = saltCompositions.some((s) => s.toLowerCase().includes(drug2Prefix));

    if (salt1Match && salt2Match) {
      detectedInteractions.push({
        severity: rule.severity,
        drug1: rule.drug1,
        drug2: rule.drug2,
        description: rule.description,
        clinicalImpact: rule.clinicalImpact,
        management: rule.management,
      });
    }
  }

  return {
    hasMinor: detectedInteractions.some((i) => i.severity === 'MINOR'),
    hasMajor: detectedInteractions.some((i) => i.severity === 'MAJOR'),
    hasContraindicated: detectedInteractions.some((i) => i.severity === 'CONTRAINDICATED'),
    interactions: detectedInteractions,
  };
}

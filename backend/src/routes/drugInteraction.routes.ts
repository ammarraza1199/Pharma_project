import { Router, Response, NextFunction } from 'express';
import { DrugInteraction } from '../models/DrugInteraction';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/drug-interactions
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interactions = await DrugInteraction.find().sort({ severity: 1 });
    res.json({ success: true, data: interactions });
  } catch (err) { next(err); }
});

// POST /api/drug-interactions/check - Analyze multiple drugs / salts for severe interactions
router.post('/check', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { drugs = [], saltCompositions = [] } = req.body;
    const allTerms = [
      ...drugs.map((d: string) => d.toLowerCase().trim()),
      ...saltCompositions.map((s: string) => s.toLowerCase().trim())
    ].filter(Boolean);

    // Default high-alert clinical rules for fallback / baseline safety
    const DEFAULT_RULES = [
      {
        drug1: 'aspirin',
        drug2: 'warfarin',
        severity: 'CONTRAINDICATED',
        description: 'Severe risk of major gastrointestinal and systemic hemorrhage.',
        clinicalImpact: 'Additive anticoagulant and antiplatelet effects causing fatal bleeding.',
        management: 'Avoid concurrent use. Use alternative analgesic (e.g. Paracetamol) under medical supervision.'
      },
      {
        drug1: 'sildenafil',
        drug2: 'nitroglycerin',
        severity: 'CONTRAINDICATED',
        description: 'Potentially fatal, profound systemic hypotension and cardiovascular collapse.',
        clinicalImpact: 'Synergistic cGMP accumulation causing severe refractory vasodilation.',
        management: 'Absolute contraindication. Never administer nitrates within 24-48 hours of PDE5 inhibitors.'
      },
      {
        drug1: 'clopidogrel',
        drug2: 'omeprazole',
        severity: 'MAJOR',
        description: 'Reduced antiplatelet activation and increased risk of thrombotic events / stent thrombosis.',
        clinicalImpact: 'Omeprazole inhibits CYP2C19, blocking metabolic bioactivation of Clopidogrel.',
        management: 'Switch to Pantoprazole or Rabeprazole, which exhibit minimal CYP2C19 inhibition.'
      },
      {
        drug1: 'methotrexate',
        drug2: 'ibuprofen',
        severity: 'CONTRAINDICATED',
        description: 'Severe methotrexate toxicity: bone marrow suppression, leukopenia, nephrotoxicity.',
        clinicalImpact: 'NSAIDs reduce renal methotrexate clearance by competitive inhibition of renal transporters.',
        management: 'Avoid NSAIDs during methotrexate therapy. Monitor serum MTX levels and renal function.'
      },
      {
        drug1: 'atorvastatin',
        drug2: 'clarithromycin',
        severity: 'MAJOR',
        description: 'Markedly increased atorvastatin exposure; high risk of severe rhabdomyolysis and myopathy.',
        clinicalImpact: 'Potent CYP3A4 inhibition by Clarithromycin blocks Atorvastatin elimination.',
        management: 'Temporarily withhold Atorvastatin during macrolide therapy or use Azithromycin.'
      },
      {
        drug1: 'enalapril',
        drug2: 'spironolactone',
        severity: 'MAJOR',
        description: 'Severe hyperkalemia leading to cardiac arrhythmias or arrest.',
        clinicalImpact: 'Dual blockade of renin-angiotensin-aldosterone axis causing potassium retention.',
        management: 'Monitor serum potassium and creatinine frequently; adjust dosages strictly.'
      }
    ];

    // Check DB rules first
    const dbRules = await DrugInteraction.find().lean();
    const rulesToEvaluate = dbRules.length > 0 ? [...dbRules, ...DEFAULT_RULES] : DEFAULT_RULES;

    const detected: any[] = [];
    const seenPairs = new Set<string>();

    for (const rule of rulesToEvaluate) {
      const d1 = rule.drug1.toLowerCase();
      const d2 = rule.drug2.toLowerCase();
      const pairKey = [d1, d2].sort().join(':::');

      if (seenPairs.has(pairKey)) continue;

      const hasDrug1 = allTerms.some(term => term.includes(d1) || d1.includes(term));
      const hasDrug2 = allTerms.some(term => term.includes(d2) || d2.includes(term));

      if (hasDrug1 && hasDrug2) {
        seenPairs.add(pairKey);
        detected.push({
          severity: rule.severity,
          drug1: rule.drug1,
          drug2: rule.drug2,
          description: rule.description,
          clinicalImpact: rule.clinicalImpact,
          management: rule.management
        });
      }
    }

    res.json({
      success: true,
      hasInteractions: detected.length > 0,
      interactions: detected
    });
  } catch (err) { next(err); }
});

// POST /api/drug-interactions
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interaction = await DrugInteraction.create(req.body);
    res.status(201).json({ success: true, data: interaction });
  } catch (err) { next(err); }
});

// PUT /api/drug-interactions/:id
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interaction = await DrugInteraction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!interaction) return res.status(404).json({ success: false, message: 'Interaction not found.' });
    res.json({ success: true, data: interaction });
  } catch (err) { next(err); }
});

// DELETE /api/drug-interactions/:id
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await DrugInteraction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Interaction rule deleted.' });
  } catch (err) { next(err); }
});

export default router;

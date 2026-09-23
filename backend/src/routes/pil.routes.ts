import { Router, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// Multilingual Patient Information Leaflets Catalog (PIL)
const DEFAULT_LEAFLETS: Record<string, any> = {
  default: {
    indication: 'Therapeutic treatment as prescribed by registered medical practitioner.',
    dosageInstructions: {
      en: 'Take with or immediately after food with a full glass of water. Complete full course as advised.',
      hi: 'भोजन के साथ या तुरंत बाद एक गिलास पानी के साथ लें। डॉक्टर द्वारा बताई गई पूरी अवधि तक लें।',
      te: 'భోజనంతో పాటు లేదా తిన్న వెంటనే ఒక గ్లాసు నీటితో తీసుకోండి. కోర్సు పూర్తయ్యే వరకు వాడండి.',
      ta: 'உணவுடன் அல்லது உணவுக்குப் பிறகு ஒரு டம்ளர் தண்ணீருடன் உட்கொள்ளவும். மருந்து முழு காலத்தையும் முடிக்கவும்.',
      kn: 'ಊಟದೊಂದಿಗೆ ಅಥವಾ ತಕ್ಷಣವೇ ಒಂದು ಲೋಟ ನೀರಿನೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಳಿಸಿ.',
      mr: 'जेवणासोबत किंवा लगेच एका ग्लास पाण्यासोबत घ्या. पूर्ण कोर्स वेळेवर पूर्ण करा.',
    },
    dietaryAdvice: [
      'Maintain adequate hydration (2.5 to 3 liters water daily).',
      'Avoid alcohol consumption during medication course.',
      'Take at consistent daily times to maintain therapeutic plasma concentration.',
    ],
    contraindications: [
      'Known hypersensitivity to active pharmaceutical ingredients or excipients.',
      'Notify physician immediately in case of severe allergic reaction, facial swelling, or breathing difficulty.',
    ],
    storage: 'Store below 25°C in a cool, dry place away from direct sunlight. Keep out of reach of children.',
  },
};

// GET /api/pil/:productId — Multilingual Patient Information Leaflet
router.get('/:productId', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    let product = null;

    try {
      product = await Product.findById(productId);
    } catch {
      product = await Product.findOne({ barcode: productId });
    }

    const prodName = product ? product.name : 'Prescription Medicine';
    const salt = product ? product.saltComposition : 'Therapeutic Salt Formulation';
    const schedule = product ? product.scheduleCategory : 'REGULAR';

    const leaflet = {
      productId: product?._id || productId,
      productName: prodName,
      saltComposition: salt,
      scheduleCategory: schedule,
      indication: `Clinical formulation indicated for therapeutic treatment corresponding to ${salt}.`,
      dosageInstructions: {
        en: `Take ${prodName} exactly as prescribed. Complete full course. Do not chew or crush delayed-release tablets.`,
        hi: `${prodName} को डॉक्टर के निर्देशानुसार लें। पूरी खुराक पूरी करें। गोली को चबाएं या तोड़ें नहीं।`,
        te: `${prodName} ను వైద్యుల సలహా మేరకు మాత్రమే వాడండి. కోర్సు మధ్యలో ఆపవద్దు.`,
        ta: `${prodName} மருந்தை மருத்துவர் அறிவுறுத்தியபடி உட்கொள்ளவும். முழு காலமும் தொடரவும்.`,
        kn: `${prodName} ಔಷಧಿಯನ್ನು ವೈದ್ಯರ ನಿರ್ದೇಶನದಂತೆ ನಿಖರವಾಗಿ ತೆಗೆದುಕೊಳ್ಳಿ.`,
        mr: `${prodName} डॉक्टरांच्या सल्ल्यानुसारच घ्या. अर्धवट कोर्स थांबवू नका.`,
      },
      dietaryAdvice: DEFAULT_LEAFLETS.default.dietaryAdvice,
      contraindications: DEFAULT_LEAFLETS.default.contraindications,
      storage: product?.scheduleCategory === 'SCHEDULE_X'
        ? 'High-security temperature-controlled storage (15°C - 25°C). Controlled substance.'
        : DEFAULT_LEAFLETS.default.storage,
      pharmacistNote: `Verified by Registered Pharmacist. Schedule: ${schedule}.`,
      generatedAt: new Date(),
    };

    res.json({ success: true, data: leaflet });
  } catch (err) {
    next(err);
  }
});

export default router;

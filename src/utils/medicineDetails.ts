import type { Product, MedicineType } from '../types/pos';

export interface MedicineDetailsInfo {
  packSize: string;
  unitsPerPack: number;
  packType: string;
  medicineType: MedicineType;
  dosageForm: string;
}

export function getMedicineDetails(product: Product): MedicineDetailsInfo {
  if (!product) {
    return {
      packSize: '10 Tablets in a Strip',
      unitsPerPack: 10,
      packType: 'Strip',
      medicineType: 'Oral',
      dosageForm: 'Tablet',
    };
  }

  const name = product.name || '';
  const nameUpper = name.toUpperCase();

  let packSize = product.packSize;
  let unitsPerPack = product.unitsPerPack;
  let packType = product.packType;
  let medicineType = product.medicineType;
  let dosageForm = product.dosageForm;

  if (!unitsPerPack || !packSize || !medicineType) {
    if (nameUpper.includes('AUGMENTIN') || nameUpper.includes('DOLO') || nameUpper.includes('CROCIN') || nameUpper.includes('GABAPENTIN')) {
      unitsPerPack = 15;
      packType = 'Strip';
      packSize = '15 Tablets in a Strip';
      medicineType = 'Oral';
      dosageForm = 'Tablet';
    } else if (nameUpper.includes('SYRUP') || nameUpper.includes('SUSPENSION') || nameUpper.includes('LIQUID') || nameUpper.includes('BENADRYL')) {
      unitsPerPack = 1;
      packType = 'Bottle';
      packSize = '100ml Bottle';
      medicineType = 'Oral';
      dosageForm = 'Syrup';
    } else if (nameUpper.includes('INJECTION') || nameUpper.includes('VIAL') || nameUpper.includes('AMPOULE') || nameUpper.includes('INSULIN')) {
      unitsPerPack = 1;
      packType = 'Vial';
      packSize = '1 Injection Vial';
      medicineType = 'Injectable';
      dosageForm = 'Injection';
    } else if (nameUpper.includes('OINTMENT') || nameUpper.includes('CREAM') || nameUpper.includes('GEL') || nameUpper.includes('BETADINE')) {
      unitsPerPack = 1;
      packType = 'Tube';
      packSize = '30g Tube';
      medicineType = 'Topical';
      dosageForm = 'Ointment';
    } else if (nameUpper.includes('CAPSULE') || nameUpper.includes('CAP') || nameUpper.includes('BECADEXAMIN')) {
      unitsPerPack = 10;
      packType = 'Strip';
      packSize = '10 Capsules in a Strip';
      medicineType = 'Oral';
      dosageForm = 'Capsule';
    } else if (nameUpper.includes('DROPS') || nameUpper.includes('EYE') || nameUpper.includes('EAR')) {
      unitsPerPack = 1;
      packType = 'Bottle';
      packSize = '10ml Drop Bottle';
      medicineType = 'Ophthalmic';
      dosageForm = 'Drops';
    } else {
      unitsPerPack = 10;
      packType = 'Strip';
      packSize = '10 Tablets in a Strip';
      medicineType = 'Oral';
      dosageForm = 'Tablet';
    }
  }

  return {
    packSize: product.packSize || packSize || '10 Tablets in a Strip',
    unitsPerPack: product.unitsPerPack || unitsPerPack || 10,
    packType: product.packType || packType || 'Strip',
    medicineType: product.medicineType || medicineType || 'Oral',
    dosageForm: product.dosageForm || dosageForm || 'Tablet',
  };
}

export function calculateTotalUnits(quantity: number, product: Product): { totalUnits: number; unitLabel: string } {
  const details = getMedicineDetails(product);
  const totalUnits = quantity * details.unitsPerPack;
  const unitLabel = details.dosageForm === 'Tablet' ? 'Tablets' : details.dosageForm === 'Capsule' ? 'Capsules' : 'Units';
  return { totalUnits, unitLabel };
}

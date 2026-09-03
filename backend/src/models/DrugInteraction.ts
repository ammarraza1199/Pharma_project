import mongoose, { Schema, Document } from 'mongoose';

export interface IDrugInteraction extends Document {
  severity: 'MINOR' | 'MAJOR' | 'CONTRAINDICATED';
  drug1: string;
  drug2: string;
  description: string;
  clinicalImpact: string;
  management: string;
}

const DrugInteractionSchema = new Schema<IDrugInteraction>(
  {
    severity: {
      type: String,
      enum: ['MINOR', 'MAJOR', 'CONTRAINDICATED'],
      required: true,
    },
    drug1: { type: String, required: true },
    drug2: { type: String, required: true },
    description: { type: String, required: true },
    clinicalImpact: { type: String, required: true },
    management: { type: String, required: true },
  },
  { timestamps: true }
);

export const DrugInteraction = mongoose.model<IDrugInteraction>(
  'DrugInteraction',
  DrugInteractionSchema
);

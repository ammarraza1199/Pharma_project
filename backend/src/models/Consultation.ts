import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultation extends Document {
  consultationId: string;
  patientName: string;
  phone: string;
  age?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  date: string;
  time: string;
  durationSeconds: number;
  audioUrl?: string;
  audioBlobBase64?: string;
  category: 'CHRONIC_CARE' | 'DOSAGE_ADMIN' | 'ALLERGY_WARNING' | 'OTC_GUIDANCE' | 'PEDIATRIC_GERIATRIC' | 'GENERAL_ADVICE';
  chiefDiscussion: string;
  pharmacistAdvice: string;
  tags: string[];
  pharmacistName: string;
  counterNumber?: number;
  sessionId?: string;
  sentimentResult?: {
    sentiment: string;
    score: number;
    discountRecommended?: number;
    keyPhrases?: string[];
  };
  linkedValueAddedServices?: any[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
    consultationId: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: String, default: '' },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    audioUrl: { type: String },
    audioBlobBase64: { type: String },
    category: {
      type: String,
      enum: ['CHRONIC_CARE', 'DOSAGE_ADMIN', 'ALLERGY_WARNING', 'OTC_GUIDANCE', 'PEDIATRIC_GERIATRIC', 'GENERAL_ADVICE'],
      default: 'GENERAL_ADVICE',
    },
    chiefDiscussion: { type: String, required: true },
    pharmacistAdvice: { type: String, required: true },
    tags: [{ type: String }],
    pharmacistName: { type: String, required: true },
    counterNumber: { type: Number, default: 1 },
    sessionId: { type: String },
    sentimentResult: {
      sentiment: String,
      score: Number,
      discountRecommended: Number,
      keyPhrases: [String],
    },
    linkedValueAddedServices: [Schema.Types.Mixed],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Consultation = mongoose.model<IConsultation>('Consultation', ConsultationSchema);

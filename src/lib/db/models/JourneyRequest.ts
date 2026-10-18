import mongoose, { Document, Schema, Types } from 'mongoose'

/** A user asking to create more journeys than their account allows. */
export interface IJourneyRequest extends Document {
  adminId: Types.ObjectId
  email: string
  name: string
  message: string
  journeyLimitAtRequest: number
  status: 'pending' | 'handled'
  createdAt: Date
}

const JourneyRequestSchema = new Schema<IJourneyRequest>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    email: { type: String, required: true },
    name: { type: String, default: '' },
    message: { type: String, default: '', maxlength: 500, trim: true },
    journeyLimitAtRequest: { type: Number, default: 2 },
    status: { type: String, enum: ['pending', 'handled'], default: 'pending', index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const JourneyRequest =
  mongoose.models.JourneyRequest || mongoose.model<IJourneyRequest>('JourneyRequest', JourneyRequestSchema)

import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IProposalResponse extends Document {
  journeyId: Types.ObjectId
  sessionId: Types.ObjectId
  response: 'yes' | 'no'
  submittedAt: Date
}

const ProposalResponseSchema = new Schema<IProposalResponse>(
  {
    journeyId: { type: Schema.Types.ObjectId, ref: 'Journey', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'JourneySession', required: true },
    response: { type: String, enum: ['yes', 'no'], required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    // Immutable record — no updatedAt
    timestamps: { createdAt: 'submittedAt', updatedAt: false },
  }
)

// Enforce one response per session
ProposalResponseSchema.index({ journeyId: 1, sessionId: 1 }, { unique: true })

export const ProposalResponse =
  mongoose.models.ProposalResponse ||
  mongoose.model<IProposalResponse>('ProposalResponse', ProposalResponseSchema)

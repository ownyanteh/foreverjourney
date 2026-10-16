import mongoose, { Document, Schema, Types } from 'mongoose'

export type SessionStatus = 'active' | 'completed' | 'abandoned'
export type ResponseStatus = 'pending' | 'yes' | 'no'

export interface IJourneySession extends Document {
  journeyId: Types.ObjectId
  sessionTokenHash: string
  status: SessionStatus
  startedAt: Date
  lastActivityAt: Date
  currentCheckpointIndex: number
  completedCheckpointIds: Types.ObjectId[]
  finalDestinationUnlockedAt: Date | null
  responseStatus: ResponseStatus | null
  responseSubmittedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const JourneySessionSchema = new Schema<IJourneySession>(
  {
    journeyId: { type: Schema.Types.ObjectId, ref: 'Journey', required: true, index: true },
    sessionTokenHash: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    currentCheckpointIndex: { type: Number, default: 0 },
    completedCheckpointIds: [{ type: Schema.Types.ObjectId, ref: 'Checkpoint' }],
    finalDestinationUnlockedAt: { type: Date, default: null },
    responseStatus: {
      type: String,
      enum: ['pending', 'yes', 'no', null],
      default: null,
    },
    responseSubmittedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

JourneySessionSchema.index({ sessionTokenHash: 1 }, { unique: true })
JourneySessionSchema.index({ journeyId: 1 })

export const JourneySession =
  mongoose.models.JourneySession ||
  mongoose.model<IJourneySession>('JourneySession', JourneySessionSchema)

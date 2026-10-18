import mongoose, { Document, Schema, Types } from 'mongoose'

export type EventType =
  | 'journey_started'
  | 'checkpoint_unlocked'
  | 'checkpoint_skipped'
  | 'final_destination_unlocked'
  | 'questions_completed'
  | 'proposal_response_submitted'
  | 'journey_completed'
  | 'memory_shared'
  | 'journey_reset'

export interface IJourneyEvent extends Document {
  journeyId: Types.ObjectId
  sessionId: Types.ObjectId
  eventType: EventType
  checkpointId?: Types.ObjectId | null
  metadata: Record<string, unknown>
  timestamp: Date
}

const JourneyEventSchema = new Schema<IJourneyEvent>(
  {
    journeyId: { type: Schema.Types.ObjectId, ref: 'Journey', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'JourneySession', required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'journey_started',
        'checkpoint_unlocked',
        'checkpoint_skipped',
        'final_destination_unlocked',
        'questions_completed',
        'proposal_response_submitted',
        'journey_completed',
        'memory_shared',
        'journey_reset',
      ],
      required: true,
      index: true,
    },
    checkpointId: { type: Schema.Types.ObjectId, ref: 'Checkpoint', default: null },
    // Metadata must never contain raw tokens, precise GPS trails, or session secrets
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  {
    // No updatedAt — events are immutable
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
)

JourneyEventSchema.index({ journeyId: 1, timestamp: -1 })
JourneyEventSchema.index({ sessionId: 1, timestamp: -1 })

export const JourneyEvent =
  mongoose.models.JourneyEvent ||
  mongoose.model<IJourneyEvent>('JourneyEvent', JourneyEventSchema)

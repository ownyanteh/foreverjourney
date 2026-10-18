import mongoose, { Document, Schema, Types } from 'mongoose'

export type SessionStatus = 'active' | 'completed' | 'abandoned'
export type ResponseStatus = 'pending' | 'yes' | 'no'

export interface IQuestionAnswer {
  questionIndex: number
  prompt: string // snapshot of the question as she saw it
  feeling: string | null
  answer: string
  answeredAt: Date
}

export interface IJourneySession extends Document {
  journeyId: Types.ObjectId
  sessionTokenHash: string
  status: SessionStatus
  startedAt: Date
  lastActivityAt: Date
  currentCheckpointIndex: number
  completedCheckpointIds: Types.ObjectId[]
  finalDestinationUnlockedAt: Date | null
  questionAnswers: IQuestionAnswer[]
  responseStatus: ResponseStatus | null
  responseSubmittedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const QuestionAnswerSchema = new Schema<IQuestionAnswer>(
  {
    questionIndex: { type: Number, required: true, min: 0 },
    prompt: { type: String, default: '' },
    feeling: { type: String, default: null },
    answer: { type: String, default: '', maxlength: 2000 },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

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
    // Set when the proposal is unlocked: arrival at the final destination, or
    // answering every memory question in 'questions' mode
    finalDestinationUnlockedAt: { type: Date, default: null },
    questionAnswers: { type: [QuestionAnswerSchema], default: [] },
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

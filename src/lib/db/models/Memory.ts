import mongoose, { Document, Schema, Types } from 'mongoose'

/**
 * A photo and/or message the recipient shares at the final destination.
 */
export interface IMemory extends Document {
  journeyId: Types.ObjectId
  sessionId: Types.ObjectId
  imageUrl: string | null
  imagePublicId: string | null
  width: number | null
  height: number | null
  message: string
  createdAt: Date
}

const MemorySchema = new Schema<IMemory>(
  {
    journeyId: { type: Schema.Types.ObjectId, ref: 'Journey', required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'JourneySession', required: true },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    message: { type: String, default: '', maxlength: 1000, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

MemorySchema.index({ journeyId: 1, createdAt: -1 })
MemorySchema.index({ sessionId: 1, createdAt: -1 })

export const Memory =
  mongoose.models.Memory || mongoose.model<IMemory>('Memory', MemorySchema)

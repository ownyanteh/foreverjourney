import mongoose, { Document, Schema, Types } from 'mongoose'

export interface ICheckpointContent {
  instructionText: string
  romanticMessage: string
  imageUrl?: string | null
  audioUrl?: string | null
  clue?: string | null
  unlockAnimation?: string | null
}

export interface ICheckpoint extends Document {
  journeyId: Types.ObjectId
  sequence: number
  title: string
  coordinates: {
    latitude: number
    longitude: number
  }
  geofenceRadius: number
  required: boolean
  skippable: boolean
  content: ICheckpointContent
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CheckpointContentSchema = new Schema<ICheckpointContent>(
  {
    instructionText: { type: String, default: '' },
    romanticMessage: { type: String, default: '' },
    imageUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    clue: { type: String, default: null },
    unlockAnimation: { type: String, default: null },
  },
  { _id: false }
)

const CheckpointSchema = new Schema<ICheckpoint>(
  {
    journeyId: {
      type: Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
      index: true,
    },
    sequence: { type: Number, required: true, min: 0 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    coordinates: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    geofenceRadius: { type: Number, default: 50, min: 10, max: 500 },
    required: { type: Boolean, default: true },
    skippable: { type: Boolean, default: false },
    content: { type: CheckpointContentSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CheckpointSchema.index({ journeyId: 1, sequence: 1 })

export const Checkpoint =
  mongoose.models.Checkpoint ||
  mongoose.model<ICheckpoint>('Checkpoint', CheckpointSchema)

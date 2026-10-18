import mongoose, { Document, Schema, Types } from 'mongoose'

export type JourneyStatus = 'draft' | 'active' | 'completed' | 'deactivated'

/** 'route': GPS checkpoints + final destination. 'questions': memory questions, then the proposal. */
export type JourneyMode = 'route' | 'questions'

export interface IMemoryQuestion {
  prompt: string
  hint: string
}

export interface IWelcomeContent {
  greeting: string
  introduction: string
  backgroundImageUrl?: string | null
  musicUrl?: string | null
}

export interface ITheme {
  primaryColor: string
  accentColor: string
  backgroundColor: string
}

export interface IProposalContent {
  title: string
  mainMessage: string
  finalQuestion: string
  yesLabel: string
  noLabel: string
  yesMessage: string
  noMessage: string
  backgroundImageUrl?: string | null
  couplePhotoUrl?: string | null
  musicUrl?: string | null
}

export interface IFinalDestination {
  name: string
  latitude: number
  longitude: number
  geofenceRadius: number
  approachingRadius: number
  approachingMessage: string
  finalClue?: string | null
  manualFallbackEnabled: boolean
}

export interface IJourney extends Document {
  adminId: Types.ObjectId
  title: string
  status: JourneyStatus
  mode: JourneyMode
  memoryQuestions: IMemoryQuestion[]
  welcomeContent: IWelcomeContent
  theme: ITheme
  proposalContent: IProposalContent
  finalDestination: IFinalDestination
  invitationTokenHash?: string | null
  invitationToken?: string | null  // Transient: returned once, not persisted
  invitationExpiresAt?: Date | null
  invitationRevokedAt?: Date | null
  activatedAt?: Date | null
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const WelcomeContentSchema = new Schema<IWelcomeContent>(
  {
    greeting: { type: String, default: 'Hey, my love.' },
    introduction: {
      type: String,
      default:
        "I've planned a little adventure for you. Follow the clues, enjoy the journey, and trust that every step has a reason. Are you ready?",
    },
    backgroundImageUrl: { type: String, default: null },
    musicUrl: { type: String, default: null },
  },
  { _id: false }
)

const ThemeSchema = new Schema<ITheme>(
  {
    primaryColor: { type: String, default: '#7A2038' },
    accentColor: { type: String, default: '#D8B46A' },
    backgroundColor: { type: String, default: '#FFF8F0' },
  },
  { _id: false }
)

const ProposalContentSchema = new Schema<IProposalContent>(
  {
    title: { type: String, default: 'You made it, my love.' },
    mainMessage: {
      type: String,
      default:
        "You are the person I want to spend every adventure with. Every moment with you is a treasure I never want to lose.",
    },
    finalQuestion: { type: String, default: 'Will you marry me?' },
    yesLabel: { type: String, default: 'YES! ❤️' },
    noLabel: { type: String, default: 'No' },
    yesMessage: {
      type: String,
      default:
        "Today, our next adventure begins. I can't wait to build a lifetime of beautiful memories with you.",
    },
    noMessage: {
      type: String,
      default:
        "Thank you for being honest with me. Whatever your answer, I appreciate you and respect your decision.",
    },
    backgroundImageUrl: { type: String, default: null },
    couplePhotoUrl: { type: String, default: null },
    musicUrl: { type: String, default: null },
  },
  { _id: false }
)

const FinalDestinationSchema = new Schema<IFinalDestination>(
  {
    name: { type: String, default: 'The Final Destination' },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    geofenceRadius: { type: Number, default: 50, min: 10, max: 500 },
    approachingRadius: { type: Number, default: 200, min: 50, max: 2000 },
    approachingMessage: {
      type: String,
      default: "You're almost there. Take a deep breath. Something special is waiting for you.",
    },
    finalClue: { type: String, default: null },
    manualFallbackEnabled: { type: Boolean, default: false },
  },
  { _id: false }
)

const MemoryQuestionSchema = new Schema<IMemoryQuestion>(
  {
    prompt: { type: String, required: true, trim: true, maxlength: 300 },
    hint: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { _id: false }
)

const JourneySchema = new Schema<IJourney>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'deactivated'],
      default: 'draft',
    },
    mode: { type: String, enum: ['route', 'questions'], default: 'route' },
    memoryQuestions: { type: [MemoryQuestionSchema], default: [] },
    welcomeContent: { type: WelcomeContentSchema, default: () => ({}) },
    theme: { type: ThemeSchema, default: () => ({}) },
    proposalContent: { type: ProposalContentSchema, default: () => ({}) },
    finalDestination: { type: FinalDestinationSchema },
    invitationTokenHash: { type: String, default: null, index: true, sparse: true },
    invitationExpiresAt: { type: Date, default: null },
    invitationRevokedAt: { type: Date, default: null },
    activatedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

JourneySchema.index({ adminId: 1, status: 1 })
JourneySchema.index({ invitationTokenHash: 1 }, { sparse: true })

export const Journey =
  mongoose.models.Journey || mongoose.model<IJourney>('Journey', JourneySchema)

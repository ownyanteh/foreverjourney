import mongoose, { Document, Schema } from 'mongoose'

export interface IAdminUser extends Document {
  name: string
  email: string
  passwordHash: string
  resetTokenHash: string | null
  resetTokenExpiresAt: Date | null
  role: 'admin'
  journeyLimit: number
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    // Display name, used to greet the user on their dashboard
    name: { type: String, default: '', trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // Forgot-password: only a hash of the emailed token is stored
    resetTokenHash: { type: String, default: null, index: true, sparse: true, select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false },
    passwordHash: {
      type: String,
      required: true,
    },
    // How many journeys this account may create. Raise it per account to grant more.
    journeyLimit: { type: Number, default: 2, min: 0 },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

AdminUserSchema.index({ email: 1 })

// Never return passwordHash in JSON
AdminUserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash
    delete ret.resetTokenHash
    delete ret.resetTokenExpiresAt
    return ret
  },
})

export const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema)

import mongoose, { Document, Schema } from 'mongoose'

export interface IAdminUser extends Document {
  email: string
  passwordHash: string
  role: 'admin'
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
    },
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
    return ret
  },
})

export const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema)

import mongoose from 'mongoose'

export interface UserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId
  username: string
  password: string
  email?: string
  avatarFileId?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new mongoose.Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    },
    avatarFileId: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
)

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema)

import mongoose from 'mongoose'

export interface FileDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId
  originalName: string
  filename: string
  mimeType: string
  size: number
  compressedSize: number
  path: string
  uploadedBy?: string
  isCompressed: boolean
  compressionRatio: number
  checksum: string
  createdAt: Date
  updatedAt: Date
  storageType: 'local' | 'cloudinary'
  cloudinaryId?: string
}

const FileSchema = new mongoose.Schema<FileDocument>(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    filename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 255
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    compressedSize: {
      type: Number,
      required: true,
      min: 0
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    uploadedBy: {
      type: String,
      required: false,
      trim: true
    },
    isCompressed: {
      type: Boolean,
      required: true,
      default: false
    },
    compressionRatio: {
      type: Number,
      required: true,
      min: 0,
      default: 1.0
    },
    checksum: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128
    },
    storageType: {
      type: String,
      required: true,
      enum: ['local', 'cloudinary'],
      default: 'local'
    },
    cloudinaryId: {
      type: String,
      required: false,
      trim: true,
      maxlength: 255
    }
  },
  {
    timestamps: true,
    collection: 'files'
  }
)

FileSchema.index({ originalName: 1 })
FileSchema.index({ uploadedBy: 1 })
FileSchema.index({ mimeType: 1 })
FileSchema.index({ createdAt: -1 })
FileSchema.index({ checksum: 1 })

export const FileModel =
  mongoose.models.File || mongoose.model<FileDocument>('File', FileSchema)

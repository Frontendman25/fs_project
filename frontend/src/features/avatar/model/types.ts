/**
 * Props for the AvatarUploader component
 */
export interface AvatarUploaderProps {
  /** User ID for avatar upload */
  userId: string
  /** Current avatar URL to display */
  avatarUrl?: string | null
  /** Username for fallback display */
  username?: string
  /** Additional CSS classes */
  className?: string
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number
  /** Accepted MIME types */
  accept?: string
  /** Size of the avatar (default: 'default') */
  size?: 'sm' | 'default' | 'lg' | 'xl'
}

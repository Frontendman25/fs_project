export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let value = bytes

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  return `${Math.round(value * 10) / 10} ${units[index]}`
}

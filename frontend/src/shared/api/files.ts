import { apiClient } from './client'

/**
 * Binary file download stays outside RTK Query: it returns a Blob (not a
 * cacheable JSON resource) and triggers a browser side-effect.
 */
export const filesApi = {
  /**
   * Download a file by ID as a Blob.
   * @param fileId - ID of the file to download
   */
  async downloadFile(fileId: string): Promise<Blob> {
    return apiClient.downloadFile(`/api/files/${fileId}`)
  }
}

/**
 * Fetches a file and triggers a browser "Save as" via a transient object URL.
 * @param fileId - ID of the file to download
 * @param filename - Suggested filename for the download
 */
export async function downloadFileToDisk(
  fileId: string,
  filename: string
): Promise<void> {
  const blob = await filesApi.downloadFile(fileId)

  const url = window.URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    window.URL.revokeObjectURL(url)
  }
}

export type SaveResult = 'shared' | 'downloaded' | 'cancelled'

// On iPhone this opens the share sheet ("Save to Files" → iCloud Drive).
// Elsewhere, or if sharing files isn't supported, it downloads the file.
export async function saveFile(contents: string, fileName: string, type = 'application/json'): Promise<SaveResult> {
  const file = new File([contents], fileName, { type })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Any other failure: fall through to a download.
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}

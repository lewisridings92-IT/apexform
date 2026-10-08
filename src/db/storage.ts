// Ask the browser not to clear our data when the device is low on space.
// On iPhone this is only granted reliably once the app is on the home screen.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function isStoragePersisted(): Promise<boolean> {
  return (await navigator.storage?.persisted?.()) ?? false
}

// True when opened from the home-screen icon rather than a Safari tab.
export function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

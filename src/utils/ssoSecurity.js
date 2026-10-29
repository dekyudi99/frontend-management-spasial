/**
 * Utilitas validasi URL returnTo untuk VoxaGIS (mencegah Open Redirect).
 * Aturan:
 * 1. Harus string dan diawali satu '/'
 * 2. Tidak boleh diawali '//' (protokol relatif)
 * 3. Tidak boleh memuat skema/protokol eksternal (http:, https:, javascript:, data:)
 * 4. Tidak boleh mengarah kembali ke '/sso/start' (mencegah loop)
 * 
 * @param {string|null|undefined} returnTo
 * @param {string} defaultPath
 * @returns {string} path relatif internal yang aman
 */
export const validateReturnTo = (returnTo, defaultPath = '/dashboard') => {
  if (!returnTo || typeof returnTo !== 'string') {
    return defaultPath
  }

  const trimmed = returnTo.trim()

  // Harus diawali satu '/' dan bukan '//'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return defaultPath
  }

  // Tidak boleh memuat skema (misal: 'javascript:', 'https:', dsb)
  if (trimmed.includes(':')) {
    return defaultPath
  }

  // Tidak boleh mengarah ke rute /sso/start
  if (trimmed.startsWith('/sso/start')) {
    return defaultPath
  }

  return trimmed
}

export default validateReturnTo

import { setOidcAccessToken, getOidcUserManager } from './oidcTokenService'

let isTerminating = false

/**
 * Pembersihan sesi lokal secara menyeluruh (DRY).
 * Digunakan saat sesi OP berakhir di tab lain, renewal gagal, atau 401 tak terpulihkan.
 * PENTING: Jangan memanggil signoutRedirect() di sini untuk mencegah loop logout antar-aplikasi.
 */
export const terminateLocalSession = async (reason = 'Sesi berakhir') => {
  if (isTerminating) return
  isTerminating = true

  try {
    // 1. Bersihkan in-memory token
    setOidcAccessToken(null)

    // 2. Bersihkan local storage
    localStorage.removeItem('JWT_TOKEN')
    localStorage.removeItem('astragis_s2s_key')

    // 3. Bersihkan token OIDC di sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        Object.keys(window.sessionStorage).forEach((k) => {
          if (k.startsWith('oidc.user:')) {
            window.sessionStorage.removeItem(k)
          }
        })
      } catch {
        // Ignore storage error
      }
      window.sessionStorage.setItem('SESSION_EXPIRED', 'true')
      if (reason) {
        window.sessionStorage.setItem('SESSION_TERMINATED_MSG', reason)
      }
    }

    // 4. Bersihkan user dari UserManager oidc-client-ts
    const userManager = getOidcUserManager()
    if (userManager) {
      try {
        await userManager.removeUser()
      } catch {
        // Ignore userManager error
      }
    }
  } finally {
    // 5. Arahkan pengguna ke landing page jika sedang di halaman terlindungi
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath !== '/' && !currentPath.startsWith('/auth')) {
        window.location.replace('/')
      }
    }

    setTimeout(() => {
      isTerminating = false
    }, 2000)
  }
}

let _accessToken = null
let _userManager = null

export const setOidcAccessToken = (token) => {
  _accessToken = token || null
}

export const setOidcUserManager = (manager) => {
  _userManager = manager || null
}

export const getOidcUserManager = () => _userManager

export const getOidcAccessToken = () => {
  if (_accessToken) return _accessToken

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i)
        if (key && key.startsWith('oidc.user:')) {
          const raw = window.sessionStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.access_token) {
              _accessToken = parsed.access_token
              return _accessToken
            }
          }
        }
      }
    } catch {
      // Ignore parse error
    }
  }

  return null
}

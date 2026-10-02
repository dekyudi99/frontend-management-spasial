/**
 * Centralized Locale-Aware Formatting Utilities for AstraGIS
 * Supports EN, ID, TH based on active language
 */

const LOCALE_MAP = {
  id: 'id-ID',
  th: 'th-TH',
  en: 'en-US'
}

/**
 * Format a Date object or ISO string based on user language
 * @param {Date|string|number} date 
 * @param {string} language - 'id' | 'th' | 'en'
 * @param {Intl.DateTimeFormatOptions} options 
 * @returns {string}
 */
export function formatDate(date, language = 'en', options = {}) {
  if (!date) return '-'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return String(date)
    const locale = LOCALE_MAP[language] || 'en-US'

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }

    return new Intl.DateTimeFormat(locale, defaultOptions).format(d)
  } catch (err) {
    return String(date)
  }
}

/**
 * Format a Date object or ISO string with time
 * @param {Date|string|number} date 
 * @param {string} language 
 * @returns {string}
 */
export function formatDateTime(date, language = 'en') {
  return formatDate(date, language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format numbers with proper thousands separators according to locale
 * @param {number} num 
 * @param {string} language 
 * @param {Intl.NumberFormatOptions} options 
 * @returns {string}
 */
export function formatNumber(num, language = 'en', options = {}) {
  if (num === null || num === undefined) return '-'
  try {
    const locale = LOCALE_MAP[language] || 'en-US'
    return new Intl.NumberFormat(locale, options).format(num)
  } catch (err) {
    return String(num)
  }
}

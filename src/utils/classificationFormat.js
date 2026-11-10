/**
 * Pure functions for number parsing, formatting, and classification display labels.
 */

/**
 * Menerima string input angka lokal (mis. "1,5" atau "1.5") atau number.
 * Mengembalikan Number yang valid atau null jika input tidak valid / bukan angka finit.
 *
 * @param {string|number|null|undefined} input
 * @returns {number|null}
 */
export function parseNumberInput(input) {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }
  const str = String(input).trim();
  if (str === "") return null;

  // Ganti koma desimal dengan titik
  const normalized = str.replace(",", ".");
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return num;
}

/**
 * Format angka batas kelas agar jumlah desimal menyesuaikan skala data
 * (mis. data bulat -> tanpa desimal, nilai sangat kecil -> desimal presisi, tanpa trailing zero).
 * Titik desimal selalu ".". Nilai asli internal tidak boleh diubah oleh fungsi ini.
 *
 * @param {number} value - Nilai angka yang akan diformat
 * @param {number} [min] - Nilai minimum data (opsional, untuk skala)
 * @param {number} [max] - Nilai maksimum data (opsional, untuk skala)
 * @returns {string}
 */
export function formatBound(value, min, max) {
  if (!Number.isFinite(value)) return "";

  // Jika murni integer
  if (Number.isInteger(value)) {
    return String(value);
  }

  // Tentukan skala rentang data
  let span = 1;
  if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
    span = max - min;
  } else if (value !== 0) {
    span = Math.abs(value);
  }

  // Jika data min dan max keduanya bulat dan value juga bulat
  if (
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    Number.isInteger(min) &&
    Number.isInteger(max) &&
    Number.isInteger(value)
  ) {
    return String(value);
  }

  // Tentukan jumlah desimal berdasarkan span data
  let decimals = 2;
  if (span < 0.001) decimals = 6;
  else if (span < 0.01) decimals = 5;
  else if (span < 0.1) decimals = 4;
  else if (span < 1) decimals = 3;
  else decimals = 2;

  let formatted = value.toFixed(decimals);
  if (formatted.includes(".")) {
    formatted = formatted.replace(/\.?0+$/, "");
  }

  // Jika angka non-zero terbulatkan menjadi "0" atau "-0", berikan presisi ekstra
  if (Number(formatted) === 0 && value !== 0) {
    formatted = value.toFixed(8).replace(/\.?0+$/, "");
  }

  return formatted;
}

/**
 * Menghasilkan label interval kelas otomatis dari min dan max.
 *
 * @param {number} minVal
 * @param {number} maxVal
 * @param {number} [minData]
 * @param {number} [maxData]
 * @param {string} [method]
 * @returns {string}
 */
export function formatClassLabel(minVal, maxVal, minData, maxData, method = "intervals") {
  if (method === "unique_values") {
    return `Value ${formatBound(minVal, minData, maxData)}`;
  }
  const minStr = formatBound(minVal, minData, maxData);
  const maxStr = formatBound(maxVal, minData, maxData);
  return `${minStr} - ${maxStr}`;
}


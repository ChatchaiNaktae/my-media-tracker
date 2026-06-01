/**
 * Escapes HTML special characters to prevent XSS when inserting
 * user-controlled data into innerHTML templates.
 */
export function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Validates that a URL string is safe to use as an href or src.
 * Rejects javascript:, data: (except image data), and vbscript: protocols.
 * Returns the URL if safe, or an empty string if not.
 */
export function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    // Allow relative URLs, http, https, and mailto only
    if (/^(https?:|mailto:|#|\/)/i.test(trimmed)) return trimmed;
    // Block javascript:, data:text/html, vbscript:, etc.
    if (/^(javascript|data|vbscript|blob|about):/i.test(trimmed)) return '';
    // If no protocol, assume https
    if (trimmed && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
        return 'https://' + trimmed;
    }
    return '';
}

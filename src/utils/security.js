/**
 * Utilidades de Seguridad Defensiva (11FUT MANAGER)
 * Previene Cross-Site Scripting (XSS), inyecciones y manipulación de URLs.
 */

/**
 * Escapa caracteres especiales de HTML para inserción segura en el DOM.
 * @param {string|any} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valida si una URL es segura para usar en atributos src / href.
 * Bloquea esquemas peligrosos como javascript:, vbscript: o data:text/html.
 * @param {string} url 
 * @returns {boolean}
 */
export function isSafeURL(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('vbscript:') || clean.startsWith('data:text/html')) {
    return false;
  }
  return clean.startsWith('http://') || 
         clean.startsWith('https://') || 
         clean.startsWith('/') || 
         clean.startsWith('data:image/') ||
         clean.startsWith('blob:');
}

/**
 * Sanitiza una URL para imagen o enlace. Si no es segura, devuelve una cadena vacía.
 * @param {string} url 
 * @returns {string}
 */
export function sanitizeURL(url) {
  return isSafeURL(url) ? url.trim() : '';
}

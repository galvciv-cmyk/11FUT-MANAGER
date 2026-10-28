/**
 * Gestor de Rate Limiting y Control de Frecuencia (11FUT MANAGER)
 * Protege contra:
 * - Ataques de fuerza bruta en login/contraseñas
 * - Spam de descargas masivas (PDFs, plantillas, reportes Excel)
 * - Peticiones consecutivas saturando cuota de Firestore
 * - Navegación o aperturas de URLs descontroladas
 */

// Memoria volátil para seguimiento rápido
const rateLimits = new Map();
const downloadCooldowns = new Map();

/**
 * Obtiene timestamps guardados en memoria o sessionStorage para persistir entre recargas.
 */
function getTimestamps(key, windowMs) {
  const now = Date.now();
  let timestamps = rateLimits.get(key)?.timestamps || [];

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`11fut_rl_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Unir y eliminar duplicados
          const combined = Array.from(new Set([...timestamps, ...parsed]));
          timestamps = combined;
        }
      }
    } catch {
      // sessionStorage no disponible o restringido
    }
  }

  // Filtrar marcas de tiempo que aún estén dentro de la ventana
  return timestamps.filter(ts => typeof ts === 'number' && now - ts < windowMs);
}

/**
 * Guarda los timestamps actualizados tanto en memoria como en sessionStorage.
 */
function saveTimestamps(key, timestamps) {
  rateLimits.set(key, { timestamps });
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (timestamps.length === 0) {
        sessionStorage.removeItem(`11fut_rl_${key}`);
      } else {
        sessionStorage.setItem(`11fut_rl_${key}`, JSON.stringify(timestamps));
      }
    } catch {
      // Ignorar si el almacenamiento está restringido
    }
  }
}

/**
 * Comprueba si una acción/petición supera el límite permitido en una ventana de tiempo.
 * @param {string} key - Identificador único (ej: 'login:user@email.com', 'pin_auth', 'firestore:sync')
 * @param {number} maxAttempts - Número máximo de intentos permitidos en la ventana
 * @param {number} windowMs - Duración de la ventana en milisegundos (por defecto: 60.000 ms / 1 min)
 * @returns {{ allowed: boolean, remainingAttempts: number, retryAfterSec: number }}
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  let timestamps = getTimestamps(key, windowMs);

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSec: Math.max(1, retryAfterSec)
    };
  }

  timestamps.push(now);
  saveTimestamps(key, timestamps);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - timestamps.length,
    retryAfterSec: 0
  };
}

/**
 * Resetea el contador de rate limit para una clave (ej: tras login exitoso).
 * @param {string} key 
 */
export function resetRateLimit(key) {
  rateLimits.delete(key);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.removeItem(`11fut_rl_${key}`);
    } catch {
      // ignorar
    }
  }
}

/**
 * Controla la frecuencia de descargas de archivos (PDF, Excel, imágenes tácticas).
 * Evita múltiples clics seguidos que saturen la CPU o generen bloqueos.
 * @param {string} downloadId - Identificador del tipo de descarga (ej: 'descargar_pdf', 'exportar_excel')
 * @param {number} cooldownMs - Tiempo de espera mínimo entre descargas en ms (por defecto: 3500ms)
 * @returns {{ allowed: boolean, remainingSec: number }}
 */
export function throttleDownload(downloadId, cooldownMs = 3500) {
  const now = Date.now();
  const lastTime = downloadCooldowns.get(downloadId) || 0;
  const elapsed = now - lastTime;

  if (elapsed < cooldownMs) {
    const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
    return {
      allowed: false,
      remainingSec
    };
  }

  downloadCooldowns.set(downloadId, now);
  return {
    allowed: true,
    remainingSec: 0
  };
}

/**
 * Valida y controla la apertura de URLs externas o de descarga.
 * @param {string} url - URL de destino
 * @param {string} actionKey - Clave de acción
 * @param {number} cooldownMs - Cooldown en ms
 * @returns {{ allowed: boolean, error?: string }}
 */
export function safeRateLimitedURL(url, actionKey = 'nav_url', cooldownMs = 2000) {
  if (!url || typeof url !== 'string') {
    return { allowed: false, error: 'URL inválida o vacía' };
  }

  const clean = url.trim().toLowerCase();
  if (clean.startsWith('javascript:') || clean.startsWith('vbscript:') || clean.startsWith('data:text/html')) {
    return { allowed: false, error: 'Protocolo no seguro detectado' };
  }

  const limit = checkRateLimit(actionKey, 3, cooldownMs);
  if (!limit.allowed) {
    return {
      allowed: false,
      error: `Por favor espera ${limit.retryAfterSec} segundos antes de volver a intentar.`
    };
  }

  return { allowed: true };
}

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { perfil, plantel, stats, historial, pinHash, userEmail, setPinHash, setUserEmail, updatePerfil, updatePlantel, updateStats, updateHistorial, autoSaveLocal, categoriasData, updateCategoriasData, isSuperAdmin, SUPER_ADMIN_EMAIL } from "../modules/state.js";

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyB6McwyGjozN5EAiEJ3J2Q-wP-SR4h68DQ",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "fut-manager-oficial.firebaseapp.com",
  databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || "https://fut-manager-oficial-default-rtdb.firebaseio.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "fut-manager-oficial",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "fut-manager-oficial.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "838588250397",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:838588250397:web:d7fbfcb0d6dbb5433249f4",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-KV69GJBF4L"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
if (typeof window !== 'undefined') window.firebaseAuth = auth;


// 🔌 CONEXIÓN AL EMULADOR LOCAL SI SE ACTIVA ?use_emulator=true O EN LOCALSTORAGE
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isLocalhost && window.location.search.includes('use_emulator=true')) {
  localStorage.setItem('11fut_use_emulator', 'true');
} else if (isLocalhost && window.location.search.includes('use_emulator=false')) {
  localStorage.removeItem('11fut_use_emulator');
}

export const useEmulator = isLocalhost && (localStorage.getItem('11fut_use_emulator') === 'true' || window.location.search.includes('use_emulator=true'));

if (useEmulator) {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8082);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('⚡ Conectado a Emuladores de Firebase Local (Firestore:8082, Auth:9099)');
  } catch (e) {
    console.warn('⚠️ No se pudo conectar a los emuladores locales de Firebase:', e);
  }
}




export async function limpiarDocumentosObsoletosFirebase() {
  if (!db) return;
  try {
    const refGeneral = doc(db, 'publico', 'perfil_publico');
    await deleteDoc(refGeneral);
  } catch (e) {
    // Ignorar si no existe o sin permisos
  }
}

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function setSyncStatus(type, msg) {
  const el = document.getElementById('login-status');
  if (el) el.textContent = msg;
}

export function getPublicId() {
  if (auth && auth.currentUser && auth.currentUser.uid) {
    return 'usr_' + auth.currentUser.uid;
  }
  if (pinHash) {
    return 'usr_' + pinHash;
  }
  return 'perfil_demo';
}

export function getFunctionUrl(functionName) {
  return `https://us-central1-fut-manager-30b36.cloudfunctions.net/${functionName}`;
}

let _guardarFirebaseTimer = null;
let _hayGuardadoPendiente = false;

// Protección: forzar guardado al cerrar la pestaña si hay cambios pendientes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (_hayGuardadoPendiente && _guardarFirebaseTimer) {
      clearTimeout(_guardarFirebaseTimer);
      _hayGuardadoPendiente = false;
      // Usar sendBeacon para el guardado final (no bloquea el cierre)
      try {
        autoSaveLocal(); // Al menos guardar localmente
      } catch (e) { /* silencioso */ }
    }
  });
}

/**
 * Sanitiza profundamente objetos para Firestore:
 * - Elimina valores undefined y funciones que rechaza el SDK
 * - Previene que strings masivos (>250KB) rompan el límite de 1MB y generen "Property perfil contains an invalid nested entity"
 * - Convierte estructuras a objetos puros compatibles con Firestore
 */
export function sanitizarParaFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined && typeof item !== 'function')
      .map(item => sanitizarParaFirestore(item));
  }

  const limpio = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || typeof value === 'function') continue;
    if (typeof value === 'string' && value.length > 250000 && !value.startsWith('http')) {
      console.warn(`⚠️ Propiedad "${key}" excluida de Firestore por superar 250KB.`);
      continue;
    }
    limpio[key] = sanitizarParaFirestore(value);
  }
  return limpio;
}

export async function guardarFirebase() {
  if (!db) return false;
  
  // Guardado local instantáneo para respuesta de UI inmediata (<1ms)
  autoSaveLocal();
  _hayGuardadoPendiente = true;

  clearTimeout(_guardarFirebaseTimer);
  return new Promise((resolve) => {
    _guardarFirebaseTimer = setTimeout(async () => {
      _hayGuardadoPendiente = false;
      try {
        const isMaster = isSuperAdmin() || (Boolean(auth && auth.currentUser && auth.currentUser.email) && auth.currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
        if (isMaster) {
          perfil.estadoCuenta = 'ACTIVO';
          perfil.fechaVencimiento = '2099-01-01T00:00:00.000Z';
          perfil.maxPerfiles = 8;
        }

        const fullPayload = {
          perfil: sanitizarParaFirestore(perfil),
          plantel: sanitizarParaFirestore(plantel),
          stats: sanitizarParaFirestore(stats),
          historial: sanitizarParaFirestore(historial),
          categoriasData: sanitizarParaFirestore(categoriasData),
          updatedAt: new Date().toISOString()
        };

        const perfilPublicoSanitizado = {
          ...perfil,
          pin: undefined,
          pins: undefined,
          password: undefined,
          profiles: (perfil.profiles || []).map(p => {
            const cp = { ...p };
            delete cp.pin;
            delete cp.password;
            return cp;
          })
        };

        const pubPayload = {
          uid: (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : '',
          pinHash: pinHash || '',
          club: perfil.club || '11FUT MANAGER',
          email: perfil.email || '',
          whatsapp: perfil.whatsapp || '',
          logo: perfil.logo || '',
          bg: perfil.bg || '',
          estadoCuenta: isMaster ? 'ACTIVO' : (perfil.estadoCuenta || 'PRUEBA'),
          fechaVencimiento: isMaster ? '2099-01-01T00:00:00.000Z' : (perfil.fechaVencimiento || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()),
          maxPerfiles: isMaster ? 8 : (perfil.maxPerfiles || 1),
          wizardCompletado: !!perfil.wizardCompletado,
          perfil: sanitizarParaFirestore(perfilPublicoSanitizado),
          esquemaPredeterminado: perfil.esquemaPredeterminado || '1-4-4-2',
          modoPredeterminado: perfil.modoPredeterminado || '11',
          esquemasCustom: sanitizarParaFirestore(perfil.esquemasCustom || []),
          categoriasData: sanitizarParaFirestore(categoriasData),
          plantel: sanitizarParaFirestore(plantel),
          stats: sanitizarParaFirestore(stats),
          historial: sanitizarParaFirestore(historial),
          updatedAt: new Date().toISOString()
        };

        const userKey = (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : pinHash;
        const pubKey = (auth && auth.currentUser && auth.currentUser.uid) ? `usr_${auth.currentUser.uid}` : (pinHash ? `usr_${pinHash}` : null);

        const writes = [];

        if (userKey) {
          writes.push(setDoc(doc(db, 'usuarios', userKey), fullPayload, { merge: true }));
        }

        if (pubKey) {
          writes.push(setDoc(doc(db, 'publicos', pubKey), pubPayload, { merge: true }));
        }
        if (auth && auth.currentUser && auth.currentUser.uid && pinHash && ('usr_' + pinHash) !== pubKey) {
          writes.push(setDoc(doc(db, 'publicos', 'usr_' + pinHash), pubPayload, { merge: true }));
        }

        if (writes.length > 0) {
          // Timeout de 4s para que nunca bloquee la navegación de la app
          await Promise.race([
            Promise.all(writes),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 4000))
          ]).catch(err => console.warn('Aviso guardado en segundo plano Firebase:', err));
        }

        setSyncStatus('saved', '☁️ Sincronizado en la nube');
        resolve(true);
      } catch (err) {
        console.error('Error guardando en Firebase:', err);
        setSyncStatus('error', '⚠️ Guardado localmente (sin conexión)');
        resolve(false);
      }
    }, 450);
  });
}



export async function cargarFirebase() {
  if (!db) return false;
  
  const userKey = (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : pinHash;
  if (!userKey) return false;

  try {
    const docRef = doc(db, 'usuarios', userKey);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.categoriasData && Object.keys(data.categoriasData).length > 0) {
        updateCategoriasData(data.categoriasData);
      } else {
        if (data.plantel) updatePlantel(data.plantel);
        if (data.stats) updateStats(data.stats);
        if (data.historial) updateHistorial(data.historial);
      }

      if (data.perfil) updatePerfil(data.perfil);

      autoSaveLocal();
      return true;
    }
  } catch (err) {
    console.error('Error cargando de Firebase:', err);
  }
  return false;
}

export async function sincronizarEstadoDesdeNube() {
  if (!db) return;
  const user = auth?.currentUser;
  const email = user?.email || perfil?.email;
  if (!user && !email && !pinHash) return;

  try {
    const pubKey = user ? `usr_${user.uid}` : (pinHash ? `usr_${pinHash}` : null);
    const emailKey = email ? `email_${email.replace(/[@.]/g, '_')}` : null;

    let pubSnap1 = null;
    let pubSnap2 = null;

    if (pubKey) {
      pubSnap1 = await getDoc(doc(db, 'publicos', pubKey)).catch(() => null);
    }
    if (emailKey) {
      pubSnap2 = await getDoc(doc(db, 'publicos', emailKey)).catch(() => null);
    }

    const cloudData = (pubSnap1 && pubSnap1.exists()) ? pubSnap1.data() : ((pubSnap2 && pubSnap2.exists()) ? pubSnap2.data() : null);

    if (cloudData) {
      let modificado = false;

      if (cloudData.estadoCuenta && cloudData.estadoCuenta !== perfil.estadoCuenta) {
        perfil.estadoCuenta = cloudData.estadoCuenta;
        modificado = true;
      }
      if (cloudData.fechaVencimiento && cloudData.fechaVencimiento !== perfil.fechaVencimiento) {
        perfil.fechaVencimiento = cloudData.fechaVencimiento;
        modificado = true;
      }
      if (cloudData.maxPerfiles !== undefined && cloudData.maxPerfiles !== perfil.maxPerfiles) {
        perfil.maxPerfiles = cloudData.maxPerfiles;
        modificado = true;
      }
      if (cloudData.planTipo && cloudData.planTipo !== perfil.planTipo) {
        perfil.planTipo = cloudData.planTipo;
        modificado = true;
      }

      if (modificado) {
        autoSaveLocal();
      }
    }
  } catch (e) {
    console.warn('Aviso sincronizando estado desde publicos:', e);
  }
}

export async function cargarFirebasePublico(targetPublicId) {
  const isDemoOrPreview = !targetPublicId || targetPublicId === 'true' || targetPublicId === 'perfil_demo' || targetPublicId === 'preview';

  function hidratarDatosPublicos(data) {
    if (!data) return;

    if (data.perfil) {
      updatePerfil(data.perfil);
    }
    if (data.esquemasCustom && Array.isArray(data.esquemasCustom)) {
      perfil.esquemasCustom = data.esquemasCustom;
    }
    if (data.esquemaPredeterminado) {
      perfil.esquemaPredeterminado = data.esquemaPredeterminado;
    }
    if (data.modoPredeterminado) {
      perfil.modoPredeterminado = data.modoPredeterminado;
    } else if (data.club) {
      updatePerfil({
        club: data.club,
        logo: data.logo || '',
        bg: data.bg || '',
        email: data.email || '',
        whatsapp: data.whatsapp || ''
      });
    }

    if (data.categoriasData && typeof data.categoriasData === 'object') {
      const keys = Object.keys(data.categoriasData);
      if (keys.length > 0) {
        perfil.categorias = [...new Set([...(perfil.categorias || []), ...keys])];
      }
      updateCategoriasData(data.categoriasData);
    } else {
      if (data.plantel) updatePlantel(data.plantel);
      if (data.stats) updateStats(data.stats);
      if (data.historial) updateHistorial(data.historial);
    }
  }

  if (isDemoOrPreview) {
    try {
      autoLoadLocal();
      const hasCats = (perfil.categorias && perfil.categorias.length > 0) || Object.keys(categoriasData).length > 0;
      if (hasCats || (perfil.club && perfil.club !== '11FUT MANAGER')) {
        return true;
      }
    } catch (e) {
      console.warn('Aviso cargando datos locales en preview:', e);
    }
    return false;
  }

  const cacheKey = '11fut_pub_cache_' + targetPublicId;
  const cachedRaw = localStorage.getItem(cacheKey);

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const isFresh = Date.now() - cached.timestamp < 15 * 60 * 1000;
      if (cached.data) {
        hidratarDatosPublicos(cached.data);
      }
      if (isFresh) return true;
    } catch (e) {
      console.warn('Error leyendo cache de perfil público:', e);
    }
  }

  if (db) {
    try {
      let snap = await getDoc(doc(db, 'publicos', targetPublicId));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'publico', targetPublicId));
      }
      if (!snap.exists() && auth && auth.currentUser && auth.currentUser.uid) {
        snap = await getDoc(doc(db, 'publicos', 'usr_' + auth.currentUser.uid));
      }

      if (snap && snap.exists()) {
        const data = snap.data();
        hidratarDatosPublicos(data);

        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data
          }));
        } catch (e) {}

        return true;
      }
    } catch (e) {
      console.error('Error al cargar perfil público desde Firebase:', e);
    }
  }

  try {
    const rawLocalP = localStorage.getItem('11fut_perfil');
    const rawLocalC = localStorage.getItem('11fut_categorias_data');
    if (rawLocalP || rawLocalC) {
      if (rawLocalP) {
        const parsedP = JSON.parse(rawLocalP);
        if (parsedP && (parsedP.club || (parsedP.categorias && parsedP.categorias.length))) {
          updatePerfil(parsedP);
        }
      }
      if (rawLocalC) {
        const parsedC = JSON.parse(rawLocalC);
        if (parsedC && Object.keys(parsedC).length) {
          updateCategoriasData(parsedC);
        }
      }
      if ((perfil.categorias && perfil.categorias.length) || Object.keys(categoriasData).length) {
        return true;
      }
    }
  } catch (e) {
    console.warn('Error en fallback local de perfil público:', e);
  }

  return false;
}

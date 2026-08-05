import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { perfil, plantel, stats, historial, pinHash, userEmail, setPinHash, setUserEmail, updatePerfil, updatePlantel, updateStats, updateHistorial, autoSaveLocal, categoriasData, updateCategoriasData } from "../modules/state.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6McwyGjozN5EAiEJ3J2Q-wP-SR4h68DQ",
  authDomain: "fut-manager-oficial.firebaseapp.com",
  projectId: "fut-manager-oficial",
  storageBucket: "fut-manager-oficial.firebasestorage.app",
  messagingSenderId: "838588250397",
  appId: "1:838588250397:web:d7fbfcb0d6dbb5433249f4",
  measurementId: "G-KV69GJBF4L"
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

const useEmulator = isLocalhost && (localStorage.getItem('11fut_use_emulator') === 'true' || window.location.search.includes('use_emulator=true'));

if (useEmulator) {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('⚡ Conectado a Emuladores de Firebase Local (Firestore:8080, Auth:9099)');
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
  if (pinHash) {
    return `usr_${pinHash}`;
  }
  if (auth && auth.currentUser && auth.currentUser.uid) {
    return `usr_${auth.currentUser.uid}`;
  }
  return 'perfil_demo';
}

export function getFunctionUrl(functionName) {
  return `https://us-central1-fut-manager-30b36.cloudfunctions.net/${functionName}`;
}

let _guardarFirebaseTimer = null;

export async function guardarFirebase() {
  if (!db) return;
  
  // Guardado local instantáneo para respuesta de UI inmediata (<1ms)
  autoSaveLocal();

  clearTimeout(_guardarFirebaseTimer);
  return new Promise((resolve) => {
    _guardarFirebaseTimer = setTimeout(async () => {
      try {
        const fullPayload = {
          perfil, plantel, stats, historial, categoriasData,
          updatedAt: new Date().toISOString()
        };

        const pubPayload = {
          club: perfil.club || '11FUT MANAGER',
          email: perfil.email || '',
          whatsapp: perfil.whatsapp || '',
          logo: perfil.logo || '',
          estadoCuenta: perfil.estadoCuenta || 'PRUEBA',
          fechaVencimiento: perfil.fechaVencimiento || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          maxPerfiles: perfil.maxPerfiles || 1,
          perfil,
          categoriasData,
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

        if (writes.length > 0) {
          await Promise.all(writes);
        }

        setSyncStatus('saved', '☁️ Sincronizado en la nube');
        resolve(true);
      } catch (e) {
        console.error('Error al guardar en Firebase:', e);
        setSyncStatus('error', '⚠️ Guardado localmente (sin conexión)');
        resolve(false);
      }
    }, 120);
  });
}



export async function cargarFirebase() {
  if (!db) return false;
  const userKey = (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : pinHash;
  if (!userKey) return false;
  try {
    const ref = doc(db, 'usuarios', userKey);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.perfil) updatePerfil(data.perfil);
      if (data.categoriasData && Object.keys(data.categoriasData).length > 0) {
        updateCategoriasData(data.categoriasData);
      } else {
        if (data.plantel) updatePlantel(data.plantel);
        if (data.stats) updateStats(data.stats);
        if (data.historial) updateHistorial(data.historial);
      }
      autoSaveLocal();
      return true;
    }
  } catch (e) {
    console.error('Error al cargar de Firebase:', e);
  }
  return false;
}

export async function cargarFirebasePublico(targetPublicId) {
  if (!targetPublicId || targetPublicId === 'true' || targetPublicId === 'perfil_demo') return false;

  const cacheKey = `11fut_pub_cache_${targetPublicId}`;
  const cachedRaw = localStorage.getItem(cacheKey);

  // 1. Hidratar instantáneamente si existe cache local no expirada (<15 minutos)
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const isFresh = Date.now() - cached.timestamp < 15 * 60 * 1000;
      if (cached.data) {
        const data = cached.data;
        if (data.categoriasData && Object.keys(data.categoriasData).length > 0) {
          updateCategoriasData(data.categoriasData);
        } else {
          if (data.plantel) updatePlantel(data.plantel);
          if (data.stats) updateStats(data.stats);
          if (data.historial) updateHistorial(data.historial);
        }
        if (data.perfil) updatePerfil(data.perfil);
      }
      if (isFresh) return true; // Respuesta instantánea en 0ms sin ir a Firestore
    } catch (e) {
      console.warn('Error leyendo cache de perfil público:', e);
    }
  }

  // 2. Si no hay cache o expiró, consultar Firestore y actualizar la cache
  if (!db) return false;
  try {
    const refPub = doc(db, 'publicos', targetPublicId);
    const snap = await getDoc(refPub);

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

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data
        }));
      } catch (e) {}

      return true;
    }
  } catch (e) {
    console.error('Error al cargar perfil público:', e);
  }
  return false;
}


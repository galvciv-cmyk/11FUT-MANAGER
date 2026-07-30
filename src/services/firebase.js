import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { perfil, plantel, stats, historial, pinHash, userEmail, setPinHash, setUserEmail, updatePerfil, updatePlantel, updateStats, updateHistorial, autoSaveLocal, categoriasData, updateCategoriasData } from "../modules/state.js";

const firebaseConfig = {
  apiKey: "AIzaSyANMJ6ls4tswFgAYIqfa5RP18fBmvK2hIU",
  authDomain: "fut-manager-30b36.firebaseapp.com",
  projectId: "fut-manager-30b36",
  storageBucket: "fut-manager-30b36.firebasestorage.app",
  messagingSenderId: "1058042278818",
  appId: "1:1058042278818:web:89c1e05391cd69a81cb8fb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

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
    return `usr_${auth.currentUser.uid}`;
  }
  if (pinHash) {
    return `usr_${pinHash}`;
  }
  return 'perfil_demo';
}

export async function guardarFirebase() {
  if (!db) return;
  try {
    const payload = {
      perfil, plantel, stats, historial, categoriasData,
      updatedAt: new Date().toISOString()
    };

    const userKey = (auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : pinHash;

    if (userKey) {
      const ref = doc(db, 'usuarios', userKey);
      await setDoc(ref, payload);
    }

    const pubId = getPublicId();
    if (pubId && pubId !== 'perfil_demo') {
      const refPub = doc(db, 'publicos', pubId);
      await setDoc(refPub, payload);
    }

    setSyncStatus('saved', '☁️ Sincronizado en la nube');
  } catch (e) {
    console.error('Error al guardar en Firebase:', e);
    setSyncStatus('error', '⚠️ Guardado localmente (sin conexión)');
  }
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
  if (!db || !targetPublicId || targetPublicId === 'true' || targetPublicId === 'perfil_demo') return false;
  try {
    const refPub = doc(db, 'publicos', targetPublicId);
    const snap = await getDoc(refPub);

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
      return true;
    }
  } catch (e) {
    console.error('Error al cargar perfil público:', e);
  }
  return false;
}

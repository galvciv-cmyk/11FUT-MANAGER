import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { perfil, plantel, stats, historial, pinHash, userEmail, setPinHash, setUserEmail, updatePerfil, updatePlantel, updateStats, updateHistorial, autoSaveLocal } from "../modules/state.js";

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

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function setSyncStatus(type, msg) {
  const el = document.getElementById('login-status');
  if (el) el.textContent = msg;
}

export async function guardarFirebase() {
  if (!db || !pinHash) return;
  try {
    const ref = doc(db, 'usuarios', pinHash);
    await setDoc(ref, {
      perfil, plantel, stats, historial,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setSyncStatus('saved', '☁️ Sincronizado en la nube');
  } catch (e) {
    console.error('Error al guardar en Firebase:', e);
    setSyncStatus('error', '⚠️ Guardado localmente (sin conexión)');
  }
}

export async function cargarFirebase() {
  if (!db || !pinHash) return false;
  try {
    const ref = doc(db, 'usuarios', pinHash);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.perfil) updatePerfil(data.perfil);
      if (data.plantel) updatePlantel(data.plantel);
      if (data.stats) updateStats(data.stats);
      if (data.historial) updateHistorial(data.historial);
      autoSaveLocal();
      return true;
    }
  } catch (e) {
    console.error('Error al cargar de Firebase:', e);
  }
  return false;
}

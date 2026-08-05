// src/modules/biometric.js
import { getFunctionUrl, db } from '../services/firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function isBiometricSupported() {
  return window.PublicKeyCredential && typeof window.PublicKeyCredential === 'function';
}

export async function registerBiometric(userUid) {
  if (!isBiometricSupported()) {
    throw new Error('Tu dispositivo o navegador no soporta autenticación biométrica (WebAuthn).');
  }

  try {
    // Try Cloud Function first
    const res = await fetch(getFunctionUrl('generateRegistrationOptions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userUid })
    });
    if (res.ok) {
      const options = await res.json();
      options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      options.user.id = Uint8Array.from(atob(options.user.id), c => c.charCodeAt(0));
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(c => ({
          ...c,
          id: Uint8Array.from(atob(c.id), ch => ch.charCodeAt(0))
        }));
      }

      const credential = await navigator.credentials.create({ publicKey: options });

      const verificationRes = await fetch(getFunctionUrl('verifyRegistration'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          response: {
            attestationObject: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON)))
          },
          uid: userUid
        })
      });
      const verification = await verificationRes.json();
      return verification.success;
    }
  } catch (e) {
    console.warn('Cloud Function de biometría no alcanzable, usando cliente WebAuthn local:', e);
  }

  // Client-side WebAuthn fallback
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  const userId = new TextEncoder().encode(userUid || 'user_11fut');

  const publicKeyOptions = {
    challenge,
    rp: { name: '11FUT MANAGER', id: window.location.hostname },
    user: {
      id: userId,
      name: userUid || 'usuario@11fut.com',
      displayName: 'Usuario 11FUT'
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
    timeout: 60000,
    authenticatorSelection: { userVerification: 'preferred' }
  };

  const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
  if (credential) {
    const credentialData = {
      id: credential.id,
      rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
      registeredAt: new Date().toISOString()
    };

    // Save in LocalStorage
    localStorage.setItem(`11fut_bio_${userUid}`, JSON.stringify(credentialData));

    // Save in Firestore if db available
    if (db && userUid) {
      try {
        const userRef = doc(db, 'usuarios', userUid);
        await setDoc(userRef, { biometric: credentialData }, { merge: true });
      } catch (err) {
        console.warn('No se pudo guardar biometría en Firestore:', err);
      }
    }
    return true;
  }
  return false;
}

export async function loginBiometric(userUid) {
  if (!isBiometricSupported()) {
    throw new Error('Tu dispositivo o navegador no soporta autenticación biométrica (WebAuthn).');
  }

  // Try Cloud Function first
  try {
    const res = await fetch(getFunctionUrl('generateAuthenticationOptions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userUid })
    });
    if (res.ok) {
      const options = await res.json();
      options.challenge = Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0));
      options.allowCredentials = options.allowCredentials.map(c => ({
        ...c,
        id: Uint8Array.from(atob(c.id), ch => ch.charCodeAt(0))
      }));

      const assertion = await navigator.credentials.get({ publicKey: options });

      const verificationRes = await fetch(getFunctionUrl('verifyAuthentication'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assertion.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
          response: {
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
            signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
            userHandle: assertion.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(assertion.response.userHandle))) : null
          },
          uid: userUid
        })
      });
      const verification = await verificationRes.json();
      return verification.success;
    }
  } catch (e) {
    console.warn('Cloud Function no disponible, intentando autenticación biométrica local:', e);
  }

  // Local fallback check
  let savedBio = localStorage.getItem(`11fut_bio_${userUid}`);
  if (!savedBio && !userUid) {
    // Look for any key starting with 11fut_bio_
    const bioKey = Object.keys(localStorage).find(k => k.startsWith('11fut_bio_'));
    if (bioKey) savedBio = localStorage.getItem(bioKey);
  }

  let credId = null;
  if (savedBio) {
    try {
      const parsed = JSON.parse(savedBio);
      credId = parsed.id;
    } catch (e) {}
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const getOptions = {
    challenge,
    timeout: 60000,
    userVerification: 'preferred'
  };

  if (credId) {
    const rawIdBuf = Uint8Array.from(atob(localStorage.getItem(`11fut_bio_${userUid}`) ? JSON.parse(localStorage.getItem(`11fut_bio_${userUid}`)).rawId : ''), c => c.charCodeAt(0));
    if (rawIdBuf.length > 0) {
      getOptions.allowCredentials = [{ id: rawIdBuf, type: 'public-key' }];
    }
  }

  const assertion = await navigator.credentials.get({ publicKey: getOptions });
  return !!assertion;
}

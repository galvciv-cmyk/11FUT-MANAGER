import { db } from "../services/firebase.js";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { isSuperAdmin, perfil, autoSaveLocal } from "./state.js";
import { mostrarConfirmacionApp, mostrarToastRapido, mostrarPromptModal, mostrarNotificacionApp } from "./config.js";

export async function renderSuperAdminDashboard() {
  const container = document.getElementById('super-admin-content');
  if (!container) return;

  if (!isSuperAdmin()) {
    container.innerHTML = `<div class="card" style="text-align:center;padding:30px;"><div style="font-size:18px;color:var(--rojo);font-weight:900;">⛔ ACCESO RESTRINGIDO</div><div style="font-size:12px;color:#aaa;margin-top:8px;">Este panel es exclusivo para la administración general de 11FUT MANAGER.</div></div>`;
    return;
  }

  container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--oro);">⏳ Cargando lista de clubes e instituciones...</div>`;

  try {
    const mapClubes = new Map();

    // 1. Consultar colección 'publicos'
    try {
      const pubSnap = await getDocs(collection(db, 'publicos'));
      pubSnap.forEach(docSnap => {
        const d = docSnap.data() || {};
        const rawEmail = (d.email || d.perfil?.email || d.userEmail || '').trim().toLowerCase();
        const clubNombre = d.club || d.perfil?.club || 'Club Registrado';
        const wa = d.whatsapp || d.perfil?.whatsapp || d.telefono || '';
        const logo = d.logo || d.perfil?.logo || '';
        const estado = d.estadoCuenta || d.perfil?.estadoCuenta || 'PENDIENTE';
        const fechaExp = d.fechaVencimiento || d.perfil?.fechaVencimiento || '';
        const maxP = d.maxPerfiles || d.perfil?.maxPerfiles || 1;
        const updatedAt = d.updatedAt || d.createdAt || '';

        const key = (rawEmail && rawEmail.includes('@')) ? rawEmail : docSnap.id.toLowerCase();
        const prev = mapClubes.get(key);

        if (!prev) {
          mapClubes.set(key, {
            id: docSnap.id,
            docId: docSnap.id,
            club: clubNombre,
            email: rawEmail || docSnap.id,
            whatsapp: wa,
            logo: logo,
            estadoCuenta: estado,
            fechaVencimiento: fechaExp,
            maxPerfiles: maxP,
            updatedAt: updatedAt
          });
        } else {
          mapClubes.set(key, {
            ...prev,
            club: (clubNombre && clubNombre !== 'Nuevo Club' && clubNombre !== 'Club Registrado') ? clubNombre : prev.club,
            whatsapp: wa || prev.whatsapp,
            logo: logo || prev.logo,
            estadoCuenta: (estado && estado !== 'PENDIENTE') ? estado : (prev.estadoCuenta || estado),
            fechaVencimiento: fechaExp || prev.fechaVencimiento,
            maxPerfiles: maxP || prev.maxPerfiles,
            updatedAt: updatedAt || prev.updatedAt
          });
        }
      });
    } catch (errPub) {
      console.warn('Aviso leyendo publicos en SuperAdmin:', errPub);
    }

    // 2. Consultar colección 'usuarios' para capturar registros que solo estén en usuarios
    try {
      const usrSnap = await getDocs(collection(db, 'usuarios'));
      usrSnap.forEach(docSnap => {
        const d = docSnap.data() || {};
        const p = d.perfil || {};
        const rawEmail = (p.email || d.email || '').trim().toLowerCase();
        if (rawEmail && rawEmail.includes('@')) {
          const key = rawEmail;
          const prev = mapClubes.get(key);
          const clubNombre = p.club || d.club || (prev ? prev.club : 'Club Registrado');
          const wa = p.whatsapp || d.whatsapp || (prev ? prev.whatsapp : '');
          const logo = p.logo || d.logo || (prev ? prev.logo : '');
          const estado = p.estadoCuenta || d.estadoCuenta || (prev ? prev.estadoCuenta : 'PENDIENTE');
          const fechaExp = p.fechaVencimiento || d.fechaVencimiento || (prev ? prev.fechaVencimiento : '');
          const maxP = p.maxPerfiles || d.maxPerfiles || (prev ? prev.maxPerfiles : 1);
          const updatedAt = d.updatedAt || p.updatedAt || (prev ? prev.updatedAt : '');

          mapClubes.set(key, {
            id: prev ? prev.id : `usr_${docSnap.id}`,
            docId: prev ? prev.docId : `usr_${docSnap.id}`,
            uid: docSnap.id,
            club: (clubNombre && clubNombre !== 'Nuevo Club' && clubNombre !== 'Club Registrado') ? clubNombre : (prev?.club || clubNombre),
            email: rawEmail,
            whatsapp: wa || prev?.whatsapp || '',
            logo: logo || prev?.logo || '',
            estadoCuenta: estado || prev?.estadoCuenta || 'PENDIENTE',
            fechaVencimiento: fechaExp || prev?.fechaVencimiento || '',
            maxPerfiles: maxP || prev?.maxPerfiles || 1,
            updatedAt: updatedAt || prev?.updatedAt || ''
          });
        }
      });
    } catch (errUsr) {
      console.warn('Aviso leyendo usuarios en SuperAdmin:', errUsr);
    }

    // Convertir a array y ordenar: PENDIENTE primero, luego por fecha reciente
    const masterEmail = (SUPER_ADMIN_EMAIL || 'gyknova@gmail.com').trim().toLowerCase();
    if (!mapClubes.has(masterEmail)) {
      mapClubes.set(masterEmail, {
        id: 'master_club',
        docId: 'master_club',
        uid: 'master_club',
        club: '11FUT MANAGER MASTER',
        email: SUPER_ADMIN_EMAIL,
        whatsapp: '+584141401560',
        logo: 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png',
        estadoCuenta: 'ACTIVO',
        fechaVencimiento: new Date('2099-01-01').toISOString(),
        maxPerfiles: 8,
        updatedAt: new Date().toISOString(),
        isMaster: true
      });
    }

    const clubesValidos = Array.from(mapClubes.values()).sort((a, b) => {
      if (a.isMaster) return -1;
      if (b.isMaster) return 1;
      if (a.estadoCuenta === 'PENDIENTE' && b.estadoCuenta !== 'PENDIENTE') return -1;
      if (a.estadoCuenta !== 'PENDIENTE' && b.estadoCuenta === 'PENDIENTE') return 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    renderSuperAdminCardsUI(container, clubesValidos);

  } catch (e) {
    console.warn('Advertencia al consultar Firestore en Súper Admin:', e);
    const clubesFallback = [
      {
        id: 'master_club',
        club: '11FUT MANAGER MASTER',
        email: SUPER_ADMIN_EMAIL,
        whatsapp: '+584141401560',
        maxPerfiles: 8,
        estadoCuenta: 'ACTIVO',
        fechaVencimiento: new Date('2099-01-01').toISOString(),
        isMaster: true
      }
    ];
    renderSuperAdminCardsUI(container, clubesFallback);
  }
}

function renderSuperAdminCardsUI(container, clubesValidos) {
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;color:var(--oro);">👑 PANEL DE SÚPER ADMINISTRADOR (PANEL MASTER)</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button id="btn-refresh-superadmin-list" style="background:rgba(212,175,55,0.15);border:1px solid var(--oro);color:var(--oro);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:6px;">
          🔄 Recargar Clubes
        </button>
        <div style="font-size:14px;font-weight:900;color:var(--oro);background:rgba(212,175,55,0.15);padding:6px 16px;border-radius:20px;border:1px solid var(--oro);">Total Registrados: <b>${clubesValidos.length} Clubes</b></div>
      </div>
    </div>

    <!-- VISTA EN TARJETAS RESPONSIVAS (MÓVIL Y DESKTOP) -->
    <div id="tb-superadmin-rows" style="display:flex;flex-direction:column;gap:12px;">
  `;

  clubesValidos.forEach(c => {
    const clubNombre = c.club || c.perfil?.club || 'Sin Nombre';
    const email = c.email || c.id;
    const wa = c.whatsapp || c.perfil?.whatsapp || c.telefono || 'Sin WhatsApp';
    const maxP = c.maxPerfiles || c.perfil?.maxPerfiles || 1;
    const estado = c.estadoCuenta || c.perfil?.estadoCuenta || 'PRUEBA';

    const fechaExp = (c.fechaVencimiento || c.perfil?.fechaVencimiento) 
      ? new Date(c.fechaVencimiento || c.perfil?.fechaVencimiento) 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const diffMs = fechaExp - new Date();
    const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let badgeBg = 'rgba(212,175,55,0.15)';
    let badgeBorder = 'var(--oro)';
    let badgeColor = 'var(--oro)';
    let badgeLabel = `⏳ PRUEBA (${diasRestantes}d)`;

    if (estado === 'PENDIENTE') {
      badgeBg = 'rgba(52,152,219,0.15)';
      badgeBorder = '#3498db';
      badgeColor = '#3498db';
      badgeLabel = `⏳ PENDIENTE ACTIVACIÓN`;
    } else if (estado === 'ACTIVO') {
      badgeBg = 'rgba(46,204,113,0.15)';
      badgeBorder = '#2ecc71';
      badgeColor = '#2ecc71';
      badgeLabel = `🟢 ACTIVO (${diasRestantes}d)`;
    } else if (estado === 'VENCIDO' || (estado !== 'PENDIENTE' && diasRestantes <= 0)) {
      badgeBg = 'rgba(231,76,60,0.15)';
      badgeBorder = '#e74c3c';
      badgeColor = '#e74c3c';
      badgeLabel = `🔴 VENCIDO`;
    }

    html += `
      <div style="background:#0d0d0d;border:1px solid #222;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 4px 15px rgba(0,0,0,0.4);">
        
        <!-- FILA SUPERIOR: LOGO, NOMBRE Y BADGE ESTADO -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${c.logo || c.perfil?.logo || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'}" style="width:34px;height:34px;object-fit:contain;border-radius:6px;background:#181818;padding:2px;border:1px solid #333;">
            <div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#fff;line-height:1.1;">${clubNombre}</div>
              <div style="font-size:11px;color:#aaa;">📧 ${email}</div>
            </div>
          </div>
          <span style="background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:11px;font-weight:900;padding:4px 10px;border-radius:12px;">
            ${badgeLabel}
          </span>
        </div>

        <!-- DETALLES SECUNDARIOS: WHATSAPP, CANTIDAD DE PERFILES, FECHA VENCIMIENTO -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;background:#141414;padding:8px 12px;border-radius:8px;font-size:11px;color:#ccc;border:1px solid #222;">
          <div>📱 Contacto WA: <span style="color:#fff;font-weight:700;">${wa}</span></div>
          <div style="display:flex;gap:12px;align-items:center;">
            <span style="color:var(--oro);font-weight:800;background:rgba(212,175,55,0.12);padding:2px 8px;border-radius:6px;">👤 ${maxP} Perfil(es)</span>
            <span>📅 Vence: ${fechaExp.toLocaleDateString()}</span>
          </div>
        </div>

        <!-- FILA DE BOTONES DE ACCIÓN RESPONSIVOS -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:6px;margin-top:2px;">
          ${c.isMaster ? `
            <div style="grid-column:1/-1;background:rgba(212,175,55,0.1);border:1px dashed var(--oro);color:var(--oro);padding:8px 12px;border-radius:8px;font-size:12px;font-weight:900;text-align:center;">
              👑 CUENTA MASTER PRINCIPAL (ADMINISTRADOR GLOBAL)
            </div>
          ` : `
            ${estado === 'PENDIENTE' ? `
              <button class="btn btn-green sa-btn-action" data-action="activar_prueba" data-id="${c.id}" data-uid="${c.uid || ''}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:900;justify-content:center;background:linear-gradient(135deg,#2ecc71,#27ae60);">⚡ ACTIVAR PRUEBA (3 DÍAS)</button>
              <button class="btn btn-green sa-btn-action" data-action="aprobar" data-id="${c.id}" data-uid="${c.uid || ''}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🟢 APROBAR (30D)</button>
            ` : `
              <button class="btn btn-green sa-btn-action" data-action="aprobar" data-id="${c.id}" data-uid="${c.uid || ''}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🟢 APROBAR (30D)</button>
              <button class="btn btn-gold sa-btn-action" data-action="regalar" data-id="${c.id}" data-uid="${c.uid || ''}" data-email="${email}" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🟡 +PRUEBA</button>
            `}
            <button class="btn btn-gray sa-btn-action" data-action="suspender" data-id="${c.id}" data-uid="${c.uid || ''}" data-email="${email}" style="font-size:11px;padding:8px;font-weight:800;color:var(--rojo);justify-content:center;">🔴 SUSPENDER</button>
            <button class="btn btn-gray sa-btn-action" data-action="wa" data-wa="${wa}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">💬 CHAT WA</button>
            <button class="btn btn-red sa-btn-action" data-action="eliminar" data-id="${c.id}" data-uid="${c.uid || ''}" data-email="${email}" data-club="${clubNombre}" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">🗑️ BORRAR</button>
          `}
        </div>

      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;

  document.getElementById('btn-refresh-superadmin-list')?.addEventListener('click', () => {
    renderSuperAdminDashboard();
  });

  const rows = document.getElementById('tb-superadmin-rows');
  if (rows) {
    rows.addEventListener('click', async (e) => {
      const btn = e.target.closest('.sa-btn-action');
      if (!btn) return;

      const action = btn.dataset.action;
      const pubDocId = btn.dataset.id;
      const uid = btn.dataset.uid;
      const email = btn.dataset.email;
      const wa = btn.dataset.wa;
      const clubNombre = btn.dataset.club;

      if (action === 'activar_prueba') {
        await ejecutarActivarPruebaSuperAdmin(pubDocId, email, wa, clubNombre, uid);
      } else if (action === 'aprobar') {
        await ejecutarAprobarSuperAdmin(pubDocId, email, wa, clubNombre, uid);
      } else if (action === 'regalar') {
        await ejecutarRegalarPruebaSuperAdmin(pubDocId, email, wa, clubNombre, uid);
      } else if (action === 'suspender') {
        await ejecutarSuspenderSuperAdmin(pubDocId, email, uid);
      } else if (action === 'wa') {
        ejecutarChatWASuperAdmin(wa, clubNombre);
      } else if (action === 'eliminar') {
        await ejecutarEliminarClubSuperAdmin(pubDocId, clubNombre, uid, email);
      }
    });
  }
}

function normalizarTelefonoWhatsApp(wa) {
  if (!wa) return '';
  let clean = wa.toString().replace(/\D/g, '');
  if (!clean) return '';
  // Si empieza con 0 y tiene 11 dígitos (ej: 04141234567) -> 584141234567
  if (clean.startsWith('0') && clean.length === 11) {
    clean = '58' + clean.slice(1);
  } else if (clean.length === 10 && (clean.startsWith('414') || clean.startsWith('424') || clean.startsWith('412') || clean.startsWith('416') || clean.startsWith('426'))) {
    clean = '58' + clean;
  }
  return clean;
}

async function ejecutarActivarPruebaSuperAdmin(pubDocId, email, wa, clubNombre, uid) {
  const dias = 3;
  const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
  const emailKey = (email || '').trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

  const waClean = normalizarTelefonoWhatsApp(wa);
  const msgWA = encodeURIComponent(`¡Hola ${clubNombre}! 🎉 Tu cuenta en 11FUT MANAGER ha sido APROBADA y ACTIVADA con 3 días de prueba gratuita (Vence el ${new Date(nuevaFecha).toLocaleDateString()}). Ya puedes ingresar a la plataforma y comenzar a usar todas las herramientas tácticas. ¡Mucho éxito! ⚽🏆`);

  // Abrir WhatsApp de forma inmediata (síncrona) para que el navegador no lo bloquee como popup
  if (waClean) {
    window.open(`https://wa.me/${waClean}?text=${msgWA}`, '_blank');
  }

  mostrarToastRapido('Prueba Activada', `⚡ Período de prueba de 3 días activado para ${clubNombre}.`, true);

  const payload = {
    estadoCuenta: 'PRUEBA',
    fechaVencimiento: nuevaFecha,
    club: clubNombre,
    email: email,
    updatedAt: new Date().toISOString()
  };

  const writes = [];
  if (pubDocId) writes.push(setDoc(doc(db, 'publicos', pubDocId), payload, { merge: true }).catch(() => {}));
  if (emailKey && emailKey !== pubDocId) writes.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));

  const targetUid = uid || (pubDocId && pubDocId.startsWith('usr_') ? pubDocId.replace('usr_', '') : null);
  if (targetUid) {
    writes.push(setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {}));
    writes.push(setDoc(doc(db, 'usuarios', targetUid), { perfil: { estadoCuenta: 'PRUEBA', fechaVencimiento: nuevaFecha, club: clubNombre } }, { merge: true }).catch(() => {}));
  }

  try {
    await Promise.all(writes);
  } catch (e) {
    console.warn('Aviso guardando en Firestore:', e);
  }

  if (perfil && perfil.email && email && perfil.email.trim().toLowerCase() === email.trim().toLowerCase()) {
    perfil.estadoCuenta = 'PRUEBA';
    perfil.fechaVencimiento = nuevaFecha;
    autoSaveLocal();
  }

  renderSuperAdminDashboard();
}

async function ejecutarAprobarSuperAdmin(pubDocId, email, wa, clubNombre, uid) {
  const dias = 30;
  const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
  const emailKey = (email || '').trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');

  const waClean = normalizarTelefonoWhatsApp(wa);
  const msgWA = encodeURIComponent(`¡Hola ${clubNombre}! 👋 Confirmo la recepción de tu pago. La membresía para tu club ha sido ACTIVADA exitosamente por 30 días (Vence el ${new Date(nuevaFecha).toLocaleDateString()}). ¡Gracias por confiar en 11FUT MANAGER! ⚽🏆`);

  // Abrir WhatsApp inmediatamente
  if (waClean) {
    window.open(`https://wa.me/${waClean}?text=${msgWA}`, '_blank');
  }

  mostrarToastRapido('Membresía Aprobada', `🟢 Membresía para ${clubNombre} aprobada por 30 días.`, true);

  const payload = {
    estadoCuenta: 'ACTIVO',
    fechaVencimiento: nuevaFecha,
    club: clubNombre,
    email: email,
    updatedAt: new Date().toISOString()
  };

  const writes = [];
  if (pubDocId) writes.push(setDoc(doc(db, 'publicos', pubDocId), payload, { merge: true }).catch(() => {}));
  if (emailKey && emailKey !== pubDocId) writes.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));

  const targetUid = uid || (pubDocId && pubDocId.startsWith('usr_') ? pubDocId.replace('usr_', '') : null);
  if (targetUid) {
    writes.push(setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {}));
    writes.push(setDoc(doc(db, 'usuarios', targetUid), { perfil: { estadoCuenta: 'ACTIVO', fechaVencimiento: nuevaFecha, club: clubNombre } }, { merge: true }).catch(() => {}));
  }

  try {
    await Promise.all(writes);
  } catch (e) {
    console.warn('Aviso guardando en Firestore:', e);
  }

  if (perfil && perfil.email && email && perfil.email.trim().toLowerCase() === email.trim().toLowerCase()) {
    perfil.estadoCuenta = 'ACTIVO';
    perfil.fechaVencimiento = nuevaFecha;
    autoSaveLocal();
  }

  renderSuperAdminDashboard();
}

async function ejecutarRegalarPruebaSuperAdmin(pubDocId, email, wa, clubNombre) {
  mostrarPromptModal(`Días de Prueba para ${clubNombre}`, 'Días a otorgar (ej: 7, 14, 30)', async (inputDias) => {
    const dias = parseInt(inputDias, 10) || 7;
    const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    const waClean = normalizarTelefonoWhatsApp(wa);
    const msgWA = encodeURIComponent(`¡Hola ${clubNombre}! 🎉 Te hemos otorgado una prueba especial de ${dias} días en 11FUT MANAGER para que disfrutes de todas las funciones de tu club. ¡Bienvenido! ⚽`);

    if (waClean) {
      window.open(`https://wa.me/${waClean}?text=${msgWA}`, '_blank');
    }

    mostrarToastRapido('Prueba Otorgada', `🟡 Se regalaron ${dias} días de prueba a ${clubNombre}.`, true);

    try {
      if (pubDocId) {
        setDoc(doc(db, 'publicos', pubDocId), {
          estadoCuenta: 'PRUEBA',
          fechaVencimiento: nuevaFecha,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn('Aviso Firestore en prueba:', err));
      }
    } catch (e) {
      console.warn(e);
    }

    if (perfil && perfil.email && email && perfil.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      perfil.estadoCuenta = 'PRUEBA';
      perfil.fechaVencimiento = nuevaFecha;
      autoSaveLocal();
    }

    renderSuperAdminDashboard();
  });
}

async function ejecutarSuspenderSuperAdmin(pubDocId, email) {
  mostrarConfirmacionApp('Suspender Club', '¿Estás seguro de suspender el acceso de este club?', async () => {
    try {
      if (pubDocId) {
        setDoc(doc(db, 'publicos', pubDocId), {
          estadoCuenta: 'VENCIDO',
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => console.warn('Aviso Firestore en suspensión:', err));
      }
    } catch (e) {
      console.warn(e);
    }

    if (perfil && perfil.email && email && perfil.email.trim().toLowerCase() === email.trim().toLowerCase()) {
      perfil.estadoCuenta = 'VENCIDO';
      autoSaveLocal();
    }

    mostrarToastRapido('Cuenta Suspendida', 'Se ha cambiado el estado a VENCIDO.', true);
    renderSuperAdminDashboard();
  });
}

function ejecutarChatWASuperAdmin(wa, clubNombre) {
  const waClean = normalizarTelefonoWhatsApp(wa);
  if (!waClean) return mostrarNotificacionApp('WhatsApp', 'No hay número de WhatsApp registrado para este club.', false);
  const msg = encodeURIComponent(`Hola ${clubNombre}, te contacto de la administración de 11FUT MANAGER.`);
  window.open(`https://wa.me/${waClean}?text=${msg}`, '_blank');
}

async function ejecutarEliminarClubSuperAdmin(pubDocId, clubNombre, uid, email) {
  mostrarConfirmacionApp('Eliminar Club', `¿Estás seguro de eliminar permanentemente a "${clubNombre}" (${email || pubDocId}) y purgar todos sus datos de Firebase?`, async () => {
    try {
      const emailClean = (email || '').trim().toLowerCase();
      const emailKey = emailClean ? emailClean.replace(/[^a-zA-Z0-9_-]/g, '_') : null;
      const targetUid = uid || (pubDocId && pubDocId.startsWith('usr_') ? pubDocId.replace('usr_', '') : null);

      const deletes = [];
      if (pubDocId) deletes.push(deleteDoc(doc(db, 'publicos', pubDocId)).catch(() => {}));
      if (emailKey && emailKey !== pubDocId) deletes.push(deleteDoc(doc(db, 'publicos', emailKey)).catch(() => {}));
      if (targetUid) {
        deletes.push(deleteDoc(doc(db, 'publicos', `usr_${targetUid}`)).catch(() => {}));
        deletes.push(deleteDoc(doc(db, 'usuarios', targetUid)).catch(() => {}));
      }

      // Escaneo y purga exhaustiva de cualquier registro residual vinculado al email
      if (emailClean) {
        try {
          const pubSnap = await getDocs(collection(db, 'publicos'));
          pubSnap.forEach(dSnap => {
            const dat = dSnap.data() || {};
            const dEmail = (dat.email || dat.perfil?.email || dat.userEmail || '').trim().toLowerCase();
            if (dEmail === emailClean || dSnap.id.toLowerCase() === emailClean.replace(/[^a-zA-Z0-9_-]/g, '_')) {
              deletes.push(deleteDoc(doc(db, 'publicos', dSnap.id)).catch(() => {}));
            }
          });

          const usrSnap = await getDocs(collection(db, 'usuarios'));
          usrSnap.forEach(dSnap => {
            const dat = dSnap.data() || {};
            const dEmail = (dat.perfil?.email || dat.email || '').trim().toLowerCase();
            if (dEmail === emailClean) {
              deletes.push(deleteDoc(doc(db, 'usuarios', dSnap.id)).catch(() => {}));
            }
          });
        } catch (scanErr) {
          console.warn('Aviso escaneando documentos al purgar club:', scanErr);
        }
      }

      await Promise.all(deletes);
      mostrarToastRapido('Club Eliminado', `El club "${clubNombre}" ha sido completamente purgado del sistema.`, true);
      await renderSuperAdminDashboard();
    } catch (e) {
      mostrarNotificacionApp('Error', 'No se pudo eliminar el club de la base de datos: ' + e.message, false);
    }
  });
}


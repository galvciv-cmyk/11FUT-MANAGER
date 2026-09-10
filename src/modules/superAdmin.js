import { db } from "../services/firebase.js";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { isSuperAdmin, perfil, autoSaveLocal, SUPER_ADMIN_EMAIL } from "./state.js";
import { mostrarConfirmacionApp, mostrarToastRapido, mostrarPromptModal, mostrarNotificacionApp, cerrarSesion } from "./config.js";

window._cerrarSesionCompleta = () => {
  cerrarSesion();
};

// ════════════════════════════════════════════════════════════════
// CONFIGURACIÓN PREDETERMINADA DE PASARELAS DE COBRO DIGITALES
// ════════════════════════════════════════════════════════════════
export const DEFAULT_PAYMENT_CONFIG = {
  pagoMovil: {
    activo: true,
    nombre: "Pago Móvil (Venezuela)",
    banco: "Banesco (0134)",
    telefono: "04141401560",
    cedula: "V-12345678",
    titular: "G&K NOVA / Linarez",
    moneda: "VES",
    instrucciones: "Realiza el pago a tasa BCV del día y coloca los últimos 4 dígitos de la referencia."
  },
  binance: {
    activo: true,
    nombre: "Binance Pay (USDT)",
    payId: "839201948",
    correo: "gyknova@gmail.com",
    red: "Binance Pay / BEP20",
    moneda: "USDT",
    instrucciones: "Transfiere vía Binance Pay (sin comisiones) o por red BSC/BEP20 y coloca los últimos 4 dígitos del Order ID o TxID."
  },
  zelle: {
    activo: true,
    nombre: "Zelle (USA)",
    correo: "gyknova@gmail.com",
    titular: "Linarez Zelle",
    moneda: "USD",
    instrucciones: "Envía el monto neto acordado y coloca los últimos 4 dígitos del número de confirmación."
  },
  airtm: {
    activo: true,
    nombre: "Airtm",
    correo: "gyknova@gmail.com",
    titular: "Linarez Airtm",
    moneda: "AirUSD",
    instrucciones: "Envía AirUSD de forma directa e indica los últimos 4 dígitos del ID de transferencia."
  },
  zinli: {
    activo: true,
    nombre: "Zinli",
    correo: "gyknova@gmail.com",
    titular: "Linarez Zinli",
    moneda: "USD",
    instrucciones: "Envía de billetera Zinli a Zinli y anota los últimos 4 dígitos de la referencia."
  },
  paypal: {
    activo: true,
    nombre: "PayPal (Comisión asumida por cliente)",
    correo: "gyknova@gmail.com",
    link: "https://paypal.me/gyknova",
    comisionPorcentaje: 5.4,
    comisionFija: 0.30,
    moneda: "USD",
    instrucciones: "El cliente debe enviar el importe bruto con la comisión PayPal para recibir el valor neto exacto de la membresía."
  }
};

let currentPaymentConfig = { ...DEFAULT_PAYMENT_CONFIG };
let currentBackofficeTab = 'clubes'; // 'clubes', 'pagos', 'finanzas', 'cuentas'
let currentClubFilter = 'TODOS'; // 'TODOS', 'PENDIENTE', 'PRUEBA', 'ACTIVO', 'VENCIDO'
let currentClubSearch = '';

// ════════════════════════════════════════════════════════════════
// SERVICIOS FIRESTORE DE PASARELAS Y PAGOS
// ════════════════════════════════════════════════════════════════
export async function obtenerConfiguracionPasarelas() {
  try {
    const docRef = doc(db, 'configuraciones', 'pagos');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      currentPaymentConfig = { ...DEFAULT_PAYMENT_CONFIG, ...data };
      return currentPaymentConfig;
    }
  } catch (e) {
    console.warn('Aviso leyendo configuración de pagos:', e);
  }
  return DEFAULT_PAYMENT_CONFIG;
}

export async function guardarConfiguracionPasarelas(newConfig) {
  try {
    currentPaymentConfig = { ...newConfig };
    await setDoc(doc(db, 'configuraciones', 'pagos'), newConfig, { merge: true });
    mostrarToastRapido('Configuración Guardada', '✅ Métodos de cobro actualizados en la nube.', true);
    return true;
  } catch (e) {
    mostrarNotificacionApp('Error al Guardar', 'No se pudo guardar la configuración: ' + e.message, false);
    return false;
  }
}

export async function obtenerPagosReportados() {
  const pagos = [];
  try {
    const snap = await getDocs(collection(db, 'pagos_reportados'));
    snap.forEach(d => {
      pagos.push({ id: d.id, ...d.data() });
    });
    // Ordenar los no conciliados primero, luego por fecha descendente
    pagos.sort((a, b) => {
      if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
      if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
      return new Date(b.createdAt || b.fechaReporte || 0) - new Date(a.createdAt || a.fechaReporte || 0);
    });
  } catch (e) {
    console.warn('Aviso consultando pagos_reportados:', e);
  }
  return pagos;
}

export async function obtenerHistorialFinanzas() {
  const transacciones = [];
  try {
    const snap = await getDocs(collection(db, 'finanzas_ingresos'));
    snap.forEach(d => {
      transacciones.push({ id: d.id, ...d.data() });
    });
    transacciones.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  } catch (e) {
    console.warn('Aviso consultando finanzas_ingresos:', e);
  }
  return transacciones;
}

const SVG_SHIELD_BOLT = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--oro)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polygon points="13 8 9 13 13 13 11 18 15 12 11 12 13 8" fill="var(--oro)"/></svg>`;
const SVG_BUILDINGS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="16" y1="14" x2="16.01" y2="14"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/></svg>`;
const SVG_BELL = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
const SVG_WALLET = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 10H18a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h4"/></svg>`;
const SVG_SETTINGS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const SVG_LOGOUT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const SVG_SEARCH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--oro)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

// ════════════════════════════════════════════════════════════════
// RENDER PRINCIPAL DEL BACKOFFICE SAAS (SÚPER ADMIN)
// ════════════════════════════════════════════════════════════════
export async function renderSuperAdminDashboard() {
  const container = document.getElementById('super-admin-content');
  if (!container) return;

  if (!isSuperAdmin()) {
    container.innerHTML = `
      <div class="liquid-glass-card" style="text-align:center;padding:40px;margin:20px auto;max-width:500px;">
        <div style="font-size:20px;color:var(--rojo);font-weight:900;letter-spacing:1px;">ACCESO EXCLUSIVO MASTER</div>
        <div style="font-size:12px;color:#aaa;margin-top:8px;line-height:1.6;">
          Este centro de control es reservado únicamente para el Administrador Global del SaaS 11FUT MANAGER.
        </div>
      </div>
    `;
    return;
  }

  // Cargar configuración de pagos en background si no está en memoria
  await obtenerConfiguracionPasarelas();

  // Estructura general de la Consola Backoffice (Liquid Glass)
  container.innerHTML = `
    <div style="max-width:1300px;margin:0 auto;padding-bottom:50px;">
      
      <!-- HEADER SAAS MASTER INDEPENDIENTE -->
      <div class="liquid-glass" style="border-radius:16px;padding:18px 24px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            ${SVG_SHIELD_BOLT}
            <h1 style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:900;color:var(--oro);margin:0;letter-spacing:1px;">11FUT MANAGER — BACKOFFICE SAAS</h1>
          </div>
          <div style="font-size:11px;color:#888;margin-top:2px;">Centro de Control Maestro de Clubes, Pagos Digitales y Finanzas</div>
        </div>

        <!-- BOTONES PRINCIPALES DE SUB-PESTAÑAS -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <button class="sa-tab-btn ${currentBackofficeTab === 'clubes' ? 'active' : ''}" onclick="window._switchBackofficeTab('clubes')" style="background:${currentBackofficeTab === 'clubes' ? 'var(--oro)' : 'rgba(26,32,44,0.7)'};color:${currentBackofficeTab === 'clubes' ? '#000' : '#ccc'};border:1px solid ${currentBackofficeTab === 'clubes' ? 'var(--oro)' : 'rgba(255,255,255,0.12)'};padding:9px 16px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;">
            ${SVG_BUILDINGS} Directorio de Clubes
          </button>
          <button class="sa-tab-btn ${currentBackofficeTab === 'pagos' ? 'active' : ''}" onclick="window._switchBackofficeTab('pagos')" style="background:${currentBackofficeTab === 'pagos' ? 'var(--oro)' : 'rgba(26,32,44,0.7)'};color:${currentBackofficeTab === 'pagos' ? '#000' : '#ccc'};border:1px solid ${currentBackofficeTab === 'pagos' ? 'var(--oro)' : 'rgba(255,255,255,0.12)'};padding:9px 16px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;">
            ${SVG_BELL} Bandeja de Pagos <span id="badge-pagos-pendientes-count" style="display:none;background:var(--rojo);color:#fff;border-radius:10px;padding:2px 7px;font-size:10px;font-weight:900;">0</span>
          </button>
          <button class="sa-tab-btn ${currentBackofficeTab === 'finanzas' ? 'active' : ''}" onclick="window._switchBackofficeTab('finanzas')" style="background:${currentBackofficeTab === 'finanzas' ? 'var(--oro)' : 'rgba(26,32,44,0.7)'};color:${currentBackofficeTab === 'finanzas' ? '#000' : '#ccc'};border:1px solid ${currentBackofficeTab === 'finanzas' ? 'var(--oro)' : 'rgba(255,255,255,0.12)'};padding:9px 16px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;">
            ${SVG_WALLET} Finanzas & Caja
          </button>
          <button class="sa-tab-btn ${currentBackofficeTab === 'cuentas' ? 'active' : ''}" onclick="window._switchBackofficeTab('cuentas')" style="background:${currentBackofficeTab === 'cuentas' ? 'var(--oro)' : 'rgba(26,32,44,0.7)'};color:${currentBackofficeTab === 'cuentas' ? '#000' : '#ccc'};border:1px solid ${currentBackofficeTab === 'cuentas' ? 'var(--oro)' : 'rgba(255,255,255,0.12)'};padding:9px 16px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;">
            ${SVG_SETTINGS} Cuentas de Cobro
          </button>
          <button onclick="window._cerrarSesionCompleta()" style="background:rgba(231,76,60,0.15);color:#e74c3c;border:1px solid rgba(231,76,60,0.35);padding:9px 16px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all 0.2s ease;">
            ${SVG_LOGOUT} Cerrar Sesión
          </button>
        </div>
      </div>

      <!-- CONTENEDOR DE LA SUB-PESTAÑA ACTIVA -->
      <div id="sa-active-view-container">
        <div style="text-align:center;padding:40px;color:var(--oro);">⏳ Cargando datos del Backoffice...</div>
      </div>

    </div>
  `;

  window._switchBackofficeTab = (tab) => {
    currentBackofficeTab = tab;
    renderSuperAdminDashboard();
  };

  const activeContainer = document.getElementById('sa-active-view-container');

  if (currentBackofficeTab === 'clubes') {
    await renderSubtabClubes(activeContainer);
  } else if (currentBackofficeTab === 'pagos') {
    await renderSubtabPagos(activeContainer);
  } else if (currentBackofficeTab === 'finanzas') {
    await renderSubtabFinanzas(activeContainer);
  } else if (currentBackofficeTab === 'cuentas') {
    renderSubtabCuentasCobro(activeContainer);
  }

  // Actualizar contador de badge de pagos en segundo plano
  actualizarBadgePagosPendientes();
}

async function actualizarBadgePagosPendientes() {
  const badge = document.getElementById('badge-pagos-pendientes-count');
  if (!badge) return;
  try {
    const pagos = await obtenerPagosReportados();
    const pendientes = pagos.filter(p => p.estado === 'PENDIENTE').length;
    if (pendientes > 0) {
      badge.textContent = pendientes;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {}
}

// ════════════════════════════════════════════════════════════════
// SUB-PESTAÑA 1: DIRECTORIO DE CLUBES CON BUSCADOR Y FILTROS
// ════════════════════════════════════════════════════════════════
async function renderSubtabClubes(container) {
  container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--oro);">⏳ Consultando instituciones registradas...</div>`;

  const mapClubes = new Map();
  const uidToEmailMap = new Map();
  const emailToUidMap = new Map();

  try {
    // 1. Usuarios
    const usrSnap = await getDocs(collection(db, 'usuarios'));
    usrSnap.forEach(docSnap => {
      const d = docSnap.data() || {};
      const p = d.perfil || {};
      const rawEmail = (p.email || d.email || '').trim().toLowerCase();
      const uid = docSnap.id;

      if (rawEmail && rawEmail.includes('@')) {
        uidToEmailMap.set(uid, rawEmail);
        emailToUidMap.set(rawEmail, uid);

        mapClubes.set(rawEmail, {
          id: `usr_${uid}`,
          uid: uid,
          club: p.club || d.club || 'Club Registrado',
          email: rawEmail,
          whatsapp: p.whatsapp || d.whatsapp || '',
          logo: p.logo || d.logo || '',
          estadoCuenta: p.estadoCuenta || d.estadoCuenta || 'PENDIENTE',
          fechaVencimiento: p.fechaVencimiento || d.fechaVencimiento || '',
          maxPerfiles: p.maxPerfiles || d.maxPerfiles || 1,
          updatedAt: d.updatedAt || p.updatedAt || ''
        });
      }
    });

    // 2. Públicos
    const pubSnap = await getDocs(collection(db, 'publicos'));
    pubSnap.forEach(docSnap => {
      const d = docSnap.data() || {};
      let rawEmail = (d.email || d.perfil?.email || d.userEmail || '').trim().toLowerCase();

      if ((!rawEmail || !rawEmail.includes('@') || rawEmail.startsWith('usr_')) && docSnap.id.startsWith('usr_')) {
        const uidExt = docSnap.id.replace('usr_', '');
        rawEmail = uidToEmailMap.get(uidExt) || '';
      }

      if (rawEmail && rawEmail.includes('@')) {
        const prev = mapClubes.get(rawEmail);
        const resolvedUid = (prev && prev.uid) || emailToUidMap.get(rawEmail) || (docSnap.id.startsWith('usr_') ? docSnap.id.replace('usr_', '') : '');

        if (!prev) {
          mapClubes.set(rawEmail, {
            id: resolvedUid ? `usr_${resolvedUid}` : docSnap.id,
            uid: resolvedUid,
            club: d.club || d.perfil?.club || 'Club Registrado',
            email: rawEmail,
            whatsapp: d.whatsapp || d.perfil?.whatsapp || '',
            logo: d.logo || d.perfil?.logo || '',
            estadoCuenta: d.estadoCuenta || d.perfil?.estadoCuenta || 'PENDIENTE',
            fechaVencimiento: d.fechaVencimiento || d.perfil?.fechaVencimiento || '',
            maxPerfiles: d.maxPerfiles || d.perfil?.maxPerfiles || 1,
            updatedAt: d.updatedAt || d.createdAt || ''
          });
        }
      }
    });
  } catch (e) {
    console.warn('Error leyendo clubes:', e);
  }

  // Cuenta Master garantizada
  const masterEmail = (SUPER_ADMIN_EMAIL || 'gyknova@gmail.com').trim().toLowerCase();
  if (!mapClubes.has(masterEmail)) {
    mapClubes.set(masterEmail, {
      id: 'master_club',
      uid: 'master_club',
      club: '11FUT MANAGER MASTER',
      email: SUPER_ADMIN_EMAIL,
      whatsapp: '+584141401560',
      logo: 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png',
      estadoCuenta: 'ACTIVO',
      fechaVencimiento: new Date('2099-01-01').toISOString(),
      maxPerfiles: 8,
      isMaster: true
    });
  }

  let todosClubes = Array.from(mapClubes.values());

  // Conteo para los chips de filtro
  const totalCount = todosClubes.length;
  const pendientesCount = todosClubes.filter(c => c.estadoCuenta === 'PENDIENTE' || c.estadoCuenta === 'EN_REVISION').length;
  const pruebaCount = todosClubes.filter(c => c.estadoCuenta === 'PRUEBA').length;
  const activosCount = todosClubes.filter(c => c.estadoCuenta === 'ACTIVO').length;
  const vencidosCount = todosClubes.filter(c => {
    if (c.isMaster) return false;
    const diff = new Date(c.fechaVencimiento || 0) - new Date();
    return c.estadoCuenta === 'VENCIDO' || c.estadoCuenta === 'CANCELADA' || diff <= 0;
  }).length;

  // Filtrado reactivo por buscador y chip
  let clubesFiltrados = todosClubes.filter(c => {
    if (c.isMaster) return true;

    // Filtro de estado
    if (currentClubFilter === 'PENDIENTE') {
      if (c.estadoCuenta !== 'PENDIENTE' && c.estadoCuenta !== 'EN_REVISION') return false;
    } else if (currentClubFilter === 'PRUEBA') {
      if (c.estadoCuenta !== 'PRUEBA') return false;
    } else if (currentClubFilter === 'ACTIVO') {
      if (c.estadoCuenta !== 'ACTIVO') return false;
    } else if (currentClubFilter === 'VENCIDO') {
      const diff = new Date(c.fechaVencimiento || 0) - new Date();
      if (c.estadoCuenta !== 'VENCIDO' && c.estadoCuenta !== 'CANCELADA' && diff > 0) return false;
    }

    // Buscador por texto
    if (currentClubSearch) {
      const q = currentClubSearch.toLowerCase();
      const matchName = (c.club || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchWA = (c.whatsapp || '').includes(q);
      if (!matchName && !matchEmail && !matchWA) return false;
    }

    return true;
  });

  window._setClubFilter = (filtro) => {
    currentClubFilter = filtro;
    renderSubtabClubes(container);
  };

  const filtrarYRenderizarListaDOM = () => {
    const q = (currentClubSearch || '').toLowerCase();
    const filtrados = todosClubes.filter(c => {
      if (currentClubFilter === 'PENDIENTE') {
        if (c.estadoCuenta !== 'PENDIENTE' && c.estadoCuenta !== 'EN_REVISION') return false;
      } else if (currentClubFilter === 'PRUEBA') {
        if (c.estadoCuenta !== 'PRUEBA') return false;
      } else if (currentClubFilter === 'ACTIVO') {
        if (c.estadoCuenta !== 'ACTIVO') return false;
      } else if (currentClubFilter === 'VENCIDO') {
        const diff = new Date(c.fechaVencimiento || 0) - new Date();
        if (c.estadoCuenta !== 'VENCIDO' && c.estadoCuenta !== 'CANCELADA' && diff > 0) return false;
      }

      if (q) {
        const matchName = (c.club || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchWA = (c.whatsapp || '').includes(q);
        if (!matchName && !matchEmail && !matchWA) return false;
      }
      return true;
    });

    filtrados.sort((a, b) => {
      if (a.isMaster) return -1;
      if (b.isMaster) return 1;
      if (a.estadoCuenta === 'PENDIENTE' && b.estadoCuenta !== 'PENDIENTE') return -1;
      if (a.estadoCuenta !== 'PENDIENTE' && b.estadoCuenta === 'PENDIENTE') return 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    const listEl = document.getElementById('sa-clubes-list');
    if (listEl) {
      listEl.innerHTML = filtrados.map(c => renderTarjetaClubHTML(c)).join('') || '<div class="liquid-glass-card" style="text-align:center;padding:40px;color:#888;">No se encontraron clubes con los filtros aplicados.</div>';
    }
  };

  container.innerHTML = `
    <!-- BARRA DE BÚSQUEDA Y FILTROS (LIQUID GLASS) -->
    <div class="liquid-glass-subtle" style="border-radius:14px;padding:14px 18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:280px;">
        ${SVG_SEARCH}
        <input type="text" id="sa-search-input" value="${currentClubSearch}" placeholder="Buscar club por nombre, email o WhatsApp..." style="background:rgba(8,12,18,0.7);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;width:100%;outline:none;">
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="sa-filter-chip ${currentClubFilter === 'TODOS' ? 'active' : ''}" onclick="window._setClubFilter('TODOS')">TODOS (${totalCount})</button>
        <button class="sa-filter-chip ${currentClubFilter === 'PENDIENTE' ? 'active' : ''}" onclick="window._setClubFilter('PENDIENTE')" style="color:#3498db;border-color:rgba(52,152,219,0.4);">PENDIENTES (${pendientesCount})</button>
        <button class="sa-filter-chip ${currentClubFilter === 'PRUEBA' ? 'active' : ''}" onclick="window._setClubFilter('PRUEBA')" style="color:var(--oro);border-color:rgba(212,175,55,0.4);">EN PRUEBA (${pruebaCount})</button>
        <button class="sa-filter-chip ${currentClubFilter === 'ACTIVO' ? 'active' : ''}" onclick="window._setClubFilter('ACTIVO')" style="color:#2ecc71;border-color:rgba(46,204,113,0.4);">ACTIVOS (${activosCount})</button>
        <button class="sa-filter-chip ${currentClubFilter === 'VENCIDO' ? 'active' : ''}" onclick="window._setClubFilter('VENCIDO')" style="color:#e74c3c;border-color:rgba(231,76,60,0.4);">VENCIDOS (${vencidosCount})</button>
      </div>
    </div>

    <!-- LISTA DE TARJETAS DE CLUBES -->
    <div id="sa-clubes-list" style="display:flex;flex-direction:column;gap:12px;"></div>
  `;

  filtrarYRenderizarListaDOM();

  // Listeners de búsqueda suave sin perder foco
  const searchInput = document.getElementById('sa-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentClubSearch = e.target.value;
      filtrarYRenderizarListaDOM();
    });
  }
}

function renderTarjetaClubHTML(c) {
  const clubNombre = (c.club || 'Sin Nombre').replace(/'/g, "\\'");
  const email = (c.email || c.id || '').replace(/'/g, "\\'");
  const wa = (c.whatsapp || 'Sin WhatsApp').replace(/'/g, "\\'");
  const fechaVencSafe = (c.fechaVencimiento || '').replace(/'/g, "\\'");
  const maxP = c.maxPerfiles || 1;
  const estado = c.estadoCuenta || 'PENDIENTE';

  let fechaExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (c.fechaVencimiento) {
    try {
      const d = new Date(c.fechaVencimiento);
      if (!isNaN(d.getTime())) fechaExp = d;
    } catch (e) {}
  }
  const diffMs = fechaExp - new Date();
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let badgeBg = 'rgba(212,175,55,0.12)';
  let badgeBorder = 'var(--oro)';
  let badgeColor = 'var(--oro)';
  let badgeLabel = `PRUEBA (${diasRestantes}d)`;

  if (estado === 'PENDIENTE') {
    badgeBg = 'rgba(52,152,219,0.15)';
    badgeBorder = '#3498db';
    badgeColor = '#3498db';
    badgeLabel = `PENDIENTE ACTIVACIÓN`;
  } else if (estado === 'EN_REVISION') {
    badgeBg = 'rgba(155,89,182,0.15)';
    badgeBorder = '#9b59b6';
    badgeColor = '#9b59b6';
    badgeLabel = `PAGO REPORTADO`;
  } else if (estado === 'ACTIVO') {
    badgeBg = 'rgba(46,204,113,0.15)';
    badgeBorder = '#2ecc71';
    badgeColor = '#2ecc71';
    badgeLabel = `ACTIVO (${diasRestantes}d)`;
  } else if (estado === 'VENCIDO' || (estado !== 'PENDIENTE' && estado !== 'EN_REVISION' && diasRestantes <= 0)) {
    badgeBg = 'rgba(231,76,60,0.15)';
    badgeBorder = '#e74c3c';
    badgeColor = '#e74c3c';
    badgeLabel = `VENCIDO`;
  }

  return `
    <div class="liquid-glass-card" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
      
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${c.logo || 'https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'}" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#141822;padding:3px;border:1px solid rgba(255,255,255,0.1);" onerror="this.src='https://res.cloudinary.com/djhpfdklk/image/upload/v1785381498/11fut_logo_iqnyxk.png'">
          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#fff;line-height:1.1;">${clubNombre}</div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">${email}</div>
          </div>
        </div>
        <span style="background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:11px;font-weight:900;padding:4px 12px;border-radius:12px;letter-spacing:0.5px;">
          ${badgeLabel}
        </span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;background:rgba(8,12,18,0.5);padding:10px 14px;border-radius:10px;font-size:11px;color:#ccc;border:1px solid rgba(255,255,255,0.06);">
        <div>WhatsApp: <span style="color:#fff;font-weight:700;">${wa}</span></div>
        <div style="display:flex;gap:14px;align-items:center;">
          <span style="color:var(--oro);font-weight:800;background:rgba(212,175,55,0.12);padding:2px 8px;border-radius:6px;">${maxP} Perfil(es) DT</span>
          <span>Vence: ${fechaExp.toLocaleDateString()}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(110px, 1fr));gap:8px;margin-top:2px;">
        ${c.isMaster ? `
          <div style="grid-column:1/-1;background:rgba(212,175,55,0.1);border:1px dashed var(--oro);color:var(--oro);padding:10px;border-radius:8px;font-size:12px;font-weight:900;text-align:center;letter-spacing:1px;">
            CUENTA MASTER PLATAFORMA SAAS
          </div>
        ` : `
          <button class="btn btn-green" onclick="window._aprobarMembresiaDirecta('${c.id}', '${email}', '${wa}', '${clubNombre}', '${c.uid || ''}', '${fechaVencSafe}')" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">APROBAR (30D)</button>
          <button class="btn btn-green" onclick="window._activarPruebaDirecta('${c.id}', '${email}', '${wa}', '${clubNombre}', '${c.uid || ''}', '${fechaVencSafe}')" style="font-size:11px;padding:8px;font-weight:900;justify-content:center;background:linear-gradient(135deg,#2ecc71,#27ae60);">PRUEBA (7D)</button>
          <button class="btn btn-gold" onclick="window._regalarDiasDirecto('${c.id}', '${email}', '${wa}', '${clubNombre}', '${c.uid || ''}', '${fechaVencSafe}')" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">+DÍAS</button>
          <button class="btn btn-gray" onclick="window._chatWhatsAppDirecto('${wa}', '${clubNombre}')" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">CHAT WA</button>
          <button class="btn btn-gray" onclick="window._suspenderClubDirecto('${c.id}', '${email}', '${c.uid || ''}')" style="font-size:11px;padding:8px;font-weight:800;color:var(--rojo);justify-content:center;">SUSPENDER</button>
          <button class="btn btn-red" onclick="window._eliminarClubDirecto('${c.id}', '${clubNombre}', '${c.uid || ''}', '${email}')" style="font-size:11px;padding:8px;font-weight:800;justify-content:center;">BORRAR</button>
        `}
      </div>

    </div>
  `;
}

// ════════════════════════════════════════════════════════════════
// SUB-PESTAÑA 2: BANDEJA DE PAGOS POR CONCILIAR (4 DÍGITOS)
// ════════════════════════════════════════════════════════════════
async function renderSubtabPagos(container) {
  container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--oro);">⏳ Consultando pagos reportados por los clubes...</div>`;

  const pagos = await obtenerPagosReportados();

  if (pagos.length === 0) {
    container.innerHTML = `
      <div class="liquid-glass-card" style="text-align:center;padding:40px;">
        <div style="font-size:18px;font-weight:900;color:var(--oro);letter-spacing:1px;">BANDEJA AL DÍA</div>
        <div style="font-size:12px;color:#aaa;margin-top:6px;">No hay pagos reportados pendientes por conciliar.</div>
      </div>
    `;
    return;
  }

  const pendientes = pagos.filter(p => p.estado === 'PENDIENTE');
  const conciliados = pagos.filter(p => p.estado !== 'PENDIENTE');

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--oro);letter-spacing:1px;">
        BANDEJA DE PAGOS REPORTADOS (${pendientes.length} Pendientes / ${conciliados.length} Conciliados)
      </div>
      <button onclick="window._renderPagosSubtab()" class="btn btn-gray" style="font-size:12px;padding:8px 16px;width:auto;">Actualizar Pagos</button>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px;">
      ${pagos.map(p => `
        <div class="liquid-glass-card" style="padding:18px;border-color:${p.estado === 'PENDIENTE' ? 'var(--oro)' : 'rgba(255,255,255,0.1)'};">
          
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
            <div>
              <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#fff;">
                ${p.clubNombre || 'Club'}
              </div>
              <div style="font-size:11px;color:#aaa;margin-top:2px;">Email: ${p.clubEmail || 'Sin email'} | WA: ${p.clubWhatsapp || 'Sin WA'}</div>
            </div>

            <span style="background:${p.estado === 'PENDIENTE' ? 'rgba(212,175,55,0.12)' : 'rgba(46,204,113,0.12)'};color:${p.estado === 'PENDIENTE' ? 'var(--oro)' : '#2ecc71'};border:1px solid ${p.estado === 'PENDIENTE' ? 'var(--oro)' : '#2ecc71'};padding:4px 12px;border-radius:12px;font-size:11px;font-weight:900;">
              ${p.estado === 'PENDIENTE' ? 'PENDIENTE DE CONCILIAR' : 'CONCILIADO Y ACTIVO'}
            </span>
          </div>

          <!-- DETALLES DEL PAGO DECLARADO -->
          <div class="liquid-glass-subtle" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;padding:14px;border-radius:10px;font-size:12px;margin-bottom:14px;">
            <div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Pasarela / Método:</div>
              <div style="color:var(--oro);font-weight:800;margin-top:2px;">${p.metodo || 'Digital'}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Monto Declarado:</div>
              <div style="color:#2ecc71;font-weight:900;margin-top:2px;font-size:14px;">${p.monto} ${p.moneda || 'USD'}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Referencia Declarada:</div>
              <div style="color:#fff;font-weight:900;margin-top:2px;letter-spacing:1px;font-size:14px;">...${p.referencia || '0000'}</div>
            </div>
            <div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Fecha de Reporte:</div>
              <div style="color:#ccc;margin-top:2px;">${new Date(p.fechaReporte || p.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN: COMPROBANTE Y CONCILIAR -->
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            ${p.comprobanteUrl ? `
              <button onclick="window._verComprobantePago('${p.comprobanteUrl}')" class="btn btn-gray" style="font-size:12px;padding:8px 16px;width:auto;">
                Ver Comprobante Adjunto
              </button>
            ` : '<span style="font-size:11px;color:#666;">Sin comprobante adjunto</span>'}

            ${p.estado === 'PENDIENTE' ? `
              <div style="display:flex;gap:8px;margin-left:auto;align-items:center;flex-wrap:wrap;">
                <button onclick="window._rechazarPagoReportado('${p.id}', '${p.clubNombre}', '${p.clubWhatsapp}')" class="btn btn-red" style="font-size:11px;padding:9px 14px;font-weight:800;width:auto;">
                  RECHAZAR
                </button>
                <button onclick="window._abrirModalConciliacionPago('${p.id}', '${p.referencia}', '${p.clubNombre}', '${p.monto}', '${p.moneda}', '${p.clubId || p.clubEmail}', '${p.clubWhatsapp}')" class="btn btn-gold" style="font-size:12px;padding:9px 18px;font-weight:900;width:auto;">
                  VERIFICAR Y CONCILIAR (4 DÍGITOS)
                </button>
              </div>
            ` : (p.estado === 'RECHAZADO' ? `
              <span style="font-size:12px;color:var(--rojo);font-weight:800;margin-left:auto;">Reporte Rechazado</span>
            ` : `
              <span style="font-size:12px;color:#2ecc71;font-weight:800;margin-left:auto;">Conciliado el ${new Date(p.fechaConciliacion || p.updatedAt).toLocaleDateString()}</span>
            `)}
          </div>

        </div>
      `).join('')}
    </div>
  `;

  window._renderPagosSubtab = () => renderSubtabPagos(container);
}

// ════════════════════════════════════════════════════════════════
// SUB-PESTAÑA 3: DASHBOARD FINANCIERO & CAJA (MRR)
// ════════════════════════════════════════════════════════════════
async function renderSubtabFinanzas(container) {
  container.innerHTML = `<div style="text-align:center;padding:30px;color:var(--oro);">⏳ Cargando balance financiero...</div>`;

  const finanzas = await obtenerHistorialFinanzas();

  // Calcular métricas
  const mesActual = new Date().getMonth();
  const anioActual = new Date().getFullYear();

  let totalMesUSD = 0;
  let conteoMes = 0;
  const desglosePorMetodo = {
    pagoMovil: 0,
    binance: 0,
    zelle: 0,
    airtm: 0,
    zinli: 0,
    paypal: 0
  };

  finanzas.forEach(t => {
    const f = new Date(t.fecha || 0);
    if (f.getMonth() === mesActual && f.getFullYear() === anioActual) {
      const montoUSD = parseFloat(t.montoUSD || t.monto || 0);
      totalMesUSD += montoUSD;
      conteoMes++;

      const met = (t.metodo || 'pagoMovil').toLowerCase();
      if (desglosePorMetodo[met] !== undefined) {
        desglosePorMetodo[met] += montoUSD;
      }
    }
  });

  container.innerHTML = `
    <!-- CARDS DE RESUMEN FINANCIERO -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-bottom:20px;">
      
      <div class="liquid-glass-card" style="margin:0;border-left:4px solid var(--oro);text-align:center;padding:18px;">
        <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Facturación Este Mes</div>
        <div style="font-size:32px;font-weight:900;color:var(--oro);margin-top:4px;">$${totalMesUSD.toFixed(2)} USD</div>
        <div style="font-size:11px;color:#666;margin-top:4px;">${conteoMes} suscripciones cobradas</div>
      </div>

      <div class="liquid-glass-card" style="margin:0;border-left:4px solid #3498db;text-align:center;padding:18px;">
        <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Pago Móvil</div>
        <div style="font-size:26px;font-weight:900;color:#3498db;margin-top:4px;">$${desglosePorMetodo.pagoMovil.toFixed(2)}</div>
        <div style="font-size:11px;color:#666;margin-top:4px;">Cobros en moneda local</div>
      </div>

      <div class="liquid-glass-card" style="margin:0;border-left:4px solid #f39c12;text-align:center;padding:18px;">
        <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Binance Pay</div>
        <div style="font-size:26px;font-weight:900;color:#f39c12;margin-top:4px;">$${desglosePorMetodo.binance.toFixed(2)}</div>
        <div style="font-size:11px;color:#666;margin-top:4px;">Cobros USDT sin comisión</div>
      </div>

      <div class="liquid-glass-card" style="margin:0;border-left:4px solid #2ecc71;text-align:center;padding:18px;">
        <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Zelle / Otras</div>
        <div style="font-size:26px;font-weight:900;color:#2ecc71;margin-top:4px;">$${(desglosePorMetodo.zelle + desglosePorMetodo.airtm + desglosePorMetodo.zinli + desglosePorMetodo.paypal).toFixed(2)}</div>
        <div style="font-size:11px;color:#666;margin-top:4px;">Zelle, Airtm, Zinli, PayPal</div>
      </div>

    </div>

    <!-- TABLA DE HISTORIAL CONTABLE -->
    <div class="liquid-glass-card" style="padding:18px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:var(--oro);letter-spacing:1px;margin-bottom:14px;">HISTORIAL DE INGRESOS Y TRANSACCIONES CONCILIADAS</div>
      
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:rgba(10,14,22,0.8);color:var(--oro);text-align:left;border-bottom:1px solid rgba(255,255,255,0.1);">
              <th style="padding:10px;">Fecha</th>
              <th style="padding:10px;">Club / Institución</th>
              <th style="padding:10px;">Pasarela</th>
              <th style="padding:10px;">Monto</th>
              <th style="padding:10px;">Referencia 4 Dígitos</th>
              <th style="padding:10px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${finanzas.length ? finanzas.map(f => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:10px;color:#aaa;">${new Date(f.fecha).toLocaleDateString()}</td>
                <td style="padding:10px;font-weight:700;color:#fff;">${f.clubNombre}</td>
                <td style="padding:10px;color:var(--oro);">${f.metodo}</td>
                <td style="padding:10px;color:#2ecc71;font-weight:900;">$${parseFloat(f.montoUSD || f.monto || 0).toFixed(2)} USD</td>
                <td style="padding:10px;font-family:monospace;font-size:14px;color:#fff;">...${f.referencia}</td>
                <td style="padding:10px;"><span style="background:rgba(46,204,113,0.15);color:#2ecc71;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:900;">CONCILIADO</span></td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#666;">No hay transacciones registradas aún.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════
// SUB-PESTAÑA 4: CONFIGURACIÓN DE CUENTAS DE COBRO (SWITCHES ON/OFF)
// ════════════════════════════════════════════════════════════════
function renderSubtabCuentasCobro(container) {
  const cfg = currentPaymentConfig;

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--oro);letter-spacing:1px;">
          CONFIGURACIÓN DE PASARELAS Y CUENTAS BANCARIAS
        </div>
        <div style="font-size:12px;color:#aaa;">Activa o desactiva métodos de cobro y actualiza tus datos. Los clubes solo verán los métodos encendidos.</div>
      </div>
      <button onclick="window._guardarCuentasCobroForm()" class="btn btn-green" style="font-size:13px;padding:10px 18px;font-weight:900;">
        GUARDAR TODA LA CONFIGURACIÓN
      </button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:16px;">
      
      <!-- 1. PAGO MÓVIL -->
      <div class="liquid-glass-card" style="padding:18px;border-color:${cfg.pagoMovil.activo ? 'var(--oro)' : 'rgba(255,255,255,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:900;color:var(--oro);font-size:16px;letter-spacing:0.5px;">PAGO MÓVIL</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="cfg-sw-pm" ${cfg.pagoMovil.activo ? 'checked' : ''}>
            <span style="font-size:12px;font-weight:800;color:${cfg.pagoMovil.activo ? '#2ecc71' : '#aaa'};">${cfg.pagoMovil.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          </label>
        </div>
        <label style="font-size:11px;color:#888;">Banco Receptor:</label>
        <input type="text" id="cfg-pm-banco" value="${cfg.pagoMovil.banco || ''}">
        <label style="font-size:11px;color:#888;">Teléfono Receptor:</label>
        <input type="text" id="cfg-pm-telefono" value="${cfg.pagoMovil.telefono || ''}">
        <label style="font-size:11px;color:#888;">Cédula o RIF:</label>
        <input type="text" id="cfg-pm-cedula" value="${cfg.pagoMovil.cedula || ''}">
        <label style="font-size:11px;color:#888;">Titular de la Cuenta:</label>
        <input type="text" id="cfg-pm-titular" value="${cfg.pagoMovil.titular || ''}">
      </div>

      <!-- 2. BINANCE PAY -->
      <div class="liquid-glass-card" style="padding:18px;border-color:${cfg.binance.activo ? '#f39c12' : 'rgba(255,255,255,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:900;color:#f39c12;font-size:16px;letter-spacing:0.5px;">BINANCE PAY (USDT)</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="cfg-sw-binance" ${cfg.binance.activo ? 'checked' : ''}>
            <span style="font-size:12px;font-weight:800;color:${cfg.binance.activo ? '#2ecc71' : '#aaa'};">${cfg.binance.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          </label>
        </div>
        <label style="font-size:11px;color:#888;">Binance Pay ID:</label>
        <input type="text" id="cfg-binance-payid" value="${cfg.binance.payId || ''}">
        <label style="font-size:11px;color:#888;">Correo de la Cuenta Binance:</label>
        <input type="text" id="cfg-binance-correo" value="${cfg.binance.correo || ''}">
        <label style="font-size:11px;color:#888;">Red Recomendada:</label>
        <input type="text" id="cfg-binance-red" value="${cfg.binance.red || 'Binance Pay / BEP20'}">
      </div>

      <!-- 3. ZELLE -->
      <div class="liquid-glass-card" style="padding:18px;border-color:${cfg.zelle.activo ? '#2ecc71' : 'rgba(255,255,255,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:900;color:#2ecc71;font-size:16px;letter-spacing:0.5px;">ZELLE (USA)</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="cfg-sw-zelle" ${cfg.zelle.activo ? 'checked' : ''}>
            <span style="font-size:12px;font-weight:800;color:${cfg.zelle.activo ? '#2ecc71' : '#aaa'};">${cfg.zelle.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          </label>
        </div>
        <label style="font-size:11px;color:#888;">Correo o Teléfono Zelle:</label>
        <input type="text" id="cfg-zelle-correo" value="${cfg.zelle.correo || ''}">
        <label style="font-size:11px;color:#888;">Nombre del Titular:</label>
        <input type="text" id="cfg-zelle-titular" value="${cfg.zelle.titular || ''}">
      </div>

      <!-- 4. AIRTM -->
      <div class="liquid-glass-card" style="padding:18px;border-color:${cfg.airtm.activo ? '#3498db' : 'rgba(255,255,255,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:900;color:#3498db;font-size:16px;letter-spacing:0.5px;">AIRTM</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="cfg-sw-airtm" ${cfg.airtm.activo ? 'checked' : ''}>
            <span style="font-size:12px;font-weight:800;color:${cfg.airtm.activo ? '#2ecc71' : '#aaa'};">${cfg.airtm.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          </label>
        </div>
        <label style="font-size:11px;color:#888;">Correo de Airtm:</label>
        <input type="text" id="cfg-airtm-correo" value="${cfg.airtm.correo || ''}">
        <label style="font-size:11px;color:#888;">Nombre del Titular:</label>
        <input type="text" id="cfg-airtm-titular" value="${cfg.airtm.titular || ''}">
      </div>

      <!-- 5. ZINLI -->
      <div class="liquid-glass-card" style="padding:18px;border-color:${cfg.zinli.activo ? '#9b59b6' : 'rgba(255,255,255,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:900;color:#9b59b6;font-size:16px;letter-spacing:0.5px;">ZINLI</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="cfg-sw-zinli" ${cfg.zinli.activo ? 'checked' : ''}>
            <span style="font-size:12px;font-weight:800;color:${cfg.zinli.activo ? '#2ecc71' : '#aaa'};">${cfg.zinli.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          </label>
        </div>
        <label style="font-size:11px;color:#888;">Correo de Zinli:</label>
        <input type="text" id="cfg-zinli-correo" value="${cfg.zinli.correo || ''}">
        <label style="font-size:11px;color:#888;">Nombre del Titular:</label>
        <input type="text" id="cfg-zinli-titular" value="${cfg.zinli.titular || ''}">
      </div>

      <!-- 6. PAYPAL -->
      <div class="liquid-glass-card" style="padding:18px;border-color:${cfg.paypal.activo ? '#0070ba' : 'rgba(255,255,255,0.1)'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:900;color:#0070ba;font-size:16px;letter-spacing:0.5px;">PAYPAL</div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="cfg-sw-paypal" ${cfg.paypal.activo ? 'checked' : ''}>
            <span style="font-size:12px;font-weight:800;color:${cfg.paypal.activo ? '#2ecc71' : '#aaa'};">${cfg.paypal.activo ? 'ACTIVO' : 'INACTIVO'}</span>
          </label>
        </div>
        <label style="font-size:11px;color:#888;">Correo PayPal:</label>
        <input type="text" id="cfg-paypal-correo" value="${cfg.paypal.correo || ''}">
        <label style="font-size:11px;color:#888;">Enlace Directo (paypal.me):</label>
        <input type="text" id="cfg-paypal-link" value="${cfg.paypal.link || ''}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <label style="font-size:11px;color:#888;">Comisión %:</label>
            <input type="number" id="cfg-paypal-pct" step="0.1" value="${cfg.paypal.comisionPorcentaje || 5.4}">
          </div>
          <div>
            <label style="font-size:11px;color:#888;">Fija ($):</label>
            <input type="number" id="cfg-paypal-fija" step="0.01" value="${cfg.paypal.comisionFija || 0.30}">
          </div>
        </div>
      </div>

    </div>

    <div style="margin-top:20px;text-align:right;">
      <button onclick="window._guardarCuentasCobroForm()" class="btn btn-green" style="font-size:14px;padding:12px 24px;font-weight:900;">
        GUARDAR TODA LA CONFIGURACIÓN
      </button>
    </div>
  `;

  window._guardarCuentasCobroForm = async () => {
    const updated = {
      pagoMovil: {
        ...currentPaymentConfig.pagoMovil,
        activo: document.getElementById('cfg-sw-pm')?.checked ?? true,
        banco: document.getElementById('cfg-pm-banco')?.value.trim() || '',
        telefono: document.getElementById('cfg-pm-telefono')?.value.trim() || '',
        cedula: document.getElementById('cfg-pm-cedula')?.value.trim() || '',
        titular: document.getElementById('cfg-pm-titular')?.value.trim() || ''
      },
      binance: {
        ...currentPaymentConfig.binance,
        activo: document.getElementById('cfg-sw-binance')?.checked ?? true,
        payId: document.getElementById('cfg-binance-payid')?.value.trim() || '',
        correo: document.getElementById('cfg-binance-correo')?.value.trim() || '',
        red: document.getElementById('cfg-binance-red')?.value.trim() || ''
      },
      zelle: {
        ...currentPaymentConfig.zelle,
        activo: document.getElementById('cfg-sw-zelle')?.checked ?? true,
        correo: document.getElementById('cfg-zelle-correo')?.value.trim() || '',
        titular: document.getElementById('cfg-zelle-titular')?.value.trim() || ''
      },
      airtm: {
        ...currentPaymentConfig.airtm,
        activo: document.getElementById('cfg-sw-airtm')?.checked ?? true,
        correo: document.getElementById('cfg-airtm-correo')?.value.trim() || '',
        titular: document.getElementById('cfg-airtm-titular')?.value.trim() || ''
      },
      zinli: {
        ...currentPaymentConfig.zinli,
        activo: document.getElementById('cfg-sw-zinli')?.checked ?? true,
        correo: document.getElementById('cfg-zinli-correo')?.value.trim() || '',
        titular: document.getElementById('cfg-zinli-titular')?.value.trim() || ''
      },
      paypal: {
        ...currentPaymentConfig.paypal,
        activo: document.getElementById('cfg-sw-paypal')?.checked ?? true,
        correo: document.getElementById('cfg-paypal-correo')?.value.trim() || '',
        link: document.getElementById('cfg-paypal-link')?.value.trim() || '',
        comisionPorcentaje: parseFloat(document.getElementById('cfg-paypal-pct')?.value) || 5.4,
        comisionFija: parseFloat(document.getElementById('cfg-paypal-fija')?.value) || 0.30
      }
    };

    await guardarConfiguracionPasarelas(updated);
    renderSubtabCuentasCobro(container);
  };
}

// ════════════════════════════════════════════════════════════════
// MODAL DE CONCILIACIÓN CON 4 DÍGITOS (SÚPER ADMIN)
// ════════════════════════════════════════════════════════════════
window._abrirModalConciliacionPago = (pagoId, refEsperada, clubNombre, monto, moneda, targetUserKey, clubWA) => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-title" style="letter-spacing:1px;font-family:'Barlow Condensed',sans-serif;font-size:22px;color:var(--oro);">
      CONCILIACIÓN DE PAGO — ${clubNombre}
    </div>
    
    <div class="liquid-glass-subtle" style="margin-bottom:14px;padding:14px;border-radius:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:12px;color:#aaa;">Monto a Conciliar:</span>
        <span style="font-size:18px;font-weight:900;color:#2ecc71;">${monto} ${moneda}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:#aaa;">Referencia Declarada por el Club:</span>
        <span style="font-family:monospace;font-size:16px;font-weight:900;color:var(--oro);">...${refEsperada}</span>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <label style="font-size:12px;color:var(--oro);font-weight:800;display:block;margin-bottom:6px;">
        Ingresa los últimos 4 dígitos vistos en tu banco o billetera:
      </label>
      <input type="text" id="sa-input-conciliar-ref" maxlength="4" placeholder="ej. ${refEsperada}" style="font-family:monospace;font-size:20px;letter-spacing:6px;text-align:center;padding:12px;background:#181818;border:2px solid var(--oro);color:#fff;font-weight:900;">
      <div id="sa-match-status" style="font-size:11px;color:#888;text-align:center;margin-top:6px;">Escribe los 4 dígitos para validar coincidencia</div>
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;">
      <button id="sa-btn-confirm-conciliar" class="btn btn-green" disabled style="padding:12px;font-size:13px;font-weight:900;opacity:0.5;cursor:not-allowed;">
        CONCILIAR Y ACTIVAR (+30 DÍAS)
      </button>
      <button onclick="document.getElementById('modal').style.display='none'" class="btn btn-gray">CANCELAR</button>
    </div>
  `;

  modal.style.display = 'flex';

  const inputRef = document.getElementById('sa-input-conciliar-ref');
  const btnConfirm = document.getElementById('sa-btn-confirm-conciliar');
  const matchStatus = document.getElementById('sa-match-status');

  inputRef.focus();

  inputRef.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val.length === 4) {
      if (val === refEsperada) {
        matchStatus.innerHTML = '<span style="color:#2ecc71;font-weight:900;">REFERENCIA COINCIDE EXACTAMENTE</span>';
        btnConfirm.disabled = false;
        btnConfirm.style.opacity = '1';
        btnConfirm.style.cursor = 'pointer';
        btnConfirm.textContent = 'CONCILIAR Y ACTIVAR (+30 DÍAS)';
      } else {
        matchStatus.innerHTML = `<span style="color:var(--rojo);font-weight:800;">Discrepancia: El club declaró ...${refEsperada} y tú ingresaste ...${val}</span>`;
        btnConfirm.disabled = false;
        btnConfirm.style.opacity = '1';
        btnConfirm.style.cursor = 'pointer';
        btnConfirm.textContent = 'FORZAR APROBACIÓN CON DISCREPANCIA';
      }
    } else {
      matchStatus.textContent = 'Escribe los 4 dígitos para validar coincidencia';
      btnConfirm.disabled = true;
      btnConfirm.style.opacity = '0.5';
      btnConfirm.style.cursor = 'not-allowed';
      btnConfirm.textContent = 'CONCILIAR Y ACTIVAR (+30 DÍAS)';
    }
  });

  btnConfirm.addEventListener('click', async () => {
    modal.style.display = 'none';
    mostrarToastRapido('Conciliando...', 'Actualizando membresía y registrando ingreso...', true);

    const dias = 30;
    const nuevaFecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
    const refConfirmada = inputRef.value.trim();

    // 1. Actualizar el pago en 'pagos_reportados'
    await setDoc(doc(db, 'pagos_reportados', pagoId), {
      estado: 'CONCILIADO',
      refConfirmadaAdmin: refConfirmada,
      fechaConciliacion: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    // 2. Asentar en 'finanzas_ingresos'
    await setDoc(doc(db, 'finanzas_ingresos', `ing_${Date.now()}`), {
      clubNombre,
      clubEmail: targetUserKey,
      monto: monto,
      montoUSD: monto,
      referencia: refConfirmada,
      metodo: 'Digital',
      fecha: new Date().toISOString()
    }).catch(() => {});

    // 3. Activar membresía en el club
    const payload = {
      estadoCuenta: 'ACTIVO',
      fechaVencimiento: nuevaFecha,
      club: clubNombre,
      updatedAt: new Date().toISOString()
    };

    const targetUid = targetUserKey.replace('usr_', '');
    const emailKey = (targetUserKey.includes('@') ? targetUserKey : '').replace(/[@.]/g, '_');
    const updatePromises = [
      setDoc(doc(db, 'usuarios', targetUid), { perfil: payload }, { merge: true }).catch(() => {}),
      setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {})
    ];
    if (emailKey) {
      updatePromises.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));
    }
    await Promise.all(updatePromises);

    // 4. Notificación WhatsApp al cliente
    const waClean = (clubWA || '').toString().replace(/\D/g, '');
    if (waClean) {
      const msg = encodeURIComponent(`¡Hola ${clubNombre}! 🎉 Confirmamos la recepción de tu pago (${monto} ${moneda}, Ref: ...${refConfirmada}). Tu membresía en 11FUT MANAGER ha sido ACTIVADA exitosamente hasta el ${new Date(nuevaFecha).toLocaleDateString()}. ¡A disfrutar de todas las herramientas! ⚽🏆`);
      window.open(`https://wa.me/${waClean}?text=${msg}`, '_blank');
    }

    mostrarToastRapido('Membresía Activada', `🟢 ${clubNombre} activado por 30 días.`, true);
    renderSuperAdminDashboard();
  });
};

window._rechazarPagoReportado = (pagoId, clubNombre, wa) => {
  mostrarConfirmacionApp('Rechazar Pago', `¿Deseas rechazar el reporte de pago de "${clubNombre}"?`, async () => {
    await setDoc(doc(db, 'pagos_reportados', pagoId), {
      estado: 'RECHAZADO',
      fechaRechazo: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    const waClean = (wa || '').toString().replace(/\D/g, '');
    if (waClean) {
      const msg = encodeURIComponent(`Hola ${clubNombre}, te informamos desde la administración de 11FUT MANAGER que tu reporte de pago no pudo ser conciliado (referencia no encontrada o inconsistente). Por favor verifica los 4 últimos dígitos de la referencia o contáctanos por aquí para asistirte.`);
      window.open(`https://wa.me/${waClean}?text=${msg}`, '_blank');
    }

    mostrarToastRapido('Pago Rechazado', `El reporte de ${clubNombre} fue marcado como RECHAZADO.`, true);
    renderSuperAdminDashboard();
  });
};

window._verComprobantePago = (url) => {
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modal-content');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-title" style="letter-spacing:1px;font-family:'Barlow Condensed',sans-serif;font-size:22px;color:var(--oro);">
      COMPROBANTE DE PAGO
    </div>
    <div class="liquid-glass-subtle" style="text-align:center;margin-bottom:14px;padding:10px;border-radius:10px;max-height:75vh;overflow:auto;">
      <img src="${url}" style="max-width:100%;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.8);">
    </div>
    <button onclick="document.getElementById('modal').style.display='none'" class="btn btn-gold" style="width:100%;">CERRAR</button>
  `;
  modal.style.display = 'flex';
};

// ════════════════════════════════════════════════════════════════
// HANDLERS DIRECTOS DE LA LISTA DE CLUBES
// ════════════════════════════════════════════════════════════════
// Función ultra-robusta de cálculo de fechas protegida contra RangeError y formatos diversos
function calcularNuevaFechaVencimiento(currentFechaExp, inputDiasOrDays, defaultDias = 7) {
  let fechaBase = new Date();
  if (currentFechaExp) {
    try {
      const d = new Date(currentFechaExp);
      if (!isNaN(d.getTime()) && d.getTime() > fechaBase.getTime()) {
        fechaBase = d;
      }
    } catch (e) {}
  }

  let targetDate = null;
  const str = String(inputDiasOrDays !== undefined && inputDiasOrDays !== null ? inputDiasOrDays : '').trim();

  // Caso A: Fecha directa (ej: 2026-10-15 o 15/10/2026 o 15-10-2026)
  if (str.includes('/') || (str.includes('-') && str.length >= 8)) {
    try {
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
          const cand = new Date(`${y}-${m}-${d}T23:59:59.000Z`);
          if (!isNaN(cand.getTime())) targetDate = cand;
        }
      }
      if (!targetDate) {
        const cand = new Date(str);
        if (!isNaN(cand.getTime())) targetDate = cand;
      }
    } catch (e) {}
  }

  // Caso B: Número de días (ej: 3, 7, 14, 30, '+30 días')
  if (!targetDate) {
    const parsed = parseInt(str, 10);
    const dias = (!isNaN(parsed) && parsed > 0 && parsed <= 3650) ? parsed : defaultDias;
    targetDate = new Date(fechaBase.getTime() + dias * 24 * 60 * 60 * 1000);
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    targetDate = new Date(Date.now() + defaultDias * 24 * 60 * 60 * 1000);
  }

  return targetDate.toISOString();
}

window._aprobarMembresiaDirecta = async (pubDocId, email, wa, clubNombre, uid, currentFechaExp) => {
  const nuevaFecha = calcularNuevaFechaVencimiento(currentFechaExp, 30, 30);

  const payload = { estadoCuenta: 'ACTIVO', fechaVencimiento: nuevaFecha, club: clubNombre, updatedAt: new Date().toISOString() };
  const targetUid = uid || (pubDocId ? pubDocId.replace('usr_', '') : '');
  const emailKey = (email || '').replace(/[@.]/g, '_');

  const proms = [];
  if (targetUid) {
    proms.push(setDoc(doc(db, 'usuarios', targetUid), { perfil: payload }, { merge: true }).catch(() => {}));
    proms.push(setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {}));
  }
  if (pubDocId && pubDocId !== `usr_${targetUid}`) {
    proms.push(setDoc(doc(db, 'publicos', pubDocId), payload, { merge: true }).catch(() => {}));
  }
  if (emailKey && emailKey !== pubDocId && emailKey !== `usr_${targetUid}`) {
    proms.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));
  }
  await Promise.all(proms);

  mostrarToastRapido('Club Aprobado', `Membresía para ${clubNombre} aprobada por 30 días.`, true);
  renderSuperAdminDashboard();
};

window._activarPruebaDirecta = async (pubDocId, email, wa, clubNombre, uid, currentFechaExp) => {
  const nuevaFecha = calcularNuevaFechaVencimiento(currentFechaExp, 7, 7);

  const payload = { estadoCuenta: 'PRUEBA', fechaVencimiento: nuevaFecha, club: clubNombre, updatedAt: new Date().toISOString() };
  const targetUid = uid || (pubDocId ? pubDocId.replace('usr_', '') : '');
  const emailKey = (email || '').replace(/[@.]/g, '_');

  const proms = [];
  if (targetUid) {
    proms.push(setDoc(doc(db, 'usuarios', targetUid), { perfil: payload }, { merge: true }).catch(() => {}));
    proms.push(setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {}));
  }
  if (pubDocId && pubDocId !== `usr_${targetUid}`) {
    proms.push(setDoc(doc(db, 'publicos', pubDocId), payload, { merge: true }).catch(() => {}));
  }
  if (emailKey && emailKey !== pubDocId && emailKey !== `usr_${targetUid}`) {
    proms.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));
  }
  await Promise.all(proms);

  mostrarToastRapido('Prueba Activada', `7 días de prueba activados para ${clubNombre}.`, true);
  renderSuperAdminDashboard();
};

window._regalarDiasDirecto = (pubDocId, email, wa, clubNombre, uid, currentFechaExp) => {
  mostrarPromptModal(`Días Adicionales para ${clubNombre}`, 'Cantidad de días o fecha (ej: 7, 30, 2026-12-31)', async (inputDias) => {
    const nuevaFecha = calcularNuevaFechaVencimiento(currentFechaExp, inputDias, 7);

    const payload = { estadoCuenta: 'ACTIVO', fechaVencimiento: nuevaFecha, club: clubNombre, updatedAt: new Date().toISOString() };
    const targetUid = uid || (pubDocId ? pubDocId.replace('usr_', '') : '');
    const emailKey = (email || '').replace(/[@.]/g, '_');

    const proms = [];
    if (targetUid) {
      proms.push(setDoc(doc(db, 'usuarios', targetUid), { perfil: payload }, { merge: true }).catch(() => {}));
      proms.push(setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {}));
    }
    if (pubDocId && pubDocId !== `usr_${targetUid}`) {
      proms.push(setDoc(doc(db, 'publicos', pubDocId), payload, { merge: true }).catch(() => {}));
    }
    if (emailKey && emailKey !== pubDocId && emailKey !== `usr_${targetUid}`) {
      proms.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));
    }
    await Promise.all(proms);

    const fechaLegible = new Date(nuevaFecha).toLocaleDateString();
    mostrarToastRapido('Días Asignados', `Vigencia de ${clubNombre} actualizada hasta ${fechaLegible}.`, true);
    renderSuperAdminDashboard();
  });
};

window._suspenderClubDirecto = (pubDocId, email, uid) => {
  mostrarConfirmacionApp('Suspender Club', '¿Estás seguro de suspender este club?', async () => {
    const payload = { estadoCuenta: 'CANCELADA', cancelada: true, updatedAt: new Date().toISOString() };
    const targetUid = uid || (pubDocId ? pubDocId.replace('usr_', '') : '');
    const emailKey = (email || '').replace(/[@.]/g, '_');

    const proms = [];
    if (targetUid) {
      proms.push(setDoc(doc(db, 'usuarios', targetUid), { perfil: payload }, { merge: true }).catch(() => {}));
      proms.push(setDoc(doc(db, 'publicos', `usr_${targetUid}`), payload, { merge: true }).catch(() => {}));
    }
    if (pubDocId && pubDocId !== `usr_${targetUid}`) {
      proms.push(setDoc(doc(db, 'publicos', pubDocId), payload, { merge: true }).catch(() => {}));
    }
    if (emailKey && emailKey !== pubDocId && emailKey !== `usr_${targetUid}`) {
      proms.push(setDoc(doc(db, 'publicos', emailKey), payload, { merge: true }).catch(() => {}));
    }
    await Promise.all(proms);

    mostrarToastRapido('Club Suspendido', 'El club ha sido suspendido.', true);
    renderSuperAdminDashboard();
  });
};

window._chatWhatsAppDirecto = (wa, clubNombre) => {
  const clean = (wa || '').toString().replace(/\D/g, '');
  if (!clean) return mostrarNotificacionApp('WhatsApp', 'No hay WhatsApp registrado.', false);
  const msg = encodeURIComponent(`Hola ${clubNombre}, te contacto de la administración de 11FUT MANAGER.`);
  window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
};

window._eliminarClubDirecto = (pubDocId, clubNombre, uid, email) => {
  mostrarConfirmacionApp('Eliminar Club', `¿Estás seguro de purgar permanentemente a "${clubNombre}"?`, async () => {
    const targetUid = uid || (pubDocId ? pubDocId.replace('usr_', '') : '');
    const emailKey = (email || '').replace(/[@.]/g, '_');

    const proms = [];
    if (targetUid) {
      proms.push(deleteDoc(doc(db, 'usuarios', targetUid)).catch(() => {}));
      proms.push(deleteDoc(doc(db, 'publicos', `usr_${targetUid}`)).catch(() => {}));
    }
    if (pubDocId && pubDocId !== `usr_${targetUid}`) {
      proms.push(deleteDoc(doc(db, 'publicos', pubDocId)).catch(() => {}));
    }
    if (emailKey && emailKey !== pubDocId && emailKey !== `usr_${targetUid}`) {
      proms.push(deleteDoc(doc(db, 'publicos', emailKey)).catch(() => {}));
    }
    await Promise.all(proms);

    mostrarToastRapido('Club Eliminado', `El club "${clubNombre}" fue purgado.`, true);
    renderSuperAdminDashboard();
  });
};

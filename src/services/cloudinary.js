import { KITS, setKits } from "../modules/state.js";

const CLOUDINARY_CLOUD = 'djhpfdklk';
const CLOUDINARY_PRESET = '11fut_manager';

const KITS_JSON_URL = "https://res.cloudinary.com/djhpfdklk/raw/upload/v1778985492/kits_fm6fky.json";
const BASE_URL = "https://res.cloudinary.com/djhpfdklk/image/upload";

export async function cargarKits() {
  try {
    const res = await fetch(KITS_JSON_URL + '?t=' + Date.now());
    const lista = await res.json();
    const optimizar = (url, w = 300) => {
      if (!url || !url.includes('cloudinary.com')) return url;
      return url.replace('/upload/', `/upload/w_${w},f_auto,q_auto/`);
    };
    const kitsFinal = lista.map(k => ({
      id:              k.id,
      nombre:          k.nombre,
      local:           optimizar(k.local           || BASE_URL + '/kits/' + k.id + '/local'),
      visita:          optimizar(k.visita          || BASE_URL + '/kits/' + k.id + '/visita'),
      portero_local:   optimizar(k.portero_local   || BASE_URL + '/kits/' + k.id + '/portero_local'),
      portero_visita:  optimizar(k.portero_visita  || BASE_URL + '/kits/' + k.id + '/portero_visita'),
      sup_local:       optimizar(k.sup_local       || BASE_URL + '/kits/' + k.id + '/sup_local'),
      sup_visita:      optimizar(k.sup_visita      || BASE_URL + '/kits/' + k.id + '/sup_visita'),
      ct:              optimizar(k.ct              || BASE_URL + '/kits/' + k.id + '/cuerpo_tecnico')
    }));
    setKits(kitsFinal);
    console.log('✅ Kits cargados:', KITS.map(k => k.nombre));
    return kitsFinal;
  } catch (e) {
    console.error('❌ Error cargando kits, usando predeterminado:', e);
    const fallbackKits = [{
      id: 'predeterminado', nombre: 'Kit Predeterminado',
      local:          'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985169/local_dn49kw.png',
      visita:         'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985176/visita_yz8bqb.png',
      portero_local:  'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985175/portero_local_rzumqz.png',
      portero_visita: 'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985180/portero_visita_ogzknu.png',
      sup_local:      'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985188/sup_local_imtl2l.png',
      sup_visita:     'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985184/sup_visita_wr75el.png',
      ct:             'https://res.cloudinary.com/djhpfdklk/image/upload/v1778985193/cuerpo_tecnico_ysxrjt.png'
    }];
    setKits(fallbackKits);
    return fallbackKits;
  }
}

export function resizarImagen(file, maxSize = 600) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

export async function subirImagenCloudinary(file, publicId) {
  const safeId = String(publicId || ('upload_' + Date.now())).replace(/[^a-zA-Z0-9_-]/g, '_');
  const resizedFile = await resizarImagen(file, 600);

  try {
    const form = new FormData();
    form.append('file', resizedFile);
    form.append('upload_preset', CLOUDINARY_PRESET);
    form.append('public_id', safeId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
      method: 'POST', body: form
    });

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }
  } catch (e) {
    console.warn('⚠️ Cloudinary no disponible, usando respaldo Base64 local:', e);
  }

  // Respaldo Base64 ultraconfiable para que la subida NUNCA falle
  return await fileToBase64(resizedFile);
}

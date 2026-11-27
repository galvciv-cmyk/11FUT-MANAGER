// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PERFIL,
  perfil,
  updatePerfil,
  obtenerAvatarPerfil,
  sincronizarAvataresConLogoClub
} from '../state.js';

describe('Sincronización de Logo del Club vs Foto de Perfil Personalizada', () => {
  beforeEach(() => {
    localStorage.clear();
    updatePerfil({
      ...DEFAULT_PERFIL,
      club: 'Club Inicial',
      logo: 'https://example.com/logo-viejo.png',
      profiles: [
        {
          id: 'admin',
          nombre: 'Director Deportivo',
          rol: 'ADMIN',
          pin: '1234',
          avatar: 'https://example.com/logo-viejo.png'
        },
        {
          id: 'dt_1',
          nombre: 'DT Carlos',
          rol: 'DT',
          pin: '1111',
          avatar: 'https://example.com/foto-dt-carlos.png',
          avatarPersonalizado: true,
          avatarCustom: 'https://example.com/foto-dt-carlos.png'
        }
      ]
    });
  });

  it('actualiza automáticamente el avatar de los perfiles predeterminados al cambiar el logo del club', () => {
    // Cambiamos de club y subimos nuevo logo
    updatePerfil({
      ...perfil,
      club: 'Nuevo Club FC',
      logo: 'https://example.com/logo-nuevo-club.png'
    });

    const profAdmin = perfil.profiles.find(p => p.id === 'admin');
    const profDT = perfil.profiles.find(p => p.id === 'dt_1');

    // El perfil sin foto propia debe reflejar inmediatamente el nuevo logo del club
    expect(obtenerAvatarPerfil(profAdmin)).toBe('https://example.com/logo-nuevo-club.png');
    expect(profAdmin.avatar).toBe('https://example.com/logo-nuevo-club.png');

    // El perfil con foto personalizada conserva su propia foto
    expect(obtenerAvatarPerfil(profDT)).toBe('https://example.com/foto-dt-carlos.png');
    expect(profDT.avatar).toBe('https://example.com/foto-dt-carlos.png');
  });

  it('permite volver de foto de perfil propia al logo predeterminado del club', () => {
    const profDT = perfil.profiles.find(p => p.id === 'dt_1');
    profDT.avatarPersonalizado = false;
    delete profDT.avatarCustom;

    sincronizarAvataresConLogoClub();

    expect(obtenerAvatarPerfil(profDT)).toBe('https://example.com/logo-viejo.png');
    expect(profDT.avatar).toBe('https://example.com/logo-viejo.png');
  });
});

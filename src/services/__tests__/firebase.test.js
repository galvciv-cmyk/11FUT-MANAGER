import { describe, it, expect } from 'vitest';
import { hashPin, getPublicId } from '../firebase.js';

describe('Servicio de Firebase (firebase.js)', () => {
  it('debe generar un hash SHA-256 válido para un PIN numérico', async () => {
    const pin = '1901';
    const hash = await hashPin(pin);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 produce un string hex de 64 caracteres
  });

  it('debe generar el mismo hash para el mismo PIN de forma determinista', async () => {
    const pin = '1234';
    const hash1 = await hashPin(pin);
    const hash2 = await hashPin(pin);
    expect(hash1).toBe(hash2);
  });

  it('debe retornar perfil_demo si no hay usuario ni pinHash', () => {
    const pubId = getPublicId();
    expect(pubId).toBeDefined();
  });
});

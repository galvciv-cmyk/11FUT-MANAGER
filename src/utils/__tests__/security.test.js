import { describe, it, expect } from 'vitest';
import { escapeHTML, isSafeURL, sanitizeURL } from '../security.js';

describe('Módulo de Seguridad Defensiva (security.js)', () => {
  it('debe escapar caracteres especiales HTML para prevenir XSS', () => {
    const malicious = '<script>alert("xss")</script>&foo=\'bar\'';
    const escaped = escapeHTML(malicious);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;foo=&#039;bar&#039;');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });

  it('debe manejar entradas vacías o nulas sin lanzar errores', () => {
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });

  it('debe identificar y bloquear URLs peligrosas con javascript: o data:text/html', () => {
    expect(isSafeURL('javascript:alert(1)')).toBe(false);
    expect(isSafeURL('JAVASCRIPT:alert(1)')).toBe(false);
    expect(isSafeURL('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeURL('data:text/html,<script>alert(1)</script>')).toBe(false);

    expect(isSafeURL('https://res.cloudinary.com/demo/image.png')).toBe(true);
    expect(isSafeURL('http://localhost:5173/logo.png')).toBe(true);
    expect(isSafeURL('/vendor/xlsx.full.min.js')).toBe(true);
    expect(isSafeURL('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
  });

  it('debe sanitizar URLs devolviendo cadena vacía si son inseguras', () => {
    expect(sanitizeURL('javascript:void(0)')).toBe('');
    expect(sanitizeURL('https://gyknova.com/logo.png')).toBe('https://gyknova.com/logo.png');
  });
});

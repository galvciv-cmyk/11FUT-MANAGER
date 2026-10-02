import { test, expect } from '@playwright/test';

test.describe('11FUT MANAGER - Verificaciones Iniciales', () => {
  test('La pantalla de bienvenida y login cargan correctamente', async ({ page }) => {
    await page.goto('/');

    // Comprobar título
    await expect(page).toHaveTitle(/11FUT MANAGER/i);

    // Comprobar inputs clave
    const emailInput = page.locator('#email-input');
    const pinInput = page.locator('#pin-input');
    const btnLogin = page.locator('#btn-login');

    await expect(emailInput).toBeVisible();
    await expect(pinInput).toBeVisible();
    await expect(btnLogin).toBeVisible();
  });
});

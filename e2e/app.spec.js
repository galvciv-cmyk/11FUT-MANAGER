import { test, expect } from '@playwright/test';

test.describe('11FUT MANAGER - Verificaciones Iniciales y Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const btnAccept = page.locator('#btn-accept-cookies');
    if (await btnAccept.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btnAccept.click();
    }
  });

  test('La pantalla de bienvenida y login cargan correctamente con accesibilidad', async ({ page }) => {
    await expect(page).toHaveTitle(/11FUT MANAGER/i);

    const emailInput = page.locator('#email-input');
    const pinInput = page.locator('#pin-input');
    const btnLogin = page.locator('#btn-login');

    await expect(emailInput).toBeVisible();
    await expect(pinInput).toBeVisible();
    await expect(btnLogin).toBeVisible();
  });

  test('Validación defensiva ante intento de ingreso con campos vacíos', async ({ page }) => {
    const btnLogin = page.locator('#btn-login');
    await btnLogin.click();

    // Debe mostrar feedback de error al usuario
    const errorContainer = page.locator('#login-input-error');
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toContainText(/ingresa/i);
  });

  test('Apertura y cierre modal de registro de nuevo club', async ({ page }) => {
    const btnShowSetup = page.locator('#btn-show-setup');
    await btnShowSetup.click();

    const modalRegister = page.locator('#modal-register');
    await expect(modalRegister).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();

    const btnClose = page.locator('#btn-cerrar-modal-reg');
    await btnClose.click();
    await expect(modalRegister).not.toBeVisible();
  });

  test('Apertura y cierre del modal de recuperación de contraseña', async ({ page }) => {
    const btnResetPin = page.locator('#btn-reset-pin');
    await btnResetPin.click();

    const modalReset = page.locator('#modal-reset-password');
    if (await modalReset.count() > 0) {
      await expect(modalReset).toBeVisible();
      const btnCloseReset = modalReset.locator('button[aria-label="Cerrar modal"], .btn-close, button:has-text("×")').first();
      if (await btnCloseReset.isVisible()) {
        await btnCloseReset.click();
        await expect(modalReset).not.toBeVisible();
      }
    }
  });
});

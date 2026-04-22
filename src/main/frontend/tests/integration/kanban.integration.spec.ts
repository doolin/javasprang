import { expect, test } from '@playwright/test';

// Full-stack integration test: no mocked routes.
// Runs against a real Spring Boot + PostgreSQL backend with
// seed data (synth_alice / password123).

test.describe('Kanban board (full stack)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('synth_alice');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
  });

  test('displays seed data after login', async ({ page }) => {
    // synth_alice has a TODO card: "Set up project board"
    await expect(page.getByText('Set up project board')).toBeVisible();
  });

  test('create, move, and delete a card', async ({ page }) => {
    // Create
    await page.getByPlaceholder('New task title').fill('Integration test card');
    await page.getByPlaceholder('Description (optional)').fill('Created by Playwright integration');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Integration test card')).toBeVisible();

    // Move to Done
    const card = page.locator('.kanban-card', { hasText: 'Integration test card' }).first();
    await card.locator('select').selectOption('DONE');
    await expect(
      page.locator('section', { hasText: 'Done' }).getByText('Integration test card')
    ).toBeVisible();

    // Delete
    await card.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Integration test card')).toHaveCount(0);
  });

  test('card persists across page reload', async ({ page }) => {
    // Create a card
    await page.getByPlaceholder('New task title').fill('Persistence check');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Persistence check')).toBeVisible();

    // Reload and verify it survived
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
    await expect(page.getByText('Persistence check')).toBeVisible();

    // Cleanup
    const card = page.locator('.kanban-card', { hasText: 'Persistence check' }).first();
    await card.getByRole('button', { name: 'Delete' }).click();
  });
});

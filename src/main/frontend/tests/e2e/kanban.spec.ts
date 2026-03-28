import { expect, test } from '@playwright/test';

test('login loads kanban board and supports card operations', async ({ page }) => {
  let todos = [
    {
      id: 11,
      title: 'Initial backlog card',
      description: 'Seeded TODO card',
      status: 'TODO',
      completed: false,
      user: { id: 1 }
    },
    {
      id: 12,
      title: 'Existing in progress card',
      description: 'Seeded IN_PROGRESS card',
      status: 'IN_PROGRESS',
      completed: false,
      user: { id: 1 }
    }
  ];

  await page.route('**/api/v1/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'fake-jwt',
        username: 'dave',
        email: 'dave@example.com'
      })
    });
  });

  await page.route('**/api/v1/users/username/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, username: 'dave', email: 'dave@example.com' })
    });
  });

  await page.route('**/api/v1/todos/user/1', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(todos)
    });
  });

  await page.route('**/api/v1/todos', async route => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as any;
    const created = {
      ...body,
      id: 99
    };
    todos = [...todos, created];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(created)
    });
  });

  await page.route('**/api/v1/todos/*', async route => {
    const method = route.request().method();
    const url = route.request().url();
    const id = Number(url.split('/').pop());

    if (method === 'PUT') {
      const body = route.request().postDataJSON() as any;
      todos = todos.map(item => (item.id === id ? body : item));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body)
      });
      return;
    }

    if (method === 'DELETE') {
      todos = todos.filter(item => item.id !== id);
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fallback();
  });

  await page.goto('/login');

  await page.getByLabel('Username').fill('dave');
  await page.getByLabel('Password').fill('foobar');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();

  await page.getByPlaceholder('New task title').fill('Playwright created card');
  await page.getByPlaceholder('Description (optional)').fill('Created in e2e test');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText('Playwright created card')).toBeVisible();

  const card = page.locator('.kanban-card', { hasText: 'Playwright created card' }).first();
  await card.locator('select').selectOption('DONE');

  await expect(page.locator('section', { hasText: 'Done' }).getByText('Playwright created card')).toBeVisible();

  await card.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Playwright created card')).toHaveCount(0);
});

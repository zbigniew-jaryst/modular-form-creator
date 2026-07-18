import { expect, type Page } from '@playwright/test'

export async function fillBasicInfo(
  page: Page,
  values: {
    owner: string
    email: string
    description: string
    priority: 'low' | 'medium' | 'high'
  },
): Promise<void> {
  await page.getByLabel('Owner').fill(values.owner)
  await page.getByLabel('Email').fill(values.email)
  await page.getByLabel('Description').fill(values.description)
  await page.getByLabel('Priority').selectOption(values.priority)
}

export async function fillProjectDetails(
  page: Page,
  values: {
    projectName: string
    budget: string
    category: 'internal' | 'external' | 'vendor'
    teamMembers: string[]
  },
): Promise<void> {
  await page.getByLabel('Project name').fill(values.projectName)
  await page.getByLabel('Budget').fill(values.budget)
  await page.getByLabel('Category').selectOption(values.category)
  for (const member of values.teamMembers) {
    // Native input is visually hidden; toggle via associated label text.
    await page.locator('label').filter({ hasText: new RegExp(`^${member}$`) }).click()
    await expect(page.getByRole('checkbox', { name: member })).toBeChecked()
  }
}

export async function expectProgress(page: Page, completed: number, total = 2): Promise<void> {
  // List uses "Modules x/y"; overview header uses "x of y modules completed".
  await expect(
    page
      .getByText(
        new RegExp(`(?:Modules ${completed}/${total}|${completed} of ${total} modules completed)`),
      )
      .first(),
  ).toBeVisible()
}

export async function expectStatus(page: Page, status: 'Draft' | 'Completed'): Promise<void> {
  // Status badges are spans; avoid matching the filter <option> labels.
  await expect(page.locator('span').filter({ hasText: new RegExp(`^${status}$`) }).first()).toBeVisible()
}

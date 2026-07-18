import { expect, test } from '@playwright/test'
import { getResource, seedCompletedResource, uniqueResourceName } from './support/api'
import { cleanupTrackedResources, trackResourceId, trackResourceName } from './support/cleanup'
import { installMutationCounter } from './support/network'

test.afterEach(async () => {
  await cleanupTrackedResources()
})

test('completed buffer is lost on reload without backend mutation', async ({ page }) => {
  const resourceName = uniqueResourceName('Buffer Loss')
  trackResourceName(resourceName)

  const seeded = await seedCompletedResource(resourceName)
  trackResourceId(seeded.resourceId)

  const originalOwner = seeded.basicInfo.owner
  const counter = installMutationCounter(page)

  page.on('dialog', (dialog) => {
    void dialog.accept()
  })

  await page.goto(`/resources/${seeded.resourceId}/basic-info`)
  await expect(page.getByRole('button', { name: 'Apply changes locally' })).toBeVisible()

  await page.getByLabel('Owner').fill('Transient Owner')
  await page.getByRole('button', { name: 'Apply changes locally' }).click()

  await expect(page).toHaveURL(new RegExp(`/resources/${seeded.resourceId}/details$`))
  await expect(page.getByText('Unsaved changes').first()).toBeVisible()
  await expect(page.getByText('Transient Owner')).toBeVisible()
  expect(counter.count('PATCH', `/api/resources/${seeded.resourceId}/basic-info`)).toBe(0)
  expect(counter.count('PUT', `/api/resources/${seeded.resourceId}`)).toBe(0)

  await page.reload()

  await expect(page).toHaveURL(new RegExp(`/resources/${seeded.resourceId}/details$`))
  await expect(page.getByText('Unsaved changes')).toHaveCount(0)
  await expect(page.getByText('Transient Owner')).toHaveCount(0)
  await expect(page.getByText(originalOwner)).toBeVisible()

  const fromApi = await getResource(seeded.resourceId)
  expect(fromApi.basicInfo.owner).toBe(originalOwner)
  expect(fromApi.status).toBe('completed')

  counter.dispose()
})

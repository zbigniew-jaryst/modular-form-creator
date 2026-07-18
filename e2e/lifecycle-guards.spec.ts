import { expect, test } from '@playwright/test'
import { createResource, uniqueResourceName } from './support/api'
import { cleanupTrackedResources, trackResourceId, trackResourceName } from './support/cleanup'

test.afterEach(async () => {
  await cleanupTrackedResources()
})

test('incomplete draft cannot be provisioned and locks Project Details deep link', async ({
  page,
}) => {
  const resourceName = uniqueResourceName('Guard Draft')
  trackResourceName(resourceName)

  const created = await createResource(resourceName)
  trackResourceId(created.resourceId)

  await page.goto(`/resources/${created.resourceId}`)

  await expect(page.getByText('Basic Info must be completed first.')).toBeVisible()
  const provisionButton = page.getByRole('button', { name: 'Provision resource' })
  if ((await provisionButton.count()) > 0) {
    await expect(provisionButton).toBeDisabled()
  }

  await page.goto(`/resources/${created.resourceId}/project-details`)
  await expect(page.getByRole('heading', { name: 'Project Details is locked' })).toBeVisible()
  await expect(
    page.getByText('Complete Basic Info before you can edit Project Details.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save Project Details' })).toHaveCount(0)
})

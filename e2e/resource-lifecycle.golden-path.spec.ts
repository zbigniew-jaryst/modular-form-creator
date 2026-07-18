import { expect, test } from '@playwright/test'
import { cleanupTrackedResources, trackResourceId, trackResourceName } from './support/cleanup'
import {
  expectProgress,
  expectStatus,
  fillBasicInfo,
  fillProjectDetails,
} from './support/forms'
import { installMutationCounter } from './support/network'
import { uniqueResourceName } from './support/api'

test.afterEach(async () => {
  await cleanupTrackedResources()
})

test('resource lifecycle golden path', async ({ page }) => {
  const resourceName = uniqueResourceName('Golden Path')
  trackResourceName(resourceName)

  let resourceId: number | undefined
  let counter = installMutationCounter(page)

  await test.step('create and draft workflow', async () => {
    await page.goto('/resources')

    const createResponsePromise = page.waitForResponse((response) => {
      if (response.request().method() !== 'POST' || response.status() !== 201) {
        return false
      }
      try {
        return new URL(response.url()).pathname === '/api/resources'
      } catch {
        return false
      }
    })

    await page.getByRole('button', { name: 'Create resource' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Create resource' })
    await dialog.getByLabel('Resource name').fill(resourceName)
    await dialog.getByRole('button', { name: 'Create resource' }).click()

    const createResponse = await createResponsePromise
    const created = (await createResponse.json()) as { resourceId: number; name: string }
    resourceId = created.resourceId
    trackResourceId(resourceId)

    await expect(page.getByText(`Created resource “${resourceName}”.`)).toBeVisible()
    const listItem = page.getByRole('listitem').filter({
      has: page.getByRole('heading', { name: resourceName }),
    })
    await expect(listItem.getByRole('heading', { name: resourceName })).toBeVisible()
    await expect(listItem.getByText('Modules 0/2')).toBeVisible()
    await expect(listItem.getByText('Draft', { exact: true })).toBeVisible()

    counter.dispose()
    counter = installMutationCounter(page)

    await page.goto(`/resources/${resourceId}`)
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}$`))
    await expectProgress(page, 0)

    await page.getByRole('link', { name: 'Complete module' }).first().click()
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/basic-info$`))

    await fillBasicInfo(page, {
      owner: 'Golden Owner',
      email: 'golden@example.com',
      description: 'Golden path basic info',
      priority: 'high',
    })
    const basicInfoPatch = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes(`/api/resources/${resourceId}/basic-info`) &&
        response.ok(),
    )
    await page.getByRole('button', { name: 'Save Basic Info' }).click()
    await basicInfoPatch

    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}$`))
    await expectProgress(page, 1)

    await page.getByRole('link', { name: 'Complete module' }).click()
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/project-details$`))

    await fillProjectDetails(page, {
      projectName: 'Golden Project',
      budget: '2500',
      category: 'external',
      teamMembers: ['FE devs', 'Product Owner'],
    })
    const projectPatch = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes(`/api/resources/${resourceId}/project-details`) &&
        response.ok(),
    )
    await page.getByRole('button', { name: 'Save Project Details' }).click()
    await projectPatch

    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}$`))
    await expectProgress(page, 2)

    await page.getByRole('link', { name: 'View details' }).click()
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/details$`))
    await expect(page.getByText('Golden Owner')).toBeVisible()
    await expect(page.getByText('golden@example.com')).toBeVisible()
    await expect(page.getByText('Golden Project')).toBeVisible()
    await expect(page.getByText('2500')).toBeVisible()
    await expect(page.getByText('Basic Info: Complete')).toBeVisible()
    await expect(page.getByText('Project Details: Complete')).toBeVisible()

    await page.goto(`/resources/${resourceId}`)
    await expectProgress(page, 2)
  })

  await test.step('provisioning', async () => {
    counter.reset()

    await page.getByRole('button', { name: 'Provision resource' }).click()
    await expect(page.getByRole('dialog', { name: 'Provision resource' })).toBeVisible()
    expect(counter.count('PATCH', `/api/resources/${resourceId}/provisioning`)).toBe(0)

    const provisionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes(`/api/resources/${resourceId}/provisioning`) &&
        response.ok(),
    )
    await page.getByRole('button', { name: 'Provision', exact: true }).click()
    await provisionResponse

    await expect(page.getByRole('dialog', { name: 'Provision resource' })).toBeHidden()
    await expectStatus(page, 'Completed')
    await expect(page.getByRole('button', { name: 'Provision resource' })).toHaveCount(0)
    expect(counter.count('PATCH', `/api/resources/${resourceId}/provisioning`)).toBe(1)
  })

  await test.step('local completed edits', async () => {
    counter.reset()

    await page.getByRole('link', { name: 'Edit module' }).first().click()
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/basic-info$`))
    await expect(page.getByRole('button', { name: 'Apply changes locally' })).toBeVisible()

    await page.getByLabel('Owner').fill('Buffered Owner')
    await page.getByRole('button', { name: 'Apply changes locally' }).click()

    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/details$`))
    await expect(page.getByText('Unsaved changes').first()).toBeVisible()
    await expect(page.getByText('Buffered Owner')).toBeVisible()
    expect(counter.count('PATCH', `/api/resources/${resourceId}/basic-info`)).toBe(0)
    expect(counter.count('PUT', `/api/resources/${resourceId}`)).toBe(0)

    await page.getByRole('link', { name: 'Edit Project Details' }).click()
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/project-details$`))

    await page.getByLabel('Project name').fill('Buffered Project')
    await page.getByRole('button', { name: 'Apply changes locally' }).click()

    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/details$`))
    await expect(page.getByText('Buffered Project')).toBeVisible()
    await expect(page.getByText('Basic Info pending')).toBeVisible()
    await expect(page.getByText('Project Details pending')).toBeVisible()
    expect(counter.count('PATCH', new RegExp(`/api/resources/${resourceId}/`))).toBe(0)
    expect(counter.count('PUT', `/api/resources/${resourceId}`)).toBe(0)
  })

  await test.step('explicit PUT submission', async () => {
    counter.reset()

    await page.getByRole('button', { name: 'Submit all changes' }).click()
    await expect(page.getByRole('dialog', { name: 'Submit all changes' })).toBeVisible()
    expect(counter.count('PUT', `/api/resources/${resourceId}`)).toBe(0)

    const putResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        new URL(response.url()).pathname === `/api/resources/${resourceId}` &&
        response.ok(),
    )
    await page.getByRole('button', { name: 'Submit changes' }).click()
    await putResponse

    await expect(page.getByRole('dialog', { name: 'Submit all changes' })).toBeHidden()
    await expect(page.getByText('Unsaved changes')).toHaveCount(0)
    expect(counter.count('PUT', `/api/resources/${resourceId}`)).toBe(1)
  })

  await test.step('persistence after reload', async () => {
    await page.reload()
    await expect(page).toHaveURL(new RegExp(`/resources/${resourceId}/details$`))
    await expectStatus(page, 'Completed')
    await expect(page.getByText('Buffered Owner')).toBeVisible()
    await expect(page.getByText('Buffered Project')).toBeVisible()
    await expect(page.getByText('Unsaved changes')).toHaveCount(0)
  })

  counter.dispose()
})

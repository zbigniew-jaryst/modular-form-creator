import { describe, expect, it } from 'vitest'
import {
  createCompleteBasicInfo,
  createCompleteProjectDetails,
  createResource,
} from '../test/support/resourceFixtures'
import { getProvisioningEligibility } from './resourceProvisioning'

describe('getProvisioningEligibility', () => {
  it('rejects a draft with incomplete Basic Info', () => {
    const resource = createResource()

    expect(getProvisioningEligibility(resource)).toEqual({
      allowed: false,
      reason: 'basic-info-incomplete',
    })
  })

  it('rejects a draft with complete Basic Info and incomplete Project Details', () => {
    const resource = createResource({
      basicInfo: createCompleteBasicInfo(),
    })

    expect(getProvisioningEligibility(resource)).toEqual({
      allowed: false,
      reason: 'project-details-incomplete',
    })
  })

  it('allows a draft with both modules complete', () => {
    const resource = createResource({
      basicInfo: createCompleteBasicInfo(),
      projectDetails: createCompleteProjectDetails(),
    })

    expect(getProvisioningEligibility(resource)).toEqual({ allowed: true })
  })

  it('rejects a completed resource even when both modules are complete', () => {
    const resource = createResource({
      status: 'completed',
      basicInfo: createCompleteBasicInfo(),
      projectDetails: createCompleteProjectDetails(),
    })

    expect(getProvisioningEligibility(resource)).toEqual({
      allowed: false,
      reason: 'already-completed',
    })
  })

  it('checks status before module completeness', () => {
    const resource = createResource({
      status: 'completed',
      basicInfo: {
        resourceName: 'Alpha Resource',
        owner: '',
        email: '',
        description: '',
        priority: '',
      },
      projectDetails: {
        projectName: '',
        budget: '',
        category: '',
        options: [],
      },
    })

    expect(getProvisioningEligibility(resource)).toEqual({
      allowed: false,
      reason: 'already-completed',
    })
  })

  it('uses module-completion rules rather than status alone for drafts', () => {
    const incompleteDraft = createResource({ status: 'draft' })
    const completeDraft = createResource({
      status: 'draft',
      basicInfo: createCompleteBasicInfo(),
      projectDetails: createCompleteProjectDetails(),
    })

    expect(getProvisioningEligibility(incompleteDraft).allowed).toBe(false)
    expect(getProvisioningEligibility(completeDraft).allowed).toBe(true)
  })
})

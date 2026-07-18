import type { Resource } from './resource.types'
import {
  isBasicInfoComplete,
  isProjectDetailsComplete,
} from './resourceProgress'

export type ProvisioningEligibility =
  | { allowed: true }
  | {
      allowed: false
      reason:
        | 'already-completed'
        | 'basic-info-incomplete'
        | 'project-details-incomplete'
    }

/** Frontend UX guard only — backend remains authoritative for provisioning. */
export function getProvisioningEligibility(
  resource: Resource,
): ProvisioningEligibility {
  if (resource.status === 'completed') {
    return { allowed: false, reason: 'already-completed' }
  }

  if (!isBasicInfoComplete(resource.basicInfo)) {
    return { allowed: false, reason: 'basic-info-incomplete' }
  }

  if (!isProjectDetailsComplete(resource.projectDetails)) {
    return { allowed: false, reason: 'project-details-incomplete' }
  }

  return { allowed: true }
}

export function getProvisioningBlockedMessage(
  reason: Exclude<ProvisioningEligibility, { allowed: true }>['reason'],
): string {
  switch (reason) {
    case 'already-completed':
      return 'This resource is already completed.'
    case 'basic-info-incomplete':
      return 'Basic Info must be completed first.'
    case 'project-details-incomplete':
      return 'Project Details must be completed first.'
  }
}

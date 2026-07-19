import type { Resource } from './resource.types'
import {
  isBasicInfoComplete,
  isProjectDetailsComplete,
} from './resourceProgress'

export type ProvisioningBlockedReason =
  | 'already-completed'
  | 'basic-info-incomplete'
  | 'project-details-incomplete'

export type ProvisioningEligibility =
  | { allowed: true }
  | {
      allowed: false
      reason: ProvisioningBlockedReason
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

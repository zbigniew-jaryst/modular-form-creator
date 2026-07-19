import type { ProvisioningBlockedReason } from '../../domain/resourceProvisioning'

const provisioningMessages = {
  'already-completed': 'This resource is already completed.',
  'basic-info-incomplete': 'Basic Info must be completed first.',
  'project-details-incomplete': 'Project Details must be completed first.',
} satisfies Record<ProvisioningBlockedReason, string>

export function getProvisioningBlockedMessage(
  reason: ProvisioningBlockedReason,
): string {
  return provisioningMessages[reason]
}

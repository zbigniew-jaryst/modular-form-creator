import { Badge } from '../../../design-system'
import type { ResourceStatus } from '../domain/resource.types'

type ResourceStatusBadgeProps = {
  status: ResourceStatus
}

export function ResourceStatusBadge({ status }: ResourceStatusBadgeProps) {
  const variant = status === 'completed' ? 'success' : 'info'
  const label = status === 'completed' ? 'Completed' : 'Draft'

  return <Badge variant={variant}>{label}</Badge>
}

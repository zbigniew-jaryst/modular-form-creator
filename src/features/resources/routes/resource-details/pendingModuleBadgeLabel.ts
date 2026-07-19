import type { ResourceModuleKey } from '../../domain/resource.types'
import { getResourceModuleLabel } from '../shared/resourceNotices'

export function getPendingModuleBadgeLabel(module: ResourceModuleKey): string {
  return `${getResourceModuleLabel(module)} pending`
}

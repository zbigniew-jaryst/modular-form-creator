import type { ResourceModuleKey } from '../../domain/resource.types'

export type ModuleSaveNotice = {
  module: ResourceModuleKey
}

export type LocalApplyNotice = {
  module: ResourceModuleKey
}

type ModuleSaveLocationState = {
  moduleSave?: ModuleSaveNotice
}

type LocalApplyLocationState = {
  localApply?: LocalApplyNotice
}

export function createModuleSaveNotice(
  module: ResourceModuleKey,
): ModuleSaveLocationState {
  return { moduleSave: { module } }
}

export function createLocalApplyNotice(
  module: ResourceModuleKey,
): LocalApplyLocationState {
  return { localApply: { module } }
}

export function readModuleSaveNotice(
  locationState: unknown,
): ModuleSaveNotice | undefined {
  if (!locationState || typeof locationState !== 'object') {
    return undefined
  }

  const moduleSave = (locationState as ModuleSaveLocationState).moduleSave
  if (!moduleSave || typeof moduleSave !== 'object') {
    return undefined
  }

  if (moduleSave.module !== 'basic-info' && moduleSave.module !== 'project-details') {
    return undefined
  }

  return moduleSave
}

export function readLocalApplyNotice(
  locationState: unknown,
): LocalApplyNotice | undefined {
  if (!locationState || typeof locationState !== 'object') {
    return undefined
  }

  const localApply = (locationState as LocalApplyLocationState).localApply
  if (!localApply || typeof localApply !== 'object') {
    return undefined
  }

  if (localApply.module !== 'basic-info' && localApply.module !== 'project-details') {
    return undefined
  }

  return localApply
}

export function getResourceModuleLabel(module: ResourceModuleKey): string {
  if (module === 'basic-info') {
    return 'Basic Info'
  }

  return 'Project Details'
}

export function formatChangedModuleLabels(
  modules: readonly ResourceModuleKey[],
): string {
  return modules.map(getResourceModuleLabel).join(', ')
}

export function getModuleSaveSuccessMessage(module: ResourceModuleKey): string {
  if (module === 'basic-info') {
    return 'Basic Info saved successfully.'
  }

  return 'Project Details saved successfully.'
}

export function getLocalApplySuccessMessage(module: ResourceModuleKey): string {
  if (module === 'basic-info') {
    return 'Basic Info changes applied locally. Review and submit them from this page when ready.'
  }

  return 'Project Details changes applied locally. Review and submit them from this page when ready.'
}

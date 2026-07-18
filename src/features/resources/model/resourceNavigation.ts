export type ModuleSaveNotice = {
  module: 'basic-info' | 'project-details'
}

export type LocalApplyNotice = {
  module: 'basic-info' | 'project-details'
}

export type ResourceModuleKey = ModuleSaveNotice['module']

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

export function getPendingModuleBadgeLabel(module: ResourceModuleKey): string {
  return `${getResourceModuleLabel(module)} pending`
}

export function getModuleSaveSuccessMessage(module: ModuleSaveNotice['module']): string {
  if (module === 'basic-info') {
    return 'Basic Info saved successfully.'
  }

  return 'Project Details saved successfully.'
}

export function getLocalApplySuccessMessage(module: LocalApplyNotice['module']): string {
  if (module === 'basic-info') {
    return 'Basic Info changes applied locally. Review and submit them from this page when ready.'
  }

  return 'Project Details changes applied locally. Review and submit them from this page when ready.'
}

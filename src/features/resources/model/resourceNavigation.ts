export type ModuleSaveNotice = {
  module: 'basic-info' | 'project-details'
}

export function getModuleSaveSuccessMessage(module: ModuleSaveNotice['module']): string {
  if (module === 'basic-info') {
    return 'Basic Info saved successfully.'
  }

  return 'Project Details saved successfully.'
}

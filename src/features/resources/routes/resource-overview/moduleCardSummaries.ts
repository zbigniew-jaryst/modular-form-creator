export function formatBasicInfoModuleSummary(basicInfo: {
  owner: string
  email: string
  priority: string
}): string {
  const { owner, email, priority } = basicInfo
  if (!owner && !email && !priority) {
    return 'No Basic Info saved yet.'
  }

  const parts = [
    owner ? `Owner: ${owner}` : null,
    email ? `Email: ${email}` : null,
    priority ? `Priority: ${priority}` : null,
  ].filter(Boolean)

  return parts.join(' · ')
}

export function formatProjectDetailsModuleSummary(projectDetails: {
  projectName: string
  budget: string
  category: string
  options: string[]
}): string {
  const { projectName, budget, category, options } = projectDetails
  if (!projectName && !budget && !category && options.length === 0) {
    return 'No Project Details saved yet.'
  }

  const parts = [
    projectName ? `Project: ${projectName}` : null,
    budget ? `Budget: ${budget}` : null,
    category ? `Category: ${category}` : null,
    options.length > 0 ? `Team: ${options.join(', ')}` : null,
  ].filter(Boolean)

  return parts.join(' · ')
}
